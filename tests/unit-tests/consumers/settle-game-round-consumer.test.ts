import SettleGameRoundConsumer from "../../../src/consumers/settle-game-round-consumer";
import { PlayerResultBoardPublisher } from "../../../src/publishers";
import { PlayerResultBoardManager } from "../../../src/helpers";

jest.mock("sc-game-base", () => ({
    Table: {
        EventConsumers: {
            TableSettleGameRoundConsumer: class {
                constructor(params: any) {
                    Object.assign(this, params);
                }
                queryBets(roundId: any) { return []; }
                calculateBetResult(settlementResult: any, bet: any, odds: any) { return {}; }
                createMetadata(params: any) { return {}; }
                callEndGame(bet: any, roundId: any, time: any, betResult: any, metaData: any) { return Promise.resolve(); }
                captureBetResult(uid: any, betResult: any, rate: any) {}
            },
        },
    },
}));

jest.mock("../../../src/publishers", () => ({
    PlayerResultBoardPublisher: jest.fn().mockImplementation(() => ({
        publishFinalResults: jest.fn(),
    })),
}));

jest.mock("../../../src/helpers", () => ({
    PlayerResultBoardManager: jest.fn().mockImplementation(() => ({
        updateWinAmounts: jest.fn(),
        getBoardData: jest.fn().mockReturnValue({ playerResultBoard: { players: [], totalPlayers: 0 } }),
        getBoardDataByRoundId: jest.fn().mockReturnValue({ playerResultBoard: { players: [], totalPlayers: 0 } }),
        setSettled: jest.fn(),
    })),
}));

