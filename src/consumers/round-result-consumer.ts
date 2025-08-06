import { Core } from "sc-game-base";
import { ServerSeedHelper } from "sc-game-base/src/core/helpers";
import { SERVER_SEED_SECRET_LENGTH } from "../constants";
import { RandomNumberHelper } from "../helpers";

export default class RoundResultConsumer extends Core.BaseEventConsumers.RoundResultConsumer {
    generateServerSeed() {
        const { randomMode } = this.gameData.gameConfigs;
        const randomNumbers = RandomNumberHelper.generateRandomNumbers(randomMode).join(";");
        const serverSeedSecret = ServerSeedHelper.generateServerSeed(randomMode, SERVER_SEED_SECRET_LENGTH);
        return `{"random":"${randomNumbers}","secret":"${serverSeedSecret}"}`;
    }

    getDataForGenerateResult() {
        const { finalHash, serverSeed } = this.gameData.pf;
        return { finalHash, serverSeed };
    }
}
