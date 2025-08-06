import { NUMBER_BUTTONS } from "../constants";

const settlementRuleEntries = Object.entries({
    odd: (totalReds: number) => totalReds % 2 === 1,
    even: (totalReds: number) => totalReds % 2 === 0,
    red2: (totalReds: number) => totalReds === 2,
    red3: (totalReds: number) => totalReds === 3,
    red4: (totalReds: number) => totalReds === 4,
    white3: (totalReds: number) => totalReds === 1,
    white4: (totalReds: number) => totalReds === 0,
});

const parseFinalHashToNumbers = (finalHash: string, length: number) => {
    const increments = [];
    for (let i = 0; i < length; i++) {
        const value = parseInt(finalHash.slice(i * 2, i * 2 + 2), 16);
        increments.push(value);
    }
    return increments;
};

export const generateResult = ({ finalHash, serverSeed }: { finalHash: string; serverSeed: string }) => {
    const randomNumbers: number[] = JSON.parse(serverSeed)
        .random.split(";")
        .slice(0, NUMBER_BUTTONS)
        .map((x: string) => +x);

    const increments = parseFinalHashToNumbers(finalHash, randomNumbers.length);

    return randomNumbers.reduce((acc, x, index) => {
        acc[`red${index + 1}`] = (x + increments[index]) % 2 === 1;
        return acc;
    }, {} as Record<string, boolean>);
};

export const getSettlementResult = (roundResult: Record<string, boolean>) => {
    const totalReds = Object.values(roundResult).filter((value) => value === true).length;

    return settlementRuleEntries.reduce((result: Record<string, boolean>, [choice, rule]) => {
        result[choice] = rule(totalReds);

        return result;
    }, {});
};
