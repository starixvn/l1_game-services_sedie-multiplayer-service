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
    private playerResultBoardManager: PlayerResultBoardManager;
    private playerResultBoardPublisher: PlayerResultBoardPublisher;

    constructor(
        definition: TableGameDefinition,
        gameData: GameData,
        userSignInPublisher: TableUserSignInPublisher,
        playGamePermissionValidator: PlayGamePermissionValidator,
        appConfigs: Object,
        gameManagementApiClientFactory: GameManagementApiClientFactory,
        playerResultBoardManager: PlayerResultBoardManager,
        playerResultBoardPublisher: PlayerResultBoardPublisher
    ) {
        super(definition, gameData, userSignInPublisher, playGamePermissionValidator, appConfigs, gameManagementApiClientFactory);
        
        this.playerResultBoardManager = playerResultBoardManager;
        this.playerResultBoardPublisher = playerResultBoardPublisher;
    }

    handleSignInSuccess(socketClient: Socket, userInfo: any, userSession: any) {
        super.handleSignInSuccess(socketClient, userInfo, userSession);
        const boardData = this.playerResultBoardManager.getBoardData();
        this.playerResultBoardPublisher.publishBoardDataToUser(userInfo.id, boardData);
    }
}
