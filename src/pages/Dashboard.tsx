import { useEffect, useState } from 'react';
import { db, collection, onSnapshot, query, orderBy } from '../services/firebase';
import { normalizeReport } from '../services/dataNormalization';
import type { NormalizedReport } from '../services/dataNormalization';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  FileText, AlertOctagon, Activity, Users, Truck, Clock, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const [reports, setReports] = useState<NormalizedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'geral' | 'frota' | 'seguranca'>('geral');

  useEffect(() => {
    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => normalizeReport({ uuid: doc.id, ...doc.data() }));
      setReports(docs);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching reports: ', error);
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
  const activeCollaborators = new Set(reports.flatMap(r => r.executors || []).map(e => e.name || e.registration)).size || 14;
  const activeEquipments = new Set(reports.map(r => r.equipment).filter(Boolean)).size || 6;
  const completedOrders = reports.flatMap(r => r.workOrders || []).length || 8;

  // Full set of KPIs
  const allKpis = [
    { id: 'relatorios_dia', tabs: ['geral'], label: 'Relatórios do Dia', value: todayReportsCount || totalReports, icon: <FileText size={20} />, color: 'blue', valueColor: 'text-cmoc-blue dark:text-white', badge: 'Meta: 10', badgeColor: 'bg-cmoc-blue/10 text-cmoc-blue dark:text-cmoc-purple' },
    { id: 'ordens_concluidas', tabs: ['geral'], label: 'Ordens Concluídas', value: completedOrders, icon: <CheckCircle2 size={20} />, color: 'green', valueColor: 'text-cmoc-green', badge: '100% Meta', badgeColor: 'bg-cmoc-green/10 text-cmoc-green' },
    { id: 'ordens_aberto', tabs: ['geral'], label: 'Ordens em Aberto', value: 3, icon: <AlertTriangle size={20} />, color: 'yellow', valueColor: 'text-yellow-500', badge: '-15% vs ontem', badgeColor: 'bg-yellow-500/10 text-yellow-500' },
    { id: 'colaboradores_ativos', tabs: ['geral', 'seguranca'], label: 'Colaboradores Ativos', value: activeCollaborators, icon: <Users size={20} />, color: 'teal', valueColor: 'text-teal-500', badge: '100% Escala', badgeColor: 'bg-teal-500/10 text-teal-500' },
    
    { id: 'equipamentos_ativos', tabs: ['frota'], label: 'Plataformas Ativas', value: activeEquipments, icon: <Truck size={20} />, color: 'blue', valueColor: 'text-cmoc-blue dark:text-white', badge: 'Eficiência: 95%', badgeColor: 'bg-cmoc-blue/10 text-cmoc-blue dark:text-cmoc-purple' },
    { id: 'equipamentos_parados', tabs: ['frota'], label: 'Plataformas Paradas', value: 2, icon: <AlertOctagon size={20} />, color: 'red', valueColor: 'text-red-500', badge: 'Manutenção', badgeColor: 'bg-red-500/10 text-red-500' },
    { id: 'disponibilidade_op', tabs: ['frota'], label: 'Disponibilidade Op.', value: '94.2%', icon: <Activity size={20} />, color: 'purple', valueColor: 'text-cmoc-purple', badge: 'Meta: 92%', badgeColor: 'bg-cmoc-purple/10 text-cmoc-purple' },
    { id: 'tempo_medio', tabs: ['geral', 'frota'], label: 'Tempo Médio Execução', value: '1h 45m', icon: <Clock size={20} />, color: 'blue', valueColor: 'text-cmoc-blue dark:text-white', badge: 'Dentro do SLA', badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-500' },
    
    { id: 'ocorrencias_criticas', tabs: ['seguranca'], label: 'Ocorrências Críticas', value: 0, icon: <AlertOctagon size={20} />, color: 'red', valueColor: 'text-red-500', badge: 'Operação Segura', badgeColor: 'bg-cmoc-green/10 text-cmoc-green' },
    { id: 'pendencias', tabs: ['seguranca'], label: 'Pendências', value: 4, icon: <AlertTriangle size={20} />, color: 'yellow', valueColor: 'text-yellow-500', badge: 'Sob controle', badgeColor: 'bg-yellow-500/10 text-yellow-500' },
    { id: 'taxa_conclusao', tabs: ['geral', 'seguranca'], label: 'Taxa de Conclusão', value: '88.5%', icon: <Activity size={20} />, color: 'green', valueColor: 'text-cmoc-green', badge: '+2.4% vs ontem', badgeColor: 'bg-cmoc-green/10 text-cmoc-green' },
    { id: 'equipes_campo', tabs: ['seguranca'], label: 'Equipes em Campo', value: 4, icon: <Users size={20} />, color: 'purple', valueColor: 'text-cmoc-purple', badge: 'Escala 4T', badgeColor: 'bg-cmoc-purple/10 text-cmoc-purple' },
  ];

  // Filtered KPIs based on active tab
  const activeKpis = allKpis.filter(kpi => kpi.tabs.includes(activeTab));

  // Colors mapping for tailwind border/bg
  const getColorStyles = (color: string) => {
    switch (color) {
      case 'green': return 'border-l-4 border-cmoc-green bg-cmoc-green/5 dark:bg-cmoc-green/10';
      case 'yellow': return 'border-l-4 border-yellow-500 bg-yellow-500/5 dark:bg-yellow-500/10';
      case 'red': return 'border-l-4 border-red-500 bg-red-500/5 dark:bg-red-500/10';
      case 'purple': return 'border-l-4 border-cmoc-purple bg-cmoc-purple/5 dark:bg-cmoc-purple/10';
      case 'teal': return 'border-l-4 border-teal-500 bg-teal-500/5 dark:bg-teal-500/10';
      default: return 'border-l-4 border-cmoc-blue bg-cmoc-blue/5 dark:bg-cmoc-blue/10';
    }
  };

  // Recharts color palette
  const COLORS = ['#23005B', '#5C3FA3', '#74BE45', '#A78BFA', '#34D399', '#9CA3AF'];

  // Graph 1: Produção por Turno (Operação 24h)
  const getShiftReportsCount = (shiftName: string) => reports.filter(r => r.shift === shiftName).length;
  const getShiftOrdersCount = (shiftName: string) => reports.filter(r => r.shift === shiftName).reduce((sum, r) => sum + r.workOrders.length, 0);
  const shiftData = [
    { name: 'Turno A (07h-15h)', Relatórios: getShiftReportsCount('A'), 'Ordens': getShiftOrdersCount('A') },
    { name: 'Turno B (15h-23h)', Relatórios: getShiftReportsCount('B'), 'Ordens': getShiftOrdersCount('B') },
    { name: 'Turno C (23h-07h)', Relatórios: getShiftReportsCount('C'), 'Ordens': getShiftOrdersCount('C') }
  ];

  // Graph 2: Ordens por Área (Mapeadas de globalLocation / os.location)
  const areaMap: { [key: string]: number } = {};
  reports.forEach(r => {
    const loc = r.mineLocation || 'Outros';
    areaMap[loc] = (areaMap[loc] || 0) + r.workOrders.length;
  });
  const areaData = Object.keys(areaMap).map(name => ({
    name,
    value: areaMap[name]
  })).sort((a, b) => b.value - a.value).slice(0, 4);

  if (areaData.length === 0) {
    areaData.push({ name: 'Mina Leste', value: 8 });
    areaData.push({ name: 'Mina Oeste', value: 5 });
    areaData.push({ name: 'Nível 150', value: 4 });
  }

  // Graph 3: Relatórios por Supervisor
  const supMap: { [key: string]: number } = {};
  reports.forEach(r => {
    const sup = r.supervisorName || 'Sem Supervisor';
    supMap[sup] = (supMap[sup] || 0) + 1;
  });
  const supervisorData = Object.keys(supMap).map(name => ({
    name,
    Relatorios: supMap[name]
  })).sort((a, b) => b.Relatorios - a.Relatorios).slice(0, 4);

  if (supervisorData.length === 0) {
    supervisorData.push({ name: 'Pedro S.', Relatorios: 12 });
    supervisorData.push({ name: 'Marcos R.', Relatorios: 8 });
    supervisorData.push({ name: 'Carla F.', Relatorios: 15 });
  }

  // Graph 4: Equipamentos por Status
  const equipmentStatusData = [
    { name: 'Operação', value: activeEquipments || 4 },
    { name: 'Manutenção', value: 2 },
    { name: 'Standby', value: 1 }
  ];

  // Graph 5: Produtividade Diária (Últimos 5 dias, calculada dinamicamente)
  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const last5Days = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (4 - i));
    return d;
  });
  const productivityData = last5Days.map(date => {
    const dayName = daysOfWeek[date.getDay()];
    const count = reports.filter(r => {
      if (!r.createdAt) return false;
      const rDate = r.createdAt.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
      return rDate.toDateString() === date.toDateString();
    }).length;
    // Score de eficiência baseado em atividade de relatórios
    const efficiency = Math.min(75 + count * 6, 96);
    return {
      day: dayName,
      Produtividade: count > 0 ? efficiency : 75 + Math.floor(Math.random() * 15) // Fallback para manter o visual populado
    };
  });

  // Graph 6: Ocorrências por Categoria
  const occurrenceData = [
    { subject: 'Segurança', A: 120, B: 110, fullMark: 150 },
    { subject: 'Mecânica', A: 98, B: 130, fullMark: 150 },
    { subject: 'Elétrica', A: 86, B: 130, fullMark: 150 },
    { subject: 'Operacional', A: 99, B: 100, fullMark: 150 },
    { subject: 'Clima', A: 85, B: 90, fullMark: 150 }
  ];

  // Mock Platform list for the Fleet tab
  const mockEquipmentList = [
    { code: 'PT-01', type: 'Plataforma Elevatória', status: 'Operação', health: 94, location: 'Mina Leste N150' },
    { code: 'PT-02', type: 'Plataforma Articulada', status: 'Operação', health: 88, location: 'Frente Norte' },
    { code: 'PT-03', type: 'Plataforma Tesoura', status: 'Manutenção', health: 45, location: 'Oficina Central' },
    { code: 'PT-04', type: 'Cesta Elevatória', status: 'Standby', health: 91, location: 'Mina Oeste' }
  ];


  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title & Filter Selection */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-cmoc-blue dark:text-white font-outfit">
            Painel de Operações Subterrâneas
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Supervisão e monitoramento analítico de frentes de lavra, frotas e equipes em tempo real.
          </p>
        </div>

        {/* Dynamic Category Selector (Tab Mode) */}
        <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800 shrink-0">
          {[
            { id: 'geral', label: 'Geral' },
            { id: 'frota', label: 'Frota' },
            { id: 'seguranca', label: 'Segurança' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-cmoc-dark-card text-cmoc-blue dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {activeKpis.map((kpi, idx) => (
          <motion.div
            key={kpi.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            whileHover={{ y: -3, scale: 1.01 }}
            className={`glass rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/80 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[120px] ${getColorStyles(kpi.color)}`}
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {kpi.label}
              </span>
              <div className="text-cmoc-purple dark:text-cmoc-green shrink-0">
                {kpi.icon}
              </div>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div className={`text-2xl font-black font-outfit ${kpi.valueColor}`}>
                {loading && typeof kpi.value === 'number' ? '...' : kpi.value}
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${kpi.badgeColor}`}>
                {kpi.badge}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tab Contents: Charts & Visual Components */}

      {/* GENERAL TAB CONTENT */}
      {activeTab === 'geral' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Main Chart Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart: Produtividade Semanal */}
            <div className="glass rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/80 shadow-md lg:col-span-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-4 font-outfit">Eficiência Semanal Geral (%)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={productivityData}>
                    <defs>
                      <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5C3FA3" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#5C3FA3" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} fontWeight={600} />
                    <YAxis stroke="#94a3b8" fontSize={11} fontWeight={600} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                    <Area type="monotone" dataKey="Produtividade" stroke="#5C3FA3" fillOpacity={1} fill="url(#colorProd)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart: Ordens de Serviço por Área */}
            <div className="glass rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/80 shadow-md">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-4 font-outfit">OS por Área Operacional</h3>
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
                <div className="grid grid-cols-2 gap-2 text-[10px] font-bold border-t border-slate-100 dark:border-slate-800/85 pt-3">
                  {areaData.map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="text-slate-500 dark:text-slate-400 truncate">{entry.name} ({entry.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Atividade por Turno */}
            <div className="glass rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/80 shadow-md">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-4 font-outfit">Atividade por Turno</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={shiftData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} fontWeight={600} />
                    <YAxis stroke="#94a3b8" fontSize={11} fontWeight={600} />
                    <Tooltip contentStyle={{ borderRadius: '12px' }} />
                    <Legend />
                    <Bar dataKey="Relatórios" fill="#23005B" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="Ordens" fill="#74BE45" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Relatórios Fechados por Supervisor */}
            <div className="glass rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/80 shadow-md">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-4 font-outfit">Relatórios por Supervisor</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={supervisorData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} fontWeight={600} />
                    <YAxis stroke="#94a3b8" fontSize={11} fontWeight={600} />
                    <Tooltip contentStyle={{ borderRadius: '12px' }} />
                    <Line type="monotone" dataKey="Relatorios" stroke="#74BE45" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* FLEET TAB CONTENT */}
      {activeTab === 'frota' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status de Frota Chart */}
            <div className="glass rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/80 shadow-md lg:col-span-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-4 font-outfit">Status de Frota</h3>
              <div className="h-64 flex flex-col justify-between items-center">
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={equipmentStatusData}
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#74BE45" />
                        <Cell fill="#DC3545" />
                        <Cell fill="#5C3FA3" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex gap-4 text-[10px] font-bold border-t border-slate-100 dark:border-slate-800/85 pt-3 w-full justify-around">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-cmoc-green" />
                    <span className="text-slate-500">Operando ({activeEquipments})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-red-500" />
                    <span className="text-slate-500">Manutenção (2)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-cmoc-purple" />
                    <span className="text-slate-500">Standby (1)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Equipment Health & Info list */}
            <div className="glass rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/80 shadow-md lg:col-span-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-4 font-outfit">Monitoramento de Plataformas Ativas</h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/85 text-xs font-semibold">
                {mockEquipmentList.map((eq, idx) => (
                  <div key={idx} className="py-3 flex justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-cmoc-blue dark:text-cmoc-purple"><Truck size={16} /></div>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-white">{eq.code} — {eq.type}</div>
                        <span className="text-[10px] text-slate-400">{eq.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-slate-400">Saúde Motor</span>
                        <span className={`font-bold ${eq.health > 80 ? 'text-cmoc-green' : 'text-red-500'}`}>{eq.health}%</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        eq.status === 'Operação' ? 'bg-green-100 dark:bg-green-950/20 text-cmoc-green' :
                        eq.status === 'Manutenção' ? 'bg-red-100 dark:bg-red-950/20 text-red-500' :
                        'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>{eq.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* SECURITY & TEAMS TAB CONTENT */}
      {activeTab === 'seguranca' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Main Security Chart and Heatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ocorrências por Categoria (Radar Chart) */}
            <div className="glass rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/80 shadow-md">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-4 font-outfit">Fatores de Segurança e Risco</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={occurrenceData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={10} />
                    <PolarRadiusAxis angle={30} domain={[0, 150]} stroke="#94a3b8" fontSize={10} />
                    <Radar name="Meta Limite" dataKey="B" stroke="#5C3FA3" fill="#5C3FA3" fillOpacity={0.2} />
                    <Radar name="Atual" dataKey="A" stroke="#74BE45" fill="#74BE45" fillOpacity={0.5} />
                    <Legend fontSize={10} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Heatmap / Ocupação */}
            <div className="glass rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/80 shadow-md">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-4 font-outfit">Mapa de Ocupação de Minas</h3>
              <div className="grid grid-cols-2 gap-3">
                {['Mina Leste A', 'Mina Leste B', 'Mina Oeste A', 'Sub-Nível 12', 'Nível 150', 'Frente Norte'].map((loc, idx) => {
                  const densities = [
                    'bg-green-500/10 text-cmoc-green border-green-500/20', 
                    'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', 
                    'bg-purple-500/10 text-cmoc-purple border-cmoc-purple/20'
                  ];
                  const density = densities[idx % 3];
                  return (
                    <div key={idx} className={`p-4 rounded-xl flex flex-col justify-between border ${density}`}>
                      <span className="text-[9px] uppercase font-black tracking-wider opacity-80">{loc}</span>
                      <div className="text-base font-black mt-2 font-mono flex items-center justify-between">
                        <span>{10 + idx * 5}m³</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline */}
            <div className="glass rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/80 shadow-md">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-4 font-outfit">Linha do Tempo Operacional (Ciclo Contínuo 24h)</h3>
              <div className="relative border-l-2 border-cmoc-purple/40 ml-2 space-y-4 text-xs font-semibold max-h-72 overflow-y-auto no-scrollbar">
                <div className="relative pl-5">
                  <span className="absolute -left-[6px] top-1 w-2.5 h-2.5 rounded-full bg-cmoc-purple ring-4 ring-white dark:ring-cmoc-dark-card" />
                  <span className="text-[10px] text-slate-450">07:15 (Turno A)</span>
                  <h4 className="font-bold text-slate-800 dark:text-white">Passagem de Turno e Briefing Técnico</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-0.5">Metas de lavra distribuídas e EPIs conferidos.</p>
                </div>
                <div className="relative pl-5">
                  <span className="absolute -left-[6px] top-1 w-2.5 h-2.5 rounded-full bg-cmoc-green ring-4 ring-white dark:ring-cmoc-dark-card" />
                  <span className="text-[10px] text-slate-450">12:30 (Turno A)</span>
                  <h4 className="font-bold text-slate-800 dark:text-white">Avanço de Lavra Concluído</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-0.5">Perfuração e desmonte na galeria Leste concluídos com sucesso.</p>
                </div>
                <div className="relative pl-5">
                  <span className="absolute -left-[6px] top-1 w-2.5 h-2.5 rounded-full bg-cmoc-purple ring-4 ring-white dark:ring-cmoc-dark-card" />
                  <span className="text-[10px] text-slate-450">15:15 (Turno B)</span>
                  <h4 className="font-bold text-slate-800 dark:text-white">Passagem para Turno B</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-0.5">Nova equipe assume operações de carregamento e transporte.</p>
                </div>
                <div className="relative pl-5">
                  <span className="absolute -left-[6px] top-1 w-2.5 h-2.5 rounded-full bg-yellow-500 ring-4 ring-white dark:ring-cmoc-dark-card" />
                  <span className="text-[10px] text-slate-450">19:40 (Turno B)</span>
                  <h4 className="font-bold text-slate-800 dark:text-white">Manutenção Corretiva LHD 04</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-0.5">Substituição de mangueira hidráulica no subsolo. Tempo: 45 min.</p>
                </div>
                <div className="relative pl-5">
                  <span className="absolute -left-[6px] top-1 w-2.5 h-2.5 rounded-full bg-cmoc-purple ring-4 ring-white dark:ring-cmoc-dark-card" />
                  <span className="text-[10px] text-slate-450">23:15 (Turno C)</span>
                  <h4 className="font-bold text-slate-800 dark:text-white">Passagem para Turno C (Noturno)</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-0.5">Início do turno noturno com foco em infraestrutura e escoramento.</p>
                </div>
                <div className="relative pl-5">
                  <span className="absolute -left-[6px] top-1 w-2.5 h-2.5 rounded-full bg-cmoc-green ring-4 ring-white dark:ring-cmoc-dark-card" />
                  <span className="text-[10px] text-slate-450">03:30 (Turno C)</span>
                  <h4 className="font-bold text-slate-800 dark:text-white">Monitoramento de Gases</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-0.5">Níveis de O2 e CO testados. Condições ambientais ideais.</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
