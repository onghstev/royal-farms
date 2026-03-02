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
import { DataTable, Column } from '@/components/ui/data-table';
import { StatCard } from '@/components/ui/stat-card';
import { Plus, Edit2, Trash2, DollarSign, TrendingUp, FileText, CheckCircle, Clock, AlertTriangle, RefreshCw, User, Phone, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';

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

const categoryLabels: Record<string, string> = {
  egg_sales: 'Egg Sales',
  bird_sales: 'Bird Sales',
  manure_sales: 'Manure Sales',
  feed_sales: 'Feed Sales',
  other: 'Other'
};

const categoryColors: Record<string, string> = {
  egg_sales: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  bird_sales: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  manure_sales: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  feed_sales: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
};

export default function IncomeManagementPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [transactions, setTransactions] = useState<IncomeTransaction[]>([]);
  const [flocks, setFlocks] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<IncomeTransaction | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [summary, setSummary] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') fetchData();
  }, [status, categoryFilter, paymentStatusFilter]);

  useEffect(() => {
    if (formData.quantity && formData.unitPrice) {
      const qty = typeof formData.quantity === 'number' ? formData.quantity : parseFloat(formData.quantity) || 0;
      const price = typeof formData.unitPrice === 'number' ? formData.unitPrice : parseFloat(formData.unitPrice) || 0;
      setFormData((prev: any) => ({ ...prev, amount: qty * price }));
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
      if (flocksRes.ok) setFlocks((await flocksRes.json()).flocks || []);
      if (batchesRes.ok) setBatches((await batchesRes.json()).batches || []);
    } catch (error: any) {
      toast.error('Failed to load income data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async () => {
    try {
      setSubmitting(true);
      const method = selectedTransaction ? 'PUT' : 'POST';
      const body = selectedTransaction ? { id: selectedTransaction.id, ...formData } : formData;
      const response = await fetch('/api/finance/income', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Operation failed');
      toast.success(selectedTransaction ? 'Income updated successfully' : 'Income recorded successfully');
      setIsDialogOpen(false);
      setSelectedTransaction(null);
      setFormData({});
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTransaction) return;
    try {
      const response = await fetch(`/api/finance/income?id=${selectedTransaction.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      toast.success('Income deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedTransaction(null);
      fetchData();
    } catch (error: any) {
      toast.error('Failed to delete income');
    }
  };

  const openCreateDialog = () => {
    setSelectedTransaction(null);
    setFormData({
      transactionDate: new Date().toISOString().split('T')[0],
      category: 'egg_sales',
      paymentMethod: 'cash',
      paymentStatus: 'received'
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (transaction: IncomeTransaction) => {
    setSelectedTransaction(transaction);
    setFormData({
      transactionDate: transaction.transactionDate?.split('T')[0] || '',
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

  const getStatusBadge = (status: string) => {
    if (status === 'received') return <Badge className="bg-emerald-100 text-emerald-700 border-0"><CheckCircle className="h-3 w-3 mr-1" />Received</Badge>;
    return <Badge className="bg-amber-100 text-amber-700 border-0"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
  };

  const columns: Column<IncomeTransaction>[] = [
    {
      key: 'transactionDate',
      header: 'Date',
      sortable: true,
      cell: (row) => <span className="font-medium">{row.transactionDate ? format(new Date(row.transactionDate), 'dd MMM yyyy') : '-'}</span>
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      cell: (row) => <Badge className={`${categoryColors[row.category] || categoryColors.other} border-0`}>{categoryLabels[row.category] || row.category}</Badge>
    },
    {
      key: 'description',
      header: 'Description',
      cell: (row) => (
        <div className="max-w-[200px]">
          <p className="truncate font-medium">{row.description || '-'}</p>
          {row.customerName && <p className="text-xs text-muted-foreground truncate">{row.customerName}</p>}
        </div>
      )
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      cell: (row) => <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(row.amount)}</span>
    },
    {
      key: 'paymentMethod',
      header: 'Payment',
      cell: (row) => <span className="capitalize">{row.paymentMethod?.replace('_', ' ')}</span>
    },
    {
      key: 'paymentStatus',
      header: 'Status',
      cell: (row) => getStatusBadge(row.paymentStatus)
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEditDialog(row)} className="h-8 w-8 p-0 hover:bg-blue-50 text-blue-600"><Edit2 className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => { setSelectedTransaction(row); setIsDeleteDialogOpen(true); }} className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
        </div>
      )
    }
  ];

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto" />
            <TrendingUp className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-4 text-muted-foreground font-medium">Loading Income...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Income Management</h1>
          <p className="text-muted-foreground mt-1">Track and manage all farm revenue</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchData} className="gap-2"><RefreshCw className="h-4 w-4" />Refresh</Button>
          <Button onClick={openCreateDialog} className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg shadow-emerald-500/25 gap-2">
            <Plus className="h-4 w-4" />New Income
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Income" value={formatCurrency(summary.totalIncome || 0)} subtitle={`${transactions.length} transactions`} icon={TrendingUp} variant="success" />
        <StatCard title="Received" value={formatCurrency(summary.receivedTotal || 0)} subtitle={`${summary.receivedCount || 0} transactions`} icon={CheckCircle} variant="info" />
        <StatCard title="Pending" value={formatCurrency(summary.pendingTotal || 0)} subtitle={`${summary.pendingCount || 0} transactions`} icon={Clock} variant="warning" />
        <StatCard title="This Month" value={formatCurrency(summary.thisMonthTotal || summary.totalIncome || 0)} subtitle="Current period" icon={FileText} variant="purple" />
      </div>

      <Card className="border-border/50">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Label className="text-sm font-medium whitespace-nowrap">Category:</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(categoryLabels).map(([key, label]) => (<SelectItem key={key} value={key}>{label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Label className="text-sm font-medium whitespace-nowrap">Status:</Label>
              <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="border-b border-border/50 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Income Transactions</CardTitle>
              <CardDescription>View and manage all income records</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <DataTable data={transactions} columns={columns} searchPlaceholder="Search by customer, invoice, description..." searchKeys={['customerName', 'invoiceNumber', 'description', 'category']} pageSize={10} emptyMessage="No income transactions found." />
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl">{selectedTransaction ? 'Edit Income' : 'New Income'}</DialogTitle>
                <DialogDescription>Enter the income transaction details</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Date *</Label><Input type="date" value={formData.transactionDate || ''} onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })} className="bg-background" /></div>
                <div className="space-y-2"><Label>Category *</Label><Select value={formData.category || ''} onValueChange={(v) => setFormData({ ...formData, category: v })}><SelectTrigger className="bg-background"><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{Object.entries(categoryLabels).map(([key, label]) => (<SelectItem key={key} value={key}>{label}</SelectItem>))}</SelectContent></Select></div>
                <div className="space-y-2 md:col-span-2"><Label>Description</Label><Input placeholder="Brief description" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="bg-background" /></div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Financial Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Quantity</Label><Input type="number" placeholder="0" value={formData.quantity || ''} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} className="bg-background" /></div>
                <div className="space-y-2"><Label>Unit Price (₦)</Label><Input type="number" step="0.01" placeholder="0.00" value={formData.unitPrice || ''} onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })} className="bg-background" /></div>
                <div className="space-y-2"><Label>Total Amount (₦) *</Label><div className="relative"><DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" /><Input type="number" step="0.01" placeholder="0.00" value={formData.amount || ''} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="pl-10 bg-background font-semibold" /></div></div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Customer Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Customer Name</Label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Customer name" value={formData.customerName || ''} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} className="pl-10 bg-background" /></div></div>
                <div className="space-y-2"><Label>Customer Phone</Label><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Phone number" value={formData.customerPhone || ''} onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })} className="pl-10 bg-background" /></div></div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Payment Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Payment Method</Label><Select value={formData.paymentMethod || ''} onValueChange={(v) => setFormData({ ...formData, paymentMethod: v })}><SelectTrigger className="bg-background"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="cheque">Cheque</SelectItem><SelectItem value="mobile_money">Mobile Money</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Payment Status</Label><Select value={formData.paymentStatus || ''} onValueChange={(v) => setFormData({ ...formData, paymentStatus: v })}><SelectTrigger className="bg-background"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="received">Received</SelectItem><SelectItem value="pending">Pending</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Invoice Number</Label><div className="relative"><Receipt className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Invoice #" value={formData.invoiceNumber || ''} onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })} className="pl-10 bg-background" /></div></div>
              </div>
            </div>

            <div className="space-y-2"><Label>Notes</Label><Textarea placeholder="Additional notes..." value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} className="bg-background resize-none" /></div>
          </div>

          <DialogFooter className="pt-4 border-t border-border/50">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleCreateOrUpdate} disabled={submitting} className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white min-w-[120px]">
              {submitting ? <div className="flex items-center gap-2"><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</div> : (selectedTransaction ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-500" />Delete Income</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this income transaction? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
