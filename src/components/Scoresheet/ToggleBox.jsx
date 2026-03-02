import '../../css/ToggleBox.css';

export default function ToggleBox(props) {
	return (
		<div className="toggle-box no-select">
			<input
				type="checkbox"
				onChange={props.onChange}
				id={props.id}
				checked={props.checked}
			></input>
			<label htmlFor={props.id}>
				<div className="me-2 my-auto">{props.label}</div>
				<div
					className="switch-container"
					style={{
						borderColor: props.borderColor,
						backgroundColor: props.checked
							? props.onBackgroundColor
							: props.offBackgroundColor,
					}}
				>
					<div
						className="switch"
						style={{
							borderColor: props.switchBorderColor,
							backgroundColor: props.checked
								? props.onSwitchColor
								: props.offSwitchColor,
						}}
					></div>
				</div>
			</label>
		</div>
	);
}
