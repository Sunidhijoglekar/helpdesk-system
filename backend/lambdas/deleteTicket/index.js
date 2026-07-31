/**
 * AWS Lambda Handler: deleteTicket
 * AWS SDK v3 (Node.js 18+)
 * 
 * Description: Deletes a specific ticket by ticketId from DynamoDB and sends an optional
 * email notification using Amazon SNS.
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const region = process.env.AWS_REGION || "us-east-1";
const ddbClient = new DynamoDBClient({ region });
const ddbDoc = DynamoDBDocumentClient.from(ddbClient);
const snsClient = new SNSClient({ region });

const TABLE_NAME = process.env.DYNAMODB_TABLE || "HelpDeskTickets";
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

export const handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  try {
    const ticketId = event.pathParameters?.id || event.queryStringParameters?.ticketId;
    if (!ticketId) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Missing required parameter: ticketId" }),
      };
    }

    // 1. Fetch ticket first to retrieve details for confirmation email
    console.log(`Verifying ticket ${ticketId} exists before deletion...`);
    const getResult = await ddbDoc.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { ticketId },
      })
    );

    if (!getResult.Item) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: `Ticket with ID ${ticketId} not found` }),
      };
    }

    const ticketItem = getResult.Item;

    // 2. Perform the DynamoDB deletion
    console.log(`Deleting ticket ${ticketId} from DynamoDB...`);
    await ddbDoc.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { ticketId },
      })
    );
    console.log("DynamoDB DeleteItem successful.");

    // 3. Send delete notification via SNS
    if (SNS_TOPIC_ARN && ticketItem.employeeEmail) {
      try {
        console.log(`Publishing deletion notification via SNS to ${SNS_TOPIC_ARN}...`);
        const emailSubject = `Help Desk Notification: Ticket ${ticketId} Deleted/Closed`;
        const emailBody = `Hello ${ticketItem.employeeName},

Your IT support ticket has been permanently deleted or archived by the administrator.

Ticket Details:
-------------------------
Ticket ID: ${ticketItem.ticketId}
Subject: ${ticketItem.subject}
Category: ${ticketItem.category}

If you believe this action was taken in error, or if you still require technical assistance, please submit a new service request via the Employee Portal.

Thank you,
Corporate IT Support Help Desk Service`;

        await snsClient.send(
          new PublishCommand({
            TopicArn: SNS_TOPIC_ARN,
            Subject: emailSubject,
            Message: emailBody,
          })
        );
        console.log("SNS notification sent successfully.");
      } catch (snsErr) {
        console.error("Failed to send SNS Notification:", snsErr);
      }
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "DELETE,OPTIONS"
      },
      body: JSON.stringify({ message: `Ticket ${ticketId} successfully deleted.`, ticketId }),
    };

  } catch (err) {
    console.error("System Error in deleteTicket handler:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Internal Server Error", details: err.message }),
    };
  }
};
