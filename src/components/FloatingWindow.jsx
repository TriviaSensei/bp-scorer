import React, { useState } from 'react';
import '../css/FloatingWindow.css';
export default function FloatingWindow(props) {
	const [mouseState, setMouseState] = useState({
		moving: false,
		oldX: null,
		oldY: null,
	});
	const { position, setPosition } = props;
	const handleMove = (e) => {
		if (!mouseState.moving) return;
		console.log(e.pageX, e.pageY);
		const dx = e.pageX - mouseState.oldX;
		const dy = e.pageY - mouseState.oldY;
		setMouseState((prev) => {
			return {
				...prev,
				oldX: prev.oldX + dx,
				oldY: prev.oldY + dy,
			};
		});
		setPosition((prev) => {
			return {
				x: prev.x + dx,
				y: prev.y + dy,
			};
		});
	};
	const handleStopMoving = () => {
		if (!mouseState.moving) return;
		setMouseState({
			moving: false,
			oldX: null,
			oldY: null,
		});
	};

	const handleStartMoving = (e) => {
		if (mouseState.moving) return;
		setMouseState({
			moving: true,
			oldX: e.pageX,
			oldY: e.pageY,
		});
	};

	return (
		<div
			className="floating-window"
			style={{ left: position.x, top: position.y }}
		>
			<div
				className="title-bar no-select"
				onMouseDown={handleStartMoving}
				onMouseUp={handleStopMoving}
				onMouseMove={handleMove}
				onMouseOut={handleStopMoving}
			>
				<div className="m-auto">{props.title || ''}</div>
			</div>
			<div className="window-body">{props.children}</div>
		</div>
	);
}
