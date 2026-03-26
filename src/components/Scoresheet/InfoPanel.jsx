import { useContext, useMemo, useEffect } from 'react';
import { SelectionContext } from '../../contexts/SelectionContext';
import { GameDataContext } from '../../contexts/GameDataContext';
import { AnnouncementsContext } from '../../contexts/AnnouncementsContext';
import { HandoutContext } from '../../contexts/HandoutContext';
import { TimerContext } from '../../contexts/TimerContext';
import { HideAnswersContext } from '../../contexts/HideAnswersContext';
import InfoBox from './InfoBox';
import ToggleBox from './ToggleBox';
import LabeledInput from '../LabeledInput';
import '../../css/InfoPanel.css';
import Timer from '../Timer';
import { GameScoreContext } from '../../contexts/GameScoreContext';
import Button from 'react-bootstrap/Button';
import { ScoreModalContext } from '../../contexts/ScoreModalContext';
function RoundHeader({ title, answerToggle, toggleHideAnswers, hideAnswers }) {
	return (
		<div className="w-100 d-flex flex-row justify-content-between mb-2">
			<div className="d-flex flex-column align-items-start my-auto">
				<h6 className="fw-semibold">{title}</h6>
			</div>
			{answerToggle ? (
				<div className="my-auto d-flex flex-row">
					<ToggleBox
						onChange={toggleHideAnswers}
						id={'hide-answers'}
						label={'Hide answers'}
						checked={hideAnswers}
						onBackgroundColor={'var(--light-blue)'}
						onSwitchColor={'var(--light-gray)'}
					/>
				</div>
			) : (
				<></>
			)}
		</div>
	);
}

