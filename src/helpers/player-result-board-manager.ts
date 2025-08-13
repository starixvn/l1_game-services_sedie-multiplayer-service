import GameData from "../game-data";

interface PlayerEntry {
    uid: string;
    name: string;
    betAmount: number;
    lastBetTime: Date;
    betChoices: Record<string, number>;
    winAmount: number | null;
}

export default class PlayerResultBoardManager {
    private readonly gameData: GameData;
    private readonly maxPlayers: number = 10;

    constructor(gameData: GameData) {
        this.gameData = gameData;
    }

    addOrUpdatePlayer(player: any, betAmount: number, betChoice: string) {
        const { playerResultBoard } = this.gameData;
        const uid = player.UID || player.id;
        const name = player.profile?.name || player.name;

        const index = playerResultBoard.players.findIndex(p => p.uid === uid);

        if (index !== -1) {
            this.updateExistingPlayer(index, betAmount, betChoice);
        } else {
            this.addNewPlayer(uid, name, betAmount, betChoice);
        }
    }

    updateWinAmounts(settlementResult: Record<string, boolean>, bet: any) {
        const { playerResultBoard } = this.gameData;
        const odds = bet.odds ?? this.gameData.gameConfigs.odds;
        const index = playerResultBoard.players.findIndex(p => p.uid === bet.uid);

        if (index === -1){
            return;
        }

        const player = playerResultBoard.players[index];
        const { totalBet, totalWin } = this.calculateWinnings(bet, settlementResult, odds);

        player.winAmount = totalWin - totalBet;
    }

    resetForNewRound() {
        this.gameData.playerResultBoard = {
            players: [],
            totalPlayers: 0,
            isSettled: false
        };
    }

    setSettled() {
        this.gameData.playerResultBoard.isSettled = true;
    }

    getBoardData() {
        const { playerResultBoard } = this.gameData;

        return {
            playerResultBoard: {
                roundId: this.gameData.roundId,
                totalPlayers: playerResultBoard.totalPlayers,
                players: playerResultBoard.players.map(({ uid, name, betAmount, winAmount, lastBetTime }) => ({
                    uid, name, betAmount, winAmount, lastBetTime
                })),
                isSettled: playerResultBoard.isSettled
            }
        };
    }

    countTotalPlayers() {
        return this.gameData.playerResultBoard.totalPlayers || 0;
    }

    private updateExistingPlayer(index: number, betAmount: number, betChoice: string) {
        const { players } = this.gameData.playerResultBoard;
        const player = players[index];

        player.betAmount += betAmount;
        player.lastBetTime = new Date();
        player.betChoices[betChoice] = (player.betChoices[betChoice] || 0) + betAmount;

        players.splice(index, 1);
        players.unshift(player);
    }

    private addNewPlayer(uid: string, name: string, betAmount: number, betChoice: string) {
        const { playerResultBoard } = this.gameData;

        const newPlayer: PlayerEntry = {
            uid,
            name,
            betAmount,
            lastBetTime: new Date(),
            betChoices: { [betChoice]: betAmount },
            winAmount: null
        };

        playerResultBoard.players.unshift(newPlayer);
        playerResultBoard.totalPlayers++;

        if (playerResultBoard.players.length > this.maxPlayers) {
            playerResultBoard.players.pop();
        }
    }

    private calculateWinnings(bet: any, settlementResult: Record<string, boolean>, odds: Record<string, number>) {
        let totalBet = 0;
        let totalWin = 0;
        
        const betChoices = Object.keys(settlementResult);
        betChoices.forEach(choice => {
            const amount = Number(bet[choice]) || 0;
            if (amount > 0) {
                totalBet += amount;
                if (settlementResult[choice]) {
                    totalWin += amount * odds[choice];
                }
            }
        });

        return { totalBet, totalWin };
    }
}
