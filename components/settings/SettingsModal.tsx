
import React, { useState, useEffect } from 'react';
import { X, Server, ShieldCheck, Globe, Layout, Key, Box, AlertTriangle } from 'lucide-react';
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
  const [customRegion, setCustomRegion] = useState('');
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
      // If region is not in standard list, set it as custom
      const standardRegions = ['new-york', 'london', 'frankfurt', 'singapore', 'tokyo', 'mumbai', 'hong-kong', 'sao-paulo', 'johannesburg', 'bahrain'];
      if (currentConfig.region && !standardRegions.includes(currentConfig.region)) {
         setRegion('custom');
         setCustomRegion(currentConfig.region);
      }
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
    const finalRegion = region === 'custom' ? customRegion : region;
    
    onSave(
      { type: brokerType, accountId, accessToken, region: finalRegion, webhookUrl, apiKey },
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
                  <Key size={12} /> AI & Security
                </h3>
                <div className="bg-slate-800/50 p-3 rounded border border-slate-700 mb-2">
                    <p className="text-[10px] text-slate-400 leading-relaxed flex gap-2">
                        <ShieldCheck size={14} className="shrink-0 text-green-500" />
                        API Keys are stored locally on your device in an encrypted format. They are never transmitted to our servers.
                    </p>
                </div>
                <label className="text-xs text-slate-400 font-semibold uppercase">Gemini API Key</label>
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                  placeholder="AI Studio API Key (Starts with AIza...)"
                />
                <p className="text-[10px] text-slate-500">
                  Required for AI Analyst to work on this device.
                </p>
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
                    Connects directly via MetaAPI cloud. Support for all global regions.
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold uppercase">Access Token</label>
                    <input
                      type="password"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                      placeholder="token_..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold uppercase">Account ID</label>
                    <input
                      type="text"
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold uppercase">Server Region</label>
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="new-york">New York (North America)</option>
                      <option value="london">London (Europe)</option>
                      <option value="frankfurt">Frankfurt (Europe)</option>
                      <option value="singapore">Singapore (Asia)</option>
                      <option value="tokyo">Tokyo (Asia)</option>
                      <option value="mumbai">Mumbai (India)</option>
                      <option value="hong-kong">Hong Kong (Asia)</option>
                      <option value="sao-paulo">Sao Paulo (South America)</option>
                      <option value="johannesburg">Johannesburg (Africa)</option>
                      <option value="bahrain">Bahrain (Middle East)</option>
                      <option value="custom">Custom / Other</option>
                    </select>
                  </div>
                  
                  {region === 'custom' && (
                    <div className="space-y-1 animate-in slide-in-from-top-2">
                       <label className="text-xs text-slate-400 font-semibold uppercase">Custom Region Slug</label>
                       <input
                          type="text"
                          value={customRegion}
                          onChange={(e) => setCustomRegion(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                          placeholder="e.g. toronto"
                        />
                        <p className="text-[10px] text-yellow-500 flex items-center gap-1">
                          <AlertTriangle size={10} />
                          Ensure this matches the MetaAPI URL region code exactly.
                        </p>
                    </div>
                  )}
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
