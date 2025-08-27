import { SeedHelper, ServerSeedHelper } from "sc-game-base/src/core/helpers";
import { SERVER_SEED_SECRET_LENGTH } from "../../../src/constants";
import { RandomNumberHelper, ResultHelper } from "../../../src/helpers";

describe("statistic: 100,000 times", () => {
    const total = 100_000;
    const createSettlementResult = (mode: number) => {
        const randomNumber = RandomNumberHelper.generateRandomNumbers(mode).join(";");
        const serverSeedSecret = ServerSeedHelper.generateServerSeed(mode, SERVER_SEED_SECRET_LENGTH);
        const serverSeed = `{"random":"${randomNumber}","secret":"${serverSeedSecret}"}`;
        const length = Math.floor(Math.random() * 37) + 4; // Random length between 4 and 40
        const mergeClientSeed = Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
        const finalHash = SeedHelper.getSHA512Hash(serverSeed + mergeClientSeed);

        const result = ResultHelper.generateResult({ finalHash, serverSeed });
        return ResultHelper.getSettlementResult(result);
    };
    for (let mode = 1; mode <= 3; mode++) {
        it(`should generate results statistically correct with mode = ${mode}`, () => {
            // arrange
            const countResult: Record<string, number> = {
                even: 0,
                odd: 0,
                red2: 0,
                red3: 0,
                red4: 0,
                white3: 0,
                white4: 0,
            };

            for (let i = 0; i < total; i++) {
                const settlementResult = createSettlementResult(mode);
                Object.entries(settlementResult).forEach(([betChoice, result]) => {
                    countResult[betChoice] += +result;
                });
            }

            // assert
            const percentageResult = Object.keys(countResult).reduce((acc: Record<string, number>, betChoice: string) => {
                acc[betChoice] = +((countResult[betChoice] / total) * 100);
                return acc;
            }, {});
            console.log(`Mode:${mode}, countResult: ${JSON.stringify(countResult)}, percentageResult: ${JSON.stringify(percentageResult)}`);

            expect(percentageResult.odd).toBeGreaterThanOrEqual(49.5);
            expect(percentageResult.even).toBeGreaterThanOrEqual(49.5);

            expect(percentageResult.red2).toBeGreaterThanOrEqual(36.9);
            expect(percentageResult.red3).toBeGreaterThanOrEqual(24);
            expect(percentageResult.white3).toBeGreaterThanOrEqual(24);
            expect(percentageResult.red4).toBeGreaterThanOrEqual(6);
            expect(percentageResult.white4).toBeGreaterThanOrEqual(6);
        });
    }
});
