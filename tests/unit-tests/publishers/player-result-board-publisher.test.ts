import PlayerResultBoardPublisher from "../../../src/publishers/player-result-board-publisher";

describe("PlayerResultBoardPublisher", () => {
    let publisher: PlayerResultBoardPublisher;

    beforeEach(() => {
        publisher = new PlayerResultBoardPublisher({} as any, {} as any);
        publisher.publishToUser = jest.fn();
        publisher.publishToAllUsers = jest.fn();
    });

    it("should call publishToUser with correct arguments in publishBoardDataToUser", () => {
        publisher.publishBoardDataToUser("player1", { board: "data" });
        expect(publisher.publishToUser).toHaveBeenCalledWith("player1", { board: "data" });
    });

    it("should call publishToAllUsers with correct arguments in publishBoardUpdate", () => {
        publisher.publishBoardUpdate({ board: "update" });
        expect(publisher.publishToAllUsers).toHaveBeenCalledWith({ board: "update" });
    });

    it("should call publishToAllUsers with correct arguments in publishFinalResults", () => {
        publisher.publishFinalResults({ results: "final" });
        expect(publisher.publishToAllUsers).toHaveBeenCalledWith({ results: "final" });
    });
});