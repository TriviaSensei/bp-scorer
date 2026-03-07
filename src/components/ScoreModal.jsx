import { useContext } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

import { GameDataContext } from '../contexts/GameDataContext';
import { SelectionContext } from '../contexts/SelectionContext';
import { GameScoreContext } from '../contexts/GameScoreContext';

import '../css/ScoreModal.css';

export default function ScoreModal(props) {
	const { rankings } = useContext(GameScoreContext);

	return (
		<Modal
			{...props}
			size="md"
			id="score-modal"
			aria-labelledby="score-modal-title"
			centered
		>
			<Modal.Header closeButton>
				<Modal.Title id="score-modal-title">Current Standings</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<table>
					<thead>
						<tr>
							<th>Rank</th>
							<th>Team</th>
							<th>Score</th>
						</tr>
					</thead>
					<tbody>
						{rankings.length === 0 ? (
							<tr>
								<td colSpan={'3'}>No teams added</td>
							</tr>
						) : (
							rankings.map((team, i) => {
								return (
									<tr key={i} className={`${team.active ? '' : 'inactive'}`}>
										<td>{team.rank}</td>
										<td>{team.name}</td>
										<td>{team.score}</td>
									</tr>
								);
							})
						)}
					</tbody>
				</table>
			</Modal.Body>
			<Modal.Footer>
				<Button onClick={props.onHide}>Close</Button>
			</Modal.Footer>
		</Modal>
	);
}
