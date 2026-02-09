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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  Banknote,
  Building2,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  ArrowDownToLine,
  Wallet,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
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
  const [searchTerm, setSearchTerm] = useState('');
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
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
      case 'banked':
        return <Badge className="bg-blue-100 text-blue-800"><Building2 className="h-3 w-3 mr-1" />Banked</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const filteredRecords = records.filter((record: any) => {
    const matchesSearch =
      record.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.bankName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.depositSlipNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.depositedBy?.toLowerCase().includes(searchTerm.toLowerCase());
    return searchTerm ? matchesSearch : true;
  });

  // Calculate variance automatically when amounts change
  const calculatedVariance = (parseFloat(formData.totalCashSales) || 0) - (parseFloat(formData.totalBanked) || 0);

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Banking Records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Daily Banking Records</h1>
          <p className="text-gray-600 mt-1">Track cash sales and bank deposits</p>
        </div>
        <Button onClick={() => { resetForm(); setShowDialog(true); }} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" /> New Record
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" /> Total Cash Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(summary?.totalCashSales || 0)}</p>
            <p className="text-xs text-gray-500 mt-1">{summary?.recordCount || 0} records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <ArrowDownToLine className="h-4 w-4 text-blue-600" /> Total Banked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-700">{formatCurrency(summary?.totalBanked || 0)}</p>
            <p className="text-xs text-gray-500 mt-1">{summary?.bankedCount || 0} banked, {summary?.verifiedCount || 0} verified</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              {(summary?.totalVariance || 0) >= 0 ? (
                <TrendingUp className="h-4 w-4 text-orange-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              Total Variance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${(summary?.totalVariance || 0) >= 0 ? 'text-orange-700' : 'text-red-700'}`}>
              {formatCurrency(summary?.totalVariance || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Cash sales - Banked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-purple-600" /> Cash on Hand
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-700">{formatCurrency(summary?.totalCashOnHand || 0)}</p>
            <p className="text-xs text-gray-500 mt-1">{summary?.pendingCount || 0} pending deposits</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by bank, deposit slip, or person..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="banked">Banked</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Banking Records</CardTitle>
          <CardDescription>Daily cash sales and bank deposit tracking</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <Banknote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No banking records found</p>
              <Button onClick={() => { resetForm(); setShowDialog(true); }} className="mt-4" variant="outline">
                <Plus className="h-4 w-4 mr-2" /> Create First Record
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Cash Sales</TableHead>
                    <TableHead>Amount Banked</TableHead>
                    <TableHead>Variance</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record: any) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {new Date(record.recordDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{record.customerName || '-'}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={record.description || ''}>
                        {record.description || '-'}
                      </TableCell>
                      <TableCell className="text-green-700 font-semibold">
                        {formatCurrency(record.totalCashSales)}
                      </TableCell>
                      <TableCell className="text-blue-700 font-semibold">
                        {formatCurrency(record.totalBanked)}
                      </TableCell>
                      <TableCell>
                        <span className={`font-semibold ${record.variance >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
                          {formatCurrency(record.variance)}
                        </span>
                      </TableCell>
                      <TableCell>{record.bankName || '-'}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {record.status !== 'verified' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleVerify(record)}
                              title="Verify"
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(record)}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(record.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              {editingRecord ? 'Edit Banking Record' : 'New Banking Record'}
            </DialogTitle>
            <DialogDescription>
              {editingRecord ? 'Update the banking record details below.' : 'Enter the daily cash sales and banking details.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recordDate">Record Date *</Label>
                <Input
                  id="recordDate"
                  type="date"
                  value={formData.recordDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, recordDate: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerName">Customer / Payer Name</Label>
                <Input
                  id="customerName"
                  placeholder="e.g., John Doe"
                  value={formData.customerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="e.g., Payment for 50 crates of eggs"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="banked">Banked</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalCashSales">Total Cash Sales (₦) *</Label>
                <Input
                  id="totalCashSales"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.totalCashSales}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalCashSales: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalBanked">Total Amount Banked (₦) *</Label>
                <Input
                  id="totalBanked"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.totalBanked}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalBanked: e.target.value }))}
                  required
                />
              </div>

              {/* Variance Display */}
              <div className="md:col-span-2 p-4 rounded-lg bg-gray-50">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Calculated Variance:</span>
                  <span className={`text-lg font-bold ${calculatedVariance >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
                    {formatCurrency(calculatedVariance)}
                  </span>
                </div>
                {calculatedVariance !== 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {calculatedVariance > 0 ? 'Cash not yet banked' : 'More banked than cash sales (check figures)'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  placeholder="e.g., First Bank"
                  value={formData.bankName}
                  onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  placeholder="Account number"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="depositSlipNumber">Deposit Slip Number</Label>
                <Input
                  id="depositSlipNumber"
                  placeholder="Deposit slip/teller no."
                  value={formData.depositSlipNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, depositSlipNumber: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="depositedBy">Deposited By</Label>
                <Input
                  id="depositedBy"
                  placeholder="Name of depositor"
                  value={formData.depositedBy}
                  onChange={(e) => setFormData(prev => ({ ...prev, depositedBy: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cashOnHand">Cash on Hand (₦)</Label>
                <Input
                  id="cashOnHand"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Remaining cash"
                  value={formData.cashOnHand}
                  onChange={(e) => setFormData(prev => ({ ...prev, cashOnHand: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes or remarks..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-green-600 hover:bg-green-700">
                {submitting ? 'Saving...' : editingRecord ? 'Update Record' : 'Create Record'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
