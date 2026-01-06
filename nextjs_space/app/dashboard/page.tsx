import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { DashboardKPIs } from '@/components/dashboard/dashboard-kpis';
import { EggProductionChart } from '@/components/dashboard/egg-production-chart';
import { MortalityChart } from '@/components/dashboard/mortality-chart';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { AlertsList } from '@/components/dashboard/alerts-list';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

async function getDashboardData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const last30Days = new Date(today);
  last30Days.setDate(today.getDate() - 30);

  // Today's egg production
  const todayEggs = await prisma.dailyEggCollection.aggregate({
    where: { collectionDate: today },
    _sum: {
      goodEggsCount: true,
      brokenEggsCount: true,
      totalEggsCount: true,
    },
  });

  // This week's eggs
  const weekEggs = await prisma.dailyEggCollection.aggregate({
    where: {
      collectionDate: { gte: startOfWeek },
    },
    _sum: {
      totalEggsCount: true,
    },
  });

  // This month's eggs
  const monthEggs = await prisma.dailyEggCollection.aggregate({
    where: {
      collectionDate: { gte: startOfMonth },
    },
    _sum: {
      totalEggsCount: true,
    },
  });

  // Active flocks and batches
  const activeFlocks = await prisma.flock.count({
    where: { status: 'active' },
  });

  const activeBatches = await prisma.batch.count({
    where: { status: { in: ['active', 'growing', 'ready'] } },
  });

  // Total birds
  const flockBirds = await prisma.flock.aggregate({
    where: { status: 'active' },
    _sum: { currentStock: true },
  });

  const batchBirds = await prisma.batch.aggregate({
    where: { status: { in: ['active', 'growing', 'ready'] } },
    _sum: { currentStock: true },
  });

  const totalBirds = (flockBirds._sum?.currentStock || 0) + (batchBirds._sum?.currentStock || 0);

  // This week's mortality
  const weekMortality = await prisma.mortalityRecord.aggregate({
    where: {
      mortalityDate: { gte: startOfWeek },
    },
    _sum: {
      mortalityCount: true,
    },
  });

  // Overall mortality rate
  const totalMortality = await prisma.mortalityRecord.aggregate({
    _sum: {
      mortalityCount: true,
    },
  });

  const allFlocks = await prisma.flock.findMany({
    select: { openingStock: true },
  });

  const allBatches = await prisma.batch.findMany({
    select: { quantityReceived: true },
  });

  const totalOpening = 
    allFlocks.reduce((sum, f) => sum + f.openingStock, 0) +
    allBatches.reduce((sum, b) => sum + b.quantityReceived, 0);

  const mortalityRate = totalOpening > 0 
    ? ((totalMortality._sum?.mortalityCount || 0) / totalOpening) * 100 
    : 0;

  // Average production percentage
  const avgProduction = await prisma.dailyEggCollection.aggregate({
    where: {
      collectionDate: { gte: last30Days },
    },
    _avg: {
      productionPercentage: true,
    },
  });

  // Last 30 days egg production for chart
  const eggProductionTrend = await prisma.dailyEggCollection.groupBy({
    by: ['collectionDate'],
    where: {
      collectionDate: { gte: last30Days },
    },
    _sum: {
      totalEggsCount: true,
      goodEggsCount: true,
      brokenEggsCount: true,
    },
    orderBy: {
      collectionDate: 'asc',
    },
  });

  // Last 30 days mortality for chart
  const mortalityTrend = await prisma.mortalityRecord.groupBy({
    by: ['mortalityDate'],
    where: {
      mortalityDate: { gte: last30Days },
    },
    _sum: {
      mortalityCount: true,
    },
    orderBy: {
      mortalityDate: 'asc',
    },
  });

  // Recent egg collections
  const recentEggCollectionsRaw = await prisma.dailyEggCollection.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      flock: { select: { flockName: true } },
      recorder: { select: { firstName: true, lastName: true } },
    },
  });

  // Convert Decimal to number
  const recentEggCollections = recentEggCollectionsRaw.map(collection => ({
    ...collection,
    productionPercentage: collection.productionPercentage ? Number(collection.productionPercentage) : null,
  }));

  // Recent mortality
  const recentMortalityRaw = await prisma.mortalityRecord.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      flock: { select: { flockName: true } },
      batch: { select: { batchName: true } },
      recorder: { select: { firstName: true, lastName: true } },
    },
  });

  // Convert Decimal to number
  const recentMortality = recentMortalityRaw.map(record => ({
    ...record,
    mortalityRate: record.mortalityRate ? Number(record.mortalityRate) : null,
  }));

  // Active alerts
  const activeAlerts = await prisma.productionAlert.findMany({
    where: { isResolved: false },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      flock: { select: { flockName: true } },
      batch: { select: { batchName: true } },
    },
  });

  return {
    kpis: {
      todayEggs: todayEggs._sum?.totalEggsCount || 0,
      weekEggs: weekEggs._sum?.totalEggsCount || 0,
      monthEggs: monthEggs._sum?.totalEggsCount || 0,
      avgProduction: Number(avgProduction._avg?.productionPercentage || 0),
      weekMortality: weekMortality._sum?.mortalityCount || 0,
      mortalityRate: Number(mortalityRate.toFixed(2)),
      activeFlocks,
      activeBatches,
      totalBirds,
    },
    eggProductionTrend,
    mortalityTrend,
    recentEggCollections,
    recentMortality,
    activeAlerts,
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Production Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back, {(session.user as any)?.name || 'User'}!
        </p>
      </div>

      {/* KPIs */}
      <DashboardKPIs kpis={data.kpis} />

      {/* Active Alerts */}
      {data.activeAlerts.length > 0 && (
        <AlertsList alerts={data.activeAlerts} />
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EggProductionChart data={data.eggProductionTrend} />
        <MortalityChart data={data.mortalityTrend} />
      </div>

      {/* Recent Activity */}
      <RecentActivity 
        eggCollections={data.recentEggCollections}
        mortalityRecords={data.recentMortality}
      />
    </div>
  );
}
