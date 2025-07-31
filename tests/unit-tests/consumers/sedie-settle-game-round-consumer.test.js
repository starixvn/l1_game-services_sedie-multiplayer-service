import SeDieSettleGameRoundConsumer from "../../../src/consumers/sedie-settle-game-round-consumer";

jest.mock("sc-game-base/src/table/event-consumers/", () => ({
    TableSettleGameRoundConsumer: class {},
}));

describe("SeDieSettleGameRoundConsumer", () => {
    let consumer;

    beforeEach(() => {
        consumer = new SeDieSettleGameRoundConsumer();
    });

    describe("collectRoundResult", () => {
        it("should return an object with result, settlementResult, and roundId properties", () => {
            // Arrange
            const result = { playerId: "player1", betAmount: 100, outcome: "win" };
            const settlementResult = { totalPayout: 200, commission: 10 };
            const roundId = "round-123";

            // Act
            const collectedResult = consumer.collectRoundResult(result, settlementResult, roundId);

            // Assert
            expect(collectedResult).toEqual({
                result,
                settlementResult,
                roundId,
            });
        });
    });
});
