import React, { useState } from 'react';
import { Activity, Mail, Lock, User, ArrowRight, BarChart2, TrendingUp, Globe, ShieldCheck, Hexagon } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (email: string, name: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      onLogin(email, name || email.split('@')[0]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex bg-[#020617] font-sans text-slate-200 selection:bg-indigo-500/30 overflow-hidden">
      
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Left Panel - Cinematic Visuals (Desktop) */}
      <div className="hidden lg:flex lg:w-[55%] relative items-center justify-center p-12">
        <div className="absolute inset-0 bg-[#030712]/50 backdrop-blur-[1px]"></div>
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
        />

        <div className="relative z-10 max-w-xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
           <div className="inline-flex items-center gap-3 mb-8 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500 blur-sm opacity-50 rounded-full"></div>
                <Activity className="relative text-indigo-400" size={18} />
              </div>
              <span className="text-xs font-bold text-indigo-100 tracking-[0.2em] uppercase font-mono">Algorithmic Intelligence</span>
           </div>
           
           <h1 className="text-7xl font-bold text-white mb-8 leading-[1.05] tracking-tighter">
             Precision <br/>
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400">Trading Engine.</span>
           </h1>
           
           <p className="text-lg text-slate-400 leading-relaxed mb-12 max-w-md font-light border-l-2 border-indigo-500/30 pl-6">
             Deploy institutional-grade strategies with a unified terminal powered by Gemini AI analytics and low-latency execution.
           </p>

           <div className="grid grid-cols-2 gap-4">
             {[
               { icon: TrendingUp, title: "Market Edge", desc: "Real-time pattern recognition" },
               { icon: ShieldCheck, title: "Secure Core", desc: "AES-256 Encrypted Vault" },
               { icon: Globe, title: "Global Access", desc: "Multi-region MetaAPI Feeds" },
               { icon: BarChart2, title: "Deep Analysis", desc: "Predictive ML Models" }
             ].map((item, i) => (
               <div key={i} className="group bg-[#0F1420]/40 backdrop-blur-md rounded-xl p-5 border border-white/5 hover:border-indigo-500/30 hover:bg-[#131825]/60 transition-all duration-500">
                 <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-white/5 text-slate-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-colors">
                        <item.icon size={18} />
                    </div>
                    <h3 className="font-bold text-slate-200 text-sm">{item.title}</h3>
                 </div>
                 <p className="text-xs text-slate-500 pl-11">{item.desc}</p>
               </div>
             ))}
           </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 relative z-20">
        <div className="w-full max-w-[420px] animate-in zoom-in-95 duration-700">
          
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-10">
             <div className="flex items-center gap-3">
                <div className="relative p-3 bg-[#0F1420] rounded-xl border border-white/10 shadow-2xl">
                  <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full"></div>
                  <Activity className="relative text-indigo-400" size={24} />
                </div>
                <span className="text-2xl font-bold tracking-tight text-white">ForexBot<span className="text-indigo-400">Pro</span></span>
             </div>
          </div>

          <div className="bg-[#0B0F19]/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden">
            {/* Top Gradient Line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
            
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
                {isLogin ? 'Welcome back' : 'Initialize Account'}
              </h2>
              <p className="text-slate-400 text-sm flex items-center gap-2">
                {isLogin ? 'Access your trading terminal.' : 'Setup your professional workspace.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1">Identity</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                        <User size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#020617]/80 border border-white/10 rounded-xl py-4 pl-11 pr-4 text-white placeholder-slate-700 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner"
                      placeholder="Full Name"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1">Credentials</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#020617]/80 border border-white/10 rounded-xl py-4 pl-11 pr-4 text-white placeholder-slate-700 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner"
                    placeholder="name@firm.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                 <div className="flex justify-between">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1">Security Key</label>
                 </div>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#020617]/80 border border-white/10 rounded-xl py-4 pl-11 pr-4 text-white placeholder-slate-700 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl transition-all mt-2 shadow-lg shadow-indigo-900/20 active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out blur-md"></div>
                <div className="relative flex items-center justify-center gap-2">
                    {isLoading ? (
                    <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Authenticating...
                    </span>
                    ) : (
                    <>
                        {isLogin ? 'Access Terminal' : 'Create Account'}
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                    )}
                </div>
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-xs text-slate-400 hover:text-white transition-colors font-medium flex items-center justify-center gap-2 mx-auto"
              >
                {isLogin ? (
                    <>New to platform? <span className="text-indigo-400">Initialize protocol</span></>
                ) : (
                    <>Existing user? <span className="text-indigo-400">Log in</span></>
                )}
              </button>
            </div>
          </div>
          
          <div className="mt-8 text-center flex items-center justify-center gap-4 opacity-50">
             <Hexagon size={14} className="text-slate-600" />
             <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                Secured by 256-bit Encryption
             </p>
             <Hexagon size={14} className="text-slate-600" />
          </div>
        </div>
      </div>
    </div>
  );
};