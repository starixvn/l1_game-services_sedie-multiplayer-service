import GameData from "../../../src/game-data";
import PlayerResultBoardManager from "../../../src/helpers/player-result-board-manager";

describe("PlayerResultBoardManager", () => {
    let manager: PlayerResultBoardManager;
    let gameData: GameData;

    beforeEach(() => {
        gameData = {
            roundId: 1,
            playerResultBoard: {
                players: [],
                totalPlayers: 0,
                isSettled: false,
            },
            gameConfigs: {
                odds: { choice1: 2, choice2: 3 },
            },
        } as any;
        manager = new PlayerResultBoardManager(gameData);
    });

    describe("addOrUpdatePlayer", () => {
        it("should add new player when player does not exist", () => {
            const player = { UID: "u1", profile: { name: "Alice" } };
            manager.addOrUpdatePlayer(player, 100, 1);
            expect(gameData.playerResultBoard.players.length).toBe(1);
            expect(gameData.playerResultBoard.players[0].uid).toBe("u1");
            expect(gameData.playerResultBoard.players[0].name).toBe("Alice");
            expect(gameData.playerResultBoard.players[0].betAmount).toBe(100);
            expect(gameData.playerResultBoard.totalPlayers).toBe(1);
        });

        it("should update existing player when player exists", () => {
            const player = { UID: "u1", profile: { name: "Alice" } };
            manager.addOrUpdatePlayer(player, 100, 1);
            manager.addOrUpdatePlayer(player, 50, 1);
            expect(gameData.playerResultBoard.players.length).toBe(1);
            expect(gameData.playerResultBoard.players[0].betAmount).toBe(150);
            expect(gameData.playerResultBoard.totalPlayers).toBe(1);
        });

        it("should handle player with id and name fallback", () => {
            const player = { id: "u3", name: "Charlie" };
            manager.addOrUpdatePlayer(player, 20, 1);
            expect(gameData.playerResultBoard.players[0].uid).toBe("u3");
            expect(gameData.playerResultBoard.players[0].name).toBe("Charlie");
        });

        it("should not add player when roundId does not match", () => {
            const player = { UID: "u1", profile: { name: "Alice" } };
            manager.addOrUpdatePlayer(player, 100, 2);
            expect(gameData.playerResultBoard.players.length).toBe(0);
        });
    });

    describe("updateWinAmounts", () => {
        it("should update win amounts for a player", () => {
            const player = { UID: "u1", profile: { name: "Alice" } };
            manager.addOrUpdatePlayer(player, 100, 1);
            const bet = { uid: "u1", betwin: 200 };
            manager.updateWinAmounts(bet);
            expect(gameData.playerResultBoard.players[0].winAmount).toBe(100); // 200 - 100 = 100
        });

        it("should set negative winAmount if no win", () => {
            const player = { UID: "u1", profile: { name: "Alice" } };
            manager.addOrUpdatePlayer(player, 100, 1);
            const bet = { uid: "u1", betwin: 0 };
            manager.updateWinAmounts(bet);
            expect(gameData.playerResultBoard.players[0].winAmount).toBe(-100); // 0 - 100 = -100
        });

        it("should not update winAmount if player not found", () => {
            const bet = { uid: "notfound", betwin: 100 };
            manager.updateWinAmounts(bet);
            expect(gameData.playerResultBoard.players.length).toBe(0);
        });

        it("should handle case where betwin equals betAmount (break even)", () => {
            const player = { UID: "u1", profile: { name: "Alice" } };
            manager.addOrUpdatePlayer(player, 100, 1);
            const bet = { uid: "u1", betwin: 100 };
            manager.updateWinAmounts(bet);
            expect(gameData.playerResultBoard.players[0].winAmount).toBe(0); // 100 - 100 = 0
        });

        it("should handle case where betwin is greater than betAmount (big win)", () => {
            const player = { UID: "u1", profile: { name: "Alice" } };
            manager.addOrUpdatePlayer(player, 10, 1);
            const bet = { uid: "u1", betwin: 50 };
            manager.updateWinAmounts(bet);
            expect(gameData.playerResultBoard.players[0].winAmount).toBe(40); // 50 - 10 = 40
        });

        it("should handle case where betwin is less than betAmount (big loss)", () => {
            const player = { UID: "u1", profile: { name: "Alice" } };
            manager.addOrUpdatePlayer(player, 10, 1);
            const bet = { uid: "u1", betwin: 2 };
            manager.updateWinAmounts(bet);
            expect(gameData.playerResultBoard.players[0].winAmount).toBe(-8); // 2 - 10 = -8
        });
    });

    describe("resetForNewRound", () => {
        it("should reset for new round", () => {
            manager.addOrUpdatePlayer({ UID: "u1", profile: { name: "Alice" } }, 100, 1);
            const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

            manager.resetForNewRound();

            expect(gameData.playerResultBoard.players.length).toBe(0);
            expect(gameData.playerResultBoard.totalPlayers).toBe(0);
            expect(gameData.playerResultBoard.isSettled).toBe(false);

            consoleSpy.mockRestore();
        });
    });

    describe("setSettled", () => {
        it("should set isSettled to true", () => {
            manager.setSettled();
            expect(gameData.playerResultBoard.isSettled).toBe(true);
        });
    });

    describe("getBoardData", () => {
        it("should get board data normally when no roundId passed", () => {
            manager.addOrUpdatePlayer({ UID: "u1", profile: { name: "Alice" } }, 100, 1);
            const data = manager.getBoardData();
            expect(data?.playerResultBoard.totalPlayers).toBe(1);
            expect(data?.playerResultBoard.players[0].uid).toBe("u1");
            expect(data?.playerResultBoard.players[0].name).toBe("A***ice");
            expect(data?.playerResultBoard.isSettled).toBe(false);
        });

        it("should return board data when roundId changed and not settled", () => {
            manager.addOrUpdatePlayer({ UID: "u1", profile: { name: "Alice" } }, 100, 1);
            const data = manager.getBoardData(2);
            expect(data).toBeDefined();
            expect(gameData.playerResultBoard.players.length).toBe(0);
            expect(gameData.playerResultBoard.totalPlayers).toBe(0);
            expect(gameData.playerResultBoard.isSettled).toBe(false);
        });

        it("should still return board data if roundId is the same", () => {
            manager.addOrUpdatePlayer({ UID: "u1", profile: { name: "Alice" } }, 100, 1);
            const data = manager.getBoardData(1);
            expect(data).toBeDefined();
            expect(data?.playerResultBoard.players[0].uid).toBe("u1");
        });

        it("should get board data", () => {
            manager.addOrUpdatePlayer({ UID: "u1", profile: { name: "Alice" } }, 100, 1);
            const data = manager.getBoardData();
            expect(data?.playerResultBoard.totalPlayers).toBe(1);
            expect(data?.playerResultBoard.players[0].uid).toBe("u1");
            expect(data?.playerResultBoard.players[0].name).toBe("A***ice");
            expect(data?.playerResultBoard.isSettled).toBe(false);
        });

        it("should get board data when roundId has not changed", () => {
            manager.addOrUpdatePlayer({ UID: "u1", profile: { name: "Alice" } }, 100, 1);
            const data = manager.getBoardData();
            expect(data?.playerResultBoard.totalPlayers).toBe(1);
            expect(data?.playerResultBoard.players[0].uid).toBe("u1");
            expect(data?.playerResultBoard.players[0].name).toBe("A***ice");
            expect(data?.playerResultBoard.isSettled).toBe(false);
        });

        it("should reset for new round if roundId has changed", () => {
            manager.addOrUpdatePlayer({ UID: "u1", profile: { name: "Alice" } }, 100, 1);
            gameData.roundId = 2;
            const data = manager.getBoardData();
            expect(data?.playerResultBoard.players.length).toBe(0);
            expect(data?.playerResultBoard.totalPlayers).toBe(0);
            expect(data?.playerResultBoard.isSettled).toBe(false);
        });

        it("should return correct data structure", () => {
            manager.addOrUpdatePlayer({ UID: "u1", profile: { name: "Alice" } }, 100, 1);
            const data = manager.getBoardData();
            expect(data).toHaveProperty("playerResultBoard");
            expect(data?.playerResultBoard).toHaveProperty("totalPlayers");
            expect(data?.playerResultBoard).toHaveProperty("players");
            expect(data?.playerResultBoard).toHaveProperty("isSettled");
            expect(Array.isArray(data?.playerResultBoard.players)).toBe(true);
        });

        it("should get board data with specific roundId", () => {
            manager.addOrUpdatePlayer({ UID: "u1", profile: { name: "Alice" } }, 100, 1);
            const data = manager.getBoardData(1);
            expect(data?.playerResultBoard.totalPlayers).toBe(1);
            expect(data?.playerResultBoard.players[0].uid).toBe("u1");
            expect(data?.playerResultBoard.players[0].name).toBe("A***ice");
            expect(data?.playerResultBoard.isSettled).toBe(false);
        });

        it("should mask player names correctly in board data", () => {
            manager.addOrUpdatePlayer({ UID: "u1", profile: { name: "JohnSmith" } }, 100, 1);
            manager.addOrUpdatePlayer({ UID: "u2", profile: { name: "Alice" } }, 200, 1);
            manager.addOrUpdatePlayer({ UID: "u3", profile: { name: "Bob" } }, 300, 1);
            manager.addOrUpdatePlayer({ UID: "u4", profile: { name: "A" } }, 400, 1);
            manager.addOrUpdatePlayer({ UID: "u5", profile: { name: "AB" } }, 500, 1);
            manager.addOrUpdatePlayer({ UID: "u6", profile: { name: "ABC" } }, 600, 1);
            manager.addOrUpdatePlayer({ UID: "u7", profile: { name: "ABCD" } }, 700, 1);

            const data = manager.getBoardData();
            const players = data?.playerResultBoard.players;
            const maskedNames = players?.map((p) => p.name);
            expect(maskedNames).toContain("J***ith");
            expect(maskedNames).toContain("A***ice");
            expect(maskedNames).toContain("B***ob");
            expect(maskedNames).toContain("A");
            expect(maskedNames).toContain("AB");
            expect(maskedNames).toContain("A***BC");
            expect(maskedNames).toContain("A***BCD");

            expect(players?.length).toBe(7);
        });
    });

    describe("filterPlayersByRound", () => {
        it("should filter players by roundId and update totalPlayers when filtered count is less than maxPlayers", () => {
            manager.addOrUpdatePlayer({ UID: "u1", profile: { name: "Alice" } }, 100, 1);
            manager.addOrUpdatePlayer({ UID: "u2", profile: { name: "Bob" } }, 200, 1);
            
            expect(gameData.playerResultBoard.totalPlayers).toBe(2);
            const result1 = manager.getBoardData(1);
            expect(result1?.playerResultBoard.players.length).toBe(2);
            expect(result1?.playerResultBoard.totalPlayers).toBe(2);
            gameData.roundId = 2;
            manager.addOrUpdatePlayer({ UID: "u3", profile: { name: "Charlie" } }, 300, 2);
            manager.addOrUpdatePlayer({ UID: "u4", profile: { name: "David" } }, 400, 2);
            manager.addOrUpdatePlayer({ UID: "u5", profile: { name: "Eve" } }, 500, 2);
            
            const result2 = manager.getBoardData(2);
            expect(result2?.playerResultBoard.players.length).toBe(3);
            expect(result2?.playerResultBoard.totalPlayers).toBe(3);
        });

        it("should not update totalPlayers when filtered count equals maxPlayers", () => {
            for (let i = 0; i < 10; i++) {
                manager.addOrUpdatePlayer({ UID: `u${i}`, profile: { name: `Player${i}` } }, 100, 1);
            }
            expect(gameData.playerResultBoard.totalPlayers).toBe(10);
            gameData.playerResultBoard.totalPlayers = 5;
            const result = manager.getBoardData(1);
            expect(result?.playerResultBoard.players.length).toBe(10);
            expect(result?.playerResultBoard.totalPlayers).toBe(5);
        });

        it("should not update totalPlayers when filtered count is greater than maxPlayers", () => {
            for (let i = 0; i < 11; i++) {
                manager.addOrUpdatePlayer({ UID: `u${i}`, profile: { name: `Player${i}` } }, 100, 1);
            }
            
            expect(gameData.playerResultBoard.totalPlayers).toBe(11);
            gameData.playerResultBoard.totalPlayers = 5;
            const result = manager.getBoardData(1);
            expect(result?.playerResultBoard.players.length).toBe(10);
            expect(result?.playerResultBoard.totalPlayers).toBe(5);
        });

        it("should handle filtering when no players exist for the specified round", () => {
            manager.addOrUpdatePlayer({ UID: "u1", profile: { name: "Alice" } }, 100, 1);
            manager.addOrUpdatePlayer({ UID: "u2", profile: { name: "Bob" } }, 200, 1);
            
            gameData.playerResultBoard.totalPlayers = 2;
            const result = manager.getBoardData(999);
            expect(result?.playerResultBoard.players.length).toBe(0);
            expect(result?.playerResultBoard.totalPlayers).toBe(0);
            expect(gameData.playerResultBoard.players.length).toBe(0);
        });

        it("should use nullish coalescing operator for roundId fallback", () => {
            manager.addOrUpdatePlayer({ UID: "u1", profile: { name: "Alice" } }, 100, 1);
            manager.addOrUpdatePlayer({ UID: "u2", profile: { name: "Bob" } }, 200, 1);
            
            manager.getBoardData(undefined);
            expect(gameData.playerResultBoard.players.length).toBe(2);
            expect(gameData.playerResultBoard.players[0].roundId).toBe(1);
            expect(gameData.playerResultBoard.players[1].roundId).toBe(1);
        });

        it("should test filterPlayersByRound behavior with maxPlayers boundary", () => {
            for (let i = 0; i < 10; i++) {
                manager.addOrUpdatePlayer({ UID: `u${i}`, profile: { name: `Player${i}` } }, 100, 1);
            }
            
            gameData.playerResultBoard.totalPlayers = 1;
            const result1 = manager.getBoardData(1);
            expect(result1?.playerResultBoard.players.length).toBe(10);
            expect(result1?.playerResultBoard.totalPlayers).toBe(1);
            
            manager.resetForNewRound();
            gameData.roundId = 2;
            const result2 = manager.getBoardData(2);
            expect(result2?.playerResultBoard.players.length).toBe(0);
            expect(result2?.playerResultBoard.totalPlayers).toBe(0);
        });
    });

    describe("edge cases and error handling", () => {
        it("should handle player with missing profile", () => {
            const player = { UID: "u1" };
            manager.addOrUpdatePlayer(player, 100, 1);
            expect(gameData.playerResultBoard.players[0].uid).toBe("u1");
            expect(gameData.playerResultBoard.players[0].name).toBeUndefined();
        });

        it("should handle player with missing UID and id", () => {
            const player = { profile: { name: "Alice" } };
            manager.addOrUpdatePlayer(player, 100, 1);
            expect(gameData.playerResultBoard.players[0].uid).toBeUndefined();
            expect(gameData.playerResultBoard.players[0].name).toBe("Alice");
        });

        it("should handle zero bet amount", () => {
            const player = { UID: "u1", profile: { name: "Alice" } };
            manager.addOrUpdatePlayer(player, 0, 1);
            expect(gameData.playerResultBoard.players[0].betAmount).toBe(0);
        });

        it("should handle negative bet amount", () => {
            const player = { UID: "u1", profile: { name: "Alice" } };
            manager.addOrUpdatePlayer(player, -50, 1);
            expect(gameData.playerResultBoard.players[0].betAmount).toBe(-50);
        });

        it("should handle updateWinAmounts with missing betwin", () => {
            const player = { UID: "u1", profile: { name: "Alice" } };
            manager.addOrUpdatePlayer(player, 100, 1);
            const bet = { uid: "u1" };
            manager.updateWinAmounts(bet);
            expect(gameData.playerResultBoard.players[0].winAmount).toBeNaN(); // 100 - undefined = NaN
        });

        it("should handle updateWinAmounts with string betwin", () => {
            const player = { UID: "u1", profile: { name: "Alice" } };
            manager.addOrUpdatePlayer(player, 100, 1);
            const bet = { uid: "u1", betwin: "200" };
            manager.updateWinAmounts(bet);
            expect(gameData.playerResultBoard.players[0].winAmount).toBe(100); // "200" - 100 = 100
        });

        it("should remove the last player if players exceed maxPlayers", () => {
            for (let i = 0; i < 11; i++) {
                manager.addOrUpdatePlayer({ UID: `u${i}`, profile: { name: `Player${i}` } }, 10, 1);
            }
            expect(gameData.playerResultBoard.players.length).toBe(10);
            expect(gameData.playerResultBoard.totalPlayers).toBe(11);
            const uids = gameData.playerResultBoard.players.map((p) => p.uid);
            expect(uids).not.toContain("u0");
        });
    });
});
