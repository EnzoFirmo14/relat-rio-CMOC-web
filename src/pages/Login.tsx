import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, toggleTheme } from '../store';
import type { RootState } from '../store';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { motion } from 'framer-motion';
import { Lock, User, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { loginWithEmail } from '../services/authService';

const loginSchema = zod.object({
  username: zod.string().min(3, { message: 'O usuário deve ter pelo menos 3 caracteres' }),
  password: zod.string().min(4, { message: 'A senha deve ter pelo menos 4 caracteres' }),
  remember: zod.boolean().optional()
});

type LoginFields = zod.infer<typeof loginSchema>;

export default function Login() {
  const dispatch = useDispatch();
  const themeMode = useSelector((state: RootState) => state.theme.mode);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFields) => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Firebase Auth requires email. If user provides username, append domain.
      const emailToUse = data.username.includes('@') ? data.username : `${data.username}@cmoc.com`;
      await loginWithEmail(emailToUse, data.password);
      // We don't need to dispatch login here because App.tsx has an onAuthStateChanged listener
      // that will dispatch setFirebaseUser and redirect the user automatically.
    } catch (e: any) {
      console.error(e);
      // Check for specific Firebase auth errors if desired, or show generic message
      if (e.code === 'auth/invalid-credential' || e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password') {
        setErrorMsg('Usuário ou senha incorretos.');
      } else {
        // Fallback for default admin access if they haven't set up users in Firebase Auth yet
        if (data.username.toLowerCase().trim() === 'pedro.santos' && data.password === '1234') {
          dispatch(login({ 
            username: 'pedro.santos',
            name: 'Eng. Pedro Santos',
            role: 'Supervisor de Mina'
          }));
        } else {
          setErrorMsg('Erro de conexão ou credenciais inválidas.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background text-text-primary transition-colors duration-300">
      {/* Lado Esquerdo - Mensagem Institucional e Fundo */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative bg-cover bg-center items-center justify-center"
        style={{ 
          backgroundImage: `linear-gradient(to right, rgba(35, 0, 91, 0.70), rgba(92, 63, 163, 0.45)), url('/image.png')` 
        }}
      >
        <div className="absolute inset-0 bg-radial-at-t from-primary/30 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-md p-12 text-white relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 flex items-center gap-4"
          >
            <img src="/logo.svg" alt="CMOC Logo" className="h-10 object-contain brightness-0 invert" />
            <span className="bg-success px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-background">
              CMOC Group
            </span>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl font-extrabold tracking-tight leading-tight mb-4 font-outfit"
            style={{ color: '#FFFFFF' }}
          >
            Acompanhamento em Tempo Real das Operações de Infraestrutura Subterrânea
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-white/80 leading-relaxed text-lg"
          >
            Acesse o centro de controle integrado para visualizar relatórios, ordens de serviço, colaboradores ativos e status dos equipamentos subterrâneos em tempo real.
          </motion.p>
        </div>
        <div className="absolute bottom-6 left-12 text-xs text-white/50">
          © 2026 CMOC Brasil. Todos os direitos reservados.
        </div>
      </div>

      {/* Lado Direito - Form de Login */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 relative">
        
        {/* Controles do Topo (Tema) */}
        <div className="absolute top-6 right-6 flex justify-end">
          <button 
            type="button"
            onClick={() => dispatch(toggleTheme())}
            className="p-2.5 rounded-xl bg-surface border border-border text-text-secondary hover:text-primary hover:bg-background shadow-sm transition-all duration-300"
            title={themeMode === 'light' ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}
          >
            {themeMode === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md glass p-8 sm:p-10 rounded-2xl shadow-xl border border-border mt-16"
        >
          {/* Brand Header */}
          <div className="flex flex-col items-center mb-8">
            <img 
              src={themeMode === 'light' ? '/logo.svg' : '/logowhite.png'} 
              alt="CMOC Logo" 
              className="h-14 mb-4 object-contain transition-opacity duration-300"
            />
            <h1 className="text-xl font-bold tracking-tight font-outfit text-center">
              Painel de Infraestrutura Subterrânea
            </h1>
            <p className="text-sm text-text-secondary mt-1 text-center">
              Controle de Relatórios e Supervisão
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-950/20 text-red-500 rounded-xl border border-red-500/20 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Campo Usuário */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-primary dark:text-text-secondary">
                Usuário
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-primary/40 dark:text-white/40">
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  {...register('username')}
                  placeholder="ex: pedro.santos"
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all dark:text-white dark:placeholder-text-placeholder"
                />
              </div>
              {errors.username && (
                <p className="text-xs text-red-500 font-medium">{errors.username.message}</p>
              )}
            </div>

            {/* Campo Senha */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-primary dark:text-text-secondary">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-primary/40 dark:text-white/40">
                  <Lock size={18} />
                </div>
                <input 
                  type="password" 
                  {...register('password')}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all dark:text-white dark:placeholder-text-placeholder"
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Lembrar e Esqueci Senha */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  {...register('remember')}
                  className="rounded border-border text-primary focus:ring-primary focus:ring-offset-0 bg-background"
                />
                <span className="text-text-secondary text-xs">Lembrar acesso</span>
              </label>
              <a 
                href="#forgot" 
                onClick={(e) => { e.preventDefault(); alert('Contate o Administrador de TI da CMOC para redefinir sua senha.'); }}
                className="text-xs font-semibold text-primary hover:text-primary-hover hover:underline transition-colors"
              >
                Esqueci minha senha
              </a>
            </div>

            {/* Botão Entrar */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-lg shadow-primary/10 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 mt-2 cursor-pointer"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Link voltar para cadastro */}
          <div className="mt-5 text-center text-xs">
            <span className="text-text-secondary">Não tem uma conta? </span>
            <Link 
              to="/register"
              className="font-bold text-primary hover:text-primary-hover hover:underline transition-colors"
            >
              Cadastre-se
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
