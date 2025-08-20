import awilix from "awilix";
import { Table } from "sc-game-base";
import { Bets, Rounds, TmpBets, Results, BetLogs } from "./models/index";
import { PlaceBetConsumer, RoundResultConsumer, SettleGameRoundConsumer, UserSigninConsumer, RebetConsumer } from "./consumers";
import { PlayerResultBoardPublisher } from "./publishers";
import { PlayerResultBoardManager } from "./helpers";
import { GameBot, GameCron, ProcessBetQueue } from "./crons";
import SocketRouter from "./routers/socket-router";

const { asClass, asValue } = awilix;

export default class ContainerRegistry extends Table.TableContainerRegistry {
    registerPFSettings() {
        this.container.register({
            maxCombinedClientSeeds: asValue(undefined),
        });
    }

    registerModels() {
        super.registerModels();

        this.container.register({
            roundsRepository: asValue(Rounds),
            betsRepository: asValue(Bets),
            tempBetsRepository: asValue(TmpBets),
            betLogsRepository: asValue(BetLogs),
            resultsRepository: asValue(Results),
        });
    }

    registerConsumers() {
        super.registerConsumers();

        this.container.register({
            placeBetConsumer: asClass(PlaceBetConsumer).singleton(),
            roundResultConsumer: asClass(RoundResultConsumer).singleton(),
            userSignInConsumer: asClass(UserSigninConsumer).singleton(),
            settleGameRoundConsumer: asClass(SettleGameRoundConsumer).singleton().proxy(),
            rebetConsumer: asClass(RebetConsumer).singleton(),
        });
    }

    registerPublishers() {
        super.registerPublishers();

        this.container.register({
            playerResultBoardPublisher: asClass(PlayerResultBoardPublisher).singleton(),
        });
    }

    registerCrons() {
        super.registerCrons();

        this.container.register({
            bot: asClass(GameBot).singleton(),
            gameCron: asClass(GameCron).singleton().proxy(),
            processBetQueue: asClass(ProcessBetQueue).singleton().proxy(),
        });
    }

    registerRouters() {
        super.registerRouters();
        this.container.register({
            socketRouter: asClass(SocketRouter).proxy(),
        });
    }

    registerHelpers() {
        this.container.register({
            playerResultBoardManager: asClass(PlayerResultBoardManager).singleton(),
        });
    }

    register(appConfigs: any, definition: any, gameData: any) {
        super.register(appConfigs, definition, gameData);
        this.registerHelpers();
        return this.container;
    }
}
