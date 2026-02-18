import { useContext } from 'react';
import '../css/Message.css';

import { MessageContext } from '../contexts/MessageContext';
export default function Message() {
	const { message } = useContext(MessageContext);
	return (
		<div
			className={`message-div ${!message?.shown ? 'd-none' : message.status}`}
		>
			{message.message}
		</div>
	);
}
