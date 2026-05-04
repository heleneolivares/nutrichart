import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { patientSchema } from '../validators/schemas';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { search } = req.query as { search?: string };
  const where: any = { userId: req.userId };
  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
    ];
  }
  const patients = await prisma.patient.findMany({
    where,
    include: { consultations: { orderBy: { date: 'desc' }, take: 1 } },
    orderBy: { lastName: 'asc' },
  });
  res.json(patients);
});

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = patientSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }
  const patient = await prisma.patient.create({
    data: { ...parsed.data, userId: req.userId!, birthDate: new Date(parsed.data.birthDate) },
  });
  res.status(201).json(patient);
});

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const patient = await prisma.patient.findFirst({
    where: { id: Number(req.params.id), userId: req.userId },
    include: {
      consultations: { orderBy: { date: 'desc' } },
    },
  });
  if (!patient) { res.status(404).json({ error: 'Paciente no encontrado' }); return; }
  res.json(patient);
});

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const exists = await prisma.patient.findFirst({ where: { id: Number(req.params.id), userId: req.userId } });
  if (!exists) { res.status(404).json({ error: 'Paciente no encontrado' }); return; }
  const parsed = patientSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.errors[0].message }); return; }
  const patient = await prisma.patient.update({
    where: { id: Number(req.params.id) },
    data: { ...parsed.data, birthDate: new Date(parsed.data.birthDate) },
  });
  res.json(patient);
});

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const exists = await prisma.patient.findFirst({ where: { id: Number(req.params.id), userId: req.userId } });
  if (!exists) { res.status(404).json({ error: 'Paciente no encontrado' }); return; }
  await prisma.patient.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
});

router.get('/:id/stats', async (req: AuthRequest, res: Response): Promise<void> => {
  const patient = await prisma.patient.findFirst({ where: { id: Number(req.params.id), userId: req.userId } });
  if (!patient) { res.status(404).json({ error: 'Paciente no encontrado' }); return; }
  const consultations = await prisma.consultation.findMany({
    where: { patientId: Number(req.params.id) },
    orderBy: { date: 'asc' },
    select: { date: true, weight: true },
  });
  const total = consultations.length;
  if (total === 0) { res.json({ total: 0, firstVisit: null, lastVisit: null, weightChange: null }); return; }
  const firstVisit = consultations[0].date;
  const lastVisit = consultations[total - 1].date;
  const daysBetween = total > 1
    ? (new Date(lastVisit).getTime() - new Date(firstVisit).getTime()) / (1000 * 60 * 60 * 24)
    : 0;
  const avgDaysBetween = total > 1 ? Math.round(daysBetween / (total - 1)) : 0;
  const weights = consultations.filter(c => c.weight != null).map(c => c.weight!);
  const weightChange = weights.length >= 2 ? Number((weights[weights.length - 1] - weights[0]).toFixed(1)) : null;
  res.json({ total, firstVisit, lastVisit, avgDaysBetween, weightChange });
});

export default router;
