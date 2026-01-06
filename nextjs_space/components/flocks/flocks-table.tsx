'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Edit, Search } from 'lucide-react';
import { format } from 'date-fns';

interface FlocksTableProps {
  flocks: any[];
  userRole?: string;
}

export function FlocksTable({ flocks, userRole }: FlocksTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredFlocks = flocks?.filter(flock => {
    const matchesSearch = flock?.flockName?.toLowerCase()?.includes(searchTerm?.toLowerCase() || '');
    const matchesStatus = statusFilter === 'all' || flock?.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const canEdit = userRole === 'Farm Manager' || userRole === 'Supervisor';

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search flocks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-md"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="declining">Declining</option>
              <option value="depleted">Depleted</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {filteredFlocks?.map((flock) => (
          <Card key={flock.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">{flock.flockName}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-gray-500">Breed</p>
                      <p className="text-sm font-medium">{flock.breed || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Current Stock</p>
                      <p className="text-sm font-medium">{flock.currentStock?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                        flock.status === 'active' ? 'bg-green-100 text-green-800' :
                        flock.status === 'declining' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {flock.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Arrival Date</p>
                      <p className="text-sm font-medium">
                        {format(new Date(flock.arrivalDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/dashboard/flocks/${flock.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </Link>
                  {canEdit && (
                    <Link href={`/dashboard/flocks/${flock.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFlocks?.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">No flocks found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
