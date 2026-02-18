import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import { GameScoreContext } from '../../contexts/GameScoreContext';
import { GameDataContext } from '../../contexts/GameDataContext';
import '../../css/MenuBar.css';
import { MessageContext } from '../../contexts/MessageContext';
import { AnnouncementsContext } from '../../contexts/AnnouncementsContext';
import { SelectionContext } from '../../contexts/SelectionContext';
export default function MenuBar(props) {
	const menuItems = props.items;

	return (
		<Navbar id="menu-bar" expand="lg" className="">
			<Container>
				<Navbar.Toggle aria-controls="basic-navbar-nav" />
				<Navbar.Collapse id="basic-navbar-nav">
					<Nav className="me-auto">
						{menuItems.map((item, i) => {
							let disabled = false;
							switch ((typeof item.disabled).toLowerCase()) {
								case 'boolean':
									disabled = item.disabled;
									break;
								case 'function':
									disabled = item.disabled();
									break;
								default:
									disabled = false;
							}
							return (
								<NavDropdown
									key={i}
									title={item.title}
									id={`${item.title.toLowerCase()}-menu-dropdown`}
									disabled={disabled}
								>
									{item.options.map((option, j) => {
										let disabled = false;
										switch ((typeof option.disabled).toLowerCase()) {
											case 'boolean':
												disabled = option.disabled;
												break;
											case 'function':
												disabled = option.disabled();
												break;
											default:
												disabled = false;
										}
										let shortcut = '';
										if (option.shortcut.key) {
											shortcut =
												option.shortcut.keyDisplay ||
												option.shortcut.key.toUpperCase();
											if (option.shortcut.altKey) shortcut = 'Alt+' + shortcut;
											if (option.shortcut.shiftKey)
												shortcut = 'Shift+' + shortcut;
											if (option.shortcut.ctrlKey)
												shortcut = 'Ctrl+' + shortcut;
										}
										return (
											<NavDropdown.Item
												key={j}
												href=""
												disabled={disabled}
												onClick={option.fn || null}
											>
												<div className="d-flex flex-row justify-content-between menu-option">
													<div className="menu-option-name">{option.title}</div>
													{shortcut !== '' ? (
														<div className="menu-option-shortcut">
															{shortcut}
														</div>
													) : (
														''
													)}
												</div>
											</NavDropdown.Item>
										);
									})}
								</NavDropdown>
							);
						})}
					</Nav>
				</Navbar.Collapse>
			</Container>
		</Navbar>
	);
}
