'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Syringe, Plus, Edit2, Trash2, AlertCircle, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface VaccinationRecord {
  id: string;
  vaccinationDate: string;
  vaccineName: string;
  diseaseTarget: string;
  administrationRoute: string;
  dosage: string;
  birdsVaccinated: number;
  cost: number;
  batchNumber: string | null;
  expiryDate: string | null;
  supplier: string | null;
  notes: string | null;
  flock?: { flockName: string };
  batch?: { batchName: string };
  administrator?: { firstName: string; lastName: string };
}

export default function VaccinationRecords() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [records, setRecords] = useState<VaccinationRecord[]>([]);
  const [flocks, setFlocks] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'flock' | 'batch'>('all');
  const [selectedFlockBatch, setSelectedFlockBatch] = useState('');
  const [formData, setFormData] = useState({
    id: '',
    flockId: '',
    batchId: '',
    vaccinationDate: new Date().toISOString().split('T')[0],
    vaccineName: '',
    diseaseTarget: '',
    administrationRoute: '',
    dosage: '',
    batchNumber: '',
    expiryDate: '',
    birdsVaccinated: 0,
    cost: 0,
    supplier: '',
    notes: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router]);

  useEffect(() => {
    if (filterType !== 'all' && selectedFlockBatch) {
      fetchRecords();
    } else if (filterType === 'all') {
      fetchRecords();
    }
  }, [filterType, selectedFlockBatch]);

  const fetchData = async () => {
    try {
      const [recordsRes, flocksRes, batchesRes] = await Promise.all([
        fetch('/api/health/vaccination-records'),
        fetch('/api/flocks'),
        fetch('/api/batches'),
      ]);

      if (recordsRes.ok) {
        const data = await recordsRes.json();
        setRecords(data.records || []);
      }

      if (flocksRes.ok) {
        const data = await flocksRes.json();
        setFlocks(data.flocks || []);
      }

      if (batchesRes.ok) {
        const data = await batchesRes.json();
        setBatches(data.batches || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async () => {
    try {
      let url = '/api/health/vaccination-records';
      const params = new URLSearchParams();
      
      if (filterType === 'flock' && selectedFlockBatch) {
        params.append('flockId', selectedFlockBatch);
      } else if (filterType === 'batch' && selectedFlockBatch) {
        params.append('batchId', selectedFlockBatch);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setRecords(data.records || []);
      }
    } catch (error) {
      console.error('Failed to fetch records:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.vaccineName || !formData.diseaseTarget || !formData.birdsVaccinated) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.flockId && !formData.batchId) {
      toast.error('Please select either a flock or batch');
      return;
    }

    try {
      const url = '/api/health/vaccination-records';
      const method = editMode ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        flockId: formData.flockId || null,
        batchId: formData.batchId || null,
        birdsVaccinated: parseInt(String(formData.birdsVaccinated)),
        cost: formData.cost ? parseFloat(String(formData.cost)) : null,
        expiryDate: formData.expiryDate || null,
        batchNumber: formData.batchNumber || null,
        supplier: formData.supplier || null,
        notes: formData.notes || null,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(editMode ? 'Record updated successfully' : 'Record created successfully');
        setModalOpen(false);
        resetForm();
        fetchRecords();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save record');
      }
    } catch (error) {
      console.error('Error saving record:', error);
      toast.error('An error occurred while saving');
    }
  };

  const handleEdit = (record: VaccinationRecord) => {
    setFormData({
      id: record.id,
      flockId: record.flock ? '' : '',
      batchId: record.batch ? '' : '',
      vaccinationDate: new Date(record.vaccinationDate).toISOString().split('T')[0],
      vaccineName: record.vaccineName,
      diseaseTarget: record.diseaseTarget,
      administrationRoute: record.administrationRoute,
      dosage: record.dosage,
      batchNumber: record.batchNumber || '',
      expiryDate: record.expiryDate ? new Date(record.expiryDate).toISOString().split('T')[0] : '',
      birdsVaccinated: record.birdsVaccinated,
      cost: record.cost || 0,
      supplier: record.supplier || '',
      notes: record.notes || '',
    });
    setEditMode(true);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;

    try {
      const response = await fetch(`/api/health/vaccination-records?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Record deleted successfully');
        fetchRecords();
      } else {
        toast.error('Failed to delete record');
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('An error occurred');
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      flockId: '',
      batchId: '',
      vaccinationDate: new Date().toISOString().split('T')[0],
      vaccineName: '',
      diseaseTarget: '',
      administrationRoute: '',
      dosage: '',
      batchNumber: '',
      expiryDate: '',
      birdsVaccinated: 0,
      cost: 0,
      supplier: '',
      notes: '',
    });
    setEditMode(false);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vaccination Records</h1>
          <p className="text-gray-600 mt-1">Track and manage vaccination activities</p>
        </div>
        <Dialog open={modalOpen} onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Record Vaccination
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editMode ? 'Edit' : 'Record'} Vaccination</DialogTitle>
              <DialogDescription>
                {editMode ? 'Update vaccination record details' : 'Add a new vaccination record'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vaccination Date *</Label>
                  <Input
                    type="date"
                    value={formData.vaccinationDate}
                    onChange={(e) => setFormData({ ...formData, vaccinationDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vaccine Name *</Label>
                  <Input
                    value={formData.vaccineName}
                    onChange={(e) => setFormData({ ...formData, vaccineName: e.target.value })}
                    placeholder="e.g., Lasota, Gumboro"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Disease Target *</Label>
                  <Select
                    value={formData.diseaseTarget}
                    onValueChange={(value) => setFormData({ ...formData, diseaseTarget: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select disease" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Newcastle Disease">Newcastle Disease</SelectItem>
                      <SelectItem value="Gumboro">Gumboro (IBD)</SelectItem>
                      <SelectItem value="Fowl Pox">Fowl Pox</SelectItem>
                      <SelectItem value="Infectious Bronchitis">Infectious Bronchitis</SelectItem>
                      <SelectItem value="Marek's Disease">Marek's Disease</SelectItem>
                      <SelectItem value="Fowl Cholera">Fowl Cholera</SelectItem>
                      <SelectItem value="Coccidiosis">Coccidiosis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Administration Route *</Label>
                  <Select
                    value={formData.administrationRoute}
                    onValueChange={(value) => setFormData({ ...formData, administrationRoute: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select route" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Drinking Water">Drinking Water</SelectItem>
                      <SelectItem value="Injection">Injection (SC/IM)</SelectItem>
                      <SelectItem value="Eye Drop">Eye Drop</SelectItem>
                      <SelectItem value="Spray">Spray</SelectItem>
                      <SelectItem value="Wing Web">Wing Web</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Flock (Layers)</Label>
                  <Select
                    value={formData.flockId}
                    onValueChange={(value) => setFormData({ ...formData, flockId: value, batchId: '' })}
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
                <div className="space-y-2">
                  <Label>Batch (Broilers)</Label>
                  <Select
                    value={formData.batchId}
                    onValueChange={(value) => setFormData({ ...formData, batchId: value, flockId: '' })}
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dosage *</Label>
                  <Input
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    placeholder="e.g., 0.03ml per bird"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Birds Vaccinated *</Label>
                  <Input
                    type="number"
                    value={formData.birdsVaccinated}
                    onChange={(e) => setFormData({ ...formData, birdsVaccinated: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Batch Number</Label>
                  <Input
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                    placeholder="Vaccine lot number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expiry Date</Label>
                  <Input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cost (\u20a6)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Supplier</Label>
                  <Input
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="Vaccine supplier name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes or observations"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editMode ? 'Update' : 'Save'} Record
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Filter By</Label>
              <Select value={filterType} onValueChange={(value: any) => {
                setFilterType(value);
                setSelectedFlockBatch('');
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Records</SelectItem>
                  <SelectItem value="flock">By Flock</SelectItem>
                  <SelectItem value="batch">By Batch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {filterType === 'flock' && (
              <div className="space-y-2">
                <Label>Select Flock</Label>
                <Select value={selectedFlockBatch} onValueChange={setSelectedFlockBatch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose flock" />
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
            {filterType === 'batch' && (
              <div className="space-y-2">
                <Label>Select Batch</Label>
                <Select value={selectedFlockBatch} onValueChange={setSelectedFlockBatch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose batch" />
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
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vaccination History</CardTitle>
          <CardDescription>{records.length} record(s) found</CardDescription>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="text-center py-12">
              <Syringe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No vaccination records found</h3>
              <p className="text-gray-600 mb-4">Start by recording your first vaccination activity</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Vaccine</TableHead>
                    <TableHead>Disease</TableHead>
                    <TableHead>Flock/Batch</TableHead>
                    <TableHead>Birds</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Administrator</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{new Date(record.vaccinationDate).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{record.vaccineName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.diseaseTarget}</Badge>
                      </TableCell>
                      <TableCell>
                        {record.flock && (
                          <Badge variant="secondary">{record.flock.flockName}</Badge>
                        )}
                        {record.batch && (
                          <Badge variant="secondary">{record.batch.batchName}</Badge>
                        )}
                      </TableCell>
                      <TableCell>{record.birdsVaccinated.toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-gray-600">{record.administrationRoute}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {record.administrator && `${record.administrator.firstName} ${record.administrator.lastName}`}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(record)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(record.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
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
    </div>
  );
}
