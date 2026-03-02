import { useContext, useMemo, Fragment, useEffect, useRef } from 'react';
import { GameScoreContext } from '../../contexts/GameScoreContext';
import { GameDataContext } from '../../contexts/GameDataContext';

import '../../css/ScoreTable.css';
import { SelectionContext } from '../../contexts/SelectionContext';

function useArrayRef() {
	const refs = [];
	return [refs, (el) => el && refs.push(el)];
}

export default function ScoreTable({ openTeamInfo }) {
	const { gameScore } = useContext(GameScoreContext);
	const { gameData } = useContext(GameDataContext);
	const { selectedTeam, setSelectedTeam, selectedRound } =
		useContext(SelectionContext);

	const divRef = useRef();
	const ulcRef = useRef();
	const [elements, ref] = useArrayRef();

	useEffect(() => {
		if (selectedRound < 0 || selectedRound > elements.length - 1) return;
		const el = elements[selectedRound];
		if (!el) return;
		// if (el) el.scrollIntoView();
		const leftColRect = ulcRef.current.getBoundingClientRect();
		const elRect = el.getBoundingClientRect();

		const leftPos = leftColRect.left + leftColRect.width;
		const diff = elRect.left - leftPos;
		divRef.current.scrollLeft += diff;
	}, [selectedRound, elements]);

	const data = gameData?.dataFile?.data?.rounds;

	const handleSelectTeam = (e) => {
		const id = e.target.getAttribute('data-id');
		const team = gameScore.find((t) => t.id === id);
		if (!team) return;
		if (selectedTeam === team.id) setSelectedTeam(null);
		else setSelectedTeam(team.id);
	};

	const handleDoubleClick = (e) => {
		const id = e.target.getAttribute('data-id');
		const team = gameScore.find((t) => t.id === id);
		if (!team) return;
		setSelectedTeam(team.id);
		openTeamInfo();
	};

	const runningScores = useMemo(() => {
		const rs = gameScore.map((team) => {
			let score = 0;
			const len = data.length - 1;
			const runningScore = team.scores.map((rd) => {
				score += rd.scores.reduce((p, c) => {
					if (!c) return p;
					else if ((typeof c).toLowerCase() === 'number') return p + c;
					return p + c.score;
				}, 0);
				return score;
			});
			while (runningScore.length < len) {
				runningScore.push(score);
			}
			return {
				name: team.name,
				id: team.id,
				runningScore,
			};
		});
		const toReturn = {};
		rs.forEach((team) => (toReturn[team.id] = team.runningScore));
		return toReturn;
	}, [gameScore, data]);

	const roundRankings = useMemo(() => {
		const toReturn = {};
		const elements = Object.getOwnPropertyNames(runningScores);
		const arr = elements.map((id) => {
			toReturn[id] = [];
			return {
				id,
				runningScore: runningScores[id],
			};
		});
		const len = data.length - 1;
		//for each round...
		for (var i = 0; i < len; i++) {
			//sort by that round's score and rank accordingly
			const sorted = arr.sort((a, b) => b.runningScore[i] - a.runningScore[i]);
			let currentRank = 0;
			sorted.forEach((team, j) => {
				if (j === 0 || team.runningScore[i] !== sorted[j - 1].runningScore[i])
					currentRank = j + 1;
				toReturn[team.id].push(currentRank);
			});
		}
		return toReturn;
	}, [runningScores, data]);

	if (!data) return <></>;
	let firstHandoutRound = data.findIndex((rd) => rd.type !== 'wager');
	return (
		<div id="score-table" className="no-select" ref={divRef}>
			<table>
				<thead>
					{/*Top header row - round headers*/}
					<tr>
						{/*Upper-left corner cell - should always be empty */}
						<th className="sticky ulc" ref={ulcRef}>
							<div className="team-name-col"></div>
						</th>
						{/*Rest of top row */}
						{data.map((rd, i) => {
							if (rd.type === 'wager')
								return (
									<Fragment key={i}>
										<th
											className="header-col-c question-header"
											colSpan={rd.questions.length * 2}
											ref={ref}
										>
											{rd.title}
										</th>
										<th></th>
										<th></th>
									</Fragment>
								);
							else if (i === firstHandoutRound) {
								return (
									<Fragment key={i}>
										<th ref={ref}></th>
										<th></th>
										<th></th>
									</Fragment>
								);
							} else
								return (
									<Fragment key={i}>
										<th ref={ref}></th>
										<th></th>
									</Fragment>
								);
						})}
					</tr>
					{/*Total player cell, question # headers, rowspan=2 headers for subtotals, ranks, players, handout rounds */}
					<tr>
						<th className="va-b sticky">{`Total Players: ${gameScore.reduce(
							(p, c) => {
								return p + (c.playerCount || 0);
							},
							0,
						)}`}</th>
						{data.map((rd, i) => {
							if (rd.type === 'wager') {
								return (
									<Fragment key={i}>
										{rd.questions.map((q, j) => {
											return (
												<td
													key={j}
													className="header-col-c dw question-header"
													colSpan="2"
												>
													{j + 1}
												</td>
											);
										})}
										<td
											className="header-col-l question-header subtotal-col rotate dw"
											rowSpan="2"
										>
											Score
										</td>
										<td
											className="header-col-l question-header rank-col rotate dw"
											rowSpan="2"
										>
											Rank
										</td>
									</Fragment>
								);
							} else if (i === firstHandoutRound) {
								return (
									<Fragment key={i}>
										<td
											className="header-col-l question-header rotate dw"
											rowSpan="2"
										>
											{rd.title}
										</td>
										<td
											className="player-count-header question-header rotate dw"
											rowSpan="2"
										>
											# Players
										</td>
										<td
											className="header-col-l question-header subtotal-col rotate dw "
											rowSpan="2"
										>
											Score
										</td>
									</Fragment>
								);
							} else if (rd.type !== 'tiebreaker') {
								return (
									<Fragment key={i}>
										<td
											className="header-col-l question-header rotate dw"
											rowSpan="2"
										>
											{rd.title}
										</td>
										<td
											className="header-col-l question-header subtotal-col rotate dw "
											rowSpan="2"
										>
											Score
										</td>
									</Fragment>
								);
							}
						})}
					</tr>
					{/*Pts/wager headers */}
					<tr>
						<th className="va-b sticky team-name-header">Team Name</th>
						{data.map((rd) => {
							if (rd.type === 'wager')
								return rd.questions.map((q, j) => {
									return (
										<Fragment key={j}>
											<td className="header-col points-header rotate">Pts</td>
											<td className="header-col wager-header rotate">Wager</td>
										</Fragment>
									);
								});
						})}
					</tr>
				</thead>
				<tbody>
					{gameScore.length === 0 ? (
						<tr>
							<td>No teams added</td>
						</tr>
					) : (
						gameScore.map((team, i) => {
							return (
								<tr
									key={i}
									className={`${!team.active ? 'inactive' : ''} ${selectedTeam === team.id ? 'selected' : ''}`}
								>
									<td
										data-id={team.id}
										className={`team-name ${!team.active ? 'inactive' : ''}`}
										onClick={handleSelectTeam}
										onDoubleClick={handleDoubleClick}
									>
										{`${!team.active ? `😴 ` : ''}${team.name}`}
									</td>
									{data.map((r, j) => {
										//the tiebreaker is in the data - nothing returned for that
										if (r.type === 'tiebreaker')
											return <Fragment key={j}></Fragment>;
										//get the corresponding round from the team's scores
										const teamRound = team.scores[j];
										//if we're looking at a regular 4-question round
										if (r.type === 'wager') {
											//we want to return 8 cells with the wager and score
											return (
												<Fragment key={j}>
													{teamRound.scores.map((s, k) => {
														//two empty cells for each question if the team has not played this round
														if (!(s >= 0))
															return (
																<Fragment key={k}>
																	<td></td>
																	<td></td>
																</Fragment>
															);

														const wager = teamRound.wagers[k];
														const invalidWager =
															wager !== null &&
															teamRound.wagers.some(
																(w, l) =>
																	(l !== k && w === wager) ||
																	!r.wagers.includes(wager),
															);
														//cell with points and wager if they've played this question
														return (
															<Fragment key={k}>
																<td>{s >= 0 ? s : ''}</td>
																<td
																	className={`${invalidWager ? 'error-cell' : ''}`}
																>
																	{wager === undefined ? '' : wager}
																</td>
															</Fragment>
														);
													})}
													{/*and then a score and rank cell */}
													<td className="subtotal-col">
														{runningScores[team.id][j]}
													</td>
													<td className="rank-col">
														{roundRankings[team.id][j]}
													</td>
												</Fragment>
											);
										}
										//handout/pic/music/3pq rounds
										else {
											return (
												<Fragment key={j}>
													<td
														className={
															teamRound.scores.length === 0
																? ''
																: (typeof teamRound.scores[0]).toLowerCase() ===
																	  'number'
																	? ''
																	: !teamRound.scores[0].valid
																		? 'error-cell'
																		: ''
														}
													>
														{teamRound.scores[0]?.score >= 0
															? teamRound.scores[0].score
															: ''}
													</td>
													{j === 1 ? (
														<td className="player-count-col">
															{team.playerCount || ''}
														</td>
													) : (
														''
													)}
													<td className="subtotal-col">
														{runningScores[team.id][j]}
													</td>
												</Fragment>
											);
										}
									})}
								</tr>
							);
						})
					)}
				</tbody>
			</table>
		</div>
	);
}
