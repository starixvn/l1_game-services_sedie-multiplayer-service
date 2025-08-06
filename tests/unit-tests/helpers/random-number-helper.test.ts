import { generateRandomNumbers } from "../../../src/helpers/random-number-helper";
import { RANDOM_VALUE_RANGE } from "../../../src/constants";

describe("RandomNumberHelper", () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    describe("generateRandomNumbers", () => {
        const testCases = [0, 1, 2, 3, 4];
        it.each(testCases)("should return array of 4 numbers when mode is %s", (mode) => {
            // Arrange
            const iterations = 100;

            // Act & Assert
            for (let i = 0; i < iterations; i++) {
                const result = generateRandomNumbers(mode);

                expect(Array.isArray(result)).toBe(true);
                expect(result).toHaveLength(4);
                result.forEach((num) => {
                    expect(typeof num).toBe("number");
                    expect(num).toBeGreaterThanOrEqual(RANDOM_VALUE_RANGE.min);
                    expect(num).toBeLessThanOrEqual(RANDOM_VALUE_RANGE.max);
                });
            }
        });
    });
});
