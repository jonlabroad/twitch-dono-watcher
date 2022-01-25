import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, GetCommandInput, UpdateCommand, UpdateCommandInput } from "@aws-sdk/lib-dynamodb";

export interface AdminData {
    CategoryKey: string
    SubKey: string

    streamers: string[]
}

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
                CategoryKey: `DonoWatch_${this.channel}_streamhistory`,
                SubKey: streamId,
            };
            const input: UpdateCommandInput = {
                TableName: this.tableName,
                Key: key,
                UpdateExpression: "SET #timestamp = if_not_exists(#timestamp, :timestamp)",
                ExpressionAttributeNames: { "#timestamp": "timestamp" },
                ExpressionAttributeValues: {
                    ":timestamp": date.toISOString()
                }
            }
            console.log({input});
            await this.dbClient.send(new UpdateCommand(input));
        } catch (err) {
            console.error(err);
        }
    }

    public async getConfig() {
        try {
            const key = {
                CategoryKey: `DonoWatch_admin`,
                SubKey: "config",
            };
            const input: GetCommandInput = {
                TableName: this.tableName,
                Key: key,
            }
            const response = await this.docClient.send(new GetCommand(input));
            return response?.Item as AdminData | undefined;
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