
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Mail, 
  Lock, 
  ArrowRight, 
  Fingerprint, 
  AlertCircle,
  Settings,
  Eye,
  EyeOff,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface LoginProps {
  onLogin: (session: any) => void;
  isDarkMode: boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin, isDarkMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<{ message: string; isConfigError?: boolean; isAuthError?: boolean } | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Carregar e-mail salvo e preferência de 'Lembrar de mim'
  useEffect(() => {
    const savedEmail = localStorage.getItem('finvue_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Limpa erros ao alternar entre Login e Cadastro
  useEffect(() => {
    setError(null);
    setSuccessMsg(null);
  }, [isRegistering]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isRegistering) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (signUpError) throw signUpError;
        
        setSuccessMsg('Conta criada com sucesso! Verifique seu e-mail para confirmar o cadastro antes de acessar.');
        setIsRegistering(false);
        setPassword('');
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError) throw signInError;
        
        if (data.session) {
          // Lógica de Lembrar de mim
          if (rememberMe) {
            localStorage.setItem('finvue_remembered_email', email);
          } else {
            localStorage.removeItem('finvue_remembered_email');
          }
          onLogin(data.session);
        }
      }
    } catch (err: any) {
      let msg = err.message || 'Ocorreu um erro inesperado.';
      
      // Tradução amigável para erro de credenciais
      if (msg === 'Invalid login credentials') {
        msg = 'E-mail ou senha incorretos. Verifique seus dados ou crie uma conta se for seu primeiro acesso.';
      } else if (msg.includes('Email not confirmed')) {
        msg = 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada (ou spam).';
      } else if (msg.includes('User already registered')) {
        msg = 'Este e-mail já está cadastrado. Tente fazer login.';
      }

      setError({ 
        message: msg, 
        isAuthError: !msg.includes('não está habilitado') 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f8fafc] dark:bg-darkBg transition-colors duration-500">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-[450px] relative z-10">
        <div className="bg-white dark:bg-darkCard p-8 lg:p-12 rounded-[3rem] shadow-2xl shadow-indigo-500/5 border border-slate-200 dark:border-darkBorder transition-all">
          
          <div className="flex flex-col items-center mb-10">
            <div className="bg-indigo-600 p-3 rounded-2xl shadow-xl shadow-indigo-500/20 mb-4 transform hover:rotate-6 transition-transform">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              FinVue<span className="text-indigo-600">.</span>
            </h1>
            <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-2 text-center">
              Wealth Intelligence
            </p>
          </div>

          {/* Mensagens de Erro */}
          {error && (
            <div className={`mb-6 p-4 rounded-2xl flex items-start space-x-3 text-xs font-bold border transition-all animate-in fade-in slide-in-from-top-2 ${
              error.isConfigError 
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800 text-amber-700 dark:text-amber-400' 
                : 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800 text-rose-600 dark:text-rose-400'
            }`}>
              {error.isConfigError ? <Settings className="shrink-0 mt-0.5" size={16} /> : <AlertCircle className="shrink-0 mt-0.5" size={16} />}
              <div className="flex-1">
                <p className="leading-relaxed">{error.message}</p>
                {error.isConfigError && (
                  <p className="mt-1 font-medium opacity-80 uppercase text-[9px]">Ação necessária no painel Supabase</p>
                )}
              </div>
            </div>
          )}

          {/* Mensagens de Sucesso */}
          {successMsg && (
            <div className="mb-6 p-4 rounded-2xl flex items-start space-x-3 text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 animate-in zoom-in-95">
              <CheckCircle2 className="shrink-0 mt-0.5" size={16} />
              <p className="leading-relaxed">{successMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                  type="email" 
                  placeholder="E-mail"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-darkBorder rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-400 text-slate-900 dark:text-white transition-all font-medium"
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Senha"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-darkBorder rounded-2xl py-4 pl-12 pr-14 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-400 text-slate-900 dark:text-white transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors p-1"
                  title={showPassword ? "Ocultar senha" : "Revelar senha"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-2">
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                />
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">Lembrar de mim</span>
              </label>
              {!isRegistering && (
                <button type="button" className="text-xs font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-wider">Esqueceu a senha?</button>
              )}
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-xl shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-70"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{isRegistering ? 'Criar Minha Conta' : 'Acessar Dashboard'}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-xs text-slate-400 font-medium">
            {isRegistering ? 'Já possui acesso?' : 'Ainda não tem conta?'} {' '}
            <button 
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-indigo-600 font-black hover:underline"
            >
              {isRegistering ? 'Entrar agora' : 'Cadastre-se grátis'}
            </button>
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center space-x-6 opacity-60">
          <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <Fingerprint size={14} />
            <span>Biometria Ativa</span>
          </div>
          <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
          <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>Conexão SSL</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
