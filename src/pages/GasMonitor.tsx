import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Wind, Flame, Droplets, AlertTriangle, ShieldAlert, MapPin } from 'lucide-react';

interface GasSensor {
  id: string;
  location: string;
  level: string;       // Nível de galeria
  o2: number;          // % oxigênio (normal: 19.5-23.5)
  co: number;          // ppm monóxido de carbono (limite: 25)
  no2: number;         // ppm dióxido de nitrogênio (limite: 3)
  ch4: number;         // % metano (limite: 1)
  temperature: number; // °C ambiente
  humidity: number;    // % umidade
  status: 'Seguro' | 'Atenção' | 'Evacuação';
}

export default function GasMonitor() {
  const [sensors, setSensors] = useState<GasSensor[]>([]);
  const [evacuationAlert, setEvacuationAlert] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const generateGasReadings = (): GasSensor[] => {
    const rand = (min: number, max: number) => Math.round((Math.random() * (max - min) + min) * 10) / 10;

    const readings: GasSensor[] = [
      { id: 'GS-01', location: 'Mina Leste A', level: 'N-150', o2: rand(20.2, 21.5), co: rand(2, 15), no2: rand(0.2, 1.8), ch4: rand(0, 0.4), temperature: rand(24, 30), humidity: rand(60, 80), status: 'Seguro' },
      { id: 'GS-02', location: 'Mina Leste B', level: 'N-120', o2: rand(19.8, 21.0), co: rand(5, 22), no2: rand(0.5, 2.5), ch4: rand(0.1, 0.6), temperature: rand(26, 33), humidity: rand(65, 85), status: 'Seguro' },
      { id: 'GS-03', location: 'Mina Oeste A', level: 'N-215', o2: rand(19.0, 20.8), co: rand(8, 28), no2: rand(1, 3.5), ch4: rand(0.2, 1.2), temperature: rand(28, 36), humidity: rand(70, 90), status: 'Seguro' },
      { id: 'GS-04', location: 'Sub-Nível 12', level: 'N-100', o2: rand(20.5, 21.5), co: rand(1, 10), no2: rand(0.1, 1.0), ch4: rand(0, 0.3), temperature: rand(22, 28), humidity: rand(55, 75), status: 'Seguro' },
      { id: 'GS-05', location: 'Frente Norte', level: 'N-150', o2: rand(19.5, 21.0), co: rand(3, 18), no2: rand(0.3, 2.0), ch4: rand(0.05, 0.5), temperature: rand(25, 32), humidity: rand(60, 80), status: 'Seguro' },
      { id: 'GS-06', location: 'Galeria Principal', level: 'N-180', o2: rand(20.0, 21.5), co: rand(2, 12), no2: rand(0.2, 1.5), ch4: rand(0, 0.3), temperature: rand(23, 29), humidity: rand(58, 78), status: 'Seguro' }
    ];

    // Evaluate status
    readings.forEach(s => {
      if (s.o2 < 19.5 || s.co > 25 || s.no2 > 3 || s.ch4 > 1) {
        s.status = 'Evacuação';
      } else if (s.o2 < 20 || s.co > 15 || s.no2 > 2 || s.ch4 > 0.5) {
        s.status = 'Atenção';
      }
    });

    return readings;
  };

  useEffect(() => {
    setSensors(generateGasReadings());
    intervalRef.current = setInterval(() => {
      const newData = generateGasReadings();
      setSensors(newData);
      setEvacuationAlert(newData.some(s => s.status === 'Evacuação'));
    }, 4000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Evacuação': return 'bg-red-500 text-white animate-pulse';
      case 'Atenção': return 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30';
      default: return 'bg-cmoc-green/10 text-cmoc-green border border-cmoc-green/30';
    }
  };

  const getGasColor = (value: number, limit: number) => {
    const ratio = value / limit;
    if (ratio >= 1) return 'text-red-500';
    if (ratio >= 0.6) return 'text-yellow-500';
    return 'text-cmoc-green';
  };

  const getGasBar = (value: number, max: number) => {
    const pct = Math.min((value / max) * 100, 100);
    const color = pct >= 100 ? 'bg-red-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-cmoc-green';
    return { pct, color };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-cmoc-blue dark:text-white font-outfit">
          Monitor de Gases — Subsolo
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Monitoramento contínuo de O₂, CO, NO₂ e CH₄ nas galerias de mineração subterrânea.
        </p>
      </div>

      {/* Evacuation Alert */}
      {evacuationAlert && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-5 bg-red-500/10 dark:bg-red-950/40 border-2 border-red-500 rounded-2xl flex items-center gap-4 animate-pulse"
        >
          <div className="w-12 h-12 rounded-xl bg-red-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-red-500/30">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h3 className="text-base font-black text-red-500 uppercase tracking-wider">🚨 EVACUAÇÃO NECESSÁRIA</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Níveis de gases tóxicos ultrapassaram os limites de segurança em uma ou mais galerias. 
              Siga imediatamente as rotas de evacuação de emergência e encaminhe todos os colaboradores para a superfície.
            </p>
          </div>
        </motion.div>
      )}

      {/* Limits Reference Card */}
      <div className="glass rounded-2xl p-4 border border-slate-200/50 dark:border-slate-800/80 shadow-sm">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">Limites de Exposição Ocupacional (NR-22 / NR-15)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] font-bold">
          <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
            <Wind size={14} className="text-cmoc-blue" />
            <div>
              <span className="text-slate-400 block">O₂ (Oxigênio)</span>
              <span className="text-slate-700 dark:text-white">19.5% — 23.5%</span>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
            <Flame size={14} className="text-red-400" />
            <div>
              <span className="text-slate-400 block">CO (Monóxido)</span>
              <span className="text-slate-700 dark:text-white">Máx. 25 ppm</span>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
            <Droplets size={14} className="text-yellow-500" />
            <div>
              <span className="text-slate-400 block">NO₂ (Dióxido N.)</span>
              <span className="text-slate-700 dark:text-white">Máx. 3 ppm</span>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
            <AlertTriangle size={14} className="text-cmoc-purple" />
            <div>
              <span className="text-slate-400 block">CH₄ (Metano)</span>
              <span className="text-slate-700 dark:text-white">Máx. 1%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sensor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sensors.map((sensor) => (
          <motion.div
            key={sensor.id}
            layout
            className={`glass rounded-2xl p-5 border shadow-md ${
              sensor.status === 'Evacuação' ? 'border-red-500 shadow-red-500/10' :
              sensor.status === 'Atenção' ? 'border-yellow-500/30' :
              'border-slate-200/50 dark:border-slate-800/80'
            }`}
          >
            {/* Sensor Header */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cmoc-blue/10 dark:bg-cmoc-purple/10 text-cmoc-blue dark:text-cmoc-purple">
                  <MapPin size={14} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-cmoc-blue dark:text-white">{sensor.id} — {sensor.location}</h4>
                  <span className="text-[9px] text-slate-400">Nível {sensor.level}</span>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${getStatusBadge(sensor.status)}`}>
                {sensor.status}
              </span>
            </div>

            {/* Gas Readings */}
            <div className="space-y-2.5">
              {/* O2 */}
              {(() => { getGasBar(Math.abs(20.9 - sensor.o2), 2); return (
                <div>
                  <div className="flex justify-between text-[10px] font-bold mb-1">
                    <span className="text-slate-500">O₂ Oxigênio</span>
                    <span className={getGasColor(Math.abs(20.9 - sensor.o2), 1.4)}>{sensor.o2}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${sensor.o2 < 19.5 ? 'bg-red-500' : sensor.o2 < 20 ? 'bg-yellow-500' : 'bg-cmoc-green'}`} style={{ width: `${Math.min((sensor.o2 / 23) * 100, 100)}%` }} />
                  </div>
                </div>
              ); })()}

              {/* CO */}
              {(() => { const bar = getGasBar(sensor.co, 25); return (
                <div>
                  <div className="flex justify-between text-[10px] font-bold mb-1">
                    <span className="text-slate-500">CO Monóxido</span>
                    <span className={getGasColor(sensor.co, 25)}>{sensor.co} ppm</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${bar.color}`} style={{ width: `${bar.pct}%` }} />
                  </div>
                </div>
              ); })()}

              {/* NO2 */}
              {(() => { const bar = getGasBar(sensor.no2, 3); return (
                <div>
                  <div className="flex justify-between text-[10px] font-bold mb-1">
                    <span className="text-slate-500">NO₂ Dióxido de N.</span>
                    <span className={getGasColor(sensor.no2, 3)}>{sensor.no2} ppm</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${bar.color}`} style={{ width: `${bar.pct}%` }} />
                  </div>
                </div>
              ); })()}

              {/* CH4 */}
              {(() => { const bar = getGasBar(sensor.ch4, 1); return (
                <div>
                  <div className="flex justify-between text-[10px] font-bold mb-1">
                    <span className="text-slate-500">CH₄ Metano</span>
                    <span className={getGasColor(sensor.ch4, 1)}>{sensor.ch4}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${bar.color}`} style={{ width: `${bar.pct}%` }} />
                  </div>
                </div>
              ); })()}
            </div>

            {/* Ambient Info */}
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex justify-between text-[9px] font-bold text-slate-400">
              <span>🌡️ Ambiente: {sensor.temperature}°C</span>
              <span>💧 Umidade: {sensor.humidity}%</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
