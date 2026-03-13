import { useContext, useState, useEffect, useCallback, useMemo } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import writeXlsxFile from 'write-excel-file/browser';

import { GameDataContext } from '../contexts/GameDataContext';
import { GameScoreContext } from '../contexts/GameScoreContext';
import { MessageContext } from '../contexts/MessageContext';
import { SelectionContext } from '../contexts/SelectionContext';
import { AnnouncementsContext } from '../contexts/AnnouncementsContext';
import { HandoutContext } from '../contexts/HandoutContext';
import { TimerContext } from '../contexts/TimerContext';
import { ScoreModalContext } from '../contexts/ScoreModalContext';
import { HideAnswersContext } from '../contexts/HideAnswersContext';
import AnnouncementsModal from './AnnouncementsModal';
import HandoutModal from './HandoutModal';
import ScoreModal from './ScoreModal';
import TeamInfoModal from './TeamInfoModal';
import moment from 'moment-timezone';
import '../css/Scoresheet.css';
import MenuBar from './Scoresheet/MenuBar';
import TeamForm from './Scoresheet/TeamForm';
import ScoreTable from './Scoresheet/ScoreTable';
import InfoPanel from './Scoresheet/InfoPanel';
import DeleteTeamModal from './DeleteTeamModal';

export default function Scoresheet() {
	const { gameData, setGameData } = useContext(GameDataContext);
	const { gameScore, setGameScore, rankings } = useContext(GameScoreContext);
	const { showMessage } = useContext(MessageContext);
	const [timerState, setTimerState] = useState({
		defaultValue: 0, //default value of the timer (initial start value). user cannot modify this
		startValue: 0, //what the timer starts at - user is able to modify this
		lastValue: 0, //the time left, in milliseconds, when the timer last last started
		startTime: null, //timestamp when timer started
		timeLeft: 0, //current time left, in seconds, used to update the actual display
	});

	const toggleTimer = useCallback(() => {
		const startTimer = () => {
			if (timerState.startTime) return;
			setTimerState((prev) => {
				return {
					...prev,
					startTime: Date.now(),
				};
			});
		};
		const stopTimer = () => {
			if (!timerState.startTime) return;
			setTimerState((prev) => {
				return {
					...prev,
					lastValue: prev.lastValue - (Date.now() - prev.startTime),
					startTime: null,
				};
			});
		};
		if (timerState.startTime) stopTimer();
		else startTimer();
	}, [timerState.startTime]);

	const resetTimer = useCallback(() => {
		//can't reset while timer is running
		if (timerState.startTime) return;
		setTimerState((prev) => {
			return {
				...prev,
				lastValue: prev.startValue,
				startTime: null,
				timeLeft: Math.floor(prev.startValue / 1000),
			};
		});
	}, [timerState.startTime]);

	useEffect(() => {
		let timeout, interval;
		const updateTimer = () => {
			if (!timerState.startTime) return;
			const elapsed = Date.now() - timerState.startTime;
			const timeLeft = Math.max(
				0,
				Math.floor((timerState.lastValue - elapsed) / 1000),
			);
			setTimerState((prev) => {
				return {
					...prev,
					timeLeft,
					startTime: timeLeft === 0 ? null : prev.startTime,
					lastValue: timeLeft === 0 ? 0 : prev.lastValue,
				};
			});
		};
		if (timerState.startTime) {
			const delay = timerState.lastValue % 1000;
			timeout = setTimeout(() => {
				updateTimer();
				interval = setInterval(updateTimer, 1000);
			}, delay + 1);
		} else {
			if (timeout) clearTimeout(timeout);
			if (interval) clearInterval(interval);
		}
		return () => {
			if (timeout) clearTimeout(timeout);
			if (interval) clearInterval(interval);
		};
	}, [timerState.startTime, timerState.lastValue]);

	const [selectedRound, setSelectedRound] = useState(-1);
	const [selectedQuestion, setSelectedQuestion] = useState(-1);
	const [selectedTeam, setSelectedTeam] = useState(null);

	const setCurrentQuestion = (q) => {
		if (selectedRound === -1) return;
		const selectedRoundData = gameData?.dataFile?.data?.rounds[selectedRound];
		if (!selectedRoundData) return;
		const questionDisabled = selectedRoundData.type !== 'wager';
		if (questionDisabled) return;
		const question = Number(q);
		if (isNaN(question)) return;
		setSelectedQuestion(question);
	};
	const setCurrentRound = (r) => {
		const round = Number(r);
		if (isNaN(round)) return;
		if (round === -1) {
			setSelectedRound(-1);
			setSelectedQuestion(-1);
			return;
		}
		const roundData = gameData?.dataFile?.data?.rounds;
		if (!roundData) return;
		if (round >= roundData.length) return;
		const selectedRoundData = roundData[round];
		const questionDisabled = round === -1 || selectedRoundData.type !== 'wager';
		setSelectedRound(round);
		setSelectedQuestion(questionDisabled ? -1 : 0);
	};

	const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(true);
	const handleCloseAnnouncementsModal = () => setShowAnnouncementsModal(false);

	const [showHandout, setShowHandout] = useState(false);
	const showHandoutAnswers = () => setShowHandout(true);
	const hideHandoutAnswers = () => setShowHandout(false);

	const [showTeamInfo, setShowTeamInfo] = useState(false);
	const hideTeamInfoModal = () => setShowTeamInfo(false);
	const showTeamInfoModal = () => setShowTeamInfo(true);

	const [showDeleteTeam, setShowDeleteTeam] = useState(false);
	const promptDeleteTeam = () => setShowDeleteTeam(true);
	const hideDeleteTeam = () => setShowDeleteTeam(false);

	const [showScore, setShowScore] = useState(false);
	const hideScoreModal = () => setShowScore(false);
	const showScoreModal = () => setShowScore(true);

	const [hideAnswers, setHideAnswers] = useState(false);
	const toggleHideAnswers = useCallback(
		() => setHideAnswers(!hideAnswers),
		[hideAnswers],
	);

	const menuItems = useMemo(() => {
		const getStyle = (...styles) => {
			let toReturn = {};
			styles.forEach((obj) => {
				toReturn = {
					...toReturn,
					...obj,
				};
			});
			return toReturn;
		};
		const border = (side, color, style) => {
			const toReturn = {};
			if (Array.isArray(side)) {
				side.forEach((s) => {
					toReturn[`${s}BorderColor`] = color;
					toReturn[`${s}BorderStyle`] = style;
				});
			} else if (side === 'all') {
				['top', 'bottom', 'left', 'right'].forEach((s) => {
					toReturn[`${s}BorderColor`] = color;
					toReturn[`${s}BorderStyle`] = style;
				});
			} else {
				toReturn[`${side}BorderColor`] = color;
				toReturn[`${side}BorderStyle`] = style;
			}
			return toReturn;
		};
		const fillColor = (color) => {
			return { backgroundColor: color };
		};

		const getColumn = (n) => {
			let res = '';

			while (n > 0) {
				// Find remainder
				let rem = n % 26;

				// If remainder is 0, then a 'Z'
				// must be there in output
				if (rem === 0) {
					res += 'Z';
					n = Math.floor(n / 26) - 1;
				}

				// If remainder is non-zero
				else {
					res += String.fromCharCode(rem - 1 + 'A'.charCodeAt(0));
					n = Math.floor(n / 26);
				}
			}

			// Reverse the string
			return res.split('').reverse().join('');
		};

		const exportToExcel = async () => {
			const playerCountColor = '#ffd966';
			const scoreColumnColor = '#f4b084';
			const rankColumnColor = '#a9d08e';
			const altBackgroundColor = '#D9E1F2';
			const yellow = '#ffff00';
			const blue = '#4472C4';
			const white = '#ffffff';
			const black = '#000000';

			const sideBorders = getStyle(
				border('left', black, 'medium'),
				border('right', black, 'medium'),
			);
			const capBorder = getStyle(sideBorders, border('top', black, 'medium'));

			const totalPlayers = gameScore.reduce((p, c) => {
				if (c?.playerCount) return p + c.playerCount;
				return p;
			}, 0);
			let columns = [
				{
					width: 43.6,
				},
			];
			const headerRows = [
				[null], //Row 2 - round 1, round 2, etc.
				[{ value: `Total Players: ${totalPlayers}`, fontWeight: 'bold' }], //Row 3 - total player cell, wager question headers (!, 2, 3, 4)
				[
					{
						value: `Team Name`,
						height: 63,
						fontWeight: 'bold',
						...border('bottom', blue, 'medium'),
					},
				], //Row 4 - team name header, pts, wager, score, rank, etc. headers
			];
			const minRows = 30;
			const teamRows = gameScore.map((team, i) => {
				return [
					getStyle(
						{
							value: team.name,
						},
						border('bottom', blue, 'thin'),
						border('right', black, 'medium'),
						fillColor(i % 2 === 0 ? altBackgroundColor : white),
					),
				];
			});
			while (teamRows.length < minRows) {
				teamRows.push([
					getStyle(
						{
							value: null,
						},
						border('bottom', blue, 'thin'),
						border('right', black, 'medium'),
						fillColor(teamRows.length % 2 === 0 ? altBackgroundColor : white),
					),
				]);
			}
			const rounds = gameData?.dataFile?.data?.rounds;
			let firstHandout = false;
			let lastScoreColumn = -1;
			rounds.forEach((rd, rdNo) => {
				if (rd.type === 'tiebreaker') return;

				if (rd.type === 'wager') {
					//2 columns for each Q in wager round
					columns = columns.concat(
						new Array(rd.questions.length * 2).fill(0).map(() => {
							return {
								width: 3.6,
							};
						}),
					);
					//Round 1 header
					headerRows[0].push(
						{
							value: rd.title,
							span: rd.questions.length * 2,
							fontWeight: 'bold',
							align: 'center',
						},
						...new Array(rd.questions.length * 2 - 1),
					);
					//Wager round question headers, followed by null cell
					rd.questions.forEach((q, i) => {
						headerRows[1].push(
							getStyle(
								{
									value: i + 1,
									span: 2,
									fontWeight: 'bold',
									align: 'center',
								},
								border(i === 0 ? ['left', 'top'] : 'top', black, 'medium'),
								border('right', black, 'thin'),
							),
							null,
						);
						//pts/wager columns
						headerRows[2].push(
							getStyle(
								{
									value: ' Pts',
									fontWeight: 'bold',
									textRotation: 90,
								},
								border('left', black, i === 0 ? 'medium' : 'thin'),
								border('bottom', blue, 'medium'),
							),
							getStyle(
								{
									value: ' Wager',
									fontWeight: 'bold',
									textRotation: 90,
								},
								border('bottom', blue, 'medium'),
							),
						);
						//team score columns
						teamRows.forEach((team, teamInd) => {
							const score = gameScore[teamInd]?.scores[rdNo]?.scores[i];
							const wager = gameScore[teamInd]?.scores[rdNo]?.wagers[i];
							team.push(
								getStyle(
									{
										value: score === null ? null : score,
										backgroundColor:
											teamInd % 2 === 0 ? altBackgroundColor : white,
										align: 'center',
									},
									border('all', blue, 'thin'),
								),
								getStyle(
									{
										value: wager === null ? null : wager,
										backgroundColor:
											teamInd % 2 === 0 ? altBackgroundColor : white,
										align: 'center',
									},
									border('all', blue, 'thin'),
								),
							);
						});
					});
				} else {
					//blank cell in row 2
					headerRows[0].push(null);
					//cap border for round title
					headerRows[1].push(getStyle({ value: null }, capBorder));
					//round title
					headerRows[2].push(
						getStyle(
							{
								value: ` ${rd.title}`,
								fontWeight: 'bold',
								textRotation: 90,
								align: 'center',
							},
							border('bottom', blue, 'medium'),
						),
					);
					//round score
					teamRows.forEach((row, teamInd) => {
						row.push(
							getStyle(
								{
									value:
										gameScore[teamInd]?.scores[rdNo]?.scores[0]?.score || null,
									align: 'center',
								},
								border('all', blue, 'thin'),
								sideBorders,
							),
						);
					});
					//on first handout round,
					if (rd.type === 'handout' && !firstHandout) {
						// blank cell in row 2 for player count
						columns.push({ width: 7.6 });
						headerRows[0].push(null);
						// cap border in row 3 for player count
						headerRows[1].push(
							getStyle({ value: null }, capBorder, fillColor(playerCountColor)),
						);
						headerRows[2].push(
							getStyle(
								{
									value: ' # Players',
									textRotation: 90,
									align: 'center',
									fontWeight: 'bold',
								},
								sideBorders,
								fillColor(playerCountColor),
								border('bottom', blue, 'medium'),
							),
						);
						//player count
						teamRows.forEach((row, teamInd) => {
							row.push(
								getStyle(
									{
										value: gameScore[teamInd]?.playerCount || null,
										align: 'center',
									},
									border('all', blue, 'thin'),
									sideBorders,
									fillColor(playerCountColor),
								),
							);
						});
					}
				}
				//each round two 7-width columns after (Score/rank for wager rounds, round title/score for handout/music/final)
				columns.push({ width: 7.6 }, { width: 7.6 });
				//blank cell in row 2 above score column
				headerRows[0].push(null);
				//cap border with pink fill for score columns
				headerRows[1].push(
					getStyle({ value: null }, capBorder, fillColor(scoreColumnColor)),
				);
				headerRows[2].push(
					getStyle(
						{
							value: ` ${rd.type === 'final' ? 'FINAL ' : ''}SCORE`,
							textRotation: 90,
							fontWeight: 'bold',
							align: 'center',
						},
						sideBorders,
						fillColor(scoreColumnColor),
						border('bottom', blue, 'medium'),
					),
				);
				//construct formula for score column
				if (rd.type === 'wager') {
					teamRows.forEach((row, teamInd) => {
						if (gameScore.length <= teamInd) {
							row.push(
								getStyle(
									{
										value: null,
										backgroundColor: scoreColumnColor,
									},
									border('all', blue, 'thin'),
									sideBorders,
								),
							);
							return;
						}
						const rowNum = 2 + headerRows.length + teamInd;
						const thisCol = row.length + 1;
						const cells = new Array(rd.questions.length)
							.fill(0)
							.map((n, i) => `${getColumn(thisCol - (2 * i + 2))}${rowNum}`);
						if (lastScoreColumn >= 0)
							cells.push(`${getColumn(lastScoreColumn + 1)}${rowNum}`);
						const value = `=SUM(${cells.join(',')})`;
						row.push(
							getStyle(
								{ value, type: 'Formula', align: 'center' },
								fillColor(scoreColumnColor),
								border('all', blue, 'thin'),
								sideBorders,
							),
						);
					});
				} else {
					teamRows.forEach((row, teamInd) => {
						if (gameScore.length <= teamInd) {
							row.push(
								getStyle(
									{
										value: null,
										backgroundColor: scoreColumnColor,
									},
									border('all', blue, 'thin'),
									sideBorders,
								),
							);
							return;
						}
						const rowNum = 2 + headerRows.length + teamInd;
						const roundScoreCol = row.length - (firstHandout ? 1 : 2);
						const value = `=${getColumn(lastScoreColumn + 1)}${rowNum} + ${getColumn(roundScoreCol + 1)}${rowNum}`;
						row.push(
							getStyle(
								{
									value,
									type: 'Formula',
									align: 'center',
								},
								fillColor(scoreColumnColor),
								border('all', blue, 'thin'),
								sideBorders,
							),
						);
					});
					firstHandout = true;
				}

				lastScoreColumn = teamRows[0].length - 1;
				//after wager and final question rounds, there is a rank column which is blank in row 2
				if (rd.type === 'wager' || rd.type === 'final') {
					headerRows[0].push(null);
					headerRows[1].push(
						getStyle({ value: null }, capBorder, fillColor(rankColumnColor)),
					);
					headerRows[2].push(
						getStyle(
							{
								value: ` ${rd.type === 'final' ? 'FINAL RANK' : 'Rank'}`,
								textRotation: 90,
								fontWeight: 'bold',
								align: 'center',
							},
							sideBorders,
							border('bottom', blue, 'medium'),
							fillColor(rankColumnColor),
						),
					);
					//construct formula for rank column
					const firstRow = 2 + headerRows.length;
					const lastRow = firstRow + teamRows.length - 1;
					teamRows.forEach((row, teamInd) => {
						const rowNum = 2 + headerRows.length + teamInd;
						const scoreCol = getColumn(row.length);
						const value = `=if(A${rowNum}<>"",COUNTIF(${scoreCol}${firstRow}:${scoreCol}${lastRow},">"&${scoreCol}${rowNum})+1,"")`;
						row.push(
							getStyle(
								{ value, type: 'Formula', align: 'center' },
								fillColor(rankColumnColor),
								border('all', blue, 'thin'),
								sideBorders,
							),
						);
					});
				}
			});
			//final rank column, buffer, rank table
			columns = columns.concat(
				[7, 11.25, 11.25, 27.88, 11.25].map((width) => {
					return { width };
				}),
			);

			const infoSpans = [1, 6, 1, 2, 5, 1, 2, 7];
			const infoValues = [
				gameData.venue,
				gameData.location,
				null,
				'Date',
				new Date(moment.tz(new Date(gameData.date), moment.tz.guess())),
				null,
				'Host',
				gameData.host,
			].map((value, i) => {
				if (!value) return null;
				const info = {
					value,
					fontWeight: 'bold',
					span: infoSpans[i],
					bottomBorderColor: '#000000',
					bottomBorderStyle: 'medium',
					backgroundColor: altBackgroundColor,
				};
				if (i % 3 === 0)
					return {
						...info,
						leftBorderColor: '#000000',
						leftBorderStyle: 'medium',
					};
				else if (i % 3 === 1) {
					if (i === 4) {
						const toReturn = getStyle(
							info,
							getStyle(
								border('bottom', black, 'medium'),
								border('right', black, 'medium'),
							),
							{ type: Date, format: 'mm/dd/yyyy' },
						);
						return toReturn;
					}
					return getStyle(
						info,
						getStyle(
							border('bottom', black, 'medium'),
							border('right', black, 'medium'),
						),
					);
				}
			});

			const INFO_ROW = [];
			infoValues.forEach((val) => {
				if (!val) {
					INFO_ROW.push(null);
					return;
				}
				INFO_ROW.push({ ...val });
				for (var i = 0; i < val.span - 1; i++) {
					INFO_ROW.push(null);
				}
			});
			headerRows[2].push(
				null,
				getStyle(
					{ value: 'Place', fontWeight: 'bold' },
					fillColor(yellow),
					border(['left', 'top'], black, 'medium'),
					border('right', black, 'thin'),
				),
				getStyle(
					{ value: 'TEAM', fontWeight: 'bold' },
					fillColor(yellow),
					border('top', black, 'medium'),
					border('right', black, 'thin'),
				),
				getStyle(
					{ value: 'SCORE', fontWeight: 'bold' },
					fillColor(yellow),
					border(['top', 'right'], black, 'medium'),
				),
			);

			teamRows.forEach((row, ind) => {
				const data = rankings[ind];
				row.push(
					null,
					getStyle(
						{
							value: data?.rank || null,
							align: 'left',
						},
						border('all', black, 'thin'),
						border(
							ind === teamRows.length - 1 ? ['left', 'bottom'] : 'left',
							black,
							'medium',
						),
						fillColor(yellow),
					),
					getStyle(
						{
							value: data?.name || null,
							align: 'left',
						},
						border('all', black, 'thin'),
						border(
							ind === teamRows.length - 1 ? 'bottom' : [],
							black,
							'medium',
						),
						fillColor(yellow),
					),
					getStyle(
						{
							value: data?.score || null,
							align: 'left',
						},
						border('all', black, 'thin'),
						border(
							ind === teamRows.length - 1 ? ['right', 'bottom'] : 'right',
							black,
							'medium',
						),
						fillColor(yellow),
					),
					null,
				);
			});
			await writeXlsxFile([INFO_ROW, ...headerRows, ...teamRows], {
				columns,
				fileName: `${gameData.date}_${gameData.venue.split(' ').join('')}.xlsx`,
				fontSize: 12,
				stickyColumnsCount: 1,
			});
		};

		const closeGame = () => {
			showMessage('info', 'Closing game...');
			setGameData((prev) => {
				return {
					...prev,
					dataFile: null,
					answerFile: null,
					audioFile: null,
				};
			});
		};

		const team = gameScore.find((t) => t.id === selectedTeam);

		return [
			{
				title: 'Game',
				options: [
					{
						title: 'Show announcements',
						shortcut: {
							altKey: false,
							ctrlKey: true,
							key: 'A',
						},
						fn: () => setShowAnnouncementsModal(true),
						disabled: false,
					},
					{
						title: 'Show standings',
						shortcut: {
							shiftKey: true,
							ctrlKey: true,
							key: 'S',
						},
						fn: showScoreModal,
						disabled: false,
					},
					{
						title: `${hideAnswers ? 'Show' : 'Hide'} answers`,
						shortcut: {
							shiftKey: true,
							ctrlKey: true,
							key: 'H',
						},
						fn: toggleHideAnswers,
						disabled: false,
					},
					{
						title: 'Export Excel file',
						shortcut: {
							shiftKey: true,
							ctrlKey: true,
							key: 'E',
						},
						fn: exportToExcel,
						disabled: false,
					},
					{
						title: 'Close game',
						shortcut: {
							altKey: true,
							ctrlKey: true,
							key: 'Q',
						},
						fn: closeGame,
						disabled: false,
					},
				],
				disabled: false,
			},
			{
				title: 'Team',
				options: [
					{
						title: 'Team info...',
						shortcut: {
							altKey: true,
							ctrlKey: true,
							key: '/',
						},
						fn: showTeamInfoModal,
						disabled: () => !selectedTeam,
					},
					{
						title: team
							? `Set team ${team.active ? 'inactive' : 'active'}`
							: 'Set team inactive',
						shortcut: {
							altKey: false,
							ctrlKey: true,
							key: '-',
						},
						fn: team
							? team.active
								? () => {
										setGameScore((prev) => {
											const newScore = [...prev];
											newScore.some((tm) => {
												if (tm.id === selectedTeam) {
													tm.active = false;
													return true;
												}
											});
											return newScore;
										});
									}
								: () => {
										setGameScore((prev) => {
											const newScore = [...prev];
											newScore.some((tm) => {
												if (tm.id === selectedTeam) {
													tm.active = true;
													return true;
												}
											});
											return newScore;
										});
									}
							: () => {},
						disabled: () => !selectedTeam,
					},
					{
						title: 'Delete team',
						shortcut: {
							altKey: true,
							ctrlKey: true,
							key: 'Backspace',
							keyDisplay: 'Bksp',
						},
						fn: promptDeleteTeam,
						disabled: !selectedTeam,
					},
				],
				disabled: () => !selectedTeam,
			},
			{
				title: 'Round',
				options: [
					{
						title: 'Previous question',
						shortcut: {
							altKey: false,
							ctrlKey: true,
							key: 'ArrowLeft',
							keyDisplay: 'Left',
						},
						fn: () => {
							if (selectedQuestion === null || selectedQuestion <= 0) return;
							setSelectedQuestion(selectedQuestion - 1);
						},
						disabled: () => selectedQuestion <= 0,
					},
					{
						title: 'Next question',
						shortcut: {
							altKey: false,
							ctrlKey: true,
							key: 'ArrowRight',
							keyDisplay: 'Right',
						},
						fn: () => {
							if (
								selectedQuestion === null ||
								selectedQuestion < 0 ||
								selectedQuestion >= 3
							)
								return;
							setSelectedQuestion((prev) => prev + 1);
						},
						disabled: () => selectedQuestion < 0 || selectedQuestion >= 3,
					},
					{
						title: 'Previous Round',
						shortcut: {
							altKey: true,
							ctrlKey: true,
							key: 'ArrowLeft',
							keyDisplay: 'Left',
						},
						fn: () => {
							const data = gameData?.dataFile?.data?.rounds;
							if (!data) return;
							const newRound = selectedRound - 1;
							if (newRound < -1 || newRound >= data.length) return;
							setSelectedRound(newRound);
							if (newRound !== -1 && data[newRound]?.type === 'wager')
								setSelectedQuestion(0);
							else setSelectedQuestion(-1);
						},
						disabled: () => selectedRound < 0,
					},
					{
						title: 'Next Round',
						shortcut: {
							altKey: true,
							ctrlKey: true,
							key: 'ArrowRight',
							keyDisplay: 'Right',
						},
						fn: () => {
							const data = gameData?.dataFile?.data?.rounds;
							if (!data) return;
							const newRound = selectedRound + 1;
							if (newRound >= data.length) return;
							setSelectedRound(newRound);
							if (data[newRound]?.type === 'wager') setSelectedQuestion(0);
							else setSelectedQuestion(-1);
						},
						disabled: () => {
							const data = gameData?.dataFile?.data?.rounds;
							return selectedRound >= data.length - 1;
						},
					},
					{
						title: `${timerState.startTime ? 'Stop' : 'Start'} timer`,
						shortcut: {
							altKey: true,
							ctrlKey: true,
							key: 'T',
						},
						fn: toggleTimer,
						disabled: () => selectedRound < 0,
					},
					{
						title: `Reset timer`,
						shortcut: {
							altKey: true,
							ctrlKey: true,
							key: 'R',
						},
						fn: resetTimer,
						disabled: () => selectedRound < 0 || timerState.startTime,
					},
				],
				disabled: false,
			},
		];
	}, [
		showMessage,
		setGameData,
		gameData,
		gameScore,
		selectedRound,
		selectedTeam,
		selectedQuestion,
		setGameScore,
		timerState.startTime,
		toggleTimer,
		resetTimer,
		hideAnswers,
		toggleHideAnswers,
		rankings,
	]);

	const handleKey = useCallback(
		(e) => {
			if (!e.key) return;
			menuItems.some((menu) => {
				return menu.options.some((item) => {
					if (
						item.shortcut.key.toLowerCase() === e.key.toLowerCase() &&
						(item.shortcut.altKey || false) === e.altKey &&
						(item.shortcut.ctrlKey || false) === e.ctrlKey &&
						(item.shortcut.shiftKey || false) === e.shiftKey
					) {
						e.preventDefault();
						let disabled = false;
						switch ((typeof item.disabled).toLowerCase()) {
							case 'boolean':
								disabled = item.disabled;
								break;
							case 'function':
								disabled = item.disabled();
								break;
							default:
								disabled = false;
						}
						if (!disabled) item.fn();
						return true;
					}
				});
			});
		},
		[menuItems],
	);

	useEffect(() => {
		window.addEventListener('keydown', handleKey);
		return () => {
			window.removeEventListener('keydown', handleKey);
		};
	}, [handleKey]);

	//load existing game data on first render
	useEffect(() => {
		const history = localStorage.getItem('bp-game-history');
		const savedGames = history ? JSON.parse(history) : [];

		//see if game data has already been saved for this game
		const existingGame = savedGames.find(
			(g) =>
				g.host.toLowerCase() === gameData.host.toLowerCase() &&
				g.venue.toLowerCase() === gameData.venue.toLowerCase() &&
				g.location.toLowerCase() === gameData.location.toLowerCase() &&
				g.date === gameData.date,
		);

		//if so, reload it
		if (existingGame) {
			//get the game id indicated by the item in the saved game list
			const existingGameDataItem = localStorage.getItem(
				`bp-game-${existingGame.id}`,
			);
			setGameData((prev) => {
				return {
					...prev,
					id: existingGame.id,
				};
			});
			//if we found the LS item...
			if (existingGameDataItem) {
				//try to parse the data
				const data = JSON.parse(existingGameDataItem);
				//if successful, restore the game state
				if (data) {
					setGameScore(data);
					showMessage(
						'info',
						`Existing game data for ${gameData.venue} on ${gameData.date} reloaded`,
						2000,
					);
				}
				//if not successful, set the LS item to the current game score array (probably empty)
				else {
					localStorage.setItem(
						`bp-game-${existingGame.id}`,
						JSON.stringify(gameScore),
					);
				}
			}
			//no existing game was found- set the LS item to the current game score array (probably empty)
			else {
				localStorage.setItem(
					`bp-game-${existingGame.id}`,
					JSON.stringify(gameScore),
				);
			}
		}
		//game has not been saved in LS yet
		else {
			//save this one to saved games
			const { host, venue, location, date } = gameData;
			const id = self.crypto.randomUUID();
			savedGames.push({
				host,
				venue,
				location,
				date,
				id,
			});
			localStorage.setItem('bp-game-history', JSON.stringify(savedGames));
			localStorage.setItem(`bp-game-${id}`, JSON.stringify(gameScore));
			setGameData((prev) => {
				return {
					...prev,
					id,
				};
			});
		}
	}, []);

	//save current game data on each update
	useEffect(() => {
		const id = gameData.id;
		const data = JSON.stringify(gameScore);
		localStorage.setItem(`bp-game-${id}`, data);
	}, [gameScore, gameData.id]);

	return (
		<div id="scoresheet" className="container">
			<HandoutContext.Provider value={showHandoutAnswers}>
				<AnnouncementsContext.Provider value={setShowAnnouncementsModal}>
					<ScoreModalContext.Provider
						value={{ showScore, showScoreModal, hideScoreModal }}
					>
						<SelectionContext.Provider
							value={{
								selectedRound,
								selectedQuestion,
								setCurrentRound,
								setCurrentQuestion,
								selectedTeam,
								setSelectedTeam,
							}}
						>
							<TimerContext.Provider
								value={{ timerState, setTimerState, toggleTimer, resetTimer }}
							>
								<HideAnswersContext.Provider
									value={{ hideAnswers, toggleHideAnswers }}
								>
									<AnnouncementsModal
										onHide={handleCloseAnnouncementsModal}
										show={showAnnouncementsModal}
									/>
									<HandoutModal
										id={'handout-modal'}
										onHide={hideHandoutAnswers}
										show={showHandout}
									/>
									<TeamInfoModal
										id={'team-info-modal'}
										onHide={hideTeamInfoModal}
										show={showTeamInfo}
									/>
									<DeleteTeamModal
										id={'delete-team-modal'}
										onHide={hideDeleteTeam}
										show={showDeleteTeam}
									/>
									<ScoreModal
										id={'score-modal'}
										onHide={hideScoreModal}
										show={showScore}
									/>
									<MenuBar items={menuItems} />
									{selectedRound !== null ? <TeamForm /> : ''}
									<div className="f-1 d-flex flex-column px-4">
										<Row sm={1} md={2} className="f-1">
											<Col sm={12} md={8}>
												<ScoreTable openTeamInfo={showTeamInfoModal} />
											</Col>
											<Col sm={12} md={4} id="info-panel">
												<InfoPanel />
											</Col>
										</Row>
									</div>
								</HideAnswersContext.Provider>
							</TimerContext.Provider>
						</SelectionContext.Provider>
					</ScoreModalContext.Provider>
				</AnnouncementsContext.Provider>
			</HandoutContext.Provider>
		</div>
	);
}
