import gameSetting from "./game-settings";

const game = {
    id: gameSetting.id,
    name: gameSetting.name,
};

const currencyData = { code: "USD", name: "$US" };

const socketOptionsFunc = (port) => ({
    socketUri: `http://localhost:${port}/user/${gameSetting.name.toLowerCase()}`,
    gameName: game.name,
    proxyRoute: "/socket.io",
});

const gameConfig = {
    type: 0,
    name: gameSetting.name.toLowerCase(),
    minBet: 1,
    maxBet: 3000,
    maxBetPerChoices: { even: 3000, odd: 3000, red3: 3000, white3: 3000, red4: 1000, white4: 1000, red2: 3000 },
    odds: { even: 1.97, odd: 1.97, red3: 3.76, white3: 3.76, red4: 14.5, white4: 14.5, red2: 2.5 },
    botenabled: false,
    choices_maxbet: { even: 3000, odd: 3000, red3: 3000, white3: 3000, red4: 1000, white4: 1000, red2: 3000 },
};

const pfResults = [
    {
        clientSeeds: [],
        roundId: 1,
        serverSeedHash: "833d21eb4a79b5d4e7aaa46c2dea31febcfea28cac097b95d7da1cc364c03f41",
        serverSeed: '{"random":"52;64;28;59","secret":"pTd2onBR3lReJeAt7X0LaPB8ahemhx0C"}',
        __v: 0,
        finalHash:
            "cd64e519c7b78d977c0a0a571615a290b68ba1dcb745a9ca8bcf65352ea25dec574465c55416e3e31dc94f18dfd7cba012764b3c6220959bdb5a30a266ad349b",
        mergeClientSeed: "",
        mergeSeed: '{"random":"52;64;28;59","secret":"pTd2onBR3lReJeAt7X0LaPB8ahemhx0C"}',
    },
];

const rounds = [
    {
        id: 1,
        result: {
            red1: true,
            red2: false,
            red3: true,
            red4: false,
        },
        settlementResult: {
            odd: false,
            even: true,
            red2: true,
            red3: false,
            red4: false,
            white3: false,
            white4: false,
        },
        exchangeRateId: 2089,
    },
];

const userBetData = (uid) => {
    return [
        {
            freeBet: false,
            uid: uid,
            betwin: 0,
            currency: "$US",
            even: 100,
            playerId: 1,
            name: "NormalUser",
            odd: 0,
            odds: gameConfig.odds,
            operatorId: "dummy-operator-id",
            rate: 1,
            red2: 0,
            red3: 0,
            red4: 0,
            siteId: "111",
            white3: 0,
            white4: 0,
            roundId: 1,
            paid: true,
            appType: 1,
        },
    ];
};

const playerBetLogData = (uid) => {
    return [
        {
            uid: uid,
            name: "NormalUser",
            freeBet: false,
            choice: "even",
            amount: 50,
            roundId: 1,
            siteId: "111",
            currency: "$US",
            playerId: 1,
            operatorId: "dummy-operator-id",
            rate: 1,
            appType: 1,
        },
        {
            uid: uid,
            name: "NormalUser",
            freeBet: false,
            choice: "even",
            amount: 50,
            roundId: 1,
            siteId: "111",
            currency: "$US",
            playerId: 1,
            operatorId: "dummy-operator-id",
            rate: 1,
            appType: 1,
        },
    ];
};

export { game, currencyData, socketOptionsFunc, gameConfig, pfResults, rounds, userBetData, playerBetLogData };
