'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, TrendingDown, Package, FileText, Wheat } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatCard } from '@/components/ui/stat-card';

interface FeedConsumption {
  id: string;
  consumptionType: string;
  flockId?: string;
  batchId?: string;
  inventoryId: string;
  consumptionDate: string;
  feedQuantityBags: number;
  notes?: string;
  flock?: {
    flockName: string;
  };
  batch?: {
    batchName: string;
  };
  inventory: {
    feedBrand: string;
    feedType: string;
    unitCostPerBag: number;
  };
  recorder: {
    fullName: string;
  };
  createdAt: string;
  // Flattened fields for search
  groupName?: string;
  feedBrand?: string;
  feedType?: string;
  recorderName?: string;
  totalCost?: number;
}

interface FeedInventory {
  id: string;
  feedBrand: string;
  feedType: string;
  currentStockBags: number;
  unitCostPerBag: number;
}

interface Flock {
  id: string;
  flockName: string;
  currentStock: number;
}

interface Batch {
  id: string;
  batchName: string;
  currentStock: number;
}

export default function FeedConsumptionPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [consumptions, setConsumptions] = useState<FeedConsumption[]>([]);
  const [inventoryItems, setInventoryItems] = useState<FeedInventory[]>([]);
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedConsumption, setSelectedConsumption] = useState<FeedConsumption | null>(null);
  const [formData, setFormData] = useState({
    consumptionType: 'flock',
    flockId: '',
    batchId: '',
    inventoryId: '',
    consumptionDate: new Date().toISOString().split('T')[0],
    feedQuantityBags: 0,
    feedPricePerBag: 0,
    notes: ''
  });

  const [stats, setStats] = useState({
    totalFeedUsed: 0,
    totalCost: 0,
    totalRecords: 0
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchConsumptions();
      fetchInventoryItems();
      fetchFlocks();
      fetchBatches();
    }
  }, [status, router]);

  const fetchConsumptions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/feed/consumption');
      if (!response.ok) throw new Error('Failed to fetch consumption records');
      const data = await response.json();
      // Flatten nested fields for search and display
      const flattenedData = (data.consumptions || []).map((item: any) => ({
        ...item,
        groupName: item.flock?.flockName || item.batch?.batchName || '',
        feedBrand: item.inventory?.feedBrand || '',
        feedType: item.inventory?.feedType || '',
        recorderName: item.recorder?.fullName || '',
        totalCost: item.feedQuantityBags * (item.inventory?.unitCostPerBag || 0),
      }));
      setConsumptions(flattenedData);
      const summaryData = data.summary || { totalFeedUsed: 0, totalCost: 0, totalRecords: 0 };
      setStats(summaryData);
    } catch (error) {
      console.error('Error fetching consumptions:', error);
      toast.error('Failed to load consumption records');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const response = await fetch('/api/feed/inventory');
      if (!response.ok) throw new Error('Failed to fetch inventory');
      const data = await response.json();
      setInventoryItems(data.inventory || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const fetchFlocks = async () => {
    try {
      const response = await fetch('/api/flocks');
      if (!response.ok) throw new Error('Failed to fetch flocks');
      const data = await response.json();
      // API returns array directly, filter for active flocks
      const flocksArray = Array.isArray(data) ? data : (data.flocks || []);
      const activeFlocks = flocksArray.filter((f: any) => f.status === 'active');
      setFlocks(activeFlocks);
    } catch (error) {
      console.error('Error fetching flocks:', error);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/batches');
      if (!response.ok) throw new Error('Failed to fetch batches');
      const data = await response.json();
      // API returns array directly, filter for active batches
      const batchesArray = Array.isArray(data) ? data : (data.batches || []);
      const activeBatches = batchesArray.filter((b: any) => ['active', 'growing', 'ready'].includes(b.status));
      setBatches(activeBatches);
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const handleCreateConsumption = async () => {
    try {
      // Get the price from the selected inventory item
      const selectedInventory = inventoryItems.find(item => item.id === formData.inventoryId);
      const feedPricePerBag = selectedInventory?.unitCostPerBag || 0;
      
      const response = await fetch('/api/feed/consumption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          feedPricePerBag
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to record consumption');
      }

      toast.success('Consumption recorded. Inventory updated automatically.');
      setIsCreateDialogOpen(false);
      resetForm();
      fetchConsumptions();
    } catch (error: any) {
      console.error('Error creating consumption:', error);
      toast.error(error.message || 'Failed to record consumption');
    }
  };

  const handleUpdateConsumption = async () => {
    if (!selectedConsumption) return;

    try {
      const response = await fetch('/api/feed/consumption', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, id: selectedConsumption.id })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update consumption');
      }

      toast.success('Consumption updated. Inventory adjusted automatically.');
      setIsEditDialogOpen(false);
      resetForm();
      fetchConsumptions();
    } catch (error: any) {
      console.error('Error updating consumption:', error);
      toast.error(error.message || 'Failed to update consumption');
    }
  };

  const handleDeleteConsumption = async () => {
    if (!selectedConsumption) return;

    try {
      const response = await fetch('/api/feed/consumption', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedConsumption.id })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete consumption');
      }

      toast.success('Consumption deleted. Inventory adjusted automatically.');
      setIsDeleteDialogOpen(false);
      setSelectedConsumption(null);
      fetchConsumptions();
    } catch (error: any) {
      console.error('Error deleting consumption:', error);
      toast.error(error.message || 'Failed to delete consumption');
    }
  };

  const openEditDialog = (consumption: FeedConsumption) => {
    setSelectedConsumption(consumption);
    setFormData({
      consumptionType: consumption.consumptionType,
      flockId: consumption.flockId || '',
      batchId: consumption.batchId || '',
      inventoryId: consumption.inventoryId,
      consumptionDate: new Date(consumption.consumptionDate).toISOString().split('T')[0],
      feedQuantityBags: consumption.feedQuantityBags,
      feedPricePerBag: consumption.inventory?.unitCostPerBag || 0,
      notes: consumption.notes || ''
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (consumption: FeedConsumption) => {
    setSelectedConsumption(consumption);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      consumptionType: 'flock',
      flockId: '',
      batchId: '',
      inventoryId: '',
      consumptionDate: new Date().toISOString().split('T')[0],
      feedQuantityBags: 0,
      feedPricePerBag: 0,
      notes: ''
    });
    setSelectedConsumption(null);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // DataTable columns
  const columns: Column<FeedConsumption>[] = [
    {
      key: 'consumptionDate',
      header: 'Date',
      sortable: true,
      cell: (row) => new Date(row.consumptionDate).toLocaleDateString('en-NG'),
    },
    {
      key: 'consumptionType',
      header: 'Type',
      sortable: true,
      cell: (row) => (
        <Badge variant={row.consumptionType === 'flock' ? 'default' : 'secondary'} className={row.consumptionType === 'flock' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-purple-100 text-purple-700 border-purple-200'}>
          {row.consumptionType === 'flock' ? 'Flock' : 'Batch'}
        </Badge>
      ),
    },
    {
      key: 'groupName',
      header: 'Group',
      sortable: true,
      cell: (row) => (
        <span className="font-medium text-gray-900">
          {row.flock?.flockName || row.batch?.batchName || '-'}
        </span>
      ),
    },
    {
      key: 'feedBrand',
      header: 'Feed Brand',
      sortable: true,
      cell: (row) => row.inventory?.feedBrand || '-',
    },
    {
      key: 'feedType',
      header: 'Feed Type',
      sortable: true,
      cell: (row) => (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
          {row.inventory?.feedType || 'N/A'}
        </Badge>
      ),
    },
    {
      key: 'feedQuantityBags',
      header: 'Quantity',
      sortable: true,
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (row) => (
        <span className="font-medium">{row.feedQuantityBags} bags</span>
      ),
    },
    {
      key: 'totalCost',
      header: 'Cost',
      sortable: true,
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (row) => (
        <span className="font-semibold text-green-700">
          ₦{(row.feedQuantityBags * (row.inventory?.unitCostPerBag || 0)).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'recorderName',
      header: 'Recorded By',
      sortable: true,
      cell: (row) => row.recorder?.fullName || '-',
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => openEditDialog(row)}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => openDeleteDialog(row)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
              <Wheat className="w-7 h-7 text-white" />
            </div>
            Feed Consumption
          </h1>
          <p className="text-gray-500 mt-1">Track daily feed usage for flocks and batches</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
          <Plus className="h-4 w-4 mr-2" />
          Record Consumption
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Feed Used"
          value={`${stats.totalFeedUsed} bags`}
          icon={TrendingDown}
          variant="warning"
        />
        <StatCard
          title="Total Cost"
          value={`₦${stats.totalCost.toLocaleString()}`}
          icon={Package}
          variant="warning"
        />
        <StatCard
          title="Total Records"
          value={stats.totalRecords.toString()}
          icon={FileText}
          variant="info"
        />
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <Wheat className="w-5 h-5 text-amber-600" />
            Consumption History
          </CardTitle>
          <CardDescription>View and manage all feed consumption records</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
          ) : (
            <DataTable
              data={consumptions}
              columns={columns}
              searchPlaceholder="Search by group, feed brand, type..."
              searchKeys={['groupName', 'feedBrand', 'feedType', 'recorderName', 'consumptionType']}
              pageSize={10}
              emptyMessage="No feed consumption records found."
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Feed Consumption</DialogTitle>
            <DialogDescription>Enter consumption details. Inventory will be deducted automatically.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="consumptionType">Consumption Type *</Label>
              <Select value={formData.consumptionType} onValueChange={(value) => setFormData({ ...formData, consumptionType: value, flockId: '', batchId: '' })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flock">Flock (Layers)</SelectItem>
                  <SelectItem value="batch">Batch (Broilers)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.consumptionType === 'flock' ? (
              <div className="grid gap-2">
                <Label htmlFor="flockId">Flock *</Label>
                <Select value={formData.flockId} onValueChange={(value) => setFormData({ ...formData, flockId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a flock" />
                  </SelectTrigger>
                  <SelectContent>
                    {flocks.map((flock) => (
                      <SelectItem key={flock.id} value={flock.id}>
                        {flock.flockName} ({flock.currentStock} birds)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="batchId">Batch *</Label>
                <Select value={formData.batchId} onValueChange={(value) => setFormData({ ...formData, batchId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.batchName} ({batch.currentStock} birds)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="inventoryId">Feed Item *</Label>
              <Select value={formData.inventoryId} onValueChange={(value) => setFormData({ ...formData, inventoryId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select feed item" />
                </SelectTrigger>
                <SelectContent>
                  {inventoryItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.feedBrand} - {item.feedType} ({item.currentStockBags} bags available)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="feedQuantityBags">Quantity (Bags) *</Label>
                <Input id="feedQuantityBags" type="number" value={formData.feedQuantityBags} onChange={(e) => setFormData({ ...formData, feedQuantityBags: Number(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="consumptionDate">Consumption Date *</Label>
                <Input id="consumptionDate" type="date" value={formData.consumptionDate} onChange={(e) => setFormData({ ...formData, consumptionDate: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleCreateConsumption} disabled={!formData.inventoryId || (!formData.flockId && !formData.batchId) || formData.feedQuantityBags <= 0}>
              Record Consumption
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Consumption Record</DialogTitle>
            <DialogDescription>Update consumption details. Inventory will be adjusted automatically.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Consumption Type</Label>
              <Select value={formData.consumptionType} onValueChange={(value) => setFormData({ ...formData, consumptionType: value, flockId: '', batchId: '' })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flock">Flock (Layers)</SelectItem>
                  <SelectItem value="batch">Batch (Broilers)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.consumptionType === 'flock' ? (
              <div className="grid gap-2">
                <Label>Flock</Label>
                <Select value={formData.flockId} onValueChange={(value) => setFormData({ ...formData, flockId: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {flocks.map((flock) => (
                      <SelectItem key={flock.id} value={flock.id}>
                        {flock.flockName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="grid gap-2">
                <Label>Batch</Label>
                <Select value={formData.batchId} onValueChange={(value) => setFormData({ ...formData, batchId: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.batchName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-2">
              <Label>Feed Item</Label>
              <Select value={formData.inventoryId} onValueChange={(value) => setFormData({ ...formData, inventoryId: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {inventoryItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.feedBrand} - {item.feedType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Quantity (Bags)</Label>
                <Input type="number" value={formData.feedQuantityBags} onChange={(e) => setFormData({ ...formData, feedQuantityBags: Number(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label>Consumption Date</Label>
                <Input type="date" value={formData.consumptionDate} onChange={(e) => setFormData({ ...formData, consumptionDate: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleUpdateConsumption} disabled={!formData.inventoryId || (!formData.flockId && !formData.batchId) || formData.feedQuantityBags <= 0}>
              Update Consumption
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Consumption Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this consumption record?
              <span className="block mt-2 font-semibold text-orange-600">
                Warning: This will reverse the inventory deduction ({selectedConsumption?.feedQuantityBags} bags will be added back to stock).
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedConsumption(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConsumption} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
