import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from './lib/prisma';

async function main() {
  const password1 = await bcrypt.hash('nutri123', 10);
  const password2 = await bcrypt.hash('admin123', 10);

  const user1 = await prisma.user.upsert({
    where: { email: 'nutricionista@nutrichart.com' },
    update: {},
    create: { email: 'nutricionista@nutrichart.com', password: password1, name: 'Dra. María García' },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'admin@nutrichart.com' },
    update: {},
    create: { email: 'admin@nutrichart.com', password: password2, name: 'Dr. Carlos López' },
  });

  await prisma.patient.upsert({
    where: { id: 1 },
    update: {},
    create: {
      userId: user1.id,
      firstName: 'Ana',
      lastName: 'Martínez',
      sex: 'F',
      birthDate: new Date('1990-05-15'),
      activityLevel: 'moderado',
      phone: '555-0101',
      notes: 'Paciente de ejemplo',
    },
  });

  await prisma.patient.upsert({
    where: { id: 2 },
    update: {},
    create: {
      userId: user1.id,
      firstName: 'Juan',
      lastName: 'Rodríguez',
      sex: 'M',
      birthDate: new Date('1985-03-22'),
      activityLevel: 'activo',
      phone: '555-0202',
    },
  });

  console.log('✅ Seed completado');
  console.log('👤 Usuario 1: nutricionista@nutrichart.com / nutri123');
  console.log('👤 Usuario 2: admin@nutrichart.com / admin123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
