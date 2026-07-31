# Serverless Help Desk System — Infrastructure Deployment & Integration Guide

This directory contains the production-grade Infrastructure as Code (IaC) templates to deploy the Serverless Help Desk backend onto your personal or corporate AWS account. 

You can choose between **AWS Serverless Application Model (SAM)** or **Terraform** to provision and deploy the system.

---

## 🏗️ Architecture Overview

The backend is built using a fully decoupled serverless architecture that scales on-demand:
*   **Amazon API Gateway (REST API)**: Exposes public regional endpoints with complete CORS headers and directs routing to AWS Lambda.
*   **AWS Lambda (Node.js 18.x / ES Modules)**: Executes business logic with high-performance execution times and isolated execution environments.
*   **Amazon DynamoDB**: Core single-table storage using a fast key-value schema.
*   **Amazon SNS (Simple Notification Service)**: A Pub/Sub topic to fan out real-time email alerts to administrators and submitting employees.

---

## 🛠️ Option 1: Deploying via AWS SAM (Recommended for Serverless)

AWS SAM is specialized for building and deploying serverless applications on AWS. The `template.yaml` file defines serverless resources under the `AWS::Serverless-2016-10-31` transform.

### Prerequisites
1. Install the [AWS CLI](https://aws.amazon.com/cli/) and configure your credentials (`aws configure`).
2. Install the [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html).
3. Ensure Node.js 18+ is installed.

### Deployment Steps

1.  **Initialize the Build**
    Compile your Lambda dependencies and package them for deployment:
    ```bash
    sam build
    ```

2.  **Guided Deployment**
    Deploy the infrastructure with an interactive guide that prompts for parameters (such as Region, Table Name, and SNS Email subscription):
    ```bash
    sam deploy --guided
    ```

3.  **Specify Configuration Parameters**
    *   **Stack Name**: `serverless-help-desk-prod`
    *   **AWS Region**: e.g., `us-east-1`
    *   **Confirm changes before deploy**: `Yes`
    *   **Allow SAM CLI IAM role creation**: `Yes` (Required to generate the Lambda execution roles)
    *   **Save arguments to configuration file**: `Yes` (Saves to `samconfig.toml`)

4.  **Capture Endpoints**
    Once deployment completes, the CLI will output the `ApiGatewayUrl`. Copy this URL and paste it into the **DevOps Settings** panel in the React frontend!

---

## 🚀 Option 2: Deploying via Terraform

Terraform is a cloud-agnostic IaC tool. The `terraform/main.tf` configuration automates resource provisioning, IAM execution roles, and secure access policies.

### Prerequisites
1. Install [Terraform](https://developer.hashicorp.com/terraform/downloads) (v1.3.0 or higher).
2. Configure AWS credentials in your local environment.

### Deployment Steps

1.  **Navigate to the Terraform Directory**
    ```bash
    cd infrastructure/terraform
    ```

2.  **Initialize Terraform**
    Download the hashicorp/aws provider and initialize the backend state:
    ```bash
    terraform init
    ```

3.  **Inspect Execution Plan**
    Generate and inspect the changes Terraform will apply to your AWS environment:
    ```bash
    terraform plan -out=tfplan.binary
    ```

4.  **Apply Infrastructure Changes**
    Provision the DynamoDB table, SNS topics, and API Gateway:
    ```bash
    terraform apply tfplan.binary
    ```

5.  **Configure Admin Email Subscription**
    You can customize the recipient for email notifications by specifying the variables:
    ```bash
    terraform apply -var="admin_email=it-alerts@yourcompany.com"
    ```

6.  **Outputs**
    Terraform will display the regional `api_endpoint` URL, `dynamodb_table_arn`, and `sns_topic_arn`. Use these values to configure your application in the DevOps panel.

---

## 🧬 Lambda Code Structure & Packaging

Each microservice handler is located in `backend/lambdas/`:
*   `createTicket/index.js` — Submits ticket, triggers DynamoDB PutItem, dispatches SNS notification.
*   `getTickets/index.js` — Returns list of all tickets from DynamoDB.
*   `getTicketById/index.js` — Retreives a specific ticket by ID.
*   `updateTicket/index.js` — Updates workflow states, appends timeline history, dispatches SNS alerts.
*   `deleteTicket/index.js` — Permanently purges a record.

### Local Package Declarations

To deploy raw code directly to Lambda without SAM/Terraform, create a simple `package.json` with ESM support in each Lambda directory:
```json
{
  "name": "lambda-handler",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.0.0",
    "@aws-sdk/lib-dynamodb": "^3.0.0",
    "@aws-sdk/client-sns": "^3.0.0"
  }
}
```

---

## 🛡️ Security Best Practices Applied

*   **Principle of Least Privilege**: Lambda execution policies are limited to explicit DynamoDB operations (`PutItem`, `GetItem`, `UpdateItem`, `DeleteItem`, `Scan`) targeting only the specific `HelpDeskTickets` table.
*   **At-Rest Encryption**: DynamoDB tables are configured with default Customer-Managed KMS Key or AWS-Managed Key encryption (`SSEEnabled: true`).
*   **Point-in-Time Recovery**: Enabled on the DynamoDB database to prevent accidental data loss.
