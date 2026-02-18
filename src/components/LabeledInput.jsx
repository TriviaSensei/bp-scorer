import React from 'react';

import '../css/LabeledInput.css';

export default function LabeledInput(props) {
	const handleChange = (e) => {
		if (props.ls) localStorage.setItem(`bp-${props.name}`, e.target.value);
		if (props.onChange) props.onChange(e);
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
				value={props.value}
				defaultValue={defaultValue}
				onChange={handleChange}
			/>
		</div>
	);
}
