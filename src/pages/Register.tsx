import { useState } from'react';
import { db, serverTimestamp } from '../services/firebase';
import { useNavigate, Link } from'react-router-dom';
import { useForm } from'react-hook-form';
import { useDispatch, useSelector } from'react-redux';
import { toggleTheme } from'../store';
import type { RootState } from'../store';
import { zodResolver } from'@hookform/resolvers/zod';
import * as zod from'zod';
import { motion } from'framer-motion';
import { User, Lock, Briefcase, KeyRound, Sun, Moon, Mail, Eye, EyeOff } from'lucide-react';
import { registerWithEmail, logoutUser } from'../services/authService';

const registerSchema = zod.object({
 name: zod.string().min(1, 'Informe seu nome completo.'),
 role: zod.enum(['Supervisor', 'Líder da Elétrica Turno', 'Engenheiro', 'Coordenador', 'Gerente', 'Analista', 'Aprovisionado'], { errorMap: () => ({ message: 'Selecione um cargo.' }) }),
 registration: zod.string().min(1, 'Informe a matrícula.'),
 username: zod.string().email('Informe um e-mail válido.'),
 password: zod.string()
 .min(8, 'A senha deve atender aos requisitos mínimos.')
 .regex(/[a-z]/, 'A senha deve atender aos requisitos mínimos.')
 .regex(/[A-Z]/, 'A senha deve atender aos requisitos mínimos.')
 .regex(/[0-9]/, 'A senha deve atender aos requisitos mínimos.')
 .regex(/[^a-zA-Z0-9]/, 'A senha deve atender aos requisitos mínimos.'),
 confirmPassword: zod.string().min(1, 'As senhas não coincidem.')
}).refine((data) => data.password === data.confirmPassword, {
 message: 'As senhas não coincidem.',
 path: ['confirmPassword']
});

type RegisterFields = zod.infer<typeof registerSchema>;

