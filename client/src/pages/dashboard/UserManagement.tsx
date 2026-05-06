import { useState, useEffect } from 'react';
import API from '../../utils/api';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Mail, 
  Trash2, 
  Search, 
  Filter, 
  MoreVertical,
  CheckCircle,
  XCircle,
  Loader2,
  X,
  ShieldCheck,
  Building,
  Key
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [message, setMessage] = useState({ text: '', type: '' });

  // New User Form
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'flagger',
    siteIds: [] as string[]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersResp, sitesResp] = await Promise.all([
        API.get('/users'),
        API.get('/sites')
      ]);
      setUsers(usersResp.data);
      setSites(sitesResp.data);
    } catch (err) {
      showToast('Failed to load system data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data: user } = await API.post('/users', {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        siteIds: newUser.siteIds
      });

      showToast(`User ${user.name} created successfully!`, 'success');
      setShowAddModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'flagger', siteIds: [] });
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create user', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (id === currentUser?.id) return showToast("You can't delete yourself!", 'error');
    if (!window.confirm(`Are you sure you want to delete ${name}? This action is irreversible.`)) return;
    
    try {
      await API.delete(`/users/${id}`);
      showToast('User removed from system', 'success');
      fetchData();
    } catch (err) {
      showToast('Failed to delete user', 'error');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-500/20 text-purple-400 border-purple-500/20';
      case 'site_admin': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/20';
      case 'resolver': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-4">
              <Users className="w-10 h-10 text-indigo-500" />
              User Management
            </h1>
            <p className="text-slate-400 mt-2">Control system access, promote admins, and manage site permissions.</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <UserPlus className="w-5 h-5" />
            Add New User
          </button>
        </div>

        {/* Filters & Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <select 
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-white appearance-none focus:outline-none focus:border-indigo-500/50"
            >
              <option value="all" className="bg-slate-900">All Roles</option>
              <option value="super_admin" className="bg-slate-900">Super Admin</option>
              <option value="site_admin" className="bg-slate-900">Site Admin</option>
              <option value="online_verifier" className="bg-slate-900">Online Verifier</option>
              <option value="ground_verifier" className="bg-slate-900">Ground Verifier</option>
              <option value="resolver" className="bg-slate-900">Resolver</option>
              <option value="flagger" className="bg-slate-900">Flagger</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">User Profile</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Access Role</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Linked Sites</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                        <span className="text-slate-500 text-xs font-black uppercase tracking-widest">Loading Personnel...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center text-slate-500 font-bold italic">
                      No users found matching your criteria.
                    </td>
                  </tr>
                ) : filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-indigo-400 font-black text-xl shadow-inner">
                          {u.name[0]}
                        </div>
                        <div>
                          <p className="text-white font-bold text-base">{u.name}</p>
                          <p className="text-slate-500 text-xs flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3 h-3" /> {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getRoleBadge(u.role)}`}>
                        {u.role.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-wrap gap-2">
                        {u.siteIds?.length > 0 ? (
                          u.siteIds.slice(0, 2).map((site: any) => (
                            <span key={site._id} className="text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                              {site.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-600 font-bold uppercase italic">Unassigned</span>
                        )}
                        {u.siteIds?.length > 2 && (
                          <span className="text-[10px] font-bold text-indigo-400">+{u.siteIds.length - 2} more</span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleDeleteUser(u._id, u.name)}
                          className="p-2.5 bg-white/5 rounded-xl text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                          title="Delete User"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                        <button className="p-2.5 bg-white/5 rounded-xl text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all opacity-0 group-hover:opacity-100">
                          <MoreVertical className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowAddModal(false)}></div>
          <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] w-full max-w-xl relative overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-8 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Onboard New Personnel</h2>
                <p className="text-slate-400 text-sm mt-1">Assign roles and initial site permissions.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-500 hover:text-white transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      required
                      type="text" 
                      placeholder="John Wick"
                      value={newUser.name}
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      required
                      type="email" 
                      placeholder="john@organization.com"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Temporary Password</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      required
                      type="password" 
                      placeholder="••••••••"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Level</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <select 
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white appearance-none focus:outline-none focus:border-indigo-500/50"
                    >
                      <option value="flagger" className="bg-slate-900">Flagger</option>
                      <option value="ground_verifier" className="bg-slate-900">Ground Verifier</option>
                      <option value="online_verifier" className="bg-slate-900">Online Verifier</option>
                      <option value="resolver" className="bg-slate-900">Resolver</option>
                      <option value="site_admin" className="bg-slate-900">Site Admin (Manager)</option>
                      <option value="super_admin" className="bg-slate-900">Super Admin (Director)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Assign to Sites</label>
                <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto p-2 bg-white/5 rounded-2xl border border-white/5">
                  {sites.map((site) => (
                    <label key={site._id} className="flex items-center gap-3 p-3 rounded-xl border border-white/5 cursor-pointer hover:bg-white/5 transition-all">
                      <input 
                        type="checkbox" 
                        checked={newUser.siteIds.includes(site._id)}
                        onChange={(e) => {
                          const ids = e.target.checked 
                            ? [...newUser.siteIds, site._id]
                            : newUser.siteIds.filter(id => id !== site._id);
                          setNewUser({...newUser, siteIds: ids});
                        }}
                        className="w-4 h-4 rounded border-white/10 bg-slate-800 text-indigo-600 focus:ring-indigo-500/50"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">{site.name}</span>
                        <span className="text-[9px] text-slate-500 uppercase">{site.location}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full py-4 bg-indigo-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Shield className="w-5 h-5" /> Activate Personnel</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {message.text && (
        <div className={`fixed bottom-8 right-8 z-[200] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border animate-fade-in-up ${
          message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span className="font-bold text-sm">{message.text}</span>
        </div>
      )}
    </DashboardLayout>
  );
};

export default UserManagement;
