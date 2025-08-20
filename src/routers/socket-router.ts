import { BaseSocketRouter } from "sc-game-base/src/core/routers";
import { RebetConsumer } from "../consumers";

export default class SocketRouter extends BaseSocketRouter {
    declare rebetConsumer: RebetConsumer;

    constructor(props: any) {
        super(props);
        this.rebetConsumer = props.rebetConsumer;
    }

    init(socketClient: any) {
        super.init(socketClient);
        this.socketClient.on("rebet", this.handleRebet.bind(this));
    }

    handleRebet(payload: any) {
        try {
            if (!this.verify()) {
                return;
            }
            this.rebetConsumer.consume(this.gameData.realPlayers[this.socketClient.id], payload);
        } catch (error) {
            this.logService.logError(error);
        }
    }
}
