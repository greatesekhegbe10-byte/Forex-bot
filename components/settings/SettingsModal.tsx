
import React, { useState, useEffect } from 'react';
import { X, Server, ShieldCheck, Globe, Layout, Key, Box, AlertTriangle, CreditCard, Lock, CheckCircle, Clock } from 'lucide-react';
import { BrokerConfig, AppSettings, BrokerType, SubscriptionStatus } from '../../types';
import { BANK_DETAILS, initiatePaymentVerification, getStoredSubscription } from '../../services/paymentService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: BrokerConfig, appSettings: AppSettings) => void;
  currentConfig: BrokerConfig | null;
  currentAppSettings: AppSettings;
  subscriptionStatus: SubscriptionStatus;
  onSubscriptionUpdate: (status: SubscriptionStatus) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  currentConfig, 
  currentAppSettings,
  subscriptionStatus,
  onSubscriptionUpdate
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'api' | 'pro'>('general');

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

  // Payment
  const [senderName, setSenderName] = useState('');
  const [localSubStatus, setLocalSubStatus] = useState<SubscriptionStatus>(SubscriptionStatus.FREE);

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
    }
    setLocalSubStatus(subscriptionStatus);
  }, [currentConfig, currentAppSettings, isOpen, subscriptionStatus]);

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
        beginnerMode: currentAppSettings.beginnerMode
      }
    );
    onClose();
  };

  const handlePaymentSubmit = () => {
    if (!senderName.trim()) return;
    const newStatus = initiatePaymentVerification(senderName);
    setLocalSubStatus(newStatus);
    onSubscriptionUpdate(newStatus);
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
          <button
            onClick={() => setActiveTab('pro')}
            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'pro' ? 'bg-slate-800 text-white border-b-2 border-yellow-500' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard size={14} className="text-yellow-500" /> Plan
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

          {activeTab === 'pro' && (
            <div className="space-y-5">
              <div className="text-center pb-4 border-b border-slate-800">
                 <h3 className="text-white font-bold text-lg mb-1">Upgrade to Pro</h3>
                 <p className="text-xs text-slate-400">Unlock Auto-Trading, AI Analysis & Backtesting</p>
              </div>

              {localSubStatus === SubscriptionStatus.FREE && (
                <div className="space-y-4">
                  <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Bank Transfer Details (Nigeria)</h4>
                    <div className="space-y-2 text-sm text-white font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Bank:</span>
                        <span>{BANK_DETAILS.bankName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Acct No:</span>
                        <span className="font-bold text-yellow-400">{BANK_DETAILS.accountNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Name:</span>
                        <span>{BANK_DETAILS.accountName}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-slate-700">
                        <span className="text-slate-500">Amount:</span>
                        <span className="font-bold">{BANK_DETAILS.currency} {BANK_DETAILS.amountNGN.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 font-semibold uppercase">Sender Name (For Verification)</label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      placeholder="Enter the name on your bank account"
                    />
                    <button
                      type="button"
                      onClick={handlePaymentSubmit}
                      disabled={!senderName.trim()}
                      className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg mt-2 flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={16} /> I Have Made Payment
                    </button>
                  </div>
                </div>
              )}

              {localSubStatus === SubscriptionStatus.PENDING && (
                <div className="bg-yellow-900/10 border border-yellow-700/50 rounded-xl p-6 text-center">
                  <Clock size={48} className="text-yellow-500 mx-auto mb-4 animate-pulse" />
                  <h3 className="text-white font-bold mb-2">Verification In Progress</h3>
                  <p className="text-sm text-yellow-200/80 leading-relaxed">
                    We are currently verifying your payment of NGN {BANK_DETAILS.amountNGN.toLocaleString()}.<br/>
                    This usually takes 10-30 minutes. Features will unlock automatically upon confirmation.
                  </p>
                </div>
              )}

              {localSubStatus === SubscriptionStatus.PRO && (
                <div className="bg-green-900/10 border border-green-700/50 rounded-xl p-6 text-center">
                  <ShieldCheck size={48} className="text-green-500 mx-auto mb-4" />
                  <h3 className="text-white font-bold mb-2">Pro Account Active</h3>
                  <p className="text-sm text-green-200/80 leading-relaxed">
                    Thank you for your payment. All features including Auto-Trading and AI Analysis are unlocked.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab !== 'pro' && (
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
          )}
        </form>
      </div>
    </div>
  );
};
