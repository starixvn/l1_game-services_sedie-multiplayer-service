import SedieProcessBetQueue from "../../../src/crons/sedie-process-bet-queue";

jest.mock("sc-game-base", () => ({
    Table: {
        Crons: {
            TableProcessBetQueue: class {},
        },
    },
}));

describe("SedieProcessBetQueue", () => {
    let sedieProcessBetQueue;
    let mockBetsRepository;
    let mockBetLogsRepository;
    let mockGameData;
    let mockBaseClass;

    beforeEach(() => {
        // Get the mocked base class
        const { Table } = require("sc-game-base");
        mockBaseClass = Table.Crons.TableProcessBetQueue;

        mockBetsRepository = {
            updateOne: jest.fn().mockResolvedValue({}),
        };

        mockBetLogsRepository = {
            create: jest.fn().mockResolvedValue({}),
        };

        mockGameData = {
            gameConfigs: {
                odds: 2.5,
            },
            currencies: [
                {
                    partnerId: "operator1",
                    name: "USD",
                    isTest: false,
                    isUncountOnTotal: false,
                },
                {
                    partnerId: "operator1",
                    name: "EUR",
                    isTest: true,
                    isUncountOnTotal: true,
                },
                {
                    partnerId: "operator2",
                    name: "USD",
                    isTest: false,
                    isUncountOnTotal: false,
                },
            ],
        };

        sedieProcessBetQueue = new SedieProcessBetQueue();
        sedieProcessBetQueue.betsRepository = mockBetsRepository;
        sedieProcessBetQueue.betLogsRepository = mockBetLogsRepository;
        sedieProcessBetQueue.gameData = mockGameData;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("upsertBet", () => {
        it("should create a new bet with all required fields when player has session", async () => {
            // Arrange
            const player = {
                UID: "player123",
                profile: { name: "John Doe" },
                session: {
                    siteId: "site1",
                    currencyName: "USD",
                    operatorId: "operator1",
                    playerId: "player123",
                    system: "web",
                },
            };
            const roundId = "round-456";
            const bet = {
                betChoice: "red",
                amount: 100,
                freeBet: false,
            };
            const rate = 1.0;

            // Act
            await sedieProcessBetQueue.upsertBet(player, roundId, bet, rate);

            // Assert
            expect(mockBetsRepository.updateOne).toHaveBeenCalledWith(
                { uid: "player123", roundId: "round-456", freeBet: false },
                {
                    $inc: { red: 100, totalAmount: 100 },
                    $setOnInsert: {
                        uid: "player123",
                        name: "John Doe",
                        time: expect.any(Date),
                        odds: 2.5,
                        freeBet: false,
                        roundId: "round-456",
                        siteId: "site1",
                        currency: "USD",
                        rate: 1.0,
                        operatorId: "operator1",
                        playerId: "player123",
                        appType: "web",
                    },
                },
                { upsert: true, setDefaultsOnInsert: true }
            );
        });

        it("should create a new bet without session fields when player has no session", async () => {
            // Arrange
            const player = {
                UID: "player123",
                profile: { name: "John Doe" },
                session: null,
            };
            const roundId = "round-456";
            const bet = {
                betChoice: "black",
                amount: 50,
                freeBet: true,
            };
            const rate = 1.0;

            // Act
            await sedieProcessBetQueue.upsertBet(player, roundId, bet, rate);

            // Assert
            expect(mockBetsRepository.updateOne).toHaveBeenCalledWith(
                { uid: "player123", roundId: "round-456", freeBet: true },
                {
                    $inc: { black: 50, totalAmount: 50 },
                    $setOnInsert: {
                        uid: "player123",
                        name: "John Doe",
                        time: expect.any(Date),
                        odds: 2.5,
                        freeBet: true,
                        roundId: "round-456",
                    },
                },
                { upsert: true, setDefaultsOnInsert: true }
            );
        });

        it("should increment existing bet when bet already exists", async () => {
            // Arrange
            const player = {
                UID: "player123",
                profile: { name: "John Doe" },
                session: {
                    siteId: "site1",
                    currencyName: "USD",
                    operatorId: "operator1",
                    playerId: "player123",
                    system: "mobile",
                },
            };
            const roundId = "round-456";
            const bet = {
                betChoice: "red",
                amount: 75,
                freeBet: false,
            };
            const rate = 1.0;

            // Act
            await sedieProcessBetQueue.upsertBet(player, roundId, bet, rate);

            // Assert
            expect(mockBetsRepository.updateOne).toHaveBeenCalledWith(
                { uid: "player123", roundId: "round-456", freeBet: false },
                {
                    $inc: { red: 75, totalAmount: 75 },
                    $setOnInsert: expect.objectContaining({
                        uid: "player123",
                        name: "John Doe",
                        odds: 2.5,
                        freeBet: false,
                        roundId: "round-456",
                        siteId: "site1",
                        currency: "USD",
                        rate: 1.0,
                        operatorId: "operator1",
                        playerId: "player123",
                        appType: "mobile",
                    }),
                },
                { upsert: true, setDefaultsOnInsert: true }
            );
        });
    });

    describe("insertBetLog", () => {
        it("should create a bet log with all required fields when player has session", async () => {
            // Arrange
            const player = {
                UID: "player123",
                profile: { name: "John Doe" },
                session: {
                    siteId: "site1",
                    currencyName: "USD",
                    operatorId: "operator1",
                    playerId: "player123",
                    system: "web",
                },
            };
            const roundId = "round-456";
            const bet = {
                betChoice: "red",
                amount: 100,
                freeBet: false,
                clientSentTime: "2024-01-01T10:00:00Z",
                receivedTime: "2024-01-01T10:00:01Z",
            };
            const rate = 1.0;

            // Act
            await sedieProcessBetQueue.insertBetLog(player, roundId, bet, rate);

            // Assert
            expect(mockBetLogsRepository.create).toHaveBeenCalledWith({
                uid: "player123",
                name: "John Doe",
                time: expect.any(Date),
                choice: "red",
                amount: 100,
                freeBet: false,
                clientSentTime: "2024-01-01T10:00:00Z",
                receivedTime: "2024-01-01T10:00:01Z",
                roundId: "round-456",
                siteId: "site1",
                currency: "USD",
                rate: 1.0,
                operatorId: "operator1",
                playerId: "player123",
                appType: "web",
            });
        });

        it("should create a bet log without session fields when player has no session", async () => {
            // Arrange
            const player = {
                UID: "player123",
                profile: { name: "John Doe" },
                session: null,
            };
            const roundId = "round-456";
            const bet = {
                betChoice: "black",
                amount: 50,
                freeBet: true,
                clientSentTime: "2024-01-01T10:00:00Z",
                receivedTime: "2024-01-01T10:00:01Z",
            };
            const rate = 1.0;

            // Act
            await sedieProcessBetQueue.insertBetLog(player, roundId, bet, rate);

            // Assert
            expect(mockBetLogsRepository.create).toHaveBeenCalledWith({
                uid: "player123",
                name: "John Doe",
                time: expect.any(Date),
                choice: "black",
                amount: 50,
                freeBet: true,
                clientSentTime: "2024-01-01T10:00:00Z",
                receivedTime: "2024-01-01T10:00:01Z",
                roundId: "round-456",
            });
        });

        it("should handle bet without clientSentTime and receivedTime", async () => {
            // Arrange
            const player = {
                UID: "player123",
                profile: { name: "John Doe" },
                session: {
                    siteId: "site1",
                    currencyName: "USD",
                    operatorId: "operator1",
                    playerId: "player123",
                    system: "web",
                },
            };
            const roundId = "round-456";
            const bet = {
                betChoice: "red",
                amount: 100,
                freeBet: false,
            };
            const rate = 1.0;

            // Act
            await sedieProcessBetQueue.insertBetLog(player, roundId, bet, rate);

            // Assert
            expect(mockBetLogsRepository.create).toHaveBeenCalledWith({
                uid: "player123",
                name: "John Doe",
                time: expect.any(Date),
                choice: "red",
                amount: 100,
                freeBet: false,
                clientSentTime: undefined,
                receivedTime: undefined,
                roundId: "round-456",
                siteId: "site1",
                currency: "USD",
                rate: 1.0,
                operatorId: "operator1",
                playerId: "player123",
                appType: "web",
            });
        });
    });

    describe("isCountOnTotalBets", () => {
        it("should return true for valid currency that is not test and not uncounted", () => {
            // Arrange
            const player = {
                session: {
                    operatorId: "operator1",
                    currencyName: "USD",
                },
            };

            // Act
            const result = sedieProcessBetQueue.isCountOnTotalBets(player);

            // Assert
            expect(result).toBe(true);
        });

        it("should return false for test currency that is uncounted", () => {
            // Arrange
            const player = {
                session: {
                    operatorId: "operator1",
                    currencyName: "EUR",
                },
            };

            // Act
            const result = sedieProcessBetQueue.isCountOnTotalBets(player);

            // Assert
            expect(result).toBe(false);
        });

        it("should return false when no matching currency is found", () => {
            // Arrange
            const player = {
                session: {
                    operatorId: "operator3",
                    currencyName: "USD",
                },
            };

            // Act
            const result = sedieProcessBetQueue.isCountOnTotalBets(player);

            // Assert
            expect(result).toBe(false);
        });

        it("should return false when player session has no operatorId or currencyName", () => {
            // Arrange
            const player = {
                session: {
                    operatorId: null,
                    currencyName: null,
                },
            };

            // Act
            const result = sedieProcessBetQueue.isCountOnTotalBets(player);

            // Assert
            expect(result).toBe(false);
        });
    });
});
