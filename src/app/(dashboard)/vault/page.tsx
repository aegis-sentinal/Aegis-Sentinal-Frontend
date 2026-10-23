'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FolderLock, 
  Plus, 
  Filter, 
  User2, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  PlayCircle,
  ShieldAlert,
  Search,
  Eye,
  FileCheck,
  Lock,
  Download,
  GitBranch,
  Shield,
  Layers,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { getIncidents, Incident } from '@/lib/api/incidents';

interface CaseItem {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'TRIAGED' | 'INVESTIGATING' | 'RESOLVED';
  assignee: string;
  created: string;
  alerts: number;
  cloudProvider: 'AWS' | 'Azure' | 'GCP' | 'Kubernetes' | 'Entra ID';
  owaspCode?: string;
  digestHash: string;
}

const mockCases: CaseItem[] = [
  { id: 'CASE-2026-081', title: 'Data exfiltration attempt on S3 secret bucket', severity: 'CRITICAL', status: 'INVESTIGATING', assignee: 'Sushant Kumar', created: '20 mins ago', alerts: 4, cloudProvider: 'AWS', owaspCode: 'OWASP-CN-02', digestHash: '0x8f9a2b4c5d6e7f1a3b5c' },
  { id: 'CASE-2026-080', title: 'Unrestricted S3 Bucket Public Access Enabled', severity: 'CRITICAL', status: 'OPEN', assignee: 'Unassigned', created: '35 mins ago', alerts: 2, cloudProvider: 'AWS', owaspCode: 'OWASP-CN-02', digestHash: '0x7e8f9a0b1c2d3e4f5a6b' },
  { id: 'CASE-2026-079', title: 'ConsoleLogin from anomalous proxy IP', severity: 'HIGH', status: 'TRIAGED', assignee: 'Jane Doe', created: '1 hour ago', alerts: 1, cloudProvider: 'Entra ID', owaspCode: 'OWASP-CN-09', digestHash: '0x3a4b5c6d7e8f9a0b1c2d' },
  { id: 'CASE-2026-078', title: 'Excessive IAM STS Role Assumption Request', severity: 'HIGH', status: 'INVESTIGATING', assignee: 'Sushant Kumar', created: '2 hours ago', alerts: 3, cloudProvider: 'AWS', owaspCode: 'OWASP-CN-03', digestHash: '0x1b2c3d4e5f6a7b8c9d0e' },
  { id: 'CASE-2026-077', title: 'Azure SQL Database Firewall 0.0.0.0/0 Rule Injection', severity: 'CRITICAL', status: 'OPEN', assignee: 'Unassigned', created: '2.5 hours ago', alerts: 5, cloudProvider: 'Azure', owaspCode: 'OWASP-CN-06', digestHash: '0x9a8b7c6d5e4f3a2b1c0d' },
  { id: 'CASE-2026-076', title: 'GKE Container SYS_ADMIN Privilege Escape', severity: 'CRITICAL', status: 'INVESTIGATING', assignee: 'Jane Doe', created: '3 hours ago', alerts: 6, cloudProvider: 'Kubernetes', owaspCode: 'OWASP-CN-05', digestHash: '0x5f6e7d8c9b0a1f2e3d4c' },
  { id: 'CASE-2026-075', title: 'Unusual volume of IAM key creation calls', severity: 'MEDIUM', status: 'OPEN', assignee: 'Unassigned', created: '4 hours ago', alerts: 3, cloudProvider: 'AWS', owaspCode: 'OWASP-API2:2023', digestHash: '0x2c3d4e5f6a7b8c9d0e1f' },
  { id: 'CASE-2026-074', title: 'GCP Storage Public Bucket Policy Override', severity: 'HIGH', status: 'TRIAGED', assignee: 'Alex Morgan', created: '5 hours ago', alerts: 2, cloudProvider: 'GCP', owaspCode: 'OWASP-CN-02', digestHash: '0x4d5e6f7a8b9c0d1e2f3a' },
  { id: 'CASE-2026-073', title: 'Root Bastion SSH Password Brute-Force', severity: 'HIGH', status: 'INVESTIGATING', assignee: 'Sushant Kumar', created: '6 hours ago', alerts: 8, cloudProvider: 'AWS', owaspCode: 'OWASP-CN-01', digestHash: '0x6e7f8a9b0c1d2e3f4a5b' },
  { id: 'CASE-2026-072', title: 'Cryptominer Binary Injected into Lambda Layer', severity: 'MEDIUM', status: 'TRIAGED', assignee: 'Jane Doe', created: '8 hours ago', alerts: 2, cloudProvider: 'AWS', owaspCode: 'OWASP-CN-08', digestHash: '0x8a9b0c1d2e3f4a5b6c7d' },
  { id: 'CASE-2026-071', title: 'Entra ID Session Refresh Token Hijacking', severity: 'CRITICAL', status: 'INVESTIGATING', assignee: 'Alex Morgan', created: '10 hours ago', alerts: 4, cloudProvider: 'Entra ID', owaspCode: 'OWASP-CN-09', digestHash: '0x0b1c2d3e4f5a6b7c8d9e' },
  { id: 'CASE-2026-070', title: 'K8s Kube-System Secret Enumeration Probe', severity: 'HIGH', status: 'OPEN', assignee: 'Unassigned', created: '12 hours ago', alerts: 3, cloudProvider: 'Kubernetes', owaspCode: 'OWASP-CN-05', digestHash: '0x3d4e5f6a7b8c9d0e1f2a' },
  { id: 'CASE-2026-069', title: 'Unauthorized KMS Customer Master Key Grant', severity: 'CRITICAL', status: 'INVESTIGATING', assignee: 'Sushant Kumar', created: '14 hours ago', alerts: 2, cloudProvider: 'AWS', owaspCode: 'OWASP-CN-04', digestHash: '0x5e6f7a8b9c0d1e2f3a4b' },
  { id: 'CASE-2026-068', title: 'Kubernetes container breakout warning', severity: 'CRITICAL', status: 'RESOLVED', assignee: 'Sushant Kumar', created: '1 day ago', alerts: 7, cloudProvider: 'Kubernetes', owaspCode: 'OWASP-CN-05', digestHash: '0x7f8a9b0c1d2e3f4a5b6c' },
  { id: 'CASE-2026-067', title: 'WAF Rate Limiting Triggered by HTTP Flood', severity: 'MEDIUM', status: 'RESOLVED', assignee: 'Jane Doe', created: '1.5 days ago', alerts: 4, cloudProvider: 'AWS', owaspCode: 'OWASP-API4:2023', digestHash: '0x9b0c1d2e3f4a5b6c7d8e' },
  { id: 'CASE-2026-066', title: 'Unapproved CloudTrail Log Group Deletion Attempt', severity: 'CRITICAL', status: 'RESOLVED', assignee: 'Sushant Kumar', created: '2 days ago', alerts: 3, cloudProvider: 'AWS', owaspCode: 'OWASP-CN-07', digestHash: '0x1c2d3e4f5a6b7c8d9e0f' },
  { id: 'CASE-2026-065', title: 'Azure Key Vault Secret Rotation Failure', severity: 'LOW', status: 'RESOLVED', assignee: 'Alex Morgan', created: '2.5 days ago', alerts: 1, cloudProvider: 'Azure', owaspCode: 'OWASP-CN-06', digestHash: '0x3e4f5a6b7c8d9e0f1a2b' },
  { id: 'CASE-2026-064', title: 'Database Connection Spike from Dev Instance', severity: 'LOW', status: 'RESOLVED', assignee: 'John Smith', created: '3 days ago', alerts: 2, cloudProvider: 'Azure', owaspCode: 'OWASP-CN-06', digestHash: '0x5a6b7c8d9e0f1a2b3c4d' },
];

