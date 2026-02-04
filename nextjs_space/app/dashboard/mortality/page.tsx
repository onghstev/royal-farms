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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, TrendingDown, Edit2, Trash2 } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { NumberInput } from '@/components/ui/number-input';

interface Flock {
  id: string;
  flockName: string;
}

interface Batch {
  id: string;
  batchName: string;
}

interface MortalityRecord {
  id: string;
  recordType: string;
  mortalityDate: string;
  mortalityCount: number;
  cause: string;
  mortalityRate: number | null;
  flock: {
    flockName: string;
  } | null;
  batch: {
    batchName: string;
  } | null;
  recorder: {
    firstName: string;
    lastName: string;
  };
}

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
    if (status === 'unauthenticated') {
      router.push('/login');
    }
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
      if (response.ok) {
        const data = await response.json();
        setRecords(data);
      }
    } catch (error) {
      console.error('Error fetching mortality records:', error);
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
        const activeBatches = data.filter((b: any) => ['active', 'growing', 'ready'].includes(b.status));
        setBatches(activeBatches);
        if (activeBatches.length > 0 && !formData.batchId) {
          setFormData(prev => ({ ...prev, batchId: activeBatches[0].id }));
        }
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/mortality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Mortality recorded successfully');
        setIsDialogOpen(false);
        fetchRecords();
        setFormData({
          recordType: 'flock',
          flockId: flocks[0]?.id || '',
          batchId: batches[0]?.id || '',
          mortalityDate: new Date().toISOString().split('T')[0],
          mortalityCount: '',
          cause: 'Unknown',
          notes: '',
        });
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to record mortality');
      }
    } catch (error) {
      console.error('Error recording mortality:', error);
      toast.error('Failed to record mortality');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (record: MortalityRecord) => {
    setSelectedRecord(record);
    setEditFormData({
      id: record.id,
      mortalityDate: new Date(record.mortalityDate).toISOString().split('T')[0],
      mortalityCount: record.mortalityCount.toString(),
      cause: record.cause,
      notes: '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/mortality', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        toast.success('Record updated successfully. Stock adjusted.');
        setIsEditDialogOpen(false);
        setSelectedRecord(null);
        fetchRecords();
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
      const response = await fetch(`/api/mortality?id=${selectedRecord.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Record deleted. Stock has been restored.');
        setIsDeleteDialogOpen(false);
        setSelectedRecord(null);
        fetchRecords();
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

  const getCauseColor = (cause: string) => {
    switch (cause.toLowerCase()) {
      case 'disease':
        return 'bg-red-100 text-red-800';
      case 'predator':
        return 'bg-orange-100 text-orange-800';
      case 'heat stress':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingDown className="w-8 h-8 text-red-600" />
            Mortality Tracking
          </h1>
          <p className="text-gray-600 mt-1">Record and monitor bird mortality</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-red-600 to-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              Record Mortality
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Record Mortality</DialogTitle>
              <DialogDescription>
                Enter mortality data for flocks or batches
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recordType">Record Type *</Label>
                  <Select
                    value={formData.recordType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, recordType: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flock">Flock (Layers)</SelectItem>
                      <SelectItem value="batch">Batch (Broilers)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.recordType === 'flock' ? (
                  <div>
                    <Label htmlFor="flockId">Flock *</Label>
                    <Select
                      value={formData.flockId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, flockId: value }))}
                      required
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
                ) : (
                  <div>
                    <Label htmlFor="batchId">Batch *</Label>
                    <Select
                      value={formData.batchId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, batchId: value }))}
                      required
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

                <div>
                  <Label htmlFor="mortalityDate">Mortality Date *</Label>
                  <Input
                    id="mortalityDate"
                    type="date"
                    value={formData.mortalityDate}
                    onChange={(e) => setFormData({ ...formData, mortalityDate: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="mortalityCount">Mortality Count *</Label>
                  <Input
                    id="mortalityCount"
                    type="number"
                    min="1"
                    value={formData.mortalityCount}
                    onChange={(e) => setFormData({ ...formData, mortalityCount: e.target.value })}
                    required
                    placeholder="e.g., 5"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="cause">Cause</Label>
                  <Select
                    value={formData.cause}
                    onValueChange={(value) => setFormData({ ...formData, cause: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Unknown">Unknown</SelectItem>
                      <SelectItem value="Disease">Disease</SelectItem>
                      <SelectItem value="Predator">Predator</SelectItem>
                      <SelectItem value="Heat Stress">Heat Stress</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any additional details..."
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
                  className="bg-gradient-to-r from-red-600 to-orange-600"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    'Record Mortality'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mortality Records</CardTitle>
          <CardDescription>
            {records.length} record(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <TrendingDown className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No mortality records yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Flock/Batch</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Cause</TableHead>
                    <TableHead>Recorded By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {new Date(record.mortalityDate).toLocaleDateString('en-NG')}
                      </TableCell>
                      <TableCell className="capitalize">{record.recordType}</TableCell>
                      <TableCell className="font-medium">
                        {record.flock?.flockName || record.batch?.batchName}
                      </TableCell>
                      <TableCell className="font-semibold text-red-600">
                        {record.mortalityCount}
                      </TableCell>
                      <TableCell>
                        {record.mortalityRate 
                          ? `${record.mortalityRate.toFixed(2)}%`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getCauseColor(record.cause)}>
                          {record.cause}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {record.recorder.firstName} {record.recorder.lastName}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(record)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setSelectedRecord(record);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Mortality Record</DialogTitle>
            <DialogDescription>
              Update the mortality data. Note: Changing the count will adjust the stock.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editMortalityDate">Mortality Date *</Label>
                <Input
                  id="editMortalityDate"
                  type="date"
                  value={editFormData.mortalityDate}
                  onChange={(e) => setEditFormData({ ...editFormData, mortalityDate: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="editMortalityCount">Mortality Count *</Label>
                <Input
                  id="editMortalityCount"
                  type="number"
                  min="1"
                  value={editFormData.mortalityCount}
                  onChange={(e) => setEditFormData({ ...editFormData, mortalityCount: e.target.value })}
                  required
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="editCause">Cause</Label>
                <Select
                  value={editFormData.cause}
                  onValueChange={(value) => setEditFormData({ ...editFormData, cause: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Unknown">Unknown</SelectItem>
                    <SelectItem value="Disease">Disease</SelectItem>
                    <SelectItem value="Predator">Predator</SelectItem>
                    <SelectItem value="Heat Stress">Heat Stress</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label htmlFor="editNotes">Notes</Label>
                <Textarea
                  id="editNotes"
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  placeholder="Any additional details..."
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
                className="bg-gradient-to-r from-red-600 to-orange-600"
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
            <AlertDialogTitle>Delete Mortality Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this mortality record? The stock count will be restored.
              {selectedRecord && (
                <div className="mt-2 p-3 bg-gray-100 rounded-md">
                  <p><strong>Date:</strong> {new Date(selectedRecord.mortalityDate).toLocaleDateString('en-NG')}</p>
                  <p><strong>Flock/Batch:</strong> {selectedRecord.flock?.flockName || selectedRecord.batch?.batchName}</p>
                  <p><strong>Count:</strong> {selectedRecord.mortalityCount}</p>
                  <p><strong>Cause:</strong> {selectedRecord.cause}</p>
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
