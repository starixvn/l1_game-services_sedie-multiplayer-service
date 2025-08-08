import { Table } from "sc-game-base";

export default class GameData extends Table.TableGameData {
    playerResultBoard: { players: any[]; totalPlayers: number; isSettled: boolean; };
    
    constructor(remainingTime: number) {
        super(remainingTime); 
        this.playerResultBoard = {
            players: [],
            totalPlayers: 0,
            isSettled: false
        };
    }
}          