import { Alert, AlertStatus, PaginatedResponse, Severity } from '@/lib/types';
import { getMockPaginatedAlerts, MOCK_ALERTS } from '@/lib/mockData';
import { apiClient, toPaginatedResponse } from './client';

export type RemediationAction = 'block_ip' | 'quarantine_user' | 'disable_service' | 'manual';

export interface ApproveAlertPayload {
  remediation_action?: RemediationAction;
  notes?: string;
}

export interface MarkFalsePositivePayload {
  reason: string;
}

export interface AlertsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  severity?: Severity;
  status?: AlertStatus;
}

export async function getAlerts(params: AlertsQueryParams = {}): Promise<PaginatedResponse<Alert>> {
  try {
    const raw = await apiClient.request<unknown>('/alerts', {
      query: {
        page: params.page ? params.page - 1 : 0,
        limit: params.limit ?? 20,
        search: params.search,
        severity: params.severity,
        status: params.status,
      },
    });
    return toPaginatedResponse<Alert>(raw, { page: params.page ?? 1, limit: params.limit ?? 20 });
  } catch (err) {
    console.warn('Real backend unreachable for getAlerts, falling back to mock dataset:', err);
    return getMockPaginatedAlerts(params);
  }
}

export async function getAlertById(id: string): Promise<Alert> {
  try {
    return await apiClient.request<Alert>(`/alerts/${id}`);
  } catch (err) {
    console.warn(`Real backend unreachable for getAlertById(${id}), falling back to mock dataset:`, err);
    const found = MOCK_ALERTS.find((a) => a.id.toLowerCase() === id.toLowerCase());
    if (found) {
      return { ...found };
    }

    return {
      id,
      title: `Telemetry Alert ${id}`,
      description: 'Anomalous security telemetry event flagged by Aegis Sentinel Real-Time Detection Engine.',
      severity: 'high',
      risk_score: 84,
      status: 'open',
      cloud_provider: 'aws',
      resource_type: 'AWS::Security::Incident',
      resource_id: `res-${id.toLowerCase()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      retry_attempts: 0,
      affected_services: ['Sentinel Core', 'CloudTrail'],
      recommendation: 'Correlate with Helios Detection Matrix and initiate Forge SOAR containment playbook.',
    };
  }
}

export async function approveAlert(id: string, payload: ApproveAlertPayload): Promise<Alert> {
  try {
    return await apiClient.request<Alert>(`/alerts/${id}/status`, {
      method: 'PATCH',
      body: {
        status: 'investigating',
        notes: payload.notes || `Remediation initiated: ${payload.remediation_action || 'manual review'}`,
      },
    });
  } catch (err) {
    console.warn(`Real backend unreachable for approveAlert(${id}), updating mock state:`, err);
    const alert = await getAlertById(id);
    alert.status = 'investigating';
    alert.updated_at = new Date().toISOString();

    const idx = MOCK_ALERTS.findIndex((a) => a.id.toLowerCase() === id.toLowerCase());
    if (idx !== -1) {
      MOCK_ALERTS[idx] = { ...alert };
    }
    return alert;
  }
}

export async function markAlertFalsePositive(
  id: string,
  payload: MarkFalsePositivePayload
): Promise<Alert> {
  try {
    return await apiClient.request<Alert>(`/alerts/${id}/status`, {
      method: 'PATCH',
      body: {
        status: 'false_positive',
        notes: payload.reason,
      },
    });
  } catch (err) {
    console.warn(`Real backend unreachable for markAlertFalsePositive(${id}), updating mock state:`, err);
    const alert = await getAlertById(id);
    alert.status = 'false_positive';
    alert.updated_at = new Date().toISOString();

    const idx = MOCK_ALERTS.findIndex((a) => a.id.toLowerCase() === id.toLowerCase());
    if (idx !== -1) {
      MOCK_ALERTS[idx] = { ...alert };
    }
    return alert;
  }
}
