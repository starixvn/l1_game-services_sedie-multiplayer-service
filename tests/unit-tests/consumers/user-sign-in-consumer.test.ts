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

    beforeEach(() => {
        mockPublisher = new (PlayerResultBoardPublisher as any)() as jest.Mocked<PlayerResultBoardPublisher>;
        mockManager = new (PlayerResultBoardManager as any)() as jest.Mocked<PlayerResultBoardManager>;

        consumer = new UserSigninConsumer(
            {} as any,
            {} as GameData,
            {} as any,
            {} as any,
            {},
            {} as any,
            mockPublisher,
            mockManager
        );

        mockSocket = {} as Socket;
        mockUserInfo = { id: "user123" };
        mockUserSession = {};
    });

    it("should publish board data to user on sign in success", () => {
        consumer.handleSignInSuccess(mockSocket, mockUserInfo, mockUserSession);

        expect(mockManager.getBoardData).toHaveBeenCalled();
        expect(mockPublisher.publishBoardDataToUser).toHaveBeenCalledWith("user123", { playerResultBoard: { board: "data" } });
    });
});