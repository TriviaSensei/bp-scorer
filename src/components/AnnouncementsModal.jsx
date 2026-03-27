import { useContext } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

import { GameDataContext } from '../contexts/GameDataContext';
import { GameScoreContext } from '../contexts/GameScoreContext';
import { SelectionContext } from '../contexts/SelectionContext';
import '../css/AnnouncementsModal.css';

export default function GameDataErrorModal(props) {
	const { gameData } = useContext(GameDataContext);
	const { selectedRound } = useContext(SelectionContext);

	const round =
		selectedRound >= 0 ? gameData?.dataFile?.data?.rounds[selectedRound] : null;
	const finalRound = round?.type === 'final';
	const announcements = finalRound
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
				<Modal.Title id="announcements-modal-title">
					{`${finalRound ? 'Postgame announcements' : 'Announcements and rules'}`}
				</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				{finalRound ? '' : <h6>Announcements</h6>}
				<ul>
					{announcements.map((a, i) => {
						return <li key={i}>{a}</li>;
					})}
				</ul>
				{finalRound ? (
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
