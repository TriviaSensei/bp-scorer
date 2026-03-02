import { useContext } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

import { GameDataContext } from '../contexts/GameDataContext';

import '../css/HandoutModal.css';

export default function GameDataErrorModal(props) {
	const { gameData } = useContext(GameDataContext);

	return (
		<Modal {...props} fullscreen={true} onHide={props.onHide}>
			<Modal.Header closeButton>
				<Modal.Title id="handout-modal-title">{'Handout answers'}</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				{gameData?.answerFile?.data ? (
					<embed src={gameData.answerFile.data} type="application/pdf" />
				) : (
					<></>
				)}
			</Modal.Body>
			<Modal.Footer>
				<Button onClick={props.onHide}>Close</Button>
			</Modal.Footer>
		</Modal>
	);
}
