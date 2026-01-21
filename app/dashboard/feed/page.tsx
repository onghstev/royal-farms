'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Package, ShoppingCart, TrendingDown, Users, AlertCircle, DollarSign, Wheat } from 'lucide-react';
import { toast } from 'sonner';

export default function FeedManagementPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [inventorySummary, setInventorySummary] = useState<any>(null);
  const [purchasesSummary, setPurchasesSummary] = useState<any>(null);
  const [consumptionSummary, setConsumptionSummary] = useState<any>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch inventory summary
      const invResponse = await fetch('/api/feed/inventory');
      if (invResponse.ok) {
        const invData = await invResponse.json();
        setInventorySummary(invData.summary);
      }

      // Fetch purchases summary
      const purchResponse = await fetch('/api/feed/purchases');
      if (purchResponse.ok) {
        const purchData = await purchResponse.json();
        setPurchasesSummary(purchData.summary);
      }

      // Fetch consumption summary
      const consResponse = await fetch('/api/feed/consumption');
      if (consResponse.ok) {
        const consData = await consResponse.json();
        setConsumptionSummary(consData.summary);
      }

      // Fetch suppliers
      const suppResponse = await fetch('/api/feed/suppliers');
      if (suppResponse.ok) {
        const suppData = await suppResponse.json();
        setSuppliers(suppData.suppliers);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Wheat className="h-8 w-8 text-amber-600" />
            Feed Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage suppliers, inventory, purchases, and daily consumption
          </p>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inventorySummary ? `₦${Number(inventorySummary.totalValue).toLocaleString()}` : '₦0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {inventorySummary?.totalItems || 0} inventory items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {inventorySummary?.lowStockCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Items below reorder level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {purchasesSummary?.totalPurchases || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total spent: ₦{purchasesSummary ? Number(purchasesSummary.totalSpent).toLocaleString() : '0'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {suppliers.filter((s: any) => s.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Total: {suppliers.length} suppliers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {inventorySummary && inventorySummary.lowStockCount > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="ml-2">
            <strong className="text-red-900">Low Stock Alert:</strong>
            <span className="text-red-700 ml-2">
              {inventorySummary.lowStockCount} feed type(s) are below reorder level. 
              Please review and restock soon.
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Management Modules */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/feed/suppliers" className="block">
          <Card className="h-full hover:shadow-lg transition-all hover:scale-105 cursor-pointer border-2 hover:border-blue-500">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Suppliers</CardTitle>
              <CardDescription className="text-sm">Manage supplier contacts and relationships</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {suppliers.filter((s: any) => s.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Active Suppliers</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/feed/inventory" className="block">
          <Card className="h-full hover:shadow-lg transition-all hover:scale-105 cursor-pointer border-2 hover:border-green-500">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">Inventory</CardTitle>
              <CardDescription className="text-sm">Monitor stock levels and reorder points</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {inventorySummary?.totalItems || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Feed Items</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/feed/purchases" className="block">
          <Card className="h-full hover:shadow-lg transition-all hover:scale-105 cursor-pointer border-2 hover:border-purple-500">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                <ShoppingCart className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Purchases</CardTitle>
              <CardDescription className="text-sm">Record purchases and track costs</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {purchasesSummary?.totalPurchases || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total Purchases</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/feed/consumption" className="block">
          <Card className="h-full hover:shadow-lg transition-all hover:scale-105 cursor-pointer border-2 hover:border-orange-500">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-3">
                <TrendingDown className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle className="text-lg">Consumption</CardTitle>
              <CardDescription className="text-sm">Track daily feed usage</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {consumptionSummary?.totalRecords || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Records</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
