import { useState, useMemo } from 'react';

export default function InfoBox(props) {
	const [hidden, setHidden] = useState(true);
	const hideText = () => setHidden(true);
	const showText = () => setHidden(false);
	const text = useMemo(() => {
		if (hidden && props.hideText)
			return props.hiddenText || '(Click and hold to view)';
		return props.children;
	}, [hidden, props.hideText, props.hiddenText, props.children]);

	return (
		<div className={`info-box ${props.className || ''}`}>
			<div className="title">{props.title}</div>
			<div
				className="info-text"
				onMouseDown={showText}
				onMouseUp={hideText}
				style={props.hideText ? { cursor: 'pointer' } : {}}
			>
				{text}
			</div>
		</div>
	);
}
