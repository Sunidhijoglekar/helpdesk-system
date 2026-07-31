#!/usr/bin/env bash

# =============================================================================
# AWS CLI Resource Provisioning Script — Serverless Help Desk System
# Description: Automates manual creation of the Amazon DynamoDB Single-Table
#              and Amazon Simple Notification Service (SNS) Topic.
# =============================================================================

# Colors for terminal output formatting
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}   Provisioning Serverless Help Desk AWS Resources   ${NC}"
echo -e "${BLUE}======================================================${NC}"

# Default parameters (override by passing arguments: ./setup-resources.sh <region> <table-name> <sns-topic-name>)
AWS_REGION=${1:-"us-east-1"}
DYNAMODB_TABLE_NAME=${2:-"HelpDeskTickets"}
SNS_TOPIC_NAME=${3:-"TicketAlertsTopic"}
ADMIN_EMAIL=${4:-"admin@yourcompany.com"}

# Check for AWS CLI installation
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS Command Line Interface (AWS CLI) is not installed.${NC}"
    echo "Please visit https://aws.amazon.com/cli/ to download and install it."
    exit 1
fi

echo -e "Using AWS Region: ${YELLOW}${AWS_REGION}${NC}"
echo -e "Using DynamoDB Table: ${YELLOW}${DYNAMODB_TABLE_NAME}${NC}"
echo -e "Using SNS Topic Name: ${YELLOW}${SNS_TOPIC_NAME}${NC}"

# -----------------------------------------------------------------------------
# Step 1: Create the DynamoDB Table (Single-Table Key Schema)
# -----------------------------------------------------------------------------
echo -e "\n${BLUE}[1/3] Creating DynamoDB Table: ${DYNAMODB_TABLE_NAME}...${NC}"

# Check if the table already exists to prevent overwrite/error
EXISTING_TABLE=$(aws dynamodb list-tables --region "${AWS_REGION}" --query "TableNames[?@=='${DYNAMODB_TABLE_NAME}']|[0]" --output text)

if [ "${EXISTING_TABLE}" == "${DYNAMODB_TABLE_NAME}" ]; then
    echo -e "${YELLOW}Warning: DynamoDB table '${DYNAMODB_TABLE_NAME}' already exists in region ${AWS_REGION}. Skipping creation.${NC}"
else
    CREATE_OUTPUT=$(aws dynamodb create-table \
        --table-name "${DYNAMODB_TABLE_NAME}" \
        --attribute-definitions AttributeName=ticketId,AttributeType=S \
        --key-schema AttributeName=ticketId,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --region "${AWS_REGION}" 2>&1)

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✔ DynamoDB Table created successfully!${NC}"
        # Wait until table is active
        echo "Waiting for DynamoDB table to move to ACTIVE state..."
        aws dynamodb wait table-exists --table-name "${DYNAMODB_TABLE_NAME}" --region "${AWS_REGION}"
        echo -e "${GREEN}✔ DynamoDB table is now ACTIVE.${NC}"
    else
        echo -e "${RED}Error creating DynamoDB Table: ${CREATE_OUTPUT}${NC}"
    fi
fi

# -----------------------------------------------------------------------------
# Step 2: Create the Amazon SNS Alerting Topic
# -----------------------------------------------------------------------------
echo -e "\n${BLUE}[2/3] Creating Amazon SNS Topic: ${SNS_TOPIC_NAME}...${NC}"

SNS_OUTPUT=$(aws sns create-topic \
    --name "${SNS_TOPIC_NAME}" \
    --region "${AWS_REGION}" \
    --output json 2>&1)

if [ $? -eq 0 ]; then
    SNS_TOPIC_ARN=$(echo "${SNS_OUTPUT}" | grep -o '"TopicArn": "[^"]*' | grep -o '[^"]*$')
    echo -e "${GREEN}✔ SNS Topic created successfully!${NC}"
    echo -e "Topic ARN: ${YELLOW}${SNS_TOPIC_ARN}${NC}"
else
    echo -e "${RED}Error creating SNS Topic: ${SNS_OUTPUT}${NC}"
    SNS_TOPIC_ARN=""
fi

# -----------------------------------------------------------------------------
# Step 3: Register Email Subscriber on SNS Topic
# -----------------------------------------------------------------------------
if [ -n "${SNS_TOPIC_ARN}" ]; then
    echo -e "\n${BLUE}[3/3] Subscribing recipient email address to SNS Topic...${NC}"
    echo -e "Target Recipient: ${YELLOW}${ADMIN_EMAIL}${NC}"

    SUB_OUTPUT=$(aws sns subscribe \
        --topic-arn "${SNS_TOPIC_ARN}" \
        --protocol email \
        --notification-endpoint "${ADMIN_EMAIL}" \
        --region "${AWS_REGION}" \
        --output json 2>&1)

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✔ Email subscription requested successfully!${NC}"
        echo -e "${YELLOW}CRITICAL NOTE:${NC} AWS has sent a confirmation email to ${ADMIN_EMAIL}."
        echo "Please open your inbox and click the 'Confirm Subscription' link to authorize real-time messages."
    else
        echo -e "${RED}Error creating email subscription: ${SUB_OUTPUT}${NC}"
    fi
else
    echo -e "\n${RED}Skipping SNS Subscription step due to failed Topic creation.${NC}"
fi

echo -e "\n${GREEN}======================================================${NC}"
echo -e "${GREEN}            Resource Provisioning Complete!           ${NC}"
echo -e "${GREEN}======================================================${NC}"
echo -e "Next Steps:"
echo -e "1. Run the React frontend & enter credentials in the 'DevOps Settings' panel."
echo -e "2. Use the 'AWS Console Sandbox' tab to view live CloudWatch streams and SNS logs."
echo -e "======================================================"
