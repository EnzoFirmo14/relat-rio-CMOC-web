import React, { useEffect, useState } from'react';
import { useSelector, useDispatch } from'react-redux';
import type { RootState } from'../store';
import { toggleSidebar, toggleTheme, logout, toggleMockEnabled } from'../store';
import { useNavigate, useLocation, Link } from'react-router-dom';
import { 
 LayoutDashboard, 
 FileText,
 Settings, 
 Menu, 
 Sun, 
 Moon, 
 Bell, 
 LogOut, 
 ChevronLeft, 
 ChevronRight, 
 Wifi, 
 WifiOff,
 Database
} from'lucide-react';

interface SidebarItemProps {
 icon: React.ReactNode;
 label: string;
 path: string;
 collapsed: boolean;
 active: boolean;
}

function SidebarItem({ icon, label, path, collapsed, active }: SidebarItemProps) {
 return (
 <Link 
 to={path}
 className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
 active 
 ?'bg-primary text-[var(--primary-foreground)] shadow-md shadow-primary/20' 
 :'text-text-secondary hover:bg-background hover:text-primary'
 }`}
 >
 <div className={`transition-transform duration-300 group-hover:scale-110 ${active ?'text-[var(--primary-foreground)]' :'text-text-tertiary group-hover:text-primary'}`}>
 {icon}
 </div>
 {!collapsed && (
 <span className="font-semibold text-sm whitespace-nowrap transition-opacity duration-200">
 {label}
 </span>
 )}
 </Link>
 );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
 const dispatch = useDispatch();
 const navigate = useNavigate();
 const location = useLocation();
 const sidebarOpen = useSelector((state: RootState) => state.ui.sidebarOpen);
 const themeMode = useSelector((state: RootState) => state.theme.mode);
 const user = useSelector((state: RootState) => state.auth.user);
 const mockEnabled = useSelector((state: RootState) => state.ui.mockEnabled);
 
 const [time, setTime] = useState(new Date());
 const [isOnline, setIsOnline] = useState(navigator.onLine);
 const [notificationsOpen, setNotificationsOpen] = useState(false);

 useEffect(() => {
 const timer = setInterval(() => setTime(new Date()), 1000);
 
 const handleOnline = () => setIsOnline(true);
 const handleOffline = () => setIsOnline(false);
 
 window.addEventListener('online', handleOnline);
 window.addEventListener('offline', handleOffline);

 return () => {
 clearInterval(timer);
 window.removeEventListener('online', handleOnline);
 window.removeEventListener('offline', handleOffline);
 };
 }, []);

 const handleLogout = () => {
 dispatch(logout());
 navigate('/');
 };

 const menuItems = [
 { icon: <LayoutDashboard size={20} />, label:'Dashboard', path:'/dashboard' },
 { icon: <FileText size={20} />, label:'Relatórios', path:'/reports' },
 { icon: <Settings size={20} />, label:'Configurações', path:'/other/settings' },
 ];

 return (
 <div className="flex h-screen bg-background text-text-primary transition-colors duration-300 overflow-hidden">
 {/* Sidebar */}
 <aside 
 className={`bg-surface border-r border-border flex flex-col transition-all duration-300 z-30 ${
 sidebarOpen ?'w-64' :'w-20'
 }`}
 >
 {/* Brand Header */}
 <div className="h-16 flex items-center justify-between px-4 border-b border-border">
 <div className="flex items-center gap-3 overflow-hidden">
 <img 
 src={themeMode ==='light' ?'/logo.svg' :'/logowhite.png'} 
 alt="CMOC"
 className="h-8 w-8 object-contain shrink-0 transition-opacity duration-300"
 />
 {sidebarOpen && (
 <span className="font-extrabold text-text-primary tracking-wide text-base whitespace-nowrap font-outfit">
 CMOC MINING
 </span>
 )}
 </div>
 <button 
 onClick={() => dispatch(toggleSidebar())}
 className="p-1.5 rounded-lg hover:bg-background text-text-secondary hover:text-primary hidden md:block transition-colors"
 >
 {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
 </button>
 </div>

 {/* Navigation Items */}
 <nav className="flex-1 overflow-y-auto p-3 space-y-1.5 no-scrollbar">
 {menuItems.map((item, idx) => (
 <SidebarItem
 key={idx}
 icon={item.icon}
 label={item.label}
 path={item.path}
 collapsed={!sidebarOpen}
 active={location.pathname === item.path || (item.path !=='/dashboard' && location.pathname.startsWith(item.path))}
 />
 ))}
 </nav>

 {/* Footer Sidebar (Logout) */}
 <div className="p-3 border-t border-border">
 <button 
 onClick={handleLogout}
 className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-error hover:bg-error/10 font-semibold text-sm transition-colors duration-300"
 >
 <LogOut size={20} className="shrink-0"/>
 {sidebarOpen && <span>Sair da Conta</span>}
 </button>
 </div>
 </aside>

 {/* Main Content Area */}
 <div className="flex-1 flex flex-col overflow-hidden relative">
 {/* Header */}
 <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-6 z-20 shadow-sm">
 <div className="flex items-center gap-4">
 <button 
 onClick={() => dispatch(toggleSidebar())}
 className="p-2 rounded-lg hover:bg-background text-text-secondary hover:text-primary md:hidden transition-colors"
 >
 <Menu size={20} />
 </button>
 
 <div className="hidden sm:flex items-center gap-2">
 <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
 isOnline 
 ?'bg-success/10 text-success border border-success/20' 
 :'bg-error/10 text-error border border-error/20'
 }`}>
 {isOnline ? <Wifi size={12} className="animate-pulse"/> : <WifiOff size={12} />}
 {isOnline ?'Online' :'Offline'}
 </span>
 <span className="text-sm font-medium text-text-tertiary dark:text-text-tertiary">
 {time.toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'short' })}
 </span>
 <span className="text-sm font-extrabold text-primary ">
 {time.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit', second:'2-digit' })}
 </span>
 </div>
 </div>

 <div className="flex items-center gap-4">
 {/* Toggle Mock Mode */}
 <button 
 onClick={() => dispatch(toggleMockEnabled())}
 className={`p-2 rounded-xl bg-background hover:bg-border transition-all duration-300 border flex items-center gap-1.5 px-3 py-1.5 ${
 mockEnabled 
 ?'text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20' 
 :'text-text-secondary border-border'
 }`}
 title={mockEnabled ?'Desativar Modo Simulado (Mostrar Dados Reais)' :'Ativar Modo Simulado (Mostrar Dados Falsos/Mock)'}
 >
 <Database size={16} className={mockEnabled ?'animate-pulse' :''} />
 <span className="text-xs font-bold hidden sm:inline">
 {mockEnabled ?'Modo Simulado' :'Modo Real'}
 </span>
 </button>

 {/* Toggle Theme */}
 <button 
 onClick={() => dispatch(toggleTheme())}
 className="p-2 rounded-xl bg-background hover:bg-border text-text-secondary hover:text-primary transition-all duration-300 border border-border"
 title={themeMode ==='light' ?'Ativar Modo Escuro' :'Ativar Modo Claro'}
 >
 {themeMode ==='light' ? <Moon size={18} /> : <Sun size={18} />}
 </button>

 {/* Notifications */}
 <div className="relative">
 <button 
 onClick={() => setNotificationsOpen(!notificationsOpen)}
 className="p-2 rounded-xl bg-background hover:bg-border text-text-secondary hover:text-primary relative transition-all duration-300"
 >
 <Bell size={18} />
 <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full animate-bounce"/>
 </button>
 
 {notificationsOpen && (
 <div className="absolute right-0 mt-3 w-80 glass rounded-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
 <div className="flex justify-between items-center mb-3">
 <h3 className="font-bold text-sm text-text-primary">Notificações</h3>
 <span className="text-xs text-primary cursor-pointer hover:underline">Limpar todas</span>
 </div>
 <div className="space-y-2 text-xs">
 <div className="p-2 bg-background rounded-xl border border-border">
 <span className="font-semibold text-primary">Novo Relatório</span>
 <p className="text-text-secondary mt-0.5">Enviado por Equipe Alfa na Mina Leste Nível 120.</p>
 <span className="text-[10px] text-text-tertiary mt-1 block">Há 5 min</span>
 </div>
 <div className="p-2 bg-background rounded-xl border border-border">
 <span className="font-semibold text-warning">Alerta de Manutenção</span>
 <p className="text-text-secondary mt-0.5">Equipamento Carregadeira LHD 04 com temperatura elevada.</p>
 <span className="text-[10px] text-text-tertiary mt-1 block">Há 20 min</span>
 </div>
 </div>
 </div>
 )}
 </div>

 {/* Profile User Info */}
 <div className="flex items-center gap-3 border-l border-border pl-4">
 <div className="text-right hidden md:block">
 <div className="font-extrabold text-sm text-text-primary font-outfit">
 {user?.name ||'Carregando...'}
 </div>
 <div className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
 {user?.role ||'Carregando...'}
 </div>
 </div>
 <div 
 className="w-10 h-10 rounded-xl flex items-center justify-center font-bold font-outfit shadow-sm shadow-primary/20 text-[var(--primary-foreground)] overflow-hidden"
 style={{ backgroundColor: user?.photoURL ?'transparent' : (user?.avatarColor ||'#3b82f6') }}
 >
 {user?.photoURL ? (
 <img src={user.photoURL} alt="Avatar"className="w-full h-full object-cover"/>
 ) : (
 <span>
 {user?.name ? user.name.split('').map(n => n[0]).join('').substring(0, 2).toUpperCase() :'U'}
 </span>
 )}
 </div>
 </div>
 </div>
 </header>

 {/* Scrollable Page Wrapper */}
 <main className="flex-1 overflow-y-auto p-6 md:p-8 relative">
 {children}
 </main>
 </div>
 </div>
 );
}
