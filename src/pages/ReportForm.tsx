import { useEffect, useState } from 'react';
import { db, collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from '../services/firebase';
import { normalizeReport } from '../services/dataNormalization';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { 
  ChevronLeft, Save, Plus, Trash2, FileText, Users, Fuel
} from 'lucide-react';
import { motion } from 'framer-motion';

const reportSchema = zod.object({
  mineLocation: zod.string().min(2, 'O local/mina é obrigatório'),
  shift: zod.string().min(1, 'O turno é obrigatório'),
  team: zod.string().min(2, 'A equipe é obrigatória'),
  equipment: zod.string().min(2, 'O equipamento é obrigatório'),
  fuelLevel: zod.coerce.number().min(0, 'Nível mínimo é 0%').max(100, 'Nível máximo é 100%'),
  availableMaterials: zod.string(),
  observations: zod.string(),
  status: zod.string(),
  executors: zod.array(zod.object({
    name: zod.string().min(2, 'Nome é obrigatório'),
    registration: zod.string().min(3, 'Matrícula é obrigatória')
  })).min(1, 'Adicione pelo menos um executante'),
  workOrders: zod.array(zod.object({
    number: zod.string().min(2, 'Número é obrigatório'),
    location: zod.string(),
    description: zod.string(),
    startTime: zod.string(),
    endTime: zod.string()
  }))
});

type ReportFormFields = zod.infer<typeof reportSchema>;

export default function ReportForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [activeTab, setActiveTab] = useState<'geral' | 'equipe_ordens'>('geral');

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<ReportFormFields>({
    resolver: zodResolver(reportSchema) as any,
    defaultValues: {
      mineLocation: '',
      shift: 'A',
      team: '',
      equipment: '',
      fuelLevel: 100,
      availableMaterials: '',
      observations: '',
      status: 'synced',
      executors: [{ name: '', registration: '' }],
      workOrders: [{ number: '', location: '', description: '', startTime: '', endTime: '' }]
    }
  });

  const { fields: executors, append: appendExecutor, remove: removeExecutor } = useFieldArray({
    control,
    name: 'executors'
  });

  const { fields: workOrders, append: appendOS, remove: removeOS } = useFieldArray({
    control,
    name: 'workOrders'
  });

  // Buscar dados caso seja edição
  useEffect(() => {
    if (isEdit && id) {
      const getReportData = async () => {
        try {
          const docRef = doc(db, 'reports', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const rawData = docSnap.data();
            const normalized = normalizeReport({ uuid: docSnap.id, ...rawData });
            reset({
              mineLocation: normalized.mineLocation,
              shift: normalized.shift,
              team: normalized.team,
              equipment: normalized.equipment,
              fuelLevel: normalized.fuelLevel,
              availableMaterials: normalized.availableMaterials,
              observations: normalized.observations,
              status: normalized.status,
              executors: normalized.executors.map(e => ({ name: e.name, registration: e.registration })),
              workOrders: normalized.workOrders.map(os => ({
                number: os.number,
                location: os.location,
                description: os.activities || '',
                startTime: os.startTime,
                endTime: os.endTime
              }))
            });
          } else {
            alert('Relatório não encontrado');
            navigate('/reports');
          }
        } catch (e) {
          console.error(e);
        } finally {
          setFetching(false);
        }
      };
      getReportData();
    }
  }, [id, isEdit, reset, navigate]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const payload = {
        // Form fields (Web format)
        mineLocation: data.mineLocation,
        shift: data.shift,
        team: data.team,
        equipment: data.equipment,
        fuelLevel: data.fuelLevel,
        availableMaterials: data.availableMaterials,
        observations: data.observations,
        status: data.status,
        executors: data.executors,
        workOrders: data.workOrders.map((os: any, index: number) => ({
          id: String(index + 1),
          number: os.number,
          location: os.location,
          activities: os.description,
          materialsUsed: [],
          quantityMeters: '',
          quantityPieces: '',
          startTime: os.startTime,
          endTime: os.endTime,
          status: 'Finished',
          osStatus: 'Finished',
          photoPaths: []
        })),
        
        // Mobile app format compatibility
        globalLocation: data.mineLocation,
        globalEquipment: data.equipment,
        syncStatus: data.status,
        operators: data.executors.map((e: any, index: number) => ({
          id: String(index + 1),
          name: e.name,
          registration: e.registration
        })),
        workOrdersCompatibility: data.workOrders.map((os: any, index: number) => ({
          id: String(index + 1),
          number: os.number,
          location: os.location,
          activities: os.description,
          materialsUsed: [],
          quantityMeters: '',
          quantityPieces: '',
          startTime: os.startTime,
          endTime: os.endTime,
          status: 'Finished',
          osStatus: 'Finished',
          photoPaths: []
        }))
      };

      if (isEdit && id) {
        await updateDoc(doc(db, 'reports', id), {
          ...payload,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'reports'), {
          ...payload,
          createdAt: serverTimestamp(),
          syncedAt: serverTimestamp()
        });
      }
      navigate('/reports');
    } catch (e) {
      console.error('Failed to save report:', e);
      alert('Erro ao salvar relatório no Firestore.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cmoc-purple"/>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-4 border-b border-border dark:border-border/80">
        <div className="flex items-center gap-3">
          <Link 
            to="/reports"
            className="p-2 rounded-xl bg-surface-hover dark:bg-surface hover:bg-surface-hover text-primary "
          >
            <ChevronLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-primary font-outfit">
              {isEdit ? 'Editar Relatório de Campo' : 'Novo Relatório de Campo'}
            </h1>
            <p className="text-text-tertiary dark:text-text-tertiary text-xs mt-0.5">
              Insira as informações operacionais correspondentes ao formulário coletado pelo app.
            </p>
          </div>
        </div>
        
        <button 
          onClick={handleSubmit(onSubmit)}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-success hover:bg-primary text-[var(--primary-foreground)] font-bold rounded-xl shadow-lg transition-all duration-200 hover:scale-102 disabled:opacity-50 text-sm cursor-pointer"
        >
          <Save size={16} />
          {loading ? 'Salvando...' : 'Salvar Relatório'}
        </button>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-2 border-b border-border dark:border-border/80 pb-px">
        {[
          { id: 'geral', label: '1. Dados do Relatório', icon: <FileText size={16} /> },
          { id: 'equipe_ordens', label: '2. Equipe & Ordens', icon: <Users size={16} /> }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition-all border-b-2 -mb-px ${
              activeTab === t.id 
                ? 'border-primary text-primary' 
                : 'border-transparent text-text-secondary hover:text-primary hover:border-border'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* TAB 1: DADOS DO RELATÓRIO */}
        {activeTab === 'geral' && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-2xl p-6 border border-border/50 dark:border-border/80 shadow-md space-y-5"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Mina / Local */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-primary dark:text-text-secondary uppercase tracking-wider">Mina / Localização</label>
                <input 
                  type="text"
                  {...register('mineLocation')} 
                  placeholder="ex: Mina Leste - Nível 150"
                  className="w-full px-3 py-2 bg-background dark:bg-background border border-border dark:border-border rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none text-sm"
                />
                {errors.mineLocation && <p className="text-xs text-error">{errors.mineLocation.message}</p>}
              </div>

              {/* Equipamento */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-primary dark:text-text-secondary uppercase tracking-wider">Equipamento Utilizado</label>
                <input 
                  type="text"
                  {...register('equipment')} 
                  placeholder="ex: Plataforma Articulada PT-02"
                  className="w-full px-3 py-2 bg-background dark:bg-background border border-border dark:border-border rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none text-sm"
                />
                {errors.equipment && <p className="text-xs text-error">{errors.equipment.message}</p>}
              </div>

              {/* Turno */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-primary dark:text-text-secondary uppercase tracking-wider">Turno</label>
                <select 
                  {...register('shift')} 
                  className="w-full px-3 py-2 bg-background dark:bg-background border border-border dark:border-border rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none text-sm"
                >
                  <option value="A">Turno A (07:00 - 15:00)</option>
                  <option value="B">Turno B (15:00 - 23:00)</option>
                  <option value="C">Turno C (23:00 - 07:00)</option>
                </select>
              </div>

              {/* Turma / Equipe */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-primary dark:text-text-secondary uppercase tracking-wider">Equipe / Turma</label>
                <input 
                  type="text"
                  {...register('team')} 
                  placeholder="ex: Turma Alfa"
                  className="w-full px-3 py-2 bg-background dark:bg-background border border-border dark:border-border rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none text-sm"
                />
                {errors.team && <p className="text-xs text-error">{errors.team.message}</p>}
              </div>

              {/* Nível de Combustível */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-primary dark:text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <Fuel size={14} className="text-purple-500" /> Nível de Combustível (%)
                </label>
                <input 
                  type="number"
                  {...register('fuelLevel')} 
                  placeholder="ex: 80"
                  className="w-full px-3 py-2 bg-background dark:bg-background border border-border dark:border-border rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none text-sm"
                />
                {errors.fuelLevel && <p className="text-xs text-error">{errors.fuelLevel.message}</p>}
              </div>

              {/* Materiais Disponíveis */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-primary dark:text-text-secondary uppercase tracking-wider">Materiais Disponíveis em Frente</label>
                <input 
                  type="text"
                  {...register('availableMaterials')} 
                  placeholder="ex: Tubulações reservas, fiação..."
                  className="w-full px-3 py-2 bg-background dark:bg-background border border-border dark:border-border rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none text-sm"
                />
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-primary dark:text-text-secondary uppercase tracking-wider">Observações / Relatório Geral</label>
              <textarea 
                {...register('observations')} 
                rows={5}
                placeholder="Insira as observações gerais de supervisão (equivalente ao campo observações do celular)..."
                className="w-full px-3 py-2 bg-background dark:bg-background border border-border dark:border-border rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none text-sm resize-none"
              />
            </div>
          </motion.div>
        )}

        {/* TAB 2: EQUIPES & ORDENS */}
        {activeTab === 'equipe_ordens' && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Executantes (Dynamic Array) */}
            <div className="glass rounded-2xl p-6 border border-border/50 dark:border-border/80 shadow-md space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-primary font-outfit uppercase tracking-wider text-xs">Executantes / Colaboradores</h3>
                <button
                  type="button"
                  onClick={() => appendExecutor({ name: '', registration: '' })}
                  className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 dark:bg-primary/30 text-primary text-xs font-bold rounded-lg border border-primary/20 hover:bg-primary/10 cursor-pointer"
                >
                  <Plus size={14} /> Add Operador
                </button>
              </div>

              {errors.executors?.message && (
                <p className="text-xs text-error">{errors.executors.message}</p>
              )}

              <div className="space-y-3">
                {executors.map((field, idx) => (
                  <div key={field.id} className="flex gap-4 items-center">
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <input 
                        type="text"
                        {...register(`executors.${idx}.name` as const)} 
                        placeholder="Nome do operador"
                        className="w-full px-3 py-2 bg-background dark:bg-background border border-border dark:border-border rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none text-xs"
                      />
                      <input 
                        type="text"
                        {...register(`executors.${idx}.registration` as const)} 
                        placeholder="Matrícula"
                        className="w-full px-3 py-2 bg-background dark:bg-background border border-border dark:border-border rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none text-xs"
                      />
                    </div>
                    {executors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeExecutor(idx)}
                        className="p-2 text-error hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl shrink-0 cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Ordens de Serviço (OS) */}
            <div className="glass rounded-2xl p-6 border border-border/50 dark:border-border/80 shadow-md space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-primary font-outfit uppercase tracking-wider text-xs">Ordens de Serviço (OS)</h3>
                <button
                  type="button"
                  onClick={() => appendOS({ number: '', location: '', description: '', startTime: '', endTime: '' })}
                  className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 dark:bg-primary/30 text-primary text-xs font-bold rounded-lg border border-primary/20 hover:bg-primary/10 cursor-pointer"
                >
                  <Plus size={14} /> Add OS
                </button>
              </div>

              <div className="space-y-4">
                {workOrders.map((field, idx) => (
                  <div key={field.id} className="p-4 bg-surface-hover/50 dark:bg-background/50 rounded-2xl border border-border flex gap-4 items-start">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-text-tertiary">Nº da OS</label>
                        <input 
                          type="text"
                          {...register(`workOrders.${idx}.number` as const)} 
                          placeholder="ex: OS-4039"
                          className="w-full px-3 py-1.5 bg-surface dark:bg-background border border-border dark:border-border rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none text-xs"
                        />
                        {errors.workOrders?.[idx]?.number && (
                          <p className="text-[10px] text-error">{errors.workOrders[idx]?.number?.message}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-text-tertiary">Local da OS</label>
                        <input 
                          type="text"
                          {...register(`workOrders.${idx}.location` as const)} 
                          placeholder="ex: Frente N1"
                          className="w-full px-3 py-1.5 bg-surface dark:bg-background border border-border dark:border-border rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] uppercase font-bold text-text-tertiary">Início</label>
                            <input 
                              type="text"
                              {...register(`workOrders.${idx}.startTime` as const)} 
                              placeholder="ex: 08:30"
                              className="w-full px-3 py-1.5 bg-surface dark:bg-background border border-border dark:border-border rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase font-bold text-text-tertiary">Término</label>
                            <input 
                              type="text"
                              {...register(`workOrders.${idx}.endTime` as const)} 
                              placeholder="ex: 11:45"
                              className="w-full px-3 py-1.5 bg-surface dark:bg-background border border-border dark:border-border rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none text-xs"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1 md:col-span-3">
                        <label className="text-[10px] uppercase font-bold text-text-tertiary">Atividades executadas na OS</label>
                        <input 
                          type="text"
                          {...register(`workOrders.${idx}.description` as const)} 
                          placeholder="Drenagem de água subterrânea na via principal..."
                          className="w-full px-3 py-1.5 bg-surface dark:bg-background border border-border dark:border-border rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none text-xs"
                        />
                      </div>
                    </div>
                    {workOrders.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeOS(idx)}
                        className="p-2 text-error hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl mt-4 cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </form>
    </div>
  );
}
