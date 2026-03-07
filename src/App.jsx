import './App.css';
import { useState, useMemo } from 'react';

import moment from 'moment-timezone';

import { GameScoreContext } from './contexts/GameScoreContext';
import { GameDataContext } from './contexts/GameDataContext';
import { MessageContext } from './contexts/MessageContext';

import GameSetup from './components/GameSetup';
import Message from './components/Message';
import GameDataErrorModal from './components/GameDataErrorModal';
import Scoresheet from './components/Scoresheet';
function App() {
	const tz = moment.tz.guess();
	const today = moment.tz(new Date(), tz).format().split('T')[0];

	const [gameData, setGameData] = useState({
		date: today,
		host: localStorage.getItem('bp-host-name') || '',
		venue: localStorage.getItem('bp-venue-name') || '',
		location: localStorage.getItem('bp-venue-location') || '',
		dataFile: null,
		answerFile: null,
		audioFile: null,
		errors: [],
		rules: [
			"Don't cheat! We want to know what you know, we don't care how fast you can look it up! Please keep your phones stowed away while questions are live!",
			"Don't shout out the answers! We're playing for prizes! If you're not playing, you should be, and if you are, the other teams don't need your help!",
			'Have fun, and as always, feel free to ask if you have any questions!',
		],
	});

	const [gameScore, setGameScore] = useState([]);
	const [message, setMessage] = useState({
		shown: false,
		message: '',
		status: 'info',
		timeout: null,
	});

	const rankings = useMemo(() => {
		const rs = gameScore
			.map((team) => {
				const score = team.scores.reduce((p, rd) => {
					const roundScore = rd.scores.reduce((p2, c) => {
						if (!c) return p2;
						else if ((typeof c).toLowerCase() === 'number') return p2 + c;
						return p2 + c.score;
					}, 0);
					return p + roundScore;
				}, 0);
				return {
					name: team.name,
					active: team.active,
					score,
				};
			})
			.sort((a, b) => b.score - a.score);
		for (var i = 0; i < rs.length; i++) {
			if (i === 0 || rs[i].score !== rs[i - 1].score) rs[i].rank = i + 1;
			else rs[i].rank = rs[i - 1].rank;
		}
		return rs;
	}, [gameScore]);

	const hideMessage = () => {
		if (message.timeout) clearTimeout(message.timeout);
		setMessage({
			shown: false,
			message: '',
			status: 'info',
			timeout: null,
		});
	};

	const showMessage = (status, message, duration) => {
		hideMessage();
		const d = duration || 1000;
		setMessage({
			shown: true,
			message,
			status,
			timeout: setTimeout(hideMessage, d),
		});
	};

	const handleCloseErrorModal = () => {
		setGameData((prev) => {
			return {
				...prev,
				errors: [],
			};
		});
	};

	const setGameDataField = (field) => {
		return (e) => {
			setGameData((prev) => {
				const newData = {
					...prev,
				};
				newData[field] = e.target.value;
				return newData;
			});
		};
	};

	return (
		<GameDataContext.Provider
			value={{ gameData, setGameData, setGameDataField }}
		>
			<GameScoreContext.Provider value={{ gameScore, setGameScore, rankings }}>
				<MessageContext.Provider value={{ message, showMessage }}>
					<GameDataErrorModal
						onHide={handleCloseErrorModal}
						show={gameData?.errors?.length > 0}
					/>

					<Message />
					{gameData?.dataFile && gameData?.answerFile && gameData?.audioFile ? (
						<Scoresheet />
					) : (
						<GameSetup />
					)}
				</MessageContext.Provider>
			</GameScoreContext.Provider>
		</GameDataContext.Provider>
	);
}

export default App;
