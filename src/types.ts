export interface TicketHistoryEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  details: string;
}

export interface Ticket {
  ticketId: string;
  employeeName: string;
  employeeEmail: string;
  department: string;
  category: string;
  subject: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';
  createdAt: string;
  updatedAt: string;
  assignedTo: string; // support engineer name or "Unassigned"
  attachmentUrl: string; // empty or S3 link
  history: TicketHistoryEntry[];
}

export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  dynamoDbTable: string;
  snsTopicArn: string;
  s3Bucket: string;
  useRealAWS: boolean;
}

export interface CloudWatchLogEntry {
  id: string;
  timestamp: string;
  service: 'Lambda' | 'API Gateway' | 'DynamoDB' | 'SNS' | 'S3' | 'CloudWatch';
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  payload?: any;
}

export interface APIGatewayLogEntry {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  latencyMs: number;
  ip: string;
}

export interface SNSEmailNotification {
  id: string;
  timestamp: string;
  recipientEmail: string;
  subject: string;
  body: string;
  snsMessageId: string;
}
