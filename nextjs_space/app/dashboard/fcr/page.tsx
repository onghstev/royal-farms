'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TrendingUp, TrendingDown, DollarSign, Weight, Scale, Activity, AlertCircle, BarChart3 } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Batch {
  id: string;
  batchName: string;
  ageInDays: number;
  initialStock: number;
  currentStock: number;
  mortality: number;
}

interface Metrics {
  totalFeedConsumed: number;
  totalFeedCost: number;
  initialWeight: number;
  currentWeight: number;
  weightGain: number;
  totalWeightGain: number;
  fcr: number;
  costPerKg: number;
  dailyWeightGain: number;
  performance: string;
}

interface Benchmarks {
  excellent: number;
  good: number;
  average: number;
  poor: number;
}

interface FCRTrend {
  date: string;
  ageInDays: number;
  averageWeight: number;
  fcr: number;
}

interface FCRData {
  batch: Batch;
  metrics: Metrics;
  benchmarks: Benchmarks;
  fcrTrend: FCRTrend[];
  feedRecordsCount: number;
  weightRecordsCount: number;
}

export default function FCRDashboard() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [batches, setBatches] = useState<{ id: string; batchName: string; docArrivalDate: string }[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [fcrData, setFcrData] = useState<FCRData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    if (selectedBatchId) {
      fetchFCRData(selectedBatchId);
    }
  }, [selectedBatchId]);

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/batches');
      if (response.ok) {
        const data = await response.json();
        setBatches(data.batches || []);
        // Auto-select first batch
        if (data.batches && data.batches.length > 0) {
          setSelectedBatchId(data.batches[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch batches:', err);
    }
  };

  const fetchFCRData = async (batchId: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/fcr?batchId=${batchId}`);
      if (response.ok) {
        const data = await response.json();
        setFcrData(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch FCR data');
        setFcrData(null);
      }
    } catch (err) {
      setError('An error occurred while fetching FCR data');
      setFcrData(null);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'Excellent':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Good':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Average':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Below Average':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Poor':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getFCRChartData = () => {
    if (!fcrData || fcrData.fcrTrend.length === 0) return null;

    return {
      labels: fcrData.fcrTrend.map(t => `Day ${t.ageInDays}`),
      datasets: [
        {
          label: 'FCR (Feed Conversion Ratio)',
          data: fcrData.fcrTrend.map(t => t.fcr),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Excellent (Target)',
          data: fcrData.fcrTrend.map(() => fcrData.benchmarks.excellent),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0,
          pointRadius: 0,
        },
        {
          label: 'Good',
          data: fcrData.fcrTrend.map(() => fcrData.benchmarks.good),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0,
          pointRadius: 0,
        },
        {
          label: 'Average',
          data: fcrData.fcrTrend.map(() => fcrData.benchmarks.average),
          borderColor: 'rgb(234, 179, 8)',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0,
          pointRadius: 0,
        },
      ],
    };
  };

  const getWeightChartData = () => {
    if (!fcrData || fcrData.fcrTrend.length === 0) return null;

    return {
      labels: fcrData.fcrTrend.map(t => `Day ${t.ageInDays}`),
      datasets: [
        {
          label: 'Average Weight (kg)',
          data: fcrData.fcrTrend.map(t => t.averageWeight),
          backgroundColor: 'rgba(139, 92, 246, 0.7)',
          borderColor: 'rgb(139, 92, 246)',
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">FCR Analysis</h1>
          <p className="text-gray-600 mt-1">Feed Conversion Ratio Dashboard</p>
        </div>
      </div>

      {/* Batch Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Select Batch
          </CardTitle>
          <CardDescription>
            Choose a broiler batch to analyze FCR performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
            <SelectTrigger className="w-full md:w-96">
              <SelectValue placeholder="Select a batch" />
            </SelectTrigger>
            <SelectContent>
              {batches.map((batch) => (
                <SelectItem key={batch.id} value={batch.id}>
                  {batch.batchName} (Arrival: {new Date(batch.docArrivalDate).toLocaleDateString()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* FCR Data Display */}
      {!loading && fcrData && (
        <>
          {/* Batch Info */}
          <Card>
            <CardHeader>
              <CardTitle>Batch Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Batch Name</p>
                  <p className="text-lg font-semibold">{fcrData.batch.batchName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Age</p>
                  <p className="text-lg font-semibold">{fcrData.batch.ageInDays} days</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Initial Stock</p>
                  <p className="text-lg font-semibold">{fcrData.batch.initialStock.toLocaleString()} birds</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Stock</p>
                  <p className="text-lg font-semibold">{fcrData.batch.currentStock.toLocaleString()} birds</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Mortality</p>
                  <p className="text-lg font-semibold text-red-600">{fcrData.batch.mortality} birds</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">FCR (Feed Conversion Ratio)</CardTitle>
                <Scale className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{fcrData.metrics.fcr}</div>
                <Badge className={`mt-2 ${getPerformanceColor(fcrData.metrics.performance)}`}>
                  {fcrData.metrics.performance}
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  {fcrData.metrics.fcr <= fcrData.benchmarks.good ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="h-3 w-3" /> Above industry standard
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-orange-600">
                      <TrendingDown className="h-3 w-3" /> Below industry standard
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Feed Consumed</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{fcrData.metrics.totalFeedConsumed} kg</div>
                <p className="text-xs text-muted-foreground mt-2">
                  From {fcrData.feedRecordsCount} feed records
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  ₦{fcrData.metrics.totalFeedCost.toLocaleString()} total cost
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Weight Gain</CardTitle>
                <Weight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{fcrData.metrics.weightGain} kg</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Current: {fcrData.metrics.currentWeight} kg
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Daily gain: {fcrData.metrics.dailyWeightGain}g per bird
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cost per Kg</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">₦{fcrData.metrics.costPerKg}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Feed cost efficiency
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Total gain: {fcrData.metrics.totalWeightGain} kg
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Industry Benchmarks */}
          <Card>
            <CardHeader>
              <CardTitle>Industry Benchmarks (Broilers)</CardTitle>
              <CardDescription>Compare your FCR against standard performance levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800">Excellent</p>
                  <p className="text-2xl font-bold text-green-900">≤ {fcrData.benchmarks.excellent}</p>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">Good</p>
                  <p className="text-2xl font-bold text-blue-900">≤ {fcrData.benchmarks.good}</p>
                </div>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800">Average</p>
                  <p className="text-2xl font-bold text-yellow-900">≤ {fcrData.benchmarks.average}</p>
                </div>
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800">Poor</p>
                  <p className="text-2xl font-bold text-red-900">&gt; {fcrData.benchmarks.poor}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Charts */}
          {fcrData.fcrTrend.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>FCR Trend Over Time</CardTitle>
                  <CardDescription>Track feed conversion efficiency throughout growth</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {getFCRChartData() && (
                      <Line data={getFCRChartData()!} options={chartOptions} />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Weight Progression</CardTitle>
                  <CardDescription>Average weight measurements over batch lifecycle</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {getWeightChartData() && (
                      <Bar data={getWeightChartData()!} options={chartOptions} />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Not enough data to display charts. Weight tracking records are required for trend analysis.
              </AlertDescription>
            </Alert>
          )}

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {fcrData.metrics.fcr > 0 && fcrData.metrics.fcr <= fcrData.benchmarks.excellent && (
                  <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900">Excellent Performance!</p>
                      <p className="text-sm text-green-700">Your FCR is in the excellent range. Maintain current feeding practices and monitoring.</p>
                    </div>
                  </div>
                )}
                {fcrData.metrics.fcr > fcrData.benchmarks.excellent && fcrData.metrics.fcr <= fcrData.benchmarks.good && (
                  <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">Good Performance</p>
                      <p className="text-sm text-blue-700">Your FCR is above average. Small optimizations in feed quality or health could improve to excellent.</p>
                    </div>
                  </div>
                )}
                {fcrData.metrics.fcr > fcrData.benchmarks.good && fcrData.metrics.fcr <= fcrData.benchmarks.average && (
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-900">Average Performance</p>
                      <p className="text-sm text-yellow-700">Consider reviewing feed quality, health status, and environmental conditions to improve efficiency.</p>
                    </div>
                  </div>
                )}
                {fcrData.metrics.fcr > fcrData.benchmarks.average && (
                  <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <TrendingDown className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-900">Below Target Performance</p>
                      <p className="text-sm text-red-700">FCR is below industry standards. Immediate review needed: Check feed quality, disease outbreaks, ventilation, and consult veterinarian.</p>
                    </div>
                  </div>
                )}
                
                {fcrData.weightRecordsCount < 3 && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-gray-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Limited Data</p>
                      <p className="text-sm text-gray-700">More weight tracking records will improve FCR accuracy. Regular weekly weighing is recommended.</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* No Data State */}
      {!loading && !error && !fcrData && selectedBatchId && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No FCR data available for this batch. Ensure feed consumption and weight tracking records exist.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
