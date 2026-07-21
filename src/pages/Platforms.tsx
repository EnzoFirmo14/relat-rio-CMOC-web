import { useEffect, useState } from 'react';
import { db, collection, onSnapshot, query, addDoc, doc, updateDoc, serverTimestamp } from '../services/firebase';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

interface Platform {
  uuid: string;
  code: string;
  name: string;
  location: string;
  status: 'Operação' | 'Manutenção' | 'Standby';
  health: number;
  lastInspection?: any;
}

export default function Platforms() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // New platform form inputs
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<'Operação' | 'Manutenção' | 'Standby'>('Operação');
  const [health, setHealth] = useState(100);

  // Seed default data if Firestore collection is empty
  useEffect(() => {
    const q = query(collection(db, 'platforms'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        // Seed default platforms
        const defaultPlatforms = [
          { code: 'PT-01', name: 'Plataforma Articulada Snorkel 12m', location: 'Mina Leste N150', status: 'Operação', health: 94 },
          { code: 'PT-02', name: 'Cesta Elevatória JLG Rugged', location: 'Mina Oeste N215', status: 'Standby', health: 88 },
          { code: 'PT-03', name: 'Plataforma de Tesoura Haulotte', location: 'Oficina Nível 120', status: 'Manutenção', health: 45 },
          { code: 'PT-04', name: 'Manipulador Telescópico Genie', location: 'Frente Norte N150', status: 'Operação', health: 92 }
        ];
        defaultPlatforms.forEach(async (p) => {
          await addDoc(collection(db, 'platforms'), {
            ...p,
            createdAt: serverTimestamp()
          });
        });
      } else {
        const docs = snapshot.docs.map(doc => ({ uuid: doc.id, ...doc.data() } as Platform));
        // Sort by code
        docs.sort((a, b) => a.code.localeCompare(b.code));
        setPlatforms(docs);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error fetching platforms: ', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Update status of platform
  const handleUpdateStatus = async (uuid: string, newStatus: 'Operação' | 'Manutenção' | 'Standby') => {
    try {
      const docRef = doc(db, 'platforms', uuid);
      let newHealth = 100;
      if (newStatus === 'Manutenção') {
        newHealth = 40;
      } else if (newStatus === 'Standby') {
        newHealth = 90;
      } else {
        newHealth = 95;
      }
      await updateDoc(docRef, { 
        status: newStatus,
        health: newHealth
      });
      alert(`Status da plataforma alterado para ${newStatus} com sucesso!`);
    } catch (e) {
      console.error(e);
      alert('Erro ao atualizar status da plataforma.');
    }
  };

  // Add new platform
  const handleAddPlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name || !location) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'platforms'), {
        code,
        name,
        location,
        status,
        health,
        createdAt: serverTimestamp()
      });
      alert('Nova plataforma cadastrada com sucesso!');
      setCode('');
      setName('');
      setLocation('');
      setHealth(100);
    } catch (e) {
      console.error(e);
      alert('Erro ao cadastrar plataforma.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-cmoc-blue dark:text-white font-outfit">
          Gestão de Plataformas de Trabalho (PT)
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Monitoramento e cadastro de plataformas elevatórias e cestas suspensas para trabalho em altura.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lado Esquerdo - Imagem Ilustrativa e Cadastro */}
        <div className="lg:col-span-1 space-y-6">
          {/* Imagem Ilustrativa */}
          <div className="glass rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800/80 shadow-md">
            <div className="h-56 relative">
              <img 
                src="/plataforma.png" 
                alt="Plataforma Elevatória de Trabalho" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                <div>
                  <span className="bg-cmoc-green px-2 py-0.5 rounded text-[10px] font-bold text-cmoc-blue uppercase">Equipamento Homologado</span>
                  <h3 className="text-white font-extrabold text-sm mt-1">Modelo Telescópico Autopropelido</h3>
                </div>
              </div>
            </div>
            <div className="p-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed bg-white/50 dark:bg-slate-900/30">
              Ilustração da plataforma elevatória de mineração em operação no subsolo de infraestrutura da CMOC. Equipamento equipado com gaiola de proteção e pneus fora de estrada.
            </div>
          </div>

          {/* Form de Cadastro */}
          <div className="glass rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/80 shadow-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-4 font-outfit flex items-center gap-2">
              <Plus size={16} /> Cadastrar Nova Plataforma (PT)
            </h3>
            
            <form onSubmit={handleAddPlatform} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-cmoc-blue dark:text-cmoc-white/70">Código (ex: PT-05)</label>
                <input 
                  type="text" 
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Código identificador"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-cmoc-purple focus:outline-none dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-cmoc-blue dark:text-cmoc-white/70">Nome / Modelo</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Cesta Elevatória Articulada"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-cmoc-purple focus:outline-none dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-cmoc-blue dark:text-cmoc-white/70">Localização Inicial</label>
                <input 
                  type="text" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Mina Leste N150"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-cmoc-purple focus:outline-none dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-cmoc-blue dark:text-cmoc-white/70">Status</label>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-cmoc-purple focus:outline-none dark:text-white"
                  >
                    <option value="Operação">Operação</option>
                    <option value="Standby">Standby</option>
                    <option value="Manutenção">Manutenção</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-cmoc-blue dark:text-cmoc-white/70">Saúde (%)</label>
                  <input 
                    type="number" 
                    value={health}
                    onChange={(e) => setHealth(Number(e.target.value))}
                    max={100}
                    min={0}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-cmoc-purple focus:outline-none dark:text-white"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={submitting}
                className="w-full py-2 bg-cmoc-blue hover:bg-cmoc-purple text-white font-bold rounded-xl shadow-lg transition-colors cursor-pointer text-xs disabled:opacity-50"
              >
                {submitting ? 'Cadastrando...' : 'Adicionar Plataforma'}
              </button>
            </form>
          </div>
        </div>

        {/* Lado Direito - Grid de Plataformas Interativo */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/80 shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 font-outfit">
                Plataformas no Banco de Dados
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-cmoc-blue/10 text-cmoc-blue dark:text-cmoc-purple rounded">
                Total: {platforms.length}
              </span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-10 text-slate-450 text-xs">
                Carregando plataformas...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {platforms.map((p) => (
                  <motion.div
                    key={p.uuid}
                    layoutId={p.uuid}
                    className={`p-4 rounded-xl border relative flex flex-col justify-between min-h-[160px] transition-all bg-white dark:bg-slate-900/50 ${
                      p.status === 'Operação' ? 'border-cmoc-green/30 hover:border-cmoc-green shadow-sm shadow-green-500/5' :
                      p.status === 'Manutenção' ? 'border-red-500/30 hover:border-red-500 shadow-sm shadow-red-500/5' :
                      'border-slate-200 dark:border-slate-800 hover:border-cmoc-purple'
                    }`}
                  >
                    <div>
                      {/* Code and Health */}
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-black text-cmoc-blue dark:text-white font-outfit">{p.code}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] text-slate-400">Motor:</span>
                          <span className={`text-[10px] font-bold ${p.health > 80 ? 'text-cmoc-green' : 'text-red-500'}`}>{p.health}%</span>
                        </div>
                      </div>

                      {/* Name & Location */}
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2 truncate">{p.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{p.location}</p>
                    </div>

                    {/* Controls */}
                    <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-4 flex items-center justify-between gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        p.status === 'Operação' ? 'bg-green-100 dark:bg-green-950/20 text-cmoc-green' :
                        p.status === 'Manutenção' ? 'bg-red-100 dark:bg-red-950/20 text-red-500' :
                        'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {p.status}
                      </span>

                      {/* Control buttons */}
                      <div className="flex gap-1">
                        {p.status !== 'Operação' && (
                          <button
                            onClick={() => handleUpdateStatus(p.uuid, 'Operação')}
                            className="px-2 py-1 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white text-[10px] font-bold rounded-lg cursor-pointer transition-all"
                            title="Iniciar Plataforma"
                          >
                            Operação
                          </button>
                        )}
                        {p.status !== 'Standby' && (
                          <button
                            onClick={() => handleUpdateStatus(p.uuid, 'Standby')}
                            className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-cmoc-purple text-slate-650 hover:text-white text-[10px] font-bold rounded-lg cursor-pointer transition-all"
                            title="Colocar em Standby"
                          >
                            Standby
                          </button>
                        )}
                        {p.status !== 'Manutenção' && (
                          <button
                            onClick={() => handleUpdateStatus(p.uuid, 'Manutenção')}
                            className="px-2 py-1 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white text-[10px] font-bold rounded-lg cursor-pointer transition-all"
                            title="Enviar para Manutenção"
                          >
                            Manutenção
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
