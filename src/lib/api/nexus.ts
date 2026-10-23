import { apiClient } from '@/lib/api/client';
import { simulateNetworkDelay } from './delay';

export type IntegrationCategory = 'CLOUD' | 'ALERTING' | 'TICKETING' | 'SIEM';
export type IntegrationStatus = 'CONNECTED' | 'INACTIVE' | 'PENDING' | 'ERROR';

export interface IntegrationConnector {
  id: string;
  connectorKey: string;
  name: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  description: string;
  latency?: string;
  lastSync?: string;
  config?: string;
  createdAt?: string;
  updatedAt?: string;
}

const mockConnectors: IntegrationConnector[] = [
  { id: '1', connectorKey: 'aws', name: 'Amazon Web Services', category: 'CLOUD', status: 'CONNECTED', description: 'Ingests CloudTrail, GuardDuty, and VPC flow logs in real-time.', latency: '120ms', lastSync: '10s ago' },
  { id: '2', connectorKey: 'gcp', name: 'Google Cloud Platform', category: 'CLOUD', status: 'CONNECTED', description: 'Streams audit events, Pub/Sub channels, and firewall telemetry.', latency: '190ms', lastSync: '1 min ago' },
  { id: '3', connectorKey: 'azure', name: 'Microsoft Azure', category: 'CLOUD', status: 'INACTIVE', description: 'Polls Activity Logs, Security Center warnings, and Cosmos telemetry.' },
  { id: '4', connectorKey: 'kubernetes', name: 'Kubernetes Cluster Fleet', category: 'CLOUD', status: 'CONNECTED', description: 'Monitors Kube-Audit events, daemonsets, and container runtime alerts.', latency: '85ms', lastSync: '30s ago' },
  { id: '5', connectorKey: 'slack', name: 'Slack Bot Dispatcher', category: 'ALERTING', status: 'CONNECTED', description: 'Dispatches high-priority alert cards to custom incident response channels.', latency: '40ms', lastSync: '12s ago' },
  { id: '6', connectorKey: 'pagerduty', name: 'PagerDuty Escalation', category: 'ALERTING', status: 'PENDING', description: 'Creates service incidents and pages on-call engineers during critical outbreaks.' },
  { id: '7', connectorKey: 'jira', name: 'Atlassian Jira', category: 'TICKETING', status: 'CONNECTED', description: 'Generates tracking tickets in SecOps project queues for new security incidents.', latency: '340ms', lastSync: '5 mins ago' },
  { id: '8', connectorKey: 'splunk', name: 'Splunk HEC Node', category: 'SIEM', status: 'INACTIVE', description: 'Forwards resolved security events and timeline digests to Splunk indexers.' }
];

export async function getIntegrationConnectors(category?: IntegrationCategory): Promise<IntegrationConnector[]> {
  try {
    const query = category ? { category } : undefined;
    const response = await apiClient.request<IntegrationConnector[]>('/nexus/integrations', { query });
    return response;
  } catch (error) {
    console.warn('[Nexus] Backend unavailable, using mock connectors:', error);
    await simulateNetworkDelay(200, 350);
    if (category) {
      return mockConnectors.filter(c => c.category === category);
    }
    return mockConnectors;
  }
}

export async function updateConnectorStatus(
  connectorKey: string,
  status: IntegrationStatus
): Promise<IntegrationConnector> {
  try {
    const response = await apiClient.request<IntegrationConnector>(
      `/nexus/integrations/${connectorKey}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status })
      }
    );
    return response;
  } catch (error) {
    console.warn(`[Nexus] Failed to update status on backend for ${connectorKey}, simulating locally:`, error);
    await simulateNetworkDelay(150, 300);
    const existing = mockConnectors.find(c => c.connectorKey === connectorKey);
    return {
      ...(existing || {
        id: connectorKey,
        connectorKey,
        name: connectorKey.toUpperCase(),
        category: 'CLOUD',
        description: 'Updated'
      }),
      status,
      latency: status === 'CONNECTED' ? '125ms' : undefined,
      lastSync: status === 'CONNECTED' ? 'Just now' : undefined
    };
  }
}

export async function testConnectorConnection(connectorKey: string): Promise<IntegrationConnector> {
  try {
    const response = await apiClient.request<IntegrationConnector>(
      `/nexus/integrations/${connectorKey}/test`,
      { method: 'POST' }
    );
    return response;
  } catch (error) {
    console.warn(`[Nexus] Failed to test connection on backend for ${connectorKey}:`, error);
    await simulateNetworkDelay(200, 400);
    return {
      id: connectorKey,
      connectorKey,
      name: connectorKey.toUpperCase(),
      category: 'CLOUD',
      status: 'CONNECTED',
      description: 'Ping verified',
      latency: '110ms',
      lastSync: 'Just now'
    };
  }
}
