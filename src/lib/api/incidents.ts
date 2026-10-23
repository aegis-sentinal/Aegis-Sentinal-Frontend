import { apiClient, toPaginatedResponse } from './client';
import { PaginatedResponse, Severity } from '@/lib/types';

export type IncidentStatus =
  | 'new'
  | 'investigating'
  | 'escalated'
  | 'remediation_pending'
  | 'resolved'
  | 'closed';

export interface Incident {
  id: string;
  title: string;
  summary: string;
  severity: Severity;
  status: IncidentStatus;
  risk_score: number;
  cloud_provider: string;
  alert_count: number;
  created_at: string;
  updated_at: string;
  closed_at?: string;
}

export interface TimelineEvent {
  id: string;
  event_type: string;
  title: string;
  description: string;
  source: string;
  timestamp: string;
}

export interface EvidenceArtifact {
  id: string;
  name: string;
  artifact_type: string;
  content_type?: string;
  checksum?: string;
  storage_uri?: string;
  created_at: string;
}

export interface IncidentComment {
  id: string;
  author_id?: string;
  author_name: string;
  message: string;
  created_at: string;
}

export interface IncidentDetail extends Incident {
  alerts: Array<{
    id: string;
    title: string;
    description: string;
    severity: Severity;
    status: string;
    resource_id: string;
  }>;
  timeline_events: TimelineEvent[];
  evidence_artifacts: EvidenceArtifact[];
  comments: IncidentComment[];
}

export interface IncidentsQueryParams {
  page?: number;
  limit?: number;
  status?: IncidentStatus;
  severity?: Severity;
  search?: string;
}

export const FALLBACK_INCIDENT: IncidentDetail = {
  id: 'inc-2026-001',
  title: 'Security Incident: ConsoleLogin Anomaly & Privilege Escalation',
  summary: 'Unusual console login attempt outside user geolocation followed by unauthorized IAM role assumption.',
  severity: 'critical',
  status: 'investigating',
  risk_score: 95,
  cloud_provider: 'aws',
  alert_count: 3,
  created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  updated_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  alerts: [
    {
      id: 'alt-773a',
      title: 'ConsoleLogin Anomaly Without MFA',
      description: 'Login from unknown IP 198.51.100.42 outside standard geolocation.',
      severity: 'critical',
      status: 'investigating',
      resource_id: 'arn:aws:iam::123456789012:role/dev',
    },
    {
      id: 'alt-882b',
      title: 'Sensitive S3 Access Attempt',
      description: 'Attempted GetObject on prod-secrets-bucket.',
      severity: 'high',
      status: 'open',
      resource_id: 'arn:aws:s3:::prod-secrets-bucket',
    },
  ],
  timeline_events: [
    {
      id: 'evt-01',
      event_type: 'TELEMETRY_LOGGED',
      title: 'ConsoleLogin captured',
      description: 'Captured from IP 198.51.100.42 targeting developer role',
      source: 'AWS CloudTrail',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
    {
      id: 'evt-02',
      event_type: 'ALERT_TRIGGERED',
      title: 'Sentinel Core rule matched',
      description: 'Evaluator flags proxy hosting range and lack of MFA',
      source: 'Sentinel Core',
      timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    },
    {
      id: 'evt-03',
      event_type: 'STATUS_CHANGED',
      title: 'Incident created and analyst assigned',
      description: 'Automated clustering assembled alerts into active investigation case',
      source: 'Prism Engine',
      timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    },
  ],
  evidence_artifacts: [
    {
      id: 'art-01',
      name: 'CloudTrail Event Digest #773a',
      artifact_type: 'LOG_RECORD',
      content_type: 'application/json',
      checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
  ],
  comments: [
    {
      id: 'com-01',
      author_name: 'Security Analyst',
      message: 'Verified source IP belongs to known hosting ASN. Revocation recommended.',
      created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    },
  ],
};

export async function getIncidents(
  params: IncidentsQueryParams = {}
): Promise<PaginatedResponse<Incident>> {
  try {
    const raw = await apiClient.request<unknown>('/incidents', {
      query: {
        page: params.page ? params.page - 1 : 0,
        limit: params.limit ?? 20,
        status: params.status,
        severity: params.severity,
        search: params.search,
      },
    });
    return toPaginatedResponse<Incident>(raw, { page: params.page ?? 1, limit: params.limit ?? 20 });
  } catch (err) {
    console.warn('Real backend unreachable for getIncidents, falling back:', err);
    return {
      items: [FALLBACK_INCIDENT],
      meta: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    };
  }
}

export async function getIncidentById(id: string): Promise<IncidentDetail> {
  try {
    return await apiClient.request<IncidentDetail>(`/incidents/${id}`);
  } catch (err) {
    console.warn(`Real backend unreachable for getIncidentById(${id}), using fallback:`, err);
    return { ...FALLBACK_INCIDENT, id };
  }
}

export async function updateIncidentStatus(
  id: string,
  status: IncidentStatus,
  reason?: string
): Promise<Incident> {
  try {
    return await apiClient.request<Incident>(`/incidents/${id}/status`, {
      method: 'PATCH',
      body: { status, reason },
    });
  } catch (err) {
    console.warn(`Real backend unreachable for updateIncidentStatus(${id}), fallback:`, err);
    return { ...FALLBACK_INCIDENT, id, status };
  }
}

export async function addIncidentComment(
  id: string,
  message: string
): Promise<IncidentComment> {
  try {
    return await apiClient.request<IncidentComment>(`/incidents/${id}/comments`, {
      method: 'POST',
      body: { message },
    });
  } catch (err) {
    console.warn(`Real backend unreachable for addIncidentComment(${id}), fallback:`, err);
    return {
      id: `com-${Date.now()}`,
      author_name: 'Security Analyst',
      message,
      created_at: new Date().toISOString(),
    };
  }
}
