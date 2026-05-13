const wagers = [1, 3, 5, 7];
const maxHandoutScore = 10;
const defaultTime = 120;
const handoutTime = 240;
const audioTime = 30;
const maxFinalWager = 15;

const rounds = [];

const otherRounds = [
	{
		type: 'handout',
		title: 'Handout',
		maxScore: maxHandoutScore,
		timer: handoutTime,
	},
	{
		type: 'handout',
		title: 'Picture',
		maxScore: maxHandoutScore,
		timer: handoutTime,
	},
	{
		type: 'audio',
		title: 'Audio',
		maxScore: 14,
		timer: audioTime,
	},
	{
		type: '3PQ',
		title: '3-Part Q',
		maxScore: 9,
		timer: defaultTime,
	},
	{
		type: 'final',
		title: 'Final',
		maxScore: maxFinalWager,
		minScore: -maxFinalWager,
		timer: defaultTime,
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
	rounds.push(otherRounds[i - 1]);
}
rounds.push({
	type: 'tiebreaker',
	title: 'Tiebreaker',
	timer: 30,
});

export default rounds;
