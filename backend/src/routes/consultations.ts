import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { consultationSchema } from '../validators/schemas';

const router = Router({ mergeParams: true });
router.use(authMiddleware);

async function patientBelongsToUser(patientId: number, userId: number): Promise<boolean> {
  const p = await prisma.patient.findFirst({ where: { id: patientId, userId } });
  return !!p;
}

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const patientId = Number(req.params.patientId);
  if (!await patientBelongsToUser(patientId, req.userId!)) {
    res.status(404).json({ error: 'Paciente no encontrado' }); return;
  }
  const consultations = await prisma.consultation.findMany({
    where: { patientId },
    orderBy: { date: 'desc' },
  });
  res.json(consultations);
});

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const patientId = Number(req.params.patientId);
  if (!await patientBelongsToUser(patientId, req.userId!)) {
    res.status(404).json({ error: 'Paciente no encontrado' }); return;
  }
  const parsed = consultationSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.errors[0].message }); return; }
  const { date, ...rest } = parsed.data;
  const consultation = await prisma.consultation.create({
    data: { ...rest, patientId, date: date ? new Date(date) : new Date() },
  });
  res.status(201).json(consultation);
});

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const patientId = Number(req.params.patientId);
  if (!await patientBelongsToUser(patientId, req.userId!)) {
    res.status(404).json({ error: 'Paciente no encontrado' }); return;
  }
  const consultation = await prisma.consultation.findFirst({
    where: { id: Number(req.params.id), patientId },
  });
  if (!consultation) { res.status(404).json({ error: 'Consulta no encontrada' }); return; }
  res.json(consultation);
});

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const patientId = Number(req.params.patientId);
  if (!await patientBelongsToUser(patientId, req.userId!)) {
    res.status(404).json({ error: 'Paciente no encontrado' }); return;
  }
  const exists = await prisma.consultation.findFirst({ where: { id: Number(req.params.id), patientId } });
  if (!exists) { res.status(404).json({ error: 'Consulta no encontrada' }); return; }
  const parsed = consultationSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.errors[0].message }); return; }
  const { date, ...rest } = parsed.data;
  const consultation = await prisma.consultation.update({
    where: { id: Number(req.params.id) },
    data: { ...rest, ...(date ? { date: new Date(date) } : {}) },
  });
  res.json(consultation);
});

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const patientId = Number(req.params.patientId);
  if (!await patientBelongsToUser(patientId, req.userId!)) {
    res.status(404).json({ error: 'Paciente no encontrado' }); return;
  }
  const exists = await prisma.consultation.findFirst({ where: { id: Number(req.params.id), patientId } });
  if (!exists) { res.status(404).json({ error: 'Consulta no encontrada' }); return; }
  await prisma.consultation.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
});

export default router;
