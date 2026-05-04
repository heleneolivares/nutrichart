import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import patientsRouter from './routes/patients';
import consultationsRouter from './routes/consultations';

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = ['http://localhost:5173', process.env.FRONTEND_URL].filter(Boolean) as string[];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/patients', patientsRouter);
app.use('/api/patients/:patientId/consultations', consultationsRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`✅ Backend corriendo en http://localhost:${PORT}`);
});
