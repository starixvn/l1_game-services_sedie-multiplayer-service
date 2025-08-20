import SocketRouter from "../../../src/routers/socket-router";

// Mock the base class and dependencies
jest.mock("sc-game-base/src/core/routers", () => ({
    BaseSocketRouter: class {
        socketClient: any;
        init(socketClient: any) {
            this.socketClient = socketClient;
        }
    },
}));

describe("SocketRouter", () => {
    let socketRouter: SocketRouter;
    let mockRebetConsumer: any;
    let mockSocketClient: any;
    let mockGameData: any;
    let mockLogService: any;

    beforeEach(() => {
        // Create mocks
        mockRebetConsumer = {
            consume: jest.fn(),
        };

        mockSocketClient = {
            on: jest.fn(),
            id: "socket123",
        };

        mockGameData = {
            realPlayers: {
                socket123: {
                    profile: { name: "testPlayer" },
                    session: { currencyName: "USD" },
                },
            },
        };

        mockLogService = {
            logError: jest.fn(),
        };

        // Create SocketRouter instance
        socketRouter = new SocketRouter({
            rebetConsumer: mockRebetConsumer,
            gameData: mockGameData,
            logService: mockLogService,
        });

        // Mock the verify method
        socketRouter.verify = jest.fn();
    });

    describe("constructor", () => {
        it("should initialize with rebetConsumer from props", () => {
            // Arrange & Act
            const router = new SocketRouter({ rebetConsumer: mockRebetConsumer });

            // Assert
            expect(router.rebetConsumer).toBe(mockRebetConsumer);
        });
    });

    describe("init", () => {
        it("should register rebet event handler on socketClient", () => {
            // Act
            socketRouter.init(mockSocketClient);

            // Assert
            expect(mockSocketClient.on).toHaveBeenCalledWith("rebet", expect.any(Function));
        });
    });

    describe("handleRebet", () => {
        const mockPayload = {
            betChoices: { choice1: 100, choice2: 200 },
            amount: 300,
            clientSeed: "seed123",
        };

        beforeEach(() => {
            // Set up gameData on the router instance
            socketRouter.gameData = mockGameData;
            socketRouter.logService = mockLogService;
            socketRouter.socketClient = mockSocketClient;
        });

        it("should process rebet request when verification passes", () => {
            // Arrange
            (socketRouter.verify as jest.Mock).mockReturnValueOnce(true);
            const expectedPlayer = mockGameData.realPlayers.socket123;

            // Act
            socketRouter.handleRebet(mockPayload);

            // Assert
            expect(socketRouter.verify as jest.Mock).toHaveBeenCalled();
            expect(mockRebetConsumer.consume).toHaveBeenCalledWith(expectedPlayer, mockPayload);
        });

        it("should not process rebet request when verification fails", () => {
            // Arrange
            (socketRouter.verify as jest.Mock).mockReturnValueOnce(false);

            // Act
            socketRouter.handleRebet(mockPayload);

            // Assert
            expect(socketRouter.verify as jest.Mock).toHaveBeenCalled();
            expect(mockRebetConsumer.consume).not.toHaveBeenCalled();
        });

        it("should handle errors gracefully and log them", () => {
            // Arrange
            (socketRouter.verify as jest.Mock).mockReturnValueOnce(true);
            const error = new Error("Test error");
            mockRebetConsumer.consume.mockImplementationOnce(() => {
                throw error;
            });

            // Act
            socketRouter.handleRebet(mockPayload);

            // Assert
            expect(mockLogService.logError).toHaveBeenCalledWith(error);
        });

        it("should handle verification errors gracefully", () => {
            // Arrange
            const error = new Error("Verification error");
            (socketRouter.verify as jest.Mock).mockImplementationOnce(() => {
                throw error;
            });

            // Act
            socketRouter.handleRebet(mockPayload);

            // Assert
            expect(mockLogService.logError).toHaveBeenCalledWith(error);
            expect(mockRebetConsumer.consume).not.toHaveBeenCalled();
        });
    });
});
