import * as tmi from "tmi.js"
import HoagieClient from "./HoagieClient";

export default class DonoTracker {
    hoagieClients: Record<string, HoagieClient>;

    constructor(hoagieClients: Record<string, HoagieClient>) {
        this.hoagieClients = hoagieClients;
    }

    public handleDono(channel: string,  streamInfo: any, username: string, amount: string) {
        const client = this.hoagieClients[channel.toLowerCase()];
        if (client && streamInfo) {
            const amountNum = parseInt(amount);
            client.addDono(username?.toLowerCase(), "dono", amountNum)
        }
    }

    public handleCheer(channel: string, streamInfo: any, userstate: tmi.Userstate) {
        const client = this.hoagieClients[channel.toLowerCase()];
        console.log({userstate});
        if (client && streamInfo) {
            const bits = parseInt(userstate.bits ?? 0);
            console.log({bits});
            client.addDono(userstate.username?.toLowerCase(), "cheer", userstate.bits ?? 0)
        }
    }

    public handleSub(channel: string, streamInfo: any, username: string) {
        const client = this.hoagieClients[channel.toLowerCase()];
        if (client && streamInfo) {
            client.addDono(username.toLowerCase(), "sub", 1)
        } 
    }

    public handleSubGifts(channel: string, streamInfo: any, username: string) {
        const client = this.hoagieClients[channel.toLowerCase()];
        if (client && streamInfo) {
            client.addDono(username.toLowerCase(), "subgift", 1)
        } 
    }
}