import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'admin@royalfarms.com' },
    include: { role: true }
  });
  console.log('Admin user:', JSON.stringify(user, null, 2));
  
  // If not active, activate it
  if (user && !user.isActive) {
    await prisma.user.update({
      where: { id: user.id },
      data: { isActive: true }
    });
    console.log('User activated!');
  }
  
  // List all users
  const allUsers = await prisma.user.findMany({
    select: { email: true, isActive: true }
  });
  console.log('All users:', allUsers);
}

main().catch(console.error).finally(() => prisma.$disconnect());
