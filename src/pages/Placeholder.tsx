import { useParams } from'react-router-dom';
import { motion } from'framer-motion';
import { Construction } from'lucide-react';

export default function Placeholder() {
 const { page } = useParams<{ page: string }>();

 // Map route segment to human readable title
 const getPageTitle = (p?: string) => {
 switch (p) {
 case'orders': return'Ordens de Serviço';
 case'infra': return'Infraestrutura';
 case'equipments': return'Equipamentos';
 case'teams': return'Equipes';
 case'collaborators': return'Colaboradores';
 case'areas': return'Áreas';
 case'mines': return'Minas';
 case'maps': return'Mapas';
 case'checklist': return'Checklists';
 case'occurrences': return'Ocorrências';
 case'documents': return'Documentos';
 case'indicators': return'Indicadores Operacionais';
 case'audit': return'Trilhas de Auditoria';
 case'settings': return'Configurações do Sistema';
 case'help': return'Central de Ajuda';
 default: return'Módulo do Sistema';
 }
 };

 const title = getPageTitle(page);

 return (
 <div className="h-[70vh] flex flex-col items-center justify-center p-6 text-center">
 <motion.div
 initial={{ scale: 0.9, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 transition={{ duration: 0.5 }}
 className="glass p-10 rounded-2xl max-w-lg shadow-xl shadow-cmoc-blue/5 border border-white/20 dark:border-white/5 flex flex-col items-center"
 >
 <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cmoc-purple to-cmoc-blue text-[var(--primary-foreground)] flex items-center justify-center mb-6 shadow-md shadow-cmoc-purple/20">
 <Construction size={32} className="animate-pulse"/>
 </div>
 
 <h1 className="text-2xl font-bold text-primary font-outfit mb-3">
 Módulo: {title}
 </h1>
 
 <p className="text-text-tertiary dark:text-text-tertiary text-sm leading-relaxed mb-6">
 Este módulo está mapeado e preparado para a integração de APIs. No momento, o painel do supervisor está simulando a integridade dos dados para as operações de infraestrutura subterrânea.
 </p>

 {/* Mock database integrity state */}
 <div className="w-full bg-surface-hover dark:bg-background/50 rounded-xl p-4 border border-border/50 dark:border-border/80 mb-6 text-left">
 <div className="flex items-center justify-between mb-2">
 <span className="text-xs font-semibold text-primary uppercase tracking-wider">Status do Módulo</span>
 <span className="text-xs font-bold text-success flex items-center gap-1">
 <span className="w-1.5 h-1.5 bg-success rounded-full animate-ping"/>
 Mapeado (Ok)
 </span>
 </div>
 <div className="space-y-1.5 text-xs text-text-tertiary dark:text-text-tertiary font-mono">
 <div>Collection: <span className="text-primary font-semibold">cmoc_{page ||'generic'}</span></div>
 <div>Endpoints: <span className="text-primary font-semibold">GET, POST, PUT, DELETE</span></div>
 <div>Integridade: <span className="text-primary font-semibold">100% (Mock Ativado)</span></div>
 </div>
 </div>

 <button 
 onClick={() => window.history.back()}
 className="px-6 py-2.5 bg-primary hover:bg-primary text-[var(--primary-foreground)] text-sm font-bold rounded-xl transition-all duration-200"
 >
 Voltar para Anterior
 </button>
 </motion.div>
 </div>
 );
}
