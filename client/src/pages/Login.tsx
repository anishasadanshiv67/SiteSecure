import { useState } from 'react';
import { Shield, ArrowRight, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthInput } from '../components/AuthInput';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post('/auth/login', formData);
      
      login(data.user, data.token, rememberMe);
      
      // Role-based redirection
      if (data.user.role === 'flagger') {
        navigate('/dashboard/flagger');
      } else if (data.user.role === 'online_verifier' || data.user.role === 'ground_verifier') {
        navigate('/dashboard/verification');
      } else if (data.user.role === 'resolver') {
        navigate('/dashboard/resolution');
      } else if (data.user.role === 'site_admin' || data.user.role === 'super_admin') {
        navigate('/dashboard/admin');
      } else if (data.user.role === 'compliance_officer') {
        navigate('/dashboard/compliance');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-indigo-500/30 overflow-hidden relative flex items-center justify-center p-4">
      
      {/* Background Blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-[40rem] h-[40rem] rounded-full bg-indigo-600/10 blur-[120px] -z-10 pointer-events-none mix-blend-screen"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[35rem] h-[35rem] rounded-full bg-violet-600/10 blur-[120px] -z-10 pointer-events-none mix-blend-screen"></div>

      <div className="w-full max-w-md relative z-10">
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
            <h2 className="text-2xl font-bold text-white mb-2 text-center">Welcome Back</h2>
            <p className="text-slate-400 text-sm mb-8 text-center">Securely access your safety dashboard.</p>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm animate-shake">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
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
              
              <div className="space-y-4">
                <AuthInput 
                  label="Password"
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer group/check">
                    <div className="relative flex items-center justify-center w-4 h-4">
                      <input 
                        type="checkbox" 
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="peer appearance-none w-4 h-4 border border-white/20 rounded bg-white/5 checked:bg-indigo-600 checked:border-indigo-600 transition-all" 
                      />
                      <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-sm text-slate-400 group-hover/check:text-slate-200 transition-colors">Remember me</span>
                  </label>
                </div>
              </div>


              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3.5 px-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-white hover:text-indigo-400 transition-colors">
                Register Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
