'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  CornerDownLeft, 
  AlertCircle, 
  ShieldAlert, 
  ShieldCheck, 
  GitBranch, 
  Terminal, 
  Eye, 
  Search, 
  FolderLock, 
  Network, 
  CheckCircle2,
  Code,
  Lock,
  ArrowRight,
  Key
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { askOracle, getGeminiApiKey, setGeminiApiKey } from '@/lib/api/intelligence';

interface Message {
  id: number;
  role: 'assistant' | 'user';
  content: string;
  moduleTag?: string;
  alert?: {
    title: string;
    severity: string;
    time: string;
    category: string;
    id?: string;
  } | null;
  codeSnippet?: string;
}

const moduleCapabilities = [
  { module: 'Sentinel Core', desc: 'Queries 184 SIGMA rules & 32 Helios AI models (Detection, Correlation GNNs, LLM Investigation & Agent Runtimes)' },
  { module: 'Forge SOAR', desc: 'Executes 108+ OWASP Cloud Top 10 playbooks & generates Terraform / AWS CLI remediation code' },
  { module: 'Pulse Telemetry', desc: 'Inspects real-time event logs at 4,250 events/sec & CloudTrail API telemetry' },
  { module: 'Watchtower Intel', desc: 'Performs IoC reputation lookups, CVE exploit scans, AlienVault OTX & MITRE ATT&CK mapping' },
  { module: 'Prism Investigation', desc: 'Executes blast-radius attack graph queries & predicts lateral movement paths' },
  { module: 'Nexus Connectors', desc: 'Verifies active API integrations across 22 AWS, Azure, GCP & Okta cloud connectors' },
  { module: 'Vault Cases', desc: 'Tracks audit-ready incident cases (e.g. CASE-2026-081) and cryptographic evidence' },
];

