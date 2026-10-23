'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Network, Search, ArrowRight, RefreshCw, Layers, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  getIntegrationConnectors, 
  updateConnectorStatus, 
  testConnectorConnection, 
  IntegrationConnector, 
  IntegrationCategory, 
  IntegrationStatus 
} from '@/lib/api/nexus';

export default function NexusPage() {
  const [integrations, setIntegrations] = useState<IntegrationConnector[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [testingKey, setTestingKey] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    getIntegrationConnectors()
      .then((data) => {
        if (mounted) {
          setIntegrations(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load integrations:', err);
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const toggleStatus = async (item: IntegrationConnector) => {
    const nextStatus: IntegrationStatus = item.status === 'CONNECTED' ? 'INACTIVE' : 'CONNECTED';
    
    // Optimistic UI update
    setIntegrations((prev) =>
      prev.map((c) =>
        c.connectorKey === item.connectorKey
          ? {
              ...c,
              status: nextStatus,
              latency: nextStatus === 'CONNECTED' ? '120ms' : undefined,
              lastSync: nextStatus === 'CONNECTED' ? 'Just now' : undefined,
            }
          : c
      )
    );

    try {
      const updated = await updateConnectorStatus(item.connectorKey, nextStatus);
      setIntegrations((prev) =>
        prev.map((c) => (c.connectorKey === item.connectorKey ? updated : c))
      );
    } catch (err) {
      console.error('Failed to update status on server:', err);
    }
  };

  const handleTestConnection = async (connectorKey: string) => {
    setTestingKey(connectorKey);
    try {
      const result = await testConnectorConnection(connectorKey);
      setIntegrations((prev) =>
        prev.map((c) => (c.connectorKey === connectorKey ? result : c))
      );
    } finally {
      setTestingKey(null);
    }
  };

  const filteredIntegrations = integrations.filter((item) => {
    const matchesCategory =
      activeCategory === 'all' || item.category.toLowerCase() === activeCategory.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8" data-testid="nexus-page">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight mb-2">Nexus</h1>
          <p className="text-sm text-slate-400 font-light">
            Cloud and third-party SaaS integrations for telemetry ingestion and automated threat dispatching
          </p>
        </div>
      </div>

      {/* Categories and Search bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center border-b border-slate-900 pb-4">
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto scrollbar-none pb-1 md:pb-0">
          {['all', 'CLOUD', 'ALERTING', 'TICKETING', 'SIEM'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === cat
                  ? 'bg-slate-900 text-cyan-400 border border-slate-800'
                  : 'text-slate-500 hover:text-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Modules' : cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
          <Input
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-slate-950/80 border-slate-900 text-xs focus:border-cyan-500 text-slate-100 placeholder-slate-500 rounded-lg"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-slate-900/40 border border-slate-900 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIntegrations.map((item) => (
            <Card
              key={item.id || item.connectorKey}
              glass
              className={`p-1 flex flex-col justify-between transition-all duration-300 ${
                item.status === 'CONNECTED' ? 'border-cyan-500/10' : 'border-slate-900'
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-900 flex items-center justify-center text-slate-400">
                      <Layers
                        size={18}
                        className={item.status === 'CONNECTED' ? 'text-cyan-400' : 'text-slate-500'}
                      />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                        {item.category}
                      </span>
                      <CardTitle className="text-sm font-bold text-slate-200 mt-0.5">
                        {item.name}
                      </CardTitle>
                    </div>
                  </div>

                  {/* Connection switch */}
                  <button
                    onClick={() => toggleStatus(item)}
                    title={`Toggle ${item.name} connection`}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer relative ${
                      item.status === 'CONNECTED' ? 'bg-cyan-500' : 'bg-slate-900 border border-slate-800'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full bg-slate-950 shadow-md transition-transform duration-300 ${
                        item.status === 'CONNECTED' ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <p className="text-xs text-slate-400 font-light leading-relaxed">
                  {item.description}
                </p>

                {/* Status details bar */}
                <div className="border-t border-slate-900/60 pt-3 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                  {item.status === 'CONNECTED' ? (
                    <>
                      <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        ACTIVE {item.latency ? `(${item.latency})` : ''}
                      </span>
                      <div className="flex items-center gap-2">
                        {item.lastSync && (
                          <span className="hidden sm:inline text-slate-600">
                            Synced {typeof item.lastSync === 'string' && item.lastSync.includes('T') ? 'recently' : item.lastSync}
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={testingKey === item.connectorKey}
                          onClick={() => handleTestConnection(item.connectorKey)}
                          className="h-6 px-1.5 text-[9px] text-slate-400 hover:text-cyan-400 hover:bg-slate-900"
                        >
                          {testingKey === item.connectorKey ? (
                            <RefreshCw size={10} className="animate-spin" />
                          ) : (
                            <Activity size={10} className="mr-1" />
                          )}
                          Ping
                        </Button>
                      </div>
                    </>
                  ) : item.status === 'PENDING' ? (
                    <>
                      <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                        <RefreshCw size={10} className="animate-spin" />
                        PENDING SETUP
                      </span>
                      <Button
                        onClick={() => toggleStatus(item)}
                        variant="link"
                        className="p-0 h-auto text-[10px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-0.5 hover:no-underline"
                      >
                        Activate <ArrowRight size={10} />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex items-center gap-1.5 text-slate-600 font-bold">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-800" />
                        DISABLED
                      </span>
                      <Button
                        onClick={() => toggleStatus(item)}
                        variant="link"
                        className="p-0 h-auto text-[10px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-0.5 hover:no-underline"
                      >
                        Connect <ArrowRight size={10} />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredIntegrations.length === 0 && (
            <div className="col-span-3 text-center py-20 border border-dashed border-slate-900 rounded-2xl">
              <Network className="mx-auto h-8 w-8 text-slate-600 mb-3 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-300">No Integrations Found</h3>
              <p className="text-xs text-slate-500 font-light mt-1">
                Try resetting your category filter or search keywords.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
