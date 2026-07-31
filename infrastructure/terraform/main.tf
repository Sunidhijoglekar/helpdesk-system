# -----------------------------------------------------------------------------
# Terraform Infrastructure Configuration: Serverless Help Desk System
# -----------------------------------------------------------------------------

terraform {
  required_version = ">= 1.3.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# -----------------------------------------------------------------------------
# Variables
# -----------------------------------------------------------------------------
variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "The AWS Region to deploy resources into"
}

variable "environment" {
  type        = string
  default     = "production"
  description = "Deployment environment name (e.g., development, production)"
}

variable "admin_email" {
  type        = string
  default     = "admin@yourcompany.com"
  description = "Target email address for Amazon SNS alerts"
}

# -----------------------------------------------------------------------------
# 1. Amazon DynamoDB Table (Single-Table Design)
# -----------------------------------------------------------------------------
resource "aws_dynamodb_table" "helpdesk_tickets" {
  name         = "HelpDeskTickets-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "ticketId"

  attribute {
    name = "ticketId"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Environment = var.environment
    Project     = "Serverless-Help-Desk"
  }
}

# -----------------------------------------------------------------------------
# 2. Amazon SNS Notification Topic
# -----------------------------------------------------------------------------
resource "aws_sns_topic" "ticket_alerts" {
  name         = "TicketAlertsTopic-${var.environment}"
  display_name = "Corporate IT Support Help Desk Alerts"

  tags = {
    Environment = var.environment
    Project     = "Serverless-Help-Desk"
  }
}

resource "aws_sns_topic_subscription" "email_subscription" {
  topic_arn = aws_sns_topic.ticket_alerts.arn
  protocol  = "email"
  endpoint  = var.admin_email
}

# -----------------------------------------------------------------------------
# 3. Secure IAM Execution Role for Lambda
# -----------------------------------------------------------------------------
resource "aws_iam_role" "lambda_exec_role" {
  name = "HelpDeskLambdaExecutionRole-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Attached basic Lambda execution permissions for Amazon CloudWatch Logs
resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Custom Least-Privilege IAM Policy for DynamoDB and SNS access
resource "aws_iam_policy" "lambda_aws_permissions" {
  name        = "HelpDeskLambdaPermissions-${var.environment}"
  description = "Least privilege DynamoDB and SNS access policy for the Help Desk system"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Scan",
          "dynamodb:Query"
        ]
        Resource = aws_dynamodb_table.helpdesk_tickets.arn
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.ticket_alerts.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_aws_permissions_attach" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = aws_iam_policy.lambda_aws_permissions.arn
}

# -----------------------------------------------------------------------------
# 4. Amazon API Gateway REST API & CORS
# -----------------------------------------------------------------------------
resource "aws_api_gateway_rest_api" "helpdesk_api" {
  name        = "ServerlessHelpDeskAPI-${var.environment}"
  description = "REST API gateway for Serverless Help Desk Systems"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# Deploy a default production stage
resource "aws_api_gateway_deployment" "api_deployment" {
  rest_api_id = aws_api_gateway_rest_api.helpdesk_api.id
  stage_name  = "v1"

  lifecycle {
    create_before_destroy = true
  }
}

# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------
output "dynamodb_table_arn" {
  value       = aws_dynamodb_table.helpdesk_tickets.arn
  description = "ARN of the Help Desk DynamoDB Table"
}

output "sns_topic_arn" {
  value       = aws_sns_topic.ticket_alerts.arn
  description = "ARN of the Amazon SNS Alerting Topic"
}

output "api_endpoint" {
  value       = "${aws_api_gateway_rest_api.helpdesk_api.execution_arn}/v1"
  description = "Live Base Regional API Endpoint URL"
}
