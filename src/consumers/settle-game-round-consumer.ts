import { Table } from "sc-game-base";
import { PlayerResultBoardPublisher } from "../publishers";
import { PlayerResultBoardManager } from "../helpers";
import { GameDefinition } from "sc-game-base/src/core";
import GameData from "../game-data";
import { RoundResultPublisher, UserBetResultPublisher } from "sc-game-base/src/core/event-publishers";
import GameManagementApiClientFactory from "sc-game-base/src/core/game-management-api";

export default class SettleGameRoundConsumer extends Table.EventConsumers.TableSettleGameRoundConsumer {
    private readonly playerResultBoardPublisher: PlayerResultBoardPublisher;
    private readonly playerResultBoardManager: PlayerResultBoardManager;

    constructor({
        definition,
        gameData,
        roundResultPublisher,
        userBetResultPublisher,
        endGame,
        roundsRepository,
        betsRepository,
        gameManagementApiClientFactory,
        tempBetsRepository,
        playerResultBoardPublisher,
        playerResultBoardManager,
    }: {
        definition: GameDefinition;
        gameData: GameData;
        roundResultPublisher: RoundResultPublisher;
        userBetResultPublisher: UserBetResultPublisher;
        endGame: any;
        roundsRepository: any;
        betsRepository: any;
        gameManagementApiClientFactory: GameManagementApiClientFactory;
        tempBetsRepository: any;
        playerResultBoardPublisher: PlayerResultBoardPublisher;
        playerResultBoardManager: PlayerResultBoardManager;
    }) {
        super({
            definition,
            gameData,
            roundResultPublisher,
            userBetResultPublisher,
            endGame,
            roundsRepository,
            betsRepository,
            gameManagementApiClientFactory,
            tempBetsRepository,
        });
        
        this.playerResultBoardPublisher = playerResultBoardPublisher;
        this.playerResultBoardManager = playerResultBoardManager;
    }

    async settleBets({ settlementResult, roundId, time, result }: { settlementResult: any; roundId: any; time: any; result: any }) {
        const bets = await this.queryBets(roundId);

        if (bets && bets.length) {
            await Promise.all(
                bets.map(async (bet: any) => {
                    const odds = bet.odds ?? this.gameData.gameConfigs.odds;

                    const betResult = this.calculateBetResult(settlementResult, bet, odds);

                    bet.betwin = betResult.totalWin;
                    bet.paid = true;

                    await bet.save();
                    const metaData = this.createMetadata({ bet, settlementResult, result });
                    await this.callEndGame(bet, roundId, time, betResult, metaData);

                    this.captureBetResult(bet.uid, betResult, bet.rate);
                    await this.userBetResultPublisher.publish(bet.uid, betResult);
                    this.playerResultBoardManager.updateWinAmounts(bet);
                })
            );
        }
        this.playerResultBoardManager.setSettled();
        const boardData = this.playerResultBoardManager.getBoardData(roundId);
        this.playerResultBoardPublisher.publishFinalResults(boardData);
    }
}
