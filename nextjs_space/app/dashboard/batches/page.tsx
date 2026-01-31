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
import { Loader2, Plus, Bird, Edit, Eye } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { NumberInput } from '@/components/ui/number-input';

interface Site {
  id: string;
  name: string;
}

interface LivestockType {
  id: string;
  name: string;
  category: string;
  isActive: boolean;
}

interface Batch {
  id: string;
  batchName: string;
  batchType: string;
  breed: string | null;
  status: string;
  docArrivalDate: string;
  quantityOrdered: number;
  quantityReceived: number;
  currentStock: number;
  supplier: string | null;
  docCostPerBird: number | null;
  expectedSaleDate: string | null;
  site: {
    name: string;
  };
  manager: {
    firstName: string;
    lastName: string;
  } | null;
}

export default function BatchesPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [livestockTypes, setLivestockTypes] = useState<LivestockType[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    batchName: '',
    batchType: 'broilers',
    breed: '',
    siteId: '',
    docArrivalDate: new Date().toISOString().split('T')[0],
    quantityOrdered: '',
    quantityReceived: '',
    supplier: '',
    docCostPerBird: '',
    expectedSaleDate: '',
    notes: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchBatches();
    fetchSites();
    fetchLivestockTypes();
  }, []);

  const fetchLivestockTypes = async () => {
    try {
      const response = await fetch('/api/livestock-types');
      if (response.ok) {
        const data = await response.json();
        setLivestockTypes(data.filter((t: LivestockType) => t.isActive));
      }
    } catch (error) {
      console.error('Error fetching livestock types:', error);
    }
  };

  const fetchBatches = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/batches');
      if (response.ok) {
        const data = await response.json();
        setBatches(data);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast.error('Failed to fetch batches');
    } finally {
      setIsLoading(false);
    }
  };

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
      const response = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Batch created successfully');
        setIsDialogOpen(false);
        fetchBatches();
        setFormData({
          batchName: '',
          batchType: 'broilers',
          breed: '',
          siteId: sites[0]?.id || '',
          docArrivalDate: new Date().toISOString().split('T')[0],
          quantityOrdered: '',
          quantityReceived: '',
          supplier: '',
          docCostPerBird: '',
          expectedSaleDate: '',
          notes: '',
        });
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create batch');
      }
    } catch (error) {
      console.error('Error creating batch:', error);
      toast.error('Failed to create batch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'growing':
        return 'bg-green-100 text-green-800';
      case 'ready':
        return 'bg-blue-100 text-blue-800';
      case 'harvested':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
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
            <Bird className="w-8 h-8 text-green-600" />
            Broiler Batches
          </h1>
          <p className="text-gray-600 mt-1">Manage your broiler chicken batches</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-600 to-emerald-600">
              <Plus className="w-4 h-4 mr-2" />
              New Batch
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Batch</DialogTitle>
              <DialogDescription>
                Add a new broiler batch to your farm
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="batchName">Batch Name *</Label>
                  <Input
                    id="batchName"
                    value={formData.batchName}
                    onChange={(e) => setFormData({ ...formData, batchName: e.target.value })}
                    required
                    placeholder="e.g., Batch B1"
                  />
                </div>

                <div>
                  <Label htmlFor="batchType">Batch Type *</Label>
                  <Select
                    value={formData.batchType}
                    onValueChange={(value) => setFormData({ ...formData, batchType: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {livestockTypes.length > 0 ? (
                        livestockTypes.map((type) => (
                          <SelectItem key={type.id} value={type.name.toLowerCase()}>
                            {type.name} ({type.category})
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="broilers">Broilers (Poultry)</SelectItem>
                          <SelectItem value="pigs">Pigs</SelectItem>
                          <SelectItem value="cattle">Cattle</SelectItem>
                          <SelectItem value="goats">Goats</SelectItem>
                          <SelectItem value="fish">Fish</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="breed">Breed</Label>
                  <Input
                    id="breed"
                    value={formData.breed}
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                    placeholder="e.g., Ross 308"
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
                  <Label htmlFor="docArrivalDate">DOC Arrival Date *</Label>
                  <Input
                    id="docArrivalDate"
                    type="date"
                    value={formData.docArrivalDate}
                    onChange={(e) => setFormData({ ...formData, docArrivalDate: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="quantityOrdered">Quantity Ordered *</Label>
                  <Input
                    id="quantityOrdered"
                    type="number"
                    min="1"
                    value={formData.quantityOrdered}
                    onChange={(e) => setFormData({ ...formData, quantityOrdered: e.target.value })}
                    required
                    placeholder="e.g., 1000"
                  />
                </div>

                <div>
                  <Label htmlFor="quantityReceived">Quantity Received *</Label>
                  <Input
                    id="quantityReceived"
                    type="number"
                    min="1"
                    value={formData.quantityReceived}
                    onChange={(e) => setFormData({ ...formData, quantityReceived: e.target.value })}
                    required
                    placeholder="e.g., 995"
                  />
                </div>

                <div>
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="e.g., XYZ Hatchery"
                  />
                </div>

                <div>
                  <Label htmlFor="docCostPerBird">Cost Per DOC (₦)</Label>
                  <Input
                    id="docCostPerBird"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.docCostPerBird}
                    onChange={(e) => setFormData({ ...formData, docCostPerBird: e.target.value })}
                    placeholder="e.g., 250.00"
                  />
                </div>

                <div>
                  <Label htmlFor="expectedSaleDate">Expected Sale Date</Label>
                  <Input
                    id="expectedSaleDate"
                    type="date"
                    value={formData.expectedSaleDate}
                    onChange={(e) => setFormData({ ...formData, expectedSaleDate: e.target.value })}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any additional information..."
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
                      Creating...
                    </>
                  ) : (
                    'Create Batch'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Batches Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Batches</CardTitle>
          <CardDescription>
            {batches.length} batch(es) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : batches.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Bird className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No batches found</p>
              <p className="text-sm mt-1">Click "New Batch" to create your first batch</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Arrival Date</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-medium">{batch.batchName}</TableCell>
                      <TableCell className="capitalize">{batch.batchType}</TableCell>
                      <TableCell>{batch.site.name}</TableCell>
                      <TableCell>
                        {new Date(batch.docArrivalDate).toLocaleDateString('en-NG')}
                      </TableCell>
                      <TableCell>{batch.currentStock.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(batch.status)}>
                          {batch.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/dashboard/batches/${batch.id}`)}
                          >
                            <Eye className="w-4 h-4" />
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
