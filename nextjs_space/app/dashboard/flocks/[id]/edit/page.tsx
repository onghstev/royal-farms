'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, Bird } from 'lucide-react';
import Link from 'next/link';

interface Flock {
  id: string;
  flockName: string;
  flockType: string;
  breed: string | null;
  status: string;
  supplier: string | null;
  costPerBird: number | null;
  notes: string | null;
}

export default function EditFlockPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const params = useParams();
  const flockId = params?.id as string;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [flock, setFlock] = useState<Flock | null>(null);

  const [formData, setFormData] = useState({
    flockName: '',
    flockType: 'layers',
    breed: '',
    status: 'active',
    supplier: '',
    costPerBird: '',
    notes: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (flockId) {
      fetchFlock();
    }
  }, [flockId]);

  const fetchFlock = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/flocks/${flockId}`);
      if (response.ok) {
        const data = await response.json();
        setFlock(data);
        setFormData({
          flockName: data.flockName,
          flockType: data.flockType,
          breed: data.breed || '',
          status: data.status,
          supplier: data.supplier || '',
          costPerBird: data.costPerBird?.toString() || '',
          notes: data.notes || '',
        });
      } else {
        toast.error('Failed to fetch flock details');
        router.push('/dashboard/flocks');
      }
    } catch (error) {
      console.error('Error fetching flock:', error);
      toast.error('Failed to fetch flock details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/flocks/${flockId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Flock updated successfully');
        router.push('/dashboard/flocks');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update flock');
      }
    } catch (error) {
      console.error('Error updating flock:', error);
      toast.error('Failed to update flock');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!flock) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/flocks">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Bird className="w-8 h-8 text-green-600" />
            Edit Flock
          </h1>
          <p className="text-gray-600 mt-1">Update flock details</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Flock Details</CardTitle>
          <CardDescription>
            Update the details of {flock.flockName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="flockName">Flock Name *</Label>
                <Input
                  id="flockName"
                  value={formData.flockName}
                  onChange={(e) => setFormData({ ...formData, flockName: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="flockType">Flock Type *</Label>
                <Select
                  value={formData.flockType}
                  onValueChange={(value) => setFormData({ ...formData, flockType: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="layers">Layers</SelectItem>
                    <SelectItem value="pullets">Pullets</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="breed">Breed</Label>
                <Input
                  id="breed"
                  value={formData.breed}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="declining">Declining</SelectItem>
                    <SelectItem value="depleted">Depleted</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="costPerBird">Cost Per Bird (₦)</Label>
                <Input
                  id="costPerBird"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.costPerBird}
                  onChange={(e) => setFormData({ ...formData, costPerBird: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Link href="/dashboard/flocks">
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </Link>
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
                  'Update Flock'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
