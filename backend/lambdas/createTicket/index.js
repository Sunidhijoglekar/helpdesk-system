/**
 * AWS Lambda Handler: createTicket
 * AWS SDK v3 (Node.js 18+)
 * 
 * Description: Validates the incoming ticket request, generates a unique ticketId,
 * stores the record in Amazon DynamoDB, and publishes a real-time email alert via Amazon SNS.
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

// Initialize AWS Clients (Using default credential provider chain / IAM Execution Role)
const region = process.env.AWS_REGION || "us-east-1";
const ddbClient = new DynamoDBClient({ region });
const ddbDoc = DynamoDBDocumentClient.from(ddbClient);
const snsClient = new SNSClient({ region });

const TABLE_NAME = process.env.DYNAMODB_TABLE || "HelpDeskTickets";
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

export const handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  try {
    // 1. API Gateway Proxy Integration payload parsing
    if (!event.body) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Missing payload body" }),
      };
    }

    const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    const { employeeName, employeeEmail, department, category, subject, description, priority, attachmentUrl } = body;

    // 2. Request Payload Validation & Input Sanitization
    if (!employeeName || !employeeEmail || !subject || !description) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Missing required fields: employeeName, employeeEmail, subject, description" }),
      };
    }

    // Generate unique ID and ISO timestamps
    const ticketId = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const ticketItem = {
      ticketId,
      employeeName: String(employeeName).trim(),
      employeeEmail: String(employeeEmail).trim(),
      department: String(department || "General IT").trim(),
      category: String(category || "General Support").trim(),
      subject: String(subject).trim(),
      description: String(description).trim(),
      priority: priority || "Low",
      status: "Open",
      createdAt: now,
      updatedAt: now,
      assignedTo: "Unassigned",
      attachmentUrl: attachmentUrl || "",
      history: [
        {
          id: `hist-${Date.now()}-1`,
          timestamp: now,
          action: "Ticket Created",
          actor: String(employeeName).trim(),
          details: "Ticket submitted via employee portal. Initial Status is Open."
        }
      ]
    };

    // 3. Write Item to DynamoDB
    console.log(`Writing Ticket ${ticketId} to DynamoDB...`);
    await ddbDoc.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: ticketItem,
      })
    );
    console.log("DynamoDB PutItem successful.");

    // 4. Publish Real-time Alert Notification via Amazon SNS (Optional but highly recommended)
    if (SNS_TOPIC_ARN) {
      try {
        console.log(`Publishing SNS Notification to ${SNS_TOPIC_ARN}...`);
        const emailSubject = `Help Desk Notification: New Ticket Submitted (${ticketId})`;
        const emailBody = `Hello ${ticketItem.employeeName},

Your IT support ticket has been successfully submitted to the corporate help desk.

Ticket Summary:
-------------------------
Ticket ID: ${ticketItem.ticketId}
Subject: ${ticketItem.subject}
Category: ${ticketItem.category}
Priority: ${ticketItem.priority}
Status: ${ticketItem.status}
Submitted On: ${new Date(ticketItem.createdAt).toLocaleString()}

An IT Engineer will review your ticket shortly. You will receive updates as the ticket progresses.

Thank you,
Corporate IT Support Help Desk Service`;

        await snsClient.send(
          new PublishCommand({
            TopicArn: SNS_TOPIC_ARN,
            Subject: emailSubject,
            Message: emailBody,
          })
        );
        console.log("SNS notification published successfully.");
      } catch (snsErr) {
        console.error("Failed to send SNS Notification:", snsErr);
        // Do not fail the request if only notification failed
      }
    } else {
      console.warn("SNS_TOPIC_ARN environment variable not defined. Skipping SNS alert.");
    }

    return {
      statusCode: 201,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST,OPTIONS"
      },
      body: JSON.stringify(ticketItem),
    };

  } catch (err) {
    console.error("System Error in createTicket handler:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Internal Server Error", details: err.message }),
    };
  }
};
