import { BET_CHOICES } from "./constants";

export default {
    id: 148,
    name: "SeDieMultiplayer",
    durations: {
        wholeRound: 23,
        placingBets: 18,
        lockingBet: 3,
        shakeThePlateDuration: 1,
    },
    choices: Object.values(BET_CHOICES),
    choicesMapper: { even: 1, odd: 2, red3: 3, red4: 4, white3: 5, white4: 6, red2: 7 },
    hedgeBetGroups: [[BET_CHOICES.even, BET_CHOICES.odd]],
    numberOfRoundHistory: 100,
    historyPageSize: 10,
    provablyFair: true,
    botSettings: {
        ratio: { mainOption: 90, sideOption: 10 },
        mainOption: [BET_CHOICES.even, BET_CHOICES.odd],
        sideOption: [BET_CHOICES.red2, BET_CHOICES.red3, BET_CHOICES.red4, BET_CHOICES.white3, BET_CHOICES.white4],
    },
};
