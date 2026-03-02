import { useContext, useRef, useMemo } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

import { GameScoreContext } from '../contexts/GameScoreContext';
import LabeledInput from './LabeledInput';
import { SelectionContext } from '../contexts/SelectionContext';
import { MessageContext } from '../contexts/MessageContext';
import { GameDataContext } from '../contexts/GameDataContext';

export default function GameDataErrorModal(props) {
	const { gameScore, setGameScore } = useContext(GameScoreContext);
	const { gameData } = useContext(GameDataContext);
	const { selectedTeam, selectedRound } = useContext(SelectionContext);
	const { showMessage } = useContext(MessageContext);

	const formRef = useRef();

	const handleSave = () => {
		const form = formRef.current;
		if (!form) return;
		const formData = new FormData(form);
		let data = {};
		for (const [key, value] of formData) {
			data[key] = isNaN(Number(value)) ? value : Number(value);
		}
		if (data.active === 'true') data.active = true;
		else data.active = false;

		if (!data.name)
			return showMessage('error', 'Team name may not be left blank');

		const rounds = gameData?.dataFile?.data?.rounds;

		if (data.playerCount < 0)
			return showMessage('error', 'Player count must be positive');
		else if (rounds) {
			const firstHandout = rounds.findIndex((rd) => rd.type !== 'wager');
			if (selectedRound >= firstHandout && data.playerCount <= 0)
				return showMessage('error', 'Player count must be positive');
		}

		setGameScore((prev) => {
			const newScore = [...prev];
			newScore.some((team) => {
				if (team.id === selectedTeam) {
					team.name = data.name;
					team.playerCount = Number(data.playerCount);
					team.active = data.active;
					return true;
				}
			});
			return newScore;
		});
		props.onHide();
	};

	const handleKey = (e) => {
		const key = e.key.toLowerCase();
		if (key === 'enter' || key === 'return') handleSave();
	};

	const getSelectedTeam = useMemo(() => {
		return gameScore.find((t) => t.id === selectedTeam);
	}, [selectedTeam, gameScore]);

	return (
		<Modal
			{...props}
			size="md"
			id="team-info-modal"
			aria-labelledby="team-info-modal-title"
			centered
		>
			<Modal.Header closeButton>
				<Modal.Title id="team-info-modal-title">{`Team Info`}</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<form
					id="team-info-form"
					ref={formRef}
					onSubmit={handleSave}
					onKeyDown={handleKey}
				>
					<div className="d-flex flex-column mb-2">
						<div className="input-label">Team Name</div>
						<input
							type="text"
							name="name"
							defaultValue={getSelectedTeam?.name || ''}
						/>
					</div>
					<div className="d-flex flex-column mb-2">
						<div className="input-label">Player count</div>
						<input
							type="number"
							name="playerCount"
							defaultValue={getSelectedTeam?.playerCount || 0}
						/>
					</div>
					<div className="d-flex flex-row">
						<label htmlFor="team-active" className="me-2">
							Active
						</label>
						<input
							type="checkbox"
							id="team-active"
							name="active"
							value={true}
							defaultChecked={getSelectedTeam?.active}
						/>
					</div>
				</form>
			</Modal.Body>
			<Modal.Footer>
				<Button variant={'secondary'} onClick={props.onHide}>
					Close
				</Button>
				<Button variant={'primary'} onClick={handleSave}>
					Save
				</Button>
			</Modal.Footer>
		</Modal>
	);
}
