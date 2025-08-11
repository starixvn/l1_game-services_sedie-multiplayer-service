import { Table } from "sc-game-base";
import { PlayerResultBoardPublisher } from "../publishers";
import { PlayerResultBoardManager } from "../helpers";

export default class SettleGameRoundConsumer extends Table.EventConsumers.TableSettleGameRoundConsumer {
    private playerResultBoardPublisher: PlayerResultBoardPublisher;
    private playerResultBoardManager: PlayerResultBoardManager;

    constructor(params: any, playerResultBoardPublisher: PlayerResultBoardPublisher, playerResultBoardManager: PlayerResultBoardManager) {
        super(params);
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
                    this.playerResultBoardManager.updateWinAmounts(settlementResult, bet);
                })
            );
        }
        const boardData = this.playerResultBoardManager.getBoardData();
        this.playerResultBoardPublisher.publishFinalResults(boardData);
    }
}
