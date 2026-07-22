import { useEffect, useState, useRef } from'react';
import { db, doc, getDoc, updateDoc } from'../services/firebase';
import { normalizeReport } from'../services/dataNormalization';
import type { NormalizedReport } from'../services/dataNormalization';
import { useNavigate, useParams, Link } from'react-router-dom';
import { 
 ChevronLeft, Printer, Share2, Edit3, Clock, MapPin, 
 User, Building2, Wrench, CheckSquare, Users,
 Image as ImageIcon, MessageSquare, FileText, CheckCircle2, PenTool, Flame
} from'lucide-react';
import { motion } from'framer-motion';

export default function ReportDetails() {
 const { id } = useParams<{ id: string }>();
 const navigate = useNavigate();
 const [report, setReport] = useState<NormalizedReport | null>(null);
 const [loading, setLoading] = useState(true);
 const [activeSubTab, setActiveSubTab] = useState<'geral' |'timeline' |'checklist' |'fotos' |'comentarios' |'assinatura'>('geral');
 const [commentText, setCommentText] = useState('');

 // Digital Signature State
 const [signaturePin, setSignaturePin] = useState('');
 const [signedBy, setSignedBy] = useState('');
 const [signedAt, setSignedAt] = useState('');
 const canvasRef = useRef<HTMLCanvasElement>(null);
 const [isDrawing, setIsDrawing] = useState(false);
 const [hasSignature, setHasSignature] = useState(false);

 const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
 const canvas = canvasRef.current;
 if (!canvas) return;
 const ctx = canvas.getContext('2d');
 if (!ctx) return;
 ctx.strokeStyle ='#23005B';
 ctx.lineWidth = 2;
 ctx.lineCap ='round';
 const rect = canvas.getBoundingClientRect();
 ctx.beginPath();
 ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
 setIsDrawing(true);
 };

 const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
 if (!isDrawing) return;
 const canvas = canvasRef.current;
 if (!canvas) return;
 const ctx = canvas.getContext('2d');
 if (!ctx) return;
 const rect = canvas.getBoundingClientRect();
 ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
 ctx.stroke();
 setHasSignature(true);
 };

 const stopDrawing = () => {
 setIsDrawing(false);
 };

 const clearSignature = () => {
 const canvas = canvasRef.current;
 if (!canvas) return;
 const ctx = canvas.getContext('2d');
 if (!ctx) return;
 ctx.clearRect(0, 0, canvas.width, canvas.height);
 setHasSignature(false);
 setSignedBy('');
 setSignedAt('');
 };

 const handleSign = async () => {
 if (!hasSignature || !id) {
 alert('Desenhe sua assinatura no campo acima.');
 return;
 }
 if (signaturePin.length < 4) {
 alert('O PIN de segurança deve ter pelo menos 4 dígitos.');
 return;
 }
 
 const canvas = canvasRef.current;
 const dataUrl = canvas?.toDataURL('image/png') ||'';
 const signedByVal ='Eng. Pedro Santos';
 const signedAtVal = new Date().toLocaleString('pt-BR');

 try {
 const docRef = doc(db,'reports', id);
 await updateDoc(docRef, {
 status:'synced',
 syncStatus:'synced',
 signature: { signedBy: signedByVal, signedAt: signedAtVal, dataUrl }
 });
 
 setSignedBy(signedByVal);
 setSignedAt(signedAtVal);
 setReport(prev => prev ? { ...prev, status:'synced', signature: { signedBy: signedByVal, signedAt: signedAtVal, dataUrl } } : null);
 alert('✅ Relatório assinado e sincronizado digitalmente com sucesso!');
 } catch (e) {
 console.error(e);
 alert('Erro ao salvar assinatura.');
 }
 };

 useEffect(() => {
 if (id) {
 const fetchReport = async () => {
 try {
 const docRef = doc(db,'reports', id);
 const docSnap = await getDoc(docRef);
 if (docSnap.exists()) {
 const data = normalizeReport({ uuid: docSnap.id, ...docSnap.data() });
 setReport(data);
 if (data.signature) {
 setSignedBy(data.signature.signedBy);
 setSignedAt(data.signature.signedAt);
 setHasSignature(true);
 }
 } else {
 alert('Relatório não encontrado');
 navigate('/reports');
 }
 } catch (e) {
 console.error(e);
 } finally {
 setLoading(false);
 }
 };
 fetchReport();
 }
 }, [id, navigate]);

 const handlePrint = () => {
 window.print();
 };

 const handleShare = () => {
 if (navigator.share) {
 navigator.share({
 title: `Relatório de Mina CMOC - ${report?.mineLocation}`,
 text: report?.description,
 url: window.location.href
 }).catch(console.error);
 } else {
 navigator.clipboard.writeText(window.location.href);
 alert('Link do relatório copiado para a área de transferência!');
 }
 };

 const handleAddComment = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!commentText.trim() || !id) return;
 
 const newComment = { 
 author:'Eng. Pedro Santos (Você)', 
 date: new Date().toLocaleString('pt-BR'), 
 text: commentText 
 };
 
 try {
 const docRef = doc(db,'reports', id);
 await updateDoc(docRef, {
 comments: report?.comments ? [...report.comments, newComment] : [newComment]
 });
 setReport(prev => prev ? { ...prev, comments: prev.comments ? [...prev.comments, newComment] : [newComment] } : null);
 setCommentText('');
 } catch (e) {
 console.error(e);
 alert('Erro ao salvar comentário.');
 }
 };

 if (loading) {
 return (
 <div className="flex h-[60vh] items-center justify-center">
 <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cmoc-purple"/>
 </div>
 );
 }

 if (!report) return null;

 const date = report.createdAt?.toDate ? report.createdAt.toDate() : new Date(report.createdAt || Date.now());

 // Dummy checklist
 const checklists = [
 { item:'Inspeção de EPIs da Turma', status:'Concluído', desc:'Todos os colaboradores equipados com capacete, lanterna e respirador.' },
 { item:'Medição de Concentração de Gases', status:'Concluído', desc:'Níveis de O2, CO e H2S estáveis e dentro do limite seguro.' },
 { item:'Inspeção Prévia do Teto e Paredes da Galeria', status:'Concluído', desc:'Verificação visual de instabilidades estruturais.' },
 { item:'Checklist de Pré-operação da Carregadeira', status:'Concluído', desc:'Níveis de óleo e circuito elétrico verificados.' }
 ];

 return (
 <div className="space-y-6 max-w-5xl mx-auto print:p-0 animate-in fade-in duration-200">
 {/* Action / Title Bar */}
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border dark:border-border/80 pb-4 print:hidden">
 <div className="flex items-center gap-3">
 <Link 
 to="/reports"
 className="p-2 rounded-xl bg-surface-hover dark:bg-surface hover:bg-surface-hover text-primary "
 >
 <ChevronLeft size={18} />
 </Link>
 <div className="flex items-center gap-3">
 <h1 className="text-2xl font-extrabold text-primary font-outfit">
 Relatório de Campo
 </h1>
 {report.status ==='synced' && <span className="px-2.5 py-1 bg-success/10 text-success text-xs font-bold rounded-full border border-success/20">Sincronizado</span>}
 {report.status ==='pending' && <span className="px-2.5 py-1 bg-yellow-100 dark:bg-yellow-950/20 text-warning text-xs font-bold rounded-full border border-warning/20">Pendente</span>}
 {report.status ==='draft' && <span className="px-2.5 py-1 bg-surface-hover dark:bg-surface text-text-tertiary text-xs font-bold rounded-full border border-border dark:border-border">Rascunho</span>}
 </div>
 <div>
 <p className="text-text-tertiary dark:text-text-tertiary text-xs mt-0.5">
 Criado em {date.toLocaleDateString('pt-BR')} às {date.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}
 </p>
 </div>
 </div>

 <div className="flex gap-2 text-xs font-bold w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
 <button 
 onClick={() => navigate(`/reports/edit/${report.uuid}`)}
 className="flex items-center gap-1.5 px-4 py-2.5 bg-surface-hover hover:bg-surface-hover dark:bg-surface dark:hover:bg-surface-hover text-text-secondary rounded-xl"
 >
 <Edit3 size={14} /> Editar
 </button>
 <button 
 onClick={handleShare}
 className="flex items-center gap-1.5 px-4 py-2.5 bg-surface-hover hover:bg-surface-hover dark:bg-surface dark:hover:bg-surface-hover text-text-secondary rounded-xl"
 >
 <Share2 size={14} /> Compartilhar
 </button>
 <button 
 onClick={handlePrint}
 className="flex items-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary text-[var(--primary-foreground)] rounded-xl shadow-md"
 >
 <Printer size={14} /> Imprimir / PDF
 </button>
 </div>
 </div>

 {/* Main Print Title Header (Only visible on Print) */}
 <div className="hidden print:flex justify-between items-center border-b-2 border-primary pb-4 mb-6">
 <div>
 <img src="/logo.svg"alt="CMOC Logo"className="h-10 mb-2"/>
 <h1 className="text-xl font-bold text-primary uppercase">CMOC Brasil — Diário de Mina Subterrânea</h1>
 <p className="text-[10px] text-text-tertiary">ID do Relatório: {report.uuid.toUpperCase()}</p>
 </div>
 <div className="text-right text-[10px] text-text-tertiary">
 <div>Emissão: {new Date().toLocaleDateString('pt-BR')}</div>
 <div>Responsável: {report.supervisorName ||'Eng. Pedro Santos'}</div>
 </div>
 </div>

 {/* Report Info Grid Card */}
 <div className="glass rounded-2xl p-6 border border-border/50 dark:border-border/80 shadow-md">
 <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm font-semibold">
 <div className="flex gap-3 items-center">
 <div className="p-2 rounded-xl bg-primary/5 dark:bg-surface text-primary shrink-0"><MapPin size={18} /></div>
 <div className="flex flex-col">
 <span className="text-[10px] uppercase text-text-tertiary font-bold">Local / Mina</span>
 <span className="text-text-primary ">{report.mineLocation}</span>
 </div>
 </div>
 <div className="flex gap-3 items-center">
 <div className="p-2 rounded-xl bg-primary/5 dark:bg-surface text-primary shrink-0"><Clock size={18} /></div>
 <div className="flex flex-col">
 <span className="text-[10px] uppercase text-text-tertiary font-bold">Turno / Horário</span>
 <span className="text-text-primary ">Turno {report.shift ||'A'}</span>
 </div>
 </div>
 <div className="flex gap-3 items-center">
 <div className="p-2 rounded-xl bg-primary/5 dark:bg-surface text-primary shrink-0"><User size={18} /></div>
 <div className="flex flex-col">
 <span className="text-[10px] uppercase text-text-tertiary font-bold">Supervisor</span>
 <span className="text-text-primary ">{report.supervisorName ||'Pedro Santos'}</span>
 </div>
 </div>
 <div className="flex gap-3 items-center">
 <div className="p-2 rounded-xl bg-primary/5 dark:bg-surface text-primary shrink-0"><Building2 size={18} /></div>
 <div className="flex flex-col">
 <span className="text-[10px] uppercase text-text-tertiary font-bold">Empresa</span>
 <span className="text-text-primary ">{report.responsibleCompany ||'CMOC Brasil'}</span>
 </div>
 </div>
 </div>
 </div>

 {/* Tabs Menu */}
 <div className="flex gap-2 border-b border-border dark:border-border/80 pb-px print:hidden">
 {[
 { id:'geral', label:'Resumo do Relatório', icon: <FileText size={16} /> },
 { id:'timeline', label:'Linha do Tempo', icon: <Clock size={16} /> },
 { id:'checklist', label:'Checklist de Segurança', icon: <CheckSquare size={16} /> },
 { id:'fotos', label:'Anexo Fotográfico', icon: <ImageIcon size={16} /> },
 { id:'comentarios', label:'Comentários & Histórico', icon: <MessageSquare size={16} /> },
 { id:'assinatura', label:'Assinatura Digital', icon: <PenTool size={16} /> }
 ].map(tab => (
 <button
 key={tab.id}
 onClick={() => setActiveSubTab(tab.id as any)}
  className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 -mb-px transition-all ${
    activeSubTab === tab.id 
      ? 'border-primary text-primary' 
      : 'border-transparent text-text-secondary hover:text-primary hover:border-border'
  }`}
>
 {tab.icon}
 {tab.label}
 </button>
 ))}
 </div>

 {/* TAB CONTENT */}
 <div className="space-y-6">
 {/* SUBTAB: RESUMO GERAL (Visible in print always) */}
 {(activeSubTab ==='geral' || window.matchMedia('print').matches) && (
 <motion.div 
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 className="space-y-6"
 >
 {/* Descrição & Atividade */}
 <div className="glass rounded-2xl p-6 border border-border/50 dark:border-border/80 shadow-md space-y-4">
 <h3 className="text-sm font-bold text-primary font-outfit uppercase tracking-wider text-xs">Atividades Executadas</h3>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="md:col-span-2 space-y-3">
 <div className="text-xs font-bold text-primary uppercase">Descrição Detalhada / Observações</div>
 <p className="text-text-secondary dark:text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
 {report.description || report.observations ||'Nenhuma descrição fornecida.'}
 </p>
 </div>
 <div className="p-4 bg-background dark:bg-background rounded-xl space-y-3 border border-border/20">
 <div className="text-xs font-bold text-primary uppercase">Metas & Recursos</div>
 <div className="space-y-2 text-xs font-semibold text-text-secondary dark:text-text-tertiary">
 <div>Atividade: <span className="text-text-primary ">{report.activityType ||'Lavra'}</span></div>
 <div>Objetivo: <span className="text-text-primary ">{report.objective ||'N/A'}</span></div>
 <div>Equipamento: <span className="text-text-primary ">{report.equipment ||'N/A'}</span></div>
 {report.fuelLevel > 0 && (
 <div className="flex items-center gap-1">
 Combustível: <Flame size={12} className="text-orange-500 shrink-0"/>
 <span className="text-text-primary ">
 {report.fuelLevel <= 1.0 ? Math.round(report.fuelLevel * 100) : Math.round(report.fuelLevel)}%
 </span>
 </div>
 )}
 {report.availableMaterials && (
 <div>Materiais Disp.: <span className="text-text-primary ">{report.availableMaterials}</span></div>
 )}
 {report.materials && (
 <div>Materiais: <span className="text-text-primary ">{report.materials}</span></div>
 )}
 <div>Ferramentas: <span className="text-text-primary ">{report.toolsUsed ||'N/A'}</span></div>
 </div>
 </div>
 </div>
 </div>

 {/* Executantes & Ordens de serviço */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {/* Equipe / Colaboradores */}
 <div className="glass rounded-2xl p-6 border border-border/50 dark:border-border/80 shadow-md space-y-4">
 <h3 className="text-sm font-bold text-primary font-outfit uppercase tracking-wider text-xs flex items-center gap-2">
 <Users size={16} /> Equipe em Campo ({report.executors?.length || 0})
 </h3>
 <div className="divide-y divide-slate-100 dark:divide-slate-800/85">
 {report.executors && report.executors.length > 0 ? (
 report.executors.map((e, idx) => (
 <div key={idx} className="py-2.5 flex justify-between items-center text-xs font-semibold">
 <span className="text-text-secondary dark:text-text-secondary">{e.name}</span>
 <span className="text-text-tertiary font-mono">Reg: {e.registration}</span>
 </div>
 ))
 ) : (
 <div className="text-xs text-text-tertiary py-4">Nenhum executante cadastrado.</div>
 )}
 </div>
 </div>

 {/* Ordens de serviço list */}
 <div className="glass rounded-2xl p-6 border border-border/50 dark:border-border/80 shadow-md space-y-4">
 <h3 className="text-sm font-bold text-primary font-outfit uppercase tracking-wider text-xs flex items-center gap-2">
 <Wrench size={16} /> Ordens de Serviço Associadas ({report.workOrders?.length || 0})
 </h3>
 <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
 {report.workOrders && report.workOrders.length > 0 ? (
 report.workOrders.map((os, idx) => (
 <div key={idx} className="p-4 bg-background dark:bg-background border border-border/50 dark:border-border rounded-xl text-xs space-y-3">
 <div className="flex justify-between items-center font-bold text-primary border-b border-border/30 pb-2">
 <span className="text-xs font-extrabold font-outfit">OS #{os.number ||'N/A'}</span>
 <span className="px-2 py-0.5 bg-surface-hover dark:bg-surface rounded text-[10px] text-text-tertiary font-mono">
 {os.startTime ||'--:--'} - {os.endTime ||'--:--'}
 </span>
 </div>
 <div className="grid grid-cols-2 gap-2 text-text-secondary ">
 {os.location && (
 <div>
 <span className="text-[10px] uppercase text-text-tertiary font-bold block">Local</span>
 <span className="font-bold text-text-primary ">{os.location}</span>
 </div>
 )}
 {os.maintenanceType && (
 <div>
 <span className="text-[10px] uppercase text-text-tertiary font-bold block">Manutenção</span>
 <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded font-bold inline-block mt-0.5">{os.maintenanceType}</span>
 </div>
 )}
 {os.quantityMeters && os.quantityMeters !=='0' && os.quantityMeters !=='' && (
 <div>
 <span className="text-[10px] uppercase text-text-tertiary font-bold block">Metros Planejados</span>
 <span className="font-bold text-text-primary ">{os.quantityMeters}m</span>
 </div>
 )}
 {os.quantityPieces && os.quantityPieces !=='0' && os.quantityPieces !=='' && (
 <div>
 <span className="text-[10px] uppercase text-text-tertiary font-bold block">Peças Substituídas</span>
 <span className="font-bold text-text-primary ">{os.quantityPieces} un</span>
 </div>
 )}
 </div>
 {os.cause && (
 <div>
 <span className="text-[10px] uppercase text-text-tertiary font-bold block">Causa / Diagnóstico</span>
 <p className="text-text-secondary dark:text-text-secondary font-semibold">{os.cause}</p>
 </div>
 )}
 <div>
 <span className="text-[10px] uppercase text-text-tertiary font-bold block">Atividades Executadas</span>
 <p className="text-text-secondary dark:text-text-secondary font-medium whitespace-pre-wrap">{os.activities}</p>
 </div>
 {os.materialsUsed && os.materialsUsed.length > 0 && (
 <div>
 <span className="text-[10px] uppercase text-text-tertiary font-bold block mb-1">Materiais Utilizados</span>
 <div className="flex gap-1 flex-wrap">
 {os.materialsUsed.map((mat, mIdx) => (
 <span key={mIdx} className="px-2 py-0.5 bg-surface-hover dark:bg-surface text-text-secondary dark:text-text-secondary rounded border border-border/30">
 {mat}
 </span>
 ))}
 </div>
 </div>
 )}
 {os.osStatus && (
 <div className="flex justify-end pt-1">
 <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
 os.osStatus ==='Concluída' || os.osStatus ==='Finished' ?'bg-green-100 text-success' :'bg-yellow-100 text-yellow-600'
 }`}>{os.osStatus}</span>
 </div>
 )}
 </div>
 ))
 ) : (
 <div className="text-xs text-text-tertiary py-4">Nenhuma ordem de serviço associada.</div>
 )}
 </div>
 </div>
 </div>

 {/* Segurança, Riscos & GPS */}
 <div className="glass rounded-2xl p-6 border border-border/50 dark:border-border/80 shadow-md space-y-4">
 <h3 className="text-sm font-bold text-primary font-outfit uppercase tracking-wider text-xs">Análise de Risco & Conformidade</h3>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-semibold">
 <div className="space-y-1 bg-background dark:bg-background p-4 rounded-xl border border-border/20">
 <div className="text-text-tertiary uppercase text-[10px]">Permissão de Trabalho (PT)</div>
 <div className="text-sm font-bold text-primary ">{report.workPermit ||'PT-Liberada (Auto)'}</div>
 </div>
 <div className="space-y-1 bg-background dark:bg-background p-4 rounded-xl border border-border/20">
 <div className="text-text-tertiary uppercase text-[10px]">Nível de Risco Mapeado</div>
 <div className="text-sm font-bold text-error">{report.riskLevel ||'Baixo'}</div>
 </div>
 <div className="space-y-1 bg-background dark:bg-background p-4 rounded-xl border border-border/20">
 <div className="text-text-tertiary uppercase text-[10px]">Localização GPS</div>
 <div className="text-sm font-bold text-text-secondary ">{report.gpsCoordinates ||'X: 120, Y: -120m'}</div>
 </div>
 </div>
 </div>

 {/* Assinatura Digital (Visible on print) */}
 <div className="hidden print:grid grid-cols-2 gap-12 mt-12 pt-6 border-t border-border">
 <div className="text-center flex flex-col items-center">
 <div className="w-48 border-b border-border mt-12"/>
 <span className="text-[10px] font-bold uppercase mt-2">Pedro Santos</span>
 <span className="text-[9px] text-text-tertiary">Supervisor Responsável</span>
 </div>
 <div className="text-center flex flex-col items-center">
 <div className="w-48 border-b border-border mt-12"/>
 <span className="text-[10px] font-bold uppercase mt-2">Gerência de Operações</span>
 <span className="text-[9px] text-text-tertiary">Homologado Digitalmente</span>
 </div>
 </div>
 </motion.div>
 )}

 {/* SUBTAB: TIMELINE */}
 {activeSubTab ==='timeline' && (
 <motion.div 
 initial={{ opacity: 0, x: -10 }}
 animate={{ opacity: 1, x: 0 }}
 className="glass rounded-2xl p-6 border border-border/50 dark:border-border/80 shadow-md"
 >
 <h3 className="text-sm font-bold text-primary font-outfit uppercase tracking-wider text-xs mb-6">Linha do Tempo Operacional</h3>
 <div className="relative border-l-2 border-cmoc-purple/40 ml-4 space-y-6">
 <div className="relative pl-6">
 <span className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-primary ring-4 ring-white dark:ring-cmoc-dark-card"/>
 <span className="text-xs font-semibold text-text-tertiary">Início do Turno ({report.shift ||'A'})</span>
 <h4 className="text-sm font-bold text-primary mt-0.5">Briefing Técnico de Segurança</h4>
 <p className="text-xs text-text-tertiary dark:text-text-tertiary mt-0.5">Reunião prévia de mapeamento de riscos e distribuição das OS.</p>
 </div>

 {report.workOrders?.map((os, idx) => (
 <div key={idx} className="relative pl-6">
 <span className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-success ring-4 ring-white dark:ring-cmoc-dark-card"/>
 <span className="text-xs font-semibold text-text-tertiary">OS #{os.number || idx} | {os.startTime ||'08:00'}</span>
 <h4 className="text-sm font-bold text-primary mt-0.5">{os.maintenanceType ||'Atividade Operacional'}</h4>
 <p className="text-xs text-text-tertiary dark:text-text-tertiary mt-0.5">{os.activities}</p>
 </div>
 ))}

 <div className="relative pl-6">
 <span className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-slate-400 ring-4 ring-white dark:ring-cmoc-dark-card"/>
 <span className="text-xs font-semibold text-text-tertiary">Fim do Turno</span>
 <h4 className="text-sm font-bold text-text-secondary dark:text-text-tertiary mt-0.5">Fechamento do Relatório</h4>
 <p className="text-xs text-text-tertiary dark:text-text-tertiary mt-0.5">Assinatura digital e homologação via Web Supervisor.</p>
 </div>
 </div>
 </motion.div>
 )}

 {/* SUBTAB: CHECKLIST */}
 {activeSubTab ==='checklist' && (
 <motion.div 
 initial={{ opacity: 0, x: -10 }}
 animate={{ opacity: 1, x: 0 }}
 className="glass rounded-2xl p-6 border border-border/50 dark:border-border/80 shadow-md space-y-4"
 >
 <h3 className="text-sm font-bold text-primary font-outfit uppercase tracking-wider text-xs">Itens do Checklist Técnico</h3>
 <div className="space-y-3">
 {checklists.map((check, idx) => (
 <div key={idx} className="p-4 bg-background dark:bg-background border border-border/50 rounded-xl flex items-start gap-3">
 <CheckCircle2 className="text-success shrink-0 mt-0.5"size={18} />
 <div className="text-xs">
 <div className="font-bold text-primary ">{check.item}</div>
 <p className="text-text-tertiary dark:text-text-tertiary mt-0.5">{check.desc}</p>
 </div>
 </div>
 ))}
 </div>
 </motion.div>
 )}

 {/* SUBTAB: ANEXO FOTOGRÁFICO */}
 {activeSubTab ==='fotos' && (
 <motion.div 
 initial={{ opacity: 0, x: -10 }}
 animate={{ opacity: 1, x: 0 }}
 className="glass rounded-2xl p-6 border border-border/50 dark:border-border/80 shadow-md space-y-6"
 >
 <h3 className="text-sm font-bold text-primary font-outfit uppercase tracking-wider text-xs">Anexo Fotográfico da Frente de Trabalho</h3>
 
 {report.workOrders?.some(os => os.photoPaths && os.photoPaths.length > 0) ? (
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {report.workOrders.flatMap(os => 
 (os.photoPaths || []).map((path, pIdx) => (
 <div key={`${os.number}-${pIdx}`} className="group relative rounded-xl overflow-hidden border border-slate-250 dark:border-border bg-surface-hover dark:bg-background aspect-video hover:shadow-lg transition-all cursor-pointer"onClick={() => window.open(path,'_blank')}>
 <img 
 src={path} 
 alt={`Foto da OS ${os.number}`} 
 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
 onError={(e) => {
 (e.target as HTMLImageElement).src ='https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=600&q=80';
 }}
 />
 <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-[9px] text-[var(--primary-foreground)] font-bold">
 OS #{os.number} - Foto {pIdx + 1}
 </div>
 </div>
 ))
 )}
 </div>
 ) : (
 <div className="text-center py-12 border-2 border-dashed border-border dark:border-border rounded-2xl text-text-tertiary">
 <ImageIcon className="mx-auto text-slate-350 mb-2"size={32} />
 <p className="text-xs">Nenhuma foto anexada a este relatório pelas equipes de campo.</p>
 </div>
 )}
 </motion.div>
 )}

 {/* SUBTAB: COMENTÁRIOS & HISTÓRICO */}
 {activeSubTab ==='comentarios' && (
 <motion.div 
 initial={{ opacity: 0, x: -10 }}
 animate={{ opacity: 1, x: 0 }}
 className="grid grid-cols-1 md:grid-cols-3 gap-6"
 >
 {/* Feed de Comentarios */}
 <div className="glass rounded-2xl p-6 border border-border/50 dark:border-border/80 shadow-md md:col-span-2 space-y-4">
 <h3 className="text-sm font-bold text-primary font-outfit uppercase tracking-wider text-xs">Comentários e Feedbacks</h3>
 
 <div className="space-y-3">
 {(report.comments || []).length === 0 ? (
 <div className="text-xs text-text-tertiary italic">Nenhum comentário adicionado.</div>
 ) : (
 (report.comments || []).map((comm, idx) => (
 <div key={idx} className="p-3 bg-background dark:bg-background border border-border/50 rounded-xl text-xs">
 <div className="flex justify-between items-center font-bold text-text-secondary ">
 <span>{comm.author}</span>
 <span className="text-[10px] text-text-tertiary font-normal">{comm.date}</span>
 </div>
 <p className="text-text-tertiary dark:text-text-tertiary mt-1.5 leading-relaxed">{comm.text}</p>
 </div>
 ))
 )}
 </div>

 {/* Novo comentário input */}
 <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t border-slate-100 dark:border-border/80">
 <input 
 type="text"
 value={commentText}
 onChange={(e) => setCommentText(e.target.value)}
 placeholder="Escreva um comentário técnico..."
 className="flex-1 px-3 py-2 bg-background dark:bg-background border border-border dark:border-border rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none text-xs"
 />
 <button 
 type="submit"
 className="px-4 py-2 bg-primary text-[var(--primary-foreground)] text-xs font-bold rounded-xl shadow-md"
 >
 Enviar
 </button>
 </form>
 </div>

 {/* Auditoria / Histórico de alterações */}
 <div className="glass rounded-2xl p-6 border border-border/50 dark:border-border/80 shadow-md space-y-4">
 <h3 className="text-sm font-bold text-primary font-outfit uppercase tracking-wider text-xs">Registro de Auditoria</h3>
 <div className="space-y-3 text-[10px] font-semibold text-text-tertiary">
 <div className="flex gap-2">
 <span className="w-1.5 h-1.5 bg-success rounded-full mt-1 shrink-0"/>
 <div>
 <span className="text-slate-750 ">Documento Criado</span>
 <p className="text-text-tertiary">Via App Mobile (Operador)</p>
 <span className="text-[9px] text-text-tertiary block mt-0.5">Há 2 horas</span>
 </div>
 </div>
 <div className="flex gap-2">
 <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1 shrink-0"/>
 <div>
 <span className="text-slate-750 ">Relatório Sincronizado</span>
 <p className="text-text-tertiary">Gravado no Firestore com sucesso</p>
 <span className="text-[9px] text-text-tertiary block mt-0.5">Há 1 hora</span>
 </div>
 </div>
 </div>
 </div>
 </motion.div>
 )}
 </div>

 {/* Signature Tab */}
 {activeSubTab ==='assinatura' && (
 <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
 <div className="glass rounded-2xl p-6 border border-border/50 dark:border-border/80 shadow-sm">
 <h3 className="text-sm font-black text-primary mb-4 flex items-center gap-2">
 <PenTool size={16} className="text-primary"/>
 Assinatura Digital do Supervisor
 </h3>

 {signedBy ? (
 <div className="space-y-3">
 <div className="p-4 bg-success/10 border border-success/30 rounded-xl">
 <div className="flex items-center gap-2 text-success text-sm font-black mb-2">
 <CheckCircle2 size={18} />
 Relatório Assinado Digitalmente
 </div>
 <div className="text-xs text-text-secondary dark:text-text-secondary space-y-1">
 <p><strong>Assinado por:</strong> {signedBy}</p>
 <p><strong>Data/Hora:</strong> {signedAt}</p>
 <p><strong>Método:</strong> Assinatura manuscrita digital + PIN</p>
 </div>
 </div>
 {report.signature?.dataUrl ? (
 <img 
 src={report.signature.dataUrl} 
 alt="Signature"
 className="border border-border dark:border-border rounded-xl bg-surface pointer-events-none"
 />
 ) : (
 <canvas 
 ref={canvasRef}
 width={400} height={150}
 className="border border-border dark:border-border rounded-xl bg-surface pointer-events-none"
 />
 )}
 </div>
 ) : (
 <div className="space-y-4">
 <p className="text-xs text-text-tertiary dark:text-text-tertiary">
 Desenhe sua assinatura no campo abaixo e insira o PIN de segurança para autenticar este relatório.
 </p>
 <div className="relative">
 <canvas 
 ref={canvasRef}
 width={400} height={150}
 className="border-2 border-dashed border-border dark:border-border rounded-xl bg-surface dark:bg-background cursor-crosshair w-full"
 onMouseDown={startDrawing}
 onMouseMove={draw}
 onMouseUp={stopDrawing}
 onMouseLeave={stopDrawing}
 />
 {!hasSignature && (
 <span className="absolute inset-0 flex items-center justify-center text-text-secondary dark:text-text-secondary text-sm pointer-events-none">
 Desenhe sua assinatura aqui
 </span>
 )}
 </div>
 <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
 <div className="flex-1">
 <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">PIN de Segurança</label>
 <input
 type="password"
 value={signaturePin}
 onChange={(e) => setSignaturePin(e.target.value)}
 placeholder="••••"
 maxLength={6}
 className="w-full px-4 py-2.5 border border-border dark:border-border rounded-xl bg-surface dark:bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cmoc-purple/40 "
 />
 </div>
 <div className="flex gap-2">
 <button
 onClick={clearSignature}
 className="px-4 py-2.5 text-xs font-bold bg-surface-hover dark:bg-surface text-text-secondary dark:text-text-secondary rounded-xl hover:bg-surface-hover dark:hover:bg-surface-hover"
 >
 Limpar
 </button>
 <button
 onClick={handleSign}
 className="px-5 py-2.5 text-xs font-bold bg-primary hover:bg-primary text-[var(--primary-foreground)] rounded-xl shadow-md transition-all"
 >
 Assinar Relatório
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 </motion.div>
 )}
 </div>
 );
}
