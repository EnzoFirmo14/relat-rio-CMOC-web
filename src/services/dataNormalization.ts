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
 supervisorName: string;
 responsibleCompany: string;
 activityType: string;
 description: string;
 objective: string;
 materials: string;
 toolsUsed: string;
 priority: string;
 riskLevel: string;
 workPermit: string;
 weatherCondition: string;
 gpsCoordinates: string;
 observations: string;
 problemsFound: string;
 correctiveActions: string;
 nextActivities: string;
 fuelLevel: number;
 availableMaterials: string;
 executors: NormalizedExecutor[];
 workOrders: NormalizedWorkOrder[];
 comments?: Array<{author: string, date: string, text: string}>;
 signature?: { signedBy: string, signedAt: string, dataUrl: string };
}

export function normalizeReport(raw: any, isMockEnabled = true): NormalizedReport {
 if (!raw) return {} as NormalizedReport;

 const executors = (raw.operators || raw.executors || []).map((e: any) => ({
 name: e.name ||'',
 registration: e.registration ||''
 }));

 const workOrders = (raw.workOrders || []).map((os: any) => ({
 id: os.id ||'',
 number: os.number ||'',
 location: os.location ||'',
 maintenanceType: os.maintenanceType ||'',
 cause: os.cause ||'',
 activities: os.activities || os.description ||'',
 materialsUsed: Array.isArray(os.materialsUsed) ? os.materialsUsed : (os.materials ? [os.materials] : []),
 quantityMeters: os.quantityMeters ||'',
 quantityPieces: os.quantityPieces ||'',
 startTime: os.startTime ||'',
 endTime: os.endTime ||'',
 status: os.status ||'',
 osStatus: os.osStatus ||'',
 photoPaths: Array.isArray(os.photoPaths) ? os.photoPaths : (os.photos ? os.photos : [])
 }));

 // Converte string de data ISO em timestamp do Firestore-like se necessário
 let createdAt = raw.createdAt;
 if (createdAt && typeof createdAt ==='string') {
 const parsed = new Date(createdAt);
 if (!isNaN(parsed.getTime())) {
 createdAt = {
 toDate: () => parsed,
 seconds: Math.floor(parsed.getTime() / 1000)
 };
 }
 } else if (createdAt && typeof createdAt.toDate !=='function') {
 // Se for um objeto com seconds/nanoseconds mas sem toDate (JSON simples)
 if (typeof createdAt.seconds ==='number') {
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
 if (date && typeof date ==='string') {
 const parsed = new Date(date);
 if (!isNaN(parsed.getTime())) {
 date = parsed.toLocaleDateString('pt-BR');
 }
 }

 return {
 uuid: raw.uuid || raw.id ||'',
 mineLocation: raw.globalLocation || raw.mineLocation ||'',
 shift: raw.shift ||'',
 team: raw.team ||'',
 equipment: raw.globalEquipment || raw.equipment ||'',
 status: raw.syncStatus || raw.status ||'draft',
 createdAt: createdAt || null,
 updatedAt: raw.updatedAt || null,
 date: date ||'',
 supervisorName: raw.supervisorName || (isMockEnabled ? 'Eng. Pedro Santos' : ''),
 responsibleCompany: raw.responsibleCompany || (isMockEnabled ? 'CMOC Brasil' : ''),
 activityType: raw.activityType || (isMockEnabled ? 'Lavra' : ''),
 description: raw.observations || raw.description || '',
 objective: raw.objective || '',
 materials: raw.materials || '',
 toolsUsed: raw.toolsUsed || '',
 priority: raw.priority || (isMockEnabled ? 'Baixa' : ''),
 riskLevel: raw.riskLevel || (isMockEnabled ? 'Baixo' : ''),
 workPermit: raw.workPermit || '',
 weatherCondition: raw.weatherCondition || (isMockEnabled ? 'Encoberto' : ''),
 gpsCoordinates: raw.gpsCoordinates ||'',
 observations: raw.observations ||'',
 problemsFound: raw.problemsFound ||'',
 correctiveActions: raw.correctiveActions ||'',
 nextActivities: raw.nextActivities ||'',
 fuelLevel: typeof raw.fuelLevel ==='number' ? raw.fuelLevel : 0,
 availableMaterials: raw.availableMaterials ||'',
 executors,
 workOrders,
 comments: raw.comments || [],
 signature: raw.signature || null
 };
}
