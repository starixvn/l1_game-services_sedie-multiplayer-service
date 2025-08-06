import { ServerSeedHelper } from "sc-game-base/src/core/helpers";
import RoundResultConsumer from "../../../src/consumers/round-result-consumer";
import { RandomNumberHelper } from "../../../src/helpers";
import { SERVER_SEED_SECRET_LENGTH } from "../../../src/constants";

// Mock dependencies
jest.mock("sc-game-base/src/core/helpers", () => ({
    ServerSeedHelper: {
        generateServerSeed: jest.fn(),
    },
}));

jest.mock("../../../src/helpers", () => ({
    RandomNumberHelper: {
        generateRandomNumbers: jest.fn(),
    },
}));

describe("RoundResultConsumer", () => {
    let roundResultConsumer: RoundResultConsumer;
    let mockGameData: any;

    beforeEach(() => {
        // Arrange

        mockGameData = {
            gameConfigs: {
                randomMode: 1,
            },
            pf: {},
        };
        // @ts-ignore
        roundResultConsumer = new RoundResultConsumer(mockGameData, {}, {}, {}, {});

        // Mock the instance properties
        (roundResultConsumer as any).gameData = mockGameData;
    });

    describe("generateServerSeed", () => {
        it("should generate server seed with correct format", () => {
            // Arrange
            mockGameData.gameConfigs.randomMode = 2;
            const mockRandomNumbers = [15, 25, 35, 45];
            const mockServerSeedSecret = "mock-secret-123";

            (RandomNumberHelper.generateRandomNumbers as jest.Mock).mockReturnValue(mockRandomNumbers);
            (ServerSeedHelper.generateServerSeed as jest.Mock).mockReturnValue(mockServerSeedSecret);

            // Act
            const result = roundResultConsumer.generateServerSeed();

            // Assert
            expect(RandomNumberHelper.generateRandomNumbers).toHaveBeenCalledWith(2);
            expect(ServerSeedHelper.generateServerSeed).toHaveBeenCalledWith(2, SERVER_SEED_SECRET_LENGTH);
            expect(result).toBe('{"random":"15;25;35;45","secret":"mock-secret-123"}');
        });
    });

    describe("getDataForGenerateResult", () => {
        it("should return finalHash and serverSeed from game data", () => {
            // Arrange
            const expectedFinalHash = "a1b2c3d4e5f6";
            const expectedServerSeed = '{"random":"10;20;30;40","secret":"test-secret"}';
            mockGameData.pf.finalHash = expectedFinalHash;
            mockGameData.pf.serverSeed = expectedServerSeed;

            // Act
            const result = roundResultConsumer.getDataForGenerateResult();

            // Assert
            expect(result).toEqual({
                finalHash: expectedFinalHash,
                serverSeed: expectedServerSeed,
            });
        });
    });
});
