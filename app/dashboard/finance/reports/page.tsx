'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, TrendingUp, TrendingDown, DollarSign, Calendar, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function FinancialReportsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [reportType, setReportType] = useState('summary');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [flockId, setFlockId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [flocks, setFlocks] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchFlocksBatches();
    }
  }, [status]);

  const fetchFlocksBatches = async () => {
    try {
      const [flocksRes, batchesRes] = await Promise.all([
        fetch('/api/flocks'),
        fetch('/api/batches')
      ]);

      if (flocksRes.ok) {
        const flocksData = await flocksRes.json();
        setFlocks(flocksData.flocks || []);
      }

      if (batchesRes.ok) {
        const batchesData = await batchesRes.json();
        setBatches(batchesData.batches || []);
      }
    } catch (error) {
      console.error('Error fetching flocks/batches:', error);
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: reportType,
        startDate,
        endDate
      });

      if (reportType === 'cost_analysis') {
        if (flockId) params.append('flockId', flockId);
        if (batchId) params.append('batchId', batchId);
      }

      const response = await fetch(`/api/finance/reports?${params}`);

      if (!response.ok) throw new Error('Failed to generate report');

      const data = await response.json();
      setReportData(data);
      toast.success('Report generated successfully');
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;

    let csvContent = '';

    if (reportType === 'summary') {
      csvContent = 'Financial Summary Report\n\n';
      csvContent += `Period: ${startDate} to ${endDate}\n\n`;
      csvContent += 'Metric,Amount\n';
      csvContent += `Total Income,${reportData.summary.totalIncome}\n`;
      csvContent += `Total Expense,${reportData.summary.totalExpense}\n`;
      csvContent += `Net Profit,${reportData.summary.netProfit}\n`;
      csvContent += `Profit Margin,${reportData.summary.profitMargin}%\n\n`;
      csvContent += '\nIncome by Category\n';
      csvContent += 'Category,Amount\n';
      Object.entries(reportData.incomeByCategory || {}).forEach(([category, amount]: [string, any]) => {
        csvContent += `${category},${amount}\n`;
      });
      csvContent += '\nExpense by Category\n';
      csvContent += 'Category,Amount\n';
      Object.entries(reportData.expenseByCategory || {}).forEach(([category, amount]: [string, any]) => {
        csvContent += `${category},${amount}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial_report_${reportType}_${new Date().toISOString()}.csv`;
    a.click();
    toast.success('Report exported successfully');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
        <p className="text-gray-600 mt-1">Generate comprehensive financial analysis reports</p>
      </div>

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <CardDescription>Select report type and date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Financial Summary</SelectItem>
                  <SelectItem value="profit_loss">Profit & Loss Statement</SelectItem>
                  <SelectItem value="cash_flow">Cash Flow Analysis</SelectItem>
                  <SelectItem value="cost_analysis">Cost Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"></div>
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

            {reportType === 'cost_analysis' && (
              <>
                <div className="space-y-2">
                  <Label>Flock (Optional)</Label>
                  <Select value={flockId} onValueChange={setFlockId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select flock" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Flocks</SelectItem>
                      {flocks.map((flock) => (
                        <SelectItem key={flock.id} value={flock.id}>
                          {flock.flockName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Batch (Optional)</Label>
                  <Select value={batchId} onValueChange={setBatchId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select batch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Batches</SelectItem>
                      {batches.map((batch) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.batchName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <div className="flex gap-4 mt-6">
            <Button onClick={generateReport} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
            {reportData && (
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Display */}
      {reportData && (
        <>
          {reportType === 'summary' && (
            <>
              <div className="grid gap-6 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(reportData.summary.totalIncome)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(reportData.summary.totalExpense)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                    <DollarSign className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-2xl font-bold ${
                        reportData.summary.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(reportData.summary.netProfit)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
                    <FileText className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {reportData.summary.profitMargin}%
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Income by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(reportData.incomeByCategory || {}).map(([category, amount]: any) => (
                          <TableRow key={category}>
                            <TableCell className="font-medium">
                              {category.replace(/_/g, ' ').toUpperCase()}
                            </TableCell>
                            <TableCell className="text-right text-green-600 font-medium">
                              {formatCurrency(amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Expense by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(reportData.expenseByCategory || {}).map(([category, amount]: any) => (
                          <TableRow key={category}>
                            <TableCell className="font-medium">
                              {category.toUpperCase()}
                            </TableCell>
                            <TableCell className="text-right text-red-600 font-medium">
                              {formatCurrency(amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {reportType === 'profit_loss' && (
            <Card>
              <CardHeader>
                <CardTitle>Profit & Loss Statement</CardTitle>
                <CardDescription>
                  Period: {startDate} to {endDate}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-green-600">Income</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(reportData.income?.categories || {}).map(([category, data]: any) => (
                          <TableRow key={category}>
                            <TableCell className="font-medium">
                              {category.replace(/_/g, ' ').toUpperCase()}
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(data.total)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="border-t-2 border-gray-300">
                          <TableCell className="font-bold">Total Income</TableCell>
                          <TableCell className="text-right font-bold text-green-600">
                            {formatCurrency(reportData.income?.total || 0)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-red-600">Expenses</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(reportData.expenses?.categories || {}).map(([category, data]: any) => (
                          <TableRow key={category}>
                            <TableCell className="font-medium">{category.toUpperCase()}</TableCell>
                            <TableCell className="text-right">{formatCurrency(data.total)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="border-t-2 border-gray-300">
                          <TableCell className="font-bold">Total Expenses</TableCell>
                          <TableCell className="text-right font-bold text-red-600">
                            {formatCurrency(reportData.expenses?.total || 0)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div className="border-t-4 border-gray-300 pt-4">
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-bold text-lg">Net Profit</TableCell>
                          <TableCell
                            className={`text-right font-bold text-lg ${
                              reportData.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'
                            }`}
                          >
                            {formatCurrency(reportData.netProfit)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-bold">Profit Margin</TableCell>
                          <TableCell className="text-right font-bold text-purple-600">
                            {reportData.profitMargin}%
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {reportType === 'cash_flow' && (
            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Analysis</CardTitle>
                <CardDescription>
                  Period: {startDate} to {endDate}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3 mb-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Cash In</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(reportData.summary?.totalCashIn || 0)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Cash Out</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {formatCurrency(reportData.summary?.totalCashOut || 0)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div
                        className={`text-2xl font-bold ${
                          (reportData.summary?.netCashFlow || 0) >= 0 ? 'text-blue-600' : 'text-red-600'
                        }`}
                      >
                        {formatCurrency(reportData.summary?.netCashFlow || 0)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Cash In</TableHead>
                      <TableHead className="text-right">Cash Out</TableHead>
                      <TableHead className="text-right">Net Cash Flow</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(reportData.monthlyData || {}).map(([month, data]: any) => (
                      <TableRow key={month}>
                        <TableCell className="font-medium">{month}</TableCell>
                        <TableCell className="text-right text-green-600">
                          {formatCurrency(data.income)}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {formatCurrency(data.expense)}
                        </TableCell>
                        <TableCell
                          className={`text-right font-medium ${
                            data.netCashFlow >= 0 ? 'text-blue-600' : 'text-red-600'
                          }`}
                        >
                          {formatCurrency(data.netCashFlow)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {reportType === 'cost_analysis' && (
            <Card>
              <CardHeader>
                <CardTitle>Cost Analysis</CardTitle>
                <CardDescription>
                  {reportData.flock ? `Flock: ${reportData.flock.name}` : ''}
                  {reportData.batch ? `Batch: ${reportData.batch.name}` : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-4 mb-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(reportData.financials?.totalIncome || 0)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Expense</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {formatCurrency(reportData.financials?.totalExpense || 0)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div
                        className={`text-2xl font-bold ${
                          (reportData.financials?.netProfit || 0) >= 0 ? 'text-blue-600' : 'text-red-600'
                        }`}
                      >
                        {formatCurrency(reportData.financials?.netProfit || 0)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">ROI</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600">
                        {reportData.metrics?.roi || '0'}%
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Cost Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableBody>
                          {reportData.metrics?.costPerBird && (
                            <TableRow>
                              <TableCell className="font-medium">Cost per Bird</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(parseFloat(reportData.metrics.costPerBird))}
                              </TableCell>
                            </TableRow>
                          )}
                          {reportData.metrics?.costPerEgg && (
                            <TableRow>
                              <TableCell className="font-medium">Cost per Egg</TableCell>
                              <TableCell className="text-right">
                                ₦{reportData.metrics.costPerEgg}
                              </TableCell>
                            </TableRow>
                          )}
                          <TableRow>
                            <TableCell className="font-medium">Profit Margin</TableCell>
                            <TableCell className="text-right">
                              {reportData.financials?.profitMargin}%
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Expense Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableBody>
                          {Object.entries(reportData.expenseBreakdown || {}).map(([category, amount]: any) => (
                            <TableRow key={category}>
                              <TableCell className="font-medium">{category.toUpperCase()}</TableCell>
                              <TableCell className="text-right">{formatCurrency(amount)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
