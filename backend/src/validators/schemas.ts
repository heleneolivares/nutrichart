import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Contraseña mínimo 6 caracteres'),
});

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  name: z.string().min(2, 'Nombre requerido'),
});

export const patientSchema = z.object({
  firstName: z.string().min(1, 'Nombre requerido'),
  lastName: z.string().min(1, 'Apellido requerido'),
  sex: z.enum(['M', 'F']),
  birthDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Fecha inválida'),
  activityLevel: z.string().optional().default('moderado'),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  notes: z.string().optional(),
});

const optionalFloat = z.number().optional().nullable();

export const consultationSchema = z.object({
  date: z.string().optional(),
  anamnesis: z.string().optional(),
  // Básicas
  weight: optionalFloat,
  height: optionalFloat,
  sittingHeight: optionalFloat,
  // Perímetros
  armRelaxed: optionalFloat,
  armFlexed: optionalFloat,
  forearm: optionalFloat,
  waistMin: optionalFloat,
  hipMax: optionalFloat,
  medialThigh: optionalFloat,
  maxCalf: optionalFloat,
  // Diámetros
  humeral: optionalFloat,
  femoral: optionalFloat,
  bistyloid: optionalFloat,
  bimalleolar: optionalFloat,
  // Pliegues
  triceps: optionalFloat,
  subscapular: optionalFloat,
  biceps: optionalFloat,
  iliacCrest: optionalFloat,
  supraspinal: optionalFloat,
  abdominal: optionalFloat,
  anteriorThigh: optionalFloat,
  medialCalf: optionalFloat,
});
