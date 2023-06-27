import * as tmi from "tmi.js"

export namespace HypeChat {
    export interface HypeChat {
        username: string
        amount: string
    }

    export function isHypeChat(userState: tmi.ChatUserstate): boolean {
        return !!userState['pinned-chat-paid-amount'];
    }

    export function parseHypeChat(userState: tmi.ChatUserstate): { username: string, amount: number } {
        const amountString = userState['pinned-chat-paid-amount'] ?? "0";
        const amount = parseInt(amountString) / 100;
        return {
            username: userState.username ?? "",
            amount
        }
    }
}