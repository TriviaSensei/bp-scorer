import { useContext, useRef } from 'react';

import Button from 'react-bootstrap/Button';
import moment from 'moment-timezone';
import readXlsxFile from 'read-excel-file';
//use write-excel-file for writing output later

import '../css/GameSetup.css';

import { GameDataContext } from '../contexts/GameDataContext';
import LabeledInput from './LabeledInput';
import { MessageContext } from '../contexts/MessageContext';

export default function GameSetup() {
	const { gameData, setGameData } = useContext(GameDataContext);
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
			rounds: [],
			postAnnouncements: [],
		};

		let currentRound = 0;

		output.forEach((row, i) => {
			//get rid of the leading blank cells
			while (row.length > 0 && row[0] === null) row.shift();
			if (row.length === 0) return;

			const firstCell = row[0].toString().toLowerCase();

			//push the announcements first before we get into the rounds

			//see if this row is introducing a regular round
			const m = firstCell.match(/round [1-5]/g);
			if (m) {
				//if it is, see if it's also introducing an intermediate round in the next cell, which we should push first
				['Picture', 'Handout'].some((rd) => {
					if (row[1]?.toString().toLowerCase().indexOf(rd.toLowerCase()) >= 0) {
						toReturn.rounds.push({
							round: `${rd}`,
						});
						return true;
					}
				});
				const rNo = Number(m[0].split(' ')[1]);
				currentRound = rNo;
				if (!currentRound) {
					errors.push({
						row: i + 1,
						message: 'Invalid round indicated in cell 1',
					});
					return;
				}
				toReturn.rounds.push({
					round: rNo,
					questions: [],
				});
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
				toReturn.rounds.push({
					round: 'Audio',
					questions: [],
				});
				currentRound = 'audio';
			}
			//introducing the 3-part question?
			else if (
				firstCell.indexOf('three') >= 0 &&
				firstCell.indexOf('part') >= 0
			) {
				toReturn.rounds.push({
					round: '3-Part Q',
					question: row[1],
					answers: row[2].split('\n'),
				});
			}
			//introducing the final?
			else if (firstCell.indexOf('final') >= 0) {
				toReturn.rounds.push({
					round: 'Final',
					category: row[1],
					question: row[2],
					answer: row[3],
				});
				currentRound = 'final';
			}
			//introducing the tiebreaker?
			else if (firstCell.indexOf('tiebreaker') >= 0) {
				toReturn.rounds.push({
					round: 'Tiebreaker',
					question: row[2],
					answer: row[3],
				});
				currentRound = 'tiebreaker';
			} else if (currentRound === 0) {
				if (firstCell.indexOf('announcements') >= 0 && row[1])
					toReturn.announcements.push(row[1]);
				else toReturn.announcements.push(row[0]);
			}
			//post announcements?
			else if (firstCell.indexOf('announcements') >= 0 && row[1]) {
				currentRound = -1;
				toReturn.postAnnouncements.push(row[1]);
			} else if (currentRound === -1) {
				toReturn.postAnnouncements.push(row[0]);
			}
			//regular question
			else if ((typeof row[0]).toLowerCase() === 'number') {
				if (currentRound === 'audio') {
					if (row.length < 3 || !row[0] || !row[1] || !row[2])
						return errors.push({
							row: i + 1,
							message: `Invalid song - title, artist, or number missing`,
						});
					toReturn.rounds[toReturn.rounds.length - 1].questions.push({
						number: row[0],
						title: row[1],
						artist: row[2],
					});
				} else {
					if (row.length < 4 || !row[0] || !row[1] || !row[2] || !row[3])
						return errors.push({
							row: i + 1,
							message: `Invalid question - number, category, text, or answer missing`,
						});
					toReturn.rounds[toReturn.rounds.length - 1].questions.push({
						number: row[0],
						category: row[1],
						text: row[2],
						answer: row[3],
						bonusText: row[4],
						bonusAnswer: row[5],
					});
				}
			}
		});

		//verify each round has 4 questions and the music round has 6 songs listed
		toReturn.rounds.forEach((rd) => {
			if ((typeof rd.round).toLowerCase() === 'number') {
				if (rd.questions.length !== 4)
					errors.push({
						message: `Round ${rd.round} has only ${rd.questions.length} questions (expecting 4)`,
					});
			} else if (rd.round.toLowerCase() === 'audio')
				if (rd.questions.length !== 6)
					errors.push({
						message: `Audio round has only ${rd.questions.length} questions (expecting 6)`,
					});
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
						data: file,
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
						data: file,
					},
				};
			});
			e.target.value = null;
		} else return showMessage('error', 'MP3 file required for handout answers');
	};

	const setGameDataField = (field) => {
		return (e) => {
			setGameData((prev) => {
				const newData = {
					...prev,
				};
				console.log(e.target.value);
				newData[field] = e.target.value;
				return newData;
			});
		};
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
