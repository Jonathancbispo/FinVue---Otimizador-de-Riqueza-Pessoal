
import React, { useState } from 'react';
import { User, Lock, Save, Loader2, CheckCircle2, AlertCircle, ShieldCheck, Mail } from 'lucide-react';
import { updateUserProfile, updateUserPassword } from '../services/supabaseClient';

interface ProfileSettingsProps {
  initialName: string;
  email: string;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ initialName, email }) => {
  const [displayName, setDisplayName] = useState(initialName);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const handleUpdateName = async () => {
    if (!displayName.trim()) return;
    setLoadingProfile(true);
    try {
      await updateUserProfile(displayName);
      setStatus({ type: 'success', msg: 'Nome atualizado com sucesso!' });
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      setStatus({ type: 'error', msg: 'Falha ao atualizar nome.' });
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (password !== confirmPassword) {
      setStatus({ type: 'error', msg: 'As senhas não coincidem.' });
      return;
    }
    if (password.length < 6) {
      setStatus({ type: 'error', msg: 'A senha deve ter pelo menos 6 caracteres.' });
      return;
    }
    setLoadingPass(true);
    try {
      await updateUserPassword(password);
      setStatus({ type: 'success', msg: 'Senha alterada com sucesso!' });
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      setStatus({ type: 'error', msg: 'Falha ao atualizar senha.' });
    } finally {
      setLoadingPass(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Dados da Conta */}
      <section className="bg-white dark:bg-darkCard p-8 rounded-[2.5rem] border border-slate-200 dark:border-darkBorder shadow-sm flex flex-col space-y-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
            <User size={20} />
          </div>
          <h3 className="text-lg font-bold">Dados da Conta</h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">E-mail de Acesso</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input disabled value={email} className="w-full bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-darkBorder rounded-2xl py-3 pl-12 pr-4 text-sm font-medium text-slate-500 cursor-not-allowed" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome de Exibição</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                value={displayName} 
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Seu nome"
                className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-darkBorder rounded-2xl py-3 pl-12 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
        </div>

        <button 
          onClick={handleUpdateName}
          disabled={loadingProfile || !displayName.trim() || displayName === initialName}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all disabled:opacity-50 shadow-lg shadow-indigo-100 dark:shadow-none active:scale-[0.98]"
        >
          {loadingProfile ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          <span>Salvar Nome</span>
        </button>
      </section>

      {/* Segurança */}
      <section className="bg-white dark:bg-darkCard p-8 rounded-[2.5rem] border border-slate-200 dark:border-darkBorder shadow-sm flex flex-col space-y-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 bg-rose-50 dark:bg-rose-900/30 rounded-xl text-rose-600 dark:text-rose-400">
            <ShieldCheck size={20} />
          </div>
          <h3 className="text-lg font-bold">Segurança</h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nova Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-darkBorder rounded-2xl py-3 pl-12 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirmar Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-darkBorder rounded-2xl py-3 pl-12 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
              />
            </div>
          </div>
        </div>

        <button 
          onClick={handleUpdatePassword}
          disabled={loadingPass || !password || password !== confirmPassword}
          className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3.5 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all disabled:opacity-50 shadow-lg shadow-rose-100 dark:shadow-none active:scale-[0.98]"
        >
          {loadingPass ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
          <span>Alterar Senha</span>
        </button>
      </section>

      {/* Alertas de Status flutuantes seriam melhores, mas vamos usar um bloco aqui por simplicidade e clareza */}
      {status && (
        <div className={`md:col-span-2 p-4 rounded-2xl flex items-center space-x-3 animate-in slide-in-from-top-4 ${status.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 text-rose-700 dark:text-rose-400'}`}>
          {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-xs font-bold">{status.msg}</span>
        </div>
      )}
    </div>
  );
};

export default ProfileSettings;
