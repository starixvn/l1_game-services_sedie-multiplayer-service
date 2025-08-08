import appConfigs from "./app-configs";
import gameSettings from "./game-settings";
import { startTrace } from "sc-instrument";

startTrace(
    (appConfigs as any).otel?.enabled,
    (appConfigs as any).otel?.endpoint,
    (appConfigs as any).otel?.system,
    appConfigs.sentry.env,
    gameSettings.name
);

import { Core, Table } from "sc-game-base";
import { generateResult, getSettlementResult } from "./helpers/result-helper";
import ContainerRegistry from "./container-registry";
import TableGameData from "./game-data";

const run = async () => {
    const definition = new Table.TableGameDefinition(gameSettings, generateResult, getSettlementResult, () => {});
    const gameData = new TableGameData(gameSettings.durations.wholeRound);
    const container = new ContainerRegistry().register(appConfigs, definition, gameData);
    const app = new Core.BaseGameApp(gameSettings.name, appConfigs);

    await app.run();
    await app.startGame(container);
};

run();
