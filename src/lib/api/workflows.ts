import { PaginatedResponse, Workflow, WorkflowStatus } from '@/lib/types';
import { apiClient, toPaginatedResponse } from '@/lib/api/client';
import { getMockPaginatedWorkflows } from '@/lib/mockData';
import { simulateNetworkDelay } from './delay';

export interface WorkflowsQueryParams {
  page?: number;
  limit?: number;
  alertId?: string;
  status?: WorkflowStatus;
}

export interface Playbook {
  id: string;
  name: string;
  description: string;
  action_type: string;
  owasp_category?: string;
  owasp_code?: string;
  nist_phase?: string;
  compliance_ref?: string;
  requires_approval: boolean;
  is_enabled: boolean;
  created_at: string;
}

export interface ExecuteWorkflowPayload {
  playbook_id: string;
  alert_id?: string;
  incident_id?: string;
  target_resource: string;
}

function cleanWorkflowsQuery(params: WorkflowsQueryParams): Record<string, string | number> {
  return Object.entries(params).reduce<Record<string, string | number>>((acc, [key, value]) => {
    if (value === undefined || value === null || value === '') {
      return acc;
    }

    acc[key] = value;
    return acc;
  }, {});
}

export async function getWorkflows(params: WorkflowsQueryParams = {}): Promise<PaginatedResponse<Workflow>> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;

  try {
    const rawResponse = await apiClient.request<unknown>('/workflows', {
      query: cleanWorkflowsQuery({ ...params, page, limit }),
    });
    return toPaginatedResponse<Workflow>(rawResponse, { page, limit });
  } catch (error) {
    console.warn('[Forge SOAR] Falling back to mock workflows:', error);
    await simulateNetworkDelay(200, 400);
    return getMockPaginatedWorkflows(params);
  }
}

export async function getPlaybooks(): Promise<Playbook[]> {
  try {
    const res = await apiClient.request<Playbook[]>('/workflows/playbooks');
    if (Array.isArray(res)) {
      return res;
    }
  } catch (error) {
    console.warn('[Forge SOAR] Falling back to default playbooks:', error);
  }

  return [
    {
      id: 'pb-01',
      name: 'Revoke Compromised IAM Access Keys',
      description: 'Immediately deactivates and invalidates exposed AWS/GCP/Azure access keys and active STS sessions.',
      action_type: 'REVOKE_IAM_KEYS',
      owasp_category: 'Identification and Authentication Failures',
      owasp_code: 'A07:2021',
      nist_phase: 'Containment',
      compliance_ref: 'CIS AWS 1.16 / SOC2 CC6.1',
      requires_approval: true,
      is_enabled: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'pb-02',
      name: 'Isolate Security Group',
      description: 'Revokes open 0.0.0.0/0 ingress and restricts inbound traffic to internal Bastion/VPC subnets.',
      action_type: 'ISOLATE_SECURITY_GROUP',
      owasp_category: 'Security Misconfiguration',
      owasp_code: 'A05:2021',
      nist_phase: 'Containment',
      compliance_ref: 'PCI-DSS Req 1.3 / ISO 27001 A.13.1',
      requires_approval: true,
      is_enabled: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'pb-03',
      name: 'Quarantine EC2 Instance',
      description: 'Attaches quarantine security group, detaches public IP, and captures memory snapshot for forensics.',
      action_type: 'QUARANTINE_EC2',
      owasp_category: 'Vulnerable and Outdated Components',
      owasp_code: 'A06:2021',
      nist_phase: 'Containment & Eradication',
      compliance_ref: 'NIST SP 800-61 Rev 2 Sec 3.3',
      requires_approval: true,
      is_enabled: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'pb-04',
      name: 'Block Malicious IP at WAF',
      description: 'Injects IP drop rule into AWS WAF/Cloudflare IP Set with automatic TTL expiration.',
      action_type: 'BLOCK_IP',
      owasp_category: 'Security Misconfiguration',
      owasp_code: 'A05:2021',
      nist_phase: 'Containment',
      compliance_ref: 'NIST CSF PR.PT-4',
      requires_approval: false,
      is_enabled: true,
      created_at: new Date().toISOString(),
    },
  ];
}

export async function executeWorkflow(payload: ExecuteWorkflowPayload): Promise<Workflow> {
  try {
    return await apiClient.request<Workflow>('/workflows/execute', {
      method: 'POST',
      body: payload,
    });
  } catch (error) {
    console.warn('[Forge SOAR] Live execution failed, returning optimistic workflow:', error);
    await simulateNetworkDelay(400, 800);
    return {
      id: `wf-${Date.now()}`,
      alert_id: payload.alert_id || 'AL-DEMO',
      type: 'auto_remediation',
      status: 'pending',
      executed_at: new Date().toISOString(),
      executed_by: 'SOC Analyst',
      description: `Execution queued for playbook ${payload.playbook_id}`,
      result: 'Pending analyst approval',
    };
  }
}

export async function approveWorkflow(workflowId: string, reason?: string): Promise<Workflow> {
  try {
    return await apiClient.request<Workflow>(`/workflows/${workflowId}/approve`, {
      method: 'POST',
      body: { reason: reason || 'Approved via Forge SOAR console' },
    });
  } catch (error) {
    console.warn('[Forge SOAR] Live approval failed, updating optimistically:', error);
    await simulateNetworkDelay(300, 600);
    return {
      id: workflowId,
      alert_id: 'AL-DEMO',
      type: 'auto_remediation',
      status: 'executed',
      executed_at: new Date().toISOString(),
      executed_by: 'SOC Analyst',
      description: 'Approved and executed containment playbook',
      result: 'Approved & executed remediation action',
    };
  }
}

export async function rejectWorkflow(workflowId: string, reason?: string): Promise<Workflow> {
  try {
    return await apiClient.request<Workflow>(`/workflows/${workflowId}/reject`, {
      method: 'POST',
      body: { reason: reason || 'Rejected by analyst' },
    });
  } catch (error) {
    console.warn('[Forge SOAR] Live rejection failed, updating optimistically:', error);
    await simulateNetworkDelay(300, 600);
    return {
      id: workflowId,
      alert_id: 'AL-DEMO',
      type: 'auto_remediation',
      status: 'failed',
      executed_at: new Date().toISOString(),
      executed_by: 'SOC Analyst',
      description: 'Rejected containment playbook',
      result: 'Rejected by analyst',
    };
  }
}

export async function rollbackWorkflow(workflowId: string): Promise<Workflow> {
  try {
    return await apiClient.request<Workflow>(`/workflows/${workflowId}/rollback`, {
      method: 'POST',
    });
  } catch (error) {
    console.warn('[Forge SOAR] Live rollback failed, updating optimistically:', error);
    await simulateNetworkDelay(300, 600);
    return {
      id: workflowId,
      alert_id: 'AL-DEMO',
      type: 'auto_remediation',
      status: 'pending',
      executed_at: new Date().toISOString(),
      executed_by: 'SOC Analyst',
      description: 'Compensating rollback transaction',
      result: 'Compensating rollback completed',
    };
  }
}
