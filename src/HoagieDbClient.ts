import { DynamoDBClient, UpdateItemCommand, UpdateItemInput } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export default class HoagieDbClient {
    tableName = "HoagieTools-prod";
    dbClient = new DynamoDBClient({ region: "us-east-1" });
    docClient = DynamoDBDocumentClient.from(this.dbClient);
    channel: string;

    constructor(channel: string) {
        this.channel = channel;
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