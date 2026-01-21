export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { DashboardKPIs } from '@/components/dashboard/dashboard-kpis';
import { EggProductionChart } from '@/components/dashboard/egg-production-chart';
import { MortalityChart } from '@/components/dashboard/mortality-chart';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { AlertsList } from '@/components/dashboard/alerts-list';

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
    allFlocks.reduce((sum: number, f: any) => sum + f.openingStock, 0) +
    allBatches.reduce((sum: number, b: any) => sum + b.quantityReceived, 0);

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
  const recentEggCollections = recentEggCollectionsRaw.map((collection: any) => ({
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
  const recentMortality = recentMortalityRaw.map((record: any) => ({
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

  const currentDate = new Date().toLocaleDateString('en-NG', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="space-y-8">
      {/* Stunning Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 p-8 shadow-2xl">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-white">Live Dashboard</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                Production Dashboard
              </h1>
              <p className="text-lg text-green-50 max-w-2xl">
                Welcome back, <span className="font-semibold">{(session.user as any)?.name || 'User'}</span>! 
                Here's your farm overview for today.
              </p>
              <p className="text-sm text-green-100 opacity-80">{currentDate}</p>
            </div>
            
            <div className="hidden lg:flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <DashboardKPIs kpis={data.kpis} />

      {/* Active Alerts */}
      {data.activeAlerts.length > 0 && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <AlertsList alerts={data.activeAlerts} />
        </div>
      )}

      {/* Charts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <div className="w-1 h-8 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full" />
            Production Analytics
          </h2>
          <div className="text-sm text-gray-600">Last 30 days</div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="animate-in fade-in slide-in-from-left-4 duration-500">
            <EggProductionChart data={data.eggProductionTrend} />
          </div>
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 delay-100">
            <MortalityChart data={data.mortalityTrend} />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full" />
            Recent Activity
          </h2>
        </div>
        <RecentActivity 
          eggCollections={data.recentEggCollections}
          mortalityRecords={data.recentMortality}
        />
      </div>
    </div>
  );
}
