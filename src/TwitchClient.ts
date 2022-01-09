import axios, { AxiosResponse } from "axios";
import NodeCache from "node-cache";
import Config from "./Config";
import Secrets from "./secrets";
import { ChannelData, DataResponse, Game, LiveChannelData, Paginated, StreamData, UserData, UserFollows, UsersFollows, UserSubscriptions } from "./TwitchClientTypes";

export interface ValidatedSession {
    expires_in: number
    login: string
    user_id: string
}

export default class TwitchClient {
    cache: NodeCache;
    authToken: {
        access_token: string;
    } | undefined;

    constructor() {
        this.cache = new NodeCache();
    }

    async getAuthToken() {
        const clientSecret = Secrets.getInstance().secrets.twitchClientSecret;
        if (!this.authToken) {
            console.log(`https://id.twitch.tv/oauth2/token?client_id=${Config.clientId}&client_secret=${clientSecret}&grant_type=client_credentials`);
            const response = await axios.post(`https://id.twitch.tv/oauth2/token?client_id=${Config.clientId}&client_secret=${clientSecret}&grant_type=client_credentials`);
            if (response.status === 200 && response.data) {
                this.authToken = response.data;
            }
        }
        return this.authToken;
    }

    async getUsers(usernames: string[]): Promise<UserData[]> {
        const data = await this.getRequest(`https://api.twitch.tv/helix/users?${usernames.map(username => `login=${username}&`).join('')}`, true);
        return data.data;
    }

    async getUserStream(username: string): Promise<any> {
        await this.getAuthToken();
        const data = await this.getRequest(`https://api.twitch.tv/helix/streams?user_login=${username}`, false);
        return data.data[0];
    }

    async getUserSubscriptions(broadcasterId: string, userId: string): Promise<UserSubscriptions[]> {
        const data = await this.getRequest(`https://api.twitch.tv/helix/subscriptions/user?broadcaster_id=${broadcasterId}&user_id=${userId}`, true);
        return data.data;
    }

    async getUserFollows(broadcasterId: string, userId: string): Promise<UserFollows[]> {
        const data = await this.getRequest(`https://api.twitch.tv/helix/users/follows?to_id=${broadcasterId}&from_id=${userId}`, true);
        return data.data;
    }

    async getAllUsersFollowedChannels(broadcasterLogin: string): Promise<UserFollows[]> {
        let after = undefined;
        const follows: UserFollows[] = [];
        const broadcasterId = await this.getUserId(broadcasterLogin);
        do {
            const url = `https://api.twitch.tv/helix/users/follows?from_id=${broadcasterId}&first=100${after ? `&after=${after}` : ``}`;
            console.log(url);
            const page = await this.getRequest(url, true) as Paginated<UserFollows[]>;
            follows.push(...page.data);
            after = page.pagination?.cursor;
        } while (after);
        return follows;
    }

    async getLiveChannels(categoryName: string): Promise<LiveChannelData[]> {
        let after = undefined;
        const channels: LiveChannelData[] = [];
        do {
            const url = `https://api.twitch.tv/helix/search/channels?live_only=true&first=100${after ? `&after=${after}` : ``}&query=${encodeURIComponent(`${categoryName}`)}`;
            const page = await this.getRequest(url, false) as Paginated<LiveChannelData[]>;
            channels.push(...page.data);
            after = page.pagination?.cursor;
        } while (after);
        return channels;
    }

    async getChannel(broadcasterId: string): Promise<ChannelData[]> {
        const data = await this.getRequest(`https://api.twitch.tv/helix/channels?broadcaster_id=${broadcasterId}`, true);
        return data.data;
    }

    async getStreamsByUsernames(usernames: string[]): Promise<StreamData[]> {
        const data = await this.getRequest(`https://api.twitch.tv/helix/streams?${usernames.map(u => `user_login=${u}`).join("&")}`, false);
        return data.data ?? [];
    }

    async getStreamsByGame(gameId: string): Promise<StreamData[]> {
        let after = undefined;
        const channels: StreamData[] = [];
        do {
            const page = await this.getRequest(`https://api.twitch.tv/helix/streams?game_id=${gameId}&first=100${after ? `&after=${after}` : ``}`, false) as Paginated<StreamData[]>;
            channels.push(...page.data);
            after = page.pagination?.cursor;
        } while (after);
        return channels;
    }

    async getGame(name: string): Promise<Game | undefined> {
        const data = await this.getRequest(`https://api.twitch.tv/helix/games?name=${name}`, false) as DataResponse<Game[]>;
        return data.data?.[0];
    }

    async getUserId(username: string) {
        const data = await this.getRequest(`https://api.twitch.tv/helix/users?login=${username}`, true);
        if (data?.data && data?.data?.length === 1) {
            return data.data[0].id as number;
        }
    }

    async getChannelByUser(username: string): Promise<ChannelData | undefined> {
        const userData = await this.getUsers([username]);
        if (userData && userData.length > 0) {
            const broadcasterId = userData[0].id;
            const channelData = await this.getChannel(broadcasterId);
            if (channelData && channelData.length > 0) {
                return channelData[0];
            }
        }
        return undefined;
    }

    async getChannelsByUsers(usernames: string[]): Promise<ChannelData[]> {
        let channelData: ChannelData[] = [];
        const usersData = await this.getUsers(usernames);
        await Promise.all(usersData.map(async userData => {
            if (userData) {
                const broadcasterId = userData.id;
                const channelData = await this.getChannel(broadcasterId);
                if (channelData && channelData.length > 0) {
                    channelData.push(...channelData);
                }
            }
        }));
        return channelData;
    }

    async getFollows(props: { toId?: string, fromId?: string, max?: number, cursor?: string }): Promise<UsersFollows> {
        const { toId, fromId, max, cursor } = props;
        let query = [];
        query.push(toId ? `to_id=${toId}` : '');
        query.push(fromId ? `from_id=${fromId}` : '');
        query.push(max ? `first=${max}` : '');
        query.push(cursor ? `after=${cursor}` : '');
        const request = `https://api.twitch.tv/helix/users/follows?${query.join("&")}`;
        const data = await this.getRequest(request, true);
        return data;
    }

    async getRequest(request: string, useCache: boolean) {
        const cached = useCache ? this.cache.get(request) as AxiosResponse : undefined;
        if (cached) {
            return cached;
        }

        const response = await axios.get(request, {
            headers: this.getAuthHeaders()
        });

        if (response && response.status === 200 && useCache) {
            this.cache.set(request, response.data);
        }

        return response.data;
    }

    getAuthHeaders() {
        return {
            "Client-Id": Config.clientId,
            Authorization: `Bearer ${this.authToken?.access_token}`
        }
    }
}