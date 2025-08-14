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
            manager.addOrUpdatePlayer(player, 100);
            expect(gameData.playerResultBoard.players.length).toBe(1);
            expect(gameData.playerResultBoard.players[0].uid).toBe("u1");
            expect(gameData.playerResultBoard.players[0].name).toBe("Alice");
            expect(gameData.playerResultBoard.players[0].betAmount).toBe(100);
            expect(gameData.playerResultBoard.totalPlayers).toBe(1);
        });

        it("should update existing player when player exists", () => {
            const player = { UID: "u1", profile: { name: "Alice" } };
            manager.addOrUpdatePlayer(player, 100);
            manager.addOrUpdatePlayer(player, 50);
            expect(gameData.playerResultBoard.players.length).toBe(1);
            expect(gameData.playerResultBoard.players[0].betAmount).toBe(150);
            expect(gameData.playerResultBoard.totalPlayers).toBe(1);
        });

        it("should handle player with id and name fallback", () => {
            const player = { id: "u3", name: "Charlie" };
            manager.addOrUpdatePlayer(player, 20);
            expect(gameData.playerResultBoard.players[0].uid).toBe("u3");
            expect(gameData.playerResultBoard.players[0].name).toBe("Charlie");
        });
    });

    describe("updateWinAmounts", () => {
        it("should update win amounts for a player", () => {
            const player = { UID: "u1", profile: { name: "Alice" } };
            manager.addOrUpdatePlayer(player, 100);
            const bet = { uid: "u1", betwin: 200 };
            manager.updateWinAmounts(bet);
            expect(gameData.playerResultBoard.players[0].winAmount).toBe(100); // 200 - 100 = 100
        });

        it("should set negative winAmount if no win", () => {
            const player = { UID: "u1", profile: { name: "Alice" } };
            manager.addOrUpdatePlayer(player, 100);
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
            manager.addOrUpdatePlayer(player, 100);
            const bet = { uid: "u1", betwin: 100 };
            manager.updateWinAmounts(bet);
            expect(gameData.playerResultBoard.players[0].winAmount).toBe(0); // 100 - 100 = 0
        });

        it("should handle case where betwin is greater than betAmount (big win)", () => {
            const player = { UID: "u1", profile: { name: "Alice" } };
            manager.addOrUpdatePlayer(player, 10);
            const bet = { uid: "u1", betwin: 50 };
            manager.updateWinAmounts(bet);
            expect(gameData.playerResultBoard.players[0].winAmount).toBe(40); // 50 - 10 = 40
        });

        it("should handle case where betwin is less than betAmount (big loss)", () => {
            const player = { UID: "u1", profile: { name: "Alice" } };
            manager.addOrUpdatePlayer(player, 10);
            const bet = { uid: "u1", betwin: 2 };
            manager.updateWinAmounts(bet);
            expect(gameData.playerResultBoard.players[0].winAmount).toBe(-8); // 2 - 10 = -8
        });
    });

    describe("resetForNewRound", () => {
        it("should reset for new round", () => {
            manager.addOrUpdatePlayer({ UID: "u1", profile: { name: "Alice" } }, 100);
            manager.resetForNewRound();
            expect(gameData.playerResultBoard.players.length).toBe(0);
            expect(gameData.playerResultBoard.totalPlayers).toBe(0);
            expect(gameData.playerResultBoard.isSettled).toBe(false);
        });
    });

    describe("setSettled", () => {
        it("should set isSettled to true", () => {
            manager.setSettled();
            expect(gameData.playerResultBoard.isSettled).toBe(true);
        });
    });

    describe("getBoardData", () => {
        it("should get board data", () => {
            manager.addOrUpdatePlayer({ UID: "u1", profile: { name: "Alice" } }, 100);
            const data = manager.getBoardData();
            expect(data.playerResultBoard.roundId).toBe(1);
            expect(data.playerResultBoard.totalPlayers).toBe(1);
            expect(data.playerResultBoard.players[0].uid).toBe("u1");
            expect(data.playerResultBoard.isSettled).toBe(false);
        });

        it("should get board data when roundId has not changed", () => {
            manager.addOrUpdatePlayer({ UID: "u1", profile: { name: "Alice" } }, 100);
            const data = manager.getBoardData();
            expect(data.playerResultBoard.roundId).toBe(1);
            expect(data.playerResultBoard.totalPlayers).toBe(1);
            expect(data.playerResultBoard.players[0].uid).toBe("u1");
            expect(data.playerResultBoard.isSettled).toBe(false);
        });
    
        it("should reset for new round if roundId has changed", () => {
            manager.addOrUpdatePlayer({ UID: "u1", profile: { name: "Alice" } }, 100);
            gameData.roundId = 2;
            const data = manager.getBoardData();
            expect(data.playerResultBoard.players.length).toBe(0);
            expect(data.playerResultBoard.totalPlayers).toBe(0);
            expect(data.playerResultBoard.isSettled).toBe(false);
            expect(data.playerResultBoard.roundId).toBe(2);
        });

        it("should return correct data structure", () => {
            manager.addOrUpdatePlayer({ UID: "u1", profile: { name: "Alice" } }, 100);
            const data = manager.getBoardData();
            expect(data).toHaveProperty('playerResultBoard');
            expect(data.playerResultBoard).toHaveProperty('roundId');
            expect(data.playerResultBoard).toHaveProperty('totalPlayers');
            expect(data.playerResultBoard).toHaveProperty('players');
            expect(data.playerResultBoard).toHaveProperty('isSettled');
            expect(Array.isArray(data.playerResultBoard.players)).toBe(true);
        });
    });

    describe("getBoardDataByRoundId", () => {
        it("should get board data for specific roundId", () => {
            manager.addOrUpdatePlayer({ UID: "u1", profile: { name: "Alice" } }, 100);
            const data = manager.getBoardDataByRoundId(5);
            expect(data.playerResultBoard.roundId).toBe(5);
            expect(data.playerResultBoard.totalPlayers).toBe(1);
            expect(data.playerResultBoard.players[0].uid).toBe("u1");
            expect(data.playerResultBoard.isSettled).toBe(false);
        });

        it("should not affect current roundId when calling getBoardDataByRoundId", () => {
            manager.addOrUpdatePlayer({ UID: "u1", profile: { name: "Alice" } }, 100);
            const originalRoundId = manager['currentRoundId'];
            manager.getBoardDataByRoundId(999);
            expect(manager['currentRoundId']).toBe(originalRoundId);
        });

        it("should return empty board data for any roundId when no players", () => {
            const data = manager.getBoardDataByRoundId(123);
            expect(data.playerResultBoard.roundId).toBe(123);
            expect(data.playerResultBoard.totalPlayers).toBe(0);
            expect(data.playerResultBoard.players.length).toBe(0);
            expect(data.playerResultBoard.isSettled).toBe(false);
        });

        it("should return correct data structure for getBoardDataByRoundId", () => {
            const data = manager.getBoardDataByRoundId(456);
            expect(data).toHaveProperty('playerResultBoard');
            expect(data.playerResultBoard).toHaveProperty('roundId');
            expect(data.playerResultBoard).toHaveProperty('totalPlayers');
            expect(data.playerResultBoard).toHaveProperty('players');
            expect(data.playerResultBoard).toHaveProperty('isSettled');
            expect(Array.isArray(data.playerResultBoard.players)).toBe(true);
        });
    });

    describe("countTotalPlayers", () => {
        it("should count total players", () => {
            manager.addOrUpdatePlayer({ UID: "u1", profile: { name: "Alice" } }, 100);
            manager.addOrUpdatePlayer({ UID: "u2", profile: { name: "Bob" } }, 50);
            expect(manager.countTotalPlayers()).toBe(2);
        });

        it("should return correct totalPlayers from countTotalPlayers", () => {
            manager.addOrUpdatePlayer({ UID: "u1", profile: { name: "Alice" } }, 100);
            manager.addOrUpdatePlayer({ UID: "u2", profile: { name: "Bob" } }, 50);
            expect(manager.countTotalPlayers()).toBe(2);
        });

        it("should return 0 from countTotalPlayers if totalPlayers is undefined", () => {
            gameData.playerResultBoard.totalPlayers = undefined as any;
            expect(manager.countTotalPlayers()).toBe(0);
        });

        it("should return 0 from countTotalPlayers if totalPlayers is 0", () => {
            gameData.playerResultBoard.totalPlayers = 0;
            expect(manager.countTotalPlayers()).toBe(0);
        });

        it("should remove the last player if players exceed maxPlayers", () => {
            for (let i = 0; i < 11; i++) {
                manager.addOrUpdatePlayer({ UID: `u${i}`, profile: { name: `Player${i}` } }, 10);
            }
            expect(gameData.playerResultBoard.players.length).toBe(10);
            expect(gameData.playerResultBoard.totalPlayers).toBe(11);
            const uids = gameData.playerResultBoard.players.map(p => p.uid);
            expect(uids).not.toContain("u0");
        });
    });

    describe("edge cases and error handling", () => {
        it("should handle player with missing profile", () => {
            const player = { UID: "u1" };
            manager.addOrUpdatePlayer(player, 100);
            expect(gameData.playerResultBoard.players[0].uid).toBe("u1");
            expect(gameData.playerResultBoard.players[0].name).toBeUndefined();
        });

        it("should handle player with missing UID and id", () => {
            const player = { profile: { name: "Alice" } };
            manager.addOrUpdatePlayer(player, 100);
            expect(gameData.playerResultBoard.players[0].uid).toBeUndefined();
            expect(gameData.playerResultBoard.players[0].name).toBe("Alice");
        });

        it("should handle zero bet amount", () => {
            const player = { UID: "u1", profile: { name: "Alice" } };
            manager.addOrUpdatePlayer(player, 0);
            expect(gameData.playerResultBoard.players[0].betAmount).toBe(0);
        });

        it("should handle negative bet amount", () => {
            const player = { UID: "u1", profile: { name: "Alice" } };
            manager.addOrUpdatePlayer(player, -50);
            expect(gameData.playerResultBoard.players[0].betAmount).toBe(-50);
        });

        it("should handle updateWinAmounts with missing betwin", () => {
            const player = { UID: "u1", profile: { name: "Alice" } };
            manager.addOrUpdatePlayer(player, 100);
            const bet = { uid: "u1" };
            manager.updateWinAmounts(bet);
            expect(gameData.playerResultBoard.players[0].winAmount).toBeNaN(); // 100 - undefined = NaN
        });

        it("should handle updateWinAmounts with string betwin", () => {
            const player = { UID: "u1", profile: { name: "Alice" } };
            manager.addOrUpdatePlayer(player, 100);
            const bet = { uid: "u1", betwin: "200" };
            manager.updateWinAmounts(bet);
            expect(gameData.playerResultBoard.players[0].winAmount).toBe(100); // "200" - 100 = 100
        });
    });

    describe("roundId management", () => {
        it("should initialize with correct roundId", () => {
            expect(manager['currentRoundId']).toBe(1);
        });

        it("should update currentRoundId when resetForNewRound is called", () => {
            gameData.roundId = 5;
            manager.resetForNewRound();
            expect(manager['currentRoundId']).toBe(5);
        });

        it("should maintain currentRoundId when getBoardData is called with same roundId", () => {
            const originalRoundId = manager['currentRoundId'];
            manager.getBoardData();
            expect(manager['currentRoundId']).toBe(originalRoundId);
        });

        it("should update currentRoundId when getBoardData detects roundId change", () => {
            const originalRoundId = manager['currentRoundId'];
            gameData.roundId = 10;
            manager.getBoardData();
            expect(manager['currentRoundId']).toBe(10);
            expect(manager['currentRoundId']).not.toBe(originalRoundId);
        });
    });
});