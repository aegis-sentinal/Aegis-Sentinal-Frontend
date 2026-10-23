'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { z } from 'zod';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Loader2, 
  Lock, 
  Mail, 
  User, 
  CheckCircle2, 
  Github, 
  Building, 
  Briefcase, 
  Cloud,
  ChevronRight,
  ChevronLeft,
  Phone,
  Globe,
  Settings,
  ArrowRight
} from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { registerUser } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

// Password criteria
const passwordRules = z
  .string()
  .min(12, 'At least 12 characters')
  .max(128, 'Password cannot exceed 128 characters')
  .regex(/[A-Z]/, 'One uppercase letter')
  .regex(/[a-z]/, 'One lowercase letter')
  .regex(/[0-9]/, 'One number')
  .regex(/[^A-Za-z0-9]/, 'One special character')
  .regex(/^\S+$/, 'No spaces allowed');

// Registration schema collecting ALL details
const registerSchema = z
  .object({
    // Step 1: Account Info
    fullName: z
      .string()
      .trim()
      .min(3, 'Full name must be at least 3 characters')
      .max(80, 'Name is too long')
      .regex(/^[A-Za-z][A-Za-z\s'-]+$/, 'Enter a valid full name'),
    email: z
      .string()
      .trim()
      .email('Please enter a valid email address')
      .max(254, 'Email is too long')
      .transform((value) => value.toLowerCase()),
    password: passwordRules,
    confirmPassword: z.string(),
    phoneNumber: z.string().trim().optional(),

    // Step 2: Org Details
    orgType: z.string().min(1, 'Select organization type'),
    companyName: z.string().trim().optional(),
    orgSize: z.string().min(1, 'Select organization size'),
    industry: z.string().min(1, 'Select industry'),
    role: z.string().min(1, 'Select your role'),
    cloudProviders: z.array(z.string()).min(1, 'Select at least one cloud provider'),
    workspaceName: z.string().trim().min(2, 'Workspace name must be at least 2 characters'),
    workspaceSlug: z.string().trim().min(2, 'Workspace URL must be at least 2 characters')
      .regex(/^[a-z0-9-]+$/, 'URL slug can only contain lowercase alphanumeric characters and hyphens'),
    country: z.string().min(1, 'Select your country'),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the Terms of Service',
    }),
    acceptPrivacy: z.boolean().refine((val) => val === true, {
      message: 'You must accept the Privacy Policy',
    }),
    acceptAutomation: z.boolean().refine((val) => val === true, {
      message: 'You must acknowledge automated response actions',
    }),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      });
    }
    if (data.orgType !== 'individual' && (!data.companyName || data.companyName.trim().length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Company name is required for enterprise and startup options',
        path: ['companyName'],
      });
    }
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const passwordStrengthChecks = [
  { label: '12+ characters', regex: /.{12,}/ },
  { label: 'Uppercase letter', regex: /[A-Z]/ },
  { label: 'Lowercase letter', regex: /[a-z]/ },
  { label: 'Number', regex: /[0-9]/ },
  { label: 'Special character', regex: /[^A-Za-z0-9]/ },
];

function PasswordStrength({ password }: { password?: string }) {
  if (!password) return null;
  const passed = passwordStrengthChecks.filter((c) => c.regex.test(password)).length;
  const strength = passed <= 1 ? 'Weak' : passed <= 2 ? 'Fair' : passed <= 3 ? 'Good' : 'Strong';
  const color = passed <= 1 ? 'bg-red-500' : passed <= 2 ? 'bg-amber-500' : passed <= 3 ? 'bg-blue-400' : 'bg-emerald-500';
  
  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={cn('h-1 flex-1 rounded-full transition-colors duration-300', i < passed ? color : 'bg-slate-700')} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {passwordStrengthChecks.map((c) => (
          <span key={c.label} className={cn('flex items-center gap-1 text-[10px] transition-colors', c.regex.test(password) ? 'text-emerald-400' : 'text-slate-500')}>
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
            {c.label}
          </span>
        ))}
      </div>
      <p className={cn('text-[10px] font-medium', color.replace('bg-', 'text-').replace('-500', '-400').replace('-400', '-400'))}>
        Password strength: {strength}
      </p>
    </div>
  );
}

