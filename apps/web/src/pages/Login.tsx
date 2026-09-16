import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Cpu, Scale, FileText, UserCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('inspector@metrologyx.gov.in');
  const [password, setPassword] = useState('demo123');
  const { login, isLoading } = useAuth();
  const { addToast } = useUI();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      addToast('success', 'Authenticated successfully as Demo Inspector.');
      navigate('/dashboard');
    } catch (err: any) {
      addToast('error', err.message || 'Login failed.');
    }
  };

  const handleDemoAccess = async () => {
    await login('inspector@metrologyx.gov.in', 'demo123');
    addToast('success', 'Entered Demo Mode with pre-seeded Judge WOW Scenarios.');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-navy-sidebar flex flex-col lg:flex-row overflow-hidden select-none">
      {/* LEFT: Brand Hero */}
      <div className="flex-1 p-8 lg:p-16 flex flex-col justify-between relative bg-ambient-grid border-r border-navy-secondary/40">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-navy-secondary to-brand-blue flex items-center justify-center font-bold text-white text-lg shadow-lg">
              MX
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">
              METROLOGY<span className="text-brand-bright">X</span>
            </span>
          </div>

          <div className="max-w-xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-blue/10 border border-brand-blue/20 text-brand-bright text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.8} />
              <span>LEGAL METROLOGY INSPECTION PLATFORM</span>
            </div>

            <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Evidence-backed compliance,<br />
              built for modern inspection.
            </h1>

            <p className="text-slate-300 text-sm lg:text-base leading-relaxed">
              From package image to explainable inspection decision. Powered by computer vision perception, deterministic LMPC rules, and forensic SHA-256 evidence.
            </p>
          </div>
        </div>

        {/* 4 Pillars */}
        <div className="grid grid-cols-2 gap-4 my-12 max-w-xl">
          <div className="p-4 rounded-card bg-navy-secondary/30 border border-navy-secondary/60">
            <Cpu className="w-5 h-5 text-brand-bright mb-2" strokeWidth={1.8} />
            <h3 className="text-sm font-semibold text-white">AI PERCEPTION</h3>
            <p className="text-xs text-slate-400 mt-1">Computer vision OCR & bounding region detection</p>
          </div>
          <div className="p-4 rounded-card bg-navy-secondary/30 border border-navy-secondary/60">
            <Scale className="w-5 h-5 text-status-success mb-2" strokeWidth={1.8} />
            <h3 className="text-sm font-semibold text-white">DETERMINISTIC RULES</h3>
            <p className="text-xs text-slate-400 mt-1">Versioned LMPC statutory rule evaluation</p>
          </div>
          <div className="p-4 rounded-card bg-navy-secondary/30 border border-navy-secondary/60">
            <FileText className="w-5 h-5 text-status-info mb-2" strokeWidth={1.8} />
            <h3 className="text-sm font-semibold text-white">EVIDENCE</h3>
            <p className="text-xs text-slate-400 mt-1">Cryptographic SHA-256 integrity verification</p>
          </div>
          <div className="p-4 rounded-card bg-navy-secondary/30 border border-navy-secondary/60">
            <UserCheck className="w-5 h-5 text-status-warning mb-2" strokeWidth={1.8} />
            <h3 className="text-sm font-semibold text-white">HUMAN DECISION</h3>
            <p className="text-xs text-slate-400 mt-1">Authorized officer sign-off & physical review</p>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          METROLOGYX Engine v2026.1 • Legal Metrology Division
        </div>
      </div>

      {/* RIGHT: Login Card */}
      <div className="w-full lg:w-[480px] bg-background p-8 lg:p-12 flex flex-col justify-center">
        <div className="max-w-sm w-full mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-text-primary tracking-tight">Sign In</h2>
            <p className="text-xs text-text-muted mt-1">Access the Legal Metrology Inspection Command Center.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Inspector Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-input border border-border bg-surface text-sm text-text-primary outline-none focus:border-brand-blue transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-input border border-border bg-surface text-sm text-text-primary outline-none focus:border-brand-blue transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-btn bg-brand-bright hover:bg-brand-blue text-white font-semibold text-sm shadow-subtle transition-all duration-150 flex items-center justify-center gap-2"
            >
              {isLoading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" strokeWidth={1.8} />
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs text-text-muted"><span className="bg-background px-3">or</span></div>
          </div>

          <button
            onClick={handleDemoAccess}
            className="w-full py-2.5 rounded-btn border border-brand-bright/40 bg-brand-bright/5 hover:bg-brand-bright/10 text-brand-bright font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2"
          >
            Enter Demo Mode (Judge Direct Access)
          </button>

          <div className="p-3 rounded-lg bg-surface-subtle border border-border text-[11px] text-text-muted text-center leading-relaxed">
            PROTOTYPE ENVIRONMENT • Pre-configured with Judge Scenarios A, B, C, D
          </div>
        </div>
      </div>
    </div>
  );
};
