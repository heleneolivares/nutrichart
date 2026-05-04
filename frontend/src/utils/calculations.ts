import { Consultation, Calculations } from '../types';

export function calculateMedian(values: (number | string)[]): number | null {
  const nums = values
    .map((v) => (typeof v === 'string' ? parseFloat(v) : v))
    .filter((v) => !isNaN(v) && v > 0);
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function getAgeDecimal(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  const ms = now.getTime() - birth.getTime();
  return ms / (1000 * 60 * 60 * 24 * 365.25);
}

export function calculate(c: Partial<Consultation>, sex: 'M' | 'F', birthDate: string): Calculations {
  const w = c.weight ?? null;
  const h = c.height ?? null;

  // IMC
  const imc = w && h ? +(w / ((h / 100) ** 2)).toFixed(1) : null;

  // % Grasa Durnin & Womersley
  const tri = c.triceps ?? null;
  const sub = c.subscapular ?? null;
  const bic = c.biceps ?? null;
  const ili = c.iliacCrest ?? null;
  let fatPct: number | null = null;
  let kgFat: number | null = null;
  let kgLean: number | null = null;
  if (tri && sub && bic && ili) {
    const sum4 = tri + sub + bic + ili;
    const log = Math.log10(sum4);
    fatPct = sex === 'M'
      ? +((495 / (1.1765 - 0.0744 * log)) - 450).toFixed(1)
      : +((495 / (1.1567 - 0.0717 * log)) - 450).toFixed(1);
    if (w) {
      kgFat = +(w * fatPct / 100).toFixed(1);
      kgLean = +(w - kgFat).toFixed(1);
    }
  }

  // Kg Músculo Martin (1990)
  const ant = c.anteriorThigh ?? null;
  const med = c.medialThigh ?? null;
  const fore = c.forearm ?? null;
  const maxC = c.maxCalf ?? null;
  const medC = c.medialCalf ?? null;
  let kgMuscleMartin: number | null = null;
  if (h && med && ant && fore && maxC && medC) {
    const corrThigh = med - ant * 0.3141;
    const corrCalf = maxC - medC * 0.3141;
    kgMuscleMartin = +((h * (0.0553 * corrThigh ** 2 + 0.0987 * fore ** 2 + 0.0331 * corrCalf ** 2) - 2445) * 0.001).toFixed(1);
  }

  // Kg Músculo Lee et al. (2000)
  const armR = c.armRelaxed ?? null;
  let kgMuscleLee: number | null = null;
  if (h && armR && tri && med && ant && maxC && medC) {
    const sexVal = sex === 'M' ? 1 : 0;
    const age = getAgeDecimal(birthDate);
    const corrArm = armR - tri * 0.314;
    const corrThigh = med - ant * 0.314;
    const corrCalf = maxC - medC * 0.314;
    kgMuscleLee = +((h * 0.01) * (0.00744 * corrArm ** 2 + 0.00088 * corrThigh ** 2 + 0.00441 * corrCalf ** 2)
      + (2.4 * sexVal) - (0.048 * age) + 7.8).toFixed(1);
  }

  // Kg Esqueleto Martin (1991)
  const hum = c.humeral ?? null;
  const fem = c.femoral ?? null;
  const bis = c.bistyloid ?? null;
  const bim = c.bimalleolar ?? null;
  let kgSkeleton: number | null = null;
  if (h && hum && fem && bis && bim) {
    const sumD = hum + fem + bis + bim;
    kgSkeleton = +(0.6 * h * sumD ** 2 * 0.0001).toFixed(1);
  }

  const refMuscle = kgMuscleLee ?? kgMuscleMartin;
  const musclePct = refMuscle && w ? +(refMuscle / w * 100).toFixed(1) : null;
  const skeletonPct = kgSkeleton && w ? +(kgSkeleton / w * 100).toFixed(1) : null;

  // Sumatoria 8 pliegues
  const folds = [c.triceps, c.subscapular, c.biceps, c.iliacCrest, c.supraspinal, c.abdominal, c.anteriorThigh, c.medialCalf];
  const validFolds = folds.filter((f) => f != null) as number[];
  const sumFolds = validFolds.length === 8 ? +(validFolds.reduce((a, b) => a + b, 0)).toFixed(1) : null;

  return { imc, fatPct, kgFat, kgLean, kgMuscleMartin, kgMuscleLee, kgSkeleton, musclePct, skeletonPct, sumFolds };
}
