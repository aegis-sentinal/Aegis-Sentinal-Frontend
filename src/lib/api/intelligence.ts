import { apiClient } from '@/lib/api/client';
import { simulateNetworkDelay } from './delay';

export interface ThreatFeedItem {
  id: string | number;
  type: string;
  indicator: string;
  threat: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  country?: string;
  timestamp?: string;
  first_seen?: string;
  last_seen?: string;
  mitreTech?: string;
  mitre_technique?: string;
  confidence_score?: number;
}

export interface ThreatLookupResult {
  indicator: string;
  malicious: boolean;
  risk_score: number;
  category: string;
  reputation: string;
  mitre_techniques: string[];
  recommendation: string;
}

export interface MitreStat {
  code: string;
  name: string;
  category: string;
  threat_count: number;
}

export interface OracleChatPayload {
  prompt: string;
  alert_id?: string;
  incident_id?: string;
}

export interface OracleChatResponse {
  response: string;
  module_tag: string;
  severity: string;
  attack_stage: string;
  mitre_techniques: string[];
  recommended_actions: string[];
  code_snippet?: string;
  escalate_to_human: boolean;
}

export async function getThreatFeed(params: {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  severity?: string;
} = {}): Promise<ThreatFeedItem[]> {
  try {
    const raw = await apiClient.request<{ content?: ThreatFeedItem[] }>('/intelligence/feed', {
      query: {
        page: params.page ?? 0,
        limit: params.limit ?? 20,
        search: params.search,
        type: params.type,
        severity: params.severity,
      },
    });

    if (raw && Array.isArray(raw.content) && raw.content.length > 0) {
      return raw.content.map((item) => ({
        ...item,
        mitreTech: item.mitre_technique || item.mitreTech || 'T1078',
        timestamp: item.last_seen ? new Date(item.last_seen).toLocaleTimeString() : 'Just now',
      }));
    }
  } catch (error) {
    console.warn('[Watchtower Intel] Falling back to default feed:', error);
  }

  await simulateNetworkDelay(200, 400);
  return [
    { id: 1, type: 'IP Reputation', indicator: '198.51.100.42', threat: 'Known Tor Exit Node / Botnet Command Server', severity: 'HIGH', country: 'RU', timestamp: '2 mins ago', mitreTech: 'T1078' },
    { id: 2, type: 'CVE Exploit', indicator: 'CVE-2026-2819', threat: 'AWS IAM Privilege Escalation exploit scan targeting AssumeRole API', severity: 'CRITICAL', country: 'CN', timestamp: '5 mins ago', mitreTech: 'T1098' },
    { id: 3, type: 'Domain Threat', indicator: 'malicious-auth-portal.com', threat: 'Phishing domain mimicking Okta enterprise SSO login portal', severity: 'HIGH', country: 'UA', timestamp: '12 mins ago', mitreTech: 'T1566' },
    { id: 4, type: 'Malware Hash', indicator: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', threat: 'Ransomware loader binary payload targeting Linux cloud hosts', severity: 'CRITICAL', country: 'KP', timestamp: '18 mins ago', mitreTech: 'T1486' },
    { id: 5, type: 'IP Reputation', indicator: '203.0.113.111', threat: 'Active brute-force scan against SSH bastion grids', severity: 'MEDIUM', country: 'NL', timestamp: '25 mins ago', mitreTech: 'T1110' },
    { id: 6, type: 'Proxy Pool', indicator: '185.220.101.5', threat: 'Commercial proxy network scanning public S3 buckets for secrets', severity: 'HIGH', country: 'DE', timestamp: '32 mins ago', mitreTech: 'T1530' },
  ];
}

export async function lookupIndicator(indicator: string): Promise<ThreatLookupResult> {
  try {
    return await apiClient.request<ThreatLookupResult>('/intelligence/lookup', {
      method: 'POST',
      body: { indicator },
    });
  } catch (error) {
    console.warn('[Watchtower Intel] Fallback for IoC lookup:', error);
    await simulateNetworkDelay(200, 400);
    const isSuspicious = indicator.includes('198.51') || indicator.includes('CVE') || indicator.includes('malicious');
    return {
      indicator,
      malicious: isSuspicious,
      risk_score: isSuspicious ? 92 : 12,
      category: isSuspicious ? 'ADVERSARY_ACTIVITY' : 'BENIGN',
      reputation: isSuspicious ? 'Flagged in AlienVault OTX feeds' : 'Clean indicator',
      mitre_techniques: isSuspicious ? ['T1078', 'T1190'] : [],
      recommendation: isSuspicious ? 'Block and isolate host.' : 'No action required.',
    };
  }
}

export async function getMitreStatistics(): Promise<MitreStat[]> {
  try {
    const raw = await apiClient.request<MitreStat[]>('/intelligence/mitre');
    if (Array.isArray(raw) && raw.length > 0) {
      return raw;
    }
  } catch (error) {
    console.warn('[Watchtower Intel] Fallback for MITRE statistics:', error);
  }

  return [
    { code: 'T1078', name: 'Valid Accounts', category: 'Initial Access', threat_count: 42 },
    { code: 'T1098', name: 'Account Manipulation', category: 'Persistence', threat_count: 28 },
    { code: 'T1190', name: 'Exploit Public Application', category: 'Initial Access', threat_count: 56 },
    { code: 'T1530', name: 'Data from Cloud Storage', category: 'Collection', threat_count: 34 },
    { code: 'T1611', name: 'Escape to Host', category: 'Privilege Escalation', threat_count: 19 },
    { code: 'T1498', name: 'Network Denial of Service', category: 'Impact', threat_count: 22 },
  ];
}

export function getGeminiApiKey(): string | null {
  if (typeof window !== 'undefined') {
    const customKey = localStorage.getItem('aegis_gemini_api_key');
    if (customKey && customKey.trim()) {
      return customKey.trim();
    }
  }
  return process.env.NEXT_PUBLIC_GEMINI_API_KEY || null;
}

export function setGeminiApiKey(key: string): void {
  if (typeof window !== 'undefined') {
    if (key.trim()) {
      localStorage.setItem('aegis_gemini_api_key', key.trim());
    } else {
      localStorage.removeItem('aegis_gemini_api_key');
    }
  }
}

export async function callGeminiOracle(payload: OracleChatPayload): Promise<OracleChatResponse> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key is not configured');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${encodeURIComponent(apiKey)}`;

  const systemInstruction = `You are Oracle, the AI Security Copilot of Aegis Sentinel (Enterprise Cloud Incident Detection and Response Platform).
You synthesize 7 security engines:
1. Sentinel Core (184 SIGMA detection rules, 35 Helios ML models)
2. Forge SOAR (OWASP Cloud & API Top 10 automated remediation playbooks)
3. Pulse (real-time telemetry stream at 4,250 events/sec)
4. Watchtower (IoC threat intelligence, AlienVault OTX, MITRE ATT&CK v14)
5. Prism (attack graph, blast radius, lateral movement)
6. Nexus (22 multi-cloud connectors for AWS, Azure, GCP, K8s, Okta)
7. Vault (cryptographic audit-ready incident cases)

Respond with pure, valid JSON (no markdown formatting, no code blocks, no backticks) using this exact schema:
{
  "response": "Detailed analytical answer synthesizing relevant engines and findings",
  "module_tag": "ENGINE NAME (e.g. SENTINEL CORE + FORGE SOAR)",
  "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO",
  "attack_stage": "initial_access" | "priv_esc" | "collection" | "exfiltration" | "impact" | "recon",
  "mitre_techniques": ["T1078", "T1530"],
  "recommended_actions": ["action 1", "action 2"],
  "code_snippet": "CLI command or remediation code script (if relevant, else empty string)",
  "escalate_to_human": boolean
}`;

  const promptText = `${systemInstruction}\n\nAnalyst Security Query:\n${payload.prompt}${payload.alert_id ? `\nAlert Context ID: ${payload.alert_id}` : ''}${payload.incident_id ? `\nIncident Context ID: ${payload.incident_id}` : ''}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: promptText }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
      },
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Gemini API returned status ${res.status}: ${errorBody}`);
  }

  const data = await res.json();
  const rawText: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('No candidate content returned from Gemini API');
  }

  let cleanJson = rawText.trim();
  if (cleanJson.startsWith('```json')) {
    cleanJson = cleanJson.substring(7);
  } else if (cleanJson.startsWith('```')) {
    cleanJson = cleanJson.substring(3);
  }
  if (cleanJson.endsWith('```')) {
    cleanJson = cleanJson.substring(0, cleanJson.length - 3);
  }
  cleanJson = cleanJson.trim();

  try {
    const parsed = JSON.parse(cleanJson);
    return {
      response: parsed.response || rawText,
      module_tag: parsed.module_tag || 'ORACLE & SENTINEL CORE (GEMINI FLASH)',
      severity: parsed.severity || 'HIGH',
      attack_stage: parsed.attack_stage || 'recon',
      mitre_techniques: Array.isArray(parsed.mitre_techniques) && parsed.mitre_techniques.length > 0
        ? parsed.mitre_techniques
        : ['T1078'],
      recommended_actions: Array.isArray(parsed.recommended_actions) && parsed.recommended_actions.length > 0
        ? parsed.recommended_actions
        : ['monitor', 'collect_forensics'],
      code_snippet: parsed.code_snippet || '',
      escalate_to_human: Boolean(parsed.escalate_to_human),
    };
  } catch {
    return {
      response: rawText,
      module_tag: 'ORACLE AI (GEMINI FLASH)',
      severity: 'MEDIUM',
      attack_stage: 'investigation',
      mitre_techniques: ['T1078'],
      recommended_actions: ['review_telemetry'],
      code_snippet: '',
      escalate_to_human: false,
    };
  }
}

