import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Activity, Thermometer, Gauge, BatteryCharging, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface SensorReading {
  tilt: number;        // graus de inclinação
  battery: number;     // % bateria
  load: number;        // kg na cesta
  temperature: number; // °C motor
  vibration: number;   // mm/s
}

interface PlatformTelemetry {
  code: string;
  name: string;
  location: string;
  status: 'Normal' | 'Atenção' | 'Crítico';
  sensors: SensorReading;
}

export default function Telemetry() {
  const [platforms, setPlatforms] = useState<PlatformTelemetry[]>([]);
  const [alertSound, setAlertSound] = useState(true);
  const [criticalAlert, setCriticalAlert] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Simulated IoT real-time sensor data
  const generateSensorData = (): PlatformTelemetry[] => {
    const rand = (min: number, max: number) => Math.round((Math.random() * (max - min) + min) * 10) / 10;

    const pts: PlatformTelemetry[] = [
      {
        code: 'PT-01', name: 'Plataforma Articulada Snorkel 12m', location: 'Mina Leste N150',
        status: 'Normal',
        sensors: { tilt: rand(0, 3), battery: rand(75, 100), load: rand(100, 200), temperature: rand(40, 65), vibration: rand(1, 4) }
      },
      {
        code: 'PT-02', name: 'Cesta Elevatória JLG Rugged', location: 'Mina Oeste N215',
        status: 'Normal',
        sensors: { tilt: rand(0, 6), battery: rand(50, 90), load: rand(150, 280), temperature: rand(50, 75), vibration: rand(2, 6) }
      },
      {
        code: 'PT-03', name: 'Plataforma de Tesoura Haulotte', location: 'Oficina Nível 120',
        status: 'Normal',
        sensors: { tilt: rand(0, 2), battery: rand(20, 60), load: rand(50, 120), temperature: rand(30, 50), vibration: rand(1, 3) }
      },
      {
        code: 'PT-04', name: 'Manipulador Telescópico Genie', location: 'Frente Norte N150',
        status: 'Normal',
        sensors: { tilt: rand(0, 8), battery: rand(60, 95), load: rand(200, 350), temperature: rand(55, 85), vibration: rand(3, 8) }
      }
    ];

    // Evaluate status based on sensor thresholds
    pts.forEach(pt => {
      const s = pt.sensors;
      if (s.tilt > 5 || s.temperature > 80 || s.load > 300 || s.vibration > 7) {
        pt.status = 'Crítico';
      } else if (s.tilt > 3 || s.temperature > 70 || s.battery < 30 || s.vibration > 5) {
        pt.status = 'Atenção';
      }
    });

    return pts;
  };

  useEffect(() => {
    setPlatforms(generateSensorData());
    intervalRef.current = setInterval(() => {
      const newData = generateSensorData();
      setPlatforms(newData);
      const hasCritical = newData.some(p => p.status === 'Crítico');
      setCriticalAlert(hasCritical);
    }, 3000); // Update every 3s

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Crítico': return 'bg-red-500/10 border-red-500/40 text-red-500';
      case 'Atenção': return 'bg-yellow-500/10 border-yellow-500/40 text-yellow-500';
      default: return 'bg-cmoc-green/10 border-cmoc-green/40 text-cmoc-green';
    }
  };

  const getSensorBar = (value: number, max: number, danger: number) => {
    const pct = Math.min((value / max) * 100, 100);
    const color = value >= danger ? 'bg-red-500' : value >= danger * 0.75 ? 'bg-yellow-500' : 'bg-cmoc-green';
    return { pct, color };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-cmoc-blue dark:text-white font-outfit">
            Telemetria IoT — Plataformas
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Monitoramento em tempo real de sensores de inclinação, carga, bateria, temperatura e vibração.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-cmoc-green">
            <span className="w-2 h-2 rounded-full bg-cmoc-green animate-pulse" />
            Telemetria Ativa (3s)
          </span>
          <button
            onClick={() => setAlertSound(!alertSound)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-cmoc-blue dark:text-white transition-all"
            title={alertSound ? 'Desativar som de alerta' : 'Ativar som de alerta'}
          >
            {alertSound ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </div>

      {/* Critical Alert Banner */}
      {criticalAlert && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 dark:bg-red-950/30 border-2 border-red-500/40 rounded-2xl flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center animate-pulse shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-sm font-black text-red-500 uppercase tracking-wider">⚠️ Alerta Crítico Detectado</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Um ou mais sensores de plataforma ultrapassaram os limites de segurança operacional. Verifique imediatamente.
            </p>
          </div>
        </motion.div>
      )}

      {/* Platforms Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {platforms.map((pt) => (
          <motion.div
            key={pt.code}
            layout
            className={`glass rounded-2xl p-5 border shadow-md transition-all ${
              pt.status === 'Crítico' ? 'border-red-500/40 animate-pulse' :
              pt.status === 'Atenção' ? 'border-yellow-500/30' :
              'border-slate-200/50 dark:border-slate-800/80'
            }`}
          >
            {/* Platform Header */}
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-black text-cmoc-blue dark:text-white font-outfit">{pt.code} — {pt.name}</h3>
                <span className="text-[10px] text-slate-400">{pt.location}</span>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getStatusStyle(pt.status)}`}>
                {pt.status}
              </span>
            </div>

            {/* Sensor Readings */}
            <div className="space-y-3">
              {/* Tilt */}
              {(() => { const b = getSensorBar(pt.sensors.tilt, 10, 5); return (
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-cmoc-purple shrink-0"><RotateCcw size={14} /></div>
                  <div className="flex-1">
                    <div className="flex justify-between text-[10px] font-bold mb-1">
                      <span className="text-slate-500">Inclinação Lateral</span>
                      <span className={pt.sensors.tilt > 5 ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}>{pt.sensors.tilt}°</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${b.color}`} style={{ width: `${b.pct}%` }} />
                    </div>
                  </div>
                </div>
              ); })()}

              {/* Battery */}
              {(() => { getSensorBar(100 - pt.sensors.battery, 100, 70); return (
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-cmoc-green shrink-0"><BatteryCharging size={14} /></div>
                  <div className="flex-1">
                    <div className="flex justify-between text-[10px] font-bold mb-1">
                      <span className="text-slate-500">Bateria</span>
                      <span className={pt.sensors.battery < 30 ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}>{pt.sensors.battery}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500 bg-cmoc-green" style={{ width: `${pt.sensors.battery}%` }} />
                    </div>
                  </div>
                </div>
              ); })()}

              {/* Load */}
              {(() => { const b = getSensorBar(pt.sensors.load, 400, 300); return (
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-cmoc-blue shrink-0"><Gauge size={14} /></div>
                  <div className="flex-1">
                    <div className="flex justify-between text-[10px] font-bold mb-1">
                      <span className="text-slate-500">Carga na Cesta</span>
                      <span className={pt.sensors.load > 300 ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}>{pt.sensors.load} kg</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${b.color}`} style={{ width: `${b.pct}%` }} />
                    </div>
                  </div>
                </div>
              ); })()}

              {/* Temperature */}
              {(() => { const b = getSensorBar(pt.sensors.temperature, 100, 80); return (
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-red-400 shrink-0"><Thermometer size={14} /></div>
                  <div className="flex-1">
                    <div className="flex justify-between text-[10px] font-bold mb-1">
                      <span className="text-slate-500">Temp. Motor</span>
                      <span className={pt.sensors.temperature > 80 ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}>{pt.sensors.temperature}°C</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${b.color}`} style={{ width: `${b.pct}%` }} />
                    </div>
                  </div>
                </div>
              ); })()}

              {/* Vibration */}
              {(() => { const b = getSensorBar(pt.sensors.vibration, 10, 7); return (
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-yellow-500 shrink-0"><Activity size={14} /></div>
                  <div className="flex-1">
                    <div className="flex justify-between text-[10px] font-bold mb-1">
                      <span className="text-slate-500">Vibração</span>
                      <span className={pt.sensors.vibration > 7 ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}>{pt.sensors.vibration} mm/s</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${b.color}`} style={{ width: `${b.pct}%` }} />
                    </div>
                  </div>
                </div>
              ); })()}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
