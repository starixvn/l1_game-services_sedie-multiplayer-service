import PlayerResultBoardManager from "../../../src/helpers/player-result-board-manager";

describe("PlayerResultBoardManager", () => {
    let gameData: any;
    let manager: PlayerResultBoardManager;

    beforeEach(() => {
        gameData = {
            roundId: "round1",
            gameConfigs: { odds: { choice1: 2, choice2: 3 } },
            playerResultBoard: {
                players: [],
                totalPlayers: 0,
                isSettled: false
            }
        };
        manager = new PlayerResultBoardManager(gameData);
    });

    describe("addOrUpdatePlayer", () => {
        it("should add a new player", () => {
            const player = { UID: "u1", profile: { name: "Alice" } };
            manager.addOrUpdatePlayer(player, 100, "choice1");
            expect(gameData.playerResultBoard.players.length).toBe(1);
            expect(gameData.playerResultBoard.players[0].uid).toBe("u1");
            expect(gameData.playerResultBoard.players[0].betAmount).toBe(100);
            expect(gameData.playerResultBoard.totalPlayers).toBe(1);
        });

        it("should update an existing player", () => {
            const player = { UID: "u1", profile: { name: "Alice" } };
            manager.addOrUpdatePlayer(player, 100, "choice1");
            manager.addOrUpdatePlayer(player, 50, "choice2");
            expect(gameData.playerResultBoard.players.length).toBe(1);
            expect(gameData.playerResultBoard.players[0].betAmount).toBe(150);
            expect(gameData.playerResultBoard.players[0].betChoices.choice1).toBe(100);
            expect(gameData.playerResultBoard.players[0].betChoices.choice2).toBe(50);
        });

        it("should not exceed maxPlayers but count all totalPlayers", () => {
            for (let i = 0; i < 12; i++) {
                manager.addOrUpdatePlayer({ UID: `u${i}`, profile: { name: `P${i}` } }, 10, "choice1");
            }
            expect(gameData.playerResultBoard.players.length).toBe(10);
            expect(gameData.playerResultBoard.totalPlayers).toBe(12);
            // The latest player should be at index 0
            expect(gameData.playerResultBoard.players[0].uid).toBe("u11");
        });

        it("should handle player with id and name fallback", () => {
            const player = { id: "u3", name: "Charlie" };
            manager.addOrUpdatePlayer(player, 20, "choice2");
            expect(gameData.playerResultBoard.players[0].uid).toBe("u3");
            expect(gameData.playerResultBoard.players[0].name).toBe("Charlie");
        });
    });

    describe("updateWinAmounts", () => {
        it("should update win amounts for a player", () => {
            const player = { UID: "u1", profile: { name: "Alice" } };
            manager.addOrUpdatePlayer(player, 100, "choice1");
            const bet = { uid: "u1", choice1: 100, odds: { choice1: 2 } };
            manager.updateWinAmounts({ choice1: true }, bet);
            expect(gameData.playerResultBoard.players[0].winAmount).toBe(200);
        });

        it("should set negative winAmount if no win", () => {
            const player = { UID: "u1", profile: { name: "Alice" } };
            manager.addOrUpdatePlayer(player, 100, "choice1");
            const bet = { uid: "u1", choice1: 100, odds: { choice1: 2 } };
            manager.updateWinAmounts({ choice1: false }, bet);
            expect(gameData.playerResultBoard.players[0].winAmount).toBe(-100);
        });

        it("should not update winAmount if player not found", () => {
            const bet = { uid: "notfound", choice1: 100, odds: { choice1: 2 } };
            manager.updateWinAmounts({ choice1: true }, bet);
            expect(gameData.playerResultBoard.players.length).toBe(0);
        });

        it("should handle calculateWinnings with multiple choices", () => {
            const player = { UID: "u1", profile: { name: "Alice" } };
            manager.addOrUpdatePlayer(player, 100, "choice1");
            const bet = { uid: "u1", choice1: 100, choice2: 50, odds: { choice1: 2, choice2: 3 } };
            manager.updateWinAmounts({ choice1: true, choice2: true }, bet);
            expect(gameData.playerResultBoard.players[0].winAmount).toBe(100*2 + 50*3);
        });

        it("should handle calculateWinnings with zero bet", () => {
            const player = { UID: "u1", profile: { name: "Alice" } };
            manager.addOrUpdatePlayer(player, 0, "choice1");
            const bet = { uid: "u1", choice1: 0, odds: { choice1: 2 } };
            manager.updateWinAmounts({ choice1: true }, bet);
            expect(gameData.playerResultBoard.players[0].winAmount).toBeCloseTo(0);
        });

        it("should use default odds from gameData if bet.odds is undefined in updateWinAmounts", () => {
            const player = { UID: "u1", profile: { name: "Alice" } };
            manager.addOrUpdatePlayer(player, 100, "choice1");
            const bet = { uid: "u1", choice1: 100, odds: undefined };
            manager.updateWinAmounts({ choice1: true }, bet);
            expect(gameData.playerResultBoard.players[0].winAmount).toBe(200);
        });
    });

    describe("resetForNewRound", () => {
        it("should reset for new round", () => {
            manager.addOrUpdatePlayer({ UID: "u1", profile: { name: "Alice" } }, 100, "choice1");
            manager.resetForNewRound();
            expect(gameData.playerResultBoard.players.length).toBe(0);
            expect(gameData.playerResultBoard.totalPlayers).toBe(0);
            expect(gameData.playerResultBoard.isSettled).toBe(false);
        });
    });

    describe("getBoardData", () => {
        it("should get board data", () => {
            manager.addOrUpdatePlayer({ UID: "u1", profile: { name: "Alice" } }, 100, "choice1");
            const data = manager.getBoardData();
            expect(data.roundId).toBe("round1");
            expect(data.totalPlayers).toBe(1);
            expect(data.players[0].uid).toBe("u1");
            expect(data.isSettled).toBe(false);
        });
    });

    describe("countTotalPlayers", () => {
        it("should count total players", () => {
            manager.addOrUpdatePlayer({ UID: "u1", profile: { name: "Alice" } }, 100, "choice1");
            manager.addOrUpdatePlayer({ UID: "u2", profile: { name: "Bob" } }, 50, "choice2");
            expect(manager.countTotalPlayers()).toBe(2);
        });

        it("should return correct totalPlayers from countTotalPlayers", () => {
            manager.addOrUpdatePlayer({ UID: "u1", profile: { name: "Alice" } }, 100, "choice1");
            manager.addOrUpdatePlayer({ UID: "u2", profile: { name: "Bob" } }, 50, "choice2");
            expect(manager.countTotalPlayers()).toBe(2);
        });

        it("should return 0 from countTotalPlayers if totalPlayers is undefined", () => {
            gameData.playerResultBoard.totalPlayers = undefined;
            expect(manager.countTotalPlayers()).toBe(0);
        });

        it("should return 0 from countTotalPlayers if totalPlayers is 0", () => {
            gameData.playerResultBoard.totalPlayers = 0;
            expect(manager.countTotalPlayers()).toBe(0);
        });
    });
});