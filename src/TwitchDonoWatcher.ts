import * as tmi from "tmi.js"
import DonoTracker from "./DonoTracker";
import HoagieClient from "./HoagieClient";
import HoagieDbClient from "./HoagieDbClient";
import Secrets from "./Secrets";
import StreamElements from "./StreamElements";
import TwitchClient from "./TwitchClient";

export default class TwitchDonoWatcher {
    channels: string[] = [];
    twitchClient = new TwitchClient();
    streamInfo: Record<string, any> = {};
    hoagieDbClients: Record<string, HoagieDbClient> = {};
    hoagieClients: Record<string, HoagieClient> = {};
    donoTracker: DonoTracker = new DonoTracker(this.hoagieClients);
    historyWritten = new Set<string>();

    connected: boolean = false;

    constructor() {
    }

    public async run() {
        try {
            await Secrets.init();
            const config = await (new HoagieDbClient("n/a").getConfig());
            this.channels = Array.from(config?.streamers.values() ?? []);
            console.log(this.channels);
            const client = new tmi.Client({
                channels: [...this.channels]
            });

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
                            console.log({ newStream: info.id });
                            dbClient.setStreamHistory(info.id)
                            this.historyWritten.add(info.id);
                        }
                    }
                });
            }, 5000)

            const self = this;

            setInterval(() => {
                if (!this.connected) {
                    console.log("Trying to reconnect...");
                    client.connect()
                }
            }, 1000);

            client.on("message", (channel, userstate, message, selfBool) => {

                // Look for streamlabs/streamelements dono messages (different for all channels)
                if (userstate["display-name"]?.toLowerCase() === "streamlabs" || userstate["display-name"]?.toLowerCase() === "streamelements") {
                    if (message.includes("$")) {
                        try {
                            const regex = StreamElements.getDonoRegex(channel);
                            console.log({ channel, message });
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

            client.on("roomstate", (channel, state) => {
                console.log({ channel, state });
            });

            client.on("cheer", (channel, userstate, message) => {
                console.log({ type: "cheer", user: userstate["display-name"], message });
                console.log(userstate.bits ?? 0);
                try {
                    const channelName = channel.toLowerCase().replace("#", "");
                    self.donoTracker.handleCheer(channelName, self.streamInfo[channelName], userstate);
                } catch (err) {
                    console.error(err);
                }
            })

            client.on("subscription", (channel, username, methods, message, userstate) => {
                console.log({ type: "subscription", username, message, methods });
                try {
                    const channelName = channel.toLowerCase().replace("#", "");
                    self.donoTracker.handleSub(channelName, self.streamInfo[channelName], username, methods?.plan ?? "1000");
                } catch (err) {
                    console.error(err);
                }
            })

            client.on("resub", (channel, username, method, message, userstate, methods: any) => {
                console.log({ type: "subscription", username, message, method, plan: methods['msg-param-sub-plan'] });
                try {
                    const channelName = channel.toLowerCase().replace("#", "");
                    self.donoTracker.handleSub(channelName, self.streamInfo[channelName], username, methods['msg-param-sub-plan'] ?? "1000");
                } catch (err) {
                    console.error(err);
                }
            })

            client.on("subgift", (channel, username, method, message, userstate, methods) => {
                console.log({ type: "subgift", username, message, method, methods, plan: methods['msg-param-sub-plan'] });
                try {
                    const channelName = channel.toLowerCase().replace("#", "");
                    self.donoTracker.handleSubGifts(channelName, self.streamInfo[channelName], username, methods['msg-param-sub-plan'] ?? "1000");
                } catch (err) {
                    console.error(err);
                }
            })

            client.on("connected", (address, port) => {
                console.log("connected");
                this.connected = true;
            });
            client.on("disconnected", async (reason) => {
                console.log({ disconnected: reason });
                this.connected = false;
            })
            client.connect();
        } catch (err) {
            console.error(err);
            setTimeout(() => this.run(), 10000);
        }
    }

    private async sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}