import * as tmi from "tmi.js"
import HoagieDbClient from "./HoagieDbClient";

export default class DonoTracker {
    hoagieDbClients: Record<string, HoagieDbClient>;

    constructor(hoagieDbClients: Record<string, HoagieDbClient>) {
        this.hoagieDbClients = hoagieDbClients;
    }

    public handleDono(channel: string,  streamInfo: any, username: string, amount: string) {
        const client = this.hoagieDbClients[channel.toLowerCase()];
        if (client && streamInfo) {
            const amountNum = parseInt(amount);
            client.addDono(username?.toLowerCase(), streamInfo.id, amountNum)
        }
    }

    public handleCheer(channel: string, streamInfo: any, userstate: tmi.Userstate) {
        const client = this.hoagieDbClients[channel.toLowerCase()];
        console.log({userstate});
        if (client && streamInfo) {
            const bits = parseInt(userstate.bits ?? 0);
            console.log({bits});
            client.addCheer(userstate.username?.toLowerCase(), streamInfo.id, userstate.bits ?? 0)
        }
    }

    public handleSub(channel: string, streamInfo: any, username: string) {
        const client = this.hoagieDbClients[channel.toLowerCase()];
        if (client && streamInfo) {
            client.addSub(username.toLowerCase(), streamInfo.id)
        } 
    }

    public handleSubGifts(channel: string, streamInfo: any, username: string) {
        const client = this.hoagieDbClients[channel.toLowerCase()];
        if (client && streamInfo) {
            client.addGiftSubs(username.toLowerCase(), streamInfo.id)
        } 
    }
}