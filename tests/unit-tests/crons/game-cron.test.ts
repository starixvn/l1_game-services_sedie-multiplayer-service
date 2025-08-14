import GameCron from "../../../src/crons/game-cron";
import { PlayerResultBoardManager } from "../../../src/helpers";

jest.mock("sc-game-base", () => ({
    Table: {
        Crons: {
            TableGameCron: class {
                constructor(params: any) {}
                resetForNewRound() {}
            },
        },
    },
}));

jest.mock("../../../src/helpers", () => ({
    PlayerResultBoardManager: jest.fn().mockImplementation(() => ({
        resetForNewRound: jest.fn(),
    })),
}));

describe("GameCron", () => {
    let gameCron: GameCron;
    let mockPlayerResultBoardManager: jest.Mocked<PlayerResultBoardManager>;
    let mockPlayerResultBoardPublisher: any;

    beforeEach(() => {
        // Arrange
        mockPlayerResultBoardManager = {
            resetForNewRound: jest.fn(),
            addOrUpdatePlayer: jest.fn(),
            updateWinAmounts: jest.fn(),
            getBoardData: jest.fn().mockReturnValue({ playerResultBoard: { board: "data" } }),
            countTotalPlayers: jest.fn(),
        } as unknown as jest.Mocked<PlayerResultBoardManager>;
        
        mockPlayerResultBoardPublisher = {
            publishBoardUpdate: jest.fn(),
        };
        
        gameCron = new GameCron({
            definition: {} as any,
            gameData: {} as any,
            bot: {} as any,
            settleGameRoundConsumer: {} as any,
            gameStatusPublisher: {} as any,
            runningRoundInfoPublisher: {} as any,
            logService: {} as any,
            roundResultConsumer: {} as any,
            resultsRepository: {} as any,
            appConfigs: {} as any,
            gameManagementApiClientFactory: {} as any,
            roundIdConsumer: {} as any,
            provablyFairConsumer: {} as any,
            unsettledRoundConsumer: {} as any,
            playerResultBoardManager: mockPlayerResultBoardManager,
            playerResultBoardPublisher: mockPlayerResultBoardPublisher,
        });
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

    describe("resetForNewRound", () => {
        it("should call super.resetForNewRound and playerResultBoardManager.resetForNewRound", () => {
            // Arrange
            const superResetSpy = jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(gameCron)), 'resetForNewRound');
            const playerResultBoardResetSpy = jest.spyOn(mockPlayerResultBoardManager, 'resetForNewRound');
            const getBoardDataSpy = jest.spyOn(mockPlayerResultBoardManager, 'getBoardData');
            const publishBoardUpdateSpy = jest.spyOn(mockPlayerResultBoardPublisher, 'publishBoardUpdate');

            // Act
            gameCron.resetForNewRound();

            // Assert
            expect(superResetSpy).toHaveBeenCalled();
            expect(playerResultBoardResetSpy).toHaveBeenCalled();
            expect(getBoardDataSpy).toHaveBeenCalled();
            expect(publishBoardUpdateSpy).toHaveBeenCalledWith({ playerResultBoard: { board: "data" } });
        });
    });
});
