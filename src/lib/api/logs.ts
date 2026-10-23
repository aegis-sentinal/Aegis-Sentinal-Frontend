import { Log, PaginatedResponse } from '@/lib/types';
import { apiClient, toPaginatedResponse } from '@/lib/api/client';
import { getMockPaginatedLogs } from '@/lib/mockData';
import { simulateNetworkDelay } from './delay';

export interface LogsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

function cleanLogsQuery(params: LogsQueryParams): Record<string, string | number> {
  return Object.entries(params).reduce<Record<string, string | number>>((acc, [key, value]) => {
    if (value === undefined || value === null || value === '') {
      return acc;
    }

    acc[key] = value;
    return acc;
  }, {});
}

export async function getLogs(params: LogsQueryParams = {}): Promise<PaginatedResponse<Log>> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;

  const rawResponse = await apiClient.request<unknown>('/logs', {
    query: cleanLogsQuery({ ...params, page, limit }),
  });

  return toPaginatedResponse<Log>(rawResponse, { page, limit });
}

export interface TelemetryAnalysisRequest {
  log_content: string;
  pipeline_type?: string;
}

export interface TelemetryAnalysisResponse {
  verdict: 'CRITICAL' | 'HIGH' | 'SUSPICIOUS' | 'BENIGN';
  fusedAnomalyScore: number;
  confidencePercent: number;
  mitreTactic: string;
  mitreTechnique: string;
  summary: string;
  totalPipelineLatencyMs: number;
  overallAccuracy: number;
  overallPrecision: number;
  overallRecall: number;
  overallF1: number;
  falsePositiveRate: number;
  formatDetected: string;
  aiProviderUsed?: string;
  modelsUsed: Array<{
    modelName: string;
    category: string;
    architecture: string;
    inferenceLatencyMs: number;
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    anomalyScore: number;
    fusionWeight: number;
    contributionPercent: number;
    detectionDetails: string;
  }>;
  matchedSigmaRules: Array<{
    id: string;
    title: string;
    severity: string;
    latencyMs: number;
  }>;
  extractedEntities: {
    principal?: string;
    sourceIp?: string;
    targetResource?: string;
    eventAction?: string;
    geoCountry?: string;
    anomalyIndicators: string[];
  };
}

export async function analyzeTelemetryLog(
  payload: TelemetryAnalysisRequest
): Promise<TelemetryAnalysisResponse> {
  return await apiClient.request<TelemetryAnalysisResponse>('/telemetry/analyze', {
    method: 'POST',
    body: payload,
  });
}

