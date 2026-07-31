/**
 * AWS Lambda Handler: getTickets
 * AWS SDK v3 (Node.js 18+)
 * 
 * Description: Fetches all ticket records from Amazon DynamoDB using a Scan operation.
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const region = process.env.AWS_REGION || "us-east-1";
const ddbClient = new DynamoDBClient({ region });
const ddbDoc = DynamoDBDocumentClient.from(ddbClient);

const TABLE_NAME = process.env.DYNAMODB_TABLE || "HelpDeskTickets";

export const handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  try {
    console.log(`Scanning DynamoDB Table ${TABLE_NAME}...`);
    const result = await ddbDoc.send(
      new ScanCommand({
        TableName: TABLE_NAME,
      })
    );

    const items = result.Items || [];
    console.log(`Scan successful. Found ${items.length} records.`);

    // Sort tickets descending by createdAt
    const sortedItems = items.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET,OPTIONS"
      },
      body: JSON.stringify(sortedItems),
    };

  } catch (err) {
    console.error("System Error in getTickets handler:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Internal Server Error", details: err.message }),
    };
  }
};
