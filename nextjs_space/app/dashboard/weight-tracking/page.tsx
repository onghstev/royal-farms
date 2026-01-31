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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Scale, TrendingUp, Plus, Loader2 } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { NumberInput } from '@/components/ui/number-input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Batch {
  id: string;
  batchName: string;
  docArrivalDate: string;
  currentStock: number;
}

interface WeightRecord {
  id: string;
  batchId: string;
  weighingDate: string;
  ageInDays: number;
  sampleSize: number;
  averageWeight: number;
  minWeight: number | null;
  maxWeight: number | null;
  uniformity: number | null;
  notes: string | null;
  batch: {
    batchName: string;
  };
  recorder: {
    firstName: string;
    lastName: string;
  };
}

export default function WeightTrackingPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    batchId: '',
    weighingDate: new Date().toISOString().split('T')[0],
    ageInDays: '',
    sampleSize: '',
    averageWeight: '',
    minWeight: '',
    maxWeight: '',
    uniformity: '',
    notes: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchBatches();
    fetchWeightRecords();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      fetchWeightRecords(selectedBatch);
    } else {
      fetchWeightRecords();
    }
  }, [selectedBatch]);

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/batches');
      if (response.ok) {
        const data = await response.json();
        setBatches(data.filter((b: Batch) => b.currentStock > 0));
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const fetchWeightRecords = async (batchId?: string) => {
    setIsLoading(true);
    try {
      const url = batchId
        ? `/api/weight-tracking?batchId=${batchId}`
        : '/api/weight-tracking';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setWeightRecords(data);
      }
    } catch (error) {
      console.error('Error fetching weight records:', error);
      toast.error('Failed to fetch weight records');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAgeInDays = (batchId: string, weighingDate: string) => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return 0;

    const arrival = new Date(batch.docArrivalDate);
    const weighing = new Date(weighingDate);
    const diffTime = Math.abs(weighing.getTime() - arrival.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/weight-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Weight record added successfully');
        setIsDialogOpen(false);
        fetchWeightRecords(selectedBatch || undefined);
        setFormData({
          batchId: '',
          weighingDate: new Date().toISOString().split('T')[0],
          ageInDays: '',
          sampleSize: '',
          averageWeight: '',
          minWeight: '',
          maxWeight: '',
          uniformity: '',
          notes: '',
        });
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add weight record');
      }
    } catch (error) {
      console.error('Error adding weight record:', error);
      toast.error('Failed to add weight record');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Scale className="w-8 h-8 text-green-600" />
            Weight Tracking
          </h1>
          <p className="text-gray-600 mt-1">Monitor broiler growth and development</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-600 to-emerald-600">
              <Plus className="w-4 h-4 mr-2" />
              Record Weight
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record Weight Measurement</DialogTitle>
              <DialogDescription>
                Enter weight data for your broiler batch
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="batchId">Batch *</Label>
                  <Select
                    value={formData.batchId}
                    onValueChange={(value) => {
                      const ageInDays = calculateAgeInDays(value, formData.weighingDate);
                      setFormData({ ...formData, batchId: value, ageInDays: ageInDays.toString() });
                    }}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {batches.map((batch) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.batchName} ({batch.currentStock} birds)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="weighingDate">Weighing Date *</Label>
                  <Input
                    id="weighingDate"
                    type="date"
                    value={formData.weighingDate}
                    onChange={(e) => {
                      const ageInDays = calculateAgeInDays(formData.batchId, e.target.value);
                      setFormData({ ...formData, weighingDate: e.target.value, ageInDays: ageInDays.toString() });
                    }}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="ageInDays">Age (Days) *</Label>
                  <Input
                    id="ageInDays"
                    type="number"
                    value={formData.ageInDays}
                    onChange={(e) => setFormData({ ...formData, ageInDays: e.target.value })}
                    required
                    readOnly
                  />
                </div>

                <div>
                  <Label htmlFor="sampleSize">Sample Size (Birds) *</Label>
                  <Input
                    id="sampleSize"
                    type="number"
                    min="1"
                    value={formData.sampleSize}
                    onChange={(e) => setFormData({ ...formData, sampleSize: e.target.value })}
                    required
                    placeholder="e.g., 50"
                  />
                </div>

                <div>
                  <Label htmlFor="averageWeight">Average Weight (kg) *</Label>
                  <Input
                    id="averageWeight"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.averageWeight}
                    onChange={(e) => setFormData({ ...formData, averageWeight: e.target.value })}
                    required
                    placeholder="e.g., 2.45"
                  />
                </div>

                <div>
                  <Label htmlFor="minWeight">Min Weight (kg)</Label>
                  <Input
                    id="minWeight"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.minWeight}
                    onChange={(e) => setFormData({ ...formData, minWeight: e.target.value })}
                    placeholder="e.g., 2.10"
                  />
                </div>

                <div>
                  <Label htmlFor="maxWeight">Max Weight (kg)</Label>
                  <Input
                    id="maxWeight"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.maxWeight}
                    onChange={(e) => setFormData({ ...formData, maxWeight: e.target.value })}
                    placeholder="e.g., 2.80"
                  />
                </div>

                <div>
                  <Label htmlFor="uniformity">Uniformity (%)</Label>
                  <Input
                    id="uniformity"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.uniformity}
                    onChange={(e) => setFormData({ ...formData, uniformity: e.target.value })}
                    placeholder="e.g., 85.5"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any observations or remarks..."
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
                    'Record Weight'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label>Filter by Batch:</Label>
            <Select value={selectedBatch} onValueChange={setSelectedBatch}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="All batches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All batches</SelectItem>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {batch.batchName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedBatch && selectedBatch !== 'all' && (
              <Button variant="outline" size="sm" onClick={() => setSelectedBatch('')}>
                Clear Filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Weight Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Weight Records
          </CardTitle>
          <CardDescription>
            {weightRecords.length} record(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : weightRecords.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Scale className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No weight records found</p>
              <p className="text-sm mt-1">Click "Record Weight" to add your first measurement</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Age (Days)</TableHead>
                    <TableHead>Sample Size</TableHead>
                    <TableHead>Avg Weight (kg)</TableHead>
                    <TableHead>Min-Max (kg)</TableHead>
                    <TableHead>Uniformity</TableHead>
                    <TableHead>Recorded By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weightRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {new Date(record.weighingDate).toLocaleDateString('en-NG')}
                      </TableCell>
                      <TableCell className="font-medium">{record.batch.batchName}</TableCell>
                      <TableCell>{record.ageInDays}</TableCell>
                      <TableCell>{record.sampleSize}</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {record.averageWeight.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {record.minWeight && record.maxWeight
                          ? `${record.minWeight.toFixed(2)} - ${record.maxWeight.toFixed(2)}`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {record.uniformity ? `${record.uniformity.toFixed(1)}%` : '-'}
                      </TableCell>
                      <TableCell>
                        {record.recorder.firstName} {record.recorder.lastName}
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
