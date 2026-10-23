'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ShieldAlert,
  User,
  Database,
  Globe,
  Network,
  Calendar,
  FileText,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  addIncidentComment,
  getIncidentById,
  getIncidents,
  Incident,
  IncidentDetail,
  TimelineEvent,
} from '@/lib/api/incidents';

export default function PrismPage() {
  const [selectedNode, setSelectedNode] = useState<string>('Root Alert');
  const [currentIncident, setCurrentIncident] = useState<IncidentDetail | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    async function loadIncidentData() {
      try {
        const res = await getIncidents({ limit: 5 });
        if (res.items.length > 0) {
          const detail = await getIncidentById(res.items[0].id);
          setCurrentIncident(detail);
          setTimelineEvents(detail.timeline_events);
        }
      } catch (err) {
        console.warn('Using local fallback for Prism investigation:', err);
      }
    }
    loadIncidentData();
  }, []);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentIncident) return;

    setIsSubmitting(true);
    try {
      const added = await addIncidentComment(currentIncident.id, newComment.trim());
      const newTimelineEntry: TimelineEvent = {
        id: added.id,
        event_type: 'ANALYST_NOTE',
        title: 'Analyst Annotation',
        description: added.message,
        source: added.author_name,
        timestamp: added.created_at,
      };
      setTimelineEvents((prev) => [...prev, newTimelineEntry]);
      setNewComment('');
    } catch (err) {
      console.warn('Failed to submit comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nodesInfo: Record<string, { type: string; title: string; desc: string; extra: string[] }> = {
    'Root Alert': {
      type: 'Incident Trigger',
      title: currentIncident?.title || 'ConsoleLogin Anomaly',
      desc: currentIncident?.summary || 'Unusual console login attempt from a proxy range outside regular user geolocations.',
      extra: [
        `Incident ID: ${currentIncident?.id || 'inc-2026-001'}`,
        `Risk Score: ${currentIncident?.risk_score || 95}/100`,
        `Severity: ${currentIncident?.severity?.toUpperCase() || 'CRITICAL'}`,
        `Status: ${currentIncident?.status?.toUpperCase() || 'INVESTIGATING'}`,
      ],
    },
    'Identity Node': {
      type: 'Actor/Identity',
      title: 'iam-role-developer-full',
      desc: 'User identity associated with session token. Normally logs in from Pune, India.',
      extra: [
        'ARN: arn:aws:iam::123456789012:role/dev',
        'MFA status: Session established without MFA',
        'Status: Active Session',
      ],
    },
    'Source IP Node': {
      type: 'Network Node',
      title: '198.51.100.42',
      desc: 'Active threat source IP. Flagged as malicious hosting node in Watchtower.',
      extra: ['ASN: AS12345 (SecureHost)', 'City: St. Petersburg', 'Coordinates: 59.934, 30.335'],
    },
    'Target Asset': {
      type: 'Resource Node',
      title: 'prod-secrets-bucket',
      desc: 'S3 data store containing configuration secrets, database connection keys.',
      extra: [
        'Encryption: KMS Enabled',
        'Permission requested: GetObject',
        'Result: AccessDenied (Policy Blocked)',
      ],
    },
  };

  return (
    <div className="space-y-8" data-testid="prism-page">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight mb-2">Prism</h1>
        <p className="text-sm text-slate-400 font-light">
          Interactive forensic investigation, alert link analysis, and incident timeline
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Link Analysis Graph (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card glass className="p-1 min-h-[500px] flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between pb-0">
              <CardTitle className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                Investigation Visualizer
              </CardTitle>
              <Network className="h-4 w-4 text-cyan-400 animate-pulse" />
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center py-10 relative overflow-hidden">
              {/* SVG Connecting lines */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <svg className="w-full h-full opacity-35" xmlns="http://www.w3.org/2000/svg">
                  <line x1="25%" y1="50%" x2="50%" y2="50%" stroke="#06b6d4" strokeWidth="2" strokeDasharray="5,5" />
                  <line x1="50%" y1="50%" x2="75%" y2="25%" stroke="#3b82f6" strokeWidth="2" />
                  <line x1="50%" y1="50%" x2="75%" y2="75%" stroke="#ef4444" strokeWidth="2" />
                </svg>
              </div>

              {/* Node Layout Grid */}
              <div className="grid grid-cols-3 items-center justify-items-center gap-12 w-full relative z-10">
                {/* Left: Source IP */}
                <button
                  onClick={() => setSelectedNode('Source IP Node')}
                  className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border transition-all duration-300 w-36 ${
                    selectedNode === 'Source IP Node'
                      ? 'bg-red-500/10 border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.25)] scale-105'
                      : 'bg-slate-950/60 border-slate-900 hover:border-slate-800'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
                    <Globe size={18} />
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                      Source IP
                    </div>
                    <div className="text-xs text-slate-300 font-mono font-semibold truncate max-w-[120px] mt-0.5">
                      198.51.100.42
                    </div>
                  </div>
                </button>

                {/* Center: Incident Trigger (Root Alert) */}
                <button
                  onClick={() => setSelectedNode('Root Alert')}
                  className={`flex flex-col items-center gap-2.5 p-5 rounded-2xl border transition-all duration-300 w-40 ${
                    selectedNode === 'Root Alert'
                      ? 'bg-cyan-500/10 border-cyan-500/60 shadow-[0_0_20px_rgba(6,180,212,0.25)] scale-105'
                      : 'bg-slate-950/60 border-slate-900 hover:border-slate-800'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                    <ShieldAlert size={22} className="animate-pulse" />
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest font-mono">
                      Trigger Alert
                    </div>
                    <div className="text-xs text-slate-200 font-bold mt-1">ConsoleLogin</div>
                  </div>
                </button>

                {/* Right Stack: Identity & Target Resource */}
                <div className="flex flex-col gap-8">
                  {/* Identity Node */}
                  <button
                    onClick={() => setSelectedNode('Identity Node')}
                    className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border transition-all duration-300 w-36 ${
                      selectedNode === 'Identity Node'
                        ? 'bg-blue-500/10 border-blue-500/60 shadow-[0_0_20px_rgba(59,130,246,0.25)] scale-105'
                        : 'bg-slate-950/60 border-slate-900 hover:border-slate-800'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <User size={18} />
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                        IAM User
                      </div>
                      <div className="text-xs text-slate-300 font-semibold truncate max-w-[120px] mt-0.5">
                        dev-role
                      </div>
                    </div>
                  </button>

                  {/* Target Asset Node */}
                  <button
                    onClick={() => setSelectedNode('Target Asset')}
                    className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border transition-all duration-300 w-36 ${
                      selectedNode === 'Target Asset'
                        ? 'bg-amber-500/10 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.25)] scale-105'
                        : 'bg-slate-950/60 border-slate-900 hover:border-slate-800'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                      <Database size={18} />
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                        Asset S3
                      </div>
                      <div className="text-xs text-slate-300 font-semibold truncate max-w-[120px] mt-0.5">
                        secrets-bucket
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Legend */}
              <div className="flex gap-4 justify-center text-[10px] text-slate-500 uppercase tracking-widest pt-10 border-t border-slate-900/60">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-cyan-400"></span> Incident
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-400"></span> Threat IP
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-400"></span> User IAM
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400"></span> Resource S3
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Node Detail Panel & Forensic Timeline */}
        <div className="space-y-6">
          <Card glass className="p-1">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                Node Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-slate-950/60 border border-slate-900 rounded-xl">
                <span className="text-[9px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
                  {nodesInfo[selectedNode]?.type}
                </span>
                <h3 className="text-lg font-bold text-slate-200 mt-1">{nodesInfo[selectedNode]?.title}</h3>
                <p className="text-xs text-slate-400 font-light mt-2.5 leading-relaxed">
                  {nodesInfo[selectedNode]?.desc}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  Properties
                </span>
                <div className="space-y-1.5">
                  {nodesInfo[selectedNode]?.extra.map((prop, idx) => (
                    <div
                      key={idx}
                      className="p-2 border border-slate-900 bg-slate-950/20 text-[11px] font-mono text-slate-300 rounded-lg"
                    >
                      {prop}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Forensic Investigation logs timeline */}
          <Card glass className="p-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                Forensic Timeline
              </CardTitle>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                {timelineEvents.length} Events
              </span>
            </CardHeader>
            <CardContent className="space-y-3.5">
              <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                {timelineEvents.length === 0 ? (
                  <div className="text-xs text-slate-500 text-center py-4">No events registered yet</div>
                ) : (
                  timelineEvents.map((evt, idx) => (
                    <div key={idx} className="flex gap-2.5 items-start">
                      <Calendar size={14} className="text-cyan-400 mt-0.5 shrink-0" />
                      <div className="space-y-0.5">
                        <div className="text-[10px] text-slate-500 font-mono">
                          {new Date(evt.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </div>
                        <div className="text-xs text-slate-200 font-medium">{evt.title}</div>
                        <div className="text-[11px] text-slate-400 font-light">{evt.description}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Annotation Form */}
              <form onSubmit={handleAddComment} className="pt-2 border-t border-slate-900/60 flex gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add analyst investigation note..."
                  className="text-xs bg-slate-950/60 border-slate-900 focus:border-cyan-500/40"
                  disabled={isSubmitting}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !newComment.trim()}
                  className="bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 shrink-0"
                >
                  <Send size={14} />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
