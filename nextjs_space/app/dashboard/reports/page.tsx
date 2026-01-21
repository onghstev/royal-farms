'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, FileText, TrendingUp, AlertTriangle, Package, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

type ReportType = 'production' | 'mortality' | 'inventory' | 'weight';

interface ReportData {
  type: string;
  startDate: string | null;
  endDate: string | null;
  data: any;
}

export default function ReportsPage() {
  const { data: session } = useSession() || {};
  const [reportType, setReportType] = useState<ReportType>('production');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch report data
  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: reportType,
      });
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/reports?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch report');
      
      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  // Load initial report
  useEffect(() => {
    fetchReport();
  }, []);

  // Export to CSV
  const exportToCSV = () => {
    if (!reportData?.data) {
      toast.error('No data to export');
      return;
    }

    try {
      let csvContent = '';
      let filename = `${reportType}_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;

      switch (reportType) {
        case 'production': {
          csvContent = 'Date,Flock Name,Site,Good Eggs,Broken Eggs,Total Eggs,Production %\\n';
          reportData.data.collections?.forEach((row: any) => {
            csvContent += `${format(new Date(row.date), 'yyyy-MM-dd')},${row.flockName},${row.siteName},${row.goodEggs},${row.brokenEggs},${row.totalEggs},${row.productionPercentage}\\n`;
          });
          break;
        }
        case 'mortality': {
          csvContent = 'Date,Type,Group Name,Site,Count,Cause,Notes\\n';
          reportData.data.records?.forEach((row: any) => {
            csvContent += `${format(new Date(row.date), 'yyyy-MM-dd')},${row.type},${row.groupName},${row.siteName},${row.count},${row.cause},${row.notes || ''}\\n`;
          });
          break;
        }
        case 'inventory': {
          csvContent = 'Name,Type,Site,Breed,Age (weeks),Initial Stock,Current Stock,Mortality Rate %\\n';
          reportData.data.flocks?.forEach((row: any) => {
            csvContent += `${row.name},Layer Flock,${row.siteName},${row.breed},${row.ageWeeks},${row.initialStock},${row.currentStock},${row.mortalityRate}\\n`;
          });
          reportData.data.batches?.forEach((row: any) => {
            csvContent += `${row.name},Broiler Batch,${row.siteName},${row.breed},${row.ageWeeks},${row.initialStock},${row.currentStock},${row.mortalityRate}\\n`;
          });
          break;
        }
        case 'weight': {
          csvContent = 'Date,Batch Name,Site,Sample Size,Average Weight (kg),Notes\\n';
          reportData.data.records?.forEach((row: any) => {
            csvContent += `${format(new Date(row.date), 'yyyy-MM-dd')},${row.batchName},${row.siteName},${row.sampleSize},${row.averageWeight},${row.notes || ''}\\n`;
          });
          break;
        }
      }

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    }
  };

  // Render summary metrics
  const renderSummaryCards = () => {
    if (!reportData?.data?.summary) return null;

    const { summary } = reportData.data;

    switch (reportType) {
      case 'production':
        return (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Eggs</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalEggs?.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.totalGoodEggs?.toLocaleString()} good
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Production Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.avgProductionRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {summary.totalCollections} collections
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Broken Eggs</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalBrokenEggs?.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.totalEggs > 0 ? ((summary.totalBrokenEggs / summary.totalEggs) * 100).toFixed(1) : 0}% of total
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case 'mortality':
        return (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Deaths</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalDeaths?.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.totalRecords} records
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Deaths/Record</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.avgDeathsPerRecord}</div>
                <p className="text-xs text-muted-foreground">Per mortality entry</p>
              </CardContent>
            </Card>
          </div>
        );

      case 'inventory':
        return (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Birds</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalBirds?.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Active inventory</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Layers</CardTitle>
                <Package className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalLayers?.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.activeFlocks} active flocks
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Broilers</CardTitle>
                <Package className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalBroilers?.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.activeBatches} active batches
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case 'weight':
        return (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Weight</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.avgWeight} kg</div>
                <p className="text-xs text-muted-foreground">
                  {summary.totalRecords} records
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sampled</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalSampled}</div>
                <p className="text-xs text-muted-foreground">Birds weighed</p>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  // Render data table
  const renderDataTable = () => {
    if (!reportData?.data) return null;

    switch (reportType) {
      case 'production':
        if (!reportData.data.collections?.length) {
          return <p className="text-center text-muted-foreground py-8">No production data found</p>;
        }
        return (
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-medium">Date</th>
                  <th className="p-3 text-left font-medium">Flock</th>
                  <th className="p-3 text-left font-medium">Site</th>
                  <th className="p-3 text-right font-medium">Good</th>
                  <th className="p-3 text-right font-medium">Broken</th>
                  <th className="p-3 text-right font-medium">Total</th>
                  <th className="p-3 text-right font-medium">Production %</th>
                </tr>
              </thead>
              <tbody>
                {reportData.data.collections.map((row: any, idx: number) => (
                  <tr key={idx} className="border-b">
                    <td className="p-3">{format(new Date(row.date), 'MMM dd, yyyy')}</td>
                    <td className="p-3">{row.flockName}</td>
                    <td className="p-3">{row.siteName}</td>
                    <td className="p-3 text-right">{row.goodEggs.toLocaleString()}</td>
                    <td className="p-3 text-right">{row.brokenEggs.toLocaleString()}</td>
                    <td className="p-3 text-right font-medium">{row.totalEggs.toLocaleString()}</td>
                    <td className="p-3 text-right">
                      <Badge variant={row.productionPercentage >= 80 ? 'default' : row.productionPercentage >= 60 ? 'secondary' : 'destructive'}>
                        {row.productionPercentage}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'mortality':
        if (!reportData.data.records?.length) {
          return <p className="text-center text-muted-foreground py-8">No mortality data found</p>;
        }
        return (
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-medium">Date</th>
                  <th className="p-3 text-left font-medium">Type</th>
                  <th className="p-3 text-left font-medium">Group</th>
                  <th className="p-3 text-left font-medium">Site</th>
                  <th className="p-3 text-right font-medium">Count</th>
                  <th className="p-3 text-left font-medium">Cause</th>
                  <th className="p-3 text-left font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {reportData.data.records.map((row: any, idx: number) => (
                  <tr key={idx} className="border-b">
                    <td className="p-3">{format(new Date(row.date), 'MMM dd, yyyy')}</td>
                    <td className="p-3">
                      <Badge variant={row.type === 'Layer Flock' ? 'default' : 'secondary'}>
                        {row.type}
                      </Badge>
                    </td>
                    <td className="p-3">{row.groupName}</td>
                    <td className="p-3">{row.siteName}</td>
                    <td className="p-3 text-right font-medium">{row.count}</td>
                    <td className="p-3">{row.cause}</td>
                    <td className="p-3 text-muted-foreground">{row.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'inventory':
        return (
          <div className="space-y-6">
            {reportData.data.flocks?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Layer Flocks</h3>
                <div className="rounded-md border overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-3 text-left font-medium">Name</th>
                        <th className="p-3 text-left font-medium">Site</th>
                        <th className="p-3 text-left font-medium">Breed</th>
                        <th className="p-3 text-right font-medium">Age (weeks)</th>
                        <th className="p-3 text-right font-medium">Initial Stock</th>
                        <th className="p-3 text-right font-medium">Current Stock</th>
                        <th className="p-3 text-right font-medium">Mortality %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.data.flocks.map((row: any, idx: number) => (
                        <tr key={idx} className="border-b">
                          <td className="p-3 font-medium">{row.name}</td>
                          <td className="p-3">{row.siteName}</td>
                          <td className="p-3">{row.breed}</td>
                          <td className="p-3 text-right">{row.ageWeeks}</td>
                          <td className="p-3 text-right">{row.initialStock.toLocaleString()}</td>
                          <td className="p-3 text-right font-medium">{row.currentStock.toLocaleString()}</td>
                          <td className="p-3 text-right">
                            <Badge variant={parseFloat(row.mortalityRate) <= 5 ? 'default' : parseFloat(row.mortalityRate) <= 10 ? 'secondary' : 'destructive'}>
                              {row.mortalityRate}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {reportData.data.batches?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Broiler Batches</h3>
                <div className="rounded-md border overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-3 text-left font-medium">Name</th>
                        <th className="p-3 text-left font-medium">Site</th>
                        <th className="p-3 text-left font-medium">Breed</th>
                        <th className="p-3 text-right font-medium">Age (weeks)</th>
                        <th className="p-3 text-right font-medium">Initial Stock</th>
                        <th className="p-3 text-right font-medium">Current Stock</th>
                        <th className="p-3 text-right font-medium">Mortality %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.data.batches.map((row: any, idx: number) => (
                        <tr key={idx} className="border-b">
                          <td className="p-3 font-medium">{row.name}</td>
                          <td className="p-3">{row.siteName}</td>
                          <td className="p-3">{row.breed}</td>
                          <td className="p-3 text-right">{row.ageWeeks}</td>
                          <td className="p-3 text-right">{row.initialStock.toLocaleString()}</td>
                          <td className="p-3 text-right font-medium">{row.currentStock.toLocaleString()}</td>
                          <td className="p-3 text-right">
                            <Badge variant={parseFloat(row.mortalityRate) <= 5 ? 'default' : parseFloat(row.mortalityRate) <= 10 ? 'secondary' : 'destructive'}>
                              {row.mortalityRate}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {(!reportData.data.flocks?.length && !reportData.data.batches?.length) && (
              <p className="text-center text-muted-foreground py-8">No inventory data found</p>
            )}
          </div>
        );

      case 'weight':
        if (!reportData.data.records?.length) {
          return <p className="text-center text-muted-foreground py-8">No weight tracking data found</p>;
        }
        return (
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-medium">Date</th>
                  <th className="p-3 text-left font-medium">Batch</th>
                  <th className="p-3 text-left font-medium">Site</th>
                  <th className="p-3 text-right font-medium">Sample Size</th>
                  <th className="p-3 text-right font-medium">Avg Weight (kg)</th>
                  <th className="p-3 text-left font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {reportData.data.records.map((row: any, idx: number) => (
                  <tr key={idx} className="border-b">
                    <td className="p-3">{format(new Date(row.date), 'MMM dd, yyyy')}</td>
                    <td className="p-3">{row.batchName}</td>
                    <td className="p-3">{row.siteName}</td>
                    <td className="p-3 text-right">{row.sampleSize}</td>
                    <td className="p-3 text-right font-medium">
                      <Badge>{row.averageWeight}</Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">{row.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Generate and export comprehensive farm reports</p>
        </div>
        <Button onClick={exportToCSV} disabled={!reportData?.data || loading}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Configure your report parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">
                    <div className="flex items-center">
                      <Package className="h-4 w-4 mr-2" />
                      Production Report
                    </div>
                  </SelectItem>
                  <SelectItem value="mortality">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Mortality Report
                    </div>
                  </SelectItem>
                  <SelectItem value="inventory">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Inventory Report
                    </div>
                  </SelectItem>
                  <SelectItem value="weight">
                    <div className="flex items-center">
                      <Activity className="h-4 w-4 mr-2" />
                      Weight Tracking Report
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button onClick={fetchReport} disabled={loading} className="w-full">
                {loading ? 'Loading...' : 'Generate Report'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Metrics */}
      {renderSummaryCards()}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Report Data</CardTitle>
          <CardDescription>
            {reportData?.startDate && reportData?.endDate
              ? `Showing data from ${format(new Date(reportData.startDate), 'MMM dd, yyyy')} to ${format(new Date(reportData.endDate), 'MMM dd, yyyy')}`
              : 'Showing all available data'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading report data...</p>
            </div>
          ) : (
            renderDataTable()
          )}
        </CardContent>
      </Card>
    </div>
  );
}
