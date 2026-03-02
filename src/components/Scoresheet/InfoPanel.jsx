import { useContext, useMemo, useState } from 'react';
import { SelectionContext } from '../../contexts/SelectionContext';
import { GameDataContext } from '../../contexts/GameDataContext';
import { AnnouncementsContext } from '../../contexts/AnnouncementsContext';
import { HandoutContext } from '../../contexts/HandoutContext';

import InfoBox from './InfoBox';
import ToggleBox from './ToggleBox';
import LabeledInput from '../LabeledInput';
import '../../css/InfoPanel.css';

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
	const [hideAnswers, setHideAnswers] = useState(false);
	const toggleHideAnswers = () => setHideAnswers(!hideAnswers);

	const { selectedQuestion, selectedRound } = useContext(SelectionContext);
	const { gameData, setGameDataField } = useContext(GameDataContext);
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
	else if (
		currentRound.type === 'wager' ||
		currentRound.type === 'final' ||
		currentRound.type === 'tiebreaker'
	) {
		const currentQuestion =
			currentRound.type === 'wager'
				? currentRound.questions[selectedQuestion]
				: currentRound;
		return (
			<div className="d-flex flex-column align-items-start">
				<RoundHeader
					title={currentRound.title}
					toggleHideAnswers={toggleHideAnswers}
					hideAnswers={hideAnswers}
					answerToggle
				/>

				<InfoBox
					title={`Question ${selectedQuestion < 0 ? '' : selectedQuestion + 1}`}
				>
					{currentQuestion.text.split('\n').map((line, i) => {
						return <div key={i}>{line}</div>;
					})}
				</InfoBox>
				<InfoBox title={'Answer'} hideText={hideAnswers}>
					{currentQuestion.answer.split('\n').map((line, i) => {
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
			</div>
		);
	} else if (currentRound.type === 'audio') {
		return (
			<div className="d-flex flex-column align-items-start">
				<RoundHeader
					title={currentRound.title}
					toggleHideAnswers={toggleHideAnswers}
					hideAnswers={hideAnswers}
					answerToggle
				/>
				<audio src={gameData.audioFile.data} controls className="w-100"></audio>
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
			</div>
		);
	} else if (currentRound.type === 'handout') {
		return (
			<div className="d-flex flex-column align-items-start">
				<RoundHeader title={currentRound.title} />
				<button className="btn btn-primary" onClick={showHandoutAnswers}>
					Open answer key
				</button>
			</div>
		);
	} else if (currentRound.type === '3PQ') {
		return (
			<div className="d-flex flex-column align-items-start">
				<RoundHeader
					title={currentRound.title}
					toggleHideAnswers={toggleHideAnswers}
					hideAnswers={hideAnswers}
					answerToggle
				/>
				<InfoBox title={'Question'}>{currentRound.text}</InfoBox>
				<InfoBox title={'Answers'} hideText={hideAnswers}>
					{currentRound.answer.map((line, i) => {
						return <div key={i}>{line}</div>;
					})}
				</InfoBox>
			</div>
		);
	} else {
		return (
			<div className="d-flex flex-column align-items-start">
				<RoundHeader title={currentRound.title} />
			</div>
		);
	}
}
