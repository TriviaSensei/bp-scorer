import { useContext } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

import { GameDataContext } from '../contexts/GameDataContext';
import { GameScoreContext } from '../contexts/GameScoreContext';

import '../css/AnnouncementsModal.css';

export default function GameDataErrorModal(props) {
	const { gameData } = useContext(GameDataContext);
	const { gameScore } = useContext(GameScoreContext);
	const postGame = gameScore.some((team) =>
		team.scores.some((item) => {
			return (typeof item.round).toLowerCase() === 'number' && item.round > 4;
		}),
	);
	const announcements = postGame
		? gameData?.dataFile?.data?.postAnnouncements || []
		: gameData?.dataFile?.data?.announcements || [];
	const rules = gameData?.rules || [];
	return (
		<Modal
			{...props}
			size="lg"
			id="announcements-modal"
			aria-labelledby="error-modal-title"
			centered
		>
			<Modal.Header closeButton>
				<Modal.Title id="error-modal-title">
					{`${postGame ? 'Postgame announcements' : 'Announcements and rules'}`}
				</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				{postGame ? '' : <h6>Announcements</h6>}
				<ul>
					{announcements.map((a, i) => {
						return <li key={i}>{a}</li>;
					})}
				</ul>
				{postGame ? (
					''
				) : (
					<>
						<h6>Rules</h6>
						<ul>
							{rules.map((r, i) => {
								return <li key={i}>{r}</li>;
							})}
						</ul>
					</>
				)}
			</Modal.Body>
			<Modal.Footer>
				<Button onClick={props.onHide}>Close</Button>
			</Modal.Footer>
		</Modal>
	);
}
