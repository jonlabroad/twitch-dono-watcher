import { DynamoDBClient, UpdateItemCommand, UpdateItemInput } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, UpdateCommandInput } from "@aws-sdk/lib-dynamodb";

export default class HoagieDbClient {
    tableName = "HoagieTools-prod";
    dbClient = new DynamoDBClient({ region: "us-east-1" });
    docClient = DynamoDBDocumentClient.from(this.dbClient);
    channel: string;

    constructor(channel: string) {
        this.channel = channel;
    }

    public async addDono(username: string, streamId: string, amount: number) {
        try {
            const key = {
                CategoryKey: { S: this.getKey(this.channel, streamId) },
                SubKey: { S: this.getSort(username) },
            };
            const input: UpdateItemInput = {
                TableName: this.tableName,
                Key: key,
                UpdateExpression: "SET #dono = if_not_exists(#dono, :start) + :amount, #data = :data",
                ExpressionAttributeNames: { "#dono": "dono", "#data": "data" },
                ExpressionAttributeValues: {
                    ":amount": { N: amount.toString() },
                    ":start": { N: "0" },
                    ":data": {
                        M: {
                            username: { S: username.toLowerCase() },
                            streamId: { S: streamId.toLowerCase() },
                            channel: { S: this.channel.toLowerCase() },
                        }
                    },
                }
            }
            await this.dbClient.send(new UpdateItemCommand(input));
        } catch (err) {
            console.error(err);
        }
    }

    public async addCheer(username: string, streamId: string, bits: number) {
        try {
            const key = {
                CategoryKey: { S: this.getKey(this.channel, streamId) },
                SubKey: { S: this.getSort(username) },
            };
            const input: UpdateItemInput = {
                TableName: this.tableName,
                Key: key,
                UpdateExpression: "SET #cheer = if_not_exists(#cheer, :start) + :bits, #data = :data",
                ExpressionAttributeNames: { "#cheer": "cheer", "#data": "data" },
                ExpressionAttributeValues: {
                    ":bits": { N: bits.toString() },
                    ":start": { N: "0" },
                    ":data": {
                        M: {
                            username: { S: username.toLowerCase() },
                            streamId: { S: streamId.toLowerCase() },
                            channel: { S: this.channel.toLowerCase() },
                        }
                    },
                }
            }
            await this.dbClient.send(new UpdateItemCommand(input));
        } catch (err) {
            console.error(err);
        }
    }

    public async addSub(username: string, streamId: string) {
        try {
            const key = {
                CategoryKey: { S: this.getKey(this.channel, streamId) },
                SubKey: { S: this.getSort(username) },
            };
            const input: UpdateItemInput = {
                TableName: this.tableName,
                Key: key,
                UpdateExpression: "SET #sub = :sub, #data = :data",
                ExpressionAttributeNames: { "#sub": "sub", "#data": "data" },
                ExpressionAttributeValues: {
                    ":sub": { N: "1" },
                    ":data": {
                        M: {
                            username: { S: username.toLowerCase() },
                            streamId: { S: streamId.toLowerCase() },
                            channel: { S: this.channel.toLowerCase() },
                        }
                    },
                }
            }
            await this.dbClient.send(new UpdateItemCommand(input));
        } catch (err) {
            console.error(err);
        }
    }

    public async addGiftSubs(username: string, streamId: string) {
        try {
            const subs = 1;
            const key = {
                CategoryKey: { S: this.getKey(this.channel, streamId) },
                SubKey: { S: this.getSort(username) },
            };
            const input: UpdateItemInput = {
                TableName: this.tableName,
                Key: key,
                UpdateExpression: "SET #subgift = if_not_exists(#subgift, :start) + :subs, #data = :data",
                ExpressionAttributeNames: { "#subgift": "subgift", "#data": "data" },
                ExpressionAttributeValues: {
                    ":start": { N: "0" },
                    ":subs": { N: subs.toString() },
                    ":data": {
                        M: {
                            username: { S: username.toLowerCase() },
                            streamId: { S: streamId.toLowerCase() },
                            channel: { S: this.channel.toLowerCase() },
                        }
                    },
                }
            }
            await this.dbClient.send(new UpdateItemCommand(input));
        } catch (err) {
            console.error(err);
        }
    }

    public async setStreamHistory(streamId: string) {
        try {
            const date = new Date();
            const key = {
                CategoryKey: { S: `DonoWatch_${this.channel}_streamhistory` },
                SubKey: { S: streamId },
            };
            const input: UpdateItemInput = {
                TableName: this.tableName,
                Key: key,
                UpdateExpression: "SET #timestamp = if_not_exists(#timestamp, :timestamp)",
                ExpressionAttributeNames: { "#timestamp": "timestamp" },
                ExpressionAttributeValues: {
                    ":timestamp": { S: date.toISOString() },
                }
            }
            await this.dbClient.send(new UpdateItemCommand(input));
        } catch (err) {
            console.error(err);
        }
    }

    getKey(channel: string, streamId: string) {
        return `DonoWatch_${channel.toLowerCase()}_${streamId}`;
    }

    getSort(username: string) {
        return `${username.toLowerCase()}`;
    }
}