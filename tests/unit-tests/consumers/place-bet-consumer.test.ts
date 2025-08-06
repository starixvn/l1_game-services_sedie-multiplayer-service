import { helpers } from "sc-common";
import PlaceBetConsumer from "../../../src/consumers/place-bet-consumer";

jest.mock("sc-game-base/src/core/event-consumers/place-bet-consumer", () => {
    return class BasePlaceBetConsumer {
        getNoticeObj = jest.fn();
    };
});

describe("PlaceBetConsumer", () => {
    let placeBetConsumer: PlaceBetConsumer;
    let mockGameData: any;
    let mockDefinition: any;
    const durations = {
        placingBets: 18,
        shakeThePlateDuration: 1,
        lockingBet: 3,
    };
    beforeEach(() => {
        // Arrange
        mockGameData = {
            gameConfigs: {
                enabled: true,
            },
            roundId: 123,
            remainingTime: 30,
        };

        mockDefinition = { durations };

        placeBetConsumer = new PlaceBetConsumer(mockDefinition, mockGameData, null as any);
        placeBetConsumer.definition = mockDefinition;
        placeBetConsumer.gameData = mockGameData;
    });

    describe("composeBettingTimeValidationCriteria", () => {
        it("should return failure when game is disabled", () => {
            // Arrange
            const roundId = 123;
            mockGameData.gameConfigs.enabled = false;

            // Act
            const result = placeBetConsumer.composeBettingTimeValidationCriteria(roundId);

            // Assert
            expect(result[0].failure).toBe(true);
            expect(result[0].notice).toEqual((placeBetConsumer as any).getNoticeObj(helpers.noticeHelper.placeBetNextRound));
        });

        it("should return failure when roundId does not match game roundId", () => {
            // Arrange
            const roundId = 999; // Different from gameData.roundId (123)

            // Act
            const result = placeBetConsumer.composeBettingTimeValidationCriteria(roundId);

            // Assert
            expect(result[1].failure).toBe(true);
            expect(result[1].notice).toEqual(
                (placeBetConsumer as any).getNoticeObj(helpers.noticeHelper.invalidBet, { gameRoundId: roundId })
            );
        });

        it("should return failure when remaining time is during shake the plate period", () => {
            // Arrange
            const roundId = 123;
            mockGameData.remainingTime = durations.placingBets + durations.shakeThePlateDuration; // Between placingBets (18) and shakeThePlateTime (19)

            // Act
            const result = placeBetConsumer.composeBettingTimeValidationCriteria(roundId);

            // Assert
            expect(result[2].failure).toBe(true);
            expect(result[2].notice).toEqual((placeBetConsumer as any).getNoticeObj(helpers.noticeHelper.cannotPlaceBet));
        });

        it("should return failure when remaining time is outside betting window", () => {
            // Arrange
            const roundId = 123;
            mockGameData.remainingTime = durations.lockingBet - 1; // Less than lockingBet (3)

            // Act
            const result = placeBetConsumer.composeBettingTimeValidationCriteria(roundId);

            // Assert
            expect(result[3].failure).toBe(true);
            expect(result[3].notice).toEqual((placeBetConsumer as any).getNoticeObj(helpers.noticeHelper.placeBetNextRound));
        });

        it("should return success when all validation criteria are met", () => {
            // Arrange
            const roundId = 123;
            mockGameData.gameConfigs.enabled = true;
            mockGameData.remainingTime = durations.placingBets - 2; // Within valid betting window

            // Act
            const result = placeBetConsumer.composeBettingTimeValidationCriteria(roundId);

            // Assert
            expect(result[0].failure).toBe(false); // Game enabled
            expect(result[1].failure).toBe(false); // Round ID matches
            expect(result[2].failure).toBe(false); // Not during shake the plate
            expect(result[3].failure).toBe(false); // Within betting window
        });
    });
});