describe("SettleGameRoundConsumer", () => {
    let settleGameRoundConsumer: SettleGameRoundConsumer;
    let mockPlayerResultBoardPublisher: jest.Mocked<PlayerResultBoardPublisher>;
    let mockPlayerResultBoardManager: jest.Mocked<PlayerResultBoardManager>;
    let mockBetsRepository: any;
    let mockUserBetResultPublisher: any;

    beforeEach(() => {
        jest.spyOn(console, "error").mockImplementation(() => {});
        mockPlayerResultBoardPublisher = {
            publishFinalResults: jest.fn(),
        } as unknown as jest.Mocked<PlayerResultBoardPublisher>;
        mockPlayerResultBoardManager = {
            updateWinAmounts: jest.fn(),
            getBoardData: jest.fn().mockReturnValue({ playerResultBoard: { players: [], totalPlayers: 0 } }),
            getBoardDataByRoundId: jest.fn().mockReturnValue({ playerResultBoard: { players: [], totalPlayers: 0 } }),
            setSettled: jest.fn(),
        } as unknown as jest.Mocked<PlayerResultBoardManager>;
        mockBetsRepository = {
            find: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue([]),
            }),
        };
        mockUserBetResultPublisher = {
            publish: jest.fn().mockResolvedValue(undefined),
            publishApiError: jest.fn(),
        };
        settleGameRoundConsumer = new SettleGameRoundConsumer({
            definition: {} as any,
            gameData: {
                gameConfigs: {
                    odds: { choice1: 2.0, choice2: 1.5 },
                },
            } as any,
            roundResultPublisher: {} as any,
            userBetResultPublisher: mockUserBetResultPublisher,
            endGame: jest.fn(),
            roundsRepository: {} as any,
            betsRepository: mockBetsRepository,
            tempBetsRepository: {} as any,
            gameManagementApiClientFactory: {} as any,
            playerResultBoardPublisher: mockPlayerResultBoardPublisher,
            playerResultBoardManager: mockPlayerResultBoardManager,
        });
    });

    describe("settleBets", () => {
        describe("when bets exist", () => {
            it("should process bets and update player result board", async () => {
                const mockBets = [
                    {
                        uid: "player1",
                        odds: { choice1: 2.0 },
                        save: jest.fn().mockResolvedValue(undefined),
                        betChoice: "choice1",
                        amount: 100,
                        siteId: "site1",
                        operatorId: "op1",
                        playerId: "player1",
                        freeBet: false,
                        clientSeed: "seed1",
                        rate: 1.0,
                        betwin: 200,
                    },
                ];
                const settlementResult = { choice1: true, choice2: false };
                const roundId = "round123";
                const time = new Date();
                const result = { choice1: "win" };
                jest.spyOn(settleGameRoundConsumer, "queryBets").mockResolvedValue(mockBets);
                jest.spyOn(settleGameRoundConsumer, "calculateBetResult").mockReturnValue({
                    totalWin: 200,
                    totalBetAmount: 100,
                    netWin: 100,
                    totalLost: 0,
                    winningByChoices: { choice1: 200 },
                });
                await settleGameRoundConsumer.settleBets({ settlementResult, roundId, time, result });
                expect(mockPlayerResultBoardManager.updateWinAmounts).toHaveBeenCalledWith(mockBets[0]);
                expect(mockPlayerResultBoardManager.setSettled).toHaveBeenCalled();
                expect(mockPlayerResultBoardManager.getBoardData).toHaveBeenCalledWith(roundId);
                expect(mockPlayerResultBoardPublisher.publishFinalResults).toHaveBeenCalled();
            });
        });

        describe("when bets array is empty", () => {
            it("should handle empty bets array", async () => {
                const settlementResult = { choice1: true, choice2: false };
                const roundId = "round123";
                const time = new Date();
                const result = { choice1: "win" };
                jest.spyOn(settleGameRoundConsumer, "queryBets").mockResolvedValue([]);
                await settleGameRoundConsumer.settleBets({ settlementResult, roundId, time, result });
                expect(mockPlayerResultBoardManager.updateWinAmounts).not.toHaveBeenCalled();
                expect(mockPlayerResultBoardManager.setSettled).toHaveBeenCalled();
                expect(mockPlayerResultBoardManager.getBoardData).toHaveBeenCalledWith(roundId);
                expect(mockPlayerResultBoardPublisher.publishFinalResults).toHaveBeenCalled();
            });
        });

        describe("when bets is null", () => {
            it("should handle null bets", async () => {
                const settlementResult = { choice1: true, choice2: false };
                const roundId = "round123";
                const time = new Date();
                const result = { choice1: "win" };
                jest.spyOn(settleGameRoundConsumer, "queryBets").mockResolvedValue(null);
                await settleGameRoundConsumer.settleBets({ settlementResult, roundId, time, result });
                expect(mockPlayerResultBoardManager.updateWinAmounts).not.toHaveBeenCalled();
                expect(mockPlayerResultBoardManager.setSettled).toHaveBeenCalled();
                expect(mockPlayerResultBoardManager.getBoardData).toHaveBeenCalledWith(roundId);
                expect(mockPlayerResultBoardPublisher.publishFinalResults).toHaveBeenCalled();
            });
        });

        describe("multiple bets", () => {
            it("should process multiple bets correctly", async () => {
                const mockBets = [
                    {
                        uid: "player1",
                        odds: { choice1: 2.0 },
                        save: jest.fn().mockResolvedValue(undefined),
                        betChoice: "choice1",
                        amount: 100,
                        siteId: "site1",
                        operatorId: "op1",
                        playerId: "player1",
                        freeBet: false,
                        clientSeed: "seed1",
                        rate: 1.0,
                        betwin: 200,
                    },
                    {
                        uid: "player2",
                        odds: { choice2: 1.5 },
                        save: jest.fn().mockResolvedValue(undefined),
                        betChoice: "choice2",
                        amount: 50,
                        siteId: "site2",
                        operatorId: "op2",
                        playerId: "player2",
                        freeBet: true,
                        clientSeed: "seed2",
                        rate: 1.0,
                        betwin: 0,
                    },
                ];
                const settlementResult = { choice1: true, choice2: false };
                const roundId = "round123";
                const time = new Date();
                const result = { choice1: "win" };
                jest.spyOn(settleGameRoundConsumer, "queryBets").mockResolvedValue(mockBets);
                jest.spyOn(settleGameRoundConsumer, "calculateBetResult")
                    .mockReturnValueOnce({
                        totalWin: 200,
                        totalBetAmount: 100,
                        netWin: 100,
                        totalLost: 0,
                        winningByChoices: { choice1: 200 },
                    })
                    .mockReturnValueOnce({
                        totalWin: 0,
                        totalBetAmount: 50,
                        netWin: -50,
                        totalLost: 50,
                        winningByChoices: {},
                    });
                await settleGameRoundConsumer.settleBets({ settlementResult, roundId, time, result });
                expect(mockPlayerResultBoardManager.updateWinAmounts).toHaveBeenCalledTimes(2);
            expect(mockPlayerResultBoardManager.updateWinAmounts).toHaveBeenCalledWith(mockBets[0]);
                expect(mockPlayerResultBoardManager.updateWinAmounts).toHaveBeenCalledWith(mockBets[1]);
                expect(mockPlayerResultBoardManager.setSettled).toHaveBeenCalled();
                expect(mockPlayerResultBoardManager.getBoardData).toHaveBeenCalledWith(roundId);
                expect(mockPlayerResultBoardPublisher.publishFinalResults).toHaveBeenCalled();
            });
        });
    });

    describe("odds logic", () => {
        it("should use default odds from gameData if bet.odds is undefined", async () => {
            const mockBet = {
                uid: "player1",
                odds: undefined,
                save: jest.fn().mockResolvedValue(undefined),
                betChoice: "choice1",
                amount: 100,
                siteId: "site1",
                operatorId: "op1",
                playerId: "player1",
                freeBet: false,
                clientSeed: "seed1",
                rate: 1.0,
            };
            const settlementResult = { choice1: true, choice2: false };
            const roundId = "round123";
            const time = new Date();
            const result = { choice1: "win" };
            jest.spyOn(settleGameRoundConsumer, "queryBets").mockResolvedValue([mockBet]);
            const spyCalc = jest.spyOn(settleGameRoundConsumer, "calculateBetResult").mockReturnValue({
                totalWin: 200,
                totalBetAmount: 100,
                netWin: 100,
                totalLost: 0,
                winningByChoices: { choice1: 200 },
            });
            await settleGameRoundConsumer.settleBets({ settlementResult, roundId, time, result });
            expect(spyCalc).toHaveBeenCalledWith(settlementResult, mockBet, settleGameRoundConsumer["gameData"].gameConfigs.odds);
        });
    });

    describe("userBetResultPublisher", () => {
        it("should call userBetResultPublisher.publish for each bet", async () => {
            const mockBets = [
                {
                    uid: "player1",
                    odds: { choice1: 2.0 },
                    save: jest.fn().mockResolvedValue(undefined),
                    betChoice: "choice1",
                    amount: 100,
                    siteId: "site1",
                    operatorId: "op1",
                    playerId: "player1",
                    freeBet: false,
                    clientSeed: "seed1",
                    rate: 1.0,
                },
                {
                    uid: "player2",
                    odds: { choice2: 1.5 },
                    save: jest.fn().mockResolvedValue(undefined),
                    betChoice: "choice2",
                    amount: 50,
                    siteId: "site2",
                    operatorId: "op2",
                    playerId: "player2",
                    freeBet: true,
                    clientSeed: "seed2",
                    rate: 1.0,
                },
            ];
            const settlementResult = { choice1: true, choice2: false };
            const roundId = "round123";
            const time = new Date();
            const result = { choice1: "win" };
            jest.spyOn(settleGameRoundConsumer, "queryBets").mockResolvedValue(mockBets);
            jest.spyOn(settleGameRoundConsumer, "calculateBetResult").mockReturnValue({
                totalWin: 100,
                totalBetAmount: 100,
                netWin: 0,
                totalLost: 0,
                winningByChoices: { choice1: 100 },
            });
            await settleGameRoundConsumer.settleBets({ settlementResult, roundId, time, result });
            expect(mockUserBetResultPublisher.publish).toHaveBeenCalledTimes(2);
            expect(mockUserBetResultPublisher.publish).toHaveBeenCalledWith("player1", expect.any(Object));
            expect(mockUserBetResultPublisher.publish).toHaveBeenCalledWith("player2", expect.any(Object));
        });
    });

    describe("callEndGame", () => {
        it("should call callEndGame with correct arguments", async () => {
            const mockBet = {
                uid: "player1",
                odds: { choice1: 2.0 },
                save: jest.fn().mockResolvedValue(undefined),
                betChoice: "choice1",
                amount: 100,
                siteId: "site1",
                operatorId: "op1",
                playerId: "player1",
                freeBet: false,
                clientSeed: "seed1",
                rate: 1.0,
            };
            const settlementResult = { choice1: true, choice2: false };
            const roundId = "round123";
            const time = new Date();
            const result = { choice1: "win" };
            jest.spyOn(settleGameRoundConsumer, "queryBets").mockResolvedValue([mockBet]);
            const betResult = {
                totalWin: 200,
                totalBetAmount: 100,
                netWin: 100,
                totalLost: 0,
                winningByChoices: { choice1: 200 },
            };
            jest.spyOn(settleGameRoundConsumer, "calculateBetResult").mockReturnValue(betResult);
            const spyMeta = jest.spyOn(settleGameRoundConsumer, "createMetadata").mockReturnValue({ meta: true });
            const spyEndGame = jest.spyOn(settleGameRoundConsumer, "callEndGame").mockResolvedValue(undefined);
            await settleGameRoundConsumer.settleBets({ settlementResult, roundId, time, result });
            expect(spyEndGame).toHaveBeenCalledWith(mockBet, roundId, time, betResult, { meta: true });
        });
    });

    describe("captureBetResult", () => {
        it("should call captureBetResult with correct arguments", async () => {
            const mockBet = {
                uid: "player1",
                odds: { choice1: 2.0 },
                save: jest.fn().mockResolvedValue(undefined),
                betChoice: "choice1",
                amount: 100,
                siteId: "site1",
                operatorId: "op1",
                playerId: "player1",
                freeBet: false,
                clientSeed: "seed1",
                rate: 1.0,
            };
            const settlementResult = { choice1: true, choice2: false };
            const roundId = "round123";
            const time = new Date();
            const result = { choice1: "win" };
            jest.spyOn(settleGameRoundConsumer, "queryBets").mockResolvedValue([mockBet]);
            const betResult = {
                totalWin: 200,
                totalBetAmount: 100,
                netWin: 100,
                totalLost: 0,
                winningByChoices: { choice1: 200 },
            };
            jest.spyOn(settleGameRoundConsumer, "calculateBetResult").mockReturnValue(betResult);
            jest.spyOn(settleGameRoundConsumer, "createMetadata").mockReturnValue({});
            const spyCapture = jest.spyOn(settleGameRoundConsumer, "captureBetResult").mockImplementation(() => {});
            await settleGameRoundConsumer.settleBets({ settlementResult, roundId, time, result });
            expect(spyCapture).toHaveBeenCalledWith(mockBet.uid, betResult, mockBet.rate);
        });
    });

    describe("publishFinalResults", () => {
        it("should always call publishFinalResults even if no bets", async () => {
            const settlementResult = { choice1: true, choice2: false };
            const roundId = "round123";
            const time = new Date();
            const result = { choice1: "win" };
            jest.spyOn(settleGameRoundConsumer, "queryBets").mockResolvedValue([]);
            await settleGameRoundConsumer.settleBets({ settlementResult, roundId, time, result });
            expect(mockPlayerResultBoardManager.setSettled).toHaveBeenCalled();
            expect(mockPlayerResultBoardPublisher.publishFinalResults).toHaveBeenCalled();
        });

        it("should call setSettled before publishing final results when bets exist", async () => {
            const mockBet = {
                uid: "player1",
                odds: { choice1: 2.0 },
                save: jest.fn().mockResolvedValue(undefined),
                betChoice: "choice1",
                amount: 100,
                siteId: "site1",
                operatorId: "op1",
                playerId: "player1",
                freeBet: false,
                clientSeed: "seed1",
                rate: 1.0,
            };
            const settlementResult = { choice1: true, choice2: false };
            const roundId = "round123";
            const time = new Date();
            const result = { choice1: "win" };
            jest.spyOn(settleGameRoundConsumer, "queryBets").mockResolvedValue([mockBet]);
            jest.spyOn(settleGameRoundConsumer, "calculateBetResult").mockReturnValue({
                totalWin: 200,
                totalBetAmount: 100,
                netWin: 100,
                totalLost: 0,
                winningByChoices: { choice1: 200 },
            });
            await settleGameRoundConsumer.settleBets({ settlementResult, roundId, time, result });
            expect(mockPlayerResultBoardManager.setSettled).toHaveBeenCalled();
            expect(mockPlayerResultBoardPublisher.publishFinalResults).toHaveBeenCalled();
        });
    });
});
