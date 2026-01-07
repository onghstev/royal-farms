'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Egg, TrendingUp, TrendingDown, Bird, Activity, Sparkles, BarChart3 } from 'lucide-react';

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
      subtitle: 'Fresh collections',
      icon: Egg,
      gradient: 'from-blue-500 via-blue-600 to-indigo-600',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'This Week',
      value: kpis?.weekEggs?.toLocaleString() || '0',
      subtitle: 'Weekly production',
      icon: BarChart3,
      gradient: 'from-emerald-500 via-emerald-600 to-green-600',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-600',
      borderColor: 'border-emerald-200',
      trend: '+8%',
      trendUp: true,
    },
    {
      title: 'This Month',
      value: kpis?.monthEggs?.toLocaleString() || '0',
      subtitle: 'Monthly total',
      icon: Sparkles,
      gradient: 'from-purple-500 via-purple-600 to-pink-600',
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200',
      trend: '+15%',
      trendUp: true,
    },
    {
      title: 'Avg Production',
      value: `${kpis?.avgProduction?.toFixed(1) || '0'}%`,
      subtitle: '30-day average',
      icon: TrendingUp,
      gradient: 'from-teal-500 via-teal-600 to-cyan-600',
      iconBg: 'bg-teal-500/10',
      iconColor: 'text-teal-600',
      borderColor: 'border-teal-200',
      trend: '+3.2%',
      trendUp: true,
    },
    {
      title: 'Week Mortality',
      value: kpis?.weekMortality?.toLocaleString() || '0',
      subtitle: 'Last 7 days',
      icon: TrendingDown,
      gradient: 'from-rose-500 via-rose-600 to-red-600',
      iconBg: 'bg-rose-500/10',
      iconColor: 'text-rose-600',
      borderColor: 'border-rose-200',
      trend: '-5%',
      trendUp: false,
    },
    {
      title: 'Mortality Rate',
      value: `${kpis?.mortalityRate?.toFixed(2) || '0'}%`,
      subtitle: 'Overall rate',
      icon: Activity,
      gradient: 'from-orange-500 via-orange-600 to-amber-600',
      iconBg: 'bg-orange-500/10',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-200',
      trend: '-2%',
      trendUp: false,
    },
    {
      title: 'Active Flocks',
      value: kpis?.activeFlocks?.toString() || '0',
      subtitle: 'Layer groups',
      icon: Bird,
      gradient: 'from-cyan-500 via-cyan-600 to-blue-600',
      iconBg: 'bg-cyan-500/10',
      iconColor: 'text-cyan-600',
      borderColor: 'border-cyan-200',
    },
    {
      title: 'Active Batches',
      value: kpis?.activeBatches?.toString() || '0',
      subtitle: 'Broiler groups',
      icon: Bird,
      gradient: 'from-indigo-500 via-indigo-600 to-blue-600',
      iconBg: 'bg-indigo-500/10',
      iconColor: 'text-indigo-600',
      borderColor: 'border-indigo-200',
    },
    {
      title: 'Total Birds',
      value: kpis?.totalBirds?.toLocaleString() || '0',
      subtitle: 'Current stock',
      icon: Bird,
      gradient: 'from-fuchsia-500 via-fuchsia-600 to-pink-600',
      iconBg: 'bg-fuchsia-500/10',
      iconColor: 'text-fuchsia-600',
      borderColor: 'border-fuchsia-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, index) => (
        <Card 
          key={index} 
          className={`relative overflow-hidden border-2 ${card.borderColor} hover:shadow-2xl hover:scale-105 transition-all duration-300 group cursor-pointer`}
        >
          {/* Gradient overlay on hover */}
          <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
          
          <CardContent className="p-6 relative">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                <p className="text-xs text-gray-500">{card.subtitle}</p>
              </div>
              <div className={`${card.iconBg} p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300`}>
                <card.icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-4xl font-bold text-gray-900 tracking-tight">
                {card.value}
              </h3>
              {card.trend && (
                <div className="flex items-center gap-1">
                  <span className={`text-sm font-semibold ${card.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                    {card.trend}
                  </span>
                  <span className="text-xs text-gray-500">vs last period</span>
                </div>
              )}
            </div>

            {/* Bottom accent line */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