export default function Register() {
 const navigate = useNavigate();
 const dispatch = useDispatch();
 const themeMode = useSelector((state: RootState) => state.theme.mode);
 const [loading, setLoading] = useState(false);
 const [errorMsg, setErrorMsg] = useState('');
 const [showPassword, setShowPassword] = useState(false);
 const [showConfirmPassword, setShowConfirmPassword] = useState(false);

 const { register, handleSubmit, formState: { errors, isValid } } = useForm<RegisterFields>({
 resolver: zodResolver(registerSchema),
 mode: 'all'
 });

 const onSubmit = async (data: RegisterFields) => {
 setLoading(true);
 setErrorMsg('');
 try {
    const emailToUse = data.username.includes('@') ? data.username : `${data.username}@cmoc.com`;
    const user = await registerWithEmail(emailToUse, data.password);
    
    // Save supervisor info to Firestore 'usuarios' collection matching the profile architecture
    const { setDoc, doc } = await import('firebase/firestore');
    await setDoc(doc(db, 'usuarios', user.uid), {
      uid: user.uid,
      email: user.email,
      name: data.name,
      role: data.role,
      registration: data.registration,
      username: data.username.toLowerCase().trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      avatarColor: '#' + Math.floor(Math.random()*16777215).toString(16) // Random default color
    });

    await logoutUser(); // Desloga automaticamente para forçar o login na tela seguinte

    alert('Usuário cadastrado com sucesso!');
    navigate('/login');
 } catch (e: any) {
 console.error('Failed to register user:', e);
 if (e.code ==='auth/email-already-in-use') {
 setErrorMsg('Este usuário já está cadastrado.');
 } else {
 setErrorMsg(`Erro ao cadastrar usuário: ${e.message}`);
 }
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="min-h-screen flex bg-background text-text-primary transition-colors duration-300">
 {/* Lado Esquerdo - Mensagem e Background */}
 <div 
 className="hidden lg:flex lg:w-1/2 relative bg-cover bg-center items-center justify-center"
 style={{ 
 backgroundImage: `linear-gradient(to right, rgba(35, 0, 91, 0.70), rgba(92, 63, 163, 0.45)), url('/sampinho.png')` 
 }}
 >
 <div className="absolute inset-0 bg-radial-at-t from-primary/30 via-transparent to-transparent pointer-events-none"/>
 <div className="max-w-md p-12 text-[var(--primary-foreground)] relative z-10">
 <motion.div 
 initial={{ opacity: 0, y: -20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.6 }}
 className="mb-8 flex items-center gap-4"
 >
 <img src="/logo.svg"alt="CMOC Logo"className="h-10 object-contain brightness-0 invert"/>
 <span className="bg-success px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-background">
 CMOC Group
 </span>
 </motion.div>
 
 <h2 
 className="text-4xl font-extrabold tracking-tight leading-tight mb-4 font-outfit"
 style={{ color:'#FFFFFF' }}
 >
 Cadastro de Novo Supervisor e Acesso ao Centro de Controle
 </h2>
 
 <p className="text-[var(--primary-foreground)] leading-relaxed text-lg">
 Crie sua credencial técnica para emissão de diários operacionais subterrâneos, agendamento de OSs e monitoramento de frota.
 </p>
 </div>
 </div>

 {/* Lado Direito - Form de Cadastro */}
 <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-y-auto max-h-screen">
 
 {/* Controles do Topo (Logo e Tema) */}
 <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
 <img 
 src="/logo.svg"
 alt="CMOC Logo"
 className="h-10 md:h-12 object-contain hidden md:block opacity-0"
 />
 
 <button 
 type="button"
 onClick={() => dispatch(toggleTheme())}
 className="p-2.5 rounded-xl bg-surface border border-border text-text-secondary hover:text-primary hover:bg-background shadow-sm transition-all duration-300 ml-auto"
 title={themeMode ==='light' ?'Ativar Modo Escuro' :'Ativar Modo Claro'}
 >
 {themeMode ==='light' ? <Moon size={18} /> : <Sun size={18} />}
 </button>
 </div>

 <motion.div 
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ duration: 0.4 }}
 className="w-full max-w-md glass p-8 sm:p-10 rounded-2xl shadow-xl border border-border mt-16 sm:mt-8"
 >
 {/* Header */}
 <div className="flex flex-col items-center mb-6">
 <img 
 src={themeMode ==='light' ?'/logo.svg' :'/logowhite.png'} 
 alt="CMOC Logo"
 className="h-12 mb-4 object-contain transition-opacity duration-300"
 />
 <h1 className="text-xl font-bold tracking-tight font-outfit text-center">
 Cadastrar Supervisor
 </h1>
 <p className="text-xs text-text-secondary mt-1 text-center">
 Centro de Controle Integrado CMOC
 </p>
 </div>

 {errorMsg && (
 <div className="mb-4 p-3 bg-error/10 text-error rounded-xl border border-error/20 text-xs font-semibold">
 {errorMsg}
 </div>
 )}

 <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
 {/* Nome Completo */}
 <div className="space-y-1">
 <label className="text-[10px] font-bold uppercase tracking-wider text-primary dark:text-text-secondary">
 Nome Completo
 </label>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary/40 ">
 <User size={16} />
 </div>
 <input 
 type="text"
 {...register('name')}
 placeholder="ex: João Silva"
 className={`w-full pl-9 pr-4 py-2 bg-background rounded-xl focus:outline-none focus:ring-2 transition-all dark:placeholder-text-placeholder text-sm ${errors.name ? 'border border-error focus:ring-error focus:border-error' : 'border border-border focus:ring-primary focus:border-transparent'}`}
 />
 </div>
 {errors.name && (
 <p className="text-[10px] text-error font-medium">{errors.name.message}</p>
 )}
 </div>

 {/* Cargo e Matrícula */}
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1">
 <label className="text-[10px] font-bold uppercase tracking-wider text-primary dark:text-text-secondary">
 Cargo
 </label>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary/40 ">
 <Briefcase size={16} />
 </div>
 <select 
 {...register('role')}
 className={`w-full pl-9 pr-4 py-2 bg-background rounded-xl focus:outline-none focus:ring-2 transition-all dark:placeholder-text-placeholder text-sm appearance-none ${errors.role ? 'border border-error focus:ring-error focus:border-error' : 'border border-border focus:ring-primary focus:border-transparent'}`}
 >
 <option value="" disabled hidden>Selecione um cargo</option>
 <option value="Supervisor">Supervisor</option>
 <option value="Líder da Elétrica Turno">Líder da Elétrica Turno</option>
 <option value="Engenheiro">Engenheiro</option>
 <option value="Coordenador">Coordenador</option>
 <option value="Gerente">Gerente</option>
 <option value="Analista">Analista</option>
 <option value="Aprovisionado">Aprovisionado</option>
 </select>
 </div>
 {errors.role && (
 <p className="text-[10px] text-error font-medium">{errors.role.message}</p>
 )}
 </div>

 <div className="space-y-1">
 <label className="text-[10px] font-bold uppercase tracking-wider text-primary dark:text-text-secondary">
 Matrícula
 </label>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary/40 ">
 <KeyRound size={16} />
 </div>
 <input 
 type="text"
 {...register('registration')}
 placeholder="Matrícula CMOC"
 className={`w-full pl-9 pr-4 py-2 bg-background rounded-xl focus:outline-none focus:ring-2 transition-all dark:placeholder-text-placeholder text-sm ${errors.registration ? 'border border-error focus:ring-error focus:border-error' : 'border border-border focus:ring-primary focus:border-transparent'}`}
 />
 </div>
 {errors.registration && (
 <p className="text-[10px] text-error font-medium">{errors.registration.message}</p>
 )}
 </div>
 </div>

 {/* Usuário */}
 <div className="space-y-1">
 <label className="text-[10px] font-bold uppercase tracking-wider text-primary dark:text-text-secondary">
 Usuário / Acesso
 </label>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary/40 ">
 <User size={16} />
 </div>
 <input 
 type="email"
 {...register('username')}
 placeholder="ex: usuario@dominio.com"
 className={`w-full pl-9 pr-4 py-2 bg-background rounded-xl focus:outline-none focus:ring-2 transition-all dark:placeholder-text-placeholder text-sm ${errors.username ? 'border border-error focus:ring-error focus:border-error' : 'border border-border focus:ring-primary focus:border-transparent'}`}
 />
 </div>
 {errors.username && (
 <p className="text-[10px] text-error font-medium">{errors.username.message}</p>
 )}
 </div>

 {/* Senhas */}
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1">
 <label className="text-[10px] font-bold uppercase tracking-wider text-primary dark:text-text-secondary">
 Senha
 </label>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary/40 ">
 <Lock size={16} />
 </div>
 <input 
 type={showPassword ? 'text' : 'password'}
 {...register('password')}
 placeholder="••••"
 className={`w-full pl-9 pr-10 py-2 bg-background rounded-xl focus:outline-none focus:ring-2 transition-all dark:placeholder-text-placeholder text-sm ${errors.password ? 'border border-error focus:ring-error focus:border-error' : 'border border-border focus:ring-primary focus:border-transparent'}`}
 />
 <button
 type="button"
 onClick={() => setShowPassword(!showPassword)}
 className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary hover:text-primary transition-colors focus:outline-none"
 >
 {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
 </button>
 </div>
 {errors.password && (
 <p className="text-[10px] text-error font-medium">{errors.password.message}</p>
 )}
 </div>

 <div className="space-y-1">
 <label className="text-[10px] font-bold uppercase tracking-wider text-primary dark:text-text-secondary">
 Confirmar
 </label>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary/40 ">
 <Lock size={16} />
 </div>
 <input 
 type={showConfirmPassword ? 'text' : 'password'}
 {...register('confirmPassword')}
 placeholder="••••"
 className={`w-full pl-9 pr-10 py-2 bg-background rounded-xl focus:outline-none focus:ring-2 transition-all dark:placeholder-text-placeholder text-sm ${errors.confirmPassword ? 'border border-error focus:ring-error focus:border-error' : 'border border-border focus:ring-primary focus:border-transparent'}`}
 />
 <button
 type="button"
 onClick={() => setShowConfirmPassword(!showConfirmPassword)}
 className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary hover:text-primary transition-colors focus:outline-none"
 >
 {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
 </button>
 </div>
 {errors.confirmPassword && (
 <p className="text-[10px] text-error font-medium">{errors.confirmPassword.message}</p>
 )}
 </div>
 </div>

 {/* Criar conta botão */}
 <button 
 type="submit"
 disabled={loading || !isValid}
 className="w-full py-2.5 bg-primary hover:bg-primary-hover text-[var(--primary-foreground)] font-bold rounded-xl shadow-lg hover:shadow-primary/10 transition-all duration-200 disabled:opacity-50 mt-2 text-sm cursor-pointer"
 >
 {loading ?'Cadastrando...' :'Criar Conta'}
 </button>
 </form>

 {/* Link voltar para login */}
 <div className="mt-5 text-center text-xs">
 <span className="text-text-secondary">Já tem uma conta? </span>
 <Link 
 to="/login"
 className="font-bold text-primary hover:text-primary-hover hover:underline transition-colors"
 >
 Fazer Login
 </Link>
 </div>
 </motion.div>
 </div>
 </div>
 );
}
