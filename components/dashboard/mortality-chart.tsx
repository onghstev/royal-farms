'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format } from 'date-fns';

interface MortalityData {
  mortalityDate: Date;
  _sum: {
    mortalityCount: number | null;
  };
}

interface MortalityChartProps {
  data: MortalityData[];
}

export function MortalityChart({ data }: MortalityChartProps) {
  const chartData = data?.map((item) => ({
    date: format(new Date(item.mortalityDate), 'MMM dd'),
    deaths: item._sum?.mortalityCount || 0,
  })) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mortality Trend (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
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
            <Bar
              dataKey="deaths"
              fill="#FF6363"
              name="Deaths"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
