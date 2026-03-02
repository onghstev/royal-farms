'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatCard } from '@/components/ui/stat-card';
import { Plus, TrendingDown, Edit2, Trash2, Skull, AlertTriangle, Calendar, RefreshCw, Activity, Heart } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { format } from 'date-fns';

interface Flock { id: string; flockName: string; }
interface Batch { id: string; batchName: string; }
interface MortalityRecord {
  id: string;
  recordType: string;
  mortalityDate: string;
  mortalityCount: number;
  cause: string;
  mortalityRate: number | null;
  flock: { flockName: string } | null;
  batch: { batchName: string } | null;
  recorder: { firstName: string; lastName: string };
}

const causeColors: Record<string, string> = {
  Disease: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  Predator: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  Heat_Stress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Cold_Stress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Injury: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  Culling: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  Unknown: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400'
};

export default function MortalityPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [records, setRecords] = useState<MortalityRecord[]>([]);
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MortalityRecord | null>(null);

  const [formData, setFormData] = useState({
    recordType: 'flock',
    flockId: '',
    batchId: '',
    mortalityDate: new Date().toISOString().split('T')[0],
    mortalityCount: '',
    cause: 'Unknown',
    notes: '',
  });

  const [editFormData, setEditFormData] = useState({
    id: '',
    mortalityDate: '',
    mortalityCount: '',
    cause: '',
    notes: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    fetchRecords();
    fetchFlocks();
    fetchBatches();
  }, []);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/mortality');
      if (response.ok) setRecords(await response.json());
    } catch (error) {
      toast.error('Failed to fetch records');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFlocks = async () => {
    try {
      const response = await fetch('/api/flocks');
      if (response.ok) {
        const data = await response.json();
        const activeFlocks = data.filter((f: any) => f.status === 'active');
        setFlocks(activeFlocks);
        if (activeFlocks.length > 0 && !formData.flockId) {
          setFormData(prev => ({ ...prev, flockId: activeFlocks[0].id }));
        }
      }
    } catch (error) {
      console.error('Error fetching flocks:', error);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/batches');
      if (response.ok) {
        const data = await response.json();
        const activeBatches = (data.batches || []).filter((b: any) => b.status === 'active');
        setBatches(activeBatches);
        if (activeBatches.length > 0 && !formData.batchId) {
          setFormData(prev => ({ ...prev, batchId: activeBatches[0].id }));
        }
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.mortalityCount || parseInt(formData.mortalityCount) <= 0) {
      toast.error('Please enter a valid mortality count');
      return;
    }
    if (formData.recordType === 'flock' && !formData.flockId) {
      toast.error('Please select a flock');
      return;
    }
    if (formData.recordType === 'batch' && !formData.batchId) {
      toast.error('Please select a batch');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/mortality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        toast.success('Mortality record added successfully');
        setIsDialogOpen(false);
        setFormData({ recordType: 'flock', flockId: flocks[0]?.id || '', batchId: batches[0]?.id || '', mortalityDate: new Date().toISOString().split('T')[0], mortalityCount: '', cause: 'Unknown', notes: '' });
        fetchRecords();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add record');
      }
    } catch (error) {
      toast.error('Failed to add record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editFormData.mortalityCount || parseInt(editFormData.mortalityCount) <= 0) {
      toast.error('Please enter a valid mortality count');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/mortality', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      if (response.ok) {
        toast.success('Mortality record updated successfully');
        setIsEditDialogOpen(false);
        setSelectedRecord(null);
        fetchRecords();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update record');
      }
    } catch (error) {
      toast.error('Failed to update record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRecord) return;
    try {
      const response = await fetch(`/api/mortality?id=${selectedRecord.id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Mortality record deleted successfully');
        setIsDeleteDialogOpen(false);
        setSelectedRecord(null);
        fetchRecords();
      } else {
        toast.error('Failed to delete record');
      }
    } catch (error) {
      toast.error('Failed to delete record');
    }
  };

  const openEditDialog = (record: MortalityRecord) => {
    setSelectedRecord(record);
    setEditFormData({
      id: record.id,
      mortalityDate: record.mortalityDate.split('T')[0],
      mortalityCount: record.mortalityCount.toString(),
      cause: record.cause,
      notes: '',
    });
    setIsEditDialogOpen(true);
  };

  const totalMortality = records.reduce((sum: number, r: any) => sum + (r.mortalityCount || 0), 0);
  const avgMortalityRate = records.length > 0 ? records.reduce((sum: number, r: any) => sum + (r.mortalityRate || 0), 0) / records.length : 0;
  const thisMonthRecords = records.filter((r: any) => new Date(r.mortalityDate).getMonth() === new Date().getMonth());
  const thisMonthMortality = thisMonthRecords.reduce((sum: number, r: any) => sum + (r.mortalityCount || 0), 0);

  const columns: Column<MortalityRecord>[] = [
    {
      key: 'mortalityDate',
      header: 'Date',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <Calendar className="h-4 w-4 text-red-600 dark:text-red-400" />
          </div>
          <span className="font-medium">{format(new Date(row.mortalityDate), 'dd MMM yyyy')}</span>
        </div>
      )
    },
    {
      key: 'source',
      header: 'Flock/Batch',
      cell: (row) => (
        <div>
          <p className="font-medium">{row.flock?.flockName || row.batch?.batchName || '-'}</p>
          <p className="text-xs text-muted-foreground capitalize">{row.recordType}</p>
        </div>
      )
    },
    {
      key: 'mortalityCount',
      header: 'Count',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Skull className="h-4 w-4 text-red-500" />
          <span className="font-bold text-red-600 dark:text-red-400">{formatNumber(row.mortalityCount)}</span>
        </div>
      )
    },
    {
      key: 'cause',
      header: 'Cause',
      sortable: true,
      cell: (row) => <Badge className={`${causeColors[row.cause] || causeColors.Unknown} border-0`}>{row.cause.replace('_', ' ')}</Badge>
    },
    {
      key: 'mortalityRate',
      header: 'Rate',
      sortable: true,
      cell: (row) => (
        <span className={`font-medium ${(row.mortalityRate || 0) > 5 ? 'text-red-600' : 'text-amber-600'}`}>
          {row.mortalityRate?.toFixed(2) || '0.00'}%
        </span>
      )
    },
    {
      key: 'recorder',
      header: 'Recorded By',
      cell: (row) => <span className="text-muted-foreground">{row.recorder?.firstName} {row.recorder?.lastName}</span>
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEditDialog(row)} className="h-8 w-8 p-0 hover:bg-blue-50 text-blue-600"><Edit2 className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => { setSelectedRecord(row); setIsDeleteDialogOpen(true); }} className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
        </div>
      )
    }
  ];

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto" />
            <Skull className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-4 text-muted-foreground font-medium">Loading Mortality Records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">Mortality Records</h1>
          <p className="text-muted-foreground mt-1">Track and analyze bird mortality across flocks and batches</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchRecords} className="gap-2"><RefreshCw className="h-4 w-4" />Refresh</Button>
          <Button onClick={() => setIsDialogOpen(true)} className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg shadow-red-500/25 gap-2">
            <Plus className="h-4 w-4" />Record Mortality
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Mortality" value={formatNumber(totalMortality)} subtitle={`${records.length} records`} icon={Skull} variant="danger" />
        <StatCard title="This Month" value={formatNumber(thisMonthMortality)} subtitle={`${thisMonthRecords.length} records`} icon={Calendar} variant="warning" />
        <StatCard title="Avg Mortality Rate" value={`${avgMortalityRate.toFixed(2)}%`} subtitle="Across all records" icon={Activity} variant="info" />
        <StatCard title="Health Status" value={avgMortalityRate < 3 ? 'Good' : avgMortalityRate < 5 ? 'Monitor' : 'Critical'} subtitle={avgMortalityRate < 3 ? 'Within normal range' : 'Needs attention'} icon={Heart} variant={avgMortalityRate < 3 ? 'success' : avgMortalityRate < 5 ? 'warning' : 'danger'} />
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="border-b border-border/50 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
              <Skull className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Mortality Records</CardTitle>
              <CardDescription>View and manage all mortality entries</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <DataTable data={records} columns={columns} searchPlaceholder="Search by flock, batch, cause..." searchKeys={['cause']} pageSize={10} emptyMessage="No mortality records found." />
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader className="pb-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                <Skull className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl">Record Mortality</DialogTitle>
                <DialogDescription>Enter mortality details for tracking</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Record Type</Label>
                <Select value={formData.recordType} onValueChange={(v) => setFormData(prev => ({ ...prev, recordType: v }))}>
                  <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="flock">Flock</SelectItem><SelectItem value="batch">Batch</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input type="date" value={formData.mortalityDate} onChange={(e) => setFormData(prev => ({ ...prev, mortalityDate: e.target.value }))} className="bg-background" />
              </div>
            </div>
            {formData.recordType === 'flock' && (
              <div className="space-y-2">
                <Label>Select Flock *</Label>
                <Select value={formData.flockId} onValueChange={(v) => setFormData(prev => ({ ...prev, flockId: v }))}>
                  <SelectTrigger className="bg-background"><SelectValue placeholder="Select flock" /></SelectTrigger>
                  <SelectContent>{flocks.map(f => <SelectItem key={f.id} value={f.id}>{f.flockName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            {formData.recordType === 'batch' && (
              <div className="space-y-2">
                <Label>Select Batch *</Label>
                <Select value={formData.batchId} onValueChange={(v) => setFormData(prev => ({ ...prev, batchId: v }))}>
                  <SelectTrigger className="bg-background"><SelectValue placeholder="Select batch" /></SelectTrigger>
                  <SelectContent>{batches.map(b => <SelectItem key={b.id} value={b.id}>{b.batchName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mortality Count *</Label>
                <Input type="number" min="1" placeholder="Enter count" value={formData.mortalityCount} onChange={(e) => setFormData(prev => ({ ...prev, mortalityCount: e.target.value }))} className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Cause</Label>
                <Select value={formData.cause} onValueChange={(v) => setFormData(prev => ({ ...prev, cause: v }))}>
                  <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Disease">Disease</SelectItem>
                    <SelectItem value="Predator">Predator Attack</SelectItem>
                    <SelectItem value="Heat_Stress">Heat Stress</SelectItem>
                    <SelectItem value="Cold_Stress">Cold Stress</SelectItem>
                    <SelectItem value="Injury">Injury</SelectItem>
                    <SelectItem value="Culling">Culling</SelectItem>
                    <SelectItem value="Unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Additional notes..." value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} rows={3} className="bg-background resize-none" />
            </div>
          </div>
          <DialogFooter className="pt-4 border-t border-border/50">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-gradient-to-r from-red-600 to-rose-600 text-white min-w-[120px]">
              {isSubmitting ? <div className="flex items-center gap-2"><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</div> : 'Save Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader className="pb-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Edit2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl">Edit Mortality Record</DialogTitle>
                <DialogDescription>Update the mortality details</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input type="date" value={editFormData.mortalityDate} onChange={(e) => setEditFormData(prev => ({ ...prev, mortalityDate: e.target.value }))} className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Count *</Label>
                <Input type="number" min="1" value={editFormData.mortalityCount} onChange={(e) => setEditFormData(prev => ({ ...prev, mortalityCount: e.target.value }))} className="bg-background" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cause</Label>
              <Select value={editFormData.cause} onValueChange={(v) => setEditFormData(prev => ({ ...prev, cause: v }))}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Disease">Disease</SelectItem>
                  <SelectItem value="Predator">Predator Attack</SelectItem>
                  <SelectItem value="Heat_Stress">Heat Stress</SelectItem>
                  <SelectItem value="Cold_Stress">Cold Stress</SelectItem>
                  <SelectItem value="Injury">Injury</SelectItem>
                  <SelectItem value="Culling">Culling</SelectItem>
                  <SelectItem value="Unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Additional notes..." value={editFormData.notes} onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))} rows={3} className="bg-background resize-none" />
            </div>
          </div>
          <DialogFooter className="pt-4 border-t border-border/50">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleEdit} disabled={isSubmitting} className="bg-gradient-to-r from-blue-600 to-blue-700 text-white min-w-[120px]">
              {isSubmitting ? <div className="flex items-center gap-2"><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</div> : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-500" />Delete Record</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this mortality record? This action cannot be undone.</AlertDialogDescription>
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
