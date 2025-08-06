import { generateResult, getSettlementResult } from "../../../src/helpers/result-helper";
import { NUMBER_BUTTONS } from "../../../src/constants";

describe("ResultHelper", () => {
    describe("generateResult", () => {
        it("should generate result with correct structure for valid input", () => {
            // Arrange
            const finalHash = "a1b2c3d4";
            const serverSeed = '{"random":"10;20;30;40","secret":"test-secret"}';

            // Act
            const result = generateResult({ finalHash, serverSeed });

            // Assert
            expect(Object.keys(result)).toEqual(["red1", "red2", "red3", "red4"]);
            Object.values(result).forEach((value) => {
                expect(typeof value).toBe("boolean");
            });
        });

        it("should generate expected result", () => {
            // Arrange
            const finalHash = "a1b2c3d4";
            const serverSeed = '{"random":"10;20;30;40","secret":"test-secret"}';

            // Act
            const result = generateResult({ finalHash, serverSeed });

            // Assert
            expect(result).toEqual({
                red1: true,
                red2: false,
                red3: true,
                red4: false,
            });
        });
    });

    describe("getSettlementResult", () => {
        const testCases = [
            {
                result: { red1: false, red2: false, red3: false, red4: false },
                expected: { odd: false, even: true, red2: false, red3: false, red4: false, white3: false, white4: true },
            },
            {
                result: { red1: true, red2: false, red3: false, red4: false },
                expected: { odd: true, even: false, red2: false, red3: false, red4: false, white3: true, white4: false },
            },
            {
                result: { red1: false, red2: true, red3: true, red4: false },
                expected: { odd: false, even: true, red2: true, red3: false, red4: false, white3: false, white4: false },
            },
            {
                result: { red1: true, red2: false, red3: true, red4: true },
                expected: { odd: true, even: false, red2: false, red3: true, red4: false, white3: false, white4: false },
            },
            {
                result: { red1: true, red2: true, red3: true, red4: true },
                expected: { odd: false, even: true, red2: false, red3: false, red4: true, white3: false, white4: false },
            },
        ];
        it.each(testCases)("should return settlement result with all choice types", ({ result, expected }) => {
            // Act
            const actual = getSettlementResult(result);

            // Assert
            expect(actual).toEqual(expected);
        });
    });
});
