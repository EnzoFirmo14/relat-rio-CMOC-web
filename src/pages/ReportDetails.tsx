import { useEffect, useState } from 'react';
import { db, doc, getDoc } from '../services/firebase';
import { normalizeReport } from '../services/dataNormalization';
import type { NormalizedReport } from '../services/dataNormalization';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ChevronLeft, Edit3, Share2, Printer, MapPin, Users, Wrench, Fuel, HardHat, FileText, Camera
} from 'lucide-react';

export default function ReportDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<NormalizedReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const getReport = async () => {
        try {
          const docRef = doc(db, 'reports', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setReport(normalizeReport({ uuid: docSnap.id, ...docSnap.data() }));
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
      getReport();
    }
  }, [id, navigate]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Relatório CMOC - ${report?.mineLocation}`,
        text: `Confira o relatório operacional da mina no turno ${report?.shift || 'A'}.`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cmoc-purple"/>
      </div>
    );
  }

  if (!report) return null;

  const date = report.createdAt?.toDate 
    ? report.createdAt.toDate() 
    : new Date(report.createdAt || Date.now());

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
          </div>
          <div>
            <p className="text-text-tertiary dark:text-text-tertiary text-xs mt-0.5">
              Criado em {date.toLocaleDateString('pt-BR')} às {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        <div className="flex gap-2 text-xs font-bold w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button 
            onClick={() => navigate(`/reports/edit/${report.uuid}`)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-surface-hover hover:bg-surface-hover dark:bg-surface dark:hover:bg-surface-hover text-text-secondary rounded-xl cursor-pointer"
          >
            <Edit3 size={14} /> Editar
          </button>
          <button 
            onClick={handleShare}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-surface-hover hover:bg-surface-hover dark:bg-surface dark:hover:bg-surface-hover text-text-secondary rounded-xl cursor-pointer"
          >
            <Share2 size={14} /> Compartilhar
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary text-[var(--primary-foreground)] rounded-xl shadow-md cursor-pointer"
          >
            <Printer size={14} /> Imprimir / PDF
          </button>
        </div>
      </div>

      {/* Main Print Title Header (Only visible on Print) */}
      <div className="hidden print:flex justify-between items-center border-b-2 border-primary pb-4 mb-6">
        <div>
          <img src="/logo.svg" alt="CMOC Logo" className="h-10 mb-2" />
          <h1 className="text-xl font-bold text-primary uppercase">CMOC Brasil — Diário de Campo Subterrâneo</h1>
          <p className="text-[10px] text-text-tertiary">ID do Relatório: {report.uuid.toUpperCase()}</p>
        </div>
        <div className="text-right text-[10px] text-text-tertiary">
          <div>Emissão: {new Date().toLocaleDateString('pt-BR')}</div>
          <div>Mina: {report.mineLocation}</div>
          <div>Turno: {report.shift}</div>
        </div>
      </div>

      {/* Two Column Layout (On print, prints vertically/full width) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:flex print:flex-col print:gap-5 print:space-y-0">
        {/* LEFT COLUMN: DADOS OPERACIONAIS & EQUIPE */}
        <div className="lg:col-span-1 space-y-6 print:w-full print:space-y-5">
          
          {/* Card: Identificação do Relatório */}
          <div className="glass rounded-2xl p-5 border border-border/50 dark:border-border/80 shadow-md space-y-4 print:border-slate-350 print:shadow-none print:p-4 print:rounded-lg print:bg-white">
            <h3 className="text-xs font-bold text-primary font-outfit uppercase tracking-wider flex items-center gap-1.5">
              <MapPin size={15} className="text-purple-500 print:text-black" /> Identificação Geral
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs font-semibold space-y-2.5 pt-1">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/80 print:border-slate-200">
                <span className="text-text-tertiary">Mina / Local:</span>
                <span className="text-text-primary">{report.mineLocation || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/80 print:border-slate-200">
                <span className="text-text-tertiary">Turno:</span>
                <span className="text-text-primary">Turno {report.shift || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/80 print:border-slate-200">
                <span className="text-text-tertiary">Turma / Equipe:</span>
                <span className="text-text-primary">{report.team || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/80 print:border-slate-200">
                <span className="text-text-tertiary">Equipamento:</span>
                <span className="text-text-primary">{report.equipment || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/80 print:border-slate-200">
                <span className="text-text-tertiary flex items-center gap-1"><Fuel size={12} className="text-purple-500 print:text-black" /> Nível Combustível:</span>
                <span className="text-text-primary">{report.fuelLevel || 0}%</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-text-tertiary flex items-center gap-1"><HardHat size={12} className="text-purple-500 print:text-black" /> Materiais Disponíveis:</span>
                <span className="text-text-primary text-right max-w-[150px] truncate" title={report.availableMaterials}>{report.availableMaterials || 'Nenhum'}</span>
              </div>
            </div>
          </div>

          {/* Card: Equipe em Campo */}
          <div className="glass rounded-2xl p-5 border border-border/50 dark:border-border/80 shadow-md space-y-4 print:border-slate-350 print:shadow-none print:p-4 print:rounded-lg print:bg-white">
            <h3 className="text-xs font-bold text-primary font-outfit uppercase tracking-wider flex items-center gap-1.5">
              <Users size={15} className="text-purple-500 print:text-black" /> Equipe em Campo ({report.executors?.length || 0})
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 print:divide-slate-200">
              {report.executors && report.executors.length > 0 ? (
                report.executors.map((e, idx) => (
                  <div key={idx} className="py-2 flex justify-between items-center text-xs font-semibold border-b border-slate-100 dark:border-slate-800/80 print:border-slate-200 last:border-0">
                    <span className="text-text-secondary">{e.name}</span>
                    <span className="text-text-tertiary font-mono">Reg: {e.registration}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-text-tertiary py-3 text-center">Nenhum operador cadastrado.</div>
              )}
            </div>
          </div>

          {/* Card: Observações do Diário */}
          <div className="glass rounded-2xl p-5 border border-border/50 dark:border-border/80 shadow-md space-y-3 print:border-slate-350 print:shadow-none print:p-4 print:rounded-lg print:bg-white">
            <h3 className="text-xs font-bold text-primary font-outfit uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={15} className="text-purple-500 print:text-black" /> Observações do Relatório
            </h3>
            <p className="text-text-secondary dark:text-text-secondary text-xs leading-relaxed whitespace-pre-wrap pt-1 font-medium">
              {report.observations || 'Nenhuma observação extra registrada.'}
            </p>
          </div>

        </div>

        {/* RIGHT COLUMN: ORDENS DE SERVIÇO */}
        <div className="lg:col-span-2 space-y-6 print:w-full print:space-y-5">
          <div className="glass rounded-2xl p-6 border border-border/50 dark:border-border/80 shadow-md space-y-4 print:border-slate-350 print:shadow-none print:p-4 print:rounded-lg print:bg-white">
            <h3 className="text-sm font-bold text-primary font-outfit uppercase tracking-wider text-xs flex items-center gap-2">
              <Wrench size={16} className="text-purple-500 print:text-black" /> Ordens de Serviço (OS) ({report.workOrders?.length || 0})
            </h3>
            
            <div className="space-y-4 print:space-y-3">
              {report.workOrders && report.workOrders.length > 0 ? (
                report.workOrders.map((os, idx) => (
                  <div key={idx} className="p-4 bg-background/50 border border-border rounded-xl text-xs space-y-3 print:bg-white print:border-slate-200 print:rounded-lg print:p-3 print:shadow-none">
                    <div className="flex justify-between items-center font-bold text-primary border-b border-border/50 pb-2 print:border-slate-200">
                      <span className="text-xs font-extrabold font-outfit">Ordem de Serviço #{os.number || 'N/A'}</span>
                      <span className="px-2 py-0.5 bg-surface-hover dark:bg-surface rounded text-[10px] text-text-tertiary font-mono print:bg-slate-100 print:text-black">
                        {os.startTime || '--:--'} - {os.endTime || '--:--'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-text-secondary font-semibold">
                      {os.location && (
                        <div>
                          <span className="text-[10px] uppercase text-text-tertiary font-bold block">Local da OS</span>
                          <span className="text-text-primary">{os.location}</span>
                        </div>
                      )}
                      {os.osStatus && (
                        <div>
                          <span className="text-[10px] uppercase text-text-tertiary font-bold block">Status</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold inline-block mt-0.5 ${
                            os.osStatus === 'Concluída' || os.osStatus === 'Finished' ? 'bg-green-100 dark:bg-green-950/20 text-success border border-success/20 print:bg-green-50 print:text-green-800' : 'bg-yellow-100 dark:bg-yellow-950/20 text-yellow-600 border border-yellow-500/20 print:bg-yellow-50 print:text-yellow-800'
                          }`}>{os.osStatus}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase text-text-tertiary font-bold block mb-1">Atividades Executadas</span>
                      <p className="text-text-secondary font-medium whitespace-pre-wrap bg-surface-hover/30 dark:bg-surface/30 p-2.5 rounded-lg border border-border/20 print:bg-slate-50 print:border-slate-150">{os.activities}</p>
                    </div>

                    {/* Exibição de Anexo Fotográfico da OS */}
                    {os.photoPaths && os.photoPaths.length > 0 && (
                      <div className="pt-2 print:avoid-break">
                        <span className="text-[10px] uppercase text-text-tertiary font-bold block mb-2 flex items-center gap-1">
                          <Camera size={12} className="text-purple-500 print:text-black" /> Fotos em Anexo ({os.photoPaths.length})
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 print:flex print:flex-wrap print:gap-2">
                          {os.photoPaths.map((photo, pIdx) => (
                            <div key={pIdx} className="relative aspect-video rounded-lg overflow-hidden border border-border bg-background print:w-28 print:h-20 print:rounded">
                              <img 
                                src={photo} 
                                alt={`Foto ${pIdx + 1} da OS ${os.number}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-xs text-text-tertiary py-8 text-center bg-background/30 rounded-xl border border-dashed border-border/80">
                  Nenhuma ordem de serviço registrada para este diário.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
