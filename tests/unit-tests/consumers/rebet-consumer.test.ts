import { helpers } from "sc-common";
import RebetConsumer from "../../../src/consumers/rebet-consumer";
import { BET_CHOICES } from "../../../src/constants";

// Mock sc-common helpers
jest.mock("sc-common", () => ({
    helpers: {
        noticeHelper: {
            invalidBet: "INVALID_BET",
            maxBetForChoice: "MAX_BET_FOR_CHOICE",
            minBet: "MIN_BET",
            maxBet: "MAX_BET",
            disallowHedgeBet: "DISALLOW_HEDGE_BET",
        },
    },
}));

describe("RebetConsumer", () => {
    let rebetConsumer: RebetConsumer;
    let mockGameData: any;
    let mockPlayer: any;
    let mockPayload: any;
    const definition = {
        id: 148,
        name: "SeDieMultiplayer",
        durations: {
            wholeRound: 23,
            placingBets: 18,
            lockingBet: 3,
            shakeThePlateDuration: 1,
        },
        choices: Object.values(BET_CHOICES),
        hedgeBetGroups: [[BET_CHOICES.even, BET_CHOICES.odd]],
    } as any;

    beforeEach(() => {
        mockGameData = {
            ingame: {},
            currencyGroupGames: [
                {
                    groupId: "1",
                    minBet: 10,
                    maxBet: 5000,
                    maxBetPerChoices: {
                        [BET_CHOICES.odd]: 1000,
                        [BET_CHOICES.even]: 1000,
                        [BET_CHOICES.red3]: 1000,
                        [BET_CHOICES.red4]: 1000,
                        [BET_CHOICES.white3]: 1000,
                        [BET_CHOICES.white4]: 1000,
                        [BET_CHOICES.red2]: 1000,
                    },
                },
            ],
            gameConfigs: {
                enableFreeBet: true,
            },
            roundId: 123,
        };

        mockPlayer = {
            profile: {
                name: "testPlayer",
                minBet: 5,
                maxBet: 1500,
            },
            session: {
                currencyGroupId: "1",
                currencyName: "USD",
                system: "web",
                operatorId: "op123",
            },
        };

        mockPayload = {
            betChoices: { [BET_CHOICES.even]: 100, [BET_CHOICES.red2]: 50 },
            amount: 150,
            clientSeed: "seed123",
            freeBet: false,
            roundId: 123,
            receivedTime: new Date(),
        };

        rebetConsumer = new RebetConsumer(definition, mockGameData, undefined as any);
    });

    describe("mergeBetTracks", () => {
        it("should merge new bet choices with existing bet tracks", () => {
            // Arrange
            const existingBetTracks = { [BET_CHOICES.even]: 200, [BET_CHOICES.red2]: 100 };
            mockGameData.ingame["testPlayer"] = { betTracks: existingBetTracks };
            const newBetChoices = { [BET_CHOICES.even]: 50, [BET_CHOICES.odd]: 75 };

            // Act
            const result = rebetConsumer.mergeBetTracks("testPlayer", newBetChoices);

            // Assert
            expect(result).toEqual({
                [BET_CHOICES.even]: 250, // 200 + 50
                [BET_CHOICES.odd]: 75,
                [BET_CHOICES.red2]: 100,
            });
        });

        it("should create new bet tracks when player has no existing tracks", () => {
            // Arrange
            const newBetChoices = { [BET_CHOICES.even]: 100, [BET_CHOICES.red2]: 200 };
            mockGameData.ingame["testPlayer"] = { betTracks: {} };

            // Act
            const result = rebetConsumer.mergeBetTracks("testPlayer", newBetChoices);

            // Assert
            expect(result).toEqual({
                [BET_CHOICES.even]: 100,
                [BET_CHOICES.red2]: 200,
            });
        });
    });

    describe("composeBetAmountValidationCriteria", () => {
        it("should return validation criteria for free bet when free bet is disabled", () => {
            // Arrange
            mockGameData.gameConfigs.enableFreeBet = false;
            const betChoices = { [BET_CHOICES.even]: 100 };

            // Act
            const result = rebetConsumer.composeBetAmountValidationCriteria(mockPlayer, betChoices, 100, true);

            // Assert
            expect(result[0].failure).toBe(true);
            expect(result[0].notice).toEqual({ errorCode: "INVALID_BET" });
        });

        describe("max bet per choice violation", () => {
            it("should return validation criteria for betChoices", () => {
                // Arrange
                const betChoices = { [BET_CHOICES.even]: 1100 };

                // Act
                const result = rebetConsumer.composeBetAmountValidationCriteria(mockPlayer, betChoices, 1100, false);

                // Assert
                expect(result[1].failure).toBe(true);
                expect(result[1].notice).toEqual({ errorCode: "MAX_BET_FOR_CHOICE", maxBet: 1000 });
            });
            it("should return validation criteria for betChoices + betTracks", () => {
                // Arrange
                const betChoices = { [BET_CHOICES.odd]: 900 };
                mockGameData.ingame["testPlayer"] = { betTracks: { [BET_CHOICES.odd]: 200 } };

                // Act
                const result = rebetConsumer.composeBetAmountValidationCriteria(mockPlayer, betChoices, 900, false);

                // Assert
                expect(result[1].failure).toBe(true);
                expect(result[1].notice).toEqual({ errorCode: "MAX_BET_FOR_CHOICE", maxBet: 1000 });
            });
        });

        describe("min bet violation", () => {
            it("should return validation criteria for total amount", () => {
                // Arrange
                const betChoices = { [BET_CHOICES.even]: 50, [BET_CHOICES.red2]: 5 };

                // Act
                const result = rebetConsumer.composeBetAmountValidationCriteria(mockPlayer, betChoices, 55, false);

                // Assert
                expect(result[2].failure).toBe(true);
                expect(result[2].notice).toEqual({ errorCode: "MIN_BET", minBet: 10 });
            });
            it("should return validation criteria for each bet choice", () => {
                // Arrange
                const betChoices = { [BET_CHOICES.odd]: 5 };

                // Act
                const result = rebetConsumer.composeBetAmountValidationCriteria(mockPlayer, betChoices, 5, false);

                // Assert
                expect(result[2].failure).toBe(true);
                expect(result[2].notice).toEqual({ errorCode: "MIN_BET", minBet: 10 });
            });
        });

        describe("max bet violation", () => {
            it("should return validation criteria for betChoices from request", () => {
                // Arrange
                const betChoices = { [BET_CHOICES.even]: 900, [BET_CHOICES.red2]: 500, [BET_CHOICES.red3]: 500 };

                // Act
                const result = rebetConsumer.composeBetAmountValidationCriteria(mockPlayer, betChoices, 1900, false);

                // Assert
                expect(result[3].failure).toBe(true);
                expect(result[3].notice).toEqual({ errorCode: "MAX_BET", maxBet: 1500 });
            });
            it("should return validation criteria for betChoices from request + betTracks", () => {
                // Arrange
                const betChoices = { [BET_CHOICES.even]: 1000 };
                mockGameData.ingame["testPlayer"] = { betTracks: { [BET_CHOICES.even]: 1000 } };

                // Act
                const result = rebetConsumer.composeBetAmountValidationCriteria(mockPlayer, betChoices, 1000, false);

                // Assert
                expect(result[3].failure).toBe(true);
                expect(result[3].notice).toEqual({ errorCode: "MAX_BET", maxBet: 1500 });
            });
        });

        describe("total amount violation", () => {
            it("should return validation criteria for betChoices from request + betTracks", () => {
                // Arrange
                const betChoices = { [BET_CHOICES.even]: 400 };
                mockGameData.ingame["testPlayer"] = {
                    betTracks: { [BET_CHOICES.even]: 500, [BET_CHOICES.red2]: 500, [BET_CHOICES.red3]: 200 },
                };

                // Act
                const result = rebetConsumer.composeBetAmountValidationCriteria(mockPlayer, betChoices, 400, false);

                // Assert
                expect(result[4].failure).toBe(true);
                expect(result[4].notice).toEqual({ errorCode: "MAX_BET", maxBet: 1500 });
            });
        });

        it("should return valid", () => {
            // Arrange
            const betChoices = { [BET_CHOICES.even]: 100 };
            mockGameData.ingame["testPlayer"] = {
                betTracks: { [BET_CHOICES.even]: 100, [BET_CHOICES.red2]: 100, [BET_CHOICES.red3]: 100 },
            };

            // Act
            const result = rebetConsumer.composeBetAmountValidationCriteria(mockPlayer, betChoices, 100, false);

            // Assert
            expect(result[0].failure).toBe(false);
            expect(result[1].failure).toBe(false);
            expect(result[2].failure).toBe(false);
            expect(result[3].failure).toBe(false);
            expect(result[4].failure).toBe(false);
        });
    });

    describe("composeBetChoiceValidationCriteria", () => {
        it("should return validation criteria for invalid bet choice", () => {
            // Arrange
            const invalidBetChoices = { invalidChoice: 100 };

            // Act
            const result = rebetConsumer.composeBetChoiceValidationCriteria(invalidBetChoices);

            // Assert
            expect(result[0].failure).toBe(true);
            expect(result[0].notice).toEqual({ errorCode: "INVALID_BET" });
        });

        it("should return validation criteria for valid bet choices", () => {
            // Arrange
            const validBetChoices = {
                [BET_CHOICES.odd]: 100,
                [BET_CHOICES.even]: 100,
                [BET_CHOICES.red3]: 100,
                [BET_CHOICES.red4]: 100,
                [BET_CHOICES.white3]: 100,
                [BET_CHOICES.white4]: 100,
                [BET_CHOICES.red2]: 200,
            };

            // Act
            const result = rebetConsumer.composeBetChoiceValidationCriteria(validBetChoices);

            // Assert
            expect(result[0].failure).toBe(false);
        });
    });

    describe("composeHedgeBetValidationCriteria", () => {
        it("should return validation criteria for hedge bet detection", () => {
            // Arrange
            mockGameData.ingame["testPlayer"] = { betTracks: { [BET_CHOICES.even]: 100 } };
            const betChoices = { [BET_CHOICES.odd]: 200 };

            // Act
            const result = rebetConsumer.composeHedgeBetValidationCriteria(betChoices, mockPlayer);

            // Assert
            expect(result[0].failure).toBe(true);
            expect(result[0].notice).toEqual({ errorCode: "DISALLOW_HEDGE_BET", hedgeBetGroup: [BET_CHOICES.even, BET_CHOICES.odd] });
        });

        it("should return validation criteria for hedge bet detection", () => {
            // Arrange
            mockGameData.ingame["testPlayer"] = { betTracks: {} };
            const betChoices = { [BET_CHOICES.odd]: 200, [BET_CHOICES.even]: 100 };

            // Act
            const result = rebetConsumer.composeHedgeBetValidationCriteria(betChoices, mockPlayer);

            // Assert
            expect(result[0].failure).toBe(true);
            expect(result[0].notice).toEqual({ errorCode: "DISALLOW_HEDGE_BET", hedgeBetGroup: [BET_CHOICES.even, BET_CHOICES.odd] });
        });

        it("should not detect hedge bet when incomplete", () => {
            // Arrange
            mockGameData.ingame["testPlayer"] = { betTracks: { [BET_CHOICES.even]: 100 } };
            const betChoices = { [BET_CHOICES.red2]: 200 };

            // Act
            const result = rebetConsumer.composeHedgeBetValidationCriteria(betChoices, mockPlayer);

            // Assert
            expect(result[0].failure).toBe(false);
        });
    });

    describe("validateBetRequestParams", () => {
        it("should return validation criteria for empty bet choices", () => {
            // Arrange
            const payload = { betChoices: {} } as any;

            // Act
            const result = rebetConsumer.validateBetRequestParams(payload);

            // Assert
            expect(result[0].failure).toBe(true);
            expect(result[0].notice).toEqual({ errorCode: "INVALID_BET" });
        });

        it("should return validation criteria for valid bet choices", () => {
            // Arrange
            const payload = { betChoices: { [BET_CHOICES.even]: 100 } } as any;

            // Act
            const result = rebetConsumer.validateBetRequestParams(payload);

            // Assert
            expect(result[0].failure).toBe(false);
        });
    });

    describe("getTotalAmount", () => {
        it("should calculate total amount from bet choices", () => {
            // Arrange
            const payload = { betChoices: { [BET_CHOICES.even]: 100, [BET_CHOICES.red2]: 200 } };

            // Act
            const result = rebetConsumer.getTotalAmount(payload as any);

            // Assert
            expect(result).toBe(300);
        });

        it("should return 0 for empty bet choices", () => {
            // Arrange
            const payload = { betChoices: {} } as any;

            // Act
            const result = rebetConsumer.getTotalAmount(payload);

            // Assert
            expect(result).toBe(0);
        });
    });

    describe("consume", () => {
        let payload: any;

        beforeEach(() => {
            // Mock the parent class methods
            rebetConsumer.validateRequestParams = jest.fn().mockReturnValue(true);
            rebetConsumer.validateBetRequest = jest.fn().mockReturnValue(true);
            rebetConsumer.initInGameData = jest.fn();
            rebetConsumer.adjustBetTracks = jest.fn();
            rebetConsumer.insertBetQueue = jest.fn();
            jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00.000Z"));
            payload = {
                betChoices: { [BET_CHOICES.even]: 100, [BET_CHOICES.red2]: 50 },
                clientSeed: "seed123",
                m: "test",
            } as any;
        });

        it("should set default values when not provided in payload", () => {
            // Arrange
            const expectedReceivedTime = new Date("2025-01-01T00:00:00.000Z");

            // Act
            rebetConsumer.consume(mockPlayer, payload);

            // Assert
            expect(payload.amount).toBe(150);
            expect(payload.freeBet).toBe(false);
            expect(payload.roundId).toBe(123);
            expect(payload.mode).toBe("test");
            expect(payload.receivedTime).toEqual(expectedReceivedTime);
        });

        it("should process valid bet request successfully", () => {
            const expectedPayload = {
                ...payload,
                amount: 150,
                freeBet: false,
                roundId: 123,
                mode: "test",
                receivedTime: new Date("2025-01-01T00:00:00.000Z"),
            } as any;

            // Act
            rebetConsumer.consume(mockPlayer, payload);

            // Assert
            expect(rebetConsumer.adjustBetTracks).toHaveBeenCalledWith("testPlayer", expectedPayload);
            expect(rebetConsumer.insertBetQueue).toHaveBeenCalledWith(mockPlayer, expectedPayload);
        });

        it("should not process when validateRequestParams fails", () => {
            // Arrange
            rebetConsumer.validateRequestParams = jest.fn().mockReturnValueOnce(false);

            // Act
            rebetConsumer.consume(mockPlayer, payload);

            // Assert
            expect(rebetConsumer.adjustBetTracks).not.toHaveBeenCalled();
            expect(rebetConsumer.insertBetQueue).not.toHaveBeenCalled();
        });

        it("should not process when validateRequestParams fails", () => {
            // Arrange
            rebetConsumer.validateBetRequest = jest.fn().mockReturnValueOnce(false);

            // Act
            rebetConsumer.consume(mockPlayer, payload);

            // Assert
            expect(rebetConsumer.adjustBetTracks).not.toHaveBeenCalled();
            expect(rebetConsumer.insertBetQueue).not.toHaveBeenCalled();
        });

        it("should use existing in-game data when player already exists", () => {
            // Arrange
            mockGameData.ingame["testPlayer"] = { betTracks: {}, betQueue: [] };
            const payload = { ...mockPayload };

            // Act
            rebetConsumer.consume(mockPlayer, payload);

            // Assert
            expect(rebetConsumer.initInGameData).not.toHaveBeenCalled();
            expect(rebetConsumer.adjustBetTracks).toHaveBeenCalled();
            expect(rebetConsumer.insertBetQueue).toHaveBeenCalled();
        });
    });

    describe("initInGameData", () => {
        it("should initialize new player in-game data", () => {
            // Arrange
            mockGameData.ingame = {};
            const payload = { ...mockPayload };

            // Act
            rebetConsumer.initInGameData(mockPlayer, payload);

            // Assert
            expect(mockGameData.ingame["testPlayer"]).toEqual({
                name: "testPlayer",
                currency: "USD",
                system: "web",
                betTracks: {},
                betQueue: [],
                clientSeed: "seed123",
                operatorId: "op123",
            });
        });
    });

    describe("adjustBetTracks", () => {
        it("should adjust bet tracks for existing player", () => {
            // Arrange
            mockGameData.ingame["testPlayer"] = {
                betTracks: { [BET_CHOICES.even]: 100, [BET_CHOICES.red2]: 50, [BET_CHOICES.red3]: 100 },
            };
            const payload = { ...mockPayload, betChoices: { [BET_CHOICES.even]: 75, [BET_CHOICES.red2]: 25 } };

            // Act
            rebetConsumer.adjustBetTracks("testPlayer", payload);

            // Assert
            expect(mockGameData.ingame["testPlayer"].betTracks).toEqual({
                [BET_CHOICES.even]: 175, // 100 + 75
                [BET_CHOICES.red2]: 75, // 50 + 25
                [BET_CHOICES.red3]: 100,
            });
        });

        it("should create new bet tracks when choice doesn't exist", () => {
            // Arrange
            mockGameData.ingame["testPlayer"] = { betTracks: {} };
            const payload = { ...mockPayload, betChoices: { [BET_CHOICES.red3]: 100 } };

            // Act
            rebetConsumer.adjustBetTracks("testPlayer", payload);

            // Assert
            expect(mockGameData.ingame["testPlayer"].betTracks[BET_CHOICES.red3]).toBe(100);
        });
    });

    describe("insertBetQueue", () => {
        it("should insert bet queue entries for each bet choice", () => {
            // Arrange
            mockGameData.ingame["testPlayer"] = { betQueue: [] };
            const payload = { ...mockPayload, betChoices: { [BET_CHOICES.odd]: 100, [BET_CHOICES.red3]: 200 } };

            // Act
            rebetConsumer.insertBetQueue(mockPlayer, payload);

            // Assert
            expect(mockGameData.ingame["testPlayer"].betQueue).toHaveLength(2);
            expect(mockGameData.ingame["testPlayer"].betQueue[0]).toEqual({
                player: mockPlayer,
                payload: { ...payload, betChoice: BET_CHOICES.odd, amount: 100 },
            });
            expect(mockGameData.ingame["testPlayer"].betQueue[1]).toEqual({
                player: mockPlayer,
                payload: { ...payload, betChoice: BET_CHOICES.red3, amount: 200 },
            });
        });
    });

    describe("validateBetRequest", () => {
        let payload: any;
        beforeEach(() => {
            // Mock the parent class methods
            rebetConsumer.validateRequestParams = jest.fn().mockReturnValue(true);
            rebetConsumer.initInGameData = jest.fn();
            rebetConsumer.adjustBetTracks = jest.fn();
            rebetConsumer.insertBetQueue = jest.fn();
            rebetConsumer.composeBettingTimeValidationCriteria = jest.fn().mockReturnValue([]);
            rebetConsumer.composeBetAmountValidationCriteria = jest.fn().mockReturnValue([]);
            rebetConsumer.composeBetChoiceValidationCriteria = jest.fn().mockReturnValue([]);
            rebetConsumer.composeHedgeBetValidationCriteria = jest.fn().mockReturnValue([]);
            jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00.000Z"));
            payload = {
                betChoices: { [BET_CHOICES.even]: 100, [BET_CHOICES.red2]: 50 },
                clientSeed: "seed123",
                m: "test",
            } as any;
        });

        it("should call correct validation criteria", () => {
            // Arrange
            const expectedPayload = {
                ...payload,
                amount: 150,
                freeBet: false,
                roundId: 123,
                mode: "test",
                receivedTime: new Date("2025-01-01T00:00:00.000Z"),
            } as any;
            // Act
            rebetConsumer.consume(mockPlayer, payload);

            // Assert
            expect(rebetConsumer.composeBettingTimeValidationCriteria).toHaveBeenCalledWith(123);
            expect(rebetConsumer.composeBetAmountValidationCriteria).toHaveBeenCalledWith(
                mockPlayer,
                expectedPayload.betChoices,
                expectedPayload.amount,
                expectedPayload.freeBet
            );
            expect(rebetConsumer.composeBetChoiceValidationCriteria).toHaveBeenCalledWith(expectedPayload.betChoices);
            expect(rebetConsumer.composeHedgeBetValidationCriteria).toHaveBeenCalledWith(expectedPayload.betChoices, mockPlayer);
        });
    });
});
