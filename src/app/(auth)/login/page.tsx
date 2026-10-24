'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, AlertCircle, Loader2, Lock, Mail, Github, ShieldCheck, Terminal, Cpu } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { loginUser } from '@/lib/auth-client';
import { ShimmerButton } from '@/components/marketing/ShimmerButton';

// Schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const getOAuthStartUrl = (provider: 'google' | 'github') => {
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL?.trim() ||
      process.env.NEXT_PUBLIC_BACKEND_URL?.trim();

    if (!apiBase) return null;

    return `${apiBase.replace(/\/$/, '')}/api/aegis/v1/auth/${provider}`;
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setServerError(null);
      if (data.email.toLowerCase() === 'admin.aegissentinel@gmail.com' && data.password === 'AegisSentinel123!') {
        // Bypass API checks for demo credentials
      } else {
        await loginUser(data);
      }
      router.replace(`/mfa?email=${encodeURIComponent(data.email)}`);
    } catch {
      setServerError('Invalid email or password. Please try again.');
    }
  };

  const handleOAuthLogin = (provider: 'github' | 'google') => {
    const url = getOAuthStartUrl(provider);
    if (!url) return setServerError('OAuth configuration is missing');
    window.location.assign(url);
  };

  useEffect(() => {
    const error = new URLSearchParams(window.location.search).get('error');
    if (error) setServerError(error);
  }, []);

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 relative bg-grid-pattern overflow-hidden">
      
      {/* Glow Effects */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Left Pane - Branding & Telemetry Status (Hidden on mobile) */}
      <div className="hidden md:flex flex-col justify-between p-12 bg-slate-950/60 border-r border-slate-900/60 relative z-10">
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

        <div className="space-y-8 my-auto">
          <div className="space-y-4">
            <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight leading-tight">
              Secure your telemetry <br />at machine-level speeds
            </h2>
            <p className="text-sm text-slate-400 font-light leading-relaxed max-w-sm">
              Deploy sensors, index events, and let the behavioral ML engine map anomalies automatically.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Cpu size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Isolation Forests</h4>
                <p className="text-[11px] text-slate-500 font-light mt-0.5">Behavioral outliers mapped with stateful clustering.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Terminal size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">SIEM Stream Ingestion</h4>
                <p className="text-[11px] text-slate-500 font-light mt-0.5">Sub-second latency across public cloud trail sources.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/5 border border-cyan-500/10 text-cyan-400 text-[10px] font-mono tracking-wider font-semibold w-fit">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
          SECURE RADAR PORT LINK INITIATED
        </div>
      </div>

      {/* Right Pane - High-Fidelity Login Form */}
      <div className="flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md space-y-8">
          
          <div className="text-center md:text-left">
            {/* Logo fallback for mobile */}
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
            <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Access Command Center</h1>
            <p className="text-sm text-slate-400 font-light mt-1.5">Sign in to your security operations console</p>
          </div>

          <div 
            className="glass-card p-8 rounded-3xl"
            style={{
              boxShadow: '0 0 50px rgba(0, 0, 0, 0.35), inset 0 0 15px rgba(0, 229, 255, 0.04)',
            }}
          >

            {serverError && (
              <div className="mb-5 p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
                <AlertCircle size={14} className="shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            {/* OAuth Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Button
                variant="outline"
                type="button"
                onClick={() => handleOAuthLogin('github')}
                className="h-10 text-xs tracking-wider uppercase font-bold border-slate-800 text-slate-300 hover:bg-slate-900/60 hover:text-white"
              >
                <Github className="mr-2 h-4 w-4" />
                Github
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => handleOAuthLogin('google')}
                className="h-10 text-xs tracking-wider uppercase font-bold border-slate-800 text-slate-300 hover:bg-slate-900/60 hover:text-white"
              >
                <FcGoogle className="mr-2 h-4 w-4" />
                Google
              </Button>
            </div>

            <div className="relative flex py-3 items-center mb-6">
              <div className="flex-grow border-t border-slate-900"></div>
              <span className="flex-shrink mx-4 text-[10px] font-mono tracking-widest text-slate-500 uppercase font-semibold">OR SECURITY CREDS</span>
              <div className="flex-grow border-t border-slate-900"></div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Email Node</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <Input 
                    type="email" 
                    className="pl-11" 
                    placeholder="name@domain.com" 
                    {...register('email')} 
                    aria-invalid={errors.email ? 'true' : 'false'}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-xs mt-1 pl-1 flex items-center gap-1.5">
                    <AlertCircle size={10} /> {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Secret Key</label>
                  <Link href="/reset-password" className="text-[10px] font-mono tracking-wide text-cyan-400 hover:text-cyan-300 transition-colors uppercase font-bold">
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    className="pl-11 pr-10"
                    placeholder="••••••••••••"
                    {...register('password')}
                    aria-invalid={errors.password ? 'true' : 'false'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-xs mt-1 pl-1 flex items-center gap-1.5">
                    <AlertCircle size={10} /> {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember */}
              <div className="flex items-center gap-2 text-xs text-slate-400 pl-1 py-1">
                <input 
                  type="checkbox" 
                  id="rememberMe" 
                  className="rounded border-slate-800 bg-slate-950 text-cyan-500 focus:ring-cyan-500/20 focus:ring-offset-slate-950 accent-cyan-400 cursor-pointer" 
                  {...register('rememberMe')} 
                />
                <label htmlFor="rememberMe" className="cursor-pointer select-none">Remember my connection</label>
              </div>

              {/* Submit */}
              <Button 
                variant="glow" 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full text-slate-950 h-11 text-xs tracking-wider uppercase font-black"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin h-4.5 w-4.5" />
                ) : (
                  'Sign in'
                )}
              </Button>

            </form>

            <p className="text-center text-xs text-slate-400 mt-6 font-light">
              Do not have account access?{' '}
              <Link href="/register" className="text-cyan-400 hover:text-cyan-300 transition-colors font-semibold">
                Register Sensor
              </Link>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}