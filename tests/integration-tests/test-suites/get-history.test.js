import { GameClientDriver, normalUser, eventTypes } from "sc-game-service-integration-utils";
import { initUserSession } from "../helper/helper";
import { socketOptionsFunc } from "../_stubs/test-data";
import appConfigs from "../../../build/app-configs.IGT.js";

const socketOptions = socketOptionsFunc(appConfigs.hostingPort);

describe("when get history", () => {
    let driver;

    beforeAll(async () => {
        driver = new GameClientDriver(socketOptions, initUserSession(normalUser));
        
        const sendSignInInterval = setInterval(() => {
            driver.sendSignInEvent();
        }, 500);

        await driver.handleSignedInEvent();
        
        driver.sendInGameEvent();
        await driver.handleGameEvent((inGameData) => inGameData.remainingTime);
        
        clearInterval(sendSignInInterval);
    });

    afterAll(() => {
        driver.close();
    });

    it("should return history with proper structure", async () => {
        // Arrange
        const expectedStructure = {
            history: {
                betLogs: expect.any(Array),
                total: expect.any(Number),
                page: expect.any(Number),
                pageSize: expect.any(Number),
            }
        };

        // Act
        driver.sendGetHistoryEvent();
        const result = await driver.handleGameEvent((historyData) => historyData.history);

        // Assert
        expect(result).toMatchObject(expectedStructure);
        expect(result.history.page).toBe(1);
        expect(result.history.pageSize).toBe(10);
        expect(result.history.total).toBeGreaterThanOrEqual(0);
        
        // Check bet log structure if any exist
        if (result.history.betLogs.length > 0) {
            const betLog = result.history.betLogs[0];
            expect(betLog).toHaveProperty('roundId');
            expect(betLog).toHaveProperty('name');
            expect(betLog).toHaveProperty('freeBet');
            expect(betLog).toHaveProperty('betwin');
            expect(betLog).toHaveProperty('odds');
            
            // Verify bet choices structure
            const expectedBetChoices = ['odd', 'even', 'red2', 'red3', 'red4', 'white3', 'white4'];
            expectedBetChoices.forEach(choice => {
                expect(betLog).toHaveProperty(choice);
                expect(typeof betLog[choice]).toBe('number');
            });
        }
    });

    it("should return seeded history with exact values", async () => {
        // Arrange
        driver.sendGetHistoryEvent();
        
        // Act
        const result = await driver.handleGameEvent((historyData) => historyData.history);

        // Assert
        const { history } = result;
        
        const seededRoundBetLogs = history.betLogs.filter((betLog) => betLog.roundId === 1 && betLog.name === "NormalUser");
        expect(seededRoundBetLogs.length).toBeGreaterThanOrEqual(1);

        const actualBetLogs = seededRoundBetLogs.slice(0, 1).map((betLog) => {
            const { result, settlementResult, betLogDetails, time, clientSeed, phien, totalAmount, ...rest } = betLog;
            return rest;
        });

        const expectedData = [
            {
                appType: 1,
                odd: 0,
                even: 100,
                red2: 0,
                red3: 0,
                red4: 0,
                white3: 0,
                white4: 0,
                betwin: 0,
                freeBet: false,
                name: "NormalUser",
                odds: {
                    even: 1.97,
                    odd: 1.97,
                    red3: 3.76,
                    white3: 3.76,
                    red4: 14.5,
                    white4: 14.5,
                    red2: 2.5,
                },
                rate: 1,
                roundId: 1,
            },
        ];

        expect(actualBetLogs).toEqual(expectedData);
    }, 30000);
});
