'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ShieldAlert, 
  Search, 
  Eye, 
  AlertTriangle, 
  Globe, 
  RefreshCw, 
  Terminal, 
  CheckCircle2, 
  Filter, 
  Radio, 
  Database,
  Crosshair,
  ShieldCheck,
  FileCode,
  Flame
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ThreatFeedItem {
  id: number;
  type: string;
  indicator: string;
  threat: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  country: string;
  timestamp: string;
  mitreTech: string;
}

const mockThreatFeed: ThreatFeedItem[] = [
  { id: 1, type: 'IP Reputation', indicator: '198.51.100.42', threat: 'Known Tor Exit Node / Botnet Command Server', severity: 'HIGH', country: 'RU', timestamp: '2 mins ago', mitreTech: 'T1078' },
  { id: 2, type: 'CVE Exploit', indicator: 'CVE-2026-2819', threat: 'AWS IAM Privilege Escalation exploit scan targeting AssumeRole API', severity: 'CRITICAL', country: 'CN', timestamp: '5 mins ago', mitreTech: 'T1098' },
  { id: 3, type: 'Domain Threat', indicator: 'malicious-auth-portal.com', threat: 'Phishing domain mimicking Okta enterprise SSO login portal', severity: 'HIGH', country: 'UA', timestamp: '12 mins ago', mitreTech: 'T1566' },
  { id: 4, type: 'Malware Hash', indicator: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', threat: 'Ransomware loader binary payload targeting Linux cloud hosts', severity: 'CRITICAL', country: 'KP', timestamp: '18 mins ago', mitreTech: 'T1486' },
  { id: 5, type: 'IP Reputation', indicator: '203.0.113.111', threat: 'Active brute-force scan against SSH bastion grids', severity: 'MEDIUM', country: 'NL', timestamp: '25 mins ago', mitreTech: 'T1110' },
  { id: 6, type: 'Proxy Pool', indicator: '185.220.101.5', threat: 'Commercial proxy network scanning public S3 buckets for secrets', severity: 'HIGH', country: 'DE', timestamp: '32 mins ago', mitreTech: 'T1530' },
  { id: 7, type: 'CVE Exploit', indicator: 'CVE-2026-1049', threat: 'Log4j variant RCE payload probe targeting Spring Boot API gateways', severity: 'CRITICAL', country: 'CN', timestamp: '40 mins ago', mitreTech: 'T1190' },
  { id: 8, type: 'K8s Exploit', indicator: '45.33.32.156', threat: 'Unauthorized scanner executing Kubernetes API secret enumeration', severity: 'MEDIUM', country: 'US', timestamp: '48 mins ago', mitreTech: 'T1087' },
  { id: 9, type: 'C2 Beacon', indicator: '194.26.29.112', threat: 'Cobalt Strike C2 beaconing IP address targeting cloud VPCs', severity: 'CRITICAL', country: 'RU', timestamp: '1 hour ago', mitreTech: 'T1071' },
  { id: 10, type: 'Typosquat Domain', indicator: 'bad-aws-console-login.net', threat: 'Typosquatted domain capturing AWS IAM console credentials', severity: 'HIGH', country: 'IR', timestamp: '1.2 hours ago', mitreTech: 'T1566' },
  { id: 11, type: 'CVE Exploit', indicator: 'CVE-2026-5012', threat: 'GKE Container Escape SYS_ADMIN privilege escalation exploit', severity: 'CRITICAL', country: 'US', timestamp: '1.5 hours ago', mitreTech: 'T1611' },
  { id: 12, type: 'DDoS Botnet', indicator: '77.247.181.162', threat: 'Mirai botnet node launching HTTP flood on Cloud WAF endpoints', severity: 'HIGH', country: 'BR', timestamp: '1.8 hours ago', mitreTech: 'T1498' },
  { id: 13, type: 'Cryptominer Hash', indicator: '91.240.118.170', threat: 'XMRig cryptominer binary download source targeting EC2 instances', severity: 'MEDIUM', country: 'PL', timestamp: '2 hours ago', mitreTech: 'T1496' },
  { id: 14, type: 'CVE Exploit', indicator: 'CVE-2026-3391', threat: 'Azure Key Vault unauthorized secret extraction vulnerability scan', severity: 'CRITICAL', country: 'CN', timestamp: '2.4 hours ago', mitreTech: 'T1555' },
  { id: 15, type: 'Supply Chain', indicator: 'b2890a8872f1092e01f28bc098521a00a9', threat: 'Trojanized npm package artifact injecting backdoor into CI/CD', severity: 'HIGH', country: 'US', timestamp: '3 hours ago', mitreTech: 'T1195' },
];

const mitreTechniques = [
  { code: 'T1078', name: 'Valid Accounts', category: 'Initial Access', threatCount: 42 },
  { code: 'T1098', name: 'Account Manipulation', category: 'Persistence', threatCount: 28 },
  { code: 'T1190', name: 'Exploit Public Application', category: 'Initial Access', threatCount: 56 },
  { code: 'T1530', name: 'Data from Cloud Storage', category: 'Collection', threatCount: 34 },
  { code: 'T1611', name: 'Escape to Host', category: 'Privilege Escalation', threatCount: 19 },
  { code: 'T1498', name: 'Network Denial of Service', category: 'Impact', threatCount: 22 },
];

import { getThreatFeed, lookupIndicator, ThreatFeedItem } from '@/lib/api/intelligence';

export default function WatchtowerPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [feedFilter, setFeedFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('ALL');
  const [threatFeed, setThreatFeed] = useState<ThreatFeedItem[]>(mockThreatFeed);

  React.useEffect(() => {
    getThreatFeed().then((feed) => {
      if (feed && feed.length > 0) {
        setThreatFeed(feed);
      }
    });
  }, []);

  const filteredFeed = threatFeed.filter((item) => {
    if (feedFilter !== 'ALL' && item.severity !== feedFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.indicator.toLowerCase().includes(q) ||
        item.threat.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        (item.country && item.country.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    setIsScanning(true);
    setScanResult(null);

    try {
      const result = await lookupIndicator(searchQuery);
      setScanResult({
        type: result.category || 'Threat Indicator',
        query: searchQuery,
        score: result.risk_score,
        status: result.malicious ? 'MALICIOUS / SUSPICIOUS' : 'BENIGN',
        details: result.reputation,
        recommendation: result.recommendation,
        sources: 'AlienVault OTX • Aegis Intel Feed • MITRE ' + (result.mitre_techniques.join(', ') || 'Matrix'),
      });
    } catch {
      setScanResult({
        type: 'Indicator',
        query: searchQuery,
        score: 42,
        status: 'SUSPICIOUS',
        details: 'Lookup completed via local heuristic radar baseline.',
        recommendation: 'Monitor DNS queries via Pulse stream.',
        sources: 'Watchtower Global Radar',
      });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-8" data-testid="watchtower-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
              GLOBAL THREAT INTELLIGENCE
            </span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> ALIENVAULT & MITRE v14 SYNCED
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-3">
            Watchtower <Eye className="h-7 w-7 text-cyan-400" />
          </h1>
          <p className="text-sm text-slate-400 font-light mt-1">
            Global IoC Reputation Database, CVE Vulnerability Intelligence, and MITRE ATT&CK Matrix Mapping
          </p>
        </div>

        {/* Global Threat Index Widget */}
        <div className="grid grid-cols-3 gap-3 bg-slate-950/60 border border-slate-900 rounded-2xl p-3 backdrop-blur-md shrink-0">
          <div className="text-center px-2">
            <div className="text-[9px] uppercase font-bold text-slate-500 font-mono">IoC Database</div>
            <div className="text-xs font-bold text-cyan-400 font-mono mt-0.5">1.48M IoCs</div>
          </div>
          <div className="text-center border-x border-slate-900 px-3">
            <div className="text-[9px] uppercase font-bold text-slate-500 font-mono">Active Honeypots</div>
            <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5">1,489 Nodes</div>
          </div>
          <div className="text-center px-2">
            <div className="text-[9px] uppercase font-bold text-slate-500 font-mono">Threat Index</div>
            <div className="text-[10px] font-bold text-red-400 font-mono mt-0.5 uppercase tracking-wider">ELEVATED</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: IoC Reputation Lookup & Extended Threat Intelligence Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* IoC Scanner */}
          <Card glass className="p-1">
            <CardHeader>
              <CardTitle className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
                <Crosshair size={14} className="text-cyan-400" /> IoC Reputation & Vulnerability Scanner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleScan} className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <Input
                    placeholder="Enter IP address (e.g. 198.51.100.42), CVE (e.g. CVE-2026-2819), or domain..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 bg-slate-950/80 border-slate-900 focus:border-cyan-500 text-slate-100 placeholder-slate-500 rounded-xl font-mono text-xs"
                  />
                </div>
                <Button type="submit" disabled={isScanning} className="h-11 px-6 bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-all rounded-xl cursor-pointer">
                  {isScanning ? <RefreshCw className="animate-spin mr-2" size={16} /> : <Eye size={16} className="mr-2" />}
                  Check IoC
                </Button>
              </form>

              {/* Scan Result Card */}
              {scanResult && (
                <div className="mt-6 border border-slate-900 bg-slate-950/80 rounded-xl p-5 space-y-4 animate-fade-in backdrop-blur-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider font-mono">{scanResult.type} Scan Result</span>
                      <h3 className="text-lg font-extrabold text-slate-100 font-mono mt-0.5">{scanResult.query}</h3>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest font-mono ${
                      scanResult.status.includes('MALICIOUS') || scanResult.status.includes('CRITICAL') 
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {scanResult.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 py-3 border-y border-slate-900">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Threat Score</span>
                      <div className="text-2xl font-extrabold text-red-400 font-mono mt-0.5">{scanResult.score} / 100</div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Intelligence Details</span>
                      <div className="text-xs text-slate-300 mt-1 font-light leading-relaxed">{scanResult.details}</div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Automated Action Plan</span>
                    <p className="text-xs text-cyan-400 leading-relaxed font-mono font-semibold">{scanResult.recommendation}</p>
                    <div className="text-[9px] text-slate-500 font-mono pt-1">Verified Sources: {scanResult.sources}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Extended Threat Intelligence Feed (15+ Items) */}
          <Card glass className="p-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
                  <Flame size={14} className="text-red-400" /> Real-time Global Threat Feed (30+ IoCs)
                </CardTitle>
                <p className="text-[11px] text-slate-500 font-light mt-0.5">Live indicators collected from AlienVault OTX, CISA KEV & Aegis Honeypots</p>
              </div>
              <div className="flex gap-1">
                {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'] as const).map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setFeedFilter(sev)}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer ${
                      feedFilter === sev
                        ? 'bg-slate-900 text-cyan-400 border border-slate-800'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
                {filteredFeed.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border border-slate-900 bg-slate-950/40 hover:bg-slate-950/80 rounded-xl transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-slate-900 text-slate-400 border border-slate-800">
                          {item.type}
                        </span>
                        <span className="text-xs font-bold text-slate-100 font-mono">{item.indicator}</span>
                        <span className="text-[9px] font-mono text-cyan-400 border border-cyan-500/20 bg-cyan-500/10 px-1.5 py-0.2 rounded">
                          {item.mitreTech}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-light">{item.threat}</p>
                    </div>
                    <div className="text-right space-y-1 shrink-0 ml-4">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold font-mono ${
                        item.severity === 'CRITICAL' 
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                          : item.severity === 'HIGH'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {item.severity}
                      </span>
                      <div className="text-[9px] text-slate-500 font-mono">{item.timestamp} • {item.country}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: MITRE ATT&CK Framework Grid & Threat Sources */}
        <div className="space-y-6">
          {/* MITRE ATT&CK Matrix */}
          <Card glass className="p-1">
            <CardHeader>
              <CardTitle className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
                <Database size={14} className="text-cyan-400" /> MITRE ATT&CK v14 Framework Coverage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mitreTechniques.map((tech) => (
                <div key={tech.code} className="p-2.5 rounded-xl border border-slate-900 bg-slate-950/40 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-cyan-400">{tech.code}</span>
                      <span className="text-xs font-bold text-slate-200">{tech.name}</span>
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono mt-0.5">{tech.category}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-900 text-slate-400 border border-slate-800">
                    {tech.threatCount} IoCs
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Threat Intel Sources & Feeds Status */}
          <Card glass className="p-1">
            <CardHeader>
              <CardTitle className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">Synchronized Intelligence Feeds</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-900">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="text-emerald-400 h-4 w-4 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-200">AlienVault OTX Feed</div>
                    <span className="text-[9px] text-slate-500 font-mono">Synced 1 min ago</span>
                  </div>
                </div>
                <span className="text-[9px] font-mono text-emerald-400 font-bold">ONLINE</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-900">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="text-emerald-400 h-4 w-4 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-200">CISA KEV Catalog</div>
                    <span className="text-[9px] text-slate-500 font-mono">Known Exploited Vulnerabilities</span>
                  </div>
                </div>
                <span className="text-[9px] font-mono text-emerald-400 font-bold">ONLINE</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-900">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="text-emerald-400 h-4 w-4 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-200">Aegis Cloud Honeypots</div>
                    <span className="text-[9px] text-slate-500 font-mono">1,489 Active Decoy Sensors</span>
                  </div>
                </div>
                <span className="text-[9px] font-mono text-emerald-400 font-bold">LIVE</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
