import { Table } from "sc-game-base";
import { PlayerResultBoardPublisher } from "../publishers";
import { PlayerResultBoardManager } from "../helpers";

export default class ProcessBetQueue extends Table.Crons.TableProcessBetQueue {
    private playerResultBoardPublisher: PlayerResultBoardPublisher;
    private playerResultBoardManager: PlayerResultBoardManager;

    constructor(params: any, playerResultBoardPublisher: PlayerResultBoardPublisher, playerResultBoardManager: PlayerResultBoardManager) {
        super(params);
        this.playerResultBoardPublisher = playerResultBoardPublisher;
        this.playerResultBoardManager = playerResultBoardManager;
    }

    async handleSuccessBet(player: any, balance: any, roundId: any, bet: any) {
        await super.handleSuccessBet(player, balance, roundId, bet);

        this.playerResultBoardManager.addOrUpdatePlayer(player, bet.amount, bet.betChoice);
        const boardData = this.playerResultBoardManager.getBoardData();
        this.playerResultBoardPublisher.publishBoardUpdate(boardData);
    }
}
