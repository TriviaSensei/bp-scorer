import { useContext, useMemo } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

import { SelectionContext } from '../contexts/SelectionContext';
import { GameScoreContext } from '../contexts/GameScoreContext';
import { MessageContext } from '../contexts/MessageContext';
export default function DeleteTeamModal(props) {
	const { gameScore, setGameScore } = useContext(GameScoreContext);
	const { selectedTeam, selectedRound } = useContext(SelectionContext);
	const { showMessage } = useContext(MessageContext);
	const teamData = useMemo(() => {
		if (!selectedTeam) return null;
		const team = gameScore?.find((t) => t.id === selectedTeam);
		if (!team) return null;
		return team;
	}, [gameScore, selectedTeam]);

	const deleteTeam = () => {
		if (selectedRound >= 0) return;
		let teamDeleted = '';
		setGameScore((prev) => {
			return prev.filter((t) => {
				if (t.id !== selectedTeam) return true;
				else {
					teamDeleted = t.name;
					return false;
				}
			});
		});
		if (teamDeleted) showMessage('info', `Team ${teamDeleted} deleted`);
		else showMessage('error', `Something went wrong - team was not found`);
		props.onHide();
	};

	const setInactive = () => {
		setGameScore((prev) => {
			const newScore = [...prev];
			newScore.some((team) => {
				if (team.id === selectedTeam) {
					team.active = false;
					return true;
				}
			});
			return newScore;
		});
		props.onHide();
	};

	const errMsg =
		'For data-keeping reasons, teams should only be deleted "pregame", if entered mistakenly. If you wish to delete this team, switch to the "pregame" round first. If a team has left before the end of the game, you may set them to "inactive" instead';

	return (
		<Modal {...props} size="lg" aria-labelledby="delete-modal-title" centered>
			<Modal.Header closeButton>
				<Modal.Title id="delete-modal-title">Delete Team</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				{selectedRound >= 0
					? errMsg
					: `Are you sure you wish to delete "${teamData?.name || 'this team'}"? All of their data for this game will be erased. This cannot be undone.`}
			</Modal.Body>
			<Modal.Footer>
				<Button variant={'warning'} onClick={setInactive}>
					Set Inactive
				</Button>
				{selectedRound < 0 ? (
					<Button onClick={deleteTeam} variant={'danger'}>
						Delete
					</Button>
				) : (
					<></>
				)}
				<Button variant={'secondary'} onClick={props.onHide}>
					Cancel
				</Button>
			</Modal.Footer>
		</Modal>
	);
}
