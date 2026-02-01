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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Baby, TrendingUp } from 'lucide-react';

interface Flock {
  id: string;
  flockName: string;
  flockType: string;
  currentStock: number;
  status: string;
}

interface Batch {
  id: string;
  batchName: string;
  batchType: string;
  currentStock: number;
  status: string;
}

interface BirthRecord {
  id: string;
  recordType: string;
  birthDate: string;
  birthCount: number;
  maleCount: number;
  femaleCount: number;
  motherDetails: string | null;
  fatherDetails: string | null;
  healthStatus: string;
  flock: {
    flockName: string;
    flockType: string;
  } | null;
  batch: {
    batchName: string;
    batchType: string;
  } | null;
  recorder: {
    firstName: string;
    lastName: string;
  };
  notes: string | null;
}

// Livestock types that can have births
const LIVESTOCK_TYPES = ['cattle', 'goats', 'sheep', 'pigs', 'rabbits'];

export default function BirthsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [records, setRecords] = useState<BirthRecord[]>([]);
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    recordType: 'flock',
    flockId: '',
    batchId: '',
    birthDate: new Date().toISOString().split('T')[0],
    birthCount: '',
    maleCount: '',
    femaleCount: '',
    motherDetails: '',
    fatherDetails: '',
    healthStatus: 'healthy',
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
      const response = await fetch('/api/births');
      if (response.ok) {
        const data = await response.json();
        setRecords(data);
      }
    } catch (error) {
      console.error('Error fetching birth records:', error);
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
        // Filter for livestock types that can have births (not poultry)
        const livestockFlocks = data.filter((f: Flock) => 
          f.status === 'active' && LIVESTOCK_TYPES.some(type => 
            f.flockType.toLowerCase().includes(type)
          )
        );
        setFlocks(livestockFlocks);
        if (livestockFlocks.length > 0 && !formData.flockId) {
          setFormData(prev => ({ ...prev, flockId: livestockFlocks[0].id }));
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
        // Filter for livestock types that can have births (not poultry)
        const livestockBatches = data.filter((b: Batch) => 
          ['active', 'growing', 'ready'].includes(b.status) && 
          LIVESTOCK_TYPES.some(type => b.batchType.toLowerCase().includes(type))
        );
        setBatches(livestockBatches);
        if (livestockBatches.length > 0 && !formData.batchId) {
          setFormData(prev => ({ ...prev, batchId: livestockBatches[0].id }));
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
      const response = await fetch('/api/births', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Birth recorded successfully! Stock has been updated.');
        setIsDialogOpen(false);
        fetchRecords();
        fetchFlocks();
        fetchBatches();
        setFormData({
          recordType: 'flock',
          flockId: flocks[0]?.id || '',
          batchId: batches[0]?.id || '',
          birthDate: new Date().toISOString().split('T')[0],
          birthCount: '',
          maleCount: '',
          femaleCount: '',
          motherDetails: '',
          fatherDetails: '',
          healthStatus: 'healthy',
          notes: '',
        });
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to record birth');
      }
    } catch (error) {
      console.error('Error recording birth:', error);
      toast.error('Failed to record birth');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'weak':
        return 'bg-yellow-100 text-yellow-800';
      case 'stillborn':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalBirths = records.reduce((sum, r) => sum + r.birthCount, 0);
  const healthyBirths = records.filter(r => r.healthStatus === 'healthy').reduce((sum, r) => sum + r.birthCount, 0);

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
            <Baby className="w-8 h-8 text-blue-600" />
            Birth Tracking
          </h1>
          <p className="text-gray-600 mt-1">Record and track livestock births (Pigs, Cattle, Goats, Sheep, Rabbits)</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
              <Plus className="w-4 h-4 mr-2" />
              Record Birth
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Record New Birth</DialogTitle>
              <DialogDescription>
                Enter birth data for livestock. Stock will be automatically updated.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recordType">Record Type *</Label>
                  <Select
                    value={formData.recordType}
                    onValueChange={(value) => setFormData({ ...formData, recordType: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flock">Flock/Herd</SelectItem>
                      <SelectItem value="batch">Batch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.recordType === 'flock' ? (
                  <div>
                    <Label htmlFor="flockId">Flock/Herd *</Label>
                    <Select
                      value={formData.flockId}
                      onValueChange={(value) => setFormData({ ...formData, flockId: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select flock/herd" />
                      </SelectTrigger>
                      <SelectContent>
                        {flocks.length === 0 ? (
                          <SelectItem value="" disabled>No livestock flocks available</SelectItem>
                        ) : (
                          flocks.map((flock) => (
                            <SelectItem key={flock.id} value={flock.id}>
                              {flock.flockName} ({flock.flockType}) - {flock.currentStock} animals
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="batchId">Batch *</Label>
                    <Select
                      value={formData.batchId}
                      onValueChange={(value) => setFormData({ ...formData, batchId: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select batch" />
                      </SelectTrigger>
                      <SelectContent>
                        {batches.length === 0 ? (
                          <SelectItem value="" disabled>No livestock batches available</SelectItem>
                        ) : (
                          batches.map((batch) => (
                            <SelectItem key={batch.id} value={batch.id}>
                              {batch.batchName} ({batch.batchType}) - {batch.currentStock} animals
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="birthDate">Birth Date *</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="birthCount">Total Births *</Label>
                  <Input
                    id="birthCount"
                    type="number"
                    min="1"
                    value={formData.birthCount}
                    onChange={(e) => setFormData({ ...formData, birthCount: e.target.value })}
                    required
                    placeholder="e.g., 8"
                  />
                </div>

                <div>
                  <Label htmlFor="maleCount">Male Count</Label>
                  <Input
                    id="maleCount"
                    type="number"
                    min="0"
                    value={formData.maleCount}
                    onChange={(e) => setFormData({ ...formData, maleCount: e.target.value })}
                    placeholder="e.g., 4"
                  />
                </div>

                <div>
                  <Label htmlFor="femaleCount">Female Count</Label>
                  <Input
                    id="femaleCount"
                    type="number"
                    min="0"
                    value={formData.femaleCount}
                    onChange={(e) => setFormData({ ...formData, femaleCount: e.target.value })}
                    placeholder="e.g., 4"
                  />
                </div>

                <div>
                  <Label htmlFor="motherDetails">Mother Details</Label>
                  <Input
                    id="motherDetails"
                    value={formData.motherDetails}
                    onChange={(e) => setFormData({ ...formData, motherDetails: e.target.value })}
                    placeholder="e.g., Sow #15, Nanny Goat #3"
                  />
                </div>

                <div>
                  <Label htmlFor="fatherDetails">Father Details</Label>
                  <Input
                    id="fatherDetails"
                    value={formData.fatherDetails}
                    onChange={(e) => setFormData({ ...formData, fatherDetails: e.target.value })}
                    placeholder="e.g., Boar #2, Ram #1"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="healthStatus">Health Status</Label>
                  <Select
                    value={formData.healthStatus}
                    onValueChange={(value) => setFormData({ ...formData, healthStatus: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="healthy">Healthy</SelectItem>
                      <SelectItem value="weak">Weak (needs attention)</SelectItem>
                      <SelectItem value="stillborn">Stillborn (will not add to stock)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any additional details about the birth..."
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
                  className="bg-gradient-to-r from-blue-600 to-indigo-600"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    'Record Birth'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Births</p>
                <p className="text-2xl font-bold text-blue-600">{totalBirths.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Healthy Births</p>
                <p className="text-2xl font-bold text-green-600">{healthyBirths.toLocaleString()}</p>
              </div>
              <Baby className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Records</p>
                <p className="text-2xl font-bold text-gray-600">{records.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Birth Records</CardTitle>
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
              <Baby className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No birth records yet</p>
              <p className="text-sm mt-2">Click "Record Birth" to add your first record</p>
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
                    <TableHead>Male/Female</TableHead>
                    <TableHead>Mother</TableHead>
                    <TableHead>Health</TableHead>
                    <TableHead>Recorded By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {new Date(record.birthDate).toLocaleDateString('en-NG')}
                      </TableCell>
                      <TableCell className="capitalize">{record.recordType}</TableCell>
                      <TableCell className="font-medium">
                        {record.flock?.flockName || record.batch?.batchName}
                        <span className="text-sm text-gray-500 ml-1">
                          ({record.flock?.flockType || record.batch?.batchType})
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        +{record.birthCount}
                      </TableCell>
                      <TableCell>
                        {record.maleCount > 0 || record.femaleCount > 0 ? (
                          <span>{record.maleCount}M / {record.femaleCount}F</span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {record.motherDetails || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getHealthStatusColor(record.healthStatus)}>
                          {record.healthStatus}
                        </Badge>
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
