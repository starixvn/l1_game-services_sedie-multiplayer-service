import { Table } from "sc-game-base";

export default class GameCron extends Table.Crons.TableGameCron {
    isStartingTime(remainingTime: number, durations: { placingBets: number; shakeThePlateDuration: number }) {
        return remainingTime === durations.placingBets + durations.shakeThePlateDuration;
    }
}
