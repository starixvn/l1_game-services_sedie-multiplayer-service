import { Table } from "sc-game-base";
import { PlayerResultBoardPublisher } from "../publishers";
import { PlayerResultBoardManager } from "../helpers";
import { GameDefinition } from "sc-game-base/src/core";
import GameData from "../game-data";
import { PlaceBetPublisher } from "sc-game-base/src/core/event-publishers";
import GameManagementApiClientFactory from "sc-game-base/src/core/game-management-api";
import BaseMetrics from "sc-game-base/src/core/base-metrics";

export default class ProcessBetQueue extends Table.Crons.TableProcessBetQueue {
    private readonly playerResultBoardPublisher: PlayerResultBoardPublisher;
    private readonly playerResultBoardManager: PlayerResultBoardManager;

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
        definition: GameDefinition;
        gameData: GameData;
        placeBetPublisher: PlaceBetPublisher;
        placeBet: any;
        logService: any;
        betsRepository: any;
        betLogsRepository: any;
        gameManagementApiClientFactory: GameManagementApiClientFactory;
        baseMetrics: BaseMetrics;
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

        this.playerResultBoardManager.addOrUpdatePlayer(player, bet.amount, roundId);
        const boardData = this.playerResultBoardManager.getBoardData();
        this.playerResultBoardPublisher.publishBoardUpdate(boardData);
    }
}
