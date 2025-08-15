import GameBot from "../../../src/crons/game-bot";
import { PlayerResultBoardPublisher } from "../../../src/publishers";
import { PlayerResultBoardManager } from "../../../src/helpers";
import GameManagementApiClientFactory from "sc-game-base/src/core/game-management-api";

jest.mock("sc-game-base", () => ({
    Table: {
        Crons: {
            TableGameConfigBot: class {
                constructor(...args: any[]) {}
                generateClientSeed() { return "seed"; }
                insertOrUpdateBet() { return Promise.resolve(); }
                updateTotalBetsAndChips() {}
                updateBotInRoomData() {}
                updateBalanceAndPublishBetPayload() {}
                totalTickets = 0;
            },
        },
    },
}));

jest.mock("../../../src/publishers", () => ({
    PlayerResultBoardPublisher: jest.fn().mockImplementation(() => ({
        publishBoardUpdate: jest.fn(),
    })),
}));

jest.mock("../../../src/helpers", () => ({
    PlayerResultBoardManager: jest.fn().mockImplementation(() => ({
        addOrUpdatePlayer: jest.fn(),
        getBoardData: jest.fn().mockReturnValue({ playerResultBoard: { board: "data" } }),
    })),
}));

jest.mock("sc-game-base/src/core/game-management-api", () => ({
    __esModule: true,
    default: class {
        users = {
            updateBotsBalance: jest.fn().mockResolvedValue([{ id: "bot1", red: 100 }]),
        };
    },
    getOrDefault: jest.fn().mockImplementation((promise, def) => promise.then((v: any) => v || def)),
}));

describe("GameBot", () => {
    let bot: GameBot;
    let mockPublisher: jest.Mocked<PlayerResultBoardPublisher>;
    let mockManager: jest.Mocked<PlayerResultBoardManager>;
    let mockApiFactory: any;
    let tempBetsRepository: any;

    beforeEach(() => {
        mockPublisher = new (PlayerResultBoardPublisher as any)() as jest.Mocked<PlayerResultBoardPublisher>;
        mockManager = new (PlayerResultBoardManager as any)() as jest.Mocked<PlayerResultBoardManager>;
        mockApiFactory = new (GameManagementApiClientFactory as any)();
        mockApiFactory.users = {
            updateBotsBalance: jest.fn().mockResolvedValue([{ id: "bot1", red: 100 }]),
        };
        tempBetsRepository = {};

        bot = new GameBot(
            {} as any,
            { roundId: "round123" } as any,
            {} as any,
            mockApiFactory,
            tempBetsRepository,
            mockPublisher,
            mockManager
        );
        bot.gameManagementApiClient = mockApiFactory;
        // Set the gameData property that the parent class should have set
        (bot as any).gameData = { roundId: "round123" };
        
        // Mock calculateBet method by default
        bot.calculateBet = jest.fn().mockImplementation((bot: any) => ({
            id: bot.id,
            amount: 100,
            bot: bot,
            choice: "choice1",
            currentBet: {},
        }));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("updateAndPublishPlayerResultBoard", () => {
        it("should update player and publish board update", () => {
            const player = { id: "player1" };
            const bet = { amount: 100, betChoice: "choice1" };

            bot.updateAndPublishPlayerResultBoard(player, bet);

            expect(mockManager.addOrUpdatePlayer).toHaveBeenCalledWith(player, 100, "round123");
            expect(mockManager.getBoardData).toHaveBeenCalled();
            expect(mockPublisher.publishBoardUpdate).toHaveBeenCalledWith({ playerResultBoard: { board: "data" } });
        });
    });

    describe("placeBets", () => {
        it("should place bets for valid bots and update/publish result board", async () => {
            // Arrange
            const botsToBet = [{ id: "bot1" }];

            // Act
            await bot.placeBets(botsToBet);

            // Assert
            expect(bot.calculateBet).toHaveBeenCalledWith(expect.objectContaining({ id: "bot1" }));
            expect(mockManager.addOrUpdatePlayer).toHaveBeenCalledWith(
                expect.objectContaining({ id: "bot1", clientSeed: "seed" }),
                100,
                "round123"
            );
            expect(mockPublisher.publishBoardUpdate).toHaveBeenCalledWith({ playerResultBoard: { board: "data" } });
        });

        it("should not call update/publish if no valid bots", async () => {
            // Arrange
            bot.calculateBet = jest.fn().mockReturnValue(null);
            mockApiFactory.users.updateBotsBalance = jest.fn().mockResolvedValue([]);

            const botsToBet = [{ id: "bot2" }];

            // Act
            await bot.placeBets(botsToBet);

            // Assert
            expect(mockPublisher.publishBoardUpdate).not.toHaveBeenCalled();
        });
    });    
});
