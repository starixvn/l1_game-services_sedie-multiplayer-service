import { Table } from "sc-game-base";
import { PlayerResultBoardManager } from "../helpers";
import { GameDefinition } from "sc-game-base/src/core";
import GameData from "../game-data";
import { SettleGameRoundConsumer, RoundResultConsumer, RoundIdConsumer } from "sc-game-base/src/core/event-consumers";
import { GameStatusPublisher, RunningRoundInfoPublisher } from "sc-game-base/src/core/event-publishers";
import GameManagementApiClientFactory from "sc-game-base/src/core/game-management-api";
import { ProvablyFairConsumer, UnsettledRoundConsumer } from "sc-game-base/src/core/event-consumers";

export default class GameCron extends Table.Crons.TableGameCron {
    private playerResultBoardManager: PlayerResultBoardManager;

    constructor({
        definition,
        gameData,
        bot,
        settleGameRoundConsumer,
        gameStatusPublisher,
        runningRoundInfoPublisher,
        logService,
        roundResultConsumer,
        resultsRepository,
        appConfigs,
        gameManagementApiClientFactory,
        roundIdConsumer,
        provablyFairConsumer,
        unsettledRoundConsumer,
        playerResultBoardManager,
    }: {
        definition: GameDefinition;
        gameData: GameData;
        bot: any;
        settleGameRoundConsumer: SettleGameRoundConsumer;
        gameStatusPublisher: GameStatusPublisher;
        runningRoundInfoPublisher: RunningRoundInfoPublisher;
        logService: any;
        roundResultConsumer: RoundResultConsumer;
        resultsRepository: any;
        appConfigs: any;
        gameManagementApiClientFactory: GameManagementApiClientFactory;
        roundIdConsumer: RoundIdConsumer;
        provablyFairConsumer: ProvablyFairConsumer;
        unsettledRoundConsumer: UnsettledRoundConsumer;
        playerResultBoardManager: PlayerResultBoardManager;
    }) {
        super({
            definition,
            gameData,
            bot,
            settleGameRoundConsumer,
            gameStatusPublisher,
            runningRoundInfoPublisher,
            logService,
            roundResultConsumer,
            resultsRepository,
            appConfigs,
            gameManagementApiClientFactory,
            roundIdConsumer,
            provablyFairConsumer,
            unsettledRoundConsumer,
        });
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
