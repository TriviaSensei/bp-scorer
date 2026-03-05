import { useContext } from 'react';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import { TimerContext } from '../contexts/TimerContext';
import '../css/Timer.css';

export default function Timer() {
	const { timerState, setTimerState, toggleTimer, resetTimer } =
		useContext(TimerContext);

	const editMinutes = [-1, 1];
	const editSeconds = [-10, -1, 1, 10];
	const disableModifiers = () => timerState.startTime !== null;
	const modifyTime = (sec) => {
		if (disableModifiers()) return;
		setTimerState((prev) => {
			return {
				...prev,
				startValue:
					prev.startValue === prev.lastValue
						? Math.max(0, prev.startValue + sec * 1000)
						: prev.startValue,
				lastValue: Math.max(0, prev.lastValue + sec * 1000),
				timeLeft: Math.max(0, prev.timeLeft + sec),
			};
		});
	};

	return (
		<div className="timer-container">
			<div
				className={`m-auto me-2 f-1 timer ${timerState.timeLeft <= 0 ? 'time-up' : timerState.timeLeft <= 15 ? 'low-time' : ''}`}
			>{`${Math.floor(timerState.timeLeft / 60)}:${(timerState.timeLeft % 60).toString().padStart(2, 0)}`}</div>
			<div className="d-flex flex-column">
				<div className="d-flex flex-row mb-2">
					<Button
						onClick={toggleTimer}
						size={'sm'}
						disabled={timerState.timeLeft <= 0}
						className={'me-2'}
					>
						{timerState.startTime ? 'Stop' : 'Start'}
					</Button>
					<Button
						onClick={resetTimer}
						size={'sm'}
						disabled={timerState.startTime}
					>
						Reset
					</Button>
				</div>
				<div className="d-flex flex-row">
					<div className="me-2 d-flex flex-column align-items-center">
						<div className="button-label">Minutes</div>
						<ButtonGroup size={'sm'}>
							{editMinutes.map((el, i) => {
								return (
									<Button
										key={i}
										onClick={() => modifyTime(el * 60)}
										disabled={disableModifiers()}
									>
										{el <= 0 ? el : `+${el}`}
									</Button>
								);
							})}
						</ButtonGroup>
					</div>
					<div className="me-2 d-flex flex-column align-items-center">
						<div className="button-label">Seconds</div>
						<ButtonGroup size={'sm'}>
							{editSeconds.map((el, i) => {
								return (
									<Button
										key={i}
										onClick={() => modifyTime(el)}
										disabled={disableModifiers()}
									>
										{el <= 0 ? el : `+${el}`}
									</Button>
								);
							})}
						</ButtonGroup>
					</div>
				</div>
			</div>
		</div>
	);
}
