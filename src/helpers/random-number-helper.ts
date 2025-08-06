import Chance from "chance";
import randomLib1 from "random";
import { Random, MersenneTwister19937 } from "random-js";
import { randomInt } from "crypto";
import _ from "lodash";
import randomInteger from "random-int";
import { RANDOM_VALUE_RANGE } from "../constants";

function random1(min: number, max: number) {
    return randomInt(min, max + 1);
}

function random2(min: number, max: number) {
    const chance = new Chance();
    return chance.natural({ min: min, max: max });
}

function random3(min: number, max: number) {
    const chance = new Chance();
    return chance.integer({ min: min, max: max });
}

function random4(min: number, max: number) {
    return randomLib1.int(min, max);
}

function random5(min: number, max: number) {
    const randomJs = new Random(MersenneTwister19937.autoSeed());
    return randomJs.integer(min, max);
}

function random6(min: number, max: number) {
    return _.random(min, max);
}

function random7(min: number, max: number) {
    return randomInteger(min, max);
}

function random8(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min; // NOSONAR
}

const randomModes: Record<number, ((min: number, max: number) => number)[]> = {
    1: [random1, random2, random3, random4],
    2: [random5, random6, random7, random8],
    3: [random1, random3, random5, random7],
};

export const generateRandomNumbers = (mode: number) => {
    const selectedMode = mode >= 1 && mode <= 3 ? mode : 1;
    const value1 = randomModes[selectedMode][0](RANDOM_VALUE_RANGE.min, RANDOM_VALUE_RANGE.max);
    const value2 = randomModes[selectedMode][1](RANDOM_VALUE_RANGE.min, RANDOM_VALUE_RANGE.max);
    const value3 = randomModes[selectedMode][2](RANDOM_VALUE_RANGE.min, RANDOM_VALUE_RANGE.max);
    const value4 = randomModes[selectedMode][3](RANDOM_VALUE_RANGE.min, RANDOM_VALUE_RANGE.max);

    return [value1, value2, value3, value4];
};
