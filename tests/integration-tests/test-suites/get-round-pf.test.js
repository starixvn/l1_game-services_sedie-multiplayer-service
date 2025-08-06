import { GameClientDriver, normalUser } from "sc-game-service-integration-utils";
import { initUserSession } from "../helper/helper";
import { socketOptionsFunc } from "../_stubs/test-data";
import appConfigs from "../../../build/app-configs.IGT";

const socketOptions = socketOptionsFunc(appConfigs.hostingPort);

describe("when getRoundPF", () => {
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

    it("should return pfInfo", async () => {
        // Arrange
        client.emit("getRoundPF", { roundId: 1 });
        const pfInfo = {
            roundId: 1,
            serverSeedHash: "833d21eb4a79b5d4e7aaa46c2dea31febcfea28cac097b95d7da1cc364c03f41",
            serverSeed: '{"random":"52;64;28;59","secret":"pTd2onBR3lReJeAt7X0LaPB8ahemhx0C"}',
            finalHash:
                "cd64e519c7b78d977c0a0a571615a290b68ba1dcb745a9ca8bcf65352ea25dec574465c55416e3e31dc94f18dfd7cba012764b3c6220959bdb5a30a266ad349b",
            mergeSeed: '{"random":"52;64;28;59","secret":"pTd2onBR3lReJeAt7X0LaPB8ahemhx0C"}',
        };

        // Act
        const actual = await client.handleGameEvent((data) => data.roundPFResult);

        // Assert
        expect(actual.roundPFResult.roundId).toEqual(pfInfo.roundId);
        expect(actual.roundPFResult.serverSeedHash).toEqual(pfInfo.serverSeedHash);
        expect(JSON.stringify(actual.roundPFResult.serverSeed)).toEqual(JSON.stringify(pfInfo.serverSeed));
        expect(JSON.stringify(actual.roundPFResult.finalHash)).toEqual(JSON.stringify(pfInfo.finalHash));
        expect(JSON.stringify(actual.roundPFResult.mergeSeed)).toEqual(JSON.stringify(pfInfo.mergeSeed));
    });
});
