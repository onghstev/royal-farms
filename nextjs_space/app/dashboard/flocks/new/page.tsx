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
import { Loader2, ArrowLeft, Bird } from 'lucide-react';
import Link from 'next/link';

interface Site {
  id: string;
  name: string;
}

export default function NewFlockPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sites, setSites] = useState<Site[]>([]);

  const [formData, setFormData] = useState({
    flockName: '',
    flockType: 'layers',
    breed: '',
    siteId: '',
    arrivalDate: new Date().toISOString().split('T')[0],
    openingStock: '',
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
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const response = await fetch('/api/sites');
      if (response.ok) {
        const data = await response.json();
        setSites(data);
        if (data.length > 0 && !formData.siteId) {
          setFormData(prev => ({ ...prev, siteId: data[0].id }));
        }
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/flocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Flock created successfully');
        router.push('/dashboard/flocks');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create flock');
      }
    } catch (error) {
      console.error('Error creating flock:', error);
      toast.error('Failed to create flock');
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
            Create New Flock
          </h1>
          <p className="text-gray-600 mt-1">Add a new layer flock to your farm</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Flock Details</CardTitle>
          <CardDescription>
            Enter the details of the new layer flock
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
                  placeholder="e.g., Flock A1"
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
                  placeholder="e.g., Isa Brown"
                />
              </div>

              <div>
                <Label htmlFor="siteId">Site *</Label>
                <Select
                  value={formData.siteId}
                  onValueChange={(value) => setFormData({ ...formData, siteId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select site" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="arrivalDate">Arrival Date *</Label>
                <Input
                  id="arrivalDate"
                  type="date"
                  value={formData.arrivalDate}
                  onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="openingStock">Opening Stock (Birds) *</Label>
                <Input
                  id="openingStock"
                  type="number"
                  min="1"
                  value={formData.openingStock}
                  onChange={(e) => setFormData({ ...formData, openingStock: e.target.value })}
                  required
                  placeholder="e.g., 5000"
                />
              </div>

              <div>
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="e.g., ABC Hatchery"
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
                  placeholder="e.g., 450.00"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional information..."
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
                    Creating...
                  </>
                ) : (
                  'Create Flock'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
