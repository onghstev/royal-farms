'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Eye, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { NumberInput } from '@/components/ui/number-input';

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  orderDate: string;
  supplier: { supplierName: string };
  status: string;
  totalAmount: number;
  paymentStatus: string;
  items: any[];
}

interface Supplier {
  id: string;
  supplierName: string;
}

interface InventoryItem {
  id: string;
  itemName: string;
  unit: string;
  unitCost: number;
}

interface POItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export default function PurchaseOrdersPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    supplierId: '',
    orderDate: new Date().toISOString().split('T')[0],
    status: 'draft',
    paymentStatus: 'pending',
    notes: ''
  });
  const [poItems, setPOItems] = useState<POItem[]>([
    { itemId: '', itemName: '', quantity: 1, unitPrice: 0, totalPrice: 0 }
  ]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchOrders();
      fetchSuppliers();
      fetchInventoryItems();
    }
  }, [status]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/inventory/purchase-orders');
      const data = await response.json();
      if (data.success) setOrders(data.data);
    } catch (error) {
      toast.error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/inventory/suppliers');
      const data = await response.json();
      if (data.success) setSuppliers(data.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const response = await fetch('/api/inventory/items');
      const data = await response.json();
      if (data.success) setInventoryItems(data.data);
    } catch (error) {
      console.error('Error fetching inventory items:', error);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      supplierId: suppliers.length > 0 ? suppliers[0].id : '',
      orderDate: new Date().toISOString().split('T')[0],
      status: 'draft',
      paymentStatus: 'pending',
      notes: ''
    });
    setPOItems([{ itemId: '', itemName: '', quantity: 1, unitPrice: 0, totalPrice: 0 }]);
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...poItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // If item is selected, auto-populate unit price
    if (field === 'itemId') {
      const selectedItem = inventoryItems.find(item => item.id === value);
      if (selectedItem) {
        updatedItems[index].itemName = selectedItem.itemName;
        updatedItems[index].unitPrice = Number(selectedItem.unitCost);
      }
    }

    // Calculate total price for this item
    updatedItems[index].totalPrice = updatedItems[index].quantity * updatedItems[index].unitPrice;

    setPOItems(updatedItems);
  };

  const addItem = () => {
    setPOItems([...poItems, { itemId: '', itemName: '', quantity: 1, unitPrice: 0, totalPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    if (poItems.length > 1) {
      setPOItems(poItems.filter((_, i) => i !== index));
    }
  };

  const calculateTotal = () => {
    return poItems.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.supplierId) {
      toast.error('Please select a supplier');
      return;
    }

    const validItems = poItems.filter(item => item.itemId && item.quantity > 0 && item.unitPrice > 0);
    if (validItems.length === 0) {
      toast.error('Please add at least one valid item');
      return;
    }

    try {
      const payload = {
        ...formData,
        totalAmount: calculateTotal(),
        items: validItems.map(item => ({
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        }))
      };

      const response = await fetch('/api/inventory/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Purchase order created successfully');
        handleCloseDialog();
        fetchOrders();
      } else {
        toast.error(data.error || 'Failed to create purchase order');
      }
    } catch (error) {
      console.error('Error creating purchase order:', error);
      toast.error('Failed to create purchase order');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: any = {
      draft: 'secondary',
      submitted: 'default',
      approved: 'default',
      received: 'default',
      cancelled: 'destructive'
    };
    return colors[status] || 'secondary';
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground mt-2">Manage procurement and supplier orders</p>
        </div>
        <Button onClick={handleOpenDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Create Purchase Order
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <FileText className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter(o => o.status === 'submitted' || o.status === 'approved').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Received</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter(o => o.status === 'received').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{orders.reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">PO Number</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Supplier</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Items</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Payment</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                    <td className="px-4 py-3">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">{order.supplier.supplierName}</td>
                    <td className="px-4 py-3">{order.items.length} items</td>
                    <td className="px-4 py-3">₦{Number(order.totalAmount).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                        {order.paymentStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {orders.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No purchase orders yet</h3>
          <Button onClick={handleOpenDialog} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Create First Purchase Order
          </Button>
        </div>
      )}

      {/* Create Purchase Order Dialog */}
      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
            <DialogDescription>
              Create a new purchase order for inventory items
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supplierId">Supplier *</Label>
                  <Select
                    value={formData.supplierId}
                    onValueChange={(value) => setFormData({ ...formData, supplierId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map(supplier => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.supplierName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="orderDate">Order Date *</Label>
                  <Input
                    id="orderDate"
                    type="date"
                    value={formData.orderDate}
                    onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-lg font-semibold">Order Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                {poItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end border-b pb-3">
                    <div className="col-span-4">
                      <Label>Item *</Label>
                      <Select
                        value={item.itemId}
                        onValueChange={(value) => handleItemChange(index, 'itemId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select item" />
                        </SelectTrigger>
                        <SelectContent>
                          {inventoryItems.map(invItem => (
                            <SelectItem key={invItem.id} value={invItem.id}>
                              {invItem.itemName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label>Quantity *</Label>
                      <NumberInput
                        value={item.quantity}
                        onChange={(value) => handleItemChange(index, 'quantity', value)}
                        allowDecimals={true}
                        maxDecimals={2}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Unit Price (₦) *</Label>
                      <NumberInput
                        value={item.unitPrice}
                        onChange={(value) => handleItemChange(index, 'unitPrice', value)}
                        allowDecimals={true}
                        maxDecimals={2}
                      />
                    </div>
                    <div className="col-span-3">
                      <Label>Total Price (₦)</Label>
                      <Input
                        type="text"
                        value={formatCurrency(item.totalPrice, '₦', 2)}
                        disabled
                        readOnly
                        className="bg-muted cursor-not-allowed"
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        disabled={poItems.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="flex justify-end pt-2">
                  <div className="text-right">
                    <Label className="text-muted-foreground">Total Amount</Label>
                    <div className="text-2xl font-bold">{formatCurrency(calculateTotal(), '₦', 2)}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="paymentStatus">Payment Status</Label>
                  <Select
                    value={formData.paymentStatus}
                    onValueChange={(value) => setFormData({ ...formData, paymentStatus: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">Create Purchase Order</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
