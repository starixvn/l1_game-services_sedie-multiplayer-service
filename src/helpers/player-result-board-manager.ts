import GameData from "../game-data";

export default class PlayerResultBoardManager {
    gameData: GameData;
    maxPlayers: number;

    constructor(gameData: GameData) {
        this.gameData = gameData;
        this.maxPlayers = 10;
    }

    addOrUpdatePlayer(player: any, betAmount: number, betChoice: string) {
        const { playerResultBoard } = this.gameData;
        const playerName = player.profile.name;
        
        let existingIndex = playerResultBoard.players.findIndex(p => p.uid === player.UID);
        if (existingIndex !== -1) {
            const existingPlayer = playerResultBoard.players[existingIndex];
            existingPlayer.betAmount += betAmount;
            existingPlayer.lastBetTime = new Date();
            existingPlayer.betChoices = existingPlayer.betChoices || {};
            existingPlayer.betChoices[betChoice] = (existingPlayer.betChoices[betChoice] || 0) + betAmount;
            
            playerResultBoard.players.splice(existingIndex, 1);
            playerResultBoard.players.unshift(existingPlayer);
        } else {
            const newPlayerEntry = {
                uid: player.UID,
                name: playerName,
                originalName: player.profile.name,
                betAmount: betAmount,
                lastBetTime: new Date(),
                betChoices: { [betChoice]: betAmount },
                winAmount: null, 
            };
            
            playerResultBoard.players.unshift(newPlayerEntry);
            
            if (playerResultBoard.players.length > this.maxPlayers) {
                playerResultBoard.players.pop();
            }
            
            playerResultBoard.totalPlayers = this.countTotalPlayers();
        }
    }

    updateWinAmounts(settlementResult: any, odds: any) {
        const { playerResultBoard } = this.gameData;
        
        playerResultBoard.players.forEach(player => {
            let totalWin = 0;
            let totalBet = 0;
            
            Object.entries(player.betChoices).forEach(([choice, amount]) => {
                totalBet += Number(amount);
                if (settlementResult[choice]) {
                    const winAmount = Number(amount) * odds[choice];
                    totalWin += winAmount;
                }
            });
            
            player.winAmount = totalWin > 0 ? totalWin : -totalBet;
        });
        
        playerResultBoard.isSettled = true;
    }

    resetForNewRound() {
        const { playerResultBoard } = this.gameData;
        playerResultBoard.players = [];
        playerResultBoard.totalPlayers = 0;
        playerResultBoard.isSettled = false;
    }

    getBoardData() {
        const { playerResultBoard } = this.gameData;
        
        return {
            roundId: this.gameData.roundId,
            totalPlayers: playerResultBoard.totalPlayers,
            players: playerResultBoard.players.map(player => ({
                uid: player.uid,
                name: player.name,
                betAmount: player.betAmount,
                winAmount: player.winAmount,
                lastBetTime: player.lastBetTime
            })),
            isSettled: playerResultBoard.isSettled
        };
    }

    countTotalPlayers() {
        return Object.keys(this.gameData.ingame).length;
    }
}

