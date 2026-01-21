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
import { Loader2, Plus, Egg } from 'lucide-react';

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
}

export default function EggCollectionPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [collections, setCollections] = useState<EggCollection[]>([]);
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    flockId: '',
    collectionDate: new Date().toISOString().split('T')[0],
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
        setCollections(data);
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
            <Egg className="w-8 h-8 text-green-600" />
            Daily Egg Collection
          </h1>
          <p className="text-gray-600 mt-1">Record and track daily egg production</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-600 to-emerald-600">
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

      <Card>
        <CardHeader>
          <CardTitle>Collection Records</CardTitle>
          <CardDescription>
            {collections.length} collection(s) recorded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Egg className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No collections recorded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Flock</TableHead>
                    <TableHead>Good Eggs</TableHead>
                    <TableHead>Broken Eggs</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Production %</TableHead>
                    <TableHead>Recorded By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collections.map((collection) => (
                    <TableRow key={collection.id}>
                      <TableCell>
                        {new Date(collection.collectionDate).toLocaleDateString('en-NG')}
                      </TableCell>
                      <TableCell className="font-medium">{collection.flock.flockName}</TableCell>
                      <TableCell>{collection.goodEggsCount.toLocaleString()}</TableCell>
                      <TableCell>{collection.brokenEggsCount.toLocaleString()}</TableCell>
                      <TableCell className="font-semibold">{collection.totalEggsCount.toLocaleString()}</TableCell>
                      <TableCell>
                        {collection.productionPercentage 
                          ? `${collection.productionPercentage.toFixed(1)}%`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {collection.recorder.firstName} {collection.recorder.lastName}
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
