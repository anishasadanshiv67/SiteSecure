import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Activity, 
  Map, 
  Lock, 
  ClipboardList, 
  CheckCircle, 
  Wrench, 
  ArrowRight, 
  Menu, 
  X,
  Eye,
  FileText,
  Settings,
  Users
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './components/LanguageSwitcher';

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation(['landing', 'common']);

  useEffect(() => {
    document.title = "Site Reliability and Safety Management System";
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'flagger': return '/dashboard/flagger';
      case 'online_verifier':
      case 'ground_verifier': return '/dashboard/verification';
      case 'resolver': return '/dashboard/resolution';
      case 'site_admin': return '/dashboard/admin';
      case 'super_admin': return '/dashboard/superadmin';
      case 'compliance_officer': return '/dashboard/compliance';
      default: return '/login';
    }
  };

  const handleGetStarted = () => {
    if (user) {
      navigate(getDashboardLink());
    } else {
      navigate('/login');
    }
  };

  const features = [
    {
      icon: <Users className="h-6 w-6 text-indigo-400" />,
      title: t('features.roleWorkflow.title'),
      description: t('features.roleWorkflow.desc')
    },
    {
      icon: <Activity className="h-6 w-6 text-indigo-400" />,
      title: t('features.realtime.title'),
      description: t('features.realtime.desc')
    },
    {
      icon: <Map className="h-6 w-6 text-indigo-400" />,
      title: t('features.mapReporting.title'),
      description: t('features.mapReporting.desc')
    },
    {
      icon: <FileText className="h-6 w-6 text-indigo-400" />,
      title: t('features.auditLogs.title'),
      description: t('features.auditLogs.desc')
    },
    {
      icon: <Settings className="h-6 w-6 text-indigo-400" />,
      title: t('features.controlPanel.title'),
      description: t('features.controlPanel.desc')
    }
  ];

  const workflowSteps = [
    { 
      icon: <ClipboardList className="h-6 w-6 text-white" />, 
      title: t('howItWorks.steps.report.title'), 
      role: t('howItWorks.steps.report.role'),
      desc: t('howItWorks.steps.report.desc') 
    },
    { 
      icon: <Eye className="h-6 w-6 text-white" />, 
      title: t('howItWorks.steps.verify.title'), 
      role: t('howItWorks.steps.verify.role'),
      desc: t('howItWorks.steps.verify.desc') 
    },
    { 
      icon: <Wrench className="h-6 w-6 text-white" />, 
      title: t('howItWorks.steps.resolve.title'), 
      role: t('howItWorks.steps.resolve.role'),
      desc: t('howItWorks.steps.resolve.desc') 
    },
    { 
      icon: <CheckCircle className="h-6 w-6 text-white" />, 
      title: t('howItWorks.steps.close.title'), 
      role: t('howItWorks.steps.close.role'),
      desc: t('howItWorks.steps.close.desc') 
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 selection:bg-indigo-500/30 selection:text-white overflow-x-hidden relative">
      
      {/* Dark Grid Background */}
      <div className="fixed inset-0 pointer-events-none -z-50 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px]"></div>
      <div className="fixed inset-0 pointer-events-none -z-50 bg-[radial-gradient(circle_800px_at_50%_-100px,#1e1b4b,transparent)]"></div>

      {/* 1. Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-slate-950/80 backdrop-blur-xl border-b border-white/5 py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center gap-2 group">
              <div className="p-2 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl group-hover:scale-105 transition-transform duration-300 shadow-lg shadow-indigo-500/20">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white ml-1">
                SiteSecure<span className="text-indigo-500">.</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">{t('nav.features')}</a>
              <a href="#how-it-works" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">{t('nav.howItWorks')}</a>
              
              <div className="flex items-center space-x-4 ml-4">
                <LanguageSwitcher />
                {user ? (
                  <Link 
                    to={getDashboardLink()} 
                    className="text-sm font-semibold bg-white text-slate-950 px-5 py-2 rounded-lg hover:bg-slate-200 transition-all"
                  >
                    {t('nav.dashboard')}
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                      {t('nav.login')}
                    </Link>
                    <Link to="/register" className="text-sm font-semibold bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20">
                      {t('nav.getStarted')}
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-slate-950 border-b border-white/5 px-6 py-8 space-y-4 animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Language</span>
              <LanguageSwitcher />
            </div>
            <a href="#features" onClick={() => setIsMenuOpen(false)} className="block text-lg font-medium text-slate-400">{t('nav.features')}</a>
            <a href="#how-it-works" onClick={() => setIsMenuOpen(false)} className="block text-lg font-medium text-slate-400">{t('nav.howItWorks')}</a>
            <div className="h-px bg-white/5 my-4"></div>
            {user ? (
              <Link to={getDashboardLink()} onClick={() => setIsMenuOpen(false)} className="block w-full text-center py-3 bg-white text-slate-950 rounded-xl font-bold">{t('nav.dashboard')}</Link>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block w-full text-center py-3 text-slate-400 font-medium">{t('nav.login')}</Link>
                <Link to="/register" onClick={() => setIsMenuOpen(false)} className="block w-full text-center py-3 bg-indigo-600 text-white rounded-xl font-bold">{t('nav.getStarted')}</Link>
              </>
            )}
          </div>
        )}
      </nav>

      {/* 2. Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-indigo-600/10 blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-wider uppercase mb-8 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            {t('hero.badge')}
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-8 animate-fade-in-up [animation-delay:200ms]">
            {t('hero.title1')} <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400">
              {t('hero.title2')}
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto mb-12 animate-fade-in-up [animation-delay:400ms]">
            {t('hero.subtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up [animation-delay:600ms]">
            <button 
              onClick={handleGetStarted}
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 group"
            >
              {user ? t('hero.ctaDashboard') : t('hero.ctaPrimary')}
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
            {!user && (
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-4 bg-white/5 text-white border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-all backdrop-blur-sm flex items-center justify-center gap-2"
              >
                <Lock className="h-4 w-4" /> {t('hero.ctaLogin')}
              </Link>
            )}
            {user && (
              <Link 
                to={getDashboardLink()}
                className="w-full sm:w-auto px-8 py-4 bg-white/5 text-white border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-all backdrop-blur-sm"
              >
                {t('hero.ctaView')}
              </Link>
            )}
          </div>

          {/* Feature Badge Grid */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto opacity-50">
            {[t('hero.badges.iso'), t('hero.badges.realtime'), t('hero.badges.multiRole'), t('hero.badges.cloud')].map((badge) => (
              <div key={badge} className="px-4 py-2 border border-white/10 rounded-lg text-xs font-medium text-slate-500 tracking-widest uppercase">
                {badge}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Features Section */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">{t('features.heading')}</h2>
            <p className="text-slate-400">{t('features.subheading')}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. How It Works Section */}
      <section id="how-it-works" className="py-24 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">{t('howItWorks.heading')}</h2>
            <p className="text-slate-400">{t('howItWorks.subheading')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Desktop Connector Line */}
            <div className="hidden md:block absolute top-12 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            
            {workflowSteps.map((step, index) => (
              <div key={index} className="relative flex flex-col items-center text-center group">
                <div className="w-24 h-24 rounded-full bg-slate-950 border border-white/10 flex items-center justify-center mb-6 relative z-10 group-hover:border-indigo-500/50 transition-colors shadow-2xl">
                  <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {step.icon}
                  </div>
                </div>
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">{step.role}</div>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-slate-400 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative p-12 md:p-20 rounded-[3rem] bg-indigo-600 overflow-hidden text-center">
            {/* Decoration */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-black/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-5xl font-bold text-white mb-8">{t('cta.heading')}</h2>
              <p className="text-indigo-100 text-lg mb-10 max-w-2xl mx-auto">
                {t('cta.subheading')}
              </p>
              <Link 
                to="/register" 
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-all shadow-xl"
              >
                {t('cta.button')}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="border-t border-white/5 py-12 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-indigo-500" />
            <span className="font-bold text-lg text-white">SiteSecure</span>
          </div>
          
          <div className="text-slate-500 text-sm">
            © {new Date().getFullYear()} {t('footer.copyright')}
          </div>
          
          <div className="flex gap-6">
            <a href="#features" className="text-slate-400 hover:text-white text-sm transition-colors">{t('footer.links.features')}</a>
            <a href="#how-it-works" className="text-slate-400 hover:text-white text-sm transition-colors">{t('footer.links.workflow')}</a>
            <Link to="/login" className="text-slate-400 hover:text-white text-sm transition-colors">{t('footer.links.login')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