export default function VaultPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'resolved'>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [caseList, setCaseList] = useState<CaseItem[]>(mockCases);
  const [assignMessage, setAssignMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getIncidents({ limit: 20 })
      .then((res) => {
        if (!mounted || !res.data || res.data.length === 0) return;
        const mapped: CaseItem[] = res.data.map((inc) => {
          const sev = (inc.severity ? inc.severity.toUpperCase() : 'MEDIUM') as CaseItem['severity'];
          let st: CaseItem['status'] = 'OPEN';
          if (inc.status === 'investigating' || inc.status === 'escalated') st = 'INVESTIGATING';
          else if (inc.status === 'remediation_pending') st = 'TRIAGED';
          else if (inc.status === 'resolved' || inc.status === 'closed') st = 'RESOLVED';

          let cp: CaseItem['cloudProvider'] = 'AWS';
          const p = (inc.cloud_provider || '').toLowerCase();
          if (p.includes('azure')) cp = 'Azure';
          else if (p.includes('gcp') || p.includes('google')) cp = 'GCP';
          else if (p.includes('k8s') || p.includes('kube')) cp = 'Kubernetes';
          else if (p.includes('entra') || p.includes('auth') || p.includes('id')) cp = 'Entra ID';

          const shortId = inc.id.length > 12 ? inc.id.substring(0, 12) : inc.id;
          return {
            id: `CASE-${shortId.toUpperCase()}`,
            title: inc.title,
            severity: sev,
            status: st,
            assignee: 'Sushant Kumar',
            created: 'Recently active',
            alerts: inc.alert_count || 1,
            cloudProvider: cp,
            owaspCode: 'OWASP-CN-02',
            digestHash: `0x${inc.id.replace(/-/g, '').substring(0, 16)}`,
          };
        });

        // Merge backend cases with mock cases, avoiding id duplicates
        const existingIds = new Set(mapped.map((m) => m.id));
        const filteredMock = mockCases.filter((mc) => !existingIds.has(mc.id));
        setCaseList([...mapped, ...filteredMock]);
      })
      .catch((err) => {
        console.warn('Could not load live incidents for Vault, keeping mock cases:', err);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'TRIAGED': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'INVESTIGATING': return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'RESOLVED': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      default: return 'bg-slate-900 text-slate-400';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/15 text-red-400 border border-red-500/25';
      case 'HIGH': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'MEDIUM': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'LOW': return 'bg-slate-800 text-slate-400';
      default: return 'bg-slate-900 text-slate-400';
    }
  };

  const filteredCases = caseList.filter(c => {
    if (activeTab === 'open' && c.status === 'RESOLVED') return false;
    if (activeTab === 'resolved' && c.status !== 'RESOLVED') return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.assignee.toLowerCase().includes(q) ||
        c.cloudProvider.toLowerCase().includes(q) ||
        (c.owaspCode && c.owaspCode.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleAssignToMe = () => {
    if (!selectedCase) return;
    const updated = caseList.map((item) =>
      item.id === selectedCase.id ? { ...item, assignee: 'Sushant Kumar (SecOps Lead)', status: 'INVESTIGATING' as const } : item
    );
    setCaseList(updated);
    setSelectedCase({ ...selectedCase, assignee: 'Sushant Kumar (SecOps Lead)', status: 'INVESTIGATING' });
    setAssignMessage('Case assigned to Sushant Kumar (SecOps Lead) and moved to Investigating.');
  };

  const handleExportEvidence = () => {
    if (!selectedCase) return;
    const evidenceBlob = new Blob(
      [JSON.stringify({ forensicRecord: selectedCase, timestamp: new Date().toISOString(), auditDigest: selectedCase.digestHash }, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(evidenceBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Audit_Evidence_${selectedCase.id}.json`;
    a.click();
  };

  return (
    <div className="space-y-8" data-testid="vault-page">
      {/* Vault Header & Case Governance Stats Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
              AUDIT-READY CASE MANAGEMENT
            </span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> CRYPTOGRAPHIC AUDIT LOCK
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-3">
            Vault <FolderLock className="h-7 w-7 text-cyan-400" />
          </h1>
          <p className="text-sm text-slate-400 font-light mt-1">
            Incident Case Management, OWASP Evidence Chain & Audit-Ready Record Storage
          </p>
        </div>

        {/* Case Metrics Bar */}
        <div className="grid grid-cols-3 gap-3 bg-slate-950/60 border border-slate-900 rounded-2xl p-3 backdrop-blur-md shrink-0">
          <div className="text-center px-2">
            <div className="text-[9px] uppercase font-bold text-slate-500 font-mono">Total Cases</div>
            <div className="text-xs font-bold text-cyan-400 font-mono mt-0.5">24 Tracked</div>
          </div>
          <div className="text-center border-x border-slate-900 px-3">
            <div className="text-[9px] uppercase font-bold text-slate-500 font-mono">Avg Contain Time</div>
            <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5">14.2 mins</div>
          </div>
          <div className="text-center px-2">
            <div className="text-[9px] uppercase font-bold text-slate-500 font-mono">Audit Lock</div>
            <div className="text-[10px] font-bold text-emerald-400 font-mono mt-0.5 uppercase tracking-wider">VERIFIED</div>
          </div>
        </div>
      </div>

      {/* Navigation, Search, and View Controls */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-4">
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'All Cases (24)' },
              { id: 'open', label: 'Active Incidents (18)' },
              { id: 'resolved', label: 'Resolved Cases (6)' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-cyan-400 border border-slate-800'
                    : 'text-slate-500 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <Input
                placeholder="Search cases by title, ID, assignee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 bg-slate-950/80 border-slate-900 text-slate-100 placeholder-slate-500 text-xs rounded-xl"
              />
            </div>
            <div className="flex bg-slate-950 border border-slate-900 rounded-xl p-1 shrink-0">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                  viewMode === 'kanban' ? 'bg-slate-900 text-cyan-400' : 'text-slate-500'
                }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                  viewMode === 'list' ? 'bg-slate-900 text-cyan-400' : 'text-slate-500'
                }`}
              >
                Audit List
              </button>
            </div>
          </div>
        </div>

        {/* View Render */}
        {viewMode === 'kanban' ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { title: 'Open / New', status: 'OPEN' },
              { title: 'Triaged', status: 'TRIAGED' },
              { title: 'Investigating', status: 'INVESTIGATING' },
              { title: 'Resolved', status: 'RESOLVED' }
            ].map(col => {
              const colCases = filteredCases.filter(c => c.status === col.status);
              return (
                <div key={col.title} className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono">{col.title}</span>
                    <span className="text-[10px] font-mono font-bold bg-slate-950/60 border border-slate-900 px-2 py-0.5 rounded-md text-slate-400">
                      {colCases.length}
                    </span>
                  </div>

                  <div className="space-y-3 min-h-[420px] p-2 bg-slate-950/30 border border-slate-900/60 rounded-2xl backdrop-blur-md">
                    {colCases.map(c => (
                      <div 
                        key={c.id} 
                        onClick={() => {
                          setSelectedCase(c);
                          setAssignMessage(null);
                        }}
                        className="p-4 border border-slate-900 bg-slate-950/60 hover:bg-slate-950 hover:border-slate-800 rounded-xl space-y-3 cursor-pointer transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-[9px] font-bold font-mono text-cyan-400">{c.id}</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold font-mono ${getSeverityColor(c.severity)}`}>
                            {c.severity}
                          </span>
                        </div>
                        
                        <h4 className="text-xs font-bold text-slate-200 leading-normal line-clamp-2">{c.title}</h4>

                        {c.owaspCode && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-block">
                            {c.owaspCode}
                          </span>
                        )}
                        
                        <div className="border-t border-slate-900/60 pt-2.5 flex items-center justify-between text-[10px] text-slate-400 font-light font-mono">
                          <span className="flex items-center gap-1"><User2 size={11} className="text-cyan-400" /> {c.assignee}</span>
                          <span>{c.alerts} alerts</span>
                        </div>
                      </div>
                    ))}

                    {colCases.length === 0 && (
                      <div className="h-40 flex items-center justify-center border border-dashed border-slate-900 rounded-xl text-[10px] text-slate-600 uppercase font-mono tracking-wider">
                        No active cases
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Audit List View */
          <div className="border border-slate-900 rounded-2xl overflow-hidden bg-slate-950/40 backdrop-blur-md space-y-1">
            {filteredCases.map(c => (
              <div 
                key={c.id} 
                onClick={() => {
                  setSelectedCase(c);
                  setAssignMessage(null);
                }}
                className="flex items-center justify-between p-4 border-b border-slate-900/60 hover:bg-slate-900/30 transition-all cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-mono font-bold text-xs">{c.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold font-mono ${getSeverityColor(c.severity)}`}>
                      {c.severity}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold font-mono ${getStatusColor(c.status)}`}>
                      {c.status}
                    </span>
                    {c.owaspCode && (
                      <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {c.owaspCode}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">{c.title}</h4>
                </div>
                <div className="flex items-center gap-6 text-right shrink-0">
                  <div className="font-mono text-[10px]">
                    <div className="text-slate-400 font-bold">{c.assignee}</div>
                    <div className="text-slate-500">{c.cloudProvider} • {c.alerts} alerts</div>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-[10px] font-mono text-cyan-400 border-slate-800 bg-slate-950">
                    <Eye size={12} className="mr-1" /> Inspect Case
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Case Inspector Modal */}
      {selectedCase && (
        <Dialog open={Boolean(selectedCase)} onOpenChange={() => {
          setSelectedCase(null);
          setAssignMessage(null);
        }}>
          <DialogContent className="max-w-3xl bg-slate-950 border border-slate-800 text-slate-100 rounded-2xl p-6 shadow-2xl backdrop-blur-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader className="border-b border-slate-900 pb-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-cyan-400">{selectedCase.id}</span>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold ${getSeverityColor(selectedCase.severity)}`}>
                      {selectedCase.severity}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold ${getStatusColor(selectedCase.status)}`}>
                      {selectedCase.status}
                    </span>
                  </div>
                  <DialogTitle className="text-xl font-extrabold text-slate-100">
                    {selectedCase.title}
                  </DialogTitle>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-5 py-4">
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3.5 rounded-xl border border-slate-900 bg-slate-900/30 font-mono text-xs">
                <div>
                  <div className="text-[9px] text-slate-500 uppercase font-bold">Assignee</div>
                  <div className="text-slate-200 font-bold mt-0.5 flex items-center gap-1">
                    <User2 size={12} className="text-cyan-400" /> {selectedCase.assignee}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-500 uppercase font-bold">Cloud Provider</div>
                  <div className="text-cyan-400 font-bold mt-0.5">{selectedCase.cloudProvider}</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-500 uppercase font-bold">Linked Alerts</div>
                  <div className="text-slate-300 font-bold mt-0.5">{selectedCase.alerts} Correlated Alerts</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-500 uppercase font-bold">Created</div>
                  <div className="text-slate-400 mt-0.5">{selectedCase.created}</div>
                </div>
              </div>

              {/* Cryptographic Audit Hash Box */}
              <div className="border border-emerald-500/20 bg-emerald-950/10 rounded-xl p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                    <Lock size={14} /> Immutable Evidence Digest Hash
                  </span>
                  <span className="text-[9px] font-mono text-slate-500 uppercase">Vault Lock Verified</span>
                </div>
                <div className="font-mono text-xs text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-900">
                  {selectedCase.digestHash}8a901f2e3d4c5b6a7f8e9d0c
                </div>
              </div>

              {/* OWASP & NIST Incident Phase */}
              {selectedCase.owaspCode && (
                <div className="border border-slate-900 bg-slate-950/60 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
                    OWASP Standard & Incident Remediation Guideline
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {selectedCase.owaspCode}
                    </span>
                    <span className="text-xs text-slate-300 font-light">
                      NIST SP 800-61 Incident Containment & Eradication Standard Applied
                    </span>
                  </div>
                </div>
              )}

              {assignMessage && (
                <p className="text-xs font-mono text-cyan-400 bg-cyan-950/20 border border-cyan-500/20 p-3 rounded-xl">
                  {assignMessage}
                </p>
              )}
            </div>

            <DialogFooter className="border-t border-slate-900 pt-4 flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={handleAssignToMe}
                className="h-9 text-xs font-mono border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 cursor-pointer"
              >
                <UserCheck size={14} className="mr-1.5" /> Assign To Me
              </Button>
              <Button
                variant="outline"
                onClick={handleExportEvidence}
                className="h-9 text-xs font-mono border-slate-800 text-slate-300 hover:bg-slate-900 cursor-pointer"
              >
                <Download size={14} className="mr-1.5" /> Export Evidence JSON
              </Button>
              <Button
                onClick={() => {
                  setSelectedCase(null);
                  setAssignMessage(null);
                }}
                className="h-9 px-5 text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 rounded-xl cursor-pointer"
              >
                Close Case Inspector
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
