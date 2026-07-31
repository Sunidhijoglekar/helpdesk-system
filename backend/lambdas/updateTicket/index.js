/**
 * AWS Lambda Handler: updateTicket
 * AWS SDK v3 (Node.js 18+)
 * 
 * Description: Retrieves the current ticket, appends custom audit logs to its internal history stream,
 * updates status/priority fields, and publishes automated emails to the employee via Amazon SNS.
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
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
    // 1. Resolve ticketId from URL Path Parameters or Query
    const ticketId = event.pathParameters?.id || event.queryStringParameters?.ticketId;
    if (!ticketId) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Missing required parameter: ticketId" }),
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Missing request payload" }),
      };
    }

    const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    const { status, priority, assignedTo, actor, note } = body;

    // 2. Fetch the existing ticket from DynamoDB
    console.log(`Fetching existing ticket ${ticketId}...`);
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
        body: JSON.stringify({ error: `Ticket ${ticketId} not found` }),
      };
    }

    const currentTicket = getResult.Item;
    const now = new Date().toISOString();
    const updateLogs = [];

    // Track state modifications to compile detailed logs
    if (status && status !== currentTicket.status) {
      updateLogs.push(`Status changed from '${currentTicket.status}' to '${status}'`);
      currentTicket.status = status;
    }
    if (priority && priority !== currentTicket.priority) {
      updateLogs.push(`Priority changed from '${currentTicket.priority}' to '${priority}'`);
      currentTicket.priority = priority;
    }
    if (assignedTo !== undefined && assignedTo !== currentTicket.assignedTo) {
      updateLogs.push(`Assigned engineer changed from '${currentTicket.assignedTo}' to '${assignedTo}'`);
      currentTicket.assignedTo = assignedTo;
    }

    if (note && note.trim().length > 0) {
      updateLogs.push(`Engineer note added: "${note.trim()}"`);
    }

    // If nothing changed and no note is added, return existing ticket
    if (updateLogs.length === 0) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(currentTicket),
      };
    }

    // 3. Append to historical logs
    const historyEntry = {
      id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: now,
      action: "Ticket Updated",
      actor: actor || "IT Support Admin",
      details: updateLogs.join(". ")
    };

    currentTicket.history = Array.isArray(currentTicket.history) ? currentTicket.history : [];
    currentTicket.history.push(historyEntry);
    currentTicket.updatedAt = now;

    // 4. Update the item in DynamoDB
    console.log(`Saving updated ticket ${ticketId} back to DynamoDB...`);
    await ddbDoc.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: currentTicket,
      })
    );
    console.log("Update successful.");

    // 5. Notify the employee via Amazon SNS if state/status has been altered
    if (SNS_TOPIC_ARN && currentTicket.employeeEmail) {
      try {
        console.log(`Publishing update notification via SNS to ${SNS_TOPIC_ARN}...`);
        const emailSubject = `Help Desk Notification: Ticket ${ticketId} Updated`;
        const emailBody = `Hello ${currentTicket.employeeName},

Your IT support ticket has been updated by our staff.

Update Details:
-------------------------
Ticket ID: ${currentTicket.ticketId}
Subject: ${currentTicket.subject}
Current Status: ${currentTicket.status}
Priority: ${currentTicket.priority}
Assigned Support Engineer: ${currentTicket.assignedTo}

Activity Logs:
- Actor: ${historyEntry.actor}
- Actions: ${historyEntry.details}
- Action Time: ${new Date(now).toLocaleString()}

You can view details or submit responses in the corporate Employee Portal.

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
        "Access-Control-Allow-Methods": "PUT,OPTIONS"
      },
      body: JSON.stringify(currentTicket),
    };

  } catch (err) {
    console.error("System Error in updateTicket handler:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Internal Server Error", details: err.message }),
    };
  }
};
