import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand, GetCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { Ticket, TicketHistoryEntry, AWSCredentials, CloudWatchLogEntry, APIGatewayLogEntry, SNSEmailNotification } from "./src/types";

const app = express();
const PORT = 3000;

app.use(express.json());

// Paths for persistence
const DATA_DIR = path.join(process.cwd(), "data");
const TICKETS_FILE = path.join(DATA_DIR, "tickets.json");
const CONFIG_FILE = path.join(DATA_DIR, "config.json");

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-Memory state for AWS Logs & Simulator (to avoid growing files too large)
let cloudWatchLogs: CloudWatchLogEntry[] = [];
let apiGatewayLogs: APIGatewayLogEntry[] = [];
let snsEmails: SNSEmailNotification[] = [];

// Helper to log to simulated CloudWatch
function logToCloudWatch(service: CloudWatchLogEntry['service'], level: CloudWatchLogEntry['level'], message: string, payload?: any) {
  const log: CloudWatchLogEntry = {
    id: `cw-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    service,
    level,
    message,
    payload
  };
  cloudWatchLogs.unshift(log); // newest first
  if (cloudWatchLogs.length > 500) {
    cloudWatchLogs = cloudWatchLogs.slice(0, 500); // capped at 500
  }
  console.log(`[CloudWatch] [${service}] [${level}] ${message}`);
}

// Default credentials config
let awsConfig: AWSCredentials = {
  accessKeyId: "",
  secretAccessKey: "",
  region: "us-east-1",
  dynamoDbTable: "HelpDeskTickets",
  snsTopicArn: "",
  s3Bucket: "help-desk-ticket-attachments",
  useRealAWS: false
};

// Load saved config if exists
if (fs.existsSync(CONFIG_FILE)) {
  try {
    awsConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
  } catch (err) {
    console.error("Failed to load AWS config:", err);
  }
}

// Helper to load tickets
function loadLocalTickets(): Ticket[] {
  if (fs.existsSync(TICKETS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(TICKETS_FILE, "utf-8"));
    } catch (err) {
      console.error("Failed to read tickets file, resetting:", err);
      return [];
    }
  }
  return [];
}

// Helper to save tickets
function saveLocalTickets(tickets: Ticket[]) {
  try {
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save tickets:", err);
  }
}

// Initialize seed data if empty
if (loadLocalTickets().length === 0) {
  const seedTickets: Ticket[] = [
    {
      ticketId: "TKT-1001",
      employeeName: "Aarav Mehta",
      employeeEmail: "aarav.mehta@corporate.com",
      department: "Engineering",
      category: "Hardware Failure",
      subject: "MacBook Pro battery swelling issue",
      description: "My MacBook Pro battery seems to be swelling; the trackpad is hard to press and the chassis is bulging. Need a replacement laptop immediately as I cannot work on-site safely with this device.",
      priority: "Critical",
      status: "Open",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 2).toISOString(), // 2 days ago
      updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 2).toISOString(),
      assignedTo: "Unassigned",
      attachmentUrl: "",
      history: [
        {
          id: "hist-1",
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000 * 2).toISOString(),
          action: "Ticket Created",
          actor: "Aarav Mehta",
          details: "Ticket submitted via portal. Urgent hardware review requested due to physical damage risk."
        }
      ]
    },
    {
      ticketId: "TKT-1002",
      employeeName: "Ananya Iyer",
      employeeEmail: "ananya.iyer@corporate.com",
      department: "Finance",
      category: "Software Access",
      subject: "ERP Tool Access Renewal",
      description: "My access to the SAP ERP financial consolidation module has expired. I am unable to download the regional tax returns for the June audit.",
      priority: "High",
      status: "In Progress",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      assignedTo: "Sarah Jenkins (Support L2)",
      attachmentUrl: "",
      history: [
        {
          id: "hist-2",
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          action: "Ticket Created",
          actor: "Ananya Iyer",
          details: "Ticket submitted. System routed category: Software Access."
        },
        {
          id: "hist-3",
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          action: "Ticket Assigned",
          actor: "Admin (SysAdmin)",
          details: "Assigned support engineer Sarah Jenkins (Support L2). Status set to In Progress."
        }
      ]
    },
    {
      ticketId: "TKT-1003",
      employeeName: "Rahul Sharma",
      employeeEmail: "rahul.sharma@corporate.com",
      department: "Marketing",
      category: "Network / VPN",
      subject: "Recurrent VPN Disconnects on Bangalore WiFi",
      description: "While connected to the Bangalore office secure Wi-Fi, the Cisco AnyConnect VPN client drops connection every 15 minutes. It says 'Gateway Not Responding'. Please advise.",
      priority: "Medium",
      status: "Open",
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      assignedTo: "Unassigned",
      attachmentUrl: "",
      history: [
        {
          id: "hist-4",
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          action: "Ticket Created",
          actor: "Rahul Sharma",
          details: "Ticket submitted. VPN configuration issue logged."
        }
      ]
    },
    {
      ticketId: "TKT-1004",
      employeeName: "Priya Patel",
      employeeEmail: "priya.patel@corporate.com",
      department: "Human Resources",
      category: "Software Access",
      subject: "HRMS Portal Login Credentials Reset",
      description: "I have been locked out of the Workday HRMS portal after three incorrect password attempts. Please trigger a manual reset email.",
      priority: "Low",
      status: "Resolved",
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      assignedTo: "John Doe (Support L1)",
      attachmentUrl: "",
      history: [
        {
          id: "hist-5",
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          action: "Ticket Created",
          actor: "Priya Patel",
          details: "Ticket submitted. Password lock on HRMS."
        },
        {
          id: "hist-6",
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          action: "Status Changed",
          actor: "John Doe (Support L1)",
          details: "Password reset link sent to registered corporate email. Issue Resolved."
        }
      ]
    }
  ];
  saveLocalTickets(seedTickets);
  logToCloudWatch("DynamoDB", "INFO", "Initialized DynamoDB local table 'HelpDeskTickets' with Indian-named seed records", seedTickets);
}

// Dynamically retrieve AWS clients based on current config
function getAWSClient() {
  if (!awsConfig.useRealAWS || !awsConfig.accessKeyId || !awsConfig.secretAccessKey) {
    return null;
  }
  try {
    const ddbClient = new DynamoDBClient({
      region: awsConfig.region,
      credentials: {
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey,
      }
    });
    return DynamoDBDocumentClient.from(ddbClient);
  } catch (err) {
    logToCloudWatch("DynamoDB", "ERROR", "Failed to construct real DynamoDB Client: " + (err as Error).message);
    return null;
  }
}

function getSNSClient() {
  if (!awsConfig.useRealAWS || !awsConfig.accessKeyId || !awsConfig.secretAccessKey) {
    return null;
  }
  try {
    return new SNSClient({
      region: awsConfig.region,
      credentials: {
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey,
      }
    });
  } catch (err) {
    logToCloudWatch("SNS", "ERROR", "Failed to construct real SNS Client: " + (err as Error).message);
    return null;
  }
}

// Simulated SNS Publisher
async function publishNotification(subject: string, body: string, recipientEmail: string) {
  const mockSnsMessageId = `sns-msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const notification: SNSEmailNotification = {
    id: `notif-${Date.now()}`,
    timestamp: new Date().toISOString(),
    recipientEmail,
    subject,
    body,
    snsMessageId: mockSnsMessageId
  };

  // Add to local queue for UI visual simulator
  snsEmails.unshift(notification);
  if (snsEmails.length > 100) snsEmails = snsEmails.slice(0, 100);

  logToCloudWatch("SNS", "INFO", `Triggered SNS Publish: TargetTopic="${awsConfig.snsTopicArn || "arn:aws:sns:us-east-1:123456789012:HelpDeskTicketTopic"}" Subject="${subject}"`, {
    recipientEmail,
    snsMessageId: mockSnsMessageId
  });

  // Attempt real AWS SNS call if configured
  const snsClient = getSNSClient();
  if (snsClient && awsConfig.snsTopicArn) {
    try {
      logToCloudWatch("SNS", "INFO", `Connecting to Real AWS SNS to publish message...`);
      const response = await snsClient.send(
        new PublishCommand({
          TopicArn: awsConfig.snsTopicArn,
          Subject: subject,
          Message: `${body}\n\nThis notification is sent dynamically by the Serverless Help Desk System. Recipient: ${recipientEmail}`,
        })
      );
      logToCloudWatch("SNS", "INFO", `Real AWS SNS Publish Success: MessageId=${response.MessageId}`);
    } catch (err) {
      logToCloudWatch("SNS", "ERROR", `Real AWS SNS Publish FAILED: ${(err as Error).message}. Falling back to visual emulator queue.`);
    }
  } else {
    logToCloudWatch("SNS", "INFO", `Local Sandbox mode: Appended simulated email notification for ${recipientEmail}`);
  }
}

// API GATEWAY TRACE MIDDLEWARE
app.use((req, res, next) => {
  const startTime = Date.now();
  // We exclude logs query to prevent infinite polling loops showing up
  const isLogsQuery = req.path.startsWith("/api/aws-logs") || req.path.startsWith("/api/aws-config");
  
  res.on("finish", () => {
    if (isLogsQuery) return;
    const latency = Date.now() - startTime;
    const traceLog: APIGatewayLogEntry = {
      id: `apg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      latencyMs: latency,
      ip: req.ip || "127.0.0.1"
    };
    apiGatewayLogs.unshift(traceLog);
    if (apiGatewayLogs.length > 200) apiGatewayLogs = apiGatewayLogs.slice(0, 200);

    // Also pipe directly into CloudWatch!
    logToCloudWatch("API Gateway", "INFO", `API Gateway Request: ${req.method} ${req.path} - StatusCode=${res.statusCode} Latency=${latency}ms`, {
      method: req.method,
      path: req.path,
      params: req.params,
      query: req.query,
      body: req.method !== 'GET' ? req.body : undefined
    });
  });
  next();
});

// Container Health Check Probe
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    containerState: "active",
    region: "us-east-1",
    services: {
      dynamoDbSim: "online",
      snsSim: "online",
      cloudWatchSim: "online"
    }
  });
});

// AWS Config management API
app.get("/api/aws-config", (req, res) => {
  res.json(awsConfig);
});

app.post("/api/aws-config", (req, res) => {
  const updated = req.body;
  awsConfig = {
    ...awsConfig,
    ...updated
  };
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(awsConfig, null, 2), "utf-8");
    logToCloudWatch("Lambda", "INFO", `AWS Config updated via API. useRealAWS=${awsConfig.useRealAWS}. Configured Region=${awsConfig.region}`);
    res.json({ success: true, config: awsConfig });
  } catch (err) {
    logToCloudWatch("Lambda", "ERROR", `Failed to save AWS credentials: ${(err as Error).message}`);
    res.status(500).json({ error: "Failed to save configuration" });
  }
});

// AWS Logs polling endpoint
app.get("/api/aws-logs", (req, res) => {
  res.json({
    cloudWatchLogs,
    apiGatewayLogs,
    snsEmails
  });
});

app.delete("/api/aws-logs", (req, res) => {
  cloudWatchLogs = [];
  apiGatewayLogs = [];
  snsEmails = [];
  logToCloudWatch("CloudWatch", "INFO", "CloudWatch stream cleared by user administrator.");
  res.json({ success: true });
});


// TICKET ENDPOINTS

// 1. GET /tickets or /api/tickets (Scan Operation)
const getTicketsHandler = async (req: express.Request, res: express.Response) => {
  logToCloudWatch("Lambda", "INFO", "Triggered GET /tickets Lambda function.");
  const ddbDocClient = getAWSClient();

  if (ddbDocClient) {
    try {
      logToCloudWatch("DynamoDB", "INFO", `Scanning DynamoDB table: '${awsConfig.dynamoDbTable}'...`);
      const result = await ddbDocClient.send(
        new ScanCommand({
          TableName: awsConfig.dynamoDbTable
        })
      );
      const tickets = (result.Items as Ticket[]) || [];
      logToCloudWatch("DynamoDB", "INFO", `Scan success: Returned ${tickets.length} items from Real AWS.`);
      res.json(tickets);
    } catch (err) {
      logToCloudWatch("DynamoDB", "ERROR", `Scan FAILED: ${(err as Error).message}. Falling back to local sandbox data.`);
      // fallback
      res.json(loadLocalTickets());
    }
  } else {
    // Local mode
    logToCloudWatch("DynamoDB", "INFO", `Local Sandbox Scan: Loaded tickets from local JSON database.`);
    res.json(loadLocalTickets());
  }
};

app.get("/tickets", getTicketsHandler);
app.get("/api/tickets", getTicketsHandler);


// 2. GET /tickets/{id} or /api/tickets/{id} (GetItem Operation)
const getTicketByIdHandler = async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  logToCloudWatch("Lambda", "INFO", `Triggered GET /tickets/${id} Lambda function.`);
  const ddbDocClient = getAWSClient();

  if (ddbDocClient) {
    try {
      logToCloudWatch("DynamoDB", "INFO", `Getting Ticket from DynamoDB: Key={ ticketId: "${id}" }`);
      const result = await ddbDocClient.send(
        new GetCommand({
          TableName: awsConfig.dynamoDbTable,
          Key: { ticketId: id }
        })
      );
      if (result.Item) {
        logToCloudWatch("DynamoDB", "INFO", `GetItem Success for ticketId=${id}`);
        res.json(result.Item);
      } else {
        logToCloudWatch("DynamoDB", "WARN", `GetItem returned empty for ticketId=${id}`);
        res.status(404).json({ error: `Ticket ${id} not found` });
      }
    } catch (err) {
      logToCloudWatch("DynamoDB", "ERROR", `GetItem FAILED: ${(err as Error).message}. Searching local sandbox database...`);
      const localTickets = loadLocalTickets();
      const tkt = localTickets.find(t => t.ticketId === id);
      if (tkt) res.json(tkt);
      else res.status(404).json({ error: `Ticket ${id} not found` });
    }
  } else {
    const localTickets = loadLocalTickets();
    const tkt = localTickets.find(t => t.ticketId === id);
    if (tkt) {
      logToCloudWatch("DynamoDB", "INFO", `Local Sandbox GetItem: Found ticketId=${id}`);
      res.json(tkt);
    } else {
      logToCloudWatch("DynamoDB", "WARN", `Local Sandbox GetItem: ticketId=${id} NOT FOUND`);
      res.status(404).json({ error: `Ticket ${id} not found` });
    }
  }
};

app.get("/tickets/:id", getTicketByIdHandler);
app.get("/api/tickets/:id", getTicketByIdHandler);


// 3. POST /tickets or /api/tickets (PutItem Operation - Create Ticket)
const createTicketHandler = async (req: express.Request, res: express.Response) => {
  logToCloudWatch("Lambda", "INFO", "Triggered POST /tickets Lambda function.", req.body);
  const { employeeName, employeeEmail, department, category, subject, description, priority, attachmentUrl } = req.body;

  // Validation
  if (!employeeName || !employeeEmail || !subject || !description) {
    logToCloudWatch("Lambda", "WARN", "Invalid request format: Missing mandatory employee or ticket details.");
    res.status(400).json({ error: "Missing required fields: employeeName, employeeEmail, subject, description" });
    return;
  }

  const newId = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  const newTicket: Ticket = {
    ticketId: newId,
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
        details: `Ticket submitted via employee portal. Initial Status is Open.`
      }
    ]
  };

  const ddbDocClient = getAWSClient();
  let dbSuccess = false;

  if (ddbDocClient) {
    try {
      logToCloudWatch("DynamoDB", "INFO", `Putting Item in DynamoDB Table '${awsConfig.dynamoDbTable}'`, newTicket);
      await ddbDocClient.send(
        new PutCommand({
          TableName: awsConfig.dynamoDbTable,
          Item: newTicket
        })
      );
      logToCloudWatch("DynamoDB", "INFO", `DynamoDB PutItem Success for ticketId=${newId}`);
      dbSuccess = true;
    } catch (err) {
      logToCloudWatch("DynamoDB", "ERROR", `DynamoDB PutItem FAILED: ${(err as Error).message}. Defaulting to Local JSON Database.`);
    }
  }

  // Always sync with local file as fallback or if local-only
  if (!dbSuccess) {
    const localTickets = loadLocalTickets();
    localTickets.unshift(newTicket);
    saveLocalTickets(localTickets);
    logToCloudWatch("DynamoDB", "INFO", `Local Sandbox PutItem: Successfully stored ticketId=${newId} to local JSON storage.`);
  }

  // Publish SNS Email notification
  const emailSubject = `Help Desk Notification: New Ticket Submitted (${newId})`;
  const emailBody = `Hello ${newTicket.employeeName},

Your IT support ticket has been successfully submitted to the corporate help desk.

Ticket Summary:
-------------------------
Ticket ID: ${newTicket.ticketId}
Subject: ${newTicket.subject}
Category: ${newTicket.category}
Priority: ${newTicket.priority}
Status: ${newTicket.status}
Submitted On: ${new Date(newTicket.createdAt).toLocaleString()}

An IT Engineer will review your ticket shortly. You will receive updates as the ticket progresses.

Thank you,
Corporate IT Support Help Desk Service`;

  await publishNotification(emailSubject, emailBody, newTicket.employeeEmail);

  res.status(201).json(newTicket);
};

app.post("/tickets", createTicketHandler);
app.post("/api/tickets", createTicketHandler);


// 4. PUT /tickets/{id} or /api/tickets/{id} (UpdateItem Operation - Edit Ticket details)
const updateTicketHandler = async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  logToCloudWatch("Lambda", "INFO", `Triggered PUT /tickets/${id} Lambda function.`, req.body);
  const updates = req.body;

  const ddbDocClient = getAWSClient();
  let ticketToUpdate: Ticket | null = null;
  let localTickets: Ticket[] = [];

  // To update properly, let's first retrieve the original item
  if (ddbDocClient) {
    try {
      const getRes = await ddbDocClient.send(
        new GetCommand({
          TableName: awsConfig.dynamoDbTable,
          Key: { ticketId: id }
        })
      );
      if (getRes.Item) {
        ticketToUpdate = getRes.Item as Ticket;
      }
    } catch (err) {
      logToCloudWatch("DynamoDB", "ERROR", `Failed to get original ticket for updates: ${(err as Error).message}`);
    }
  }

  if (!ticketToUpdate) {
    localTickets = loadLocalTickets();
    const idx = localTickets.findIndex(t => t.ticketId === id);
    if (idx !== -1) {
      ticketToUpdate = localTickets[idx];
    }
  }

  if (!ticketToUpdate) {
    logToCloudWatch("Lambda", "WARN", `Update failed: Ticket ${id} not found.`);
    res.status(404).json({ error: `Ticket ${id} not found` });
    return;
  }

  // Create history entries for changes
  const now = new Date().toISOString();
  const historyEntries: TicketHistoryEntry[] = [...(ticketToUpdate.history || [])];
  let changesDetected = false;

  const detectChangeAndLog = (field: keyof Ticket, label: string, newValue: any, actor: string) => {
    if (newValue !== undefined && ticketToUpdate && ticketToUpdate[field] !== newValue) {
      const oldVal = ticketToUpdate[field];
      historyEntries.push({
        id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: now,
        action: `${label} Changed`,
        actor,
        details: `${label} changed from "${oldVal}" to "${newValue}".`
      });
      changesDetected = true;
      return true;
    }
    return false;
  };

  const actor = updates.actor || "User Admin";
  
  const statusChanged = detectChangeAndLog('status', 'Status', updates.status, actor);
  const priorityChanged = detectChangeAndLog('priority', 'Priority', updates.priority, actor);
  const assignmentChanged = detectChangeAndLog('assignedTo', 'Assigned Engineer', updates.assignedTo, actor);
  
  if (updates.subject && updates.subject !== ticketToUpdate.subject) {
    ticketToUpdate.subject = updates.subject;
    changesDetected = true;
  }
  if (updates.description && updates.description !== ticketToUpdate.description) {
    ticketToUpdate.description = updates.description;
    changesDetected = true;
  }

  if (changesDetected) {
    ticketToUpdate.updatedAt = now;
    ticketToUpdate.history = historyEntries;
    if (statusChanged && updates.status) ticketToUpdate.status = updates.status;
    if (priorityChanged && updates.priority) ticketToUpdate.priority = updates.priority;
    if (assignmentChanged && updates.assignedTo) ticketToUpdate.assignedTo = updates.assignedTo;

    // Save
    let realSaved = false;
    if (ddbDocClient) {
      try {
        logToCloudWatch("DynamoDB", "INFO", `Updating Item in Real DynamoDB table '${awsConfig.dynamoDbTable}' with updated values`);
        await ddbDocClient.send(
          new PutCommand({
            TableName: awsConfig.dynamoDbTable,
            Item: ticketToUpdate
          })
        );
        logToCloudWatch("DynamoDB", "INFO", `Real DynamoDB UpdateItem Success for ticketId=${id}`);
        realSaved = true;
      } catch (err) {
        logToCloudWatch("DynamoDB", "ERROR", `Real DynamoDB UpdateItem FAILED: ${(err as Error).message}. Syncing with local sandbox.`);
      }
    }

    // Always keep local in sync
    localTickets = loadLocalTickets();
    const idx = localTickets.findIndex(t => t.ticketId === id);
    if (idx !== -1) {
      localTickets[idx] = ticketToUpdate;
    } else {
      localTickets.push(ticketToUpdate);
    }
    saveLocalTickets(localTickets);
    logToCloudWatch("DynamoDB", "INFO", `Local Sandbox Update: Synchronized ticketId=${id} in local JSON file.`);

    // Send notification
    const emailSubject = `Help Desk Notification: Ticket Updated (${id})`;
    const emailBody = `Hello ${ticketToUpdate.employeeName},

Your IT support ticket (${id}) has been updated by ${actor}.

Current Status: ${ticketToUpdate.status}
Priority Level: ${ticketToUpdate.priority}
Assigned Engineer: ${ticketToUpdate.assignedTo}
Last Updated: ${new Date(ticketToUpdate.updatedAt).toLocaleString()}

Update Details:
-------------------------
${historyEntries[historyEntries.length - 1]?.details || "General ticket details updated."}

You can view complete logs and track ticket status in the employee portal.

Thank you,
Corporate IT Support Help Desk Service`;

    await publishNotification(emailSubject, emailBody, ticketToUpdate.employeeEmail);
  }

  res.json(ticketToUpdate);
};

app.put("/tickets/:id", updateTicketHandler);
app.put("/api/tickets/:id", updateTicketHandler);


// 5. PUT /tickets/{id}/assign or /api/tickets/{id}/assign (Specific Assign lambda)
const assignTicketHandler = async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const { assignedTo, actor } = req.body;
  logToCloudWatch("Lambda", "INFO", `Triggered PUT /tickets/${id}/assign Lambda function.`, req.body);

  if (!assignedTo) {
    res.status(400).json({ error: "Missing assignedTo parameter" });
    return;
  }

  // Simply route to general update API logic for reuse
  req.body = { assignedTo, actor: actor || "Ticket System Router" };
  await updateTicketHandler(req, res);
};

app.put("/tickets/:id/assign", assignTicketHandler);
app.put("/api/tickets/:id/assign", assignTicketHandler);


// 6. PUT /tickets/{id}/status or /api/tickets/{id}/status (Specific Status lambda)
const updateTicketStatusHandler = async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const { status, actor } = req.body;
  logToCloudWatch("Lambda", "INFO", `Triggered PUT /tickets/${id}/status Lambda function.`, req.body);

  if (!status) {
    res.status(400).json({ error: "Missing status parameter" });
    return;
  }

  // Route to general update API
  req.body = { status, actor: actor || "Ticket Operations" };
  await updateTicketHandler(req, res);
};

app.put("/tickets/:id/status", updateTicketStatusHandler);
app.put("/api/tickets/:id/status", updateTicketStatusHandler);


// 7. DELETE /tickets/{id} or /api/tickets/{id} (DeleteItem Operation)
const deleteTicketHandler = async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const actor = req.query.actor || "User Admin";
  logToCloudWatch("Lambda", "INFO", `Triggered DELETE /tickets/${id} Lambda function. Actor=${actor}`);

  let ticketToDelete: Ticket | null = null;
  const ddbDocClient = getAWSClient();

  // Load ticket details for final SNS logging
  if (ddbDocClient) {
    try {
      const getRes = await ddbDocClient.send(
        new GetCommand({
          TableName: awsConfig.dynamoDbTable,
          Key: { ticketId: id }
        })
      );
      ticketToDelete = getRes.Item as Ticket;
    } catch (err) {
      logToCloudWatch("DynamoDB", "ERROR", `GetItem for deletion verification failed: ${(err as Error).message}`);
    }
  }

  if (!ticketToDelete) {
    const localTickets = loadLocalTickets();
    ticketToDelete = localTickets.find(t => t.ticketId === id) || null;
  }

  if (!ticketToDelete) {
    logToCloudWatch("Lambda", "WARN", `Deletion failed: Ticket ${id} not found.`);
    res.status(404).json({ error: `Ticket ${id} not found` });
    return;
  }

  let dbDeleted = false;
  if (ddbDocClient) {
    try {
      logToCloudWatch("DynamoDB", "INFO", `Deleting Item from Real DynamoDB: Key={ ticketId: "${id}" }`);
      await ddbDocClient.send(
        new DeleteCommand({
          TableName: awsConfig.dynamoDbTable,
          Key: { ticketId: id }
        })
      );
      logToCloudWatch("DynamoDB", "INFO", `Real DynamoDB DeleteItem Success for ticketId=${id}`);
      dbDeleted = true;
    } catch (err) {
      logToCloudWatch("DynamoDB", "ERROR", `Real DynamoDB DeleteItem FAILED: ${(err as Error).message}. Proceeding with local purge.`);
    }
  }

  // Sync with local file
  const localTickets = loadLocalTickets();
  const filtered = localTickets.filter(t => t.ticketId !== id);
  saveLocalTickets(filtered);
  logToCloudWatch("DynamoDB", "INFO", `Local Sandbox DeleteItem: Purged ticketId=${id} from local JSON storage.`);

  // Send deletion warning SNS notification
  const emailSubject = `Help Desk Notification: Ticket Deleted (${id})`;
  const emailBody = `Hello ${ticketToDelete.employeeName},

Your IT support ticket (${id}) regarding "${ticketToDelete.subject}" has been deleted from the active tracking database by ${actor}.

If this deletion was an error, please contact your systems administrator or submit a fresh request immediately.

Thank you,
Corporate IT Support Help Desk Service`;

  await publishNotification(emailSubject, emailBody, ticketToDelete.employeeEmail);

  res.json({ success: true, message: `Ticket ${id} deleted successfully.` });
};

app.delete("/tickets/:id", deleteTicketHandler);
app.delete("/api/tickets/:id", deleteTicketHandler);


// VITE AND DEVELOPMENT PLATFORM SERVING INTERFACE
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    logToCloudWatch("API Gateway", "INFO", `API Gateway booted successfully. Listening on port ${PORT}. Ready to route requests.`);
  });
}

startServer();
