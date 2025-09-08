import { Socket } from "socket.io";
import UserSigninConsumer from "../../../src/consumers/user-signin-consumer";
import { PlayerResultBoardPublisher } from "../../../src/publishers";
import { PlayerResultBoardManager } from "../../../src/helpers";
import GameData from "../../../src/game-data";

jest.mock("sc-game-base", () => ({
    Table: {
        EventConsumers: {
            TableUserSignInConsumer: class {
                constructor(...args: any[]) {
                }
                handleSignInSuccess(socketClient: Socket, userInfo: any, userSession: any) {}
            },
        },
    },
}));

jest.mock("../../../src/publishers", () => ({
    PlayerResultBoardPublisher: jest.fn().mockImplementation(() => ({
        publishBoardDataToUser: jest.fn(),
    })),
}));

jest.mock("../../../src/helpers", () => ({
    PlayerResultBoardManager: jest.fn().mockImplementation(() => ({
        getBoardData: jest.fn().mockReturnValue({ playerResultBoard: { board: "data" } }),
    })),
}));

describe("UserSigninConsumer", () => {
    let mockPublisher: jest.Mocked<PlayerResultBoardPublisher>;
    let mockManager: jest.Mocked<PlayerResultBoardManager>;
    let consumer: UserSigninConsumer;
    let mockSocket: Socket;
    let mockUserInfo: any;
    let mockUserSession: any;
    let mockGameData: GameData;
    let mockDefinition: any;

    beforeEach(() => {
        mockPublisher = new (PlayerResultBoardPublisher as any)() as jest.Mocked<PlayerResultBoardPublisher>;
        mockManager = new (PlayerResultBoardManager as any)() as jest.Mocked<PlayerResultBoardManager>;

        mockDefinition = {
            durations: {
                placingBets: 30
            }
        };

        mockGameData = {
            remainingTime: 0,
            roundId: 1
        } as GameData;

        consumer = new UserSigninConsumer(
            mockDefinition,
            mockGameData,
            {} as any,
            {} as any,
            {},
            {} as any,
            mockPublisher,
            mockManager
        );

        (consumer as any).definition = mockDefinition;
        (consumer as any).gameData = mockGameData;

        mockSocket = {} as Socket;
        mockUserInfo = { id: "user123" };
        mockUserSession = {};
    });

    describe("handleSignInSuccess", () => {
        it("should publish board data to user on sign in success", () => {
            consumer.handleSignInSuccess(mockSocket, mockUserInfo, mockUserSession);

            expect(mockManager.getBoardData).toHaveBeenCalled();
            expect(mockPublisher.publishBoardDataToUser).toHaveBeenCalledWith("user123", { playerResultBoard: { board: "data" } });
        });
    });

    describe("getBoardDataForUser", () => {
        it("should return previous round data when remainingTime > placingBets and roundId > 1", () => {
            // Arrange
            mockGameData.remainingTime = 35; // > placingBets (30)
            mockGameData.roundId = 2; // > 1
            const mockBoardData = { 
                playerResultBoard: { 
                    roundId: 1,
                    totalPlayers: 2,
                    players: [],
                    isSettled: true
                } 
            };
            mockManager.getBoardData.mockReturnValue(mockBoardData);

            // Act
            const result = (consumer as any).getBoardDataForUser();

            // Assert
            expect(mockManager.getBoardData).toHaveBeenCalledWith(1); // roundId - 1
            expect(result).toEqual(mockBoardData);
        });

        it("should return current round data when remainingTime <= placingBets", () => {
            // Arrange
            mockGameData.remainingTime = 25; // <= placingBets (30)
            mockGameData.roundId = 2;
            const mockBoardData = { 
                playerResultBoard: { 
                    roundId: 2,
                    totalPlayers: 1,
                    players: [],
                    isSettled: false
                } 
            };
            mockManager.getBoardData.mockReturnValue(mockBoardData);

            // Act
            const result = (consumer as any).getBoardDataForUser();

            // Assert
            expect(mockManager.getBoardData).toHaveBeenCalledWith(); // no parameters
            expect(result).toEqual(mockBoardData);
        });

        it("should return current round data when roundId <= 1", () => {
            // Arrange
            mockGameData.remainingTime = 35; // > placingBets (30)
            mockGameData.roundId = 1; // <= 1
            const mockBoardData = { 
                playerResultBoard: { 
                    roundId: 1,
                    totalPlayers: 0,
                    players: [],
                    isSettled: false
                } 
            };
            mockManager.getBoardData.mockReturnValue(mockBoardData);

            // Act
            const result = (consumer as any).getBoardDataForUser();

            // Assert
            expect(mockManager.getBoardData).toHaveBeenCalledWith(); // no parameters
            expect(result).toEqual(mockBoardData);
        });

        it("should return current round data when both conditions are false", () => {
            // Arrange
            mockGameData.remainingTime = 25; // <= placingBets (30)
            mockGameData.roundId = 1; // <= 1
            const mockBoardData = { 
                playerResultBoard: { 
                    roundId: 1,
                    totalPlayers: 0,
                    players: [],
                    isSettled: false
                } 
            };
            mockManager.getBoardData.mockReturnValue(mockBoardData);

            // Act
            const result = (consumer as any).getBoardDataForUser();

            // Assert
            expect(mockManager.getBoardData).toHaveBeenCalledWith(); // no parameters
            expect(result).toEqual(mockBoardData);
        });
    });
});