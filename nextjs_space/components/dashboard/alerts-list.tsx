'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Alert {
  id: string;
  alertType: string;
  severity: string;
  message: string;
  alertDate: Date;
  flock?: { flockName: string } | null;
  batch?: { batchName: string } | null;
}

interface AlertsListProps {
  alerts: Alert[];
}

export function AlertsList({ alerts }: AlertsListProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'high':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default:
        return 'bg-blue-100 border-blue-300 text-blue-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-red-600">
          <AlertTriangle className="w-5 h-5 mr-2" />
          Active Alerts ({alerts?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts?.length > 0 ? (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-2 ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      <span className="font-semibold text-sm uppercase">
                        {alert.severity} - {alert.alertType.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-sm mb-2">{alert.message}</p>
                    <div className="flex items-center text-xs">
                      <span className="font-medium mr-2">
                        {alert.flock?.flockName || alert.batch?.batchName}
                      </span>
                      <span className="text-gray-600">
                        {format(new Date(alert.alertDate), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No active alerts</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
