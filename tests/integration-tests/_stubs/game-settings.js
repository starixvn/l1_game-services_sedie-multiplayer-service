export default {
    id: 148,
    name: "SeDieMultiplayer",
    durations: {
        wholeRound: 23,
        placingBets: 18,
        lockingBet: 3,
        shakeThePlateDuration: 1,
    },
    choices: ["even", "odd", "red3", "red4", "white3", "white4", "red2"],
    choicesMapper: { even: 1, odd: 2, red3: 3, red4: 4, white3: 5, white4: 6, red2: 7 },
    hedgeBetGroups: [["even", "odd"]],
    provablyFair: true,
};
