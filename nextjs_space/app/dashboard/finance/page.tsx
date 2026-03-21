'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Receipt,
  PieChart,
  Banknote,
  Building2,
  CalendarDays,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

type PeriodOption = 'all_time' | string; // string for "YYYY-MM" month keys

function getMonthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    options.push({ value, label });
  }
  return options;
}

function getPeriodLabel(period: PeriodOption): string {
  if (period === 'all_time') return 'All time';
  const [year, month] = period.split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

export default function FinanceDashboard() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [financialSummary, setFinancialSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodOption>('all_time');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const fetchFinancialSummary = useCallback(async (selectedPeriod: PeriodOption) => {
    try {
      setLoading(true);
      let url = '/api/finance/reports?type=summary';

      if (selectedPeriod !== 'all_time') {
        const [year, month] = selectedPeriod.split('-');
        const startDate = new Date(Number(year), Number(month) - 1, 1).toISOString().split('T')[0];
        const endDate = new Date(Number(year), Number(month), 0).toISOString().split('T')[0];
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch financial summary');

      const data = await response.json();
      setFinancialSummary(data);
    } catch (error: any) {
      console.error('Error fetching financial summary:', error);
      toast.error('Failed to load financial summary');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchFinancialSummary(period);
    }
  }, [status, period, fetchFinancialSummary]);

  const summary = financialSummary?.summary || {
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
    profitMargin: 0
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const periodLabel = getPeriodLabel(period);
  const monthOptions = getMonthOptions();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Financial Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Period Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Management</h1>
          <p className="text-gray-600 mt-1">Track income, expenses, and profitability</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
            <CalendarDays className="h-4 w-4 text-gray-500" />
            <Select value={period} onValueChange={(v) => setPeriod(v as PeriodOption)}>
              <SelectTrigger className="border-0 shadow-none bg-transparent p-0 h-auto min-w-[180px] focus:ring-0">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_time">
                  <span className="font-medium">All Time</span>
                </SelectItem>
                {monthOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchFinancialSummary(period)}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className={`border-l-4 border-l-green-500 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? '...' : formatCurrency(summary.totalIncome)}
            </div>
            <p className="text-xs text-gray-600 mt-1">{periodLabel}</p>
          </CardContent>
        </Card>

        <Card className={`border-l-4 border-l-red-500 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {loading ? '...' : formatCurrency(summary.totalExpense)}
            </div>
            <p className="text-xs text-gray-600 mt-1">{periodLabel}</p>
          </CardContent>
        </Card>

        <Card className={`border-l-4 border-l-blue-500 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                summary.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'
              }`}
            >
              {loading ? '...' : formatCurrency(summary.netProfit)}
            </div>
            <p className="text-xs text-gray-600 mt-1">{periodLabel}</p>
          </CardContent>
        </Card>

        <Card className={`border-l-4 border-l-purple-500 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <PieChart className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                parseFloat(summary.profitMargin) >= 0
                  ? 'text-purple-600'
                  : 'text-red-600'
              }`}
            >
              {loading ? '...' : `${summary.profitMargin}%`}
            </div>
            <p className="text-xs text-gray-600 mt-1">{periodLabel}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-t-4 border-t-green-500">
          <Link href="/dashboard/finance/income">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <ArrowUpRight className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Income Management</CardTitle>
                  <CardDescription>Record egg sales, bird sales & other income</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Egg Sales</span>
                  <span className="font-medium">
                    {formatCurrency(financialSummary?.incomeByCategory?.egg_sales || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Bird Sales</span>
                  <span className="font-medium">
                    {formatCurrency(financialSummary?.incomeByCategory?.bird_sales || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Other Income</span>
                  <span className="font-medium">
                    {formatCurrency(financialSummary?.incomeByCategory?.other || 0)}
                  </span>
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline">
                Manage Income <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-t-4 border-t-red-500">
          <Link href="/dashboard/finance/expenses">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <ArrowDownRight className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Expense Management</CardTitle>
                  <CardDescription>Track feed, labor, utilities & other costs</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Feed Costs</span>
                  <span className="font-medium">
                    {formatCurrency(financialSummary?.expenseByCategory?.feed || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Labor Costs</span>
                  <span className="font-medium">
                    {formatCurrency(financialSummary?.expenseByCategory?.labor || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Other Expenses</span>
                  <span className="font-medium">
                    {formatCurrency(
                      (financialSummary?.expenseByCategory?.utilities || 0) +
                        (financialSummary?.expenseByCategory?.veterinary || 0) +
                        (financialSummary?.expenseByCategory?.maintenance || 0) +
                        (financialSummary?.expenseByCategory?.other || 0)
                    )}
                  </span>
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline">
                Manage Expenses <ArrowDownRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-t-4 border-t-blue-500">
          <Link href="/dashboard/finance/reports">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Financial Reports</CardTitle>
                  <CardDescription>P&L, cash flow & cost analysis reports</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Receipt className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-gray-600">Profit & Loss Statement</span>
                </div>
                <div className="flex items-center text-sm">
                  <Wallet className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-gray-600">Cash Flow Analysis</span>
                </div>
                <div className="flex items-center text-sm">
                  <PieChart className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-gray-600">Cost Analysis Reports</span>
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline">
                View Reports <FileText className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-t-4 border-t-purple-500">
          <Link href="/dashboard/finance/banking">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Banknote className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Daily Banking</CardTitle>
                  <CardDescription>Track cash sales & bank deposits</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-gray-600">Daily Cash Sales</span>
                </div>
                <div className="flex items-center text-sm">
                  <Building2 className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-gray-600">Bank Deposits</span>
                </div>
                <div className="flex items-center text-sm">
                  <Wallet className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-gray-600">Cash Reconciliation</span>
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline">
                Manage Banking <Banknote className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}