const cloudOptions = [
  { id: 'aws', name: 'AWS' },
  { id: 'azure', name: 'Azure' },
  { id: 'gcp', name: 'Google Cloud' },
  { id: 'oracle', name: 'Oracle Cloud' },
  { id: 'digitalocean', name: 'DigitalOcean' },
  { id: 'k8s', name: 'Kubernetes' },
  { id: 'on-prem', name: 'On-Premises' }
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [registeredName, setRegisteredName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const getOAuthStartUrl = (provider: 'google' | 'github'): string | null => {
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL?.trim() ||
      process.env.NEXT_PUBLIC_BACKEND_URL?.trim();

    if (!apiBase) return null;
    return `${apiBase.replace(/\/$/, '')}/api/aegis/v1/auth/${provider}`;
  };

  const {
    register,
    handleSubmit,
    control,
    trigger,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
      orgType: '',
      companyName: '',
      orgSize: '',
      industry: '',
      role: '',
      cloudProviders: [],
      workspaceName: '',
      workspaceSlug: '',
      country: '',
      acceptTerms: false,
      acceptPrivacy: false,
      acceptAutomation: false,
    },
  });

  const currentPassword = useWatch({ control, name: 'password' });
  const selectedClouds = useWatch({ control, name: 'cloudProviders' }) || [];
  const orgTypeWatch = useWatch({ control, name: 'orgType' });
  const companyNameWatch = useWatch({ control, name: 'companyName' });
  const fullNameWatch = useWatch({ control, name: 'fullName' });

  // Handle Workspace details generation
  useEffect(() => {
    const baseName = orgTypeWatch === 'individual' ? fullNameWatch : companyNameWatch;
    if (baseName && baseName.trim().length > 0) {
      const cleanName = baseName.trim();
      const slug = cleanName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 30);
      
      setValue('workspaceName', `${cleanName} SOC`);
      setValue('workspaceSlug', slug);
    }
  }, [companyNameWatch, fullNameWatch, orgTypeWatch, setValue]);

  const handleToggleCloud = (providerId: string) => {
    const nextList = selectedClouds.includes(providerId)
      ? selectedClouds.filter((p) => p !== providerId)
      : [...selectedClouds, providerId];
    setValue('cloudProviders', nextList, { shouldValidate: true });
  };

  const handleNextStep = async () => {
    setServerError(null);
    if (step === 1) {
      const isValid = await trigger(['fullName', 'email', 'password', 'confirmPassword', 'phoneNumber']);
      if (isValid) setStep(2);
    }
  };

  const handleBackStep = () => {
    setStep(1);
  };

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      // Simulate/call registration with ALL details
      await registerUser({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
      });
      setRegisteredEmail(data.email);
      setRegisteredName(data.fullName);
      console.log('DEMO BYPASS LINK:', `/verify-email?email=${encodeURIComponent(data.email)}&name=${encodeURIComponent(data.fullName)}`);
      setIsSubmitted(true);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Registration failed. An account with this email may already exist.');
    }
  };

  const handleOAuthSignup = (provider: 'github' | 'google') => {
    const oauthUrl = getOAuthStartUrl(provider);
    if (!oauthUrl) {
      setServerError('Missing NEXT_PUBLIC_API_URL or NEXT_PUBLIC_BACKEND_URL for OAuth.');
      return;
    }
    window.location.assign(oauthUrl);
  };

  const handleResendEmail = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 relative bg-grid-pattern overflow-hidden">
      
      {/* Glow Effects */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Left Pane - Branding & Platform Details */}
      <div className="hidden md:flex flex-col justify-between p-12 bg-slate-950/60 border-r border-slate-900/60 relative z-10">
        
        {/* Styled Logo (Bigger & Properly Positioned) */}
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
              Secure your telemetry <br />at machine-level speeds
            </h2>
            <p className="text-sm text-slate-400 font-light leading-relaxed max-w-sm">
              Deploy sensors, index events, and let the behavioral ML engine map anomalies automatically.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                <Building size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Enterprise Onboarding</h4>
                <p className="text-[11px] text-slate-500 font-light mt-0.5">Custom configurations designed for corporate infrastructures.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                <Settings size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Automated Workspace Setup</h4>
                <p className="text-[11px] text-slate-500 font-light mt-0.5">Your personal SOC command center URL is created instantly.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/5 border border-cyan-500/10 text-cyan-400 text-[10px] font-mono tracking-wider font-semibold w-fit">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
          SECURE ONBOARDING PORT LINK ACTIVE
        </div>
      </div>

      {/* Right Pane - Form Wizard */}
      <div className="flex items-center justify-center p-6 sm:p-12 relative z-10 max-h-screen overflow-y-auto">
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
            {!isSubmitted ? (
              <>
                <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Create your account</h1>
                <p className="text-sm text-slate-400 font-light mt-1.5">
                  {step === 1 ? 'Step 1 of 2: Account credentials' : 'Step 2 of 2: Organization details'}
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Check your email</h1>
                <p className="text-sm text-slate-400 font-light mt-1.5">Verification link dispatched to {registeredEmail}</p>
              </>
            )}
          </div>

          {/* Wizard Form Container */}
          <div 
            className="glass-card p-8 rounded-3xl"
            style={{
              boxShadow: '0 0 50px rgba(0, 0, 0, 0.35), inset 0 0 15px rgba(0, 229, 255, 0.04)',
            }}
          >
            {serverError && !isSubmitted && (
              <div className="mb-5 p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
                <AlertCircle size={14} className="shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            {!isSubmitted ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                
                {/* STEP 1: Account Setup */}
                {step === 1 && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    {/* OAuth Buttons */}
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => handleOAuthSignup('github')}
                        className="h-10 text-xs tracking-wider uppercase font-bold border-slate-800 text-slate-300 hover:bg-slate-900/60 hover:text-white"
                      >
                        <Github className="mr-2 h-4 w-4" /> Github
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => handleOAuthSignup('google')}
                        className="h-10 text-xs tracking-wider uppercase font-bold border-slate-800 text-slate-300 hover:bg-slate-900/60 hover:text-white"
                      >
                        <FcGoogle className="mr-2 h-4 w-4" /> Google
                      </Button>
                    </div>

                    <div className="relative flex py-2 items-center mb-2">
                      <div className="flex-grow border-t border-slate-900"></div>
                      <span className="flex-shrink mx-4 text-[10px] font-mono tracking-widest text-slate-500 uppercase font-semibold">Or Email Credentials</span>
                      <div className="flex-grow border-t border-slate-900"></div>
                    </div>

                    {/* Full Name */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Full Name *</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                        <Input 
                          type="text" 
                          className="pl-11 h-10 text-xs" 
                          placeholder="Full Name" 
                          {...register('fullName')} 
                          aria-invalid={errors.fullName ? 'true' : 'false'}
                        />
                      </div>
                      {errors.fullName && (
                        <p className="text-red-400 text-xs mt-1 pl-1 flex items-center gap-1.5">
                          <AlertCircle size={12} /> {errors.fullName.message}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Work Email *</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                        <Input 
                          type="email" 
                          className="pl-11 h-10 text-xs" 
                          placeholder="you@company.com" 
                          {...register('email')} 
                          aria-invalid={errors.email ? 'true' : 'false'}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-red-400 text-xs mt-1 pl-1 flex items-center gap-1.5">
                          <AlertCircle size={12} /> {errors.email.message}
                        </p>
                      )}
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Phone Number (Optional)</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                        <Input 
                          type="text" 
                          className="pl-11 h-10 text-xs" 
                          placeholder="+1 (555) 000-0000" 
                          {...register('phoneNumber')} 
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Create Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                        <Input 
                          type={showPassword ? 'text' : 'password'} 
                          className="pl-11 pr-10 h-10 text-xs" 
                          placeholder="••••••••••••" 
                          {...register('password')} 
                          aria-invalid={errors.password ? 'true' : 'false'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-red-400 text-xs mt-1 pl-1 flex items-center gap-1.5">
                          <AlertCircle size={12} /> {errors.password.message}
                        </p>
                      )}
                      <PasswordStrength password={currentPassword} />
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Confirm Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                        <Input 
                          type={showConfirmPassword ? 'text' : 'password'} 
                          className="pl-11 pr-10 h-10 text-xs" 
                          placeholder="••••••••••••" 
                          {...register('confirmPassword')} 
                          aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-red-400 text-xs mt-1 pl-1 flex items-center gap-1.5">
                          <AlertCircle size={12} /> {errors.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    <Button 
                      type="button" 
                      onClick={handleNextStep}
                      className="w-full h-11 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1.5 mt-6"
                    >
                      Organization Details <ChevronRight size={14} />
                    </Button>
                  </div>
                )}

                {/* STEP 2: Organization Info */}
                {step === 2 && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    
                    {/* Org Type Select */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Organization Type *</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
                        <select 
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pl-11 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-transparent transition-all appearance-none cursor-pointer h-10"
                          {...register('orgType')}
                        >
                          <option value="">Who are you signing up as?</option>
                          <option value="individual">👤 Individual</option>
                          <option value="company">🏢 Company / Enterprise</option>
                          <option value="education">🎓 Educational Institution</option>
                          <option value="msp">💼 Security Consultant / MSP</option>
                          <option value="research">🧪 Research / Lab</option>
                          <option value="startup">🚀 Startup</option>
                        </select>
                      </div>
                      {errors.orgType && (
                        <p className="text-red-400 text-xs mt-1 pl-1 flex items-center gap-1.5">
                          <AlertCircle size={12} /> {errors.orgType.message}
                        </p>
                      )}
                    </div>

                    {/* Company Name (Conditional) */}
                    {orgTypeWatch && orgTypeWatch !== 'individual' && (
                      <div className="space-y-1 animate-in fade-in duration-200">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Company / Org Name *</label>
                        <div className="relative">
                          <Building className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                          <Input 
                            type="text" 
                            className="pl-11 h-10 text-xs" 
                            placeholder="Acme Technologies Pvt. Ltd." 
                            {...register('companyName')} 
                            aria-invalid={errors.companyName ? 'true' : 'false'}
                          />
                        </div>
                        {errors.companyName && (
                          <p className="text-red-400 text-xs mt-1 pl-1 flex items-center gap-1.5">
                            <AlertCircle size={12} /> {errors.companyName.message}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Org Size & Industry Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Org Size *</label>
                        <select 
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-transparent transition-all appearance-none cursor-pointer h-10"
                          {...register('orgSize')}
                        >
                          <option value="">Select size</option>
                          <option value="1-10">1-10</option>
                          <option value="11-50">11-50</option>
                          <option value="51-200">51-200</option>
                          <option value="201-500">201-500</option>
                          <option value="501-1000">501-1000</option>
                          <option value="1000+">1000+</option>
                        </select>
                        {errors.orgSize && (
                          <p className="text-red-400 text-xs mt-1 pl-1 flex items-center gap-1.5">
                            <AlertCircle size={12} /> {errors.orgSize.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Industry *</label>
                        <select 
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-transparent transition-all appearance-none cursor-pointer h-10"
                          {...register('industry')}
                        >
                          <option value="">Select industry</option>
                          <option value="Technology">Technology</option>
                          <option value="Finance">Finance</option>
                          <option value="Healthcare">Healthcare</option>
                          <option value="Government">Government</option>
                          <option value="Education">Education</option>
                          <option value="Manufacturing">Manufacturing</option>
                          <option value="Retail">Retail</option>
                          <option value="Telecommunications">Telecommunications</option>
                          <option value="Energy">Energy</option>
                          <option value="Other">Other</option>
                        </select>
                        {errors.industry && (
                          <p className="text-red-400 text-xs mt-1 pl-1 flex items-center gap-1.5">
                            <AlertCircle size={12} /> {errors.industry.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Your Role Select */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Your Role *</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3.5 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
                        <select 
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pl-11 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-transparent transition-all appearance-none cursor-pointer h-10"
                          {...register('role')}
                        >
                          <option value="">Select your role</option>
                          <option value="Security Analyst">Security Analyst</option>
                          <option value="SOC Analyst">SOC Analyst</option>
                          <option value="Cloud Engineer">Cloud Engineer</option>
                          <option value="DevOps Engineer">DevOps Engineer</option>
                          <option value="DevSecOps Engineer">DevSecOps Engineer</option>
                          <option value="Security Engineer">Security Engineer</option>
                          <option value="Cloud Architect">Cloud Architect</option>
                          <option value="CISO">CISO</option>
                          <option value="IT Administrator">IT Administrator</option>
                          <option value="Student">Student</option>
                          <option value="Researcher">Researcher</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      {errors.role && (
                        <p className="text-red-400 text-xs mt-1 pl-1 flex items-center gap-1.5">
                          <AlertCircle size={12} /> {errors.role.message}
                        </p>
                      )}
                    </div>

                    {/* Cloud Providers Selection Grid */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Primary Clouds (Select Multiple) *</label>
                      <div className="grid grid-cols-2 gap-2">
                        {cloudOptions.map((provider) => {
                          const isSelected = selectedClouds.includes(provider.id);
                          return (
                            <button
                              type="button"
                              key={provider.id}
                              onClick={() => handleToggleCloud(provider.id)}
                              className={cn(
                                "px-3 py-2 rounded-xl border text-[11px] font-semibold text-center transition-all duration-200 cursor-pointer h-9 flex items-center justify-center gap-1",
                                isSelected 
                                  ? "bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.1)]" 
                                  : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                              )}
                            >
                              <Cloud size={10} className={cn("transition-colors", isSelected ? "text-cyan-400" : "text-slate-500")} />
                              {provider.name}
                            </button>
                          );
                        })}
                      </div>
                      {errors.cloudProviders && (
                        <p className="text-red-400 text-xs mt-1 pl-1 flex items-center gap-1.5">
                          <AlertCircle size={12} /> {errors.cloudProviders.message}
                        </p>
                      )}
                    </div>

                    {/* Workspace Setup Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 font-mono">Workspace Name *</label>
                        <Input 
                          type="text" 
                          className="h-10 text-xs" 
                          placeholder="Company SOC" 
                          {...register('workspaceName')} 
                          aria-invalid={errors.workspaceName ? 'true' : 'false'}
                        />
                        {errors.workspaceName && (
                          <p className="text-red-400 text-xs mt-1 pl-1 flex items-center gap-1.5">
                            <AlertCircle size={12} /> {errors.workspaceName.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 font-mono">Workspace URL *</label>
                        <div className="relative">
                          <Input 
                            type="text" 
                            className="h-10 text-xs pr-12" 
                            placeholder="company" 
                            {...register('workspaceSlug')} 
                            aria-invalid={errors.workspaceSlug ? 'true' : 'false'}
                          />
                          <span className="absolute right-3 top-3 text-[9px] font-bold text-slate-500 font-mono">.aegis</span>
                        </div>
                        {errors.workspaceSlug && (
                          <p className="text-red-400 text-xs mt-1 pl-1 flex items-center gap-1.5">
                            <AlertCircle size={12} /> {errors.workspaceSlug.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Country Select */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Country *</label>
                      <div className="relative">
                        <Globe className="absolute left-3.5 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
                        <select 
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pl-11 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-transparent transition-all appearance-none cursor-pointer h-10"
                          {...register('country')}
                        >
                          <option value="">Select country</option>
                          <option value="IN">India</option>
                          <option value="US">United States</option>
                          <option value="GB">United Kingdom</option>
                          <option value="CA">Canada</option>
                          <option value="DE">Germany</option>
                          <option value="FR">France</option>
                          <option value="AU">Australia</option>
                          <option value="JP">Japan</option>
                          <option value="SG">Singapore</option>
                          <option value="AE">United Arab Emirates</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                      {errors.country && (
                        <p className="text-red-400 text-xs mt-1 pl-1 flex items-center gap-1.5">
                          <AlertCircle size={12} /> {errors.country.message}
                        </p>
                      )}
                    </div>

                    {/* Policy Checks */}
                    <div className="space-y-3 pt-2 border-t border-slate-900">
                      <div className="flex items-start gap-2.5">
                        <input 
                          type="checkbox" 
                          id="acceptTerms" 
                          className="mt-0.5 rounded border-slate-850 text-cyan-500 focus:ring-cyan-500 bg-slate-950 cursor-pointer"
                          {...register('acceptTerms')}
                        />
                        <label htmlFor="acceptTerms" className="text-[11px] text-slate-400 font-light leading-relaxed cursor-pointer select-none">
                          I agree to the <Link href="/terms" target="_blank" className="text-cyan-400 hover:underline font-bold">Terms of Service</Link> *
                        </label>
                      </div>
                      {errors.acceptTerms && (
                        <p className="text-red-400 text-xs pl-1 flex items-center gap-1.5">
                          <AlertCircle size={12} /> {errors.acceptTerms.message}
                        </p>
                      )}

                      <div className="flex items-start gap-2.5">
                        <input 
                          type="checkbox" 
                          id="acceptPrivacy" 
                          className="mt-0.5 rounded border-slate-850 text-cyan-500 focus:ring-cyan-500 bg-slate-950 cursor-pointer"
                          {...register('acceptPrivacy')}
                        />
                        <label htmlFor="acceptPrivacy" className="text-[11px] text-slate-400 font-light leading-relaxed cursor-pointer select-none">
                          I agree to the <Link href="/privacy" target="_blank" className="text-cyan-400 hover:underline font-bold">Privacy Policy</Link> *
                        </label>
                      </div>
                      {errors.acceptPrivacy && (
                        <p className="text-red-400 text-xs pl-1 flex items-center gap-1.5">
                          <AlertCircle size={12} /> {errors.acceptPrivacy.message}
                        </p>
                      )}

                      <div className="flex items-start gap-2.5">
                        <input 
                          type="checkbox" 
                          id="acceptAutomation" 
                          className="mt-0.5 rounded border-slate-850 text-cyan-500 focus:ring-cyan-500 bg-slate-950 cursor-pointer"
                          {...register('acceptAutomation')}
                        />
                        <label htmlFor="acceptAutomation" className="text-[11px] text-slate-400 font-light leading-relaxed cursor-pointer select-none">
                          I understand this platform may automate cloud response actions. *
                        </label>
                      </div>
                      {errors.acceptAutomation && (
                        <p className="text-red-400 text-xs pl-1 flex items-center gap-1.5">
                          <AlertCircle size={12} /> {errors.acceptAutomation.message}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3 mt-6">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={handleBackStep}
                        className="flex-1 h-11 text-xs font-bold uppercase tracking-wider border-slate-800 text-slate-300 rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <ChevronLeft size={14} /> Back
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="flex-1 h-11 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Provisioning...
                          </>
                        ) : (
                          'Complete Onboarding Setup'
                        )}
                      </Button>
                    </div>
                  </div>
                )}

              </form>
            ) : (
              <div className="space-y-6 text-center animate-in fade-in duration-300 py-4">
                <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                  <Mail size={32} className="animate-pulse" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-100">Verification Link Sent</h3>
                  <p className="text-xs text-slate-400 font-light leading-relaxed">
                    We've dispatched a security validation link to <strong className="text-cyan-400">{registeredEmail}</strong>. 
                    Please verify your address to access your custom Aegis Sentinel operations workspace.
                  </p>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <Button 
                    onClick={handleResendEmail}
                    disabled={resendCooldown > 0}
                    variant="outline"
                    className="w-full h-10 text-xs font-bold uppercase tracking-wider border-slate-800 text-slate-350 rounded-xl cursor-pointer"
                  >
                    {resendCooldown > 0 ? `Resend Email in ${resendCooldown}s` : 'Resend Verification Email'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom redirection */}
          <div className="text-center">
            <p className="text-xs text-slate-500">
              Already have a command profile?{' '}
              <Link href="/login" className="text-cyan-400 font-bold hover:underline">
                Sign In
              </Link>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
