'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Bird, Edit, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';

interface Flock {
  id: string;
  flockName: string;
  flockType: string;
  breed: string | null;
  status: string;
  arrivalDate: string;
  openingStock: number;
  currentStock: number;
  supplier: string | null;
  costPerBird: number | null;
  notes: string | null;
  site: {
    name: string;
  };
  manager: {
    firstName: string;
    lastName: string;
  } | null;
  eggCollections: any[];
  mortalityRecords: any[];
}

export default function FlockDetailPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const params = useParams();
  const flockId = params?.id as string;
  const [isLoading, setIsLoading] = useState(true);
  const [flock, setFlock] = useState<Flock | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (flockId) {
      fetchFlock();
    }
  }, [flockId]);

  const fetchFlock = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/flocks/${flockId}`);
      if (response.ok) {
        const data = await response.json();
        setFlock(data);
      } else {
        toast.error('Failed to fetch flock details');
        router.push('/dashboard/flocks');
      }
    } catch (error) {
      console.error('Error fetching flock:', error);
      toast.error('Failed to fetch flock details');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!flock) {
    return null;
  }

  const mortalityCount = flock.mortalityRecords.reduce((sum, record) => sum + record.mortalityCount, 0);
  const survivalRate = flock.openingStock > 0 
    ? ((flock.currentStock / flock.openingStock) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/flocks">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Bird className="w-8 h-8 text-green-600" />
              {flock.flockName}
            </h1>
            <p className="text-gray-600 mt-1">{flock.breed || 'Layer Flock'}</p>
          </div>
        </div>
        <Link href={`/dashboard/flocks/${flockId}/edit`}>
          <Button className="bg-gradient-to-r from-green-600 to-emerald-600">
            <Edit className="w-4 h-4 mr-2" />
            Edit Flock
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Stock</p>
                <p className="text-3xl font-bold text-gray-900">{flock.currentStock.toLocaleString()}</p>
              </div>
              <Bird className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Opening Stock</p>
                <p className="text-3xl font-bold text-gray-900">{flock.openingStock.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Survival Rate</p>
                <p className="text-3xl font-bold text-gray-900">{survivalRate}%</p>
              </div>
              <TrendingUp className="w-10 h-10 text-emerald-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Mortality</p>
                <p className="text-3xl font-bold text-gray-900">{mortalityCount.toLocaleString()}</p>
              </div>
              <TrendingDown className="w-10 h-10 text-red-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle>Flock Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Flock Type</p>
              <p className="text-base text-gray-900 mt-1 capitalize">{flock.flockType}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600">Status</p>
              <p className="text-base text-gray-900 mt-1 capitalize">{flock.status}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600">Site</p>
              <p className="text-base text-gray-900 mt-1">{flock.site.name}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600">Arrival Date</p>
              <p className="text-base text-gray-900 mt-1 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(flock.arrivalDate).toLocaleDateString('en-NG')}
              </p>
            </div>

            {flock.supplier && (
              <div>
                <p className="text-sm font-medium text-gray-600">Supplier</p>
                <p className="text-base text-gray-900 mt-1">{flock.supplier}</p>
              </div>
            )}

            {flock.costPerBird && (
              <div>
                <p className="text-sm font-medium text-gray-600">Cost Per Bird</p>
                <p className="text-base text-gray-900 mt-1">₦{flock.costPerBird.toLocaleString()}</p>
              </div>
            )}

            {flock.manager && (
              <div>
                <p className="text-sm font-medium text-gray-600">Managed By</p>
                <p className="text-base text-gray-900 mt-1">
                  {flock.manager.firstName} {flock.manager.lastName}
                </p>
              </div>
            )}

            {flock.notes && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-600">Notes</p>
                <p className="text-base text-gray-900 mt-1">{flock.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Egg Collections</CardTitle>
            <CardDescription>Last 10 collections</CardDescription>
          </CardHeader>
          <CardContent>
            {flock.eggCollections.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No egg collections yet</p>
            ) : (
              <div className="space-y-2">
                {flock.eggCollections.map((collection) => (
                  <div key={collection.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm text-gray-600">
                      {new Date(collection.collectionDate).toLocaleDateString('en-NG')}
                    </span>
                    <span className="text-sm font-semibold text-green-600">
                      {collection.totalEggsCount.toLocaleString()} eggs
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Mortality</CardTitle>
            <CardDescription>Last 10 records</CardDescription>
          </CardHeader>
          <CardContent>
            {flock.mortalityRecords.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No mortality records</p>
            ) : (
              <div className="space-y-2">
                {flock.mortalityRecords.map((record) => (
                  <div key={record.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm text-gray-600">
                      {new Date(record.mortalityDate).toLocaleDateString('en-NG')}
                    </span>
                    <span className="text-sm font-semibold text-red-600">
                      {record.mortalityCount} birds
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
