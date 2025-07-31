import mongoose from "mongoose";
import gameSettings from "../game-settings";
const bet = {
    uid: { type: String, required: true },
    name: { type: String, required: true },

    odd: { type: Number, default: 0 },
    even: { type: Number, default: 0 },
    red2: { type: Number, default: 0 },
    red3: { type: Number, default: 0 },
    red4: { type: Number, default: 0 },
    white3: { type: Number, default: 0 },
    white4: { type: Number, default: 0 },

    betwin: { type: Number, default: 0 },
    time: { type: Date },
    odds: { type: Object },

    siteId: { type: String },
    freeBet: { type: Boolean, default: false },

    playerId: { type: String },
    operatorId: { type: String, required: false },
    roundId: { type: Number, default: 0 },
    paid: { type: Boolean, default: false },
    appType: { type: Number, default: 0 },
};

const bets = mongoose.model(
    `${gameSettings.name.toLocaleLowerCase()}_bets`,
    new mongoose.Schema({
        ...bet,
        currency: { type: String, require: true },
        rate: { type: Number, require: true },
        partnerId: { type: String, require: true },
    })
);
const tmpBets = mongoose.model(`${gameSettings.name.toLocaleLowerCase()}_tmpbets`, new mongoose.Schema(bet));

export { bets as SedieBets, tmpBets as SedieTmpBets };
