'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Search, AlertTriangle, Package } from 'lucide-react';

interface FeedInventory {
  id: string;
  feedType: string;
  feedBrand: string;
  currentStockBags: number;
  reorderLevel: number;
  unitCostPerBag: number;
  lastRestockDate?: string;
  expiryDate?: string;
  supplierId: string;
  supplier: {
    supplierName: string;
  };
  isActive: boolean;
  createdAt: string;
}

interface FeedSupplier {
  id: string;
  supplierName: string;
}

export default function FeedInventoryPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [inventory, setInventory] = useState<FeedInventory[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<FeedInventory[]>([]);
  const [suppliers, setSuppliers] = useState<FeedSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFeedType, setFilterFeedType] = useState('all');
  const [showInactive, setShowInactive] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<FeedInventory | null>(null);
  const [formData, setFormData] = useState({
    feedType: 'Starter',
    feedBrand: '',
    currentStockBags: 0,
    reorderLevel: 50,
    unitCostPerBag: 0,
    lastRestockDate: '',
    expiryDate: '',
    supplierId: '',
    isActive: true
  });

  // Summary statistics
  const [stats, setStats] = useState({
    totalValue: 0,
    lowStockItems: 0,
    totalBags: 0
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchInventory();
      fetchSuppliers();
    }
  }, [status, router]);

  useEffect(() => {
    filterInventory();
    calculateStats();
  }, [inventory, searchQuery, filterFeedType, showInactive]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/feed/inventory?includeInactive=${showInactive}`);
      if (!response.ok) throw new Error('Failed to fetch inventory');
      const data = await response.json();
      setInventory(data.inventory || []);
      setStats(data.summary || { totalValue: 0, lowStockItems: 0, totalBags: 0 });
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/feed/suppliers');
      if (!response.ok) throw new Error('Failed to fetch suppliers');
      const data = await response.json();
      setSuppliers(data.suppliers || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const filterInventory = () => {
    let filtered = inventory;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.feedBrand.toLowerCase().includes(query) ||
        item.feedType.toLowerCase().includes(query) ||
        item.supplier.supplierName.toLowerCase().includes(query)
      );
    }

    // Apply feed type filter
    if (filterFeedType !== 'all') {
      filtered = filtered.filter(item => item.feedType === filterFeedType);
    }

    setFilteredInventory(filtered);
  };

  const calculateStats = () => {
    const totalValue = filteredInventory.reduce((sum, item) => sum + (item.currentStockBags * item.unitCostPerBag), 0);
    const lowStockItems = filteredInventory.filter(item => item.currentStockBags <= item.reorderLevel).length;
    const totalBags = filteredInventory.reduce((sum, item) => sum + item.currentStockBags, 0);
    setStats({ totalValue, lowStockItems, totalBags });
  };

  const handleCreateInventory = async () => {
    try {
      const response = await fetch('/api/feed/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create inventory item');
      }

      toast.success('Inventory item created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      fetchInventory();
    } catch (error: any) {
      console.error('Error creating inventory:', error);
      toast.error(error.message || 'Failed to create inventory item');
    }
  };

  const handleUpdateInventory = async () => {
    if (!selectedInventory) return;

    try {
      const response = await fetch('/api/feed/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, id: selectedInventory.id })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update inventory item');
      }

      toast.success('Inventory item updated successfully');
      setIsEditDialogOpen(false);
      resetForm();
      fetchInventory();
    } catch (error: any) {
      console.error('Error updating inventory:', error);
      toast.error(error.message || 'Failed to update inventory item');
    }
  };

  const handleDeleteInventory = async () => {
    if (!selectedInventory) return;

    try {
      const response = await fetch('/api/feed/inventory', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedInventory.id })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete inventory item');
      }

      toast.success('Inventory item deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedInventory(null);
      fetchInventory();
    } catch (error: any) {
      console.error('Error deleting inventory:', error);
      toast.error(error.message || 'Failed to delete inventory item');
    }
  };

  const openEditDialog = (item: FeedInventory) => {
    setSelectedInventory(item);
    setFormData({
      feedType: item.feedType,
      feedBrand: item.feedBrand,
      currentStockBags: item.currentStockBags,
      reorderLevel: item.reorderLevel,
      unitCostPerBag: item.unitCostPerBag,
      lastRestockDate: item.lastRestockDate ? new Date(item.lastRestockDate).toISOString().split('T')[0] : '',
      expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
      supplierId: item.supplierId,
      isActive: item.isActive
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (item: FeedInventory) => {
    setSelectedInventory(item);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      feedType: 'Starter',
      feedBrand: '',
      currentStockBags: 0,
      reorderLevel: 50,
      unitCostPerBag: 0,
      lastRestockDate: '',
      expiryDate: '',
      supplierId: '',
      isActive: true
    });
    setSelectedInventory(null);
  };

  const isLowStock = (item: FeedInventory) => item.currentStockBags <= item.reorderLevel;

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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Feed Inventory</h1>
          <p className="text-gray-500 mt-1">Monitor and manage feed stock levels</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Inventory Item
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{stats.totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBags}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.lowStockItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert Banner */}
      {stats.lowStockItems > 0 && (
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-900">
                  {stats.lowStockItems} item(s) are running low on stock
                </p>
                <p className="text-sm text-orange-700">Please reorder to avoid shortages</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by brand, type, or supplier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterFeedType} onValueChange={setFilterFeedType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Starter">Starter</SelectItem>
                <SelectItem value="Grower">Grower</SelectItem>
                <SelectItem value="Finisher">Finisher</SelectItem>
                <SelectItem value="Layer">Layer</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={showInactive ? 'default' : 'outline'}
              onClick={() => {
                setShowInactive(!showInactive);
                fetchInventory();
              }}
            >
              {showInactive ? 'Hide Inactive' : 'Show Inactive'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory List</CardTitle>
          <CardDescription>View and manage all feed inventory items</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredInventory.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No inventory items found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Feed Type</th>
                    <th className="text-left p-4 font-medium">Brand</th>
                    <th className="text-left p-4 font-medium">Supplier</th>
                    <th className="text-right p-4 font-medium">Quantity</th>
                    <th className="text-right p-4 font-medium">Reorder Level</th>
                    <th className="text-right p-4 font-medium">Unit Cost</th>
                    <th className="text-right p-4 font-medium">Total Value</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map((item) => (
                    <tr key={item.id} className={`border-b hover:bg-gray-50 ${isLowStock(item) ? 'bg-orange-50' : ''}`}>
                      <td className="p-4">
                        <Badge variant="outline">{item.feedType}</Badge>
                      </td>
                      <td className="p-4 font-medium">{item.feedBrand}</td>
                      <td className="p-4">{item.supplier.supplierName}</td>
                      <td className="p-4 text-right">
                        <span className={isLowStock(item) ? 'text-orange-600 font-semibold' : ''}>
                          {item.currentStockBags} bags
                        </span>
                      </td>
                      <td className="p-4 text-right text-gray-500">{item.reorderLevel}</td>
                      <td className="p-4 text-right">₦{item.unitCostPerBag.toLocaleString()}</td>
                      <td className="p-4 text-right font-medium">₦{(item.currentStockBags * item.unitCostPerBag).toLocaleString()}</td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <Badge variant={item.isActive ? 'default' : 'secondary'}>
                            {item.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {isLowStock(item) && (
                            <Badge variant="destructive" className="text-xs">
                              Low Stock
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(item)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(item)}
                          >
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

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Inventory Item</DialogTitle>
            <DialogDescription>Enter the feed details below</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="feedType">Feed Type *</Label>
                <Select value={formData.feedType} onValueChange={(value) => setFormData({ ...formData, feedType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Starter">Starter</SelectItem>
                    <SelectItem value="Grower">Grower</SelectItem>
                    <SelectItem value="Finisher">Finisher</SelectItem>
                    <SelectItem value="Layer">Layer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="feedBrand">Feed Brand *</Label>
                <Input
                  id="feedBrand"
                  value={formData.feedBrand}
                  onChange={(e) => setFormData({ ...formData, feedBrand: e.target.value })}
                  placeholder="e.g., Vital Feed, Top Feeds"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="supplierId">Supplier *</Label>
              <Select value={formData.supplierId} onValueChange={(value) => setFormData({ ...formData, supplierId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.supplierName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="currentStockBags">Quantity (Bags) *</Label>
                <Input
                  id="currentStockBags"
                  type="number"
                  value={formData.currentStockBags}
                  onChange={(e) => setFormData({ ...formData, currentStockBags: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reorderLevel">Reorder Level *</Label>
                <Input
                  id="reorderLevel"
                  type="number"
                  value={formData.reorderLevel}
                  onChange={(e) => setFormData({ ...formData, reorderLevel: Number(e.target.value) })}
                  placeholder="50"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unitCostPerBag">Unit Cost Per Bag (₦) *</Label>
              <Input
                id="unitCostPerBag"
                type="number"
                value={formData.unitCostPerBag}
                onChange={(e) => setFormData({ ...formData, unitCostPerBag: Number(e.target.value) })}
                placeholder="0"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="lastRestockDate">Last Restock Date</Label>
                <Input
                  id="lastRestockDate"
                  type="date"
                  value={formData.lastRestockDate}
                  onChange={(e) => setFormData({ ...formData, lastRestockDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateInventory} 
              disabled={!formData.feedBrand || !formData.supplierId || formData.unitCostPerBag <= 0}
            >
              Create Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
            <DialogDescription>Update the feed details below</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-feedType">Feed Type *</Label>
                <Select value={formData.feedType} onValueChange={(value) => setFormData({ ...formData, feedType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Starter">Starter</SelectItem>
                    <SelectItem value="Grower">Grower</SelectItem>
                    <SelectItem value="Finisher">Finisher</SelectItem>
                    <SelectItem value="Layer">Layer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-feedBrand">Feed Brand *</Label>
                <Input
                  id="edit-feedBrand"
                  value={formData.feedBrand}
                  onChange={(e) => setFormData({ ...formData, feedBrand: e.target.value })}
                  placeholder="e.g., Vital Feed, Top Feeds"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-supplierId">Supplier *</Label>
              <Select value={formData.supplierId} onValueChange={(value) => setFormData({ ...formData, supplierId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.supplierName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-currentStockBags">Quantity (Bags) *</Label>
                <Input
                  id="edit-currentStockBags"
                  type="number"
                  value={formData.currentStockBags}
                  onChange={(e) => setFormData({ ...formData, currentStockBags: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-reorderLevel">Reorder Level *</Label>
                <Input
                  id="edit-reorderLevel"
                  type="number"
                  value={formData.reorderLevel}
                  onChange={(e) => setFormData({ ...formData, reorderLevel: Number(e.target.value) })}
                  placeholder="50"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-unitCostPerBag">Unit Cost Per Bag (₦) *</Label>
              <Input
                id="edit-unitCostPerBag"
                type="number"
                value={formData.unitCostPerBag}
                onChange={(e) => setFormData({ ...formData, unitCostPerBag: Number(e.target.value) })}
                placeholder="0"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-lastRestockDate">Last Restock Date</Label>
                <Input
                  id="edit-lastRestockDate"
                  type="date"
                  value={formData.lastRestockDate}
                  onChange={(e) => setFormData({ ...formData, lastRestockDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-expiryDate">Expiry Date</Label>
                <Input
                  id="edit-expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="edit-isActive">Active Item</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateInventory} 
              disabled={!formData.feedBrand || !formData.supplierId || formData.unitCostPerBag <= 0}
            >
              Update Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Inventory Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedInventory?.feedBrand} ({selectedInventory?.feedType})</strong>?
              <span className="block mt-2">
                This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedInventory(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInventory} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}