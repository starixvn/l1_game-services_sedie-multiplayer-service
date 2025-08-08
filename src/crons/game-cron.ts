import { Table } from "sc-game-base";
import { PlayerResultBoardManager } from "../helpers";

export default class GameCron extends Table.Crons.TableGameCron {
    private playerResultBoardManager: PlayerResultBoardManager;

    constructor(params: any, playerResultBoardManager: PlayerResultBoardManager) {
        super(params);
        this.playerResultBoardManager = playerResultBoardManager;
    }

    isStartingTime(remainingTime: number, durations: { placingBets: number; shakeThePlateDuration: number }) {
        return remainingTime === durations.placingBets + durations.shakeThePlateDuration;
    }

    resetForNewRound() {
        super.resetForNewRound();
        this.playerResultBoardManager.resetForNewRound();
    }
}
