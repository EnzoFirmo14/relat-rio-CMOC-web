import { useEffect, useState } from 'react';
import { db, collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from '../services/firebase';
import { normalizeReport } from '../services/dataNormalization';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { 
  ChevronLeft, Save, Plus, Trash2, ShieldAlert, HardHat, FileText 
} from 'lucide-react';
import { motion } from 'framer-motion';

const reportSchema = zod.object({
  mineLocation: zod.string().min(2, 'O local/mina é obrigatório'),
  shift: zod.string().min(1, 'O turno é obrigatório'),
  team: zod.string().min(2, 'A equipe é obrigatória'),
  equipment: zod.string().min(2, 'O equipamento é obrigatório'),
  supervisorName: zod.string().min(2, 'O nome do supervisor é obrigatório'),
  responsibleCompany: zod.string().min(2, 'A empresa é obrigatória'),
  activityType: zod.string().min(2, 'O tipo de atividade é obrigatório'),
  description: zod.string().min(5, 'A descrição deve ter mais de 5 caracteres'),
  objective: zod.string(),
  materials: zod.string(),
  toolsUsed: zod.string(),
  priority: zod.string(),
  riskLevel: zod.string(),
  workPermit: zod.string(),
  weatherCondition: zod.string(),
  gpsCoordinates: zod.string(),
  observations: zod.string(),
  problemsFound: zod.string(),
  correctiveActions: zod.string(),
  nextActivities: zod.string(),
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
  const [activeTab, setActiveTab] = useState<'geral' | 'recursos' | 'seguranca'>('geral');

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<ReportFormFields>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      mineLocation: '',
      shift: 'A',
      team: '',
      equipment: '',
      supervisorName: 'Eng. Pedro Santos',
      responsibleCompany: 'CMOC Brasil',
      activityType: '',
      description: '',
      objective: '',
      materials: '',
      toolsUsed: '',
      priority: 'Baixa',
      riskLevel: 'Baixo',
      workPermit: '',
      weatherCondition: 'Encoberto',
      gpsCoordinates: '',
      observations: '',
      problemsFound: '',
      correctiveActions: '',
      nextActivities: '',
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

  // Fetch data if editing
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
              supervisorName: normalized.supervisorName,
              responsibleCompany: normalized.responsibleCompany,
              activityType: normalized.activityType,
              description: normalized.description || normalized.observations,
              objective: normalized.objective,
              materials: normalized.materials,
              toolsUsed: normalized.toolsUsed,
              priority: normalized.priority,
              riskLevel: normalized.riskLevel,
              workPermit: normalized.workPermit,
              weatherCondition: normalized.weatherCondition,
              gpsCoordinates: normalized.gpsCoordinates,
              observations: normalized.observations || normalized.description,
              problemsFound: normalized.problemsFound,
              correctiveActions: normalized.correctiveActions,
              nextActivities: normalized.nextActivities,
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

  const onSubmit = async (data: ReportFormFields) => {
    setLoading(true);
    try {
      const payload = {
        // Form fields (Web format)
        mineLocation: data.mineLocation,
        shift: data.shift,
        team: data.team,
        equipment: data.equipment,
        supervisorName: data.supervisorName,
        responsibleCompany: data.responsibleCompany,
        activityType: data.activityType,
        description: data.description,
        objective: data.objective,
        materials: data.materials,
        toolsUsed: data.toolsUsed,
        priority: data.priority,
        riskLevel: data.riskLevel,
        workPermit: data.workPermit,
        weatherCondition: data.weatherCondition,
        gpsCoordinates: data.gpsCoordinates,
        observations: data.observations || data.description,
        problemsFound: data.problemsFound,
        correctiveActions: data.correctiveActions,
        nextActivities: data.nextActivities,
        status: data.status,
        executors: data.executors,
        
        // Mobile app format compatibility
        globalLocation: data.mineLocation,
        globalEquipment: data.equipment,
        syncStatus: data.status,
        operators: data.executors.map((e, index) => ({
          id: String(index + 1),
          name: e.name,
          registration: e.registration
        })),
        workOrders: data.workOrders.map((os, index) => ({
          id: String(index + 1),
          number: os.number,
          location: os.location,
          activities: os.description, // mobile uses activities
          materialsUsed: os.description ? [os.description] : [], // mobile uses materialsUsed List
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
      console.error('Failed to save report: ', e);
      alert('Erro ao salvar relatório no Firestore.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cmoc-purple" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <Link 
            to="/reports"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-cmoc-blue dark:text-white"
          >
            <ChevronLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-cmoc-blue dark:text-white font-outfit">
              {isEdit ? 'Editar Relatório de Campo' : 'Novo Relatório de Campo'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
              Insira as informações de supervisão subterrânea e ordens operacionais.
            </p>
          </div>
        </div>
        
        <button 
          onClick={handleSubmit(onSubmit)}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-cmoc-green hover:bg-cmoc-purple text-white font-bold rounded-xl shadow-lg transition-all duration-200 hover:scale-102 disabled:opacity-50 text-sm cursor-pointer"
        >
          <Save size={16} />
          {loading ? 'Salvando...' : 'Salvar Relatório'}
        </button>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-px">
        {[
          { id: 'geral', label: '1. Identificação Geral', icon: <FileText size={16} /> },
          { id: 'recursos', label: '2. Equipe & Ordens', icon: <HardHat size={16} /> },
          { id: 'seguranca', label: '3. Segurança & Observações', icon: <ShieldAlert size={16} /> }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all border-b-2 -mb-px ${
              activeTab === t.id 
                ? 'border-cmoc-purple text-cmoc-purple dark:text-cmoc-purple/80' 
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-white'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* TAB 1: IDENTIFICAÇÃO GERAL */}
        {activeTab === 'geral' && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/80 shadow-md space-y-5"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Mina / Local */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-cmoc-blue dark:text-slate-300 uppercase tracking-wider">Mina / Localização</label>
                <input 
                  type="text" 
                  {...register('mineLocation')} 
                  placeholder="ex: Mina Leste - Nível 150"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none dark:text-white text-sm"
                />
                {errors.mineLocation && <p className="text-xs text-red-500">{errors.mineLocation.message}</p>}
              </div>

              {/* Turno */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-cmoc-blue dark:text-slate-300 uppercase tracking-wider">Turno</label>
                <select 
                  {...register('shift')} 
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none dark:text-white text-sm"
                >
                  <option value="A">Turno A (07:00 - 15:00)</option>
                  <option value="B">Turno B (15:00 - 23:00)</option>
                  <option value="C">Turno C (23:00 - 07:00)</option>
                </select>
              </div>

              {/* Supervisor */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-cmoc-blue dark:text-slate-300 uppercase tracking-wider">Supervisor Responsável</label>
                <input 
                  type="text" 
                  {...register('supervisorName')} 
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none dark:text-white text-sm"
                />
                {errors.supervisorName && <p className="text-xs text-red-500">{errors.supervisorName.message}</p>}
              </div>

              {/* Empresa */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-cmoc-blue dark:text-slate-300 uppercase tracking-wider">Empresa Contratante</label>
                <input 
                  type="text" 
                  {...register('responsibleCompany')} 
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none dark:text-white text-sm"
                />
                {errors.responsibleCompany && <p className="text-xs text-red-500">{errors.responsibleCompany.message}</p>}
              </div>

              {/* Tipo de atividade */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-cmoc-blue dark:text-slate-300 uppercase tracking-wider">Tipo de Atividade</label>
                <input 
                  type="text" 
                  {...register('activityType')} 
                  placeholder="ex: Lavra subterrânea, Instalação hidráulica..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none dark:text-white text-sm"
                />
                {errors.activityType && <p className="text-xs text-red-500">{errors.activityType.message}</p>}
              </div>

              {/* Equipamento */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-cmoc-blue dark:text-slate-300 uppercase tracking-wider">Equipamento Utilizado</label>
                <input 
                  type="text" 
                  {...register('equipment')} 
                  placeholder="ex: Caminhão LHD 04"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none dark:text-white text-sm"
                />
                {errors.equipment && <p className="text-xs text-red-500">{errors.equipment.message}</p>}
              </div>
            </div>

            {/* Descrição e objetivo */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-cmoc-blue dark:text-slate-300 uppercase tracking-wider">Descrição Detalhada das Atividades</label>
                <textarea 
                  {...register('description')} 
                  rows={4}
                  placeholder="Descreva as tarefas realizadas pelo operador..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none dark:text-white text-sm resize-none"
                />
                {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-cmoc-blue dark:text-slate-300 uppercase tracking-wider">Objetivo Operacional</label>
                <input 
                  type="text" 
                  {...register('objective')} 
                  placeholder="ex: Avanço de 15 metros no subsolo..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none dark:text-white text-sm"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: RECURSOS, EQUIPES & ORDENS */}
        {activeTab === 'recursos' && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Equipe / Turma */}
            <div className="glass rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/80 shadow-md space-y-4">
              <h3 className="text-sm font-bold text-cmoc-blue dark:text-white font-outfit uppercase tracking-wider text-xs">Informações da Turma</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-cmoc-blue dark:text-slate-300 uppercase tracking-wider">Equipe / Turma</label>
                  <input 
                    type="text" 
                    {...register('team')} 
                    placeholder="ex: Turma Alfa"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none dark:text-white text-sm"
                  />
                  {errors.team && <p className="text-xs text-red-500">{errors.team.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-cmoc-blue dark:text-slate-300 uppercase tracking-wider">Materiais Utilizados</label>
                  <input 
                    type="text" 
                    {...register('materials')} 
                    placeholder="ex: Tubos PVC, Conectores elétricos..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none dark:text-white text-sm"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-cmoc-blue dark:text-slate-300 uppercase tracking-wider">Ferramentas Utilizadas</label>
                  <input 
                    type="text" 
                    {...register('toolsUsed')} 
                    placeholder="ex: Furadeira de impacto, Cabos de guincho..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none dark:text-white text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Executantes (Dynamic Array) */}
            <div className="glass rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/80 shadow-md space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-cmoc-blue dark:text-white font-outfit uppercase tracking-wider text-xs">Executantes / Colaboradores</h3>
                <button
                  type="button"
                  onClick={() => appendExecutor({ name: '', registration: '' })}
                  className="flex items-center gap-1.5 px-3 py-1 bg-cmoc-blue/10 dark:bg-cmoc-blue/30 text-cmoc-blue dark:text-white text-xs font-bold rounded-lg border border-cmoc-blue/20 hover:bg-cmoc-purple/10 cursor-pointer"
                >
                  <Plus size={14} /> Add Operador
                </button>
              </div>

              {errors.executors?.message && (
                <p className="text-xs text-red-500">{errors.executors.message}</p>
              )}

              <div className="space-y-3">
                {executors.map((field, idx) => (
                  <div key={field.id} className="flex gap-4 items-center">
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <input 
                        type="text" 
                        {...register(`executors.${idx}.name` as const)} 
                        placeholder="Nome do operador"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none dark:text-white text-xs"
                      />
                      <input 
                        type="text" 
                        {...register(`executors.${idx}.registration` as const)} 
                        placeholder="Matrícula"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none dark:text-white text-xs"
                      />
                    </div>
                    {executors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeExecutor(idx)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl shrink-0 cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Ordens de Serviço (OS) */}
            <div className="glass rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/80 shadow-md space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-cmoc-blue dark:text-white font-outfit uppercase tracking-wider text-xs">Ordens de Serviço (OS)</h3>
                <button
                  type="button"
                  onClick={() => appendOS({ number: '', location: '', description: '', startTime: '', endTime: '' })}
                  className="flex items-center gap-1.5 px-3 py-1 bg-cmoc-blue/10 dark:bg-cmoc-blue/30 text-cmoc-blue dark:text-white text-xs font-bold rounded-lg border border-cmoc-blue/20 hover:bg-cmoc-purple/10 cursor-pointer"
                >
                  <Plus size={14} /> Add OS
                </button>
              </div>

              <div className="space-y-4">
                {workOrders.map((field, idx) => (
                  <div key={field.id} className="p-4 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-850 flex gap-4 items-start">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Nº da OS</label>
                        <input 
                          type="text" 
                          {...register(`workOrders.${idx}.number` as const)} 
                          placeholder="ex: OS-4039"
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none dark:text-white text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Início</label>
                        <input 
                          type="text" 
                          {...register(`workOrders.${idx}.startTime` as const)} 
                          placeholder="ex: 08:30"
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none dark:text-white text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Término</label>
                        <input 
                          type="text" 
                          {...register(`workOrders.${idx}.endTime` as const)} 
                          placeholder="ex: 11:45"
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none dark:text-white text-xs"
                        />
                      </div>
                      <div className="space-y-1 md:col-span-3">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Atividades executadas na OS</label>
                        <input 
                          type="text" 
                          {...register(`workOrders.${idx}.description` as const)} 
                          placeholder="Drenagem de água subterrânea na via principal..."
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none dark:text-white text-xs"
                        />
                      </div>
                    </div>
                    {workOrders.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeOS(idx)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl mt-4 cursor-pointer"
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

        {/* TAB 3: SEGURANÇA & OBSERVAÇÕES */}
        {activeTab === 'seguranca' && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/80 shadow-md space-y-5"
          >
            <h3 className="text-sm font-bold text-cmoc-blue dark:text-white font-outfit uppercase tracking-wider text-xs">Riscos, Condições Climáticas e Observações</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Prioridade */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-cmoc-blue dark:text-slate-300 uppercase tracking-wider">Prioridade</label>
                <select 
                  {...register('priority')} 
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none dark:text-white text-sm"
                >
                  <option value="Baixa">🟢 Baixa</option>
                  <option value="Media">🟡 Média</option>
                  <option value="Alta">🔴 Alta</option>
                  <option value="Critica">🚨 Crítica</option>
                </select>
              </div>

              {/* Risco */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-cmoc-blue dark:text-slate-300 uppercase tracking-wider">Nível de Risco Operacional</label>
                <select 
                  {...register('riskLevel')} 
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none dark:text-white text-sm"
                >
                  <option value="Baixo">Baixo</option>
                  <option value="Medio">Médio</option>
                  <option value="Alto">Alto</option>
                </select>
              </div>

              {/* PT (Permissão de Trabalho) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-cmoc-blue dark:text-slate-300 uppercase tracking-wider">Permissão de Trabalho (PT)</label>
                <input 
                  type="text" 
                  {...register('workPermit')} 
                  placeholder="ex: PT-70493-2026"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none dark:text-white text-sm"
                />
              </div>

              {/* Clima */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-cmoc-blue dark:text-slate-300 uppercase tracking-wider">Condição Climática</label>
                <input 
                  type="text" 
                  {...register('weatherCondition')} 
                  placeholder="ex: Encoberto / Estável"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none dark:text-white text-sm"
                />
              </div>

              {/* GPS Coordenadas */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-cmoc-blue dark:text-slate-300 uppercase tracking-wider">Coordenadas GPS (Mina Subterrânea)</label>
                <input 
                  type="text" 
                  {...register('gpsCoordinates')} 
                  placeholder="-18.156743, -47.925439 (X: 430, Y: 120, Z: -150m)"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none dark:text-white text-sm"
                />
              </div>
            </div>

            {/* Problemas, Recomendações e Próximas */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-cmoc-blue dark:text-slate-300 uppercase tracking-wider">Problemas Encontrados (Se houver)</label>
                <textarea 
                  {...register('problemsFound')} 
                  rows={2}
                  placeholder="Relate inconformidades, falhas mecânicas ou riscos..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none dark:text-white text-sm resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-cmoc-blue dark:text-slate-300 uppercase tracking-wider">Ações Corretivas Executadas</label>
                <input 
                  type="text" 
                  {...register('correctiveActions')} 
                  placeholder="Qual medida imediata foi tomada..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none dark:text-white text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-cmoc-blue dark:text-slate-300 uppercase tracking-wider">Próximas Atividades Mapeadas</label>
                <input 
                  type="text" 
                  {...register('nextActivities')} 
                  placeholder="Planejamento para o turno seguinte..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none dark:text-white text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-cmoc-blue dark:text-slate-300 uppercase tracking-wider">Observações Finais</label>
                <textarea 
                  {...register('observations')} 
                  rows={3}
                  placeholder="Digite observações extras de supervisão..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-cmoc-purple focus:outline-none dark:text-white text-sm resize-none"
                />
              </div>
            </div>
          </motion.div>
        )}
      </form>
    </div>
  );
}
