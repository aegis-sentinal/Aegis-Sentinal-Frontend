'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Loader2, 
  CheckCircle2, 
  ShieldCheck,
  Zap,
  ArrowRight,
  AlertCircle,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { setAuthTokens, enableDummyAuthBypass } from '@/lib/auth-tokens';

function MfaVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || 'you@company.com';

  // Phases: 'enter-mfa' | 'verifying' | 'verified'
  const [phase, setPhase] = useState<'enter-mfa' | 'verifying' | 'verified'>('enter-mfa');
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState<string | null>(null);

  // References to input nodes for auto-focus shifts
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Simulated validation check
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter all 6 digits from your authenticator app.');
      return;
    }

    // Support authenticator code
    if (code !== '001653') {
      setError('Invalid verification code.');
      return;
    }

    setPhase('verifying');
    const timer = setTimeout(() => {
      setAuthTokens({
        accessToken: 'dummy-access-token-signature-ok',
        refreshToken: 'dummy-refresh-token-signature-ok'
      });
      enableDummyAuthBypass();
      setPhase('verified');
    }, 2500);
    return () => clearTimeout(timer);
  };

  const handleInputChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return; // restrict to numeric keys only

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1); // take the last entered char
    setOtp(newOtp);

    // Auto focus next input
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (otp[index] === '' && index > 0) {
        // Shift focus back and clear previous field
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current field
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (pastedData.length === 6 && !isNaN(Number(pastedData))) {
      const digits = pastedData.split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleGoToDashboard = () => {
    router.replace('/overview');
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 relative bg-grid-pattern overflow-hidden">
      
      {/* Glow Effects */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Left Pane - Branding & Platform Details */}
      <div className="hidden md:flex flex-col justify-between p-12 bg-slate-950/60 border-r border-slate-900/60 relative z-10">
        
        {/* Styled Logo */}
        <div className="flex items-center gap-3.5">
          <Link href="/" className="flex items-center gap-3.5 group" aria-label="Go to home">
            <Image 
              src="/logo2.png" 
              alt="Aegis Sentinel Logo" 
              width={48} 
              height={48} 
              priority 
              className="h-12 w-12 object-contain rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-2 transition-transform duration-300 group-hover:scale-105 group-hover:border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]" 
            />
            <span className="text-base font-black tracking-[0.2em] uppercase text-slate-100 font-mono transition-colors group-hover:text-cyan-400 duration-300">
              AEGIS <span className="text-cyan-400">SENTINEL</span>
            </span>
          </Link>
        </div>

        {/* Brand Focus */}
        <div className="space-y-8 my-auto">
          <div className="space-y-4">
            <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight leading-tight">
              Access your security <br />operations console
            </h2>
            <p className="text-sm text-slate-400 font-light leading-relaxed max-w-sm">
              Deploy sensors, index events, and let the behavioral ML engine map anomalies automatically.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                <Smartphone size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Multi-Factor Access</h4>
                <p className="text-[11px] text-slate-500 font-light mt-0.5">Secure 6-digit OTP ensures only verified users gain console entry.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Identity Check</h4>
                <p className="text-[11px] text-slate-500 font-light mt-0.5">Automated validation matches user keys before workspace enrollment.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/5 border border-cyan-500/10 text-cyan-400 text-[10px] font-mono tracking-wider font-semibold w-fit">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
          SECURE CHANNEL AUTHENTICATED
        </div>
      </div>

      {/* Right Pane - Verification Flow */}
      <div className="flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md space-y-8 my-8">
          
          {/* Mobile Logo & Header */}
          <div className="text-center md:text-left">
            <div className="md:hidden flex justify-center mb-8">
              <Link href="/" className="flex items-center gap-3 group" aria-label="Go to home">
                <Image 
                  src="/logo2.png" 
                  alt="Aegis Sentinel Logo" 
                  width={44} 
                  height={44} 
                  priority 
                  className="h-11 w-11 object-contain rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-1.5 transition-transform duration-300 group-hover:scale-105 group-hover:border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]" 
                />
                <span className="text-sm font-black tracking-[0.18em] uppercase text-slate-100 font-mono transition-colors group-hover:text-cyan-400 duration-300">
                  AEGIS <span className="text-cyan-400">SENTINEL</span>
                </span>
              </Link>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Two-Factor Verification</h1>
            <p className="text-sm text-slate-400 font-light mt-1.5">
              {phase === 'enter-mfa' && `Enter the code generated by your authenticator app for ${email}`}
              {phase === 'verifying' && 'Verifying MFA credentials...'}
              {phase === 'verified' && 'Identity validated successfully'}
            </p>
          </div>

          {/* Core Panel Card */}
          <div 
            className="glass-card p-8 rounded-3xl"
            style={{
              boxShadow: '0 0 50px rgba(0, 0, 0, 0.35), inset 0 0 15px rgba(0, 229, 255, 0.04)',
            }}
          >
            {error && (
              <div className="mb-5 p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* PHASE 1: Enter MFA Form */}
            {phase === 'enter-mfa' && (
              <form onSubmit={handleVerifyCode} className="space-y-6 animate-in fade-in duration-300">
                
                {/* Visual OTP Grid Inputs */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 block text-center">
                    6-Digit Authenticator Code
                  </label>
                  <div className="flex justify-between gap-2 max-w-sm mx-auto">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        type="text"
                        maxLength={1}
                        ref={(el) => { inputRefs.current[idx] = el; }}
                        value={digit}
                        onChange={(e) => handleInputChange(e.target.value, idx)}
                        onKeyDown={(e) => handleKeyDown(e, idx)}
                        onPaste={idx === 0 ? handlePaste : undefined}
                        className="w-12 h-14 bg-slate-950 border border-slate-800 text-cyan-400 rounded-xl text-center text-xl font-bold font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all shadow-[0_0_15px_rgba(0,0,0,0.4)]"
                      />
                    ))}
                  </div>
                </div>


                <Button 
                  type="submit" 
                  className="w-full h-11 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                >
                  Verify MFA Code <Zap size={14} />
                </Button>

                {/* Return to Login */}
                <div className="text-center pt-2">
                  <Link
                    href="/login"
                    className="text-xs text-slate-500 hover:text-cyan-400 transition-colors font-bold uppercase tracking-wide"
                  >
                    Back to Sign In
                  </Link>
                </div>
              </form>
            )}

            {/* PHASE 2: Verifying Loading State */}
            {phase === 'verifying' && (
              <div className="space-y-6 text-center py-6 animate-in fade-in duration-300">
                <Loader2 className="h-12 w-12 text-cyan-400 animate-spin mx-auto" />
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-slate-100 tracking-wide font-mono">VALIDATING MFA SECURITY HANDSHAKE</h3>
                  <p className="text-xs text-slate-500 font-light leading-relaxed max-w-xs mx-auto">
                    Checking authenticator signatures, matching dynamic time tokens, and validating operations clearance...
                  </p>
                </div>
              </div>
            )}

            {/* PHASE 3: Verified Success Screen */}
            {phase === 'verified' && (
              <div className="space-y-6 text-center py-4 animate-in fade-in duration-300">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                  <CheckCircle2 size={32} className="animate-bounce" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-100">MFA Verified Successfully!</h3>
                  <p className="text-xs text-slate-400 font-light leading-relaxed">
                    Identity confirmed. Redirecting to the secure Aegis Sentinel cloud operations console...
                  </p>
                </div>

                <Button 
                  onClick={handleGoToDashboard}
                  className="w-full h-11 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                >
                  Enter Dashboard <ArrowRight size={14} />
                </Button>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}

export default function MfaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-cyan-400 animate-spin" />
      </div>
    }>
      <MfaVerifyContent />
    </Suspense>
  );
}
