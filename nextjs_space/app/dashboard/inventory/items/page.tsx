'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Edit2, Trash2, Search, Package, AlertTriangle, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface InventoryItem {
  id: string;
  itemName: string;
  itemCode?: string;
  categoryId: string;
  category: { id: string; categoryName: string };
  description?: string;
  unit: string;
  currentStock: number;
  reorderLevel: number;
  maxStockLevel?: number;
  unitCost: number;
  supplierId?: string;
  supplier?: { id: string; supplierName: string };
  storageLocation?: string;
  expiryDate?: string;
  lastRestockDate?: string;
  isActive: boolean;
  notes?: string;
}

interface Category {
  id: string;
  categoryName: string;
}

interface Supplier {
  id: string;
  supplierName: string;
}

export default function InventoryItemsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showLowStock, setShowLowStock] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    itemName: '',
    itemCode: '',
    categoryId: '',
    description: '',
    unit: 'pieces',
    currentStock: 0,
    reorderLevel: 10,
    maxStockLevel: 0,
    unitCost: 0,
    supplierId: '',
    storageLocation: '',
    expiryDate: '',
    lastRestockDate: '',
    isActive: true,
    notes: ''
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  useEffect(() => {
    let filtered = items;
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.categoryId === categoryFilter);
    }
    
    if (showLowStock) {
      filtered = filtered.filter(item => Number(item.currentStock) <= Number(item.reorderLevel));
    }
    
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.itemCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredItems(filtered);
  }, [searchTerm, items, categoryFilter, showLowStock]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, categoriesRes, suppliersRes] = await Promise.all([
        fetch('/api/inventory/items'),
        fetch('/api/inventory/categories'),
        fetch('/api/inventory/suppliers')
      ]);
      
      const [itemsData, categoriesData, suppliersData] = await Promise.all([
        itemsRes.json(),
        categoriesRes.json(),
        suppliersRes.json()
      ]);
      
      if (itemsData.success) {
        setItems(itemsData.data);
        setFilteredItems(itemsData.data);
      }
      if (categoriesData.success) setCategories(categoriesData.data);
      if (suppliersData.success) setSuppliers(suppliersData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item?: InventoryItem) => {
    if (item) {
      setSelectedItem(item);
      setFormData({
        itemName: item.itemName,
        itemCode: item.itemCode || '',
        categoryId: item.categoryId,
        description: item.description || '',
        unit: item.unit,
        currentStock: Number(item.currentStock),
        reorderLevel: Number(item.reorderLevel),
        maxStockLevel: Number(item.maxStockLevel) || 0,
        unitCost: Number(item.unitCost),
        supplierId: item.supplierId || '',
        storageLocation: item.storageLocation || '',
        expiryDate: item.expiryDate ? item.expiryDate.split('T')[0] : '',
        lastRestockDate: item.lastRestockDate ? item.lastRestockDate.split('T')[0] : '',
        isActive: item.isActive,
        notes: item.notes || ''
      });
    } else {
      setSelectedItem(null);
      setFormData({
        itemName: '',
        itemCode: '',
        categoryId: categories[0]?.id || '',
        description: '',
        unit: 'pieces',
        currentStock: 0,
        reorderLevel: 10,
        maxStockLevel: 0,
        unitCost: 0,
        supplierId: '',
        storageLocation: '',
        expiryDate: '',
        lastRestockDate: '',
        isActive: true,
        notes: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = '/api/inventory/items';
      const method = selectedItem ? 'PUT' : 'POST';
      const payload = selectedItem 
        ? { ...formData, id: selectedItem.id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Item ${selectedItem ? 'updated' : 'created'} successfully`);
        handleCloseModal();
        fetchData();
      } else {
        toast.error(data.error || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Failed to save item');
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    try {
      const response = await fetch(`/api/inventory/items?id=${selectedItem.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Item deleted successfully');
        setShowDeleteDialog(false);
        setSelectedItem(null);
        fetchData();
      } else {
        toast.error(data.error || 'Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const lowStockItems = items.filter(item => Number(item.currentStock) <= Number(item.reorderLevel));
  const totalValue = items.reduce((sum, item) => sum + (Number(item.currentStock) * Number(item.unitCost)), 0);

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Items</h1>
          <p className="text-muted-foreground mt-2">Track stock levels and manage inventory</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      {lowStockItems.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-semibold">{lowStockItems.length} items</span> are running low on stock.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{lowStockItems.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>{cat.categoryName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="showLowStock"
            checked={showLowStock}
            onChange={(e) => setShowLowStock(e.target.checked)}
            className="h-4 w-4"
          />
          <Label htmlFor="showLowStock">Low Stock Only</Label>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Item Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Stock</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Unit Cost</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Value</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const isLowStock = Number(item.currentStock) <= Number(item.reorderLevel);
                  const itemValue = Number(item.currentStock) * Number(item.unitCost);
                  return (
                    <tr key={item.id} className="border-t hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="font-medium">{item.itemName}</div>
                        {item.itemCode && (
                          <div className="text-sm text-muted-foreground">{item.itemCode}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{item.category.categoryName}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className={isLowStock ? 'text-red-600 font-semibold' : ''}>
                          {Number(item.currentStock)} {item.unit}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Reorder: {Number(item.reorderLevel)}
                        </div>
                      </td>
                      <td className="px-4 py-3">₦{Number(item.unitCost).toLocaleString()}</td>
                      <td className="px-4 py-3">₦{itemValue.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        {isLowStock ? (
                          <Badge variant="destructive">Low Stock</Badge>
                        ) : (
                          <Badge variant="default">In Stock</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenModal(item)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedItem(item);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedItem ? 'Edit Item' : 'Create New Item'}</DialogTitle>
            <DialogDescription>
              {selectedItem ? 'Update item details' : 'Add a new inventory item'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="itemName">Item Name *</Label>
                  <Input
                    id="itemName"
                    value={formData.itemName}
                    onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="itemCode">Item Code</Label>
                  <Input
                    id="itemCode"
                    value={formData.itemCode}
                    onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="categoryId">Category *</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.categoryName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="supplierId">Supplier</Label>
                  <Select
                    value={formData.supplierId}
                    onValueChange={(value) => setFormData({ ...formData, supplierId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {suppliers.map(sup => (
                        <SelectItem key={sup.id} value={sup.id}>{sup.supplierName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="unit">Unit *</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => setFormData({ ...formData, unit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pieces">Pieces</SelectItem>
                      <SelectItem value="boxes">Boxes</SelectItem>
                      <SelectItem value="liters">Liters</SelectItem>
                      <SelectItem value="kg">Kilograms</SelectItem>
                      <SelectItem value="bags">Bags</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="currentStock">Current Stock *</Label>
                  <Input
                    id="currentStock"
                    type="number"
                    step="0.01"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="reorderLevel">Reorder Level *</Label>
                  <Input
                    id="reorderLevel"
                    type="number"
                    step="0.01"
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="unitCost">Unit Cost (₦) *</Label>
                  <Input
                    id="unitCost"
                    type="number"
                    step="0.01"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="storageLocation">Storage Location</Label>
                  <Input
                    id="storageLocation"
                    value={formData.storageLocation}
                    onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button type="submit">
                {selectedItem ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{selectedItem?.itemName}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
