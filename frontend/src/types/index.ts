export interface User {
  id: number;
  email: string;
  name: string;
}

export interface Patient {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  sex: 'M' | 'F';
  birthDate: string;
  activityLevel: string;
  phone?: string;
  email?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  consultations?: Consultation[];
}

export interface Consultation {
  id: number;
  patientId: number;
  date: string;
  anamnesis?: string | null;
  // Básicas
  weight?: number | null;
  height?: number | null;
  sittingHeight?: number | null;
  // Perímetros
  armRelaxed?: number | null;
  armFlexed?: number | null;
  forearm?: number | null;
  waistMin?: number | null;
  hipMax?: number | null;
  medialThigh?: number | null;
  maxCalf?: number | null;
  // Diámetros
  humeral?: number | null;
  femoral?: number | null;
  bistyloid?: number | null;
  bimalleolar?: number | null;
  // Pliegues
  triceps?: number | null;
  subscapular?: number | null;
  biceps?: number | null;
  iliacCrest?: number | null;
  supraspinal?: number | null;
  abdominal?: number | null;
  anteriorThigh?: number | null;
  medialCalf?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PatientStats {
  total: number;
  firstVisit: string | null;
  lastVisit: string | null;
  avgDaysBetween: number;
  weightChange: number | null;
}

export interface Calculations {
  imc: number | null;
  fatPct: number | null;
  kgFat: number | null;
  kgLean: number | null;
  kgMuscleMartin: number | null;
  kgMuscleLee: number | null;
  kgSkeleton: number | null;
  musclePct: number | null;
  skeletonPct: number | null;
  sumFolds: number | null;
}
