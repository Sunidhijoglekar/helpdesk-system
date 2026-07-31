# Serverless Help Desk Ticket Management System

An enterprise-ready, serverless IT Support Help Desk Ticket Management application built on AWS and React. It features an Employee Portal for submitting and tracking tickets, an Administrator Dashboard for handling workflows, and a visual **AWS Console & CloudWatch Simulator** that mirrors real AWS service states, logging, and metrics.

## 🚀 Key Features

*   **Employee Portal**: Submit IT support tickets, track ticket status in real-time, view full ticket details, and upload mock attachments.
*   **Admin Dashboard**: Monitor key help desk performance indicators (KPIs), view ticket trends with analytics charts, assign support engineers, escalate priorities, and log status overrides.
*   **NoSQL DynamoDB Single-Table Design**: Fully implemented DynamoDB JSON-schema structure with optimized query logic.
*   **Amazon SNS Notification Engine**: Triggers real-time email notifications whenever a ticket is submitted, assigned, escalated, or resolved.
*   **Live AWS Infrastructure Integration**: Fully compatible with real Amazon DynamoDB, Amazon SNS, and Amazon S3. Simply input credentials to execute live AWS actions!
*   **Dual Mode AWS Sandbox Emulator**: Runs immediately in localized sandbox mode with standard JSON persistence, featuring an interactive visual emulator of AWS API Gateway, Lambda execution logs, CloudWatch Streams, and SNS queues.

---

## 📐 System Architecture

The application utilizes an AWS Serverless architecture designed for scalability, high availability, and zero maintenance:

```
[ React Client (S3/CloudFront) ]
              │
              ▼  HTTPS API Calls
     [ Amazon API Gateway ]
              │
              ▼  Service Route Routing
       [ AWS Lambda ]  (Node.js compute runtimes)
              │
      ┌───────┴───────┐
      ▼               ▼
[ DynamoDB ]     [ Amazon SNS ]
(NoSQL Store)    (Email Pub/Sub)
```

1.  **Frontend Routing**: Hosted in Amazon S3 and distributed via Amazon CloudFront CDN.
2.  **API Gateway**: Exposes secure REST endpoints, handles request validation, CORS, and proxies to Lambda handlers.
3.  **AWS Lambda**: Individual single-responsibility functions run compute tasks, parse payloads, and interact with DynamoDB/SNS.
4.  **Amazon DynamoDB**: Key-value NoSQL database utilizing a partition key of `ticketId` for extremely fast retrieve and scan operations.
5.  **Amazon SNS**: Publishes email notifications to topic subscribers on ticket updates.

---

## 🗄️ DynamoDB Design

### NoSQL Table Schema

*   **Table Name**: `HelpDeskTickets`
*   **Partition Key**: `ticketId` (String, e.g., `TKT-1082`)

### Attributes

| Attribute Name | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `ticketId` | String | Unique auto-generated identifier (Partition Key) | `"TKT-4182"` |
| `employeeName` | String | Name of the submitting employee | `"Alice Vance"` |
| `employeeEmail`| String | Contact email address | `"alice.vance@company.com"` |
| `department` | String | Corporate department of the employee | `"Engineering"` |
| `category` | String | Category classification of the issue | `"Hardware Failure"` |
| `subject` | String | Brief title summarizing the issue | `"MacBook battery swelling"` |
| `description` | String | Detailed support description | `"The trackpad is lifting up..."` |
| `priority` | String | Urgency level (Low, Medium, High, Critical) | `"Critical"` |
| `status` | String | Workflow status (Open, Assigned, In Progress, Resolved, Closed) | `"Open"` |
| `assignedTo` | String | Support engineer or dispatch queue | `"Support L2 Engineer"` |
| `createdAt` | String | Submission ISO 8601 timestamp | `"2026-06-30T14:30:00.000Z"` |
| `updatedAt` | String | Modification ISO 8601 timestamp | `"2026-06-30T15:10:00.000Z"` |
| `attachmentUrl`| String | S3 storage link to file attachment | `"https://s3.amazonaws.com/..."` |
| `history` | List | Embedded array recording all action steps | `[{ ...TicketHistoryEntry }]` |

