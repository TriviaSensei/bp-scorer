import { useContext } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import '../../css/TeamForm.css';
import { GameDataContext } from '../../contexts/GameDataContext';
import { SelectionContext } from '../../contexts/SelectionContext';
export default function TeamForm() {
	const {
		selectedRound,
		selectedQuestion,
		setCurrentRound,
		setCurrentQuestion,
	} = useContext(SelectionContext);
	const { gameData } = useContext(GameDataContext);

	const handleSubmit = () => {};

	const handleRoundChange = (e) => setCurrentRound(Number(e.target.value));
	const handleQuestionChange = (e) =>
		setCurrentQuestion(Number(e.target.value));

	const selectedRoundData = gameData?.dataFile?.data?.rounds[selectedRound];
	const questionDisabled =
		selectedRound.toString() === '-1' ||
		isNaN(Number(selectedRoundData?.round));

	return (
		<Container>
			<form id="data-entry-form" onSubmit={handleSubmit}>
				<Row sm={1} md={2} lg={4}>
					<Col>
						<div className="d-flex flex-row">
							<div className="labeled-input">
								<div className="input-label">Round</div>
								<select
									id="round-select"
									onChange={handleRoundChange}
									value={selectedRound}
								>
									<option value="-1">Pregame</option>
									{gameData.dataFile.data.rounds.map((rd, i) => {
										return (
											<option key={i} value={i}>
												{(typeof rd.round).toLowerCase() === 'number'
													? 'Round ' + rd.round
													: rd.round}
											</option>
										);
									})}
								</select>
							</div>

							<div className="labeled-input">
								<div className="input-label">Question</div>
								<select
									id="question-select"
									onChange={handleQuestionChange}
									value={questionDisabled ? -1 : selectedQuestion}
									disabled={questionDisabled}
								>
									{questionDisabled ? <option value="-1">--</option> : ''}
									{[0, 1, 2, 3].map((n, i) => {
										return (
											<option value={n} key={i}>
												{n + 1}
											</option>
										);
									})}
								</select>
							</div>
						</div>
					</Col>
					<Col>
						<div className="labeled-input">
							<div className="input-label">Team</div>
							<input type="text"></input>
						</div>
					</Col>
				</Row>
			</form>
		</Container>
	);
}
