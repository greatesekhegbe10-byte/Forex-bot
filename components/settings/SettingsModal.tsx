
import React, { useState, useEffect } from 'react';
import { X, Server, ShieldCheck, Globe, Layout, Key, Box } from 'lucide-react';
import { BrokerConfig, AppSettings, BrokerType } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: BrokerConfig, appSettings: AppSettings) => void;
  currentConfig: BrokerConfig | null;
  currentAppSettings: AppSettings;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  currentConfig, 
  currentAppSettings 
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'api'>('general');

  // Broker Config
  const [brokerType, setBrokerType] = useState<BrokerType>(BrokerType.MT5);
  const [accountId, setAccountId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [region, setRegion] = useState('new-york');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [apiKey, setApiKey] = useState('');

  // App Settings
  const [appName, setAppName] = useState('');
  const [domainUrl, setDomainUrl] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');

  useEffect(() => {
    if (currentConfig) {
      setBrokerType(currentConfig.type || BrokerType.MT5);
      setAccountId(currentConfig.accountId || '');
      setAccessToken(currentConfig.accessToken || '');
      setRegion(currentConfig.region || 'new-york');
      setWebhookUrl(currentConfig.webhookUrl || '');
      setApiKey(currentConfig.apiKey || '');
    }
    if (currentAppSettings) {
      setAppName(currentAppSettings.appName);
      setDomainUrl(currentAppSettings.domainUrl);
      setGeminiApiKey(currentAppSettings.geminiApiKey || '');
    }
  }, [currentConfig, currentAppSettings, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(
      { type: brokerType, accountId, accessToken, region, webhookUrl, apiKey },
      { 
        appName, 
        domainUrl,
        beginnerMode: currentAppSettings.beginnerMode,
        geminiApiKey
      }
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'general' ? 'bg-slate-800 text-white border-b-2 border-blue-500' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe size={14} /> General
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'api' ? 'bg-slate-800 text-white border-b-2 border-blue-500' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Server size={14} /> Broker
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold uppercase flex items-center gap-2">
                  <Layout size={12} /> App Name
                </label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="ForexBotPro"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold uppercase flex items-center gap-2">
                  <Globe size={12} /> Domain Label
                </label>
                <input
                  type="text"
                  value={domainUrl}
                  onChange={(e) => setDomainUrl(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g. trading.com"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-2">
                <h3 className="text-xs font-bold text-white uppercase mb-2 flex items-center gap-2">
                  <Key size={12} /> AI Configuration
                </h3>
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="AI Studio API Key"
                />
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold uppercase flex items-center gap-2">
                  <Box size={12} /> Broker Platform
                </label>
                <select
                  value={brokerType}
                  onChange={(e) => setBrokerType(e.target.value as BrokerType)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value={BrokerType.MT5}>MetaTrader 5 (MetaAPI)</option>
                  <option value={BrokerType.IQ_OPTION}>IQ Option (via Bridge)</option>
                  <option value={BrokerType.POCKET_OPTION}>Pocket Option (via Bridge)</option>
                  <option value={BrokerType.CUSTOM_WEBHOOK}>Custom Webhook</option>
                </select>
              </div>

              {brokerType === BrokerType.MT5 ? (
                <div className="space-y-4 pt-2 animate-in fade-in">
                  <div className="bg-blue-900/20 border border-blue-800/50 rounded p-3 text-xs text-blue-200">
                    Connects directly via MetaAPI cloud.
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold uppercase">Access Token</label>
                    <input
                      type="password"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      placeholder="token_..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold uppercase">Account ID</label>
                    <input
                      type="text"
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold uppercase">Region</label>
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="new-york">New York</option>
                      <option value="london">London</option>
                      <option value="singapore">Singapore</option>
                      <option value="tokyo">Tokyo</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pt-2 animate-in fade-in">
                   <div className="bg-yellow-900/20 border border-yellow-800/50 rounded p-3 text-xs text-yellow-200">
                    <strong>Note:</strong> IQ Option and Pocket Option do not have public APIs for web browsers. 
                    You must use a Webhook Bridge/Extension URL that listens for these signals.
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold uppercase">Webhook / Bridge URL</label>
                    <input
                      type="text"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      placeholder="http://localhost:3000/trade or Bridge URL"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold uppercase">API Key (Optional)</label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-slate-800 gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-6 py-2 rounded shadow-lg transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
