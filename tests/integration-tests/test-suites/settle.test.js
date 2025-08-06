import { GameClientDriver, eventTypes, normalUser } from "sc-game-service-integration-utils";
import appConfigs from "../../../build/app-configs.IGT";
import gameSettings from "../_stubs/game-settings";
import { socketOptionsFunc } from "../_stubs/test-data";
import { getTimeOutToPlacingBetTime, initUserSession } from "../helper/helper";

const socketOptions = socketOptionsFunc(appConfigs.hostingPort);

describe("when settle", () => {
    describe("test data settle", () => {
        let client;

        beforeEach(async () => {
            client = new GameClientDriver(socketOptions, initUserSession(normalUser));

            const sendSignInInterval = setInterval(() => {
                client.sendSignInEvent();
            }, 500);

            await client.handleSignedInEvent();

            client.sendInGameEvent();

            clearInterval(sendSignInInterval);
        });

        afterEach(() => {
            client.close();
            client = null;
        });

        it(
            "should return settled status data",
            async () => {
                // Arrange
                const inGameData = await client.handleGameEvent((data) => data.remainingTime);
                const timeout = getTimeOutToPlacingBetTime(inGameData.remainingTime, gameSettings.durations) * 1000;

                setTimeout(() => {
                    client.emit(eventTypes.bet, { betChoice: "odd", amount: 100, clientSeed: "1234" });
                }, timeout);

                // Act
                const result = await client.handleGameEvent((data) => data.status);
                const { status } = result;

                // Assert
                expect(status.bet).toBeGreaterThanOrEqual(100);
            },
            60 * 1000
        );
    });
});
