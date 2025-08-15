import { BaseEventPublisher } from "sc-game-base/src/core/event-publishers";
import { Table } from "sc-game-base";
import { PlayerResultBoardPublisher } from "../publishers";
import { PlayerResultBoardManager } from "../helpers";
import { TableGameDefinition } from "sc-game-base/src/table";
import GameData from "../game-data";
import GameManagementApiClientFactory, { getOrDefault } from "sc-game-base/src/core/game-management-api";

export default class GameBot extends Table.Crons.TableGameConfigBot {
    private readonly playerResultBoardPublisher: PlayerResultBoardPublisher;
    private readonly playerResultBoardManager: PlayerResultBoardManager;

    constructor(
        definition: TableGameDefinition,
        gameData: GameData,
        publisher: BaseEventPublisher,
        gameManagementApiClientFactory: GameManagementApiClientFactory,
        tempBetsRepository: any,
        playerResultBoardPublisher: PlayerResultBoardPublisher,
        playerResultBoardManager: PlayerResultBoardManager
    ) {
        super(definition, gameData, publisher, gameManagementApiClientFactory, tempBetsRepository);
        this.playerResultBoardPublisher = playerResultBoardPublisher;
        this.playerResultBoardManager = playerResultBoardManager;
    }

    updateAndPublishPlayerResultBoard(player: any, bet: any) {
        this.playerResultBoardManager.addOrUpdatePlayer(player, bet.amount, this.gameData.roundId);
        const boardData = this.playerResultBoardManager.getBoardData();
        this.playerResultBoardPublisher.publishBoardUpdate(boardData);
    }

    async placeBets(botsToBet: any) {
        const botBets = (await Promise.all(botsToBet.map(async (bot: any) => this.calculateBet(bot)))).filter((bet: any) => bet);
        const payload = { bots: botBets.map((bet) => ({ id: bet.id, deductionAmount: bet.amount })) };
        const validBots = await getOrDefault(this.gameManagementApiClient.users.updateBotsBalance(payload), []);
        validBots.forEach(async (validBot: any) => {
            const bet = botBets.find((bet) => bet.id === validBot.id);
            const { bot, choice, amount, currentBet } = bet;
            bot.clientSeed = this.generateClientSeed();
            await this.insertOrUpdateBet(bot, choice, amount, currentBet);
            
            this.totalTickets += 1;
            this.updateTotalBetsAndChips(choice, amount);
            this.updateBotInRoomData(bot, choice, amount, validBot.red);
            this.updateBalanceAndPublishBetPayload(bot.id, choice, amount, validBot.red);
            
            this.updateAndPublishPlayerResultBoard(bot, bet);
        });
    }
}

