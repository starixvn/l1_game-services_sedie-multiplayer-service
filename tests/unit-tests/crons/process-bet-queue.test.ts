import ProcessBetQueue from "../../../src/crons/process-bet-queue";
import { PlayerResultBoardPublisher } from "../../../src/publishers";
import { PlayerResultBoardManager } from "../../../src/helpers";

jest.mock("sc-game-base", () => ({
    Table: {
        Crons: {
            TableProcessBetQueue: class {
                async handleSuccessBet(player: any, balance: any, roundId: any, bet: any) {}
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

describe("ProcessBetQueue", () => {
    let mockPublisher: jest.Mocked<PlayerResultBoardPublisher>;
    let mockManager: jest.Mocked<PlayerResultBoardManager>;
    let processBetQueue: ProcessBetQueue;

    beforeEach(() => {
        mockPublisher = new (PlayerResultBoardPublisher as any)() as jest.Mocked<PlayerResultBoardPublisher>;
        mockManager = new (PlayerResultBoardManager as any)() as jest.Mocked<PlayerResultBoardManager>;

        processBetQueue = new ProcessBetQueue({
            definition: {} as any,
            gameData: {} as any,
            placeBetPublisher: {} as any,
            placeBet: jest.fn(),
            logService: {},
            betsRepository: {},
            betLogsRepository: {},
            gameManagementApiClientFactory: {} as any,
            baseMetrics: {} as any,
            provablyFairConsumer: {},
            playerResultBoardPublisher: mockPublisher,
            playerResultBoardManager: mockManager,
        });
    });

    it("should update player and publish board update on handleSuccessBet", async () => {
        const player = { id: "player1" };
        const balance = 1000;
        const roundId = "round1";
        const bet = { amount: 200, betChoice: "choice1" };

        await processBetQueue.handleSuccessBet(player, balance, roundId, bet);

        expect(mockManager.addOrUpdatePlayer).toHaveBeenCalledWith(player, 200, roundId);
        expect(mockManager.getBoardData).toHaveBeenCalled();
        expect(mockPublisher.publishBoardUpdate).toHaveBeenCalledWith({ playerResultBoard: { board: "data" } });
    });
});