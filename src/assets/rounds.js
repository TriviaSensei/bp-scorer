const wagers = [1, 3, 5, 7];
const maxHandoutScore = 10;
const rounds = [];
const maxFinalWager = 15;

const otherRounds = [
	{
		type: 'handout',
		title: 'Handout',
		maxScore: maxHandoutScore,
		timer: 300,
	},
	{
		type: 'handout',
		title: 'Picture',
		maxScore: maxHandoutScore,
		timer: 300,
	},
	{
		type: 'audio',
		title: 'Audio',
		maxScore: 14,
		timer: 30,
	},
	{
		type: '3PQ',
		title: '3-Part Q',
		maxScore: 9,
		timer: 120,
	},
	{
		type: 'final',
		title: 'Final',
		maxScore: maxFinalWager,
		minScore: -maxFinalWager,
		timer: 120,
	},
];

for (var i = 1; i <= 5; i++) {
	rounds.push({
		type: 'wager',
		title: `Round ${i}`,
		wagers,
		questions: [],
		timer: 120,
	});
	rounds.push(otherRounds.shift());
}
rounds.push({
	type: 'tiebreaker',
	title: 'Tiebreaker',
});

export default rounds;
