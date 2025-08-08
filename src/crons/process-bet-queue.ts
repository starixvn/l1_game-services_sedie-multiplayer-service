import { Table } from "sc-game-base";
import { PlayerResultBoardPublisher } from "../publishers";
import { PlayerResultBoardManager } from "../helpers";
import { TableGameDefinition } from "sc-game-base/src/table";
import GameData from "../game-data";

export default class ProcessBetQueue extends Table.Crons.TableProcessBetQueue {
    private playerResultBoardPublisher: PlayerResultBoardPublisher;
    private playerResultBoardManager: PlayerResultBoardManager;

    constructor({
        definition,
        gameData,
        placeBetPublisher,
        placeBet,
        logService,
        betsRepository,
        betLogsRepository,
        gameManagementApiClientFactory,
        baseMetrics,
        provablyFairConsumer,
        playerResultBoardPublisher,
        playerResultBoardManager,
    }: {
        definition: TableGameDefinition;
        gameData: GameData;
        placeBetPublisher: Table.EventPublishers.TablePlaceBetPublisher;
        placeBet: any;
        logService: any;
        betsRepository: any;
        betLogsRepository: any;
        gameManagementApiClientFactory: any;
        baseMetrics: any;
        provablyFairConsumer: any;
        playerResultBoardPublisher: PlayerResultBoardPublisher;
        playerResultBoardManager: PlayerResultBoardManager;
    }) {
        super({
            definition,
            gameData,
            placeBetPublisher,
            placeBet,
            logService,
            betsRepository,
            betLogsRepository,
            gameManagementApiClientFactory,
            baseMetrics,
            provablyFairConsumer,
        });
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
