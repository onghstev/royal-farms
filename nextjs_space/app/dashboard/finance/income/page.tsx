'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { NumberInput } from '@/components/ui/number-input';
import { Plus, Edit2, Trash2, Search, DollarSign, TrendingUp, FileText, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface IncomeTransaction {
  id: string;
  transactionDate: string;
  category: string;
  amount: number;
  quantity?: number;
  unitPrice?: number;
  customerName?: string;
  customerPhone?: string;
  paymentMethod: string;
  paymentStatus: string;
  invoiceNumber?: string;
  flockId?: string;
  batchId?: string;
  description?: string;
  notes?: string;
  flock?: { id: string; flockName: string };
  batch?: { id: string; batchName: string };
}

export default function IncomeManagementPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [transactions, setTransactions] = useState<IncomeTransaction[]>([]);
  const [flocks, setFlocks] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<IncomeTransaction | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [summary, setSummary] = useState<any>({});

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, categoryFilter, paymentStatusFilter]);

  // Auto-calculate total amount when quantity or unitPrice changes
  useEffect(() => {
    if (formData.quantity && formData.unitPrice) {
      const qty = typeof formData.quantity === 'number' ? formData.quantity : parseFloat(formData.quantity) || 0;
      const price = typeof formData.unitPrice === 'number' ? formData.unitPrice : parseFloat(formData.unitPrice) || 0;
      const calculatedAmount = qty * price;
      setFormData((prev: any) => ({ ...prev, amount: calculatedAmount }));
    }
  }, [formData.quantity, formData.unitPrice]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [incomeRes, flocksRes, batchesRes] = await Promise.all([
        fetch(`/api/finance/income?category=${categoryFilter}&paymentStatus=${paymentStatusFilter}`),
        fetch('/api/flocks'),
        fetch('/api/batches')
      ]);

      if (!incomeRes.ok) throw new Error('Failed to fetch income');

      const incomeData = await incomeRes.json();
      setTransactions(incomeData.transactions || []);
      setSummary(incomeData.summary || {});

      if (flocksRes.ok) {
        const flocksData = await flocksRes.json();
        setFlocks(flocksData.flocks || []);
      }

      if (batchesRes.ok) {
        const batchesData = await batchesRes.json();
        setBatches(batchesData.batches || []);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load income data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async () => {
    try {
      const method = selectedTransaction ? 'PUT' : 'POST';
      const body = selectedTransaction ? { id: selectedTransaction.id, ...formData } : formData;

      const response = await fetch('/api/finance/income', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Operation failed');
      }

      toast.success(selectedTransaction ? 'Income updated successfully' : 'Income recorded successfully');
      setIsDialogOpen(false);
      setSelectedTransaction(null);
      setFormData({});
      fetchData();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    if (!selectedTransaction) return;

    try {
      const response = await fetch(`/api/finance/income?id=${selectedTransaction.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete');

      toast.success('Income transaction deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedTransaction(null);
      fetchData();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Failed to delete income transaction');
    }
  };

  const openCreateDialog = () => {
    setSelectedTransaction(null);
    setFormData({
      transactionDate: new Date().toISOString().split('T')[0],
      category: 'egg_sales',
      paymentMethod: 'cash',
      paymentStatus: 'paid'
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (transaction: IncomeTransaction) => {
    setSelectedTransaction(transaction);
    setFormData({
      transactionDate: transaction.transactionDate,
      category: transaction.category,
      amount: transaction.amount,
      quantity: transaction.quantity || '',
      unitPrice: transaction.unitPrice || '',
      customerName: transaction.customerName || '',
      customerPhone: transaction.customerPhone || '',
      paymentMethod: transaction.paymentMethod,
      paymentStatus: transaction.paymentStatus,
      invoiceNumber: transaction.invoiceNumber || '',
      flockId: transaction.flockId || '',
      batchId: transaction.batchId || '',
      description: transaction.description || '',
      notes: transaction.notes || ''
    });
    setIsDialogOpen(true);
  };

  const filteredTransactions = transactions.filter((t: any) =>
    t.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading income data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Income Management</h1>
          <p className="text-gray-600 mt-1">Record and track all farm income</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> Record Income
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.total || 0, '₦', 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(summary.paid || 0, '₦', 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(summary.pending || 0, '₦', 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{summary.transactionCount || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by customer, invoice..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="egg_sales">Egg Sales</SelectItem>
                  <SelectItem value="bird_sales">Bird Sales</SelectItem>
                  <SelectItem value="manure_sales">Manure Sales</SelectItem>
                  <SelectItem value="other">Other Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Payment Status</Label>
              <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Income Transactions</CardTitle>
          <CardDescription>{filteredTransactions.length} transactions found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Invoice#</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No income transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{format(new Date(transaction.transactionDate), 'dd MMM yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {transaction.category.replace(/_/g, ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {transaction.customerName || '-'}
                        {transaction.flock && <div className="text-xs text-gray-500">{transaction.flock.flockName}</div>}
                        {transaction.batch && <div className="text-xs text-gray-500">{transaction.batch.batchName}</div>}
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(transaction.amount, '₦', 0)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            transaction.paymentStatus === 'paid'
                              ? 'default'
                              : transaction.paymentStatus === 'pending'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {transaction.paymentStatus.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{transaction.invoiceNumber || '-'}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(transaction)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTransaction ? 'Edit' : 'Record'} Income</DialogTitle>
            <DialogDescription>
              {selectedTransaction ? 'Update' : 'Add'} income transaction details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Transaction Date *</Label>
                <Input
                  type="date"
                  value={formData.transactionDate || ''}
                  onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={formData.category || ''}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="egg_sales">Egg Sales</SelectItem>
                    <SelectItem value="bird_sales">Bird Sales</SelectItem>
                    <SelectItem value="manure_sales">Manure Sales</SelectItem>
                    <SelectItem value="other">Other Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.category === 'egg_sales' && (
              <div className="space-y-2">
                <Label>Select Flock</Label>
                <Select
                  value={formData.flockId || ''}
                  onValueChange={(value) => setFormData({ ...formData, flockId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select flock" />
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
            )}

            {formData.category === 'bird_sales' && (
              <div className="space-y-2">
                <Label>Select Batch</Label>
                <Select
                  value={formData.batchId || ''}
                  onValueChange={(value) => setFormData({ ...formData, batchId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select batch" />
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

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <NumberInput
                  placeholder="e.g., 1000"
                  value={formData.quantity || ''}
                  onChange={(value) => setFormData({ ...formData, quantity: value })}
                  allowDecimals={true}
                  maxDecimals={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Unit Price (₦)</Label>
                <NumberInput
                  placeholder="e.g., 50"
                  value={formData.unitPrice || ''}
                  onChange={(value) => setFormData({ ...formData, unitPrice: value })}
                  allowDecimals={true}
                  maxDecimals={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Total Amount (₦) *</Label>
                <Input
                  type="text"
                  placeholder="Auto-calculated"
                  value={formatCurrency(formData.amount || 0, '₦', 2)}
                  readOnly
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer Name</Label>
                <Input
                  placeholder="e.g., ABC Stores"
                  value={formData.customerName || ''}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Customer Phone</Label>
                <Input
                  placeholder="e.g., 08012345678"
                  value={formData.customerPhone || ''}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Payment Method *</Label>
                <Select
                  value={formData.paymentMethod || ''}
                  onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment Status *</Label>
                <Select
                  value={formData.paymentStatus || ''}
                  onValueChange={(value) => setFormData({ ...formData, paymentStatus: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Invoice Number</Label>
                <Input
                  placeholder="e.g., INV-001"
                  value={formData.invoiceNumber || ''}
                  onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Brief description..."
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes..."
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateOrUpdate}>
              {selectedTransaction ? 'Update' : 'Record'} Income
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this income transaction? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
