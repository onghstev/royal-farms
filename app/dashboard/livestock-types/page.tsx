'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Edit2, Trash2, Bird, Fish, Beef, Rabbit, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface LivestockType {
  id: string;
  name: string;
  category: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  createdAt: string;
}

const CATEGORIES = [
  { value: 'poultry', label: 'Poultry' },
  { value: 'livestock', label: 'Livestock (Cattle, Goats, Sheep, Pigs)' },
  { value: 'aquaculture', label: 'Aquaculture (Fish)' },
  { value: 'small_animals', label: 'Small Animals (Rabbits)' },
];

const ICONS = [
  { value: 'bird', label: 'Bird (Poultry)' },
  { value: 'fish', label: 'Fish' },
  { value: 'beef', label: 'Cattle/Livestock' },
  { value: 'rabbit', label: 'Rabbit' },
];

function getIconComponent(iconName: string | null) {
  switch (iconName) {
    case 'fish': return <Fish className="w-5 h-5" />;
    case 'beef': return <Beef className="w-5 h-5" />;
    case 'rabbit': return <Rabbit className="w-5 h-5" />;
    default: return <Bird className="w-5 h-5" />;
  }
}

export default function LivestockTypesPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [livestockTypes, setLivestockTypes] = useState<LivestockType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<LivestockType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: 'poultry',
    description: '',
    icon: 'bird',
    isActive: true,
  });

  const userRole = (session?.user as any)?.role;
  const canManage = userRole === 'Farm Manager';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchLivestockTypes();
    }
  }, [status]);

  const fetchLivestockTypes = async () => {
    try {
      const response = await fetch('/api/livestock-types');
      if (response.ok) {
        const data = await response.json();
        setLivestockTypes(data);
      }
    } catch (error) {
      console.error('Error fetching livestock types:', error);
      toast.error('Failed to load livestock types');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/livestock-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Livestock type created successfully');
        setIsCreateOpen(false);
        resetForm();
        fetchLivestockTypes();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create livestock type');
      }
    } catch (error) {
      console.error('Error creating livestock type:', error);
      toast.error('Failed to create livestock type');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedType) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/livestock-types', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedType.id, ...formData }),
      });

      if (response.ok) {
        toast.success('Livestock type updated successfully');
        setIsEditOpen(false);
        resetForm();
        fetchLivestockTypes();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update livestock type');
      }
    } catch (error) {
      console.error('Error updating livestock type:', error);
      toast.error('Failed to update livestock type');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedType) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/livestock-types?id=${selectedType.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Livestock type deleted successfully');
        setIsDeleteOpen(false);
        setSelectedType(null);
        fetchLivestockTypes();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete livestock type');
      }
    } catch (error) {
      console.error('Error deleting livestock type:', error);
      toast.error('Failed to delete livestock type');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'poultry',
      description: '',
      icon: 'bird',
      isActive: true,
    });
    setSelectedType(null);
  };

  const openEditModal = (type: LivestockType) => {
    setSelectedType(type);
    setFormData({
      name: type.name,
      category: type.category,
      description: type.description || '',
      icon: type.icon || 'bird',
      isActive: type.isActive,
    });
    setIsEditOpen(true);
  };

  const filteredTypes = livestockTypes.filter((type: any) => {
    const matchesSearch = type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesActive = showInactive || type.isActive;
    return matchesSearch && matchesActive;
  });

  const stats = {
    total: livestockTypes.length,
    active: livestockTypes.filter((t: any) => t.isActive).length,
    poultry: livestockTypes.filter((t: any) => t.category === 'poultry').length,
    livestock: livestockTypes.filter((t: any) => t.category === 'livestock').length,
    aquaculture: livestockTypes.filter((t: any) => t.category === 'aquaculture').length,
  };

  if (status === 'loading' || loading) {
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
          <h1 className="text-3xl font-bold text-gray-900">Livestock Types</h1>
          <p className="text-gray-600 mt-1">Manage livestock categories for your farm</p>
        </div>
        {canManage && (
          <Button
            onClick={() => { resetForm(); setIsCreateOpen(true); }}
            className="bg-gradient-to-r from-green-600 to-blue-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Livestock Type
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-500">Total Types</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-gray-500">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-amber-600">{stats.poultry}</div>
            <div className="text-sm text-gray-500">Poultry</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.livestock}</div>
            <div className="text-sm text-gray-500">Livestock</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-cyan-600">{stats.aquaculture}</div>
            <div className="text-sm text-gray-500">Aquaculture</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              <Label>Show Inactive</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Icon</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                {canManage && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canManage ? 6 : 5} className="text-center py-8 text-gray-500">
                    No livestock types found. {canManage && 'Click "Add Livestock Type" to create one.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell>{getIconComponent(type.icon)}</TableCell>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {type.category.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500 max-w-xs truncate">
                      {type.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={type.isActive ? 'default' : 'secondary'}>
                        {type.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(type)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => { setSelectedType(type); setIsDeleteOpen(true); }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Livestock Type</DialogTitle>
            <DialogDescription>Create a new livestock type for your farm</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Layers, Cattle, Fish"
              />
            </div>
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="icon">Icon</Label>
              <Select
                value={formData.icon}
                onValueChange={(value) => setFormData({ ...formData, icon: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICONS.map((icon) => (
                    <SelectItem key={icon.value} value={icon.value}>
                      {icon.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Livestock Type</DialogTitle>
            <DialogDescription>Update livestock type details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-icon">Icon</Label>
              <Select
                value={formData.icon}
                onValueChange={(value) => setFormData({ ...formData, icon: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICONS.map((icon) => (
                    <SelectItem key={icon.value} value={icon.value}>
                      {icon.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Livestock Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedType?.name}"? This action cannot be undone.
              If this type is in use, consider deactivating it instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
