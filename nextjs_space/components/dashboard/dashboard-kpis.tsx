'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Egg, TrendingUp, TrendingDown, Bird, Activity } from 'lucide-react';

interface KPIsProps {
  kpis: {
    todayEggs: number;
    weekEggs: number;
    monthEggs: number;
    avgProduction: number;
    weekMortality: number;
    mortalityRate: number;
    activeFlocks: number;
    activeBatches: number;
    totalBirds: number;
  };
}

export function DashboardKPIs({ kpis }: KPIsProps) {
  const cards = [
    {
      title: 'Today\'s Eggs',
      value: kpis?.todayEggs?.toLocaleString() || '0',
      icon: Egg,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'This Week\'s Eggs',
      value: kpis?.weekEggs?.toLocaleString() || '0',
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'This Month\'s Eggs',
      value: kpis?.monthEggs?.toLocaleString() || '0',
      icon: Activity,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Avg. Production %',
      value: `${kpis?.avgProduction?.toFixed(1) || '0'}%`,
      icon: TrendingUp,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Week Mortality',
      value: kpis?.weekMortality?.toLocaleString() || '0',
      icon: TrendingDown,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Mortality Rate',
      value: `${kpis?.mortalityRate?.toFixed(2) || '0'}%`,
      icon: TrendingDown,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Active Flocks',
      value: kpis?.activeFlocks?.toString() || '0',
      icon: Bird,
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-50',
    },
    {
      title: 'Active Batches',
      value: kpis?.activeBatches?.toString() || '0',
      icon: Bird,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Total Birds',
      value: kpis?.totalBirds?.toLocaleString() || '0',
      icon: Bird,
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card, index) => (
        <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
          <CardHeader className={`pb-3 ${card.bgColor}`}>
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              <span>{card.title}</span>
              <div className={`p-2 rounded-lg bg-gradient-to-br ${card.color}`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-gray-900">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
