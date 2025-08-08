import { BaseEventPublisher } from "sc-game-base/src/core/event-publishers";

export default class PlayerResultBoardPublisher extends BaseEventPublisher {
    publishBoardDataToUser(playerId: string, payload: any) {
        this.publishToUser(playerId, payload);
    }

    publishBoardUpdate(payload: any) {
        this.publishToAllUsers(payload);
    }

    publishFinalResults(payload: any) {
        this.publishToAllUsers(payload);
    }
}

