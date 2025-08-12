import mongoose from "mongoose";
import { middlewares } from "sc-common";
import { users } from "sc-base-database";
import { normalUser } from "sc-game-service-integration-utils";
import {
    createCurrencyGroupGames,
    createDummyCurrency,
    createDummyUsers,
    createExchangeRate,
    createGameConfig,
    createPartnerConfig,
} from "sc-game-service-integration-utils";

import appConfigs from "../../../build/app-configs.IGT";
import { currencyData, game, gameConfig, pfResults, rounds, userBetData, playerBetLogData } from "./test-data";
import { Results, Rounds, Bets, BetLogs } from "../../../build/models";

const connectDatabase = async () => {
    await middlewares.database.configureDatabase(mongoose, appConfigs.database);

    await clearAllData();
};

const clearAllData = async () => {
    const collections = await mongoose.connection.db.collections();

    for (const collection of collections) {
        await collection.remove();
    }
};

export const createTestData = async () => {
    await connectDatabase();
    await createExchangeRate();
    await createGameConfig(gameConfig);
    const partnerConfig = await createPartnerConfig(game.id);

    const currency = await createDummyCurrency(partnerConfig.partnerId, currencyData.code, currencyData.name);
    await createCurrencyGroupGames(currency.groupId, game.id, gameConfig);
    await createDummyUsers(currency);
    await createGameData();
    await createUserBetData();

    console.log("Create exchange rate, game config & dummy user for testing successfully!");
    process.exit(0);
};

const createGameData = async () => {
    await Results.insertMany(pfResults);
    await Rounds.insertMany(rounds);
};

const getUserId = async (playerId) => {
    const user = await users.findOne({ "local.playerId": playerId }, { _id: true }).lean();
    return user?._id?.toString();
};

const createUserBetData = async () => {
    const uid = await getUserId(normalUser.playerId);
    if (!uid) return;

    await Bets.insertMany(userBetData(uid));
    await BetLogs.insertMany(playerBetLogData(uid));
};

createTestData();
