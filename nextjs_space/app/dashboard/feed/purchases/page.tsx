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
import { Plus, Edit2, Trash2, Search, TrendingUp, DollarSign, Package } from 'lucide-react';

interface FeedPurchase {
  id: string;
  supplierId: string;
  inventoryId: string;
  quantityBags: number;
  pricePerBag: number;
  totalCost: number;
  purchaseDate: string;
  invoiceNumber?: string;
  paymentStatus: string;
  notes?: string;
  supplier: {
    supplierName: string;
  };
  inventory: {
    feedBrand: string;
    feedType: string;
  };
  receiver: {
    fullName: string;
  };
  createdAt: string;
}

interface FeedSupplier {
  id: string;
  supplierName: string;
}

interface FeedInventory {
  id: string;
  feedBrand: string;
  feedType: string;
  supplier: {
    id: string;
    supplierName: string;
  };
}

export default function FeedPurchasesPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [purchases, setPurchases] = useState<FeedPurchase[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<FeedPurchase[]>([]);
  const [suppliers, setSuppliers] = useState<FeedSupplier[]>([]);
  const [inventoryItems, setInventoryItems] = useState<FeedInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<FeedPurchase | null>(null);
  const [formData, setFormData] = useState({
    supplierId: '',
    inventoryId: '',
    quantityBags: 0,
    pricePerBag: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
    invoiceNumber: '',
    paymentStatus: 'Pending',
    notes: ''
  });

  const [stats, setStats] = useState({
    totalSpent: 0,
    pendingPayments: 0,
    totalPurchases: 0
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchPurchases();
      fetchSuppliers();
      fetchInventoryItems();
    }
  }, [status, router]);

  useEffect(() => {
    filterPurchases();
    calculateStats();
  }, [purchases, searchQuery, filterSupplier, filterPaymentStatus]);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/feed/purchases');
      if (!response.ok) throw new Error('Failed to fetch purchases');
      const data = await response.json();
      setPurchases(data.purchases || []);
      setStats(data.summary || { totalSpent: 0, pendingPayments: 0, totalPurchases: 0 });
    } catch (error) {
      console.error('Error fetching purchases:', error);
      toast.error('Failed to load purchases');
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

  const filterPurchases = () => {
    let filtered = purchases;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(purchase =>
        purchase.supplier.supplierName.toLowerCase().includes(query) ||
        purchase.inventory.feedBrand.toLowerCase().includes(query) ||
        purchase.invoiceNumber?.toLowerCase().includes(query)
      );
    }

    if (filterSupplier !== 'all') {
      filtered = filtered.filter(purchase => purchase.supplierId === filterSupplier);
    }

    if (filterPaymentStatus !== 'all') {
      filtered = filtered.filter(purchase => purchase.paymentStatus === filterPaymentStatus);
    }

    setFilteredPurchases(filtered);
  };

  const calculateStats = () => {
    const totalSpent = filteredPurchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);
    const pendingPayments = filteredPurchases
      .filter(p => p.paymentStatus === 'Pending')
      .reduce((sum, purchase) => sum + purchase.totalCost, 0);
    const totalPurchases = filteredPurchases.length;
    setStats({ totalSpent, pendingPayments, totalPurchases });
  };

  const handleCreatePurchase = async () => {
    try {
      const response = await fetch('/api/feed/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create purchase');
      }

      toast.success('Purchase recorded. Inventory updated automatically.');
      setIsCreateDialogOpen(false);
      resetForm();
      fetchPurchases();
    } catch (error: any) {
      console.error('Error creating purchase:', error);
      toast.error(error.message || 'Failed to create purchase');
    }
  };

  const handleUpdatePurchase = async () => {
    if (!selectedPurchase) return;

    try {
      const response = await fetch('/api/feed/purchases', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, id: selectedPurchase.id })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update purchase');
      }

      toast.success('Purchase updated. Inventory adjusted automatically.');
      setIsEditDialogOpen(false);
      resetForm();
      fetchPurchases();
    } catch (error: any) {
      console.error('Error updating purchase:', error);
      toast.error(error.message || 'Failed to update purchase');
    }
  };

  const handleDeletePurchase = async () => {
    if (!selectedPurchase) return;

    try {
      const response = await fetch('/api/feed/purchases', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedPurchase.id })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete purchase');
      }

      toast.success('Purchase deleted. Inventory adjusted automatically.');
      setIsDeleteDialogOpen(false);
      setSelectedPurchase(null);
      fetchPurchases();
    } catch (error: any) {
      console.error('Error deleting purchase:', error);
      toast.error(error.message || 'Failed to delete purchase');
    }
  };

  const openEditDialog = (purchase: FeedPurchase) => {
    setSelectedPurchase(purchase);
    setFormData({
      supplierId: purchase.supplierId,
      inventoryId: purchase.inventoryId,
      quantityBags: purchase.quantityBags,
      pricePerBag: purchase.pricePerBag,
      purchaseDate: new Date(purchase.purchaseDate).toISOString().split('T')[0],
      invoiceNumber: purchase.invoiceNumber || '',
      paymentStatus: purchase.paymentStatus,
      notes: purchase.notes || ''
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (purchase: FeedPurchase) => {
    setSelectedPurchase(purchase);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      supplierId: '',
      inventoryId: '',
      quantityBags: 0,
      pricePerBag: 0,
      purchaseDate: new Date().toISOString().split('T')[0],
      invoiceNumber: '',
      paymentStatus: 'Pending',
      notes: ''
    });
    setSelectedPurchase(null);
  };

  const filteredInventoryForForm = formData.supplierId
    ? inventoryItems.filter(item => item.supplier.id === formData.supplierId)
    : [];

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
          <h1 className="text-3xl font-bold text-gray-900">Feed Purchases</h1>
          <p className="text-gray-500 mt-1">Record and manage feed purchase orders</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Record Purchase
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{stats.totalSpent.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">₦{stats.pendingPayments.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPurchases}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₦{(stats.totalSpent - stats.pendingPayments).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by supplier, feed brand, or invoice..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterSupplier} onValueChange={setFilterSupplier}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.supplierName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Payment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Partial">Partial</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
          <CardDescription>View and manage all feed purchase records</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPurchases.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No purchases found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Date</th>
                    <th className="text-left p-4 font-medium">Supplier</th>
                    <th className="text-left p-4 font-medium">Feed Brand</th>
                    <th className="text-left p-4 font-medium">Feed Type</th>
                    <th className="text-right p-4 font-medium">Quantity</th>
                    <th className="text-right p-4 font-medium">Unit Price</th>
                    <th className="text-right p-4 font-medium">Total Cost</th>
                    <th className="text-left p-4 font-medium">Invoice</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchases.map((purchase) => (
                    <tr key={purchase.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">{new Date(purchase.purchaseDate).toLocaleDateString()}</td>
                      <td className="p-4 font-medium">{purchase.supplier.supplierName}</td>
                      <td className="p-4">{purchase.inventory.feedBrand}</td>
                      <td className="p-4">
                        <Badge variant="outline">{purchase.inventory.feedType}</Badge>
                      </td>
                      <td className="p-4 text-right">{purchase.quantityBags} bags</td>
                      <td className="p-4 text-right">₦{purchase.pricePerBag.toLocaleString()}</td>
                      <td className="p-4 text-right font-medium">₦{purchase.totalCost.toLocaleString()}</td>
                      <td className="p-4">{purchase.invoiceNumber || '-'}</td>
                      <td className="p-4">
                        <Badge
                          variant={
                            purchase.paymentStatus === 'Paid'
                              ? 'default'
                              : purchase.paymentStatus === 'Partial'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {purchase.paymentStatus}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(purchase)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(purchase)}>
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
            <DialogTitle>Record New Purchase</DialogTitle>
            <DialogDescription>
              Enter purchase details. Inventory will be updated automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="supplierId">Supplier *</Label>
              <Select 
                value={formData.supplierId} 
                onValueChange={(value) => setFormData({ ...formData, supplierId: value, inventoryId: '' })}
              >
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
            <div className="grid gap-2">
              <Label htmlFor="inventoryId">Feed Item *</Label>
              <Select 
                value={formData.inventoryId} 
                onValueChange={(value) => setFormData({ ...formData, inventoryId: value })}
                disabled={!formData.supplierId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formData.supplierId ? "Select feed item" : "Select supplier first"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredInventoryForForm.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.feedBrand} - {item.feedType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantityBags">Quantity (Bags) *</Label>
                <Input
                  id="quantityBags"
                  type="number"
                  value={formData.quantityBags}
                  onChange={(e) => setFormData({ ...formData, quantityBags: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pricePerBag">Price Per Bag (₦) *</Label>
                <Input
                  id="pricePerBag"
                  type="number"
                  value={formData.pricePerBag}
                  onChange={(e) => setFormData({ ...formData, pricePerBag: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Total Cost</Label>
              <div className="text-2xl font-bold text-green-600">
                ₦{(formData.quantityBags * formData.pricePerBag).toLocaleString()}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="purchaseDate">Purchase Date *</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="paymentStatus">Payment Status *</Label>
                <Select value={formData.paymentStatus} onValueChange={(value) => setFormData({ ...formData, paymentStatus: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Partial">Partial</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreatePurchase} 
              disabled={!formData.supplierId || !formData.inventoryId || formData.quantityBags <= 0 || formData.pricePerBag <= 0}
            >
              Record Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Purchase</DialogTitle>
            <DialogDescription>
              Update purchase details. Inventory will be adjusted automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-supplierId">Supplier *</Label>
              <Select value={formData.supplierId} onValueChange={(value) => setFormData({ ...formData, supplierId: value, inventoryId: '' })}>
                <SelectTrigger>
                  <SelectValue />
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
            <div className="grid gap-2">
              <Label htmlFor="edit-inventoryId">Feed Item *</Label>
              <Select value={formData.inventoryId} onValueChange={(value) => setFormData({ ...formData, inventoryId: value })} disabled={!formData.supplierId}>
                <SelectTrigger>
                  <SelectValue placeholder={formData.supplierId ? "Select feed item" : "Select supplier first"} />
                </SelectTrigger>
                <SelectContent>
                  {inventoryItems.filter(item => item.supplier.id === formData.supplierId).map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.feedBrand} - {item.feedType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-quantityBags">Quantity (Bags) *</Label>
                <Input id="edit-quantityBags" type="number" value={formData.quantityBags} onChange={(e) => setFormData({ ...formData, quantityBags: Number(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-pricePerBag">Price Per Bag (₦) *</Label>
                <Input id="edit-pricePerBag" type="number" value={formData.pricePerBag} onChange={(e) => setFormData({ ...formData, pricePerBag: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Total Cost</Label>
              <div className="text-2xl font-bold text-green-600">₦{(formData.quantityBags * formData.pricePerBag).toLocaleString()}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-purchaseDate">Purchase Date *</Label>
                <Input id="edit-purchaseDate" type="date" value={formData.purchaseDate} onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-paymentStatus">Payment Status *</Label>
                <Select value={formData.paymentStatus} onValueChange={(value) => setFormData({ ...formData, paymentStatus: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Partial">Partial</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-invoiceNumber">Invoice Number</Label>
              <Input id="edit-invoiceNumber" value={formData.invoiceNumber} onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea id="edit-notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleUpdatePurchase} disabled={!formData.supplierId || !formData.inventoryId || formData.quantityBags <= 0 || formData.pricePerBag <= 0}>
              Update Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this purchase record?
              <span className="block mt-2 font-semibold text-orange-600">
                Warning: This will automatically reverse the inventory addition ({selectedPurchase?.quantityBags} bags will be removed from stock).
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedPurchase(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePurchase} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
