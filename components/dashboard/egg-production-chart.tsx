'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format } from 'date-fns';

interface EggProductionData {
  collectionDate: Date;
  _sum: {
    totalEggsCount: number | null;
    goodEggsCount: number | null;
    brokenEggsCount: number | null;
  };
}

interface EggProductionChartProps {
  data: EggProductionData[];
}

export function EggProductionChart({ data }: EggProductionChartProps) {
  const chartData = data?.map((item) => ({
    date: format(new Date(item.collectionDate), 'MMM dd'),
    total: item._sum?.totalEggsCount || 0,
    good: item._sum?.goodEggsCount || 0,
    broken: item._sum?.brokenEggsCount || 0,
  })) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Egg Production Trend (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              tickLine={false}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '11px',
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              verticalAlign="top"
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#60B5FF"
              strokeWidth={2}
              name="Total Eggs"
              dot={{ r: 2 }}
            />
            <Line
              type="monotone"
              dataKey="good"
              stroke="#72BF78"
              strokeWidth={2}
              name="Good Eggs"
              dot={{ r: 2 }}
            />
            <Line
              type="monotone"
              dataKey="broken"
              stroke="#FF6363"
              strokeWidth={2}
              name="Broken Eggs"
              dot={{ r: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
