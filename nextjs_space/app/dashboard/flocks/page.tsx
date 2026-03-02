export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { FlocksTable } from '@/components/flocks/flocks-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Bird, TrendingUp, TrendingDown, Users } from 'lucide-react';
import Link from 'next/link';

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

  const flocks = flocksRaw.map((flock: any) => ({
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

  const activeFlocks = flocks.filter((f: any) => f.status === 'active').length;
  const decliningFlocks = flocks.filter((f: any) => f.status === 'declining').length;
  const totalStock = flocks.reduce((sum: number, f: any) => sum + (f.currentStock || 0), 0);

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Livestock Groups
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage all your livestock (poultry, cattle, fish, goats, etc.)
          </p>
        </div>
        {canCreate && (
          <Link href="/dashboard/flocks/new">
            <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg shadow-green-500/25 gap-2">
              <Plus className="w-4 h-4" />
              New Livestock
            </Button>
          </Link>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 hover:shadow-lg transition-all hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Flocks</p>
                <p className="text-3xl font-bold mt-2">{flocks.length}</p>
                <p className="text-sm text-muted-foreground mt-1">All groups</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Bird className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:shadow-lg transition-all hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Flocks</p>
                <p className="text-3xl font-bold mt-2 text-emerald-600">{activeFlocks}</p>
                <p className="text-sm text-muted-foreground mt-1">Healthy groups</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:shadow-lg transition-all hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Declining</p>
                <p className="text-3xl font-bold mt-2 text-amber-600">{decliningFlocks}</p>
                <p className="text-sm text-muted-foreground mt-1">Needs attention</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:shadow-lg transition-all hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Stock</p>
                <p className="text-3xl font-bold mt-2 text-blue-600">{totalStock.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mt-1">All livestock</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <FlocksTable flocks={flocks} userRole={userRole} />
    </div>
  );
}
