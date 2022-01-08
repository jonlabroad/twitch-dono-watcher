import axios from "axios";

export interface SetDonoRequest {
    streamerLogin: string
    userLogin: string
    type: "cheer" | "dono" | "sub" | "subgift"
    amount: number
}

export default class HoagieClient {
    readonly BASE_URL = process.env.NODE_ENV === "production" ? 'https://hoagietools-svc-prod.hoagieman.net/api/' : 'https://hoagietools-svc-development.hoagieman.net/api/';
    channel: string;

    constructor(channel: string) {
        this.channel = channel;
    }

    public async addDono(username: string, type: "cheer" | "dono" | "sub" | "subgift", amount: number) {
        try {
            const body = {
                streamerLogin: this.channel,
                userLogin: username,
                type,
                amount,
            };
            const url = `${this.BASE_URL}adddono`;
            console.log(url);
            console.log(body);
            await axios.post(url, body);
        } catch (err) {
            console.error(err);
        }
    }
}