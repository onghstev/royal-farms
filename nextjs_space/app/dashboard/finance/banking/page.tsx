'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatCard } from '@/components/ui/stat-card';
import {
  Banknote,
  Building2,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  DollarSign,
  ArrowDownToLine,
  Wallet,
  TrendingUp,
  TrendingDown,
  User,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

interface BankingRecord {
  id: string;
  recordDate: string;
  customerName: string | null;
  description: string | null;
  totalCashSales: number;
  totalBanked: number;
  variance: number;
  bankName: string | null;
  accountNumber: string | null;
  depositSlipNumber: string | null;
  depositedBy: string | null;
  cashOnHand: number | null;
  status: string;
  notes: string | null;
  recordedBy: string;
  verifiedBy: string | null;
  verifiedAt: string | null;
  createdAt: string;
}

interface Summary {
  totalCashSales: number;
  totalBanked: number;
  totalVariance: number;
  totalCashOnHand: number;
  recordCount: number;
  pendingCount: number;
  bankedCount: number;
  verifiedCount: number;
}

export default function BankingRecordsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [records, setRecords] = useState<BankingRecord[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BankingRecord | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    recordDate: new Date().toISOString().split('T')[0],
    customerName: '',
    description: '',
    totalCashSales: '',
    totalBanked: '',
    bankName: '',
    accountNumber: '',
    depositSlipNumber: '',
    depositedBy: '',
    cashOnHand: '',
    status: 'pending',
    notes: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchRecords();
    }
  }, [status, statusFilter]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      let url = '/api/finance/banking';
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (params.toString()) url += '?' + params.toString();

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch records');
      
      const data = await response.json();
      setRecords(data.records || []);
      setSummary(data.summary || null);
    } catch (error: any) {
      console.error('Error fetching banking records:', error);
      toast.error('Failed to load banking records');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = '/api/finance/banking';
      const method = editingRecord ? 'PUT' : 'POST';
      const body = editingRecord
        ? { id: editingRecord.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save record');
      }

      toast.success(editingRecord ? 'Banking record updated successfully' : 'Banking record created successfully');
      setShowDialog(false);
      resetForm();
      fetchRecords();
    } catch (error: any) {
      console.error('Error saving banking record:', error);
      toast.error(error.message || 'Failed to save banking record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (record: BankingRecord) => {
    setEditingRecord(record);
    setFormData({
      recordDate: record.recordDate.split('T')[0],
      customerName: record.customerName || '',
      description: record.description || '',
      totalCashSales: record.totalCashSales.toString(),
      totalBanked: record.totalBanked.toString(),
      bankName: record.bankName || '',
      accountNumber: record.accountNumber || '',
      depositSlipNumber: record.depositSlipNumber || '',
      depositedBy: record.depositedBy || '',
      cashOnHand: record.cashOnHand?.toString() || '',
      status: record.status,
      notes: record.notes || '',
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banking record?')) return;

    try {
      const response = await fetch(`/api/finance/banking?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete record');

      toast.success('Banking record deleted successfully');
      fetchRecords();
    } catch (error: any) {
      console.error('Error deleting banking record:', error);
      toast.error('Failed to delete banking record');
    }
  };

  const handleVerify = async (record: BankingRecord) => {
    try {
      const response = await fetch('/api/finance/banking', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: record.id, status: 'verified' }),
      });

      if (!response.ok) throw new Error('Failed to verify record');

      toast.success('Banking record verified successfully');
      fetchRecords();
    } catch (error: any) {
      console.error('Error verifying banking record:', error);
      toast.error('Failed to verify banking record');
    }
  };

  const resetForm = () => {
    setEditingRecord(null);
    setFormData({
      recordDate: new Date().toISOString().split('T')[0],
      customerName: '',
      description: '',
      totalCashSales: '',
      totalBanked: '',
      bankName: '',
      accountNumber: '',
      depositSlipNumber: '',
      depositedBy: '',
      cashOnHand: '',
      status: 'pending',
      notes: '',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
            <CheckCircle className="h-3 w-3 mr-1" />Verified
          </Badge>
        );
      case 'banked':
        return (
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0">
            <Building2 className="h-3 w-3 mr-1" />Banked
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">
            <Clock className="h-3 w-3 mr-1" />Pending
          </Badge>
        );
    }
  };

  // Calculate variance automatically when amounts change
  const calculatedVariance = (parseFloat(formData.totalCashSales) || 0) - (parseFloat(formData.totalBanked) || 0);

  // Table columns
  const columns: Column<BankingRecord>[] = [
    {
      key: 'recordDate',
      header: 'Date',
      sortable: true,
      cell: (row) => (
        <span className="font-medium text-foreground">
          {new Date(row.recordDate).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'customerName',
      header: 'Customer',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <span className="font-medium">{row.customerName || '-'}</span>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      cell: (row) => (
        <span className="text-muted-foreground max-w-[200px] truncate block" title={row.description || ''}>
          {row.description || '-'}
        </span>
      ),
    },
    {
      key: 'totalCashSales',
      header: 'Cash Sales',
      sortable: true,
      cell: (row) => (
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
          {formatCurrency(row.totalCashSales)}
        </span>
      ),
    },
    {
      key: 'totalBanked',
      header: 'Banked',
      sortable: true,
      cell: (row) => (
        <span className="font-semibold text-blue-600 dark:text-blue-400">
          {formatCurrency(row.totalBanked)}
        </span>
      ),
    },
    {
      key: 'variance',
      header: 'Variance',
      sortable: true,
      cell: (row) => (
        <span className={`font-semibold ${row.variance >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
          {row.variance >= 0 ? '+' : ''}{formatCurrency(row.variance)}
        </span>
      ),
    },
    {
      key: 'bankName',
      header: 'Bank',
      cell: (row) => row.bankName || '-',
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => getStatusBadge(row.status),
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (row) => (
        <div className="flex justify-end gap-1">
          {row.status !== 'verified' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVerify(row)}
              title="Verify"
              className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(row)}
            title="Edit"
            className="h-8 w-8 p-0 hover:bg-blue-50 text-blue-600"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.id)}
            title="Delete"
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto" />
            <Banknote className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-4 text-muted-foreground font-medium">Loading Banking Records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
            Daily Banking Records
          </h1>
          <p className="text-muted-foreground mt-1">
            Track cash sales, bank deposits, and variances
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchRecords}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={() => { resetForm(); setShowDialog(true); }}
            className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg shadow-emerald-500/25 gap-2"
          >
            <Plus className="h-4 w-4" />
            New Record
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Cash Sales"
            value={formatCurrency(summary.totalCashSales)}
            subtitle={`${summary.recordCount} records`}
            icon={DollarSign}
            variant="success"
          />
          <StatCard
            title="Total Banked"
            value={formatCurrency(summary.totalBanked)}
            subtitle={`${summary.bankedCount + summary.verifiedCount} deposited`}
            icon={Building2}
            variant="info"
          />
          <StatCard
            title="Total Variance"
            value={formatCurrency(summary.totalVariance)}
            subtitle={summary.totalVariance >= 0 ? 'Cash on hand' : 'Over-banked'}
            icon={summary.totalVariance >= 0 ? TrendingUp : TrendingDown}
            variant={summary.totalVariance >= 0 ? 'warning' : 'danger'}
          />
          <StatCard
            title="Pending Verification"
            value={summary.pendingCount}
            subtitle={`${summary.verifiedCount} verified`}
            icon={Clock}
            variant="purple"
          />
        </div>
      )}

      {/* Filter Controls */}
      <Card className="border-border/50">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Label className="text-sm font-medium whitespace-nowrap">Filter by Status:</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Records</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="banked">Banked</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="border-b border-border/50 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center">
              <Banknote className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Banking Records</CardTitle>
              <CardDescription>View and manage all daily banking transactions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {records.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Banknote className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Banking Records Found</h3>
              <p className="text-muted-foreground mb-6">
                Start tracking your daily cash sales and bank deposits
              </p>
              <Button
                onClick={() => { resetForm(); setShowDialog(true); }}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white gap-2"
              >
                <Plus className="h-4 w-4" /> Create First Record
              </Button>
            </div>
          ) : (
            <DataTable
              data={records}
              columns={columns}
              searchPlaceholder="Search by customer, description, bank..."
              searchKeys={['customerName', 'description', 'bankName', 'depositSlipNumber', 'depositedBy']}
              pageSize={10}
              emptyMessage="No records match your search."
            />
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center">
                <Banknote className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl">
                  {editingRecord ? 'Edit Banking Record' : 'New Banking Record'}
                </DialogTitle>
                <DialogDescription>
                  {editingRecord ? 'Update the banking record details below.' : 'Enter the cash sales and banking details.'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recordDate">Record Date *</Label>
                  <Input
                    id="recordDate"
                    type="date"
                    value={formData.recordDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, recordDate: e.target.value }))}
                    required
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer / Payer Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="customerName"
                      placeholder="e.g., John Doe"
                      value={formData.customerName}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                      className="pl-10 bg-background"
                    />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="description"
                      placeholder="e.g., Payment for 50 crates of eggs"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="pl-10 bg-background"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Details Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Financial Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalCashSales">Total Cash Sales (₦) *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
                    <Input
                      id="totalCashSales"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.totalCashSales}
                      onChange={(e) => setFormData(prev => ({ ...prev, totalCashSales: e.target.value }))}
                      required
                      className="pl-10 bg-background"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalBanked">Total Amount Banked (₦) *</Label>
                  <div className="relative">
                    <ArrowDownToLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600" />
                    <Input
                      id="totalBanked"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.totalBanked}
                      onChange={(e) => setFormData(prev => ({ ...prev, totalBanked: e.target.value }))}
                      required
                      className="pl-10 bg-background"
                    />
                  </div>
                </div>
              </div>

              {/* Variance Display */}
              <div className={`p-4 rounded-lg border-2 ${calculatedVariance >= 0 ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Wallet className={`h-5 w-5 ${calculatedVariance >= 0 ? 'text-amber-600' : 'text-red-600'}`} />
                    <span className="text-sm font-medium">Calculated Variance:</span>
                  </div>
                  <span className={`text-xl font-bold ${calculatedVariance >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                    {calculatedVariance >= 0 ? '+' : ''}{formatCurrency(calculatedVariance)}
                  </span>
                </div>
                {calculatedVariance !== 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {calculatedVariance > 0 ? '💵 Cash not yet deposited to bank' : '⚠️ More banked than cash sales (please verify figures)'}
                  </p>
                )}
              </div>
            </div>

            {/* Banking Details Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Banking Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="bankName"
                      placeholder="e.g., First Bank"
                      value={formData.bankName}
                      onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                      className="pl-10 bg-background"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    placeholder="e.g., 0123456789"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="depositSlipNumber">Deposit Slip Number</Label>
                  <Input
                    id="depositSlipNumber"
                    placeholder="e.g., DEP-001"
                    value={formData.depositSlipNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, depositSlipNumber: e.target.value }))}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="depositedBy">Deposited By</Label>
                  <Input
                    id="depositedBy"
                    placeholder="e.g., Jane Smith"
                    value={formData.depositedBy}
                    onChange={(e) => setFormData(prev => ({ ...prev, depositedBy: e.target.value }))}
                    className="bg-background"
                  />
                </div>
              </div>
            </div>

            {/* Status & Notes Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Status & Notes</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-amber-500" />
                          Pending
                        </div>
                      </SelectItem>
                      <SelectItem value="banked">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-blue-500" />
                          Banked
                        </div>
                      </SelectItem>
                      <SelectItem value="verified">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                          Verified
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cashOnHand">Cash On Hand (₦)</Label>
                  <Input
                    id="cashOnHand"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.cashOnHand}
                    onChange={(e) => setFormData(prev => ({ ...prev, cashOnHand: e.target.value }))}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any additional notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="bg-background resize-none"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white min-w-[120px]"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </div>
                ) : (
                  editingRecord ? 'Update Record' : 'Create Record'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
