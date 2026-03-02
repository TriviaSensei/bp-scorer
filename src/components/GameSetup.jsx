import { useContext, useRef } from 'react';

import Button from 'react-bootstrap/Button';
import moment from 'moment-timezone';
import readXlsxFile from 'read-excel-file';
//use write-excel-file for writing output later

import '../css/GameSetup.css';

import { GameDataContext } from '../contexts/GameDataContext';
import LabeledInput from './LabeledInput';
import { MessageContext } from '../contexts/MessageContext';
import rounds from '../assets/rounds';

export default function GameSetup() {
	const { gameData, setGameData, setGameDataField } =
		useContext(GameDataContext);
	const { showMessage } = useContext(MessageContext);
	const gameFileRef = useRef();
	const tz = moment.tz.guess();
	const today = moment.tz(new Date(), tz).format().split('T')[0];

	const handleGameFile = async (e) => {
		if (e.target.files.length === 0) return;
		const output = await readXlsxFile(e.target.files[0]);

		const errors = [];

		const toReturn = {
			announcements: [],
			rounds: [...rounds],
			postAnnouncements: [],
		};

		let currentRound = -1;

		output.forEach((row, i) => {
			//get rid of the leading blank cells
			while (row.length > 0 && row[0] === null) row.shift();
			if (row.length === 0) return;

			const firstCell = row[0].toString().toLowerCase();

			//push the announcements first before we get into the rounds

			//see if this row is introducing a regular round
			const m = firstCell.match(/round [1-5]/g);
			if (m) {
				const roundNo = Number(m[0].split(' ')[1]);
				currentRound = rounds.findIndex(
					(rd) => rd.title === `Round ${roundNo}`,
				);
				if (currentRound >= 0) rounds[currentRound].questions = [];
			}
			//introducing the audio round?
			else if (
				firstCell.indexOf('audio') >= 0 &&
				row.some(
					(cell) => cell?.toString().toLowerCase().indexOf('title') >= 0,
				) &&
				row.some(
					(cell) => cell?.toString().toLowerCase().indexOf('artist') >= 0,
				)
			) {
				currentRound = rounds.findIndex((rd) => rd.title === 'Audio');
				rounds[currentRound].questions = [];
			}
			//introducing the 3-part question?
			else if (
				firstCell.indexOf('three') >= 0 &&
				firstCell.indexOf('part') >= 0
			) {
				const roundNo = rounds.findIndex((rd) => rd.type === '3PQ');
				if (roundNo >= 0) {
					toReturn.rounds[roundNo].text = row[1];
					toReturn.rounds[roundNo].answer = row[2].split('\n');
				}
			}
			//introducing the final?
			else if (firstCell.indexOf('final') >= 0) {
				const roundNo = rounds.findIndex((rd) => rd.type === 'final');
				toReturn.rounds[roundNo].category = row[1];
				toReturn.rounds[roundNo].text = row[2];
				toReturn.rounds[roundNo].answer = row[3];
			}
			//introducing the tiebreaker?
			else if (firstCell.indexOf('tiebreaker') >= 0) {
				const roundNo = rounds.findIndex((rd) => rd.type === 'tiebreaker');
				toReturn.rounds[roundNo].text = row[2];
				toReturn.rounds[roundNo].answer = row[3];
				currentRound = 'tiebreaker';
			} else if (currentRound === -1) {
				if (firstCell.indexOf('announcements') >= 0 && row[1])
					toReturn.announcements.push(row[1]);
				else toReturn.announcements.push(row[0]);
			}
			//post announcements?
			else if (firstCell.indexOf('announcements') >= 0 && row[1]) {
				currentRound = -2;
				toReturn.postAnnouncements.push(row[1]);
			} else if (currentRound === -2) {
				toReturn.postAnnouncements.push(row[0]);
			}
			//regular question or audio round
			else if ((typeof row[0]).toLowerCase() === 'number') {
				const cr = toReturn.rounds[currentRound];
				if (cr.type === 'audio') {
					if (row.length < 3 || !row[0] || !row[1] || !row[2])
						return errors.push({
							row: i + 1,
							message: `Invalid song - title, artist, or number missing`,
						});
					if (!cr.questions) cr.questions = [];
					cr.questions.push({
						title: row[1],
						artist: row[2],
					});
				} else {
					if (row.length < 4 || !row[0] || !row[1] || !row[2] || !row[3])
						return errors.push({
							row: i + 1,
							message: `Invalid question - number, category, text, or answer missing`,
						});
					if (
						isNaN(currentRound) ||
						currentRound < 0 ||
						currentRound > toReturn.rounds.length - 1
					) {
						return errors.push({
							row: i + 1,
							message: `Invalid question - not within a round`,
						});
					}
					if (cr.type !== 'wager')
						return errors.push({
							row: i + 1,
							message: `Invalid question - not within wager round`,
						});
					if (!cr.questions) {
						cr.questions = [];
					}
					cr.questions.push({
						number: row[0],
						category: row[1],
						text: row[2],
						answer: row[3],
						bonus: row[4],
						bonusAnswer: row[5],
					});
				}
			} else if (
				firstCell.indexOf('theme') >= 0 &&
				toReturn.rounds[currentRound]?.type === 'audio'
			) {
				toReturn.rounds[currentRound].theme = row[1];
			}
		});

		//verify each round has the expected number of questions
		toReturn.rounds.forEach((rd) => {
			if (rd.type === 'wager') {
				if (rd.questions.length !== rd.wagers.length)
					errors.push({
						message: `${rd.title} has ${rd.questions.length} questions (expecting ${rd.wagers.length})`,
					});
			}
		});

		if (errors.length === 0)
			setGameData((prev) => {
				return {
					...prev,
					dataFile: {
						fileName: e.target.files[0].name,
						data: toReturn,
					},
				};
			});
		else {
			setGameData((prev) => {
				return {
					...prev,
					dataFile: null,
					errors,
				};
			});
			gameFileRef.current.value = null;
		}
	};

	const handleAnswerFile = (e) => {
		const file = e.target?.files[0];
		if (!file) return showMessage('error', 'No handout answer file selected');
		if (file.type.toLowerCase().indexOf('pdf') >= 0) {
			setGameData((prev) => {
				return {
					...prev,
					answerFile: {
						fileName: file.name,
						fileData: file,
						data: URL.createObjectURL(file),
					},
				};
			});
			e.target.value = null;
		} else return showMessage('error', 'PDF file required for handout answers');
	};

	const handleAudioFile = (e) => {
		const file = e.target?.files[0];
		if (!file) return showMessage('error', 'No audio round file selected');
		if (file.type.toLowerCase().indexOf('audio') >= 0) {
			setGameData((prev) => {
				return {
					...prev,
					audioFile: {
						fileName: file.name,
						fileData: file,
						data: URL.createObjectURL(file),
					},
				};
			});
			e.target.value = null;
		} else return showMessage('error', 'MP3 file required for handout answers');
	};

	return (
		<div id="game-setup-area" className="no-select">
			<form id="game-setup-form">
				<LabeledInput
					name={'host-name'}
					label={'Host name'}
					onChange={setGameDataField('host')}
					ls
				/>
				<LabeledInput
					name={'venue-name'}
					label={'Venue name'}
					onChange={setGameDataField('venue')}
					ls
				/>
				<LabeledInput
					name={'venue-location'}
					label={'Venue location'}
					onChange={setGameDataField('location')}
					ls
				/>
				<LabeledInput
					name={'game-date'}
					label={'Date'}
					type="date"
					defaultValue={today}
					onChange={setGameDataField('date')}
				/>
				<input
					type="file"
					id="game-file"
					accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
					onChange={handleGameFile}
					ref={gameFileRef}
				></input>
				<label
					htmlFor="game-file"
					className="btn btn-primary"
				>{`${gameData?.dataFile?.fileName ? gameData.dataFile.fileName + '✅' : 'Upload question file (XLSX) ❌'}`}</label>
				<input
					type="file"
					id="handout-file"
					accept=".pdf"
					onChange={handleAnswerFile}
				></input>
				<label
					htmlFor="handout-file"
					className="btn btn-primary"
				>{`${gameData?.answerFile?.fileName ? gameData.answerFile.fileName + '✅' : 'Upload handout answers (PDF) ❌'}`}</label>
				<input
					type="file"
					id="audio-file"
					accept="audio/mp3"
					onChange={handleAudioFile}
				></input>
				<label htmlFor="audio-file" className="btn btn-primary">
					{`${gameData?.audioFile?.fileName ? gameData.audioFile.fileName + '✅' : 'Upload audio round (MP3) ❌'}`}
				</label>
			</form>
		</div>
	);
}
