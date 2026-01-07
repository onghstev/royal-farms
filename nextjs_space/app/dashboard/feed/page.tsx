'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, Package, ShoppingCart, TrendingDown, Users, AlertCircle, CheckCircle, DollarSign, Wheat } from 'lucide-react';
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
      <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-amber-600" />
            Phase 2 Backend Complete!
          </CardTitle>
          <CardDescription>
            All Feed Management APIs are now operational. UI development is in progress.
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
                <p className="text-xs text-muted-foreground">Full CRUD API</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Inventory Tracking</p>
                <p className="text-xs text-muted-foreground">Stock management</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Feed Purchases</p>
                <p className="text-xs text-muted-foreground">Auto inventory update</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Consumption Tracking</p>
                <p className="text-xs text-muted-foreground">Auto stock deduction</p>
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
        <Card>
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
            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              <p className="text-sm font-medium text-blue-900">API Status: ✅ Operational</p>
              <p className="text-xs text-blue-700 mt-1">
                Endpoint: <code>/api/feed/suppliers</code>
              </p>
            </div>
            <Badge variant="outline" className="text-amber-600 border-amber-300">
              UI: In Development
            </Badge>
          </CardContent>
        </Card>

        <Card>
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
            <div className="bg-green-50 p-3 rounded border border-green-200">
              <p className="text-sm font-medium text-green-900">API Status: ✅ Operational</p>
              <p className="text-xs text-green-700 mt-1">
                Endpoint: <code>/api/feed/inventory</code>
              </p>
            </div>
            <Badge variant="outline" className="text-amber-600 border-amber-300">
              UI: In Development
            </Badge>
          </CardContent>
        </Card>

        <Card>
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
            <div className="bg-purple-50 p-3 rounded border border-purple-200">
              <p className="text-sm font-medium text-purple-900">API Status: ✅ Operational</p>
              <p className="text-xs text-purple-700 mt-1">
                Endpoint: <code>/api/feed/purchases</code>
              </p>
            </div>
            <Badge variant="outline" className="text-amber-600 border-amber-300">
              UI: In Development
            </Badge>
          </CardContent>
        </Card>

        <Card>
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
            <div className="bg-orange-50 p-3 rounded border border-orange-200">
              <p className="text-sm font-medium text-orange-900">API Status: ✅ Operational</p>
              <p className="text-xs text-orange-700 mt-1">
                Endpoint: <code>/api/feed/consumption</code>
              </p>
            </div>
            <Badge variant="outline" className="text-amber-600 border-amber-300">
              UI: In Development
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Next Steps Card */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle>🚀 Next Steps for Complete Phase 2</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Remaining Development Tasks:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="text-amber-600 border-amber-300 mt-0.5">TODO</Badge>
                <span>Build comprehensive UI for Suppliers, Inventory, Purchases, and Consumption modules</span>
              </li>
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="text-amber-600 border-amber-300 mt-0.5">TODO</Badge>
                <span>Implement FCR (Feed Conversion Ratio) analytics dashboard</span>
              </li>
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="text-amber-600 border-amber-300 mt-0.5">TODO</Badge>
                <span>Create feed cost analysis reports</span>
              </li>
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="text-amber-600 border-amber-300 mt-0.5">TODO</Badge>
                <span>Add automated email alerts for low stock</span>
              </li>
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="text-amber-600 border-amber-300 mt-0.5">TODO</Badge>
                <span>Integrate feed reports into main Reports module</span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-4 rounded border">
            <p className="text-sm font-medium mb-2">✅ Completed in This Session:</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Database schema updated with 4 new models</li>
              <li>• Created 4 comprehensive API endpoints with full CRUD operations</li>
              <li>• Implemented automatic inventory tracking (purchases increment, consumption decrements)</li>
              <li>• Added payment status tracking for purchases</li>
              <li>• Built supplier relationship management</li>
              <li>• Implemented low stock detection system</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
