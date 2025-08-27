import GameData from "../game-data";

interface PlayerEntry {
    uid: string;
    roundId: number;
    name: string;
    betAmount: number;
    lastBetTime: Date;
    winAmount: number | null;
    rate: number;
}

export default class PlayerResultBoardManager {
    private readonly gameData: GameData;
    private readonly maxPlayers: number = 10;

    constructor(gameData: GameData) {
        this.gameData = gameData;
    }

    addOrUpdatePlayer(player: any, betAmount: number, roundId: number) {
        if (roundId !== this.gameData.roundId) {
            return;
        }

        const rate = this.calculateCurrencyRate(player.session);

        const { playerResultBoard } = this.gameData;
        const uid = player.UID || player.id;
        const name = player.profile?.name || player.name;

        const index = playerResultBoard.players.findIndex((p) => p.uid === uid);

        const betAmountByRate = betAmount * rate;

        if (index !== -1) {
            this.updateExistingPlayer(index, betAmountByRate);
        } else {
            this.addNewPlayer(uid, name, betAmountByRate, roundId, rate);
        }
    }

    updateWinAmounts(bet: any) {
        const { playerResultBoard } = this.gameData;
        const index = playerResultBoard.players.findIndex((p) => p.uid === bet.uid);

        if (index === -1) {
            return;
        }

        const player = playerResultBoard.players[index];
        const rate = player.rate ?? 1;
        player.winAmount = bet.betwin * rate;
    }

    resetForNewRound() {
        this.gameData.playerResultBoard = {
            players: [],
            totalPlayers: 0,
            isSettled: false,
        };
    }

    setSettled() {
        this.gameData.playerResultBoard.isSettled = true;
    }

    getBoardData(roundId?: number) {
        if (roundId !== undefined && roundId !== this.gameData.roundId && !this.gameData.playerResultBoard.isSettled) {
            this.resetForNewRound();
        }
        this.filterPlayersByRound(roundId);
        const { totalPlayers, players, isSettled } = this.gameData.playerResultBoard;

        return {
            playerResultBoard: {
                roundId: roundId || this.gameData.roundId,
                totalPlayers,
                players: players.map(({ uid, name, betAmount, winAmount, lastBetTime }) => ({
                    uid,
                    name: this.maskPlayerName(name),
                    betAmount,
                    winAmount,
                    lastBetTime,
                })),
                isSettled,
            },
        };
    }

    private filterPlayersByRound(roundId?: number) {
        const currentRoundId = roundId ?? this.gameData.roundId;
        const { playerResultBoard } = this.gameData;
        playerResultBoard.players = playerResultBoard.players.filter((player) => player.roundId === currentRoundId);

        const currentCount = playerResultBoard.players.length;
        if(currentCount < this.maxPlayers) {
            playerResultBoard.totalPlayers = currentCount;
        }
    }

    private updateExistingPlayer(index: number, betAmount: number) {
        const { players } = this.gameData.playerResultBoard;
        const player = players[index];

        player.betAmount += betAmount;
        player.lastBetTime = new Date();

        players.splice(index, 1);
        players.unshift(player);
    }

    private addNewPlayer(uid: string, name: string, betAmount: number, roundId: number, rate: number) {
        const { playerResultBoard} = this.gameData;

        const newPlayer: PlayerEntry = {
            uid,
            roundId,
            name,
            betAmount,
            lastBetTime: new Date(),
            winAmount: null,
            rate,
        };

        playerResultBoard.players.unshift(newPlayer);
        playerResultBoard.totalPlayers++;

        if (playerResultBoard.players.length > this.maxPlayers) {
            playerResultBoard.players.pop();
        }
    }

    private maskPlayerName(name: string): string {
        if (!name || name.length <= 2) {
            return name;
        }

        if (name.length === 3) {
            const firstChar = name.charAt(0);
            const lastTwoChars = name.slice(-2);
            return `${firstChar}***${lastTwoChars}`;
        }

        const firstChar = name.charAt(0);
        const lastThreeChars = name.slice(-3);

        return `${firstChar}***${lastThreeChars}`;
    }

    private calculateCurrencyRate(session: any) {
        const rate = session?.multiplier * this.gameData.exchangeRates.code[session?.currencyCode];
        return isNaN(rate) ? 1 : rate;
    }
}
