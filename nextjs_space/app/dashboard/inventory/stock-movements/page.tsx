'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { toast } from 'sonner';

interface StockMovement {
  id: string;
  inventory: {
    itemName: string;
    category: { categoryName: string };
  };
  movementDate: string;
  movementType: string;
  quantity: number;
  balanceAfter: number;
  referenceNumber?: string;
  reason?: string;
}

export default function StockMovementsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') fetchMovements();
  }, [status]);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/inventory/stock-movements');
      const data = await response.json();
      if (data.success) setMovements(data.data);
    } catch (error) {
      toast.error('Failed to load stock movements');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const getMovementIcon = (type: string) => {
    if (type === 'purchase') return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (type === 'consumption' || type === 'damage') return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Activity className="h-4 w-4 text-blue-600" />;
  };

  const getMovementColor = (type: string) => {
    const colors: any = {
      purchase: 'default',
      consumption: 'secondary',
      adjustment: 'default',
      return: 'secondary',
      damage: 'destructive'
    };
    return colors[type] || 'secondary';
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Movements</h1>
          <p className="text-muted-foreground mt-2">Track inventory changes and adjustments</p>
        </div>
        <Button onClick={() => toast.info('Record movement feature coming soon')}>
          <Plus className="mr-2 h-4 w-4" />
          Record Movement
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Movements</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{movements.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Purchases</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {movements.filter(m => m.movementType === 'purchase').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consumptions</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {movements.filter(m => m.movementType === 'consumption').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Adjustments</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {movements.filter(m => m.movementType === 'adjustment').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Item</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Quantity</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Balance After</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Reference</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id} className="border-t hover:bg-muted/50">
                    <td className="px-4 py-3">
                      {new Date(movement.movementDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {movement.inventory.itemName}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">
                        {movement.inventory.category.categoryName}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getMovementIcon(movement.movementType)}
                        <Badge variant={getMovementColor(movement.movementType)}>
                          {movement.movementType}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={
                        movement.movementType === 'purchase' || movement.movementType === 'adjustment'
                          ? 'text-green-600 font-semibold'
                          : 'text-red-600 font-semibold'
                      }>
                        {movement.movementType === 'purchase' || movement.movementType === 'adjustment' ? '+' : '-'}
                        {Number(movement.quantity)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{Number(movement.balanceAfter)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {movement.referenceNumber || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {movements.length === 0 && (
        <div className="text-center py-12">
          <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No stock movements yet</h3>
          <p className="text-muted-foreground mt-2">
            Stock movements will appear here when you purchase items or record consumption
          </p>
        </div>
      )}
    </div>
  );
}
