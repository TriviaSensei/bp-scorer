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

	return (
		<Modal {...props} size="lg" aria-labelledby="delete-modal-title" centered>
			<Modal.Header closeButton>
				<Modal.Title id="delete-modal-title">Delete Team</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<p>
					For data-keeping reasons, teams should only be deleted if entered
					mistakenly.{' '}
					<strong>
						If a team has left before the end of the game, set them to inactive
						instead.
					</strong>
				</p>
				<p>
					Are you wish to delete "<span>{teamData?.name || 'this team'}</span>
					"? All of their data for this game will be erased.{' '}
					<strong>This cannot be undone.</strong>
				</p>
			</Modal.Body>
			<Modal.Footer>
				<Button variant={'warning'} onClick={setInactive}>
					Set inactive
				</Button>

				<Button onClick={deleteTeam} variant={'danger'}>
					{selectedRound < 0 ? 'Delete' : 'Delete anyway'}
				</Button>

				<Button variant={'secondary'} onClick={props.onHide}>
					Cancel
				</Button>
			</Modal.Footer>
		</Modal>
	);
}
