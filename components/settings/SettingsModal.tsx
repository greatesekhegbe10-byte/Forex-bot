
import React, { useState, useEffect } from 'react';
import { X, Save, Server, ShieldCheck, Globe, Layout } from 'lucide-react';
import { MetaApiConfig, AppSettings } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: MetaApiConfig, appSettings: AppSettings) => void;
  currentConfig: MetaApiConfig | null;
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

  // API Config State
  const [accountId, setAccountId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [region, setRegion] = useState('new-york');

  // App Settings State
  const [appName, setAppName] = useState('');
  const [domainUrl, setDomainUrl] = useState('');

  useEffect(() => {
    if (currentConfig) {
      setAccountId(currentConfig.accountId);
      setAccessToken(currentConfig.accessToken);
      setRegion(currentConfig.region);
    }
    if (currentAppSettings) {
      setAppName(currentAppSettings.appName);
      setDomainUrl(currentAppSettings.domainUrl);
    }
  }, [currentConfig, currentAppSettings, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(
      { accountId, accessToken, region },
      { appName, domainUrl }
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md transform transition-all scale-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
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
            <Globe size={16} /> General & Domain
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'api' ? 'bg-slate-800 text-white border-b-2 border-blue-500' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Server size={16} /> Broker API
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          
          {activeTab === 'general' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-4">
                <p className="text-sm text-slate-300">
                  Customize the branding of your trading dashboard.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold uppercase flex items-center gap-2">
                  <Layout size={12} /> App Name
                </label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. ForexBotPro"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold uppercase flex items-center gap-2">
                  <Globe size={12} /> Custom Domain / URL
                </label>
                <input
                  type="text"
                  value={domainUrl}
                  onChange={(e) => setDomainUrl(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. my-trading-firm.com"
                />
                <p className="text-[10px] text-slate-500">This changes the label in the browser tab.</p>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 mb-4 flex gap-3">
                <ShieldCheck className="text-blue-400 shrink-0" size={24} />
                <p className="text-sm text-blue-200">
                  Connect your MetaTrader 5 account via MetaAPI. Keys are stored locally.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold uppercase">MetaAPI Access Token</label>
                <input
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="token_..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold uppercase">MT5 Account ID</label>
                <input
                  type="text"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 12345678"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold uppercase">Region</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="new-york">New York</option>
                  <option value="london">London</option>
                  <option value="singapore">Singapore</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="mr-3 px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Save size={18} />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
