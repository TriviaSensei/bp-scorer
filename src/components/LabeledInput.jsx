import React from 'react';

import '../css/LabeledInput.css';

export default function LabeledInput(props) {
	const handleLocalStorage = (e) => {
		localStorage.setItem(`bp-${props.name}`, e.target.value);
	};

	const defaultValue = props.defaultValue
		? props.defaultValue
		: props.name && props.ls && localStorage.getItem(`bp-${props.name}`)
			? localStorage.getItem(`bp-${props.name}`)
			: '';

	return (
		<div className="labeled-input-container">
			<div className="input-label">{props.label}</div>
			<input
				type={props.type || 'text'}
				name={props.name}
				defaultValue={defaultValue}
				onChange={props.ls ? handleLocalStorage : () => {}}
			/>
		</div>
	);
}
