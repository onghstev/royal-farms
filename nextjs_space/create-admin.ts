import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('RoyalFarms2026!', 10);
  
  const farmManagerRole = await prisma.role.findFirst({
    where: { name: 'Farm Manager' }
  });
  
  if (!farmManagerRole) {
    console.error('Farm Manager role not found!');
    return;
  }
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@royalfarms.com' },
    update: {
      passwordHash: hashedPassword,
      isActive: true
    },
    create: {
      email: 'admin@royalfarms.com',
      firstName: 'Admin',
      lastName: 'User',
      passwordHash: hashedPassword,
      roleId: farmManagerRole.id,
      isActive: true
    }
  });
  
  console.log('Admin user created/updated:', admin.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
