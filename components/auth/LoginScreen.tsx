
import React, { useState } from 'react';
import { Activity, Mail, ArrowRight, Lock, User, TrendingUp, Shield, Zap } from 'lucide-react';

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
    // Simulate authentication delay for effect
    setTimeout(() => {
      const finalName = name || email.split('@')[0];
      onLogin(email, finalName);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full flex bg-[#020617] text-white relative overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-[1440px] mx-auto flex z-10">
        
        {/* Left Section: Form */}
        <div className="w-full lg:w-[480px] xl:w-[550px] flex flex-col justify-center px-8 sm:px-12 py-12 h-screen relative backdrop-blur-sm bg-[#020617]/80 border-r border-white/5">
          
          <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Activity className="text-white" size={20} />
              </div>
              <span className="text-xl font-bold tracking-tight">ForexBot<span className="text-blue-500">Pro</span></span>
            </div>
            
            <h1 className="text-4xl font-bold mb-3 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-slate-400 text-sm">
              {isLogin 
                ? 'Enter your credentials to access the terminal.' 
                : 'Join thousands of algorithmic traders today.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
                    placeholder="Enter your name"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 relative overflow-hidden bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all duration-300 transform active:scale-[0.99] group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <div className="flex items-center justify-center gap-2">
                {isLoading ? (
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                   <>
                     <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                     <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                   </>
                )}
              </div>
            </button>
          </form>

          <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <p className="text-sm text-slate-500">
              {isLogin ? "New to ForexBotPro?" : "Already have an account?"}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 text-blue-400 hover:text-blue-300 font-medium transition-colors outline-none"
              >
                {isLogin ? 'Get started' : 'Sign in'}
              </button>
            </p>
          </div>
          
          <div className="absolute bottom-8 left-0 w-full text-center">
            <p className="text-[10px] text-slate-700 font-mono">
              SECURE ENCRYPTED CONNECTION
            </p>
          </div>
        </div>

        {/* Right Section: Visuals */}
        <div className="hidden lg:flex flex-1 items-center justify-center relative p-12">
           <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#020617] to-[#020617]" />
           
           <div className="relative max-w-lg w-full grid gap-6">
              {/* Feature Cards */}
              <div className="bg-[#0f172a]/50 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-right duration-700 delay-100 transform hover:-translate-y-1 transition-transform">
                 <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4 text-blue-400">
                    <Zap size={24} />
                 </div>
                 <h3 className="text-lg font-bold text-white mb-2">Automated Execution</h3>
                 <p className="text-slate-400 text-sm leading-relaxed">
                   Set your strategy parameters and let our algorithmic engine handle trade execution with millisecond precision.
                 </p>
              </div>

              <div className="bg-[#0f172a]/50 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-right duration-700 delay-300 transform hover:-translate-y-1 transition-transform translate-x-8">
                 <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4 text-purple-400">
                    <TrendingUp size={24} />
                 </div>
                 <h3 className="text-lg font-bold text-white mb-2">Smart Analysis</h3>
                 <p className="text-slate-400 text-sm leading-relaxed">
                   Real-time technical indicators (RSI, MA Crossover) combined with AI-powered market sentiment analysis.
                 </p>
              </div>

              <div className="bg-[#0f172a]/50 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-right duration-700 delay-500 transform hover:-translate-y-1 transition-transform">
                 <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4 text-emerald-400">
                    <Shield size={24} />
                 </div>
                 <h3 className="text-lg font-bold text-white mb-2">Risk Protection</h3>
                 <p className="text-slate-400 text-sm leading-relaxed">
                   Built-in risk management tools including auto-calculated stop losses and drawdown protection limits.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
