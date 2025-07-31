import mongoose from "mongoose";
import gameSettings from "../game-settings";

const schema = new mongoose.Schema({
    uid: { type: String, required: true },
    name: { type: String, required: true },
    time: { type: Date },
    freeBet: { type: Boolean, default: false },

    choice: { type: String, required: true },
    amount: { type: Number, default: 0 },

    clientSentTime: { type: Date },
    receivedTime: { type: Date },
    roundId: { type: Number, default: 0, required: true },

    siteId: { type: String },
    currency: { type: String, default: "" },
    rate: { type: Number, default: 0 },
    operatorId: { type: String, required: false },
    playerId: { type: String },
    appType: { type: Number, default: 0 },
});

const modelName = `${gameSettings.name.toLocaleLowerCase()}_betlogs`;
export default mongoose.model(modelName, schema);
