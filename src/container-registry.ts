import awilix from "awilix";
import { Table } from "sc-game-base";
import { Bets, Rounds, TmpBets, Results, BetLogs } from "./models/index";
import { PlaceBetConsumer, RoundResultConsumer } from "./consumers";
import GameCron from "./crons/game-cron";

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
        });
    }

    registerCrons() {
        super.registerCrons();

        this.container.register({
            gameCron: asClass(GameCron).singleton().proxy(),
        });
    }
}
