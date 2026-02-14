import './App.css';
import { useState } from 'react';

import { GameScoreContext } from './contexts/GameScoreContext';
import { GameDataContext } from './contexts/GameDataContext';
import { MessageContext } from './contexts/MessageContext';
import GameSetup from './components/GameSetup';
import Message from './components/Message';
function App() {
	const [gameData, setGameData] = useState({
		date: null,
		host: '',
		venue: '',
		dataFile: null,
		answerFile: null,
		audioFile: null,
		currentRound: null,
		currentQuestion: null,
	});
	const [gameScore, setGameScore] = useState(null);
	const [message, setMessage] = useState({
		shown: false,
		message: '',
		status: 'info',
		timeout: null,
	});

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

	return (
		<GameDataContext.Provider value={{ gameData, setGameData }}>
			<GameScoreContext.Provider value={{ gameScore, setGameScore }}>
				<MessageContext.Provider value={{ message, showMessage }}>
					<Message />
					{gameData.dataFile && gameData.answerFile && gameData.audioFile ? (
						'hello'
					) : (
						<GameSetup />
					)}
				</MessageContext.Provider>
			</GameScoreContext.Provider>
		</GameDataContext.Provider>
	);
}

export default App;
