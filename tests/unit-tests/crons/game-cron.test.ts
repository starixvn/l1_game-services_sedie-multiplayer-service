import GameCron from "../../../src/crons/game-cron";

jest.mock("sc-game-base", () => ({
    Table: {
        Crons: {
            TableGameCron: class {
                constructor(_: any) {}
            },
        },
    },
}));
describe("GameCron", () => {
    let gameCron: GameCron;

    beforeEach(() => {
        // Arrange
        gameCron = new GameCron({} as any);
    });

    describe("isStartingTime", () => {
        it("should return true when remaining time equals placing bets plus shake the plate duration", () => {
            // Arrange
            const remainingTime = 40;
            const durations = {
                placingBets: 30,
                shakeThePlateDuration: 10,
            };

            // Act
            const result = gameCron.isStartingTime(remainingTime, durations);

            // Assert
            expect(result).toBe(true);
        });

        it("should return false when remaining time is less than starting time", () => {
            // Arrange
            const remainingTime = 35;
            const durations = {
                placingBets: 30,
                shakeThePlateDuration: 10,
            };

            // Act
            const result = gameCron.isStartingTime(remainingTime, durations);

            // Assert
            expect(result).toBe(false);
        });

        it("should return false when remaining time is greater than starting time", () => {
            // Arrange
            const remainingTime = 45;
            const durations = {
                placingBets: 30,
                shakeThePlateDuration: 10,
            };

            // Act
            const result = gameCron.isStartingTime(remainingTime, durations);

            // Assert
            expect(result).toBe(false);
        });
    });
});
