import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../LanguageSwitcher';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation(['common']);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="h-20 border-b border-white/10 bg-slate-900/50 backdrop-blur-md sticky top-0 z-30 px-8 flex items-center justify-between">
      <div className="flex-1"></div>

      <div className="flex items-center gap-6">
        <LanguageSwitcher />

        {/* User Profile */}
        <div className="flex items-center gap-4 pl-6 border-l border-white/10">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-white">{user.name || 'Site User'}</p>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
              {user.role ? t(`roles.${user.role}`) : t('unknown')}
            </span>
          </div>
          
          <div className="relative group">
            <button className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10 text-white overflow-hidden hover:border-blue-500/50 transition-all duration-300">
              <User className="w-5 h-5 text-slate-400" />
            </button>

            {/* Dropdown - Simple for now */}
            <div className="absolute right-0 mt-2 w-48 py-2 bg-slate-800 border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
