'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, 
  LogIn, 
  LayoutDashboard, 
  Bird, 
  Egg, 
  TrendingDown,
  TrendingUp,
  FileText, 
  Users, 
  Scale,
  AlertCircle,
  CheckCircle,
  Info,
  Settings,
  Download,
  Upload,
  Edit,
  Trash2,
  Plus,
  Eye,
  Search,
  Filter,
  Calendar,
  BarChart3,
  Package,
  Activity
} from 'lucide-react';

export default function UserManualPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Manual</h1>
            <p className="text-muted-foreground">
              Complete guide to using the Royal Farms Poultry Management System
            </p>
          </div>
        </div>
      </div>

      {/* Welcome Card */}
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-green-600" />
            Welcome to Royal Farms Management System
          </CardTitle>
          <CardDescription>
            This comprehensive guide will help you navigate and utilize all features of the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Real-time Tracking</p>
                <p className="text-xs text-muted-foreground">Monitor production metrics instantly</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Role-Based Access</p>
                <p className="text-xs text-muted-foreground">Secure permissions for each user</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Comprehensive Reports</p>
                <p className="text-xs text-muted-foreground">Export data in CSV format</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto">
          <TabsTrigger value="overview" className="py-3">Overview</TabsTrigger>
          <TabsTrigger value="getting-started" className="py-3">Getting Started</TabsTrigger>
          <TabsTrigger value="modules" className="py-3">Modules</TabsTrigger>
          <TabsTrigger value="roles" className="py-3">User Roles</TabsTrigger>
          <TabsTrigger value="testing" className="py-3">Testing Guide</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
              <CardDescription>Understanding the Royal Farms Poultry Management System</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-3">About the System</h3>
                <p className="text-muted-foreground">
                  The Royal Farms Poultry Management System is a comprehensive web-based solution designed to manage
                  poultry operations including layers (45,000 birds), broilers (5,000 birds), and future piggery expansion.
                  Built with modern technologies for reliability and ease of use.
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold text-lg mb-3">Key Features</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-green-100 rounded">
                        <LayoutDashboard className="h-4 w-4 text-green-700" />
                      </div>
                      <div>
                        <p className="font-medium">Real-time Dashboard</p>
                        <p className="text-sm text-muted-foreground">Live KPIs and production metrics</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-100 rounded">
                        <Bird className="h-4 w-4 text-blue-700" />
                      </div>
                      <div>
                        <p className="font-medium">Flock Management</p>
                        <p className="text-sm text-muted-foreground">Track layers and broilers</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-yellow-100 rounded">
                        <Egg className="h-4 w-4 text-yellow-700" />
                      </div>
                      <div>
                        <p className="font-medium">Egg Collection</p>
                        <p className="text-sm text-muted-foreground">Daily production tracking</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-red-100 rounded">
                        <TrendingDown className="h-4 w-4 text-red-700" />
                      </div>
                      <div>
                        <p className="font-medium">Mortality Tracking</p>
                        <p className="text-sm text-muted-foreground">Monitor bird losses</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-purple-100 rounded">
                        <Scale className="h-4 w-4 text-purple-700" />
                      </div>
                      <div>
                        <p className="font-medium">Weight Tracking</p>
                        <p className="text-sm text-muted-foreground">Broiler growth monitoring</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-indigo-100 rounded">
                        <FileText className="h-4 w-4 text-indigo-700" />
                      </div>
                      <div>
                        <p className="font-medium">Reports & Analytics</p>
                        <p className="text-sm text-muted-foreground">Export production data</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold text-lg mb-3">System Requirements</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Modern web browser (Chrome, Firefox, Safari, Edge)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Internet connection for real-time synchronization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Mobile-responsive for tablets and smartphones</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Getting Started Tab */}
        <TabsContent value="getting-started" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>How to access and navigate the system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <LogIn className="h-5 w-5" />
                  Logging In
                </h3>
                <div className="space-y-3">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Test accounts are available for each role. Contact your Farm Manager for credentials.
                    </AlertDescription>
                  </Alert>
                  <ol className="space-y-2 text-muted-foreground list-decimal list-inside">
                    <li>Navigate to the login page</li>
                    <li>Enter your email address</li>
                    <li>Enter your password</li>
                    <li>Click "Sign In" to access the dashboard</li>
                  </ol>
                  <div className="bg-slate-50 p-4 rounded-lg border">
                    <p className="font-medium mb-2">Test Accounts:</p>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>• <strong>Manager:</strong> manager@royalfarms.com / manager123</p>
                      <p>• <strong>Supervisor:</strong> supervisor@royalfarms.com / supervisor123</p>
                      <p>• <strong>Worker:</strong> worker@royalfarms.com / worker123</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5" />
                  Dashboard Navigation
                </h3>
                <p className="text-muted-foreground mb-4">
                  The dashboard is your central hub for monitoring all farm operations.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-base">Sidebar Menu</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      <p>• Access all major modules</p>
                      <p>• View your current role</p>
                      <p>• Sign out securely</p>
                      <p>• Mobile-responsive menu</p>
                    </CardContent>
                  </Card>
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-base">Main Dashboard</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      <p>• 9 real-time KPI cards</p>
                      <p>• Production trend charts</p>
                      <p>• Mortality analysis</p>
                      <p>• Recent activity feed</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Modules Tab */}
        <TabsContent value="modules" className="space-y-4">
          {/* Flocks Module */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bird className="h-5 w-5 text-green-600" />
                Flocks (Layers) Management
              </CardTitle>
              <CardDescription>Manage your layer chicken flocks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Creating a New Flock
                </h4>
                <ol className="space-y-1 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Click "Add New Flock" button</li>
                  <li>Enter flock name (must be unique)</li>
                  <li>Select flock type (Layers or Pullets)</li>
                  <li>Choose breed and site location</li>
                  <li>Enter arrival date and opening stock count</li>
                  <li>Add supplier and cost information (optional)</li>
                  <li>Click "Create Flock" to save</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Edit className="h-4 w-4" /> Editing a Flock
                </h4>
                <p className="text-sm text-muted-foreground">
                  Click the edit icon next to any flock to update details. Current stock is automatically calculated
                  based on mortality records.
                </p>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Permission Required:</strong> Manager (full access), Supervisor (edit only), Worker (view only)
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Batches Module */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bird className="h-5 w-5 text-blue-600" />
                Batches (Broilers) Management
              </CardTitle>
              <CardDescription>Manage your broiler chicken batches</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Creating a New Batch
                </h4>
                <ol className="space-y-1 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Click "Add New Batch" button</li>
                  <li>Enter batch name (must be unique)</li>
                  <li>Select batch type (Broilers or Turkeys)</li>
                  <li>Choose breed and site location</li>
                  <li>Enter DOC (Day-Old Chick) arrival date</li>
                  <li>Enter quantity ordered and received</li>
                  <li>Select batch status (Planning, Active, Growing, Ready, Harvested)</li>
                  <li>Add expected sale date (optional)</li>
                  <li>Click "Create Batch" to save</li>
                </ol>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="font-medium text-sm mb-2">Batch Statuses:</p>
                <div className="space-y-1 text-sm">
                  <p>• <Badge variant="secondary">Planning</Badge> - Batch is being planned</p>
                  <p>• <Badge variant="default">Active</Badge> - Batch is currently growing</p>
                  <p>• <Badge className="bg-yellow-500">Growing</Badge> - Actively monitored growth phase</p>
                  <p>• <Badge className="bg-green-500">Ready</Badge> - Ready for harvest</p>
                  <p>• <Badge variant="outline">Harvested</Badge> - Batch has been sold/processed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Egg Collection Module */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Egg className="h-5 w-5 text-yellow-600" />
                Egg Collection
              </CardTitle>
              <CardDescription>Record daily egg production</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Recording Daily Collection</h4>
                <ol className="space-y-1 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Click "Record Collection" button</li>
                  <li>Select the flock</li>
                  <li>Enter collection date</li>
                  <li>Enter good eggs count</li>
                  <li>Enter broken eggs count</li>
                  <li>Add collection time (optional)</li>
                  <li>System auto-calculates total eggs and production percentage</li>
                  <li>Click "Record Collection" to save</li>
                </ol>
              </div>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Production percentage is automatically calculated as: (Total Eggs / Current Stock) × 100
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Mortality Module */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                Mortality Tracking
              </CardTitle>
              <CardDescription>Record and monitor bird losses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Recording Mortality</h4>
                <ol className="space-y-1 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Click "Record Mortality" button</li>
                  <li>Select record type (Flock or Batch)</li>
                  <li>Select the specific flock or batch</li>
                  <li>Enter mortality date</li>
                  <li>Enter mortality count (number of birds)</li>
                  <li>Select cause (Disease, Predator, Heat Stress, Unknown, Other)</li>
                  <li>Add notes (optional)</li>
                  <li>System auto-updates flock/batch current stock</li>
                  <li>Click "Record Mortality" to save</li>
                </ol>
              </div>
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription>
                  <strong>Important:</strong> Recording mortality automatically reduces the current stock count for the
                  selected flock or batch.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Weight Tracking Module */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-purple-600" />
                Weight Tracking
              </CardTitle>
              <CardDescription>Monitor broiler growth and weight gain</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Recording Weight Measurements</h4>
                <ol className="space-y-1 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Click "Record Weight" button</li>
                  <li>Select the batch</li>
                  <li>Enter weighing date</li>
                  <li>System auto-calculates age in days</li>
                  <li>Enter sample size (number of birds weighed)</li>
                  <li>Enter average weight in kg</li>
                  <li>Enter min and max weights (optional)</li>
                  <li>Enter uniformity percentage (optional)</li>
                  <li>Click "Record Weight" to save</li>
                </ol>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <p className="font-medium text-sm mb-2">Best Practices:</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Weigh birds at the same time weekly</li>
                  <li>• Use a representative sample (5-10% of batch)</li>
                  <li>• Record before feeding for consistency</li>
                  <li>• Track uniformity to identify issues early</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Feed Management Module */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-orange-600" />
                Feed Management
              </CardTitle>
              <CardDescription>Manage feed suppliers, inventory, purchases, and consumption</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Feed Suppliers</h4>
                <ol className="space-y-1 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Click "Add Supplier" to register new feed vendors</li>
                  <li>Enter supplier name, contact person, phone, email</li>
                  <li>Add address and toggle active/inactive status</li>
                  <li>View all suppliers with purchase history</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Feed Inventory</h4>
                <ol className="space-y-1 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Track stock levels for Starter, Grower, Finisher, Layer feeds</li>
                  <li>Set reorder levels for low stock alerts</li>
                  <li>Monitor unit costs and total inventory value</li>
                  <li>View expiry dates and last restock dates</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Feed Purchases</h4>
                <ol className="space-y-1 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Record purchases from suppliers</li>
                  <li>Stock is automatically incremented on purchase</li>
                  <li>Track payment status (Paid/Pending)</li>
                  <li>View purchase history with date range filters</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Daily Consumption</h4>
                <ol className="space-y-1 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Record daily feed usage per flock/batch</li>
                  <li>Stock is automatically decremented on consumption</li>
                  <li>System validates sufficient stock before saving</li>
                  <li>Track consumption trends over time</li>
                </ol>
              </div>
              <Alert className="border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription>
                  <strong>Auto-Sync:</strong> Purchases automatically increase inventory, consumption automatically decreases it.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Inventory Management Module */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-cyan-600" />
                General Inventory
              </CardTitle>
              <CardDescription>Manage equipment, supplies, and procurement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Categories</h4>
                <p className="text-sm text-muted-foreground">Organize items into categories (Equipment, Medications, Supplies, Consumables)</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Suppliers</h4>
                <p className="text-sm text-muted-foreground">Manage vendors with payment terms, ratings, and contact details</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Items</h4>
                <ol className="space-y-1 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Add inventory items with reorder levels</li>
                  <li>Track stock quantities and unit costs</li>
                  <li>Monitor expiry dates for medications</li>
                  <li>View low stock alerts on dashboard</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Purchase Orders</h4>
                <ol className="space-y-1 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Create purchase orders for suppliers</li>
                  <li>Track status: Draft → Ordered → Received</li>
                  <li>Auto-update inventory when received</li>
                  <li>Monitor payment status</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Stock Movements</h4>
                <p className="text-sm text-muted-foreground">Full audit trail of all inventory changes (purchases, consumption, adjustments, returns)</p>
              </div>
            </CardContent>
          </Card>

          {/* Health Module */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-red-600" />
                Health Management
              </CardTitle>
              <CardDescription>Track vaccinations, medications, and health incidents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Vaccinations</h4>
                <ol className="space-y-1 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Schedule and record vaccinations</li>
                  <li>Track vaccine type, dosage, and batch numbers</li>
                  <li>Set next due date reminders</li>
                  <li>Monitor vaccination coverage</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Medications</h4>
                <ol className="space-y-1 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Record medication treatments</li>
                  <li>Track dosage and treatment duration</li>
                  <li>Note withdrawal periods</li>
                  <li>Link to specific flocks/batches</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Health Incidents</h4>
                <p className="text-sm text-muted-foreground">Log disease outbreaks, symptoms, and treatments for historical analysis</p>
              </div>
            </CardContent>
          </Card>

          {/* Finance Module */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-emerald-600" />
                Finance Management
              </CardTitle>
              <CardDescription>Track expenses, revenue, and financial performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Expenses</h4>
                <ol className="space-y-1 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Record all farm expenses by category</li>
                  <li>Categories: Feed, Labor, Utilities, Medication, Maintenance, Other</li>
                  <li>Track payment status and receipt references</li>
                  <li>View expense trends and summaries</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Revenue</h4>
                <ol className="space-y-1 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Record egg and bird sales</li>
                  <li>Track customer information</li>
                  <li>Monitor payment collection</li>
                  <li>Analyze revenue by product type</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Financial Summary</h4>
                <p className="text-sm text-muted-foreground">Dashboard showing total expenses, revenue, and profit/loss with period comparisons</p>
              </div>
            </CardContent>
          </Card>

          {/* FCR Module */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-violet-600" />
                Feed Conversion Ratio (FCR)
              </CardTitle>
              <CardDescription>Monitor feed efficiency for broiler batches</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Understanding FCR</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  FCR = Total Feed Consumed (kg) / Total Weight Gained (kg)
                </p>
                <p className="text-sm text-muted-foreground">
                  Lower FCR indicates better feed efficiency. Industry standard for broilers is 1.6-1.8.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">FCR Dashboard</h4>
                <ol className="space-y-1 text-sm text-muted-foreground list-decimal list-inside">
                  <li>View FCR per batch with trend analysis</li>
                  <li>Compare against industry benchmarks</li>
                  <li>Identify high-performing and underperforming batches</li>
                  <li>Correlate with feed type and management practices</li>
                </ol>
              </div>
              <div className="bg-violet-50 p-4 rounded-lg border border-violet-200">
                <p className="font-medium text-sm mb-2">FCR Targets:</p>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>• <Badge className="bg-green-500">Excellent</Badge> Below 1.6</p>
                  <p>• <Badge className="bg-blue-500">Good</Badge> 1.6 - 1.8</p>
                  <p>• <Badge className="bg-yellow-500">Average</Badge> 1.8 - 2.0</p>
                  <p>• <Badge className="bg-red-500">Poor</Badge> Above 2.0</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reports Module */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                Reports & Analytics
              </CardTitle>
              <CardDescription>Generate and export production reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Available Report Types</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Production Report</p>
                      <p className="text-sm text-muted-foreground">
                        View egg collection data grouped by flock with totals and averages
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <TrendingDown className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Mortality Report</p>
                      <p className="text-sm text-muted-foreground">
                        Analyze mortality by cause, type, and group with detailed statistics
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Bird className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Inventory Report</p>
                      <p className="text-sm text-muted-foreground">
                        Current stock status for all active flocks and batches
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Scale className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Weight Tracking Report</p>
                      <p className="text-sm text-muted-foreground">
                        Growth analysis with average weights and trends by batch
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Filter className="h-4 w-4" /> Generating Reports
                </h4>
                <ol className="space-y-1 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Select report type from dropdown</li>
                  <li>Choose start date</li>
                  <li>Choose end date</li>
                  <li>Click "Generate Report" button</li>
                  <li>View summary KPIs and data table</li>
                  <li>Click "Export to CSV" to download</li>
                </ol>
              </div>
              <Alert>
                <Download className="h-4 w-4" />
                <AlertDescription>
                  CSV files can be opened in Excel, Google Sheets, or any spreadsheet application for further analysis.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* User Management Module */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-slate-600" />
                User Management
              </CardTitle>
              <CardDescription>Manage system users and roles (Manager only)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription>
                  <strong>Manager Access Only:</strong> Only Farm Managers can create, edit, or delete users.
                </AlertDescription>
              </Alert>
              <div>
                <h4 className="font-semibold mb-2">Creating a New User</h4>
                <ol className="space-y-1 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Click "Add New User" button</li>
                  <li>Enter first name and last name</li>
                  <li>Enter email address (must be unique)</li>
                  <li>Set a secure password</li>
                  <li>Enter phone number (optional)</li>
                  <li>Select user role (Manager, Supervisor, or Worker)</li>
                  <li>Click "Create User" to save</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Managing Existing Users</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• <strong>Edit:</strong> Click edit icon to update user details or change role</li>
                  <li>• <strong>Deactivate:</strong> Change status to "Inactive" to disable access</li>
                  <li>• <strong>Reset Password:</strong> Enter new password when editing user</li>
                  <li>• <strong>Delete:</strong> Permanently remove user (cannot delete your own account)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Roles & Permissions</CardTitle>
              <CardDescription>Understanding access levels in the system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  The system uses role-based access control (RBAC) to ensure users only have access to features
                  appropriate for their responsibilities.
                </AlertDescription>
              </Alert>

              {/* Farm Manager */}
              <Card className="border-2 border-green-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="p-2 bg-green-100 rounded">
                      <Settings className="h-5 w-5 text-green-700" />
                    </div>
                    Farm Manager
                  </CardTitle>
                  <CardDescription>Full system access with administrative privileges</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-sm mb-2">Permissions:</p>
                      <div className="grid md:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>View all data</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Create new records</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Edit all records</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Delete records</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Generate & export reports</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Manage users</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 p-3 rounded">
                      <p className="text-sm"><strong>Test Account:</strong> manager@royalfarms.com / manager123</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Supervisor */}
              <Card className="border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded">
                      <Eye className="h-5 w-5 text-blue-700" />
                    </div>
                    Supervisor
                  </CardTitle>
                  <CardDescription>Operational access with editing privileges</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-sm mb-2">Permissions:</p>
                      <div className="grid md:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          <span>View all data</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          <span>Create production records</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          <span>Edit existing records</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          <span>View reports (no export)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-gray-400" />
                          <span className="text-muted-foreground">Cannot delete records</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-gray-400" />
                          <span className="text-muted-foreground">Cannot manage users</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="text-sm"><strong>Test Account:</strong> supervisor@royalfarms.com / supervisor123</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Farm Worker */}
              <Card className="border-2 border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="p-2 bg-gray-100 rounded">
                      <Users className="h-5 w-5 text-gray-700" />
                    </div>
                    Farm Worker
                  </CardTitle>
                  <CardDescription>Basic access for data entry tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-sm mb-2">Permissions:</p>
                      <div className="grid md:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-gray-600" />
                          <span>View flocks and batches</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-gray-600" />
                          <span>Record egg collections</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-gray-600" />
                          <span>Record mortality</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-gray-600" />
                          <span>Record feed consumption</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-gray-400" />
                          <span className="text-muted-foreground">Cannot edit records</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-gray-400" />
                          <span className="text-muted-foreground">Cannot view reports</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm"><strong>Test Account:</strong> worker@royalfarms.com / worker123</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Testing Guide Tab */}
        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Application Testing Guide</CardTitle>
              <CardDescription>Step-by-step guide to thoroughly test all system features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  The system comes pre-loaded with 50,000+ bird records and 30 days of historical data for testing.
                </AlertDescription>
              </Alert>

              <div>
                <h3 className="font-semibold text-lg mb-3">Testing Checklist</h3>
                
                <div className="space-y-4">
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold mb-2">1. Authentication Testing</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>☐ Login with Manager account</li>
                      <li>☐ Login with Supervisor account</li>
                      <li>☐ Login with Worker account</li>
                      <li>☐ Test logout functionality</li>
                      <li>☐ Verify session persistence</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold mb-2">2. Dashboard Testing</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>☐ Verify all 9 KPI cards display data</li>
                      <li>☐ Check production trend chart loads</li>
                      <li>☐ Check mortality chart loads</li>
                      <li>☐ Verify recent activity feed shows updates</li>
                      <li>☐ Test mobile responsiveness</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-yellow-500 pl-4">
                    <h4 className="font-semibold mb-2">3. Flocks Management Testing</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>☐ View existing flocks list</li>
                      <li>☐ Create a new flock with test data</li>
                      <li>☐ Edit the newly created flock</li>
                      <li>☐ Test search functionality</li>
                      <li>☐ Test status filters</li>
                      <li>☐ Delete the test flock (Manager only)</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-semibold mb-2">4. Batches Management Testing</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>☐ View existing batches list</li>
                      <li>☐ Create a new batch with test data</li>
                      <li>☐ Edit the newly created batch</li>
                      <li>☐ Test different batch statuses</li>
                      <li>☐ Test search functionality</li>
                      <li>☐ Delete the test batch (Manager only)</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-orange-500 pl-4">
                    <h4 className="font-semibold mb-2">5. Egg Collection Testing</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>☐ View existing collection records</li>
                      <li>☐ Record a new egg collection</li>
                      <li>☐ Verify auto-calculation of totals</li>
                      <li>☐ Verify production percentage calculation</li>
                      <li>☐ Edit a collection record</li>
                      <li>☐ Test date range filters</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-red-500 pl-4">
                    <h4 className="font-semibold mb-2">6. Mortality Tracking Testing</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>☐ View existing mortality records</li>
                      <li>☐ Record mortality for a flock</li>
                      <li>☐ Record mortality for a batch</li>
                      <li>☐ Verify stock count decreases automatically</li>
                      <li>☐ Test different cause types</li>
                      <li>☐ Edit a mortality record</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-indigo-500 pl-4">
                    <h4 className="font-semibold mb-2">7. Weight Tracking Testing</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>☐ View existing weight records</li>
                      <li>☐ Record weight for a batch</li>
                      <li>☐ Verify age calculation</li>
                      <li>☐ Test with different sample sizes</li>
                      <li>☐ Edit a weight record</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-orange-500 pl-4">
                    <h4 className="font-semibold mb-2">8. Feed Management Testing</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>☐ Add a new feed supplier</li>
                      <li>☐ Add feed inventory item</li>
                      <li>☐ Record a feed purchase</li>
                      <li>☐ Verify stock increases after purchase</li>
                      <li>☐ Record daily consumption</li>
                      <li>☐ Verify stock decreases after consumption</li>
                      <li>☐ Test low stock alerts</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-cyan-500 pl-4">
                    <h4 className="font-semibold mb-2">9. Inventory Testing</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>☐ Create inventory category</li>
                      <li>☐ Add inventory supplier</li>
                      <li>☐ Add inventory items</li>
                      <li>☐ Create purchase order</li>
                      <li>☐ Receive purchase order</li>
                      <li>☐ View stock movements</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-emerald-500 pl-4">
                    <h4 className="font-semibold mb-2">10. Finance Testing</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>☐ Record an expense</li>
                      <li>☐ Record revenue/sale</li>
                      <li>☐ View financial summary</li>
                      <li>☐ Test date filtering</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-pink-500 pl-4">
                    <h4 className="font-semibold mb-2">11. Reports Testing</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>☐ Generate Production Report</li>
                      <li>☐ Generate Mortality Report</li>
                      <li>☐ Generate Inventory Report</li>
                      <li>☐ Generate Weight Tracking Report</li>
                      <li>☐ Test date range filtering</li>
                      <li>☐ Export each report to CSV</li>
                      <li>☐ Verify CSV file opens in Excel</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-gray-500 pl-4">
                    <h4 className="font-semibold mb-2">12. User Management Testing (Manager Only)</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>☐ View all users list</li>
                      <li>☐ Create a new test user</li>
                      <li>☐ Edit the test user</li>
                      <li>☐ Change user role</li>
                      <li>☐ Deactivate user</li>
                      <li>☐ Delete the test user</li>
                      <li>☐ Search for users</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-teal-500 pl-4">
                    <h4 className="font-semibold mb-2">13. Mobile Responsiveness Testing</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>☐ Test sidebar menu on mobile</li>
                      <li>☐ Test forms on mobile devices</li>
                      <li>☐ Test tables scroll horizontally</li>
                      <li>☐ Test touch interactions</li>
                      <li>☐ Test on tablet devices</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold text-lg mb-3">Common Test Scenarios</h3>
                <div className="space-y-3">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Scenario 1: Daily Operations</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <p className="text-muted-foreground">Simulate a typical day at Royal Farms:</p>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        <li>Login as Worker</li>
                        <li>Record morning egg collection for multiple flocks</li>
                        <li>Record any mortality incidents</li>
                        <li>Logout and login as Supervisor</li>
                        <li>Review and verify worker entries</li>
                        <li>Check dashboard for any alerts</li>
                      </ol>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Scenario 2: New Batch Setup</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <p className="text-muted-foreground">Test the complete lifecycle of a broiler batch:</p>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        <li>Login as Manager</li>
                        <li>Create a new broiler batch (1000 birds)</li>
                        <li>Record week 1 weight measurements</li>
                        <li>Record week 2 weight measurements</li>
                        <li>Record any mortality during growth</li>
                        <li>Update batch status as it progresses</li>
                        <li>Generate weight tracking report</li>
                      </ol>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Scenario 3: Monthly Reporting</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <p className="text-muted-foreground">Test end-of-month reporting workflow:</p>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        <li>Login as Manager</li>
                        <li>Generate production report for past 30 days</li>
                        <li>Generate mortality report for analysis</li>
                        <li>Generate inventory report for current stock</li>
                        <li>Export all reports to CSV</li>
                        <li>Review data in Excel</li>
                        <li>Verify all calculations are correct</li>
                      </ol>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  <strong>Pro Tip:</strong> Test with different user roles to verify permission controls work correctly.
                  Workers should not be able to delete records, and only Managers should see the User Management module.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Known Issues Card */}
          <Card className="border-yellow-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                Known Limitations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• The system is optimized for modern browsers (Chrome, Firefox, Safari, Edge)</li>
                <li>• Large CSV exports (&gt;10,000 rows) may take a few seconds to process</li>
                <li>• Charts require JavaScript to be enabled</li>
                <li>• Real-time updates require an active internet connection</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Support Section */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            Need Help?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            If you encounter any issues or need additional training, please contact your Farm Manager or system administrator.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="outline">System Version: 2.0.0 (Phase 5)</Badge>
            <Badge variant="outline">Last Updated: January 2026</Badge>
            <Badge variant="outline">Royal Farms Ltd</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