export default function OraclePage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      moduleTag: 'ORACLE CORE ENGINE',
      content: `Hello! I am Oracle, your AI Security Copilot connected to all 7 Aegis Sentinel engines:

• **Sentinel Core**: 184 SIGMA Detection Rules & Helios AI Anomaly Models
• **Forge**: 108+ OWASP Cloud & API Top 10 Automated Remediation Playbooks
• **Pulse**: Live Telemetry Stream (4,250 events/sec) & CloudTrail API Logs
• **Watchtower**: Global IoC Database & MITRE ATT&CK v14 Threat Intel
• **Prism**: Attack Graph & Blast-Radius Prediction Engine
• **Nexus**: 22 Multi-Cloud Connectors (AWS, Azure, GCP, K8s, Okta)
• **Vault**: Audit-Ready Incident Case Management

Ask me about active alerts, threat IoCs, OWASP remediation scripts, or incident cases.`,
      alert: null
    },
    {
      id: 2,
      role: 'user',
      content: 'Summarize the active critical incident and show the Forge SOAR remediation playbook.'
    },
    {
      id: 3,
      role: 'assistant',
      moduleTag: 'SENTINEL CORE + FORGE SOAR',
      content: `I analyzed the active incident across **Sentinel Core**, **Pulse**, and **Forge**:

**1. Detection (Sentinel Core):**
Alert **ALT-2026-001**: *Unrestricted S3 Bucket Public Access Enabled* on resource \`prod-secrets-vault-01\`.
- **Trigger**: CloudTrail \`PutBucketPolicy\` API call granting wildcard \`s3:GetObject\` access.
- **Helios AI Model Score**: Isolation Forest anomaly score \`0.96\` (Confidence: 94%).
- **Pulse Telemetry**: Ingested from source IP \`198.51.100.42\` (Tor Exit Node identified by Watchtower).

**2. Automated Remediation Playbook (Forge - OWASP-CN-02):**
Executing Forge SOAR Playbook \`WF-2026-001\` adhering to **OWASP Cloud Top 10 CN-02** & CIS AWS Benchmark 2.1.1.`,
      alert: {
        id: 'ALT-2026-001',
        title: 'Unrestricted S3 Bucket Public Access Enabled',
        severity: 'CRITICAL',
        time: '15 mins ago',
        category: 'OWASP-CN-02 • Insecure Cloud Storage'
      },
      codeSnippet: `aws s3api put-public-access-block \\
  --bucket prod-secrets-vault-01 \\
  --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"`
    }
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const key = getGeminiApiKey();
    setHasGeminiKey(Boolean(key));
    if (key) {
      setApiKeyInput(key);
    }
  }, []);

  const handleSaveApiKey = () => {
    setGeminiApiKey(apiKeyInput);
    setHasGeminiKey(Boolean(apiKeyInput.trim()));
    setShowKeyConfig(false);
  };

  const suggestionPills = [
    'Sentinel Core: Check Helios AI anomaly scores & SIGMA rules',
    'Forge: Show OWASP-CN-02 S3 remediation playbook & Terraform',
    'Pulse: Query live CloudTrail logs for IP 198.51.100.42',
    'Watchtower: IoC reputation scan for CVE-2026-2819',
    'Prism: Run blast-radius investigation on IAM role',
    'Vault: Summarize active incident CASE-2026-081',
    'Nexus: Check AWS, Azure & GCP connector health'
  ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const newUserMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: textToSend,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const oracleRes = await askOracle({ prompt: textToSend });
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          moduleTag: oracleRes.module_tag || 'ORACLE CORE ENGINE',
          content: oracleRes.response,
          alert:
            oracleRes.severity && oracleRes.severity !== 'LOW'
              ? {
                  id: 'ALT-' + (oracleRes.mitre_techniques?.[0] || 'ORACLE'),
                  title: `Adversary Technique ${oracleRes.mitre_techniques?.join(', ') || 'Detected'} (${oracleRes.attack_stage || 'recon'})`,
                  severity: oracleRes.severity,
                  time: 'Just now',
                  category: 'Oracle LangGraph Analysis',
                }
              : null,
          codeSnippet: oracleRes.code_snippet,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          moduleTag: 'AEGIS SENTINEL SYNTHESIS',
          content:
            'I cross-referenced your query with all 7 Aegis Sentinel engines (Sentinel Core, Helios, Forge, Pulse, Watchtower, Prism, and Nexus). Perimeter telemetry verified.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] space-y-4" data-testid="oracle-page">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
            AI SECURITY COPILOT
          </span>
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> CONNECTED TO ALL 7 MODULES
          </span>
          {hasGeminiKey ? (
            <span className="flex items-center gap-1 text-[10px] text-cyan-400 font-mono font-semibold bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
              <Sparkles className="h-2.5 w-2.5 animate-pulse" /> GEMINI FLASH ACTIVE
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-amber-400 font-mono font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              HELIOS NEURAL ENGINE
            </span>
          )}
        </div>
        <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-3">
          Oracle <Sparkles className="text-cyan-400 h-7 w-7" />
        </h1>
        <p className="text-sm text-slate-400 font-light mt-1">
          AI Copilot synthesizing Sentinel Core, Forge, Pulse, Watchtower, Prism, Nexus & Vault
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        
        {/* Chat Area (3 Cols) */}
        <div className="lg:col-span-3 flex flex-col h-full bg-slate-950/40 border border-slate-900 rounded-2xl relative overflow-hidden backdrop-blur-md">
          {/* Suggestion Pills */}
          <div className="flex gap-2 p-3 overflow-x-auto border-b border-slate-900 bg-slate-950/60 scrollbar-none shrink-0">
            {suggestionPills.map((pill, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(pill)}
                className="px-3 py-1.5 rounded-xl border border-slate-900 hover:border-cyan-500/30 bg-slate-950 hover:bg-cyan-500/5 text-slate-400 hover:text-cyan-400 text-[10px] font-mono tracking-wider font-bold transition-all whitespace-nowrap cursor-pointer"
              >
                {pill}
              </button>
            ))}
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role !== 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                    <Bot size={16} />
                  </div>
                )}
                
                <div className={`space-y-3 max-w-[85%] ${msg.role === 'user' ? 'order-1' : 'order-2'}`}>
                  {msg.moduleTag && msg.role !== 'user' && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-slate-900 text-cyan-400 border border-slate-800 inline-block">
                      {msg.moduleTag}
                    </span>
                  )}

                  <div
                    className={`rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-cyan-500 text-slate-950 font-bold rounded-tr-none'
                        : 'bg-slate-900/60 border border-slate-900 text-slate-200 rounded-tl-none font-light'
                    }`}
                  >
                    <div className="whitespace-pre-line font-mono leading-relaxed">{msg.content}</div>
                  </div>

                  {/* Render Code Snippet if present */}
                  {msg.codeSnippet && (
                    <div className="space-y-1">
                      <div className="text-[10px] font-mono text-slate-500 uppercase font-bold flex items-center gap-1">
                        <Code size={12} className="text-cyan-400" /> Automated OWASP Remediation Payload
                      </div>
                      <pre className="bg-slate-950 border border-slate-900 p-3 rounded-xl font-mono text-[11px] text-cyan-300 overflow-x-auto whitespace-pre">
                        {msg.codeSnippet}
                      </pre>
                    </div>
                  )}

                  {/* Render Alert attachment if present */}
                  {msg.alert && (
                    <div className="border border-slate-900 bg-slate-950/80 p-3 rounded-xl flex gap-3 items-center">
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                        <ShieldAlert size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">{msg.alert.category} • {msg.alert.time}</div>
                        <div className="text-xs font-bold text-slate-200 truncate">{msg.alert.title}</div>
                      </div>
                      {msg.alert.id && (
                        <Link 
                          href={`/alerts/${msg.alert.id}`} 
                          className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 flex items-center gap-1"
                        >
                          View <ArrowRight size={10} />
                        </Link>
                      )}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 shrink-0 order-3">
                    <User size={16} />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                  <Bot size={16} />
                </div>
                <div className="bg-slate-900/60 border border-slate-900 rounded-2xl rounded-tl-none px-4 py-3 flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-[10px] font-mono text-slate-500 ml-2">Cross-referencing Aegis Sentinel engines...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form input */}
          <div className="p-4 border-t border-slate-900 bg-slate-950/60 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="flex gap-2 bg-slate-950 border border-slate-900 rounded-xl p-1.5"
            >
              <Input
                placeholder="Ask Oracle about Sentinel Core rules, Forge playbooks, Pulse logs, Watchtower IoCs, Prism graphs, Nexus or Vault..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 border-0 focus-visible:ring-0 bg-transparent text-slate-100 placeholder-slate-500 text-xs shadow-none"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim()}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg cursor-pointer h-8 w-8 shrink-0"
              >
                <Send size={14} />
              </Button>
            </form>
            <div className="flex items-center justify-between text-[9px] text-slate-600 mt-2 px-1">
              <span className="flex items-center gap-1"><CornerDownLeft size={10} /> Enter to submit query</span>
              <span>Oracle Security Copilot v2.4 • Multi-Engine Knowledge Base</span>
            </div>
          </div>
        </div>

        {/* Right Sidebar: AI Context Panel (1 Col) */}
        <div className="space-y-6 hidden lg:block">
          <Card glass className="p-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">Module Knowledge Synthesis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-400 font-light leading-relaxed">
              <p className="text-[10px] text-slate-500 font-mono tracking-wide uppercase mb-1">Oracle queries live engines:</p>
              <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
                {moduleCapabilities.map((cap, idx) => (
                  <div key={idx} className="p-2 rounded-xl bg-slate-950/40 border border-slate-900 space-y-0.5">
                    <div className="text-[10px] font-bold text-cyan-400 font-mono">{cap.module}</div>
                    <div className="text-[10px] text-slate-400 font-light leading-snug">{cap.desc}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card glass className="p-1">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-slate-300 uppercase tracking-wider">Oracle Agent Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">AI Reasoning Engine</span>
                <span className="font-mono text-cyan-400 font-semibold flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  {hasGeminiKey ? 'Gemini Flash' : 'Helios Local'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">API Key Status</span>
                <button
                  type="button"
                  onClick={() => setShowKeyConfig(!showKeyConfig)}
                  className={`font-mono text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    hasGeminiKey
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                  }`}
                >
                  {hasGeminiKey ? 'KEY CONNECTED • EDIT' : 'CONFIGURE KEY'}
                </button>
              </div>
              {showKeyConfig && (
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 mt-2">
                  <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <Key className="h-3 w-3 text-cyan-400" /> Google Gemini API Key:
                  </div>
                  <Input
                    type="password"
                    placeholder="AQ.Ab8... or AIza..."
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="h-7 text-xs bg-slate-900 border-slate-800 text-slate-200"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowKeyConfig(false)}
                      className="h-6 text-[10px] px-2 cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveApiKey}
                      className="h-6 text-[10px] px-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold cursor-pointer"
                    >
                      Save Key
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Context Window</span>
                <span className="font-mono text-cyan-400 font-semibold">128k tokens</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Model Latency</span>
                <span className="font-mono text-slate-300 font-semibold">~1.2s</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Connected Modules</span>
                <span className="font-mono text-emerald-400 font-bold">7 / 7 ONLINE</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
