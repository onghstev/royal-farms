import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { FlocksTable } from '@/components/flocks/flocks-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

async function getFlocks() {
  const flocksRaw = await prisma.flock.findMany({
    include: {
      site: { select: { name: true } },
      manager: { select: { firstName: true, lastName: true } },
      _count: {
        select: {
          eggCollections: true,
          mortalityRecords: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Convert Decimal to number
  const flocks = flocksRaw.map(flock => ({
    ...flock,
    costPerBird: flock.costPerBird ? Number(flock.costPerBird) : null,
  }));

  return flocks;
}

export default async function FlocksPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const flocks = await getFlocks();
  const userRole = (session.user as any)?.role;
  const canCreate = userRole === 'Farm Manager' || userRole === 'Supervisor';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Layer Flocks</h1>
          <p className="text-gray-600 mt-1">Manage your layer chicken flocks</p>
        </div>
        {canCreate && (
          <Link href="/dashboard/flocks/new">
            <Button className="bg-gradient-to-r from-green-600 to-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              New Flock
            </Button>
          </Link>
        )}
      </div>

      <FlocksTable flocks={flocks} userRole={userRole} />
    </div>
  );
}
