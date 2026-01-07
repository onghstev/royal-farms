'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, Package, ShoppingCart, TrendingDown, Users, AlertCircle, CheckCircle, DollarSign, Wheat, ArrowRight } from 'lucide-react';
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
            Phase 2: Complete feed tracking, inventory, and cost analysis
          </p>
        </div>
      </div>

      {/* Welcome Card */}
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Feed Management System Ready!
          </CardTitle>
          <CardDescription>
            Comprehensive feed tracking, inventory management, and cost analysis - all fully operational.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Feed Suppliers</p>
                <p className="text-xs text-muted-foreground">Relationship management</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Inventory Tracking</p>
                <p className="text-xs text-muted-foreground">Real-time stock levels</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Feed Purchases</p>
                <p className="text-xs text-muted-foreground">Auto inventory sync</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Consumption Tracking</p>
                <p className="text-xs text-muted-foreground">Auto stock updates</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
              {suppliers.filter((s) => s.isActive).length}
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

      {/* Feature Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Feed Suppliers
            </CardTitle>
            <CardDescription>Manage your feed supplier relationships</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <strong>Features:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Add and manage supplier contacts</li>
                <li>Track supplier performance</li>
                <li>Maintain supplier relationships</li>
                <li>Link suppliers to inventory items</li>
              </ul>
            </div>
            <Link href="/dashboard/feed/suppliers">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Manage Suppliers
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              Feed Inventory
            </CardTitle>
            <CardDescription>Track feed stock levels and manage reorders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <strong>Features:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Real-time stock monitoring</li>
                <li>Automatic low stock alerts</li>
                <li>Feed type categorization (Starter, Grower, Finisher, Layer)</li>
                <li>Expiry date tracking</li>
              </ul>
            </div>
            <Link href="/dashboard/feed/inventory">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Manage Inventory
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-purple-600" />
              Feed Purchases
            </CardTitle>
            <CardDescription>Record feed purchases with automatic inventory updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <strong>Features:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Purchase order management</li>
                <li>Automatic stock increment on purchase</li>
                <li>Payment status tracking</li>
                <li>Cost analysis and reporting</li>
              </ul>
            </div>
            <Link href="/dashboard/feed/purchases">
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                Manage Purchases
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-orange-600" />
              Feed Consumption
            </CardTitle>
            <CardDescription>Track daily feed usage with automatic stock deduction</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <strong>Features:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Daily consumption recording</li>
                <li>Automatic stock decrement</li>
                <li>Link to flocks/batches</li>
                <li>Feed cost per bird calculations</li>
              </ul>
            </div>
            <Link href="/dashboard/feed/consumption">
              <Button className="w-full bg-orange-600 hover:bg-orange-700">
                Track Consumption
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Phase 2 Complete Card */}
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            Phase 2 Feed Management - Fully Operational! 🎉
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white p-4 rounded border border-green-200">
            <p className="text-sm font-medium mb-3 text-green-900">✅ Complete Features:</p>
            <div className="grid md:grid-cols-2 gap-3">
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Database schema with 4 new models (Suppliers, Inventory, Purchases, Consumption)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Full CRUD API endpoints for all feed operations</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Automatic inventory tracking (purchases increment, consumption decrements)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Payment status tracking for purchases</span>
                </li>
              </ul>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Supplier relationship management UI</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Low stock detection and alert system</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Feed type categorization (Starter, Grower, Finisher, Layer)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Complete management interfaces for all modules</span>
                </li>
              </ul>
            </div>
          </div>

          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="ml-2 text-sm text-blue-900">
              <strong>Getting Started:</strong> Click on any of the "Manage" buttons above to start managing your feed operations. All data is automatically synced across modules for seamless tracking.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