export default function InfoPanel() {
	const { hideAnswers, toggleHideAnswers } = useContext(HideAnswersContext);

	const {
		selectedQuestion,
		selectedRound,
		setCurrentQuestion,
		setCurrentRound,
	} = useContext(SelectionContext);
	const { showScoreModal } = useContext(ScoreModalContext);
	const { gameData, setGameDataField } = useContext(GameDataContext);
	const { gameScore } = useContext(GameScoreContext);
	const setShowAnnouncementsModal = useContext(AnnouncementsContext);
	const showAnnouncements = () => setShowAnnouncementsModal(true);
	const showHandoutAnswers = useContext(HandoutContext);
	const currentRound = useMemo(() => {
		const rounds = gameData?.dataFile?.data?.rounds;
		if (!rounds || selectedRound < 0 || selectedRound > rounds.length - 1)
			return null;
		return rounds[selectedRound];
	}, [gameData, selectedRound]);

	const handleSetGameDataField = (field) => {
		return (e) => {
			const history = localStorage.getItem('bp-game-history');
			const savedGames = history ? JSON.parse(history) : [];

			//see if game data has already been saved for this game
			savedGames.some((g) => {
				if (g.id === gameData.id) {
					g[field] = e.target.value;
					return true;
				}
			});
			localStorage.setItem('bp-game-history', JSON.stringify(savedGames));
			const fn = setGameDataField(field);
			fn(e);
		};
	};

	const { setTimerState } = useContext(TimerContext);

	const nextQuestion = () => {
		if (
			selectedQuestion === null ||
			selectedQuestion < 0 ||
			selectedQuestion >= 3
		)
			return;
		setCurrentQuestion(selectedQuestion + 1);
	};

	const nextRound = () => {
		const rounds = gameData?.dataFile?.data?.rounds;
		if (!rounds || selectedRound >= rounds.length - 1) return;
		setCurrentRound(selectedRound + 1);
	};

	useEffect(() => {
		if (!gameData) return;
		if (selectedRound < 0) return;
		const resetTimer = (value) => {
			setTimerState({
				defaultValue: value * 1000,
				startValue: value * 1000,
				lastValue: value * 1000,
				startTime: null,
				timeLeft: value,
			});
		};
		const rounds = gameData?.dataFile?.data?.rounds;
		if (!rounds) return;
		const round = rounds[selectedRound];
		const timerValue = round.timer;
		resetTimer(timerValue);
	}, [selectedQuestion, selectedRound, gameData, setTimerState]);

	const activeTeams = useMemo(() => {
		if (!gameScore || !Array.isArray(gameScore)) return 0;
		return gameScore.reduce((p, c) => {
			if (c.active) return p + 1;
			return p;
		}, 0);
	}, [gameScore]);

	//this only counts submissions from active teams - teams marked inactive who rejoin will still be scored, though
	const submissionCount = useMemo(() => {
		const rounds = gameData?.dataFile?.data?.rounds;
		if (!rounds) return 0;
		if (selectedRound < 0 || selectedRound > rounds.length - 1) return 0;
		const currentRound = rounds[selectedRound];
		if (!currentRound || currentRound.type === 'tiebreaker') return 0;
		return gameScore.reduce((p, c) => {
			if (!c.active) return p;
			const teamRound = c.scores[selectedRound];
			if (teamRound.type === 'wager') {
				if (teamRound.scores[selectedQuestion] !== null) return p + 1;
				return p;
			}
			return teamRound.scores.length > 0 ? p + 1 : p;
		}, 0);
	}, [selectedRound, selectedQuestion, gameScore, gameData]);

	if (selectedRound < 0)
		return (
			<div className="d-flex flex-column align-items-start">
				<h5>Pregame</h5>
				<button className="btn btn-primary mb-3" onClick={showAnnouncements}>
					Show announcements
				</button>
				<h6>{`Game date: ${gameData.date}`}</h6>
				<LabeledInput
					name={'host-name'}
					label={'Host name'}
					onChange={handleSetGameDataField('host')}
					ls
				/>
				<LabeledInput
					name={'venue-name'}
					label={'Venue name'}
					onChange={handleSetGameDataField('venue')}
					ls
				/>
				<LabeledInput
					name={'venue-location'}
					label={'Venue location'}
					onChange={handleSetGameDataField('location')}
					ls
				/>
			</div>
		);
	else {
		const currentQuestion =
			currentRound.type === 'wager'
				? currentRound.questions[selectedQuestion]
				: currentRound.type === 'final' ||
					  currentRound.type === 'tiebreaker' ||
					  currentRound.type === '3PQ'
					? currentRound
					: null;
		const rounds = gameData?.dataFile?.data?.rounds;
		const nr = rounds[selectedRound + 1];
		let nextTitle = '';
		if (nr && (nr.type === 'handout' || nr.type === 'audio'))
			nextTitle = nr.title.toLowerCase();
		return (
			<div className="d-flex flex-column align-items-start">
				<RoundHeader
					title={currentRound.title}
					toggleHideAnswers={
						currentRound.type === 'handout' ? () => {} : toggleHideAnswers
					}
					hideAnswers={hideAnswers}
					answerToggle={currentRound.type !== 'handout'}
				/>
				{currentQuestion ? (
					<>
						<>
							{/* category list on the first question */}
							{selectedQuestion === 0 ? (
								<InfoBox title={'Categories'}>
									<ol className="cat-list">
										{currentRound.questions.map((q, i) => {
											return <li key={i}>{q.category}</li>;
										})}
									</ol>
								</InfoBox>
							) : selectedQuestion === currentRound.questions?.length - 1 &&
							  nextTitle ? (
								<InfoBox
									title={`Pick up ${nextTitle} round`}
								>{`As you turn in your answers for this one, don't forget to pick up your ${nextTitle} round!`}</InfoBox>
							) : (
								<></>
							)}
						</>
						{/* question text */}
						<InfoBox
							title={`Question ${selectedQuestion < 0 ? '' : selectedQuestion + 1}`}
						>
							{
								<div className="category-heading">
									{currentQuestion.category}
								</div>
							}
							{currentQuestion.text.split('\n').map((line, i) => {
								return <div key={i}>{line}</div>;
							})}
						</InfoBox>
						{/* answer text */}
						<InfoBox title={'Answer'} hideText={hideAnswers}>
							{(Array.isArray(currentQuestion.answer)
								? currentQuestion.answer
								: currentQuestion.answer.split('\n')
							).map((line, i) => {
								return <div key={i}>{line}</div>;
							})}
						</InfoBox>
						{currentQuestion.bonus ? (
							<InfoBox title={`Bonus`}>
								{currentQuestion.bonus.split('\n').map((line, i) => {
									return <div key={i}>{line}</div>;
								})}
							</InfoBox>
						) : (
							<></>
						)}
						{currentQuestion.bonusAnswer ? (
							<>
								<InfoBox title={`Bonus answer`} hideText={hideAnswers}>
									{currentQuestion.bonusAnswer.split('\n').map((line, i) => {
										return <div key={i}>{line}</div>;
									})}
								</InfoBox>
							</>
						) : (
							<></>
						)}
					</>
				) : (
					<></>
				)}
				{currentRound.type === 'audio' ? (
					<>
						<audio
							src={gameData.audioFile.data}
							controls
							className="w-100"
						></audio>
						<InfoBox title={'Answers'} hideText={hideAnswers}>
							<table className="song-table">
								<thead>
									<tr>
										<th className="song-no">#</th>
										<th>Title</th>
										<th>Artist</th>
									</tr>
								</thead>
								<tbody>
									{currentRound.questions.map((line, i) => {
										return (
											<tr key={i}>
												<td className="song-no">{i + 1}</td>
												<td>{line.title}</td>
												<td>{line.artist}</td>
											</tr>
										);
									})}
									<tr>
										<td colSpan="3">
											<span className="song-no">Theme: </span>
											{currentRound.theme}
										</td>
									</tr>
								</tbody>
							</table>
						</InfoBox>
					</>
				) : (
					<></>
				)}
				{currentRound.type === 'handout' ? (
					<>
						<button className="btn btn-primary" onClick={showHandoutAnswers}>
							Open answer key
						</button>
					</>
				) : (
					<></>
				)}
				<Timer defaultValue={currentRound.timer * 1000} />
				{currentRound.type !== 'tiebreaker' ? (
					<InfoBox
						className={'mt-2'}
						title={`Submissions: ${submissionCount}/${activeTeams} ${submissionCount >= activeTeams && activeTeams !== 0 ? '✅' : ''}`}
					></InfoBox>
				) : (
					<></>
				)}

				<div className="d-flex flex-row">
					<Button className="me-2" onClick={showScoreModal}>
						View Scores
					</Button>
					{submissionCount >= activeTeams && activeTeams > 0 ? (
						currentRound.type === 'wager' &&
						selectedQuestion !== currentRound.questions.length - 1 ? (
							<Button onClick={nextQuestion}>Next Question</Button>
						) : (
							<Button onClick={nextRound}>Next Round</Button>
						)
					) : (
						<></>
					)}
				</div>
			</div>
		);
	}
}
