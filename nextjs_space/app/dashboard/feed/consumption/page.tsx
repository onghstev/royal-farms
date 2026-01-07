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
import { Plus, Edit2, Trash2, Search, TrendingDown, Package, AlertTriangle } from 'lucide-react';

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
  currentBirdCount: number;
}

interface Batch {
  id: string;
  batchName: string;
  currentBirdCount: number;
}

export default function FeedConsumptionPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [consumptions, setConsumptions] = useState<FeedConsumption[]>([]);
  const [filteredConsumptions, setFilteredConsumptions] = useState<FeedConsumption[]>([]);
  const [inventoryItems, setInventoryItems] = useState<FeedInventory[]>([]);
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedConsumption, setSelectedConsumption] = useState<FeedConsumption | null>(null);
  const [formData, setFormData] = useState({
    consumptionType: 'Flock',
    flockId: '',
    batchId: '',
    inventoryId: '',
    consumptionDate: new Date().toISOString().split('T')[0],
    feedQuantityBags: 0,
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

  useEffect(() => {
    filterConsumptions();
    calculateStats();
  }, [consumptions, searchQuery, filterType]);

  const fetchConsumptions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/feed/consumption');
      if (!response.ok) throw new Error('Failed to fetch consumption records');
      const data = await response.json();
      setConsumptions(data.consumptions || []);
      setStats(data.summary || { totalFeedUsed: 0, totalCost: 0, totalRecords: 0 });
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
      setFlocks(data.flocks || []);
    } catch (error) {
      console.error('Error fetching flocks:', error);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/batches');
      if (!response.ok) throw new Error('Failed to fetch batches');
      const data = await response.json();
      setBatches(data.batches || []);
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const filterConsumptions = () => {
    let filtered = consumptions;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(consumption =>
        consumption.inventory.feedBrand.toLowerCase().includes(query) ||
        consumption.flock?.flockName?.toLowerCase().includes(query) ||
        consumption.batch?.batchName?.toLowerCase().includes(query)
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(consumption => consumption.consumptionType === filterType);
    }

    setFilteredConsumptions(filtered);
  };

  const calculateStats = () => {
    const totalFeedUsed = filteredConsumptions.reduce((sum, consumption) => sum + consumption.feedQuantityBags, 0);
    const totalCost = filteredConsumptions.reduce((sum, consumption) => 
      sum + (consumption.feedQuantityBags * consumption.inventory.unitCostPerBag), 0
    );
    const totalRecords = filteredConsumptions.length;
    setStats({ totalFeedUsed, totalCost, totalRecords });
  };

  const handleCreateConsumption = async () => {
    try {
      const response = await fetch('/api/feed/consumption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
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
      consumptionType: 'Flock',
      flockId: '',
      batchId: '',
      inventoryId: '',
      consumptionDate: new Date().toISOString().split('T')[0],
      feedQuantityBags: 0,
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

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Feed Consumption</h1>
          <p className="text-gray-500 mt-1">Track daily feed usage for flocks and batches</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Record Consumption
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feed Used</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFeedUsed} bags</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{stats.totalCost.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRecords}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by feed brand, flock, or batch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Flock">Flock (Layers)</SelectItem>
                <SelectItem value="Batch">Batch (Broilers)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Consumption History</CardTitle>
          <CardDescription>View and manage all feed consumption records</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredConsumptions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No consumption records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Date</th>
                    <th className="text-left p-4 font-medium">Type</th>
                    <th className="text-left p-4 font-medium">Group</th>
                    <th className="text-left p-4 font-medium">Feed Brand</th>
                    <th className="text-left p-4 font-medium">Feed Type</th>
                    <th className="text-right p-4 font-medium">Quantity</th>
                    <th className="text-right p-4 font-medium">Cost</th>
                    <th className="text-left p-4 font-medium">Recorded By</th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredConsumptions.map((consumption) => (
                    <tr key={consumption.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">{new Date(consumption.consumptionDate).toLocaleDateString()}</td>
                      <td className="p-4">
                        <Badge variant={consumption.consumptionType === 'Flock' ? 'default' : 'secondary'}>
                          {consumption.consumptionType}
                        </Badge>
                      </td>
                      <td className="p-4 font-medium">
                        {consumption.flock?.flockName || consumption.batch?.batchName}
                      </td>
                      <td className="p-4">{consumption.inventory.feedBrand}</td>
                      <td className="p-4">
                        <Badge variant="outline">{consumption.inventory.feedType}</Badge>
                      </td>
                      <td className="p-4 text-right">{consumption.feedQuantityBags} bags</td>
                      <td className="p-4 text-right">
                        ₦{(consumption.feedQuantityBags * consumption.inventory.unitCostPerBag).toLocaleString()}
                      </td>
                      <td className="p-4">{consumption.recorder.fullName}</td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(consumption)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(consumption)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                  <SelectItem value="Flock">Flock (Layers)</SelectItem>
                  <SelectItem value="Batch">Batch (Broilers)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.consumptionType === 'Flock' ? (
              <div className="grid gap-2">
                <Label htmlFor="flockId">Flock *</Label>
                <Select value={formData.flockId} onValueChange={(value) => setFormData({ ...formData, flockId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a flock" />
                  </SelectTrigger>
                  <SelectContent>
                    {flocks.map((flock) => (
                      <SelectItem key={flock.id} value={flock.id}>
                        {flock.flockName} ({flock.currentBirdCount} birds)
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
                        {batch.batchName} ({batch.currentBirdCount} birds)
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
                  <SelectItem value="Flock">Flock (Layers)</SelectItem>
                  <SelectItem value="Batch">Batch (Broilers)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.consumptionType === 'Flock' ? (
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