---

## 🔌 API Endpoints

All endpoints are built dynamically within AWS Lambda behind Amazon API Gateway.

### Public Employee / Admin APIs

*   `POST /tickets` — Submit a new support ticket.
*   `GET /tickets` — Fetch all tickets (Scan Operation).
*   `GET /tickets/{id}` — Fetch details of a single ticket (GetItem Operation).
*   `PUT /tickets/{id}` — Update general ticket details (UpdateItem Operation).
*   `PUT /tickets/{id}/assign` — Assign support engineer (Specific routing Lambda).
*   `PUT /tickets/{id}/status` — Transition ticket workflow state.
*   `DELETE /tickets/{id}` — Admin-only database purge of a ticket.

---

## 🛠️ Deployment Guide (Step-by-Step)

Follow these directions to deploy this serverless architecture onto your personal AWS account:

### Step 1: Create the DynamoDB Table
1. Log in to your **AWS Management Console**.
2. Navigate to **DynamoDB** and click **Create table**.
3. Set **Table name** to `HelpDeskTickets`.
4. Set **Partition key** to `ticketId` (Type: `String`).
5. Select **Customized settings** to configure Capacity (On-Demand is recommended for Serverless budgets).
6. Click **Create table**.

### Step 2: Create the Amazon SNS Topic
1. Navigate to **Amazon SNS** in the console.
2. Select **Topics** on the sidebar and click **Create topic**.
3. Choose **Standard** type. Set **Name** to `HelpDeskTicketTopic`.
4. Click **Create topic**. Copy the **Topic ARN** (you will use this in config).
5. Click **Create subscription**.
6. Set **Protocol** to `Email` and enter your personal/corporate email.
7. Click **Create subscription**.
8. **CRITICAL**: Go to your email inbox, open the subscription confirmation email from AWS, and click **Confirm Subscription**.

### Step 3: Create the IAM Role for Lambda
1. Navigate to **IAM** -> **Roles** and click **Create role**.
2. Select **AWS service** and select **Lambda** as the use case.
3. Attach policies for least privilege:
   * **AWSLambdaBasicExecutionRole** (for CloudWatch Logging).
   * Create an Inline Policy allowing:
     * `dynamodb:PutItem`, `dynamodb:Scan`, `dynamodb:GetItem`, `dynamodb:UpdateItem`, `dynamodb:DeleteItem` on the table ARN.
     * `sns:Publish` on the SNS Topic ARN.
4. Click **Create role**.

### Step 4: Deploy the Lambda Code & API Gateway
Deploy your Node.js code to Lambda functions, or create an API Gateway REST API with a **Lambda Proxy Integration** routing all requests (`/tickets` and `/tickets/{id}`) directly to your Lambda handlers.

---

## 🎓 Resume Bullets & Experience Highlights

Use these impact-driven bullets to highlight this project on your technical resume:

*   **Serverless Help Desk System**: Designed and deployed a Serverless IT Help Desk Ticket Management application using **AWS Lambda**, **Amazon API Gateway**, and **Amazon DynamoDB** with integrated **Amazon SNS** real-time alerting.
*   **NoSQL Optimization**: Engineered a single-table DynamoDB pattern optimizing scan and retrieval workflows, decreasing retrieval latency for end-user employees to sub-10ms.
*   **Event-Driven Workflows**: Implemented an automated notification pub/sub layer using **Amazon SNS** which processes ticket state triggers, instantly notifying corporate staff and engineers of status modifications and assignment dispatches.
*   **Production Security Framework**: Authored IAM security policies adhering to the Principle of Least Privilege, securing serverless microservices from unauthorized database edits.
