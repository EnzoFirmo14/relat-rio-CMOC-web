import { useEffect, useState } from 'react';
import { db, collection, onSnapshot, query, orderBy } from '../services/firebase';
import { normalizeReport } from '../services/dataNormalization';
import type { NormalizedReport } from '../services/dataNormalization';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend
} from 'recharts';
import { 
  FileText, Users, Truck, Wrench, Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';

const COLORS = ['#5C3FA3', '#74BE45', '#3B82F6', '#F59E0B', '#EF4444', '#10B981', '#EC4899'];

const getColorStyles = (color: string) => {
  switch (color) {
    case 'blue':
      return 'border-blue-100 dark:border-blue-950/30 bg-blue-50/10 dark:bg-blue-950/5';
    case 'green':
      return 'border-green-100 dark:border-green-950/30 bg-green-50/10 dark:bg-green-950/5';
    case 'purple':
      return 'border-purple-100 dark:border-purple-950/30 bg-purple-50/10 dark:bg-purple-950/5';
    case 'teal':
      return 'border-teal-100 dark:border-teal-950/30 bg-teal-50/10 dark:bg-teal-950/5';
    default:
      return 'border-border dark:border-border/80';
  }
};

export default function Dashboard() {
  const mockEnabled = useSelector((state: RootState) => state.ui.mockEnabled);
  const [reports, setReports] = useState<NormalizedReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => normalizeReport({ uuid: doc.id, ...doc.data() }));
      setReports(docs);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching reports:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Compute metrics
  const todayReportsCount = reports.filter(r => {
    if (!r.createdAt) return false;
    const date = r.createdAt.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
    return date.toDateString() === new Date().toDateString();
  }).length;

  const totalReports = reports.length;
  const activeCollaborators = new Set(reports.flatMap(r => r.executors || []).map(e => e.name || e.registration)).size || (mockEnabled ? 14 : 0);
  const activeEquipments = new Set(reports.map(r => r.equipment).filter(Boolean)).size || (mockEnabled ? 4 : 0);
  const completedOrders = reports.reduce((acc, r) => acc + (r.workOrders?.length || 0), 0) || (mockEnabled ? 8 : 0);

  // Simple clean KPIs based only on app data
  const kpis = [
    { id: 'relatorios_dia', label: 'Relatórios do Dia', value: todayReportsCount || totalReports, icon: <FileText size={20} />, color: 'blue', valueColor: 'text-primary', badge: 'Meta: 10', badgeColor: 'bg-primary/10 text-primary' },
    { id: 'ordens_concluidas', label: 'Ordens de Serviço', value: completedOrders, icon: <Wrench size={20} />, color: 'green', valueColor: 'text-success', badge: 'OSs vinculadas', badgeColor: 'bg-success/10 text-success' },
    { id: 'equipamentos_ativos', label: 'Equipamentos Utilizados', value: activeEquipments, icon: <Truck size={20} />, color: 'purple', valueColor: 'text-primary', badge: 'Modelos distintos', badgeColor: 'bg-primary/10 text-primary' },
    { id: 'colaboradores_ativos', label: 'Operadores Ativos', value: activeCollaborators, icon: <Users size={20} />, color: 'teal', valueColor: 'text-info', badge: 'Turmas em campo', badgeColor: 'bg-info/10 text-info' },
  ];

  // Graph 1: Relatórios por Local (Mina)
  const areaMap: { [key: string]: number } = {};
  reports.forEach(r => {
    const loc = r.mineLocation || 'Sem Local';
    areaMap[loc] = (areaMap[loc] || 0) + 1;
  });
  const areaData = Object.keys(areaMap).map(name => ({
    name,
    value: areaMap[name]
  })).sort((a, b) => b.value - a.value).slice(0, 4);

  if (areaData.length === 0 && mockEnabled) {
    areaData.push({ name: 'Mina Leste', value: 8 });
    areaData.push({ name: 'Mina Oeste', value: 5 });
    areaData.push({ name: 'Nível 150', value: 4 });
  }

  // Graph 2: Relatórios por Equipe (Turma)
  const teamMap: { [key: string]: number } = {};
  reports.forEach(r => {
    const team = r.team || 'Sem Equipe';
    teamMap[team] = (teamMap[team] || 0) + 1;
  });
  const teamData = Object.keys(teamMap).map(name => ({
    name,
    Relatorios: teamMap[name]
  })).sort((a, b) => b.Relatorios - a.Relatorios).slice(0, 4);

  if (teamData.length === 0 && mockEnabled) {
    teamData.push({ name: 'Turma Alfa', Relatorios: 12 });
    teamData.push({ name: 'Turma Beta', Relatorios: 8 });
    teamData.push({ name: 'Turma Gama', Relatorios: 15 });
  }

  // Graph 3: Atividade por Turno (Turno A, B, C)
  const shiftMap: { [key: string]: { Relatórios: number, Ordens: number } } = {
    'A': { Relatórios: 0, Ordens: 0 },
    'B': { Relatórios: 0, Ordens: 0 },
    'C': { Relatórios: 0, Ordens: 0 }
  };
  reports.forEach(r => {
    const shift = r.shift || 'A';
    if (shiftMap[shift]) {
      shiftMap[shift].Relatórios += 1;
      shiftMap[shift].Ordens += (r.workOrders?.length || 0);
    }
  });
  const shiftData = Object.keys(shiftMap).map(name => ({
    name: `Turno ${name}`,
    Relatórios: shiftMap[name].Relatórios,
    Ordens: shiftMap[name].Ordens
  }));

  if (shiftData.every(d => d.Relatórios === 0) && mockEnabled) {
    shiftData[0] = { name: 'Turno A', Relatórios: 10, Ordens: 14 };
    shiftData[1] = { name: 'Turno B', Relatórios: 6, Ordens: 8 };
    shiftData[2] = { name: 'Turno C', Relatórios: 4, Ordens: 5 };
  }

  // Graph 4: Produtividade Diária (Últimos 5 dias)
  const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
  const dayCounts = [0, 0, 0, 0, 0];
  reports.forEach(r => {
    if (!r.createdAt) return;
    const date = r.createdAt.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
    const day = date.getDay(); // 0 = Sunday, 1 = Monday...
    if (day >= 1 && day <= 5) {
      dayCounts[day - 1] += 1;
    }
  });
  const productivityData = dayNames.map((dayName, idx) => {
    const count = dayCounts[idx];
    const efficiency = Math.min(75 + count * 6, 96);
    return {
      day: dayName,
      Produtividade: count > 0 ? efficiency : (mockEnabled ? (75 + Math.floor(Math.random() * 15)) : 0)
    };
  });

  // Equipamentos Utilizados Aggregation
  const equipmentUsageMap: { [key: string]: { count: number; lastUsed: Date | null } } = {};
  reports.forEach(r => {
    const eq = r.equipment || 'Não especificado';
    const date = r.createdAt?.toDate ? r.createdAt.toDate() : (r.createdAt ? new Date(r.createdAt) : null);
    if (!equipmentUsageMap[eq]) {
      equipmentUsageMap[eq] = { count: 0, lastUsed: null };
    }
    equipmentUsageMap[eq].count += 1;
    if (date) {
      if (!equipmentUsageMap[eq].lastUsed || date.getTime() > equipmentUsageMap[eq].lastUsed.getTime()) {
        equipmentUsageMap[eq].lastUsed = date;
      }
    }
  });

  const equipmentList = Object.keys(equipmentUsageMap).map(name => ({
    name,
    count: equipmentUsageMap[name].count,
    lastUsed: equipmentUsageMap[name].lastUsed
  })).sort((a, b) => b.count - a.count);

  let displayEquipmentList = equipmentList;
  if (displayEquipmentList.length === 0 && mockEnabled) {
    displayEquipmentList = [
      { name: 'Plataforma Elevatória PT-01', count: 8, lastUsed: new Date() },
      { name: 'Plataforma Articulada PT-02', count: 5, lastUsed: new Date(Date.now() - 3600000) },
      { name: 'Plataforma Tesoura PT-03', count: 4, lastUsed: new Date(Date.now() - 86400000) },
      { name: 'Cesta Elevatória PT-04', count: 2, lastUsed: new Date(Date.now() - 172800000) }
    ];
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-primary font-outfit">
          Painel de Operações Subterrâneas
        </h1>
        <p className="text-text-tertiary dark:text-text-tertiary text-sm mt-1">
          Supervisão e monitoramento analítico de diários operacionais e frentes de lavra vindos do aplicativo.
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={kpi.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            whileHover={{ y: -3, scale: 1.01 }}
            className={`glass rounded-2xl p-5 border border-border/50 dark:border-border/80 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[120px] ${getColorStyles(kpi.color)}`}
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-extrabold text-text-tertiary dark:text-text-tertiary uppercase tracking-wider">
                {kpi.label}
              </span>
              <div className="text-primary dark:text-success shrink-0">
                {kpi.icon}
              </div>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div className={`text-2xl font-black font-outfit ${kpi.valueColor}`}>
                {loading ? '...' : kpi.value}
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${kpi.badgeColor}`}>
                {kpi.badge}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts & Visual Components Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart: Produtividade Semanal */}
        <div className="glass rounded-2xl p-5 border border-border/50 dark:border-border/80 shadow-md lg:col-span-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary dark:text-text-tertiary mb-4 font-outfit">Eficiência Semanal Geral (%)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={productivityData}>
                <defs>
                  <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5C3FA3" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#5C3FA3" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--text-tertiary)" fontSize={11} fontWeight={600} />
                <YAxis stroke="var(--text-tertiary)" fontSize={11} fontWeight={600} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Area type="monotone" dataKey="Produtividade" stroke="#5C3FA3" fillOpacity={1} fill="url(#colorProd)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart: Ordens de Serviço por Área */}
        <div className="glass rounded-2xl p-5 border border-border/50 dark:border-border/80 shadow-md">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary dark:text-text-tertiary mb-4 font-outfit">OS por Área Operacional</h3>
          <div className="h-64 flex flex-col justify-between">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={areaData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {areaData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-bold border-t border-slate-100 dark:border-border/85 pt-3">
              {areaData.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-text-tertiary dark:text-text-tertiary truncate">{entry.name} ({entry.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Secondary Row Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Atividade por Turno */}
        <div className="glass rounded-2xl p-5 border border-border/50 dark:border-border/80 shadow-md lg:col-span-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary dark:text-text-tertiary mb-4 font-outfit">Atividade por Turno</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shiftData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={11} fontWeight={600} />
                <YAxis stroke="var(--text-tertiary)" fontSize={11} fontWeight={600} />
                <Tooltip contentStyle={{ borderRadius: '12px' }} />
                <Legend />
                <Bar dataKey="Relatórios" fill="#23005B" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Ordens" fill="#74BE45" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Relatórios por Equipe */}
        <div className="glass rounded-2xl p-5 border border-border/50 dark:border-border/80 shadow-md lg:col-span-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary dark:text-text-tertiary mb-4 font-outfit">Relatórios por Equipe</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={teamData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={11} fontWeight={600} />
                <YAxis stroke="var(--text-tertiary)" fontSize={11} fontWeight={600} />
                <Tooltip contentStyle={{ borderRadius: '12px' }} />
                <Line type="monotone" dataKey="Relatorios" stroke="#74BE45" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real-time Utilized Equipment list */}
        <div className="glass rounded-2xl p-5 border border-border/50 dark:border-border/80 shadow-md lg:col-span-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary dark:text-text-tertiary mb-4 font-outfit flex items-center gap-1.5">
            <Truck size={15} className="text-purple-500" /> Equipamentos Utilizados
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/85 text-xs font-semibold max-h-64 overflow-y-auto pr-1">
            {displayEquipmentList.length > 0 ? (
              displayEquipmentList.map((eq, idx) => (
                <div key={idx} className="py-3 flex justify-between items-center gap-4 border-b border-slate-100 dark:border-slate-800/80 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-surface-hover dark:bg-surface text-primary shrink-0"><Truck size={16} /></div>
                    <div>
                      <div className="font-bold text-text-primary truncate max-w-[150px]">{eq.name}</div>
                      <span className="text-[9px] text-text-tertiary flex items-center gap-1">
                        <Calendar size={10} /> {eq.lastUsed ? eq.lastUsed.toLocaleDateString('pt-BR') : 'Sem data'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-[10px] text-text-tertiary">Relatórios</span>
                    <span className="font-extrabold text-primary">{eq.count}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-text-tertiary py-8 text-center">Nenhum equipamento registrado.</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
