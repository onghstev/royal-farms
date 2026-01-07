'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Syringe, Stethoscope, AlertTriangle, Activity, ChevronRight } from 'lucide-react';

export default function HealthDashboard() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [stats, setStats] = useState({
    vaccinations: 0,
    healthChecks: 0,
    activeOutbreaks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchStats();
    }
  }, [status, router]);

  const fetchStats = async () => {
    try {
      const [vaccinations, checks, outbreaks] = await Promise.all([
        fetch('/api/health/vaccination-records').then(r => r.json()),
        fetch('/api/health/health-checks').then(r => r.json()),
        fetch('/api/health/disease-outbreaks?isResolved=false').then(r => r.json()),
      ]);

      setStats({
        vaccinations: vaccinations.records?.length || 0,
        healthChecks: checks.checks?.length || 0,
        activeOutbreaks: outbreaks.outbreaks?.length || 0,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const modules = [
    {
      title: 'Vaccination Records',
      description: 'Track and manage all vaccination activities for flocks and batches',
      icon: Syringe,
      href: '/dashboard/health/vaccinations',
      color: 'blue',
      stat: `${stats.vaccinations} records`,
    },
    {
      title: 'Health Checks',
      description: 'Daily health inspections and monitoring of bird conditions',
      icon: Stethoscope,
      href: '/dashboard/health/checks',
      color: 'green',
      stat: `${stats.healthChecks} checks`,
    },
    {
      title: 'Disease Outbreaks',
      description: 'Monitor and manage disease incidents and treatment protocols',
      icon: AlertTriangle,
      href: '/dashboard/health/outbreaks',
      color: stats.activeOutbreaks > 0 ? 'red' : 'gray',
      stat: `${stats.activeOutbreaks} active`,
      alert: stats.activeOutbreaks > 0,
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'border-blue-200 hover:border-blue-400 bg-blue-50',
      green: 'border-green-200 hover:border-green-400 bg-green-50',
      red: 'border-red-200 hover:border-red-400 bg-red-50',
      gray: 'border-gray-200 hover:border-gray-400 bg-gray-50',
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  const getIconColorClasses = (color: string) => {
    const colors = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      red: 'text-red-600',
      gray: 'text-gray-600',
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Health & Vaccination Management</h1>
        <p className="text-gray-600 mt-1">Monitor bird health, track vaccinations, and manage disease control</p>
      </div>

      {/* Active Outbreaks Alert */}
      {stats.activeOutbreaks > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            There {stats.activeOutbreaks === 1 ? 'is' : 'are'} {stats.activeOutbreaks} active disease outbreak{stats.activeOutbreaks > 1 ? 's' : ''} requiring attention!
          </AlertDescription>
        </Alert>
      )}

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Link key={module.title} href={module.href}>
              <Card className={`cursor-pointer transition-all hover:shadow-lg border-2 ${getColorClasses(module.color)}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Icon className={`h-8 w-8 ${getIconColorClasses(module.color)}`} />
                    {module.alert && (
                      <div className="animate-pulse">
                        <Activity className="h-5 w-5 text-red-600" />
                      </div>
                    )}
                  </div>
                  <CardTitle className="mt-4">{module.title}</CardTitle>
                  <CardDescription className="mt-2">{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">{module.stat}</p>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Info */}
      <Card>
        <CardHeader>
          <CardTitle>Health Management Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <Syringe className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Vaccination Protocol</p>
              <p className="text-sm text-gray-600">
                Follow recommended vaccination schedules for Newcastle, Gumboro, Fowl Pox, and other diseases. Maintain proper records for compliance.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Stethoscope className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Daily Health Checks</p>
              <p className="text-sm text-gray-600">
                Inspect birds daily for signs of illness: behavior changes, respiratory issues, droppings abnormalities, reduced feed/water intake.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Disease Management</p>
              <p className="text-sm text-gray-600">
                Report any disease outbreaks immediately. Isolate affected birds, implement biosecurity measures, and consult with veterinarian.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
