import { useContext, useState, useCallback, useRef } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import '../../css/TeamForm.css';
import { GameDataContext } from '../../contexts/GameDataContext';
import { SelectionContext } from '../../contexts/SelectionContext';
import { GameScoreContext } from '../../contexts/GameScoreContext';
import { MessageContext } from '../../contexts/MessageContext';
export default function TeamForm() {
	const {
		selectedRound,
		selectedQuestion,
		setCurrentRound,
		setCurrentQuestion,
	} = useContext(SelectionContext);
	const { gameData } = useContext(GameDataContext);
	const { gameScore, setGameScore } = useContext(GameScoreContext);
	const { showMessage } = useContext(MessageContext);
	const [submitting, setSubmitting] = useState(false);
	const [questionScore, setQuestionScore] = useState('');
	const [questionWager, setQuestionWager] = useState('');
	const [playerCount, setPlayerCount] = useState('');
	const [teamName, setTeamName] = useState('');
	const [suggestions, setSuggestions] = useState([]);
	const [selectedSuggestion, setSelectedSuggestion] = useState(null);

	const handleChangeScore = (e) => {
		const val = Number(e.target.value);
		if (isNaN(val)) setQuestionScore('');
		setQuestionScore(val);
	};

	const handleChangeWager = (e) => {
		const val = Number(e.target.value);
		if (isNaN(val)) setQuestionWager('');
		setQuestionWager(val);
	};

	const handleChangePlayerCount = (e) => {
		const val = Number(e.target.value);
		if (isNaN(val)) setPlayerCount('');
		setPlayerCount(val);
	};

	const getTeamData = useCallback(
		(id) => {
			return gameScore.find((team) => team.id === id);
		},
		[gameScore],
	);

	const clearSuggestions = useCallback(() => {
		if (selectedSuggestion !== null) {
			const suggestion = suggestions[selectedSuggestion];
			if (suggestion) setTeamName(suggestion.teamName);
		}
		setSuggestions([]);
	}, [suggestions, selectedSuggestion]);

	const handleHoverSuggestion = (e) => {
		const ind = e.target.getAttribute('data-index');
		if (!ind || isNaN(Number(ind))) return;
		setSelectedSuggestion(Number(ind));
	};
	const handleUnhoverSuggestion = () => setSelectedSuggestion(null);

	const teamNameRef = useRef();
	const handleKey = useCallback(
		(e) => {
			if (suggestions.length === 0) return;
			if (e.key.toLowerCase() === 'tab') {
				if (selectedSuggestion)
					setTeamName(suggestions[selectedSuggestion].teamName);
				else setTeamName(suggestions[0].teamName);
				setSuggestions([]);
			} else if (e.key.toLowerCase() === 'arrowdown') {
				if (selectedSuggestion === null) setSelectedSuggestion(0);
				else
					setSelectedSuggestion((prev) => {
						return (prev + 1) % suggestions.length;
					});
			} else if (e.key.toLowerCase() === 'arrowup') {
				if (selectedSuggestion === null)
					setSelectedSuggestion(suggestions.length - 1);
				else
					setSelectedSuggestion((prev) => {
						return (prev + suggestions.length - 1) % suggestions.length;
					});
			}
		},
		[suggestions, selectedSuggestion],
	);

	const handleSelectSuggestion = (e) => {
		const id = e.target.getAttribute('data-id');
		const team = getTeamData(id);
		if (!team) return;
		setTeamName(team.name);
		clearSuggestions();
	};

	const addTeam = useCallback(
		(name) => {
			const data = gameData?.dataFile?.data?.rounds;
			const filtered = data.filter(
				(rd) => rd.round?.toString().toLowerCase() !== 'tiebreaker',
			);

			if (!gameScore || !Array.isArray(gameScore)) return;
			if (!name)
				return {
					status: 'fail',
					message: 'You must enter a team name',
				};
			const existing = gameScore.find(
				(t) => t.name.trim().toLowerCase() === name.trim().toLowerCase(),
			);
			if (existing)
				return {
					status: 'fail',
					message: `Team ${existing.name} already exists in this game`,
				};
			else {
				const newScore = [...gameScore];
				const toPush = {
					name,
					id: self.crypto.randomUUID(),
					active: true,
					playerCount: null,
					scores: filtered.map((rd) => {
						if ((typeof rd.round).toLowerCase() === 'number') {
							return {
								round: rd.round,
								scores: new Array(rd.questions.length).fill(null),
								wagers: new Array(rd.questions.length).fill(null),
							};
						} else {
							return {
								round: rd.round,
								scores: [],
							};
						}
					}),
				};
				newScore.push(toPush);
				setGameScore(newScore);
				return {
					status: 'success',
					message: `Team ${name} added to data`,
				};
			}
		},
		[gameData, gameScore, setGameScore],
	);

	const handleSubmit = (e) => {
		e.preventDefault();
		if (submitting) return;
		setSubmitting(true);
		const formData = new FormData(e.target);
		const rounds = gameData?.dataFile?.data?.rounds;
		if (!rounds) return;
		//for round -1 (pregame), we're just adding the team if necessary
		if (selectedRound === -1) {
			const newName = formData.get('team');
			const res = addTeam(newName);
			if (res.status === 'success') showMessage('info', res.message);
			else showMessage('error', res.message);

			setTeamName('');
		} else {
			let data = {};
			for (const [key, value] of formData) {
				data[key] = value;
			}
			const allowedWagers = [1, 3, 5, 7];

			console.log(data);
			console.log(gameScore);
			//see if the team exists
			if (
				!gameScore.some(
					(team) =>
						team.name.trim().toLowerCase() === data.team.trim().toLowerCase(),
				)
			)
				addTeam(data.team);

			setGameScore((prev) => {
				const newData = [...prev];
				const round = Number(data.round);

				if (isNaN(round)) return;
				newData.some((team) => {
					//find the team
					if (
						team.name.trim().toLowerCase() === data.team.trim().toLowerCase()
					) {
						//we've found the team, get the object representing their submission(s) for this round
						//whatever happens here, we will return true and be done after processing this object
						const teamRound = team.scores[round];

						if (data.playerCount) {
							const playerCount = Number(data.playerCount);
							if (!isNaN(playerCount)) team.playerCount = playerCount;
						}

						if (teamRound) {
							//if we're in a regular round
							if ((typeof teamRound.round).toLowerCase() === 'number') {
								//get the question number and score
								const question = Number(data.question);
								const score = Number(data.score);
								const wager = Number(data.wager);
								if (!isNaN(question) && question <= teamRound.scores.length) {
									//make sure the wager hasn't alaredy been used - show a warning if so, but allow the submission
									if (
										teamRound.wagers.some(
											(w, i) =>
												w !== null &&
												w === Number(data.wager) &&
												i !== question,
										)
									) {
										showMessage(
											'warning',
											`${team.name} has already used wager ${data.wager} this round`,
										);
									}

									//ensure the wager is allowed
									if (!allowedWagers.includes(Number(data.wager))) {
										showMessage(
											'error',
											`Invalid wager submitted - only ${allowedWagers.join(', ')} are allowed`,
										);
									} else if (
										isNaN(score) ||
										score < 0 ||
										score !== Math.floor(score)
									)
										showMessage(
											'error',
											'Invalid score submitted - must be a non-negative integer',
										);
									else {
										teamRound.scores[question] = score;
										teamRound.wagers[question] = wager;
									}
								} else
									showMessage(
										'',
										`Invalid question (${data.question}) selected`,
									);
							} else {
								console.log(data);
								const score = Number(data.score);
								const minScore = teamRound.round === 'Final' ? -15 : 0;
								const maxScore =
									teamRound.round === 'Audio'
										? 14
										: teamRound.round === 'Final'
											? 15
											: 10;
								if (isNaN(score))
									showMessage(
										'error',
										`Invalid score submitted (${data.score})`,
									);
								else {
									let valid = false;
									if (score < minScore)
										showMessage(
											'warning',
											`Score submitted (${data.score}) is below the normal minimum score for this round`,
										);
									else if (score > maxScore)
										showMessage(
											'warning',
											`Score submitted (${data.score}) is above the normal maximum score for this round`,
										);
									else valid = true;

									teamRound.scores = [
										{
											score: score,
											valid,
										},
									];
								}
							}
						} else showMessage('error', `Invalid round (${round}) selected`);
						return true;
					}
				});

				return newData;
			});
		}
		setQuestionScore('');
		setQuestionWager('');
		setTeamName('');
		setSubmitting(false);
		teamNameRef.current.value = '';
		teamNameRef.current.focus();
	};

	const handleTeamName = useCallback(
		(e) => {
			const val = e.target.value;
			setTeamName(val);
			if (val.trim().length === 0 || selectedRound < 0) clearSuggestions();
			else {
				const teams = gameScore
					.filter(
						(team) =>
							team.name.toLowerCase().indexOf(val.toLowerCase().trim()) >= 0,
					)
					.slice(0, 5)
					.map((team) => {
						return {
							teamName: team.name,
							id: team.id,
						};
					})
					.sort((a, b) =>
						a.teamName.toLowerCase().localeCompare(b.teamName.toLowerCase()),
					);
				setSuggestions(teams);
				setSelectedSuggestion(null);
			}
		},
		[gameScore, clearSuggestions, selectedRound],
	);

	const resetScoreAndWager = () => {
		setQuestionScore('');
		setQuestionWager('');
	};

	const handleRoundChange = (e) => {
		setCurrentRound(Number(e.target.value));
		resetScoreAndWager();
	};
	const handleQuestionChange = (e) => {
		setCurrentQuestion(Number(e.target.value));
		resetScoreAndWager();
	};

	const rounds = gameData?.dataFile?.data?.rounds;
	const selectedRoundData = rounds[selectedRound];
	const questionDisabled =
		selectedRound.toString() === '-1' ||
		isNaN(Number(selectedRoundData?.round));

	return (
		<Container>
			<form id="data-entry-form" onSubmit={handleSubmit}>
				<Row sm={1} md={4} lg={4}>
					<Col>
						<div className="d-flex flex-row">
							<div className="labeled-input f-1">
								<div className="input-label">Round</div>
								<select
									id="round-select"
									name="round"
									onChange={handleRoundChange}
									value={selectedRound}
								>
									<option value="-1">Pregame</option>
									{gameData.dataFile.data.rounds.map((rd, i) => {
										return (
											<option key={i} value={i}>
												{(typeof rd.round).toLowerCase() === 'number'
													? 'Round ' + rd.round
													: rd.round}
											</option>
										);
									})}
								</select>
							</div>

							<div className="labeled-input f-1">
								<div className="input-label">Question</div>
								<select
									id="question-select"
									onChange={handleQuestionChange}
									name="question"
									value={questionDisabled ? -1 : selectedQuestion}
									disabled={questionDisabled}
								>
									{questionDisabled ? <option value="-1">--</option> : ''}
									{[0, 1, 2, 3].map((n, i) => {
										return (
											<option value={n} key={i}>
												{n + 1}
											</option>
										);
									})}
								</select>
							</div>
						</div>
					</Col>
					<Col>
						<div className="labeled-input f-1">
							<div className="input-label">Team</div>
							<input
								type="text"
								name="team"
								placeholder="Team name"
								autoComplete="off"
								value={teamName}
								onChange={handleTeamName}
								onFocus={handleTeamName}
								onKeyDown={handleKey}
								onBlur={clearSuggestions}
								ref={teamNameRef}
							></input>
							{}
							<div className="suggestion-box">
								{suggestions.map((s, i) => {
									return (
										<div
											key={i}
											className={`suggestion ${selectedSuggestion === i ? 'selected' : ''}`}
											data-id={s.id}
											data-index={i}
											onClick={handleSelectSuggestion}
											onMouseOver={handleHoverSuggestion}
											onMouseOut={handleUnhoverSuggestion}
										>
											{s.teamName}
										</div>
									);
								})}
							</div>
						</div>
					</Col>
					<Col lg="auto" md="auto" sm="auto">
						{selectedRound >= -1 && selectedRound < rounds.length - 1 ? (
							<div className="d-flex flex-row align-items-end h-100">
								{selectedRound > -1 ? (
									<div className="labeled-input">
										<div className="input-label">Score</div>
										<input
											type="number"
											name="score"
											value={questionScore}
											onChange={handleChangeScore}
										></input>
									</div>
								) : (
									''
								)}

								{selectedRound === 1 ? (
									<div className="labeled-input">
										<div className="input-label">Player Count</div>
										<input
											type="number"
											min="1"
											name="playerCount"
											value={playerCount}
											onChange={handleChangePlayerCount}
										></input>
									</div>
								) : isNaN(Number(selectedRoundData?.round)) ? (
									''
								) : (
									<div className="labeled-input">
										<div className="input-label">Wager</div>
										<input
											type="number"
											min="1"
											name="wager"
											value={questionWager}
											onChange={handleChangeWager}
										></input>
									</div>
								)}
								<input
									type="submit"
									className="btn btn-primary ms-3"
									disabled={submitting}
									value={selectedRound === -1 ? 'Add Team' : 'Submit'}
								></input>
							</div>
						) : (
							''
						)}
					</Col>
				</Row>
			</form>
		</Container>
	);
}
