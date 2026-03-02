'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, Column } from '@/components/ui/data-table';
import { Eye, Edit, Bird, Calendar, Users, MapPin, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { formatNumber } from '@/lib/utils';

interface FlocksTableProps {
  flocks: any[];
  userRole?: string;
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  declining: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  depleted: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
};

export function FlocksTable({ flocks, userRole }: FlocksTableProps) {
  const canEdit = userRole === 'Farm Manager' || userRole === 'Supervisor';

  const columns: Column<any>[] = [
    {
      key: 'flockName',
      header: 'Flock',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center">
            <Bird className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="font-semibold">{row.flockName}</p>
            <p className="text-xs text-muted-foreground">{row.breed || 'No breed specified'}</p>
          </div>
        </div>
      )
    },
    {
      key: 'currentStock',
      header: 'Stock',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-primary">{formatNumber(row.currentStock)}</span>
          {row.openingStock && (
            <span className="text-xs text-muted-foreground">/ {formatNumber(row.openingStock)}</span>
          )}
        </div>
      )
    },
    {
      key: 'site',
      header: 'Location',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span>{row.site?.name || 'Not assigned'}</span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (row) => (
        <Badge className={`${statusColors[row.status] || statusColors.depleted} border-0 capitalize`}>
          {row.status === 'active' && <TrendingUp className="h-3 w-3 mr-1" />}
          {row.status === 'declining' && <TrendingDown className="h-3 w-3 mr-1" />}
          {row.status}
        </Badge>
      )
    },
    {
      key: 'arrivalDate',
      header: 'Arrival Date',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{format(new Date(row.arrivalDate), 'dd MMM yyyy')}</span>
        </div>
      )
    },
    {
      key: 'records',
      header: 'Records',
      cell: (row) => (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">Eggs: <span className="font-medium text-foreground">{row._count?.eggCollections || 0}</span></span>
          <span className="text-muted-foreground">Mortality: <span className="font-medium text-red-600">{row._count?.mortalityRecords || 0}</span></span>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <Link href={`/dashboard/flocks/${row.id}`}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-50 text-blue-600">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          {canEdit && (
            <Link href={`/dashboard/flocks/${row.id}/edit`}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-amber-50 text-amber-600">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      )
    }
  ];

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="border-b border-border/50 bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
            <Bird className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle>Livestock Groups</CardTitle>
            <CardDescription>View and manage all livestock flocks</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <DataTable
          data={flocks || []}
          columns={columns}
          searchPlaceholder="Search by name, breed, status..."
          searchKeys={['flockName', 'breed', 'status']}
          pageSize={10}
          emptyMessage="No livestock groups found. Create your first flock to get started."
        />
      </CardContent>
    </Card>
  );
}
