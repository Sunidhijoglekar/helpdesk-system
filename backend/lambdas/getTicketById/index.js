/**
 * AWS Lambda Handler: getTicketById
 * AWS SDK v3 (Node.js 18+)
 * 
 * Description: Fetches a single help desk ticket by its unique ticketId using GetItem.
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const region = process.env.AWS_REGION || "us-east-1";
const ddbClient = new DynamoDBClient({ region });
const ddbDoc = DynamoDBDocumentClient.from(ddbClient);

const TABLE_NAME = process.env.DYNAMODB_TABLE || "HelpDeskTickets";

export const handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  try {
    // 1. Parse pathParameters from API Gateway URL matching e.g., /tickets/{id}
    const ticketId = event.pathParameters?.id || event.queryStringParameters?.ticketId;

    if (!ticketId) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Missing required query/path parameter: ticketId" }),
      };
    }

    console.log(`Getting ticket ${ticketId} from DynamoDB...`);
    const result = await ddbDoc.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { ticketId },
      })
    );

    if (!result.Item) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: `Ticket with ID ${ticketId} not found` }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET,OPTIONS"
      },
      body: JSON.stringify(result.Item),
    };

  } catch (err) {
    console.error("System Error in getTicketById handler:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Internal Server Error", details: err.message }),
    };
  }
};
