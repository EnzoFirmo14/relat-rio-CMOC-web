export interface NormalizedExecutor {
  name: string;
  registration: string;
}

export interface NormalizedWorkOrder {
  id: string;
  number: string;
  location: string;
  maintenanceType: string;
  cause: string;
  activities: string;
  materialsUsed: string[];
  quantityMeters: string;
  quantityPieces: string;
  startTime: string;
  endTime: string;
  status: string;
  osStatus: string;
  photoPaths: string[];
}

export interface NormalizedReport {
  uuid: string;
  mineLocation: string;
  shift: string;
  team: string;
  equipment: string;
  status: string;
  createdAt: any;
  updatedAt?: any;
  date?: string;
  observations: string;
  fuelLevel: number;
  availableMaterials: string;
  executors: NormalizedExecutor[];
  workOrders: NormalizedWorkOrder[];
}

export function normalizeReport(raw: any): NormalizedReport {
  if (!raw) return {} as NormalizedReport;

  const executors = (raw.operators || raw.executors || []).map((e: any) => ({
    name: e.name || '',
    registration: e.registration || ''
  }));

  const workOrders = (raw.workOrders || []).map((os: any) => ({
    id: os.id || '',
    number: os.number || '',
    location: os.location || '',
    maintenanceType: os.maintenanceType || '',
    cause: os.cause || '',
    activities: os.activities || os.description || '',
    materialsUsed: Array.isArray(os.materialsUsed) ? os.materialsUsed : (os.description ? [os.description] : []),
    quantityMeters: os.quantityMeters || '',
    quantityPieces: os.quantityPieces || '',
    startTime: os.startTime || '',
    endTime: os.endTime || '',
    status: os.status || '',
    osStatus: os.osStatus || '',
    photoPaths: Array.isArray(os.photoPaths) ? os.photoPaths : (os.photos ? os.photos : [])
  }));

  // Converte string de data ISO em timestamp do Firestore-like se necessário
  let createdAt = raw.createdAt;
  if (createdAt && typeof createdAt === 'string') {
    const parsed = new Date(createdAt);
    if (!isNaN(parsed.getTime())) {
      createdAt = {
        toDate: () => parsed,
        seconds: Math.floor(parsed.getTime() / 1000)
      };
    }
  } else if (createdAt && typeof createdAt.toDate !== 'function') {
    if (typeof createdAt.seconds === 'number') {
      const parsed = new Date(createdAt.seconds * 1000);
      createdAt = {
        toDate: () => parsed,
        seconds: createdAt.seconds
      };
    } else {
      createdAt = {
        toDate: () => new Date(),
        seconds: Math.floor(Date.now() / 1000)
      };
    }
  }

  let date = raw.date;
  if (date && typeof date === 'string') {
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      date = parsed.toLocaleDateString('pt-BR');
    }
  }

  return {
    uuid: raw.uuid || raw.id || '',
    mineLocation: raw.globalLocation || raw.mineLocation || '',
    shift: raw.shift || '',
    team: raw.team || '',
    equipment: raw.globalEquipment || raw.equipment || '',
    status: raw.syncStatus || raw.status || 'draft',
    createdAt: createdAt || null,
    updatedAt: raw.updatedAt || null,
    date: date || '',
    observations: raw.observations || raw.description || '',
    fuelLevel: typeof raw.fuelLevel === 'number' ? raw.fuelLevel : 0,
    availableMaterials: raw.availableMaterials || '',
    executors,
    workOrders
  };
}
