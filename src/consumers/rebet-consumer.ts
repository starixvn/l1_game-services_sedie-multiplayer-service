import { helpers } from "sc-common";
import PlaceBetConsumer from "./place-bet-consumer";

type Payload = {
    betChoices: Record<string, number>;
    amount: number;
    clientSeed: string;
    freeBet: boolean;
    roundId: number;
    receivedTime: Date;
    betChoice?: string;
    m?: string;
};
export default class RebetConsumer extends PlaceBetConsumer {
    declare validateBetRequest: (
        player: any,
        betChoices: string | Record<string, number>,
        amount: number,
        freeBet: boolean,
        roundId: number
    ) => boolean;

    mergeBetTracks(playerName: string, betChoices: Record<string, number>) {
        const { betTracks } = this.gameData.ingame[playerName] || { betTracks: {} };
        return Object.keys(betChoices).reduce(
            (acc, choice) => {
                acc[choice] = (acc[choice] ?? 0) + betChoices[choice];
                return acc;
            },
            { ...betTracks }
        ) as Record<string, number>;
    }

    override composeBetAmountValidationCriteria(
        player: any,
        betChoices: Record<string, number> | string,
        amount: number,
        freeBet: boolean
    ) {
        const settings = this.gameData.currencyGroupGames.find((x) => x.groupId.toString() === player.session.currencyGroupId) as any;
        const configs = this.gameData.gameConfigs;
        const betTracks = this.mergeBetTracks(player.profile.name, betChoices as Record<string, number>);
        const totalAmount = this.definition.choices.reduce((total, choice) => total + (betTracks[choice] || 0), 0);
        const minBet = Math.max(player.profile.minBet, settings.minBet);
        const maxBet = Math.min(player.profile.maxBet, settings.maxBet);
        const reachedMaxBetPerChoice = Object.keys(betTracks).find(
            (choice) => betTracks[choice] > Math.min(player.profile.maxBet, settings.maxBetPerChoices[choice])
        );
        const maxBetPerChoice = Math.min(player.profile.maxBet, settings.maxBetPerChoices[reachedMaxBetPerChoice ?? ""]);

        return [
            {
                failure: freeBet && !configs.enableFreeBet,
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet),
            },
            {
                failure: !!reachedMaxBetPerChoice,
                notice: this.getNoticeObj(helpers.noticeHelper.maxBetForChoice, { maxBet: maxBetPerChoice }),
            },
            {
                failure: amount < minBet || Object.values(betChoices).some((value) => value < minBet),
                notice: this.getNoticeObj(helpers.noticeHelper.minBet, { minBet }),
            },
            {
                failure: amount > maxBet || Object.values(betTracks).some((value) => value > maxBet),
                notice: this.getNoticeObj(helpers.noticeHelper.maxBet, { maxBet }),
            },
            {
                failure: totalAmount > maxBet,
                notice: this.getNoticeObj(helpers.noticeHelper.maxBet, { maxBet }),
            },
        ];
    }

    override composeBetChoiceValidationCriteria(betChoices: Record<string, number> | string) {
        const choices = Object.keys(betChoices as Record<string, number>);
        const isInvalid = choices.some((choice) => !this.definition.choices.includes(choice));
        return [
            {
                failure: isInvalid,
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet),
            },
        ];
    }

    override composeHedgeBetValidationCriteria(betChoices: Record<string, number> | string, player: any) {
        const { betTracks } = this.gameData.ingame[player.profile.name] || { betTracks: {} };
        const bets = betChoices as Record<string, number>;
        const data = { ...betTracks, ...bets };
        const hedgeBetGroup = this.definition.hedgeBetGroups?.find((group) => {
            return group.every((bet) => data[bet]);
        });

        return [
            {
                failure: !!hedgeBetGroup,
                notice: this.getNoticeObj(helpers.noticeHelper.disallowHedgeBet, { hedgeBetGroup }) as string,
            },
        ];
    }

    validateBetRequestParams(request: Payload) {
        const { betChoices } = request;

        return [
            {
                failure: Object.keys(betChoices).length === 0,
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet),
            },
        ];
    }

    getTotalAmount(payload: Payload) {
        const { betChoices } = payload;
        if (betChoices.length === 0) {
            return 0;
        }
        return Object.values(betChoices).reduce((acc, choice) => acc + choice, 0);
    }

    consume(player: any, payload: Payload) {
        Object.assign(payload, {
            amount: this.getTotalAmount(payload),
            freeBet: payload.freeBet ?? false,
            roundId: payload.roundId ?? this.gameData.roundId,
            mode: payload.m ?? this.DisplayMode.Landscape,
            receivedTime: new Date(),
        });

        const { amount, betChoices, freeBet, roundId } = payload;
        const name = player.profile.name;

        if (!this.validateRequestParams(payload, player) || !this.validateBetRequest(player, betChoices, amount, freeBet, roundId)) {
            return;
        }

        if (!this.gameData.ingame[name]) {
            this.initInGameData(player, payload);
        }

        this.adjustBetTracks(player.profile.name, payload);

        this.insertBetQueue(player, payload);
    }

    initInGameData(player: any, payload: any) {
        const name = player.profile.name;
        const newPlayer = {
            name: player.profile.name,
            currency: player.session.currencyName,
            system: player.session.system,
            betTracks: {},
            betQueue: [],
            clientSeed: payload.clientSeed,
            operatorId: player.session.operatorId,
        };

        this.gameData.ingame[name] = newPlayer;
    }

    adjustBetTracks(playerName: string, payload: Payload) {
        const { betChoices } = payload;
        Object.keys(betChoices).forEach((choice) => {
            if (this.gameData.ingame?.[playerName]) {
                const playerInGame = this.gameData.ingame[playerName];
                playerInGame.betTracks[choice] = (playerInGame.betTracks[choice] ?? 0) + betChoices[choice];
            }
        });
    }

    insertBetQueue(player: any, payload: Payload) {
        const name = player.profile.name;
        const { betChoices } = payload;
        Object.keys(betChoices).forEach((choice) => {
            const newPayload = { ...payload, betChoice: choice, amount: betChoices[choice] };
            this.gameData.ingame[name].betQueue.push({ player, payload: newPayload });
        });
    }
}
