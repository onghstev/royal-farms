'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, MapPin, Building2, Bird, Package } from 'lucide-react';

interface Site {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    flocks: number;
    batches: number;
  };
}

export default function SitesPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
  });

  const isManager = (session?.user as any)?.role === 'Farm Manager';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchSites();
  }, [showInactive]);

  const fetchSites = async () => {
    try {
      const res = await fetch(`/api/sites?includeInactive=${showInactive}`);
      if (res.ok) {
        const data = await res.json();
        setSites(data);
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
      toast.error('Failed to fetch sites');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('Site name is required');
      return;
    }

    try {
      const res = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success('Site created successfully');
        setIsCreateOpen(false);
        setFormData({ name: '', location: '', description: '' });
        fetchSites();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to create site');
      }
    } catch (error) {
      toast.error('Failed to create site');
    }
  };

  const handleEdit = async () => {
    if (!selectedSite || !formData.name.trim()) {
      toast.error('Site name is required');
      return;
    }

    try {
      const res = await fetch('/api/sites', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedSite.id,
          ...formData,
          isActive: selectedSite.isActive,
        }),
      });

      if (res.ok) {
        toast.success('Site updated successfully');
        setIsEditOpen(false);
        setSelectedSite(null);
        setFormData({ name: '', location: '', description: '' });
        fetchSites();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update site');
      }
    } catch (error) {
      toast.error('Failed to update site');
    }
  };

  const handleToggleActive = async (site: Site) => {
    try {
      const res = await fetch('/api/sites', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: site.id,
          name: site.name,
          location: site.location,
          description: site.description,
          isActive: !site.isActive,
        }),
      });

      if (res.ok) {
        toast.success(`Site ${site.isActive ? 'deactivated' : 'activated'} successfully`);
        fetchSites();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update site');
      }
    } catch (error) {
      toast.error('Failed to update site');
    }
  };

  const handleDelete = async () => {
    if (!selectedSite) return;

    try {
      const res = await fetch(`/api/sites?id=${selectedSite.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Site deleted successfully');
        setIsDeleteOpen(false);
        setSelectedSite(null);
        fetchSites();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete site');
      }
    } catch (error) {
      toast.error('Failed to delete site');
    }
  };

  const openEditDialog = (site: Site) => {
    setSelectedSite(site);
    setFormData({
      name: site.name,
      location: site.location || '',
      description: site.description || '',
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (site: Site) => {
    setSelectedSite(site);
    setIsDeleteOpen(true);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const activeSites = sites.filter((s: any) => s.isActive).length;
  const totalFlocks = sites.reduce((sum: number, s: any) => sum + (s._count?.flocks || 0), 0);
  const totalBatches = sites.reduce((sum: number, s: any) => sum + (s._count?.batches || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Site Management</h1>
          <p className="text-gray-600 mt-1">Manage your farm locations and facilities</p>
        </div>
        {isManager && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Site
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Site</DialogTitle>
                <DialogDescription>
                  Create a new farm site or location.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Site Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Main Farm, Site A"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., 123 Farm Road, Lagos"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe this site..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} className="bg-green-600 hover:bg-green-700">
                  Create Site
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Sites</p>
                <p className="text-2xl font-bold">{sites.length}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Sites</p>
                <p className="text-2xl font-bold text-green-600">{activeSites}</p>
              </div>
              <MapPin className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Flocks</p>
                <p className="text-2xl font-bold">{totalFlocks}</p>
              </div>
              <Bird className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Batches</p>
                <p className="text-2xl font-bold">{totalBatches}</p>
              </div>
              <Package className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sites Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Sites</CardTitle>
              <CardDescription>All farm sites and locations</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="show-inactive"
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              <Label htmlFor="show-inactive">Show inactive sites</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sites.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sites found</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first farm site.</p>
              {isManager && (
                <Button
                  onClick={() => setIsCreateOpen(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Site
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Flocks</TableHead>
                  <TableHead>Batches</TableHead>
                  <TableHead>Status</TableHead>
                  {isManager && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sites.map((site: any) => (
                  <TableRow key={site.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{site.name}</p>
                        {site.description && (
                          <p className="text-sm text-gray-500 truncate max-w-xs">
                            {site.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {site.location ? (
                        <div className="flex items-center text-gray-600">
                          <MapPin className="w-4 h-4 mr-1" />
                          {site.location}
                        </div>
                      ) : (
                        <span className="text-gray-400">Not specified</span>
                      )}
                    </TableCell>
                    <TableCell>{site._count?.flocks || 0}</TableCell>
                    <TableCell>{site._count?.batches || 0}</TableCell>
                    <TableCell>
                      <Badge variant={site.isActive ? 'default' : 'secondary'}>
                        {site.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    {isManager && (
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(site)}
                          >
                            {site.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(site)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => openDeleteDialog(site)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Site</DialogTitle>
            <DialogDescription>
              Update site information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Site Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} className="bg-green-600 hover:bg-green-700">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Site</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedSite?.name}"? This action cannot be undone.
              {(selectedSite?._count?.flocks || 0) > 0 || (selectedSite?._count?.batches || 0) > 0 ? (
                <span className="block mt-2 text-red-600">
                  Note: Sites with associated flocks or batches cannot be deleted. Deactivate them instead.
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
