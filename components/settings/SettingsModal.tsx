

import React, { useState, useEffect } from 'react';
import { X, Server, Globe, Layout, Box, AlertTriangle, Clock } from 'lucide-react';
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
  const [validationError, setValidationError] = useState<string | null>(null);

  // App Settings
  const [appName, setAppName] = useState('');
  const [domainUrl, setDomainUrl] = useState('');
  const [refreshInterval, setRefreshInterval] = useState<number>(10);

  useEffect(() => {
    if (currentConfig) {
      setBrokerType(currentConfig.type || BrokerType.MT5);
      setAccountId(currentConfig.accountId || '');
      setAccessToken(currentConfig.accessToken || '');
      setRegion(currentConfig.region || 'new-york');
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
      setRefreshInterval(currentAppSettings.refreshInterval || 10);
    }
  }, [currentConfig, currentAppSettings, isOpen]);

  if (!isOpen) return null;

  const validateBrokerConfig = (): boolean => {
    setValidationError(null);
    if (brokerType === BrokerType.MT5) {
      if (!accountId.trim()) {
        setValidationError("MetaTrader Account ID is required.");
        return false;
      }
      if (!accessToken.trim()) {
        setValidationError("MetaAPI Access Token is required.");
        return false;
      }
      if (region === 'custom' && !customRegion.trim()) {
        setValidationError("Custom Region Slug is required.");
        return false;
      }
    } else {
      // For Webhook brokers
      if (!webhookUrl.trim()) {
        setValidationError("Webhook/Bridge URL is required for this broker.");
        return false;
      }
      // Simple URL validation
      if (!webhookUrl.startsWith('http')) {
        setValidationError("Webhook URL must start with http:// or https://");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only validate if we are saving broker settings
    if (activeTab === 'api') {
      if (!validateBrokerConfig()) return;
    }

    const finalRegion = region === 'custom' ? customRegion : region;
    
    onSave(
      { type: brokerType, accountId, accessToken, region: finalRegion, webhookUrl, apiKey },
      { 
        appName, 
        domainUrl,
        beginnerMode: currentAppSettings.beginnerMode,
        refreshInterval
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

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold uppercase flex items-center gap-2">
                  <Clock size={12} /> Data Refresh Rate (Seconds)
                </label>
                <input
                  type="number"
                  min="5"
                  max="300"
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <p className="text-[10px] text-slate-500">Interval for fetching broker data (Balance, Equity, Positions).</p>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-4">
              {validationError && (
                <div className="bg-red-500/10 border border-red-500/50 rounded p-3 text-xs text-red-200 flex items-center gap-2">
                   <AlertTriangle size={14} /> {validationError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold uppercase flex items-center gap-2">
                  <Box size={12} /> Broker Platform
                </label>
                <select
                  value={brokerType}
                  onChange={(e) => {
                    setBrokerType(e.target.value as BrokerType);
                    setValidationError(null);
                  }}
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
                    <label className="text-xs text-slate-400 font-semibold uppercase">Access Token <span className="text-red-400">*</span></label>
                    <input
                      type="password"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                      placeholder="token_..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold uppercase">Account ID <span className="text-red-400">*</span></label>
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
                      <option value="new-york">New York</option>
                      <option value="london">London</option>
                      <option value="frankfurt">Frankfurt</option>
                      <option value="singapore">Singapore</option>
                      <option value="tokyo">Tokyo</option>
                      <option value="mumbai">Mumbai</option>
                      <option value="hong-kong">Hong Kong</option>
                      <option value="sao-paulo">Sao Paulo</option>
                      <option value="johannesburg">Johannesburg</option>
                      <option value="bahrain">Bahrain</option>
                      <option value="custom">Custom / Other</option>
                    </select>
                  </div>
                  
                  {region === 'custom' && (
                    <div className="space-y-1 animate-in slide-in-from-top-2">
                       <label className="text-xs text-slate-400 font-semibold uppercase">Custom Region Slug <span className="text-red-400">*</span></label>
                       <input
                          type="text"
                          value={customRegion}
                          onChange={(e) => setCustomRegion(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                          placeholder="e.g. toronto"
                        />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 pt-2 animate-in fade-in">
                   <div className="bg-yellow-900/20 border border-yellow-800/50 rounded p-3 text-xs text-yellow-200">
                    <strong>Note:</strong> Bridge URL required.
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold uppercase">Webhook / Bridge URL <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      placeholder="http://localhost:3000/trade"
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