import GameData from "../game-data";

interface PlayerEntry {
    uid: string;
    name: string;
    betAmount: number;
    lastBetTime: Date;
    winAmount: number | null;
}

export default class PlayerResultBoardManager {
    private readonly gameData: GameData;
    private readonly maxPlayers: number = 10;
    private currentRoundId: number;

    constructor(gameData: GameData) {
        this.gameData = gameData;
        this.currentRoundId = gameData.roundId;
    }

    addOrUpdatePlayer(player: any, betAmount: number) {
        const { playerResultBoard } = this.gameData;
        const uid = player.UID || player.id;
        const name = player.profile?.name || player.name;

        const index = playerResultBoard.players.findIndex((p) => p.uid === uid);

        if (index !== -1) {
            this.updateExistingPlayer(index, betAmount);
        } else {
            this.addNewPlayer(uid, name, betAmount);
        }
    }

    updateWinAmounts(bet: any) {
        const { playerResultBoard } = this.gameData;
        const index = playerResultBoard.players.findIndex((p) => p.uid === bet.uid);

        if (index === -1) {
            return;
        }

        const player = playerResultBoard.players[index];
        player.winAmount = bet.betwin - player.betAmount;
    }

    resetForNewRound() {
        this.currentRoundId = this.gameData.roundId;

        this.gameData.playerResultBoard = {
            players: [],
            totalPlayers: 0,
            isSettled: false,
        };
    }

    setSettled() {
        this.gameData.playerResultBoard.isSettled = true;
    }

    private buildBoardData(roundId: number) {
        const { totalPlayers, players, isSettled } = this.gameData.playerResultBoard;
    
        return {
            playerResultBoard: {
                roundId,
                totalPlayers,
                players: players.map(({ uid, name, betAmount, winAmount, lastBetTime }) => ({
                    uid,
                    name,
                    betAmount,
                    winAmount,
                    lastBetTime,
                })),
                isSettled,
            },
        };
    }
    
    getBoardData() {
        if (this.currentRoundId !== this.gameData.roundId) {
            this.resetForNewRound();
        }
        return this.buildBoardData(this.currentRoundId);
    }
    
    getBoardDataByRoundId(roundId: number) {
        return this.buildBoardData(roundId);
    }
        
    countTotalPlayers() {
        return this.gameData.playerResultBoard.totalPlayers || 0;
    }

    private updateExistingPlayer(index: number, betAmount: number) {
        const { players } = this.gameData.playerResultBoard;
        const player = players[index];

        player.betAmount += betAmount;
        player.lastBetTime = new Date();

        players.splice(index, 1);
        players.unshift(player);
    }

    private addNewPlayer(uid: string, name: string, betAmount: number) {
        const { playerResultBoard } = this.gameData;

        const newPlayer: PlayerEntry = {
            uid,
            name,
            betAmount,
            lastBetTime: new Date(),
            winAmount: null,
        };

        playerResultBoard.players.unshift(newPlayer);
        playerResultBoard.totalPlayers++;

        if (playerResultBoard.players.length > this.maxPlayers) {
            playerResultBoard.players.pop();
        }
    }
}
