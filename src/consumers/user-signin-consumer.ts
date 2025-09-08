import { Table } from "sc-game-base";
import { PlayerResultBoardManager } from "../helpers";
import { PlayerResultBoardPublisher } from "../publishers";
import { TableGameDefinition } from "sc-game-base/src/table";
import GameData from "../game-data";
import { TableUserSignInPublisher } from "sc-game-base/src/table/event-publishers";
import GameManagementApiClientFactory from "sc-game-base/src/core/game-management-api";
import { PlayGamePermissionValidator } from "sc-game-base/src/core/validators";
import { Socket } from "socket.io";

export default class UserSigninConsumer extends Table.EventConsumers.TableUserSignInConsumer {
    private readonly playerResultBoardPublisher: PlayerResultBoardPublisher;
    private readonly playerResultBoardManager: PlayerResultBoardManager;

    // eslint-disable-next-line sonarjs/max-params
    constructor(
        definition: TableGameDefinition,
        gameData: GameData,
        userSignInPublisher: TableUserSignInPublisher,
        playGamePermissionValidator: PlayGamePermissionValidator,
        appConfigs: Object,
        gameManagementApiClientFactory: GameManagementApiClientFactory,
        playerResultBoardPublisher: PlayerResultBoardPublisher,
        playerResultBoardManager: PlayerResultBoardManager
    ) {
        super(definition, gameData, userSignInPublisher, playGamePermissionValidator, appConfigs, gameManagementApiClientFactory);
        this.playerResultBoardPublisher = playerResultBoardPublisher;
        this.playerResultBoardManager = playerResultBoardManager;
    }

    handleSignInSuccess(socketClient: Socket, userInfo: any, userSession: any) {
        super.handleSignInSuccess(socketClient, userInfo, userSession);
        
        const boardData = this.getBoardDataForUser();
        this.playerResultBoardPublisher.publishBoardDataToUser(userInfo.id, boardData);
    }

    private getBoardDataForUser() {
        const { durations } = this.definition;
        const remainingTime = this.gameData.remainingTime;
        const roundId = this.gameData.roundId;
        
        if (remainingTime > durations.placingBets && roundId > 1) {
            return this.playerResultBoardManager.getBoardData(roundId - 1);
        } else {
            return this.playerResultBoardManager.getBoardData();
        }
    }
}
