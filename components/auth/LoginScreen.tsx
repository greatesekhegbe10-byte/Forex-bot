import React, { useState } from 'react';
import { Activity, Mail, ArrowRight, Lock, User, CheckCircle2, TrendingUp, Shield } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (email: string, name: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate network delay for smooth UX
    setTimeout(() => {
      const finalName = name || email.split('@')[0];
      onLogin(email, finalName);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex w-full bg-[#020617] text-slate-200 overflow-hidden">
      
      {/* LEFT SIDE - Form Section */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center px-8 sm:px-12 lg:px-20 relative z-10 bg-[#020617] border-r border-slate-800/50">
        
        {/* Logo / Brand */}
        <div className="absolute top-8 left-8 sm:left-12 lg:left-20 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Activity className="text-white" size={18} />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">ForexBot<span className="text-blue-500">Pro</span></span>
        </div>

        <div className="max-w-sm w-full mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
              {isLogin ? 'Welcome back' : 'Start trading smarter'}
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              {isLogin 
                ? 'Enter your credentials to access your analytics dashboard.' 
                : 'Create an account to unlock AI-powered market insights.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {!isLogin && (
              <div className="group">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Full Name</label>
                <div className="relative transition-all duration-300 focus-within:scale-[1.01]">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div className="group">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Email Address</label>
              <div className="relative transition-all duration-300 focus-within:scale-[1.01]">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Password</label>
              <div className="relative transition-all duration-300 focus-within:scale-[1.01]">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-900/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Sign In to Dashboard' : 'Create Free Account'}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <p className="text-sm text-slate-400">
              {isLogin ? "Don't have an account yet?" : "Already have an account?"}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 text-blue-400 hover:text-blue-300 font-semibold transition-colors focus:outline-none"
              >
                {isLogin ? 'Sign up now' : 'Log in'}
              </button>
            </p>
          </div>
        </div>
        
        <div className="absolute bottom-6 w-full text-center pr-16 sm:pr-24 lg:pr-40 text-xs text-slate-600">
            &copy; {new Date().getFullYear()} ForexBotPro. Secure Encrypted Connection.
        </div>
      </div>

      {/* RIGHT SIDE - Visual Feature Section */}
      <div className="hidden lg:flex flex-1 relative bg-[#0f172a] items-center justify-center overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px]" />
        
        {/* Grid Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />

        {/* Content Content */}
        <div className="relative z-10 max-w-md space-y-8 p-12">
            <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/30 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wide">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    AI-Powered Analysis
                </div>
                <h2 className="text-4xl font-bold text-white leading-tight">
                    Gain the edge with <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                        automated intelligence.
                    </span>
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed">
                    Our bot processes thousands of market signals per second to deliver high-confidence trading opportunities directly to your dashboard.
                </p>
            </div>

            <div className="grid gap-4">
                {[
                    { icon: TrendingUp, title: 'Smart Trend Detection', desc: 'Identifies market direction before the move happens.' },
                    { icon: Shield, title: 'Risk Management', desc: 'Auto-calculates stop losses to protect your capital.' },
                    { icon: Activity, title: 'Real-time Execution', desc: 'Zero-latency trade placement on your favorite broker.' }
                ].map((item, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800/50 backdrop-blur-sm hover:border-blue-500/30 transition-colors">
                        <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <item.icon size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-sm">{item.title}</h3>
                            <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};