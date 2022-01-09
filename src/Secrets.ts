import { DynamoDBClient, QueryCommand, QueryCommandInput } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export default class Secrets {
    private static instance: Secrets;
    public secrets: Record<string, any> = {};

    private constructor() { }

    public static async init() {
        const instance = Secrets.getInstance();
        const dbClient = new DynamoDBClient({ region: "us-east-1" });
        const docClient = DynamoDBDocumentClient.from(dbClient);

        const response = await docClient.send(new QueryCommand({
            TableName: "HoagieTools-prod",
            KeyConditionExpression: `#CategoryKey = :catkey`,
            ExpressionAttributeNames: {
                "#CategoryKey": `CategoryKey`
            },
            ExpressionAttributeValues: {
                ":catkey": { "S": "DonoWatch_SECRETS" }
            }
        } as QueryCommandInput));
        response.Items?.forEach(item => {
            instance.secrets[item?.SubKey.S ?? ""] = item.value.S;
        })
    }

    public static getInstance(): Secrets {
        if (!Secrets.instance) {
            Secrets.instance = new Secrets();
        }

        return Secrets.instance;
    }
}
