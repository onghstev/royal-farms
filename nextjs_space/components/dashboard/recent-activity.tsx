'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Egg, TrendingDown, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface RecentActivityProps {
  eggCollections: any[];
  mortalityRecords: any[];
}

export function RecentActivity({ eggCollections, mortalityRecords }: RecentActivityProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Egg Collections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Egg className="w-5 h-5 mr-2 text-blue-600" />
            Recent Egg Collections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {eggCollections?.length > 0 ? (
              eggCollections.map((collection) => (
                <div
                  key={collection.id}
                  className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{collection.flock?.flockName}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {collection.totalEggsCount?.toLocaleString() || 0} eggs 
                      ({collection.goodEggsCount?.toLocaleString() || 0} good, {collection.brokenEggsCount?.toLocaleString() || 0} broken)
                    </p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {format(new Date(collection.collectionDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-green-600">
                      {typeof collection?.productionPercentage === 'number' 
                        ? collection.productionPercentage.toFixed(1) 
                        : '0'}%
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No recent collections</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Mortality */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingDown className="w-5 h-5 mr-2 text-red-600" />
            Recent Mortality Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mortalityRecords?.length > 0 ? (
              mortalityRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {record.flock?.flockName || record.batch?.batchName}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {record.mortalityCount} deaths - {record.cause || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {format(new Date(record.mortalityDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-red-600">
                      {typeof record?.mortalityRate === 'number' 
                        ? record.mortalityRate.toFixed(2) 
                        : '0'}%
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No recent mortality records</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
