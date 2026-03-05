import { useContext, useMemo } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

import { GameDataContext } from '../contexts/GameDataContext';
import { SelectionContext } from '../contexts/SelectionContext';
import { GameScoreContext } from '../contexts/GameScoreContext';

import '../css/ScoreModal.css';

export default function ScoreModal(props) {
	const { gameData } = useContext(GameDataContext);
	const { gameScore } = useContext(GameScoreContext);
	const { selectedRound } = useContext(SelectionContext);

	const rankings = useMemo(() => {
		const rs = gameScore
			.map((team) => {
				const score = team.scores.reduce((p, rd, i) => {
					if (i > selectedRound) return p;
					return (
						p +
						rd.scores.reduce((p2, c) => {
							if (!c) return p2;
							else if ((typeof c).toLowerCase() === 'number') return p2 + c;
							return p + c.score;
						}, 0)
					);
				}, 0);
				return {
					name: team.name,
					score,
				};
			})
			.sort((a, b) => b.score - a.score);
		for (var i = 0; i < rs.length; i++) {
			if (i === 0 || rs[i].score !== rs[i - 1].score) rs[i].rank = i + 1;
			else rs[i].rank = rs[i - 1].rank;
		}
		return rs;
	}, [selectedRound, gameScore]);

	const currentRound = useMemo(() => {
		return gameData?.dataFile?.data?.rounds[selectedRound];
	}, [selectedRound, gameData]);

	return (
		<Modal
			{...props}
			size="md"
			id="score-modal"
			aria-labelledby="score-modal-title"
			centered
		>
			<Modal.Header closeButton>
				<Modal.Title id="score-modal-title">{`Standings ${currentRound ? `(after ${currentRound.title}${currentRound.type === 'wager' ? '' : ' round'})` : ''}`}</Modal.Title>
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
									<tr key={i}>
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
