'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatCard } from '@/components/ui/stat-card';
import { toast } from 'sonner';
import { UserPlus, Edit2, Trash2, Shield, Mail, Phone, Calendar, Users, UserCheck, UserX, RefreshCw, AlertTriangle, Lock, User } from 'lucide-react';
import { format } from 'date-fns';

type Role = { id: string; name: string; description: string | null };
type User = { id: string; email: string; firstName: string; lastName: string; phone: string | null; role: Role; isActive: boolean; lastLogin: string | null; createdAt: string };

const roleColors: Record<string, string> = {
  'Farm Manager': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Farm Supervisor': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Farm Worker': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Viewer': 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
};

export default function UsersPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', firstName: '', lastName: '', phone: '', roleId: '', isActive: true });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    else if (status === 'authenticated') { fetchUsers(); fetchRoles(); }
  }, [status, router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      const data = await response.json();
      if (response.ok) setUsers(data.users || []);
      else toast.error(data.error || 'Failed to fetch users');
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles');
      const data = await response.json();
      if (response.ok) setRoles(data.roles || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const handleCreate = async () => {
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName || !formData.roleId) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      setSubmitting(true);
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok) {
        toast.success('User created successfully');
        setIsCreateDialogOpen(false);
        resetForm();
        fetchUsers();
      } else {
        toast.error(data.error || 'Failed to create user');
      }
    } catch (error) {
      toast.error('Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;
    try {
      setSubmitting(true);
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedUser.id, ...formData })
      });
      const data = await response.json();
      if (response.ok) {
        toast.success('User updated successfully');
        setIsEditDialogOpen(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        toast.error(data.error || 'Failed to update user');
      }
    } catch (error) {
      toast.error('Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      const response = await fetch(`/api/users?id=${selectedUser.id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('User deleted successfully');
        setIsDeleteDialogOpen(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        toast.error('Failed to delete user');
      }
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      roleId: user.role.id,
      isActive: user.isActive
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ email: '', password: '', firstName: '', lastName: '', phone: '', roleId: roles[0]?.id || '', isActive: true });
  };

  const activeUsers = users.filter((u: any) => u.isActive).length;
  const inactiveUsers = users.filter((u: any) => !u.isActive).length;
  const managerCount = users.filter((u: any) => u.role?.name === 'Farm Manager').length;

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'User',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">{row.firstName[0]}{row.lastName[0]}</span>
          </div>
          <div>
            <p className="font-medium">{row.firstName} {row.lastName}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{row.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      cell: (row) => (
        <Badge className={`${roleColors[row.role?.name] || roleColors['Viewer']} border-0`}>
          <Shield className="h-3 w-3 mr-1" />{row.role?.name || 'Unknown'}
        </Badge>
      )
    },
    {
      key: 'phone',
      header: 'Phone',
      cell: (row) => row.phone ? <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-muted-foreground" />{row.phone}</span> : <span className="text-muted-foreground">-</span>
    },
    {
      key: 'isActive',
      header: 'Status',
      cell: (row) => row.isActive
        ? <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0"><UserCheck className="h-3 w-3 mr-1" />Active</Badge>
        : <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-0"><UserX className="h-3 w-3 mr-1" />Inactive</Badge>
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      cell: (row) => row.lastLogin
        ? <span className="text-sm text-muted-foreground">{format(new Date(row.lastLogin), 'dd MMM yyyy')}</span>
        : <span className="text-muted-foreground">Never</span>
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEditDialog(row)} className="h-8 w-8 p-0 hover:bg-blue-50 text-blue-600"><Edit2 className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => { setSelectedUser(row); setIsDeleteDialogOpen(true); }} className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
        </div>
      )
    }
  ];

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto" />
            <Users className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-4 text-muted-foreground font-medium">Loading Users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage user accounts and permissions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchUsers} className="gap-2"><RefreshCw className="h-4 w-4" />Refresh</Button>
          <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/25 gap-2">
            <UserPlus className="h-4 w-4" />Add User
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={users.length} subtitle="All accounts" icon={Users} variant="info" />
        <StatCard title="Active Users" value={activeUsers} subtitle="Currently active" icon={UserCheck} variant="success" />
        <StatCard title="Inactive Users" value={inactiveUsers} subtitle="Disabled accounts" icon={UserX} variant="warning" />
        <StatCard title="Managers" value={managerCount} subtitle="Admin access" icon={Shield} variant="purple" />
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="border-b border-border/50 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>User Accounts</CardTitle>
              <CardDescription>View and manage all user accounts</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <DataTable data={users} columns={columns} searchPlaceholder="Search by name, email, role..." searchKeys={['firstName', 'lastName', 'email']} pageSize={10} emptyMessage="No users found." />
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader className="pb-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl">Create User</DialogTitle>
                <DialogDescription>Add a new user account</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>First Name *</Label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="John" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="pl-10 bg-background" /></div></div>
              <div className="space-y-2"><Label>Last Name *</Label><Input placeholder="Doe" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="bg-background" /></div>
            </div>
            <div className="space-y-2"><Label>Email *</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="email" placeholder="john@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="pl-10 bg-background" /></div></div>
            <div className="space-y-2"><Label>Password *</Label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="password" placeholder="Minimum 8 characters" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="pl-10 bg-background" /></div></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Phone</Label><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="+234..." value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="pl-10 bg-background" /></div></div>
              <div className="space-y-2"><Label>Role *</Label><Select value={formData.roleId} onValueChange={(v) => setFormData({ ...formData, roleId: v })}><SelectTrigger className="bg-background"><SelectValue placeholder="Select role" /></SelectTrigger><SelectContent>{roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
          </div>
          <DialogFooter className="pt-4 border-t border-border/50">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleCreate} disabled={submitting} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white min-w-[120px]">
              {submitting ? <div className="flex items-center gap-2"><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</div> : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader className="pb-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Edit2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl">Edit User</DialogTitle>
                <DialogDescription>Update user account details</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>First Name *</Label><Input value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="bg-background" /></div>
              <div className="space-y-2"><Label>Last Name *</Label><Input value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="bg-background" /></div>
            </div>
            <div className="space-y-2"><Label>Email *</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="bg-background" /></div>
            <div className="space-y-2"><Label>New Password (leave blank to keep current)</Label><Input type="password" placeholder="New password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="bg-background" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Phone</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="bg-background" /></div>
              <div className="space-y-2"><Label>Role *</Label><Select value={formData.roleId} onValueChange={(v) => setFormData({ ...formData, roleId: v })}><SelectTrigger className="bg-background"><SelectValue /></SelectTrigger><SelectContent>{roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.isActive ? 'active' : 'inactive'} onValueChange={(v) => setFormData({ ...formData, isActive: v === 'active' })}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="pt-4 border-t border-border/50">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={submitting} className="bg-gradient-to-r from-blue-600 to-blue-700 text-white min-w-[120px]">
              {submitting ? <div className="flex items-center gap-2"><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Updating...</div> : 'Update User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-500" />Delete User</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete {selectedUser?.firstName} {selectedUser?.lastName}? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
