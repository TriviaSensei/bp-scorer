import { useContext } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

import { GameDataContext } from '../contexts/GameDataContext';
export default function GameDataErrorModal(props) {
	const { gameData } = useContext(GameDataContext);
	return (
		<Modal {...props} size="lg" aria-labelledby="error-modal-title" centered>
			<Modal.Header closeButton>
				<Modal.Title id="error-modal-title">Game Data Errors</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<h6>Problems were encountered loading the game file.</h6>
				<ul>
					{gameData.errors.map((error, i) => {
						return (
							<li key={i}>
								{`${error.row ? `Row ${error.row}: ${error.message}` : error.message}`}
							</li>
						);
					})}
				</ul>
			</Modal.Body>
			<Modal.Footer>
				<Button onClick={props.onHide}>Close</Button>
			</Modal.Footer>
		</Modal>
	);
}
