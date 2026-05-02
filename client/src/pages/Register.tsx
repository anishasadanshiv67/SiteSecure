import { useState } from 'react';
import { Shield, ArrowRight, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthInput } from '../components/AuthInput';
import API from '../utils/api';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getStrength = (pass: string) => {
    let strength = 0;
    if (pass.length > 7) strength += 25;
    if (/[A-Z]/.test(pass)) strength += 25;
    if (/[0-9]/.test(pass)) strength += 25;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 25;
    return Math.min(strength, 100);
  };

  const strength = getStrength(formData.password);
  
  const getStrengthColor = () => {
    if (strength === 0) return 'bg-slate-700';
    if (strength <= 25) return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]';
    if (strength <= 50) return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]';
    if (strength <= 75) return 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]';
    return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]';
  };

  const getStrengthText = () => {
    if (strength === 0) return '';
    if (strength <= 25) return 'Weak';
    if (strength <= 50) return 'Fair';
    if (strength <= 75) return 'Good';
    return 'Strong';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!formData.name || !formData.email || !formData.password || !formData.role) {
      setError('All fields are required');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await API.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-indigo-500/30 overflow-hidden relative flex items-center justify-center p-4">
      
      {/* Background Blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-[40rem] h-[40rem] rounded-full bg-indigo-600/10 blur-[120px] -z-10 pointer-events-none mix-blend-screen"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[35rem] h-[35rem] rounded-full bg-violet-600/10 blur-[120px] -z-10 pointer-events-none mix-blend-screen"></div>

      <div className="w-full max-w-lg my-8 relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-8 animate-fade-in-up">
          <Link to="/" className="flex items-center gap-2 group cursor-pointer">
            <div className="p-2 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 rounded-xl group-hover:scale-105 transition-transform duration-300 shadow-lg shadow-indigo-500/25">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white ml-1">
              SiteSecure<span className="text-indigo-500">.</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative group animate-fade-in-up [animation-delay:200ms]">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white mb-2 text-center">Create Account</h2>
            <p className="text-slate-400 text-sm mb-8 text-center">Join the Site Reliability and Safety Management System.</p>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm animate-shake">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <AuthInput 
                label="Full Name"
                type="text"
                name="name"
                autoComplete="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                required
              />

              <AuthInput 
                label="Email address"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="name@company.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
              
              <div className="space-y-2">
                <AuthInput 
                  label="Password"
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                
                {/* Strength Indicator */}
                <div className="flex items-center gap-2 px-1">
                  <div className="flex-1 flex gap-1 h-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`flex-1 rounded-full transition-all duration-500 ${strength >= i * 25 ? getStrengthColor() : 'bg-white/10'}`}></div>
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter w-10 text-right">{getStrengthText()}</span>
                </div>
              </div>

              <AuthInput 
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300 ml-1">
                  Assigned Role
                </label>
                <div className="relative">
                  <select 
                    name="role"
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300"
                    value={formData.role}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled className="bg-slate-900">Select your role</option>
                    <option value="flagger" className="bg-slate-900">Flagger</option>
                    <option value="ground_verifier" className="bg-slate-900">Ground Verifier</option>
                    <option value="online_verifier" className="bg-slate-900">Online Verifier</option>
                    <option value="resolver" className="bg-slate-900">Resolver</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 text-center text-sm text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-white hover:text-indigo-400 transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
