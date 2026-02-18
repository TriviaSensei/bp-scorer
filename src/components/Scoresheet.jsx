import { useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { GameDataContext } from '../contexts/GameDataContext';
import { GameScoreContext } from '../contexts/GameScoreContext';
import { MessageContext } from '../contexts/MessageContext';
import { SelectionContext } from '../contexts/SelectionContext';
import { AnnouncementsContext } from '../contexts/AnnouncementsContext';
import AnnouncementsModal from './AnnouncementsModal';

import '../css/Scoresheet.css';
import MenuBar from './Scoresheet/MenuBar';
import TeamForm from './Scoresheet/TeamForm';

export default function Scoresheet() {
	const { gameData, setGameData } = useContext(GameDataContext);
	const { gameScore, setGameScore } = useContext(GameScoreContext);
	const { showMessage } = useContext(MessageContext);
	const [selectedRound, setSelectedRound] = useState(null);
	const [selectedQuestion, setSelectedQuestion] = useState(null);
	const [selectedTeam, setSelectedTeam] = useState(null);

	const setCurrentQuestion = (q) => {
		if (selectedRound === null) return;
		const selectedRoundData = gameData?.dataFile?.data?.rounds[selectedRound];
		if (!selectedRoundData) return;
		const questionDisabled =
			selectedRound === -1 || isNaN(Number(selectedRoundData.round));
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
		const questionDisabled =
			round === -1 || isNaN(Number(selectedRoundData.round));
		setSelectedRound(round);
		setSelectedQuestion(questionDisabled ? -1 : 0);
	};

	const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);
	const handleCloseAnnouncementsModal = () => {
		if (selectedRound === null && selectedQuestion === null) {
			setSelectedRound(-1);
			setSelectedQuestion(-1);
		}
		setShowAnnouncementsModal(false);
	};

	const menuItems = useMemo(() => {
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

		const debugStuff = () => {
			console.log('Debug function');
			console.log(selectedRound, selectedQuestion);
		};

		const handleMenuClick = (e) => {
			console.log(e);
			console.log(selectedRound, selectedQuestion);
			console.log(gameData.dataFile.data);
		};
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
						title: 'Add Team...',
						shortcut: {
							altKey: false,
							ctrlKey: true,
							shiftKey: true,
							key: '+',
							keyDisplay: '+',
						},
						fn: handleMenuClick,
						disabled: false,
					},
					{
						title: 'Close game',
						shortcut: {
							altKey: false,
							ctrlKey: true,
							key: 'Q',
						},
						fn: closeGame,
						disabled: false,
					},
					{
						title: 'Debug',
						shortcut: {
							altKey: false,
							ctrlKey: true,
							key: '.',
						},
						fn: debugStuff,
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
						fn: handleMenuClick,
					},
					{
						title: 'Mark team inactive',
						shortcut: {
							altKey: false,
							ctrlKey: true,
							key: '-',
						},
						fn: handleMenuClick,
					},
					{
						title: 'Delete team',
						shortcut: {
							altKey: true,
							ctrlKey: true,
							key: 'Backspace',
							keyDisplay: 'Bksp',
						},
						fn: handleMenuClick,
					},
				],
				disabled: false,
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
							if (newRound !== -1 && !isNaN(Number(data[newRound].round)))
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
							if (!isNaN(Number(data[newRound].round))) setSelectedQuestion(0);
							else setSelectedQuestion(-1);
						},
						disabled: () => {
							const data = gameData?.dataFile?.data?.rounds;
							return selectedRound >= data.length - 1;
						},
					},
				],
				disabled: false,
			},
		];
	}, [showMessage, setGameData, gameData, selectedRound, selectedQuestion]);

	const handleKey = useCallback(
		(e) => {
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
		document.addEventListener('keydown', handleKey);
		return () => {
			document.removeEventListener('keydown', handleKey);
		};
	}, [handleKey]);

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
						1500,
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
		}
	}, []);
	return (
		<div id="scoresheet" className="container">
			<AnnouncementsContext.Provider value={setShowAnnouncementsModal}>
				<SelectionContext.Provider
					value={{
						selectedRound,
						selectedQuestion,
						setCurrentRound,
						setCurrentQuestion,
					}}
				>
					<AnnouncementsModal
						onHide={handleCloseAnnouncementsModal}
						show={
							showAnnouncementsModal ||
							(selectedRound === null && selectedQuestion === null)
						}
					/>
					<MenuBar items={menuItems} />
					{selectedRound !== null ? <TeamForm /> : ''}
				</SelectionContext.Provider>
			</AnnouncementsContext.Provider>
		</div>
	);
}
