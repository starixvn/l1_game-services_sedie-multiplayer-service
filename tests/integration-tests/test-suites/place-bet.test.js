import { describe, expect } from "@jest/globals";
import { GameClientDriver, eventTypes, normalUser } from "sc-game-service-integration-utils";
import appConfigs from "../../../build/app-configs.IGT";
import gameSettings from "../_stubs/game-settings";
import { socketOptionsFunc } from "../_stubs/test-data";
import { getTimeOutToPlacingBetTime, initUserSession } from "../helper/helper";

const socketOptions = socketOptionsFunc(appConfigs.hostingPort);

describe("when place bet", () => {
    let client;

    beforeAll(async () => {
        client = new GameClientDriver(socketOptions, initUserSession(normalUser));

        const sendSignInInterval = setInterval(() => {
            client.sendSignInEvent();
        }, 500);

        await client.handleSignedInEvent();

        client.sendInGameEvent();
        clearInterval(sendSignInInterval);
    });

    afterAll(() => {
        client.close();
        client = null;
    });

    describe("when place bet in placing bet time with valid client seed", () => {
        it("should return own bet data", async () => {
            // Arrange
            const inGameData = await client.handleGameEvent((data) => data.remainingTime);

            const timeout = getTimeOutToPlacingBetTime(inGameData.remainingTime, gameSettings.durations) * 1000;

            // Act
            setTimeout(() => {
                client.emit(eventTypes.bet, { betChoice: "odd", amount: 100, clientSeed: "1000" });
            }, timeout);

            // Assert
            const data = await client.handleGameEvent((data) => data.endBet);

            expect(data.endBet).toEqual(100);
        });
    });

    describe("when place bet in placing bet time without valid client seed", () => {
        it(
            "should return own bet = -1",
            async () => {
                // Arrange
                const inGameData = await client.handleGameEvent((data) => data.remainingTime);

                const timeout = getTimeOutToPlacingBetTime(inGameData.remainingTime, gameSettings.durations) * 1000;

                // Act
                setTimeout(() => {
                    client.emit(eventTypes.bet, { betChoice: "odd", amount: 100 });
                }, timeout);

                // Assert
                const data = await client.handleGameEvent((data) => data.endBet);

                expect(data.endBet).toEqual(-1);
            },
            60 * 1000
        );
    });
});
