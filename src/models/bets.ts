import mongoose from "mongoose";
import gameSettings from "../game-settings";
import { BetSchema } from "sc-game-base/src/core/models";

const bet = {
    odd: { type: Number, default: 0 },
    even: { type: Number, default: 0 },
    red2: { type: Number, default: 0 },
    red3: { type: Number, default: 0 },
    red4: { type: Number, default: 0 },
    white3: { type: Number, default: 0 },
    white4: { type: Number, default: 0 },
};

const bets = mongoose.model(
    `${gameSettings.name.toLocaleLowerCase()}_bets`,
    new mongoose.Schema({
        ...BetSchema.betBaseSchema,
        ...bet,
    })
);

const tmpBets = mongoose.model(
    `${gameSettings.name.toLocaleLowerCase()}_tmpbets`,
    new mongoose.Schema({ ...BetSchema.tempBetBaseSchema, ...bet })
);

export { bets as Bets, tmpBets as TmpBets };