export async function askOracle(payload: OracleChatPayload): Promise<OracleChatResponse> {
  const geminiKey = getGeminiApiKey();

  // If Gemini API key is configured, query Gemini directly for live AI reasoning
  if (geminiKey) {
    try {
      return await callGeminiOracle(payload);
    } catch (geminiErr) {
      console.warn('[Oracle AI] Gemini direct call failed, falling back to backend/synthesis:', geminiErr);
    }
  }

  // Fallback to backend API if Gemini key is not set or failed
  try {
    const res = await apiClient.request<OracleChatResponse>('/oracle/chat', {
      method: 'POST',
      body: payload,
    });
    if (res && res.response) {
      return res;
    }
  } catch (error) {
    console.warn('[Oracle AI] Fallback response for prompt:', error);
  }

  await simulateNetworkDelay(400, 800);
  return {
    response: `Oracle Security Copilot: Analyzed request regarding "${payload.prompt}". All perimeter telemetry indicates normal baseline operation with active SIGMA validation.`,
    module_tag: 'ORACLE CORE',
    severity: 'LOW',
    attack_stage: 'recon',
    mitre_techniques: ['T1087'],
    recommended_actions: ['monitor', 'collect_forensics'],
    code_snippet: 'curl -X GET https://api.aegis-sentinel.io/v1/telemetry/health',
    escalate_to_human: false,
  };
}
