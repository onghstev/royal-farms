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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Egg, Edit2, Trash2, TrendingUp, AlertTriangle, BarChart3 } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { NumberInput } from '@/components/ui/number-input';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatCard } from '@/components/ui/stat-card';

interface Flock {
  id: string;
  flockName: string;
  currentStock: number;
}

interface EggCollection {
  id: string;
  collectionDate: string;
  goodEggsCount: number;
  brokenEggsCount: number;
  totalEggsCount: number;
  productionPercentage: number | null;
  flock: {
    flockName: string;
  };
  recorder: {
    firstName: string;
    lastName: string;
  };
  // Flattened fields for search
  flockName?: string;
  recorderName?: string;
}

export default function EggCollectionPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [collections, setCollections] = useState<EggCollection[]>([]);
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<EggCollection | null>(null);

  const [formData, setFormData] = useState({
    flockId: '',
    collectionDate: new Date().toISOString().split('T')[0],
    goodEggsCount: '',
    brokenEggsCount: '',
    collectionTime: '',
    notes: '',
  });

  const [editFormData, setEditFormData] = useState({
    id: '',
    flockId: '',
    collectionDate: '',
    goodEggsCount: '',
    brokenEggsCount: '',
    collectionTime: '',
    notes: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchCollections();
    fetchFlocks();
  }, []);

  const fetchCollections = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/egg-collection');
      if (response.ok) {
        const data = await response.json();
        // Flatten nested fields for search
        const flattenedData = data.map((item: any) => ({
          ...item,
          flockName: item.flock?.flockName || '',
          recorderName: `${item.recorder?.firstName || ''} ${item.recorder?.lastName || ''}`.trim(),
        }));
        setCollections(flattenedData);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
      toast.error('Failed to fetch collections');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/egg-collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Egg collection recorded successfully');
        setIsDialogOpen(false);
        fetchCollections();
        setFormData({
          flockId: flocks[0]?.id || '',
          collectionDate: new Date().toISOString().split('T')[0],
          goodEggsCount: '',
          brokenEggsCount: '',
          collectionTime: '',
          notes: '',
        });
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to record collection');
      }
    } catch (error) {
      console.error('Error recording collection:', error);
      toast.error('Failed to record collection');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (record: EggCollection) => {
    setSelectedRecord(record);
    setEditFormData({
      id: record.id,
      flockId: '', // We'll need to find the flockId from the flock name
      collectionDate: new Date(record.collectionDate).toISOString().split('T')[0],
      goodEggsCount: record.goodEggsCount.toString(),
      brokenEggsCount: record.brokenEggsCount.toString(),
      collectionTime: '',
      notes: '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/egg-collection', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        toast.success('Record updated successfully');
        setIsEditDialogOpen(false);
        setSelectedRecord(null);
        fetchCollections();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update record');
      }
    } catch (error) {
      console.error('Error updating record:', error);
      toast.error('Failed to update record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRecord) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/egg-collection?id=${selectedRecord.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Record deleted successfully');
        setIsDeleteDialogOpen(false);
        setSelectedRecord(null);
        fetchCollections();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete record');
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Failed to delete record');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  // Calculate summary statistics
  const totalEggs = collections.reduce((sum: number, c: any) => sum + (c.totalEggsCount || 0), 0);
  const totalGoodEggs = collections.reduce((sum: number, c: any) => sum + (c.goodEggsCount || 0), 0);
  const totalBrokenEggs = collections.reduce((sum: number, c: any) => sum + (c.brokenEggsCount || 0), 0);
  const avgProduction = collections.length > 0 
    ? collections.reduce((sum: number, c: any) => sum + (c.productionPercentage || 0), 0) / collections.filter((c: any) => c.productionPercentage).length 
    : 0;

  // DataTable columns
  const columns: Column<EggCollection>[] = [
    {
      key: 'collectionDate',
      header: 'Date',
      sortable: true,
      cell: (row) => new Date(row.collectionDate).toLocaleDateString('en-NG'),
    },
    {
      key: 'flockName',
      header: 'Flock',
      sortable: true,
      cell: (row) => (
        <span className="font-medium text-emerald-700">{row.flock?.flockName || '-'}</span>
      ),
    },
    {
      key: 'goodEggsCount',
      header: 'Good Eggs',
      sortable: true,
      cell: (row) => (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          {row.goodEggsCount.toLocaleString()}
        </Badge>
      ),
    },
    {
      key: 'brokenEggsCount',
      header: 'Broken',
      sortable: true,
      cell: (row) => (
        <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
          {row.brokenEggsCount.toLocaleString()}
        </Badge>
      ),
    },
    {
      key: 'totalEggsCount',
      header: 'Total',
      sortable: true,
      cell: (row) => (
        <span className="font-semibold">{row.totalEggsCount.toLocaleString()}</span>
      ),
    },
    {
      key: 'productionPercentage',
      header: 'Production %',
      sortable: true,
      cell: (row) => {
        const pct = row.productionPercentage;
        if (!pct) return <span className="text-muted-foreground">-</span>;
        const colorClass = pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-amber-600' : 'text-red-600';
        return <span className={`font-medium ${colorClass}`}>{pct.toFixed(1)}%</span>;
      },
    },
    {
      key: 'recorderName',
      header: 'Recorded By',
      sortable: true,
      cell: (row) => row.recorder ? `${row.recorder.firstName} ${row.recorder.lastName}` : '-',
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(row)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => {
              setSelectedRecord(row);
              setIsDeleteDialogOpen(true);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
              <Egg className="w-7 h-7 text-white" />
            </div>
            Daily Egg Collection
          </h1>
          <p className="text-gray-600 mt-1">Record and track daily egg production</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Record Collection
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Record Egg Collection</DialogTitle>
              <DialogDescription>
                Enter today's egg collection data
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="flockId">Flock *</Label>
                  <Select
                    value={formData.flockId}
                    onValueChange={(value) => setFormData({ ...formData, flockId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select flock" />
                    </SelectTrigger>
                    <SelectContent>
                      {flocks.map((flock) => (
                        <SelectItem key={flock.id} value={flock.id}>
                          {flock.flockName} ({flock.currentStock} birds)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="collectionDate">Collection Date *</Label>
                  <Input
                    id="collectionDate"
                    type="date"
                    value={formData.collectionDate}
                    onChange={(e) => setFormData({ ...formData, collectionDate: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="collectionTime">Collection Time</Label>
                  <Input
                    id="collectionTime"
                    type="time"
                    value={formData.collectionTime}
                    onChange={(e) => setFormData({ ...formData, collectionTime: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="goodEggsCount">Good Eggs Count *</Label>
                  <Input
                    id="goodEggsCount"
                    type="number"
                    min="0"
                    value={formData.goodEggsCount}
                    onChange={(e) => setFormData({ ...formData, goodEggsCount: e.target.value })}
                    required
                    placeholder="e.g., 4500"
                  />
                </div>

                <div>
                  <Label htmlFor="brokenEggsCount">Broken Eggs Count</Label>
                  <Input
                    id="brokenEggsCount"
                    type="number"
                    min="0"
                    value={formData.brokenEggsCount}
                    onChange={(e) => setFormData({ ...formData, brokenEggsCount: e.target.value })}
                    placeholder="e.g., 50"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any observations..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-green-600 to-emerald-600"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    'Record Collection'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Eggs"
          value={totalEggs.toLocaleString()}
          icon={Egg}
          variant="success"
        />
        <StatCard
          title="Good Eggs"
          value={totalGoodEggs.toLocaleString()}
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          title="Broken Eggs"
          value={totalBrokenEggs.toLocaleString()}
          icon={AlertTriangle}
          variant="danger"
        />
        <StatCard
          title="Avg. Production %"
          value={avgProduction ? `${avgProduction.toFixed(1)}%` : '-'}
          icon={BarChart3}
          variant="info"
        />
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <Egg className="w-5 h-5 text-green-600" />
            Collection Records
          </CardTitle>
          <CardDescription>
            {collections.length} collection(s) recorded
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : (
            <DataTable
              data={collections}
              columns={columns}
              searchPlaceholder="Search by flock, recorder..."
              searchKeys={['flockName', 'recorderName']}
              pageSize={10}
              emptyMessage="No egg collections recorded yet."
            />
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Egg Collection Record</DialogTitle>
            <DialogDescription>
              Update the egg collection data
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editCollectionDate">Collection Date *</Label>
                <Input
                  id="editCollectionDate"
                  type="date"
                  value={editFormData.collectionDate}
                  onChange={(e) => setEditFormData({ ...editFormData, collectionDate: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="editCollectionTime">Collection Time</Label>
                <Input
                  id="editCollectionTime"
                  type="time"
                  value={editFormData.collectionTime}
                  onChange={(e) => setEditFormData({ ...editFormData, collectionTime: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="editGoodEggsCount">Good Eggs Count *</Label>
                <Input
                  id="editGoodEggsCount"
                  type="number"
                  min="0"
                  value={editFormData.goodEggsCount}
                  onChange={(e) => setEditFormData({ ...editFormData, goodEggsCount: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="editBrokenEggsCount">Broken Eggs Count</Label>
                <Input
                  id="editBrokenEggsCount"
                  type="number"
                  min="0"
                  value={editFormData.brokenEggsCount}
                  onChange={(e) => setEditFormData({ ...editFormData, brokenEggsCount: e.target.value })}
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="editNotes">Notes</Label>
                <Textarea
                  id="editNotes"
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  placeholder="Any observations..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-green-600 to-emerald-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Record'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Egg Collection Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this egg collection record? This action cannot be undone.
              {selectedRecord && (
                <div className="mt-2 p-3 bg-gray-100 rounded-md">
                  <p><strong>Date:</strong> {new Date(selectedRecord.collectionDate).toLocaleDateString('en-NG')}</p>
                  <p><strong>Flock:</strong> {selectedRecord.flock.flockName}</p>
                  <p><strong>Total Eggs:</strong> {selectedRecord.totalEggsCount.toLocaleString()}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
