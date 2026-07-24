import { useEffect, useState } from 'react';
import { db, collection, onSnapshot, query, orderBy, deleteDoc, doc } from '../services/firebase';
import { normalizeReport } from '../services/dataNormalization';
import type { NormalizedReport } from '../services/dataNormalization';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { 
  Search, Plus, Eye, Edit2, Trash2, MapPin, ClipboardList,
  Download, X, FileText, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from'framer-motion';
import * as XLSX from'xlsx';

export default function ReportsList() {
 const navigate = useNavigate();
 const mockEnabled = useSelector((state: RootState) => state.ui.mockEnabled);
 const [reports, setReports] = useState<NormalizedReport[]>([]);
 const [filteredReports, setFilteredReports] = useState<NormalizedReport[]>([]);
 const [loading, setLoading] = useState(true);
 
 // Search & Filter state
 const [searchTerm, setSearchTerm] = useState('');
 const [selectedShift, setSelectedShift] = useState('');
 const [selectedArea, setSelectedArea] = useState('');
 const [selectedPeriod, setSelectedPeriod] = useState('all'); // all, today, yesterday, 7, 30
 
 // Pagination & Sorting state
 const [currentPage, setCurrentPage] = useState(1);
 const [sortField, setSortField] = useState<keyof NormalizedReport>('createdAt');
 const [sortOrder, setSortOrder] = useState<'asc' |'desc'>('desc');
 const [showFilters, setShowFilters] = useState(false);
 const itemsPerPage = 8;

 // Confirm delete modal state
 const [reportToDelete, setReportToDelete] = useState<string | null>(null);

 useEffect(() => {
 const q = query(collection(db,'reports'), orderBy('createdAt','desc'));
 const unsubscribe = onSnapshot(q, (snapshot) => {
 const docs = snapshot.docs.map(d => normalizeReport({ uuid: d.id, ...d.data() }));
 setReports(docs);
 setLoading(false);
 }, (error) => {
 console.error('Error fetching reports:', error);
 setLoading(false);
 });

 return () => unsubscribe();
 }, [mockEnabled]);

 // Filter application
 useEffect(() => {
 let result = [...reports];

 // Search Term (search by OS number, supervisor, executant, area, mina, equipment, shift, team)
 if (searchTerm.trim() !=='') {
 const term = searchTerm.toLowerCase();
 result = result.filter(r => 
 (r.mineLocation?.toLowerCase().includes(term)) ||
 (r.shift?.toLowerCase().includes(term)) ||
 (r.team?.toLowerCase().includes(term)) ||
 (r.equipment?.toLowerCase().includes(term)) ||
 (r.executors?.some(e => e.name.toLowerCase().includes(term) || e.registration.toLowerCase().includes(term))) ||
 (r.workOrders?.some(o => o.number.toLowerCase().includes(term) || o.activities.toLowerCase().includes(term)))
 );
 }

 // Quick filters
 if (selectedShift) result = result.filter(r => r.shift === selectedShift);
 if (selectedArea) result = result.filter(r => r.mineLocation?.toLowerCase().includes(selectedArea.toLowerCase()));

 // Period filtering
 if (selectedPeriod !=='all') {
 const now = new Date();
 result = result.filter(r => {
 if (!r.createdAt) return false;
 const date = r.createdAt.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
 
 if (selectedPeriod ==='today') {
 return date.toDateString() === now.toDateString();
 } else if (selectedPeriod ==='yesterday') {
 const yesterday = new Date();
 yesterday.setDate(now.getDate() - 1);
 return date.toDateString() === yesterday.toDateString();
 } else if (selectedPeriod ==='7') {
 const diff = now.getTime() - date.getTime();
 return diff <= 7 * 24 * 60 * 60 * 1000;
 } else if (selectedPeriod ==='30') {
 const diff = now.getTime() - date.getTime();
 return diff <= 30 * 24 * 60 * 60 * 1000;
 }
 return true;
 });
 }

 // Sorting
 result.sort((a, b) => {
 let aVal = a[sortField];
 let bVal = b[sortField];

 // Handle FireStore timestamp sorting
 if (sortField ==='createdAt') {
 const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
 const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
 return sortOrder ==='asc' ? aTime - bTime : bTime - aTime;
 }

 if (typeof aVal ==='string' && typeof bVal ==='string') {
 return sortOrder ==='asc' 
 ? aVal.localeCompare(bVal) 
 : bVal.localeCompare(aVal);
 }
 return 0;
 });

 setFilteredReports(result);
 setCurrentPage(1); // reset to page 1 on filter
 }, [reports, searchTerm, selectedShift, selectedArea, selectedPeriod, sortField, sortOrder]);

 // Handle Sort Toggle
 const handleSort = (field: keyof NormalizedReport) => {
 if (sortField === field) {
 setSortOrder(sortOrder ==='asc' ?'desc' :'asc');
 } else {
 setSortField(field);
 setSortOrder('asc');
 }
 };

 // Pagination compute
 const totalPages = Math.ceil(filteredReports.length / itemsPerPage) || 1;
 const indexOfLastItem = currentPage * itemsPerPage;
 const indexOfFirstItem = indexOfLastItem - itemsPerPage;
 const currentItems = filteredReports.slice(indexOfFirstItem, indexOfLastItem);

 const handleDelete = async (uuid: string) => {
 try {
 await deleteDoc(doc(db,'reports', uuid));
 setReportToDelete(null);
 } catch (e) {
 console.error('Failed to delete report:', e);
 alert('Erro ao excluir o relatório.');
 }
 };

 const handleExportExcel = () => {
 if (filteredReports.length === 0) {
 alert('Nenhum relatório para exportar.');
 return;
 }
 
 const dataToExport = filteredReports.map(r => {
 const date = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt || Date.now());
 return {
'Data/Hora': `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR')}`,
'Mina/Local': r.mineLocation ||'',
'Turno': r.shift ||'',
'Equipe': r.team ||'',
'Equipamento': r.equipment ||'',
'Nivel Combustivel': `${r.fuelLevel}%`,
'Materiais Disp.': r.availableMaterials ||''
 };
 });

 const worksheet = XLSX.utils.json_to_sheet(dataToExport);
 const workbook = XLSX.utils.book_new();
 XLSX.utils.book_append_sheet(workbook, worksheet,'Relatórios');

 // Autoajuste básico de largura das colunas
 const maxWidths = [20, 25, 10, 20, 20, 25, 30, 12, 15];
 worksheet['!cols'] = maxWidths.map(w => ({ wch: w }));

 XLSX.writeFile(workbook, `relatorios_cmoc_${new Date().toISOString().split('T')[0]}.xlsx`);
 };

 const handleClearFilters = () => {
 setSearchTerm('');
 setSelectedShift('');
 setSelectedArea('');
 setSelectedPeriod('all');
 };

 // KPI computation
 const totalCount = reports.length;
 const totalOSCount = reports.reduce((acc, curr) => acc + (curr.workOrders?.length || 0), 0);

 return (
 <div className="space-y-6 animate-in fade-in duration-200 relative">
 {/* Mini KPIs */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="glass p-4 rounded-2xl flex items-center gap-4 hover:shadow-lg transition-shadow">
 <div className="p-3 bg-primary/10 text-primary rounded-xl"><FileText size={20} /></div>
 <div>
 <div className="text-2xl font-bold text-text-primary leading-none">{totalCount}</div>
 <div className="text-xs text-text-secondary font-semibold mt-1">Total Registros</div>
 </div>
 </div>
 <div className="glass p-4 rounded-2xl flex items-center gap-4 hover:shadow-lg transition-shadow">
 <div className="p-3 bg-primary/10 text-primary rounded-xl"><ClipboardList size={20} /></div>
 <div>
 <div className="text-2xl font-bold text-text-primary leading-none">{totalOSCount}</div>
 <div className="text-xs text-text-secondary font-semibold mt-1">Total OSs Associadas</div>
 </div>
 </div>
 </div>

 {/* Title / Action bar */}
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div>
 <h1 className="text-3xl font-extrabold text-primary font-outfit">
 Módulo de Relatórios de Campo
 </h1>
 <p className="text-text-secondary text-sm">
 Gerenciamento, auditoria e exportação de diários subterrâneos.
 </p>
 </div>
 <div className="flex items-center gap-2">
 <button 
  onClick={() => setShowFilters(prev => !prev)}
  className={`flex items-center gap-2 px-4 py-3 border text-sm font-bold rounded-xl shadow-sm transition-all cursor-pointer ${
  showFilters 
  ?'bg-primary text-[var(--primary-foreground)] border-primary' 
  :'bg-surface border-border text-text-primary hover:bg-background'
  }`}
  title="Filtrar Relatórios"
  >
  <Filter size={18} />
  <span className="hidden sm:inline">Filtrar</span>
  </button>
  
  <button 
  onClick={handleExportExcel}
  className="flex items-center gap-2 px-4 py-3 bg-surface border border-border text-text-primary font-bold rounded-xl shadow-sm transition-all hover:bg-background cursor-pointer"
  >
  <Download size={18} />
  <span className="hidden sm:inline">Exportar Excel</span>
  </button>
  <Link 
  to="/reports/new"
  className="flex items-center gap-2 px-5 py-3 bg-primary hover:bg-primary-hover text-[var(--primary-foreground)] font-bold rounded-xl shadow-lg transition-all duration-200 active:scale-95"
  >
  <Plus size={18} />
  <span className="hidden sm:inline">Adicionar</span> Relatório
  </Link>
 </div>
 </div>

  {/* Advanced Filter Bar (Collapsible) */}
  <AnimatePresence>
    {showFilters && (
      <motion.div 
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
        className="glass rounded-2xl p-5 shadow-md space-y-4 overflow-hidden"
      >
        <div className="flex flex-col md:flex-row gap-4">
          {/* Smart Search */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
              <Search size={18} />
            </div>
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por OS, Supervisor, Executante, Equipamento, Área, etc..."
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm text-text-primary"
            />
          </div>
          
          {/* Period quick filter */}
          <div className="flex gap-2 shrink-0 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'today', label: 'Hoje' },
              { id: 'yesterday', label: 'Ontem' },
              { id: '7', label: '7 Dias' },
              { id: '30', label: '30 Dias' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPeriod(p.id)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  selectedPeriod === p.id 
                    ? 'bg-primary text-[var(--primary-foreground)]' 
                    : 'bg-surface-hover dark:bg-surface text-text-tertiary hover:bg-surface-hover'
                }`}
              >
                {p.label}
              </button>
            ))}
            {(searchTerm || selectedShift || selectedArea || selectedPeriod !== 'all') && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 text-xs font-bold rounded-xl transition-all bg-red-100 text-error hover:bg-red-200 dark:bg-red-950/20"
                title="Limpar Filtros"
              >
                <X size={14} className="inline-block mr-1"/> Limpar
              </button>
            )}
          </div>
        </div>

        {/* Dropdowns filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-border/80">
          <select 
            value={selectedShift} 
            onChange={(e) => setSelectedShift(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-background dark:bg-background/40 border border-border dark:border-border rounded-xl focus:outline-none "
          >
            <option value="">Todos os Turnos</option>
            <option value="A">Turno A</option>
            <option value="B">Turno B</option>
            <option value="C">Turno C</option>
          </select>

          <input 
            type="text"
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            placeholder="Filtrar por Área / Mina..."
            className="px-3 py-2 text-xs font-semibold bg-background dark:bg-background/40 border border-border dark:border-border rounded-xl focus:outline-none "
          />
        </div>
      </motion.div>
    )}
  </AnimatePresence>

 {/* Table Section */}
 <div className="glass rounded-2xl shadow-md overflow-hidden">
 {loading ? (
 /* Skeleton loading */
 <div className="p-6 space-y-4">
 {[...Array(5)].map((_, i) => (
 <div key={i} className="flex items-center justify-between gap-4 h-12 bg-surface-hover dark:bg-surface rounded-xl animate-pulse"/>
 ))}
 </div>
 ) : filteredReports.length === 0 ? (
 <div className="p-12 text-center flex flex-col items-center justify-center">
 <div className="w-12 h-12 rounded-xl bg-surface-hover dark:bg-surface flex items-center justify-center mb-4 text-text-tertiary">
 <ClipboardList size={24} />
 </div>
 <h3 className="font-bold text-text-secondary text-base">Nenhum relatório encontrado</h3>
 <p className="text-text-tertiary text-xs mt-1">Experimente alterar os termos de pesquisa ou remover os filtros aplicados.</p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-background text-text-tertiary text-xs uppercase font-extrabold border-b border-border">
 <th className="px-6 py-4 cursor-pointer select-none hover:text-primary"onClick={() => handleSort('createdAt')}>
 Data / Hora {sortField ==='createdAt' && (sortOrder ==='asc' ?'▲' :'▼')}
 </th>
 <th className="px-6 py-4 cursor-pointer select-none hover:text-primary"onClick={() => handleSort('mineLocation')}>
 Mina / Local {sortField ==='mineLocation' && (sortOrder ==='asc' ?'▲' :'▼')}
 </th>
 <th className="px-6 py-4">Turno</th>
 <th className="px-6 py-4">Equipe</th>
 <th className="px-6 py-4">Equipamento</th>
 <th className="px-6 py-4">OSs Associadas</th>
 <th className="px-6 py-4 text-right">Ações</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border text-sm font-semibold">
 {currentItems.map((report) => {
 const date = report.createdAt?.toDate 
 ? report.createdAt.toDate() 
 : new Date(report.createdAt || Date.now());
 
 return (
 <tr key={report.uuid} className="hover:bg-background/40 dark:hover:bg-background/10 transition-colors">
 <td className="px-6 py-4">
 <div className="flex flex-col">
 <span className="text-primary font-bold">
 {date.toLocaleDateString('pt-BR')}
 </span>
 <span className="text-text-tertiary text-xs">
 {date.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}
 </span>
 </div>
 </td>
 <td className="px-6 py-4 text-text-primary">
 <div className="flex items-center gap-1.5">
 <MapPin size={14} className="text-primary-hover shrink-0"/>
 <span>{report.mineLocation}</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <span className="px-2 py-0.5 bg-surface-hover dark:bg-surface text-text-tertiary rounded-lg text-xs">
 Turno {report.shift ||'A'}
 </span>
 </td>
 <td className="px-6 py-4 text-text-tertiary dark:text-text-tertiary">{report.team ||'—'}</td>
 <td className="px-6 py-4 text-text-tertiary dark:text-text-tertiary">{report.equipment ||'—'}</td>
 <td className="px-6 py-4">
 <div className="flex gap-1 flex-wrap">
 {report.workOrders && report.workOrders.length > 0 ? (
 report.workOrders.map((os, idx) => (
 <span key={idx} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded border border-primary/20">
 {os.number}
 </span>
 ))
 ) : (
 <span className="text-text-tertiary text-xs">—</span>
 )}
 </div>
 </td>
 <td className="px-6 py-4 text-right">
 <div className="flex justify-end gap-2">
 <button 
 onClick={() => navigate(`/reports/${report.uuid}`)}
 className="p-1.5 text-primary hover:bg-background rounded-lg transition-colors"
 title="Visualizar Página do Relatório"
 >
 <Eye size={16} />
 </button>
 <button 
 onClick={() => navigate(`/reports/edit/${report.uuid}`)}
 className="p-1.5 text-primary-hover hover:bg-background rounded-lg transition-colors"
 title="Editar Relatório"
 >
 <Edit2 size={16} />
 </button>
 <button 
 onClick={() => setReportToDelete(report.uuid)}
 className="p-1.5 text-error hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
 title="Excluir Relatório"
 >
 <Trash2 size={16} />
 </button>
 </div>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 )}

 {/* Pagination Footer */}
 {!loading && filteredReports.length > 0 && (
 <div className="px-6 py-4 bg-background dark:bg-background/30 border-t border-slate-150 dark:border-border/80 flex justify-between items-center text-xs font-semibold text-text-tertiary">
 <span>
 Exibindo de {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredReports.length)} de {filteredReports.length} relatórios
 </span>
 <div className="flex gap-2">
 <button 
 onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
 disabled={currentPage === 1}
 className="px-3 py-1.5 rounded-lg bg-surface dark:bg-surface border border-border dark:border-border hover:bg-surface-hover disabled:opacity-50"
 >
 Anterior
 </button>
 {[...Array(totalPages)].map((_, i) => {
 const pageNum = i + 1;
 // Only show first, last, current and neighbors
 if (
 pageNum === 1 || 
 pageNum === totalPages || 
 (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
 ) {
 return (
 <button
 key={i}
 onClick={() => setCurrentPage(pageNum)}
 className={`w-8 h-8 rounded-lg ${
 currentPage === pageNum 
 ?'bg-primary text-[var(--primary-foreground)]' 
 :'bg-surface border border-border hover:bg-background text-text-secondary'
 }`}
 >
 {pageNum}
 </button>
 );
 } else if (
 pageNum === currentPage - 2 || 
 pageNum === currentPage + 2
 ) {
 return <span key={i} className="px-1 py-1 text-text-tertiary">...</span>;
 }
 return null;
 })}
 <button 
 onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
 disabled={currentPage === totalPages}
 className="px-3 py-1.5 rounded-lg bg-surface dark:bg-surface border border-border dark:border-border hover:bg-surface-hover disabled:opacity-50"
 >
 Próximo
 </button>
 </div>
 </div>
 )}
 </div>

 {/* Confirm Delete Dialog */}
 <AnimatePresence>
 {reportToDelete && (
 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
 <motion.div
 initial={{ scale: 0.95, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 exit={{ scale: 0.95, opacity: 0 }}
 className="bg-surface dark:bg-cmoc-dark-card rounded-2xl shadow-xl max-w-sm w-full p-6 border border-border/50 dark:border-border/80"
 >
 <div className="flex items-center gap-3 text-error mb-4">
 <Trash2 size={28} />
 <h3 className="text-lg font-bold font-outfit text-text-secondary ">Excluir Relatório?</h3>
 </div>
 <p className="text-xs text-text-tertiary dark:text-text-tertiary leading-relaxed mb-6">
 Esta ação é irreversível e excluirá permanentemente o relatório selecionado do banco de dados do Firebase.
 </p>
 <div className="flex justify-end gap-3 text-xs font-bold">
 <button 
 onClick={() => setReportToDelete(null)}
 className="px-4 py-2 rounded-xl bg-surface-hover dark:bg-surface hover:bg-surface-hover "
 >
 Cancelar
 </button>
 <button 
 onClick={() => handleDelete(reportToDelete)}
 className="px-4 py-2 rounded-xl bg-error hover:bg-red-600 text-[var(--primary-foreground)]"
 >
 Confirmar Exclusão
 </button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 </div>
 );
}
