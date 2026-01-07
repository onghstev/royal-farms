'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Package, 
  Users, 
  FileText, 
  TrendingUp, 
  AlertTriangle,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

interface DashboardStats {
  totalItems: number;
  totalCategories: number;
  totalSuppliers: number;
  lowStockCount: number;
  totalPurchaseOrders: number;
  totalInventoryValue: number;
}

export default function InventoryDashboard() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    totalCategories: 0,
    totalSuppliers: 0,
    lowStockCount: 0,
    totalPurchaseOrders: 0,
    totalInventoryValue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDashboardStats();
    }
  }, [status]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Fetch all stats in parallel
      const [itemsRes, categoriesRes, suppliersRes, ordersRes] = await Promise.all([
        fetch('/api/inventory/items'),
        fetch('/api/inventory/categories'),
        fetch('/api/inventory/suppliers'),
        fetch('/api/inventory/purchase-orders')
      ]);

      const [itemsData, categoriesData, suppliersData, ordersData] = await Promise.all([
        itemsRes.json(),
        categoriesRes.json(),
        suppliersRes.json(),
        ordersRes.json()
      ]);

      setStats({
        totalItems: itemsData.summary?.totalItems || 0,
        totalCategories: categoriesData.data?.length || 0,
        totalSuppliers: suppliersData.data?.length || 0,
        lowStockCount: itemsData.summary?.lowStockCount || 0,
        totalPurchaseOrders: ordersData.summary?.totalOrders || 0,
        totalInventoryValue: parseFloat(itemsData.summary?.totalValue || '0')
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const navigationCards = [
    {
      title: 'Inventory Categories',
      description: 'Manage equipment, consumables, spare parts',
      icon: Package,
      href: '/dashboard/inventory/categories',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      stat: stats.totalCategories,
      statLabel: 'Categories'
    },
    {
      title: 'Suppliers',
      description: 'Manage vendor contacts and performance',
      icon: Users,
      href: '/dashboard/inventory/suppliers',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      stat: stats.totalSuppliers,
      statLabel: 'Suppliers'
    },
    {
      title: 'Inventory Items',
      description: 'Track stock levels and reorder points',
      icon: TrendingUp,
      href: '/dashboard/inventory/items',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      stat: stats.totalItems,
      statLabel: 'Items'
    },
    {
      title: 'Purchase Orders',
      description: 'Create and manage procurement orders',
      icon: FileText,
      href: '/dashboard/inventory/purchase-orders',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      stat: stats.totalPurchaseOrders,
      statLabel: 'Orders'
    }
  ];

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage general supplies, equipment, consumables, and procurement
        </p>
      </div>

      {/* Low Stock Alert */}
      {stats.lowStockCount > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-semibold">{stats.lowStockCount} items</span> are running low on stock. 
            <Button variant="link" className="p-0 h-auto ml-2" onClick={() => router.push('/dashboard/inventory/items')}>
              View Items
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{stats.totalInventoryValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Current stock value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground mt-1">Active inventory items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.lowStockCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Items below reorder level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Purchase Orders</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPurchaseOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">Total orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {navigationCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card 
              key={card.href}
              className="cursor-pointer hover:shadow-lg transition-shadow border-l-4"
              style={{ borderLeftColor: card.color.replace('text-', '#') }}
              onClick={() => router.push(card.href)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-lg ${card.bgColor}`}>
                    <Icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
                <CardTitle className="mt-4">{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{card.stat}</p>
                    <p className="text-sm text-muted-foreground">{card.statLabel}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common inventory management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => router.push('/dashboard/inventory/items')}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              View Stock Levels
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => router.push('/dashboard/inventory/purchase-orders')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Create Purchase Order
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => router.push('/dashboard/inventory/stock-movements')}
            >
              <Package className="mr-2 h-4 w-4" />
              View Stock Movements
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}