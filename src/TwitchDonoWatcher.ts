import * as tmi from "tmi.js"
import DonoTracker from "./DonoTracker";
import HoagieClient from "./HoagieClient";
import HoagieDbClient from "./HoagieDbClient";
import Secrets from "./secrets";
import StreamElements from "./StreamElements";
import TwitchClient from "./TwitchClient";

export default class TwitchDonoWatcher {
    channels: string[];
    client: tmi.Client;
    twitchClient = new TwitchClient();
    streamInfo: Record<string, any> = {};
    hoagieDbClients: Record<string, HoagieDbClient> = {};
    hoagieClients: Record<string, HoagieClient> = {};
    donoTracker: DonoTracker = new DonoTracker(this.hoagieClients);
    historyWritten = new Set<string>();

    constructor(channels: string[]) {
        this.channels = [...channels];
        this.client = new tmi.Client({
            channels
        });
    }

    public async run() {
        await Secrets.init();

        setInterval(async () => {
            const streamInfo = await Promise.all(this.channels.map(channel => this.twitchClient.getUserStream(channel)));
            streamInfo.forEach((info, i) => {
                this.streamInfo[this.channels[i].toLowerCase()] = info;
                if (info) {
                    const dbClient = new HoagieDbClient(this.channels[i]);
                    this.hoagieDbClients[this.channels[i].toLowerCase()] = dbClient;
                    const client = new HoagieClient(this.channels[i]);
                    this.hoagieClients[this.channels[i].toLowerCase()] = client;
                    if (!this.historyWritten.has(info.id)) {
                        console.log(info.id);
                        dbClient.setStreamHistory(info.id)
                        this.historyWritten.add(info.id);
                    }
                }
            });
        }, 5000)

        const self = this;
        this.client.on("message", (channel, userstate, message, selfBool) => {
            // Look for streamlabs/streamelements dono messages (different for all channels)
            if (userstate["display-name"]?.toLowerCase() === "streamlabs" || userstate["display-name"]?.toLowerCase() === "streamelements") {
                if (message.includes("$")) {
                    try {
                        const regex = StreamElements.getDonoRegex(channel);
                        console.log({ message });
                        if (regex) {
                            const matches = message.match(regex);

                            const username = matches?.groups?.username;
                            const amount = matches?.groups?.amount;
                            const channelName = channel.toLowerCase().replace("#", "");
                            if (username && amount) {
                                self.donoTracker.handleDono(channelName, self.streamInfo[channelName], username, amount);
                            }
                        }
                    } catch (err) {
                        console.error(err);
                    }
                }
            }
        });

        this.client.on("roomstate", (channel, state) => {
            console.log({ channel, state });
        });

        this.client.on("cheer", (channel, userstate, message) => {
            console.log({ type: "cheer", user: userstate["display-name"], message });
            console.log(userstate.bits ?? 0);
            const channelName = channel.toLowerCase().replace("#", "");
            self.donoTracker.handleCheer(channelName, self.streamInfo[channelName], userstate);
        })

        this.client.on("subscription", (channel, username, method, message, userstate) => {
            console.log({ type: "subscription", username, message, method });
            const channelName = channel.toLowerCase().replace("#", "");
            self.donoTracker.handleSub(channelName, self.streamInfo[channelName], username);
        })

        this.client.on("resub", (channel, username, method, message, userstate) => {
            console.log({ type: "subscription", username, message, method });
            const channelName = channel.toLowerCase().replace("#", "");
            self.donoTracker.handleSub(channelName, self.streamInfo[channelName], username);
        })

        this.client.on("subgift", (channel, username, method, message, userstate) => {
            console.log({ type: "subgift", username, message, method });
            const channelName = channel.toLowerCase().replace("#", "");
            self.donoTracker.handleSubGifts(channelName, self.streamInfo[channelName], username);
        })

        this.client.on("connected", (address, port) => {
            console.log("connected");
        });
        this.client.on("disconnected", (reason) => {
            console.log({ disconnected: reason });
        })
        this.client.connect();
    }
}