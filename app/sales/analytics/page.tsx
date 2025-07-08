'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users,
  ShoppingCart,
  Target,
  Award,
  Calendar
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Mock data for charts
const salesData = [
  { month: 'Jan', sales: 12500, target: 15000 },
  { month: 'Feb', sales: 18500, target: 17000 },
  { month: 'Mar', sales: 22000, target: 20000 },
  { month: 'Apr', sales: 19500, target: 22000 },
  { month: 'May', sales: 25000, target: 24000 },
  { month: 'Jun', sales: 28500, target: 26000 },
];

const productCategoryData = [
  { name: 'Motorized Blinds', value: 35, color: '#3B82F6' },
  { name: 'Wood Blinds', value: 25, color: '#10B981' },
  { name: 'Roller Shades', value: 20, color: '#F59E0B' },
  { name: 'Cellular Shades', value: 12, color: '#8B5CF6' },
  { name: 'Other', value: 8, color: '#6B7280' },
];

const leadsData = [
  { week: 'Week 1', leads: 45, converted: 12 },
  { week: 'Week 2', leads: 52, converted: 18 },
  { week: 'Week 3', leads: 48, converted: 15 },
  { week: 'Week 4', leads: 58, converted: 22 },
];

interface SalesMetrics {
  totalSales: number;
  totalOrders: number;
  conversionRate: number;
  avgOrderValue: number;
  monthlyTarget: number;
  achievedPercentage: number;
  totalLeads: number;
  activeQuotes: number;
}

export default function SalesAnalyticsPage() {
  const [timeframe, setTimeframe] = useState('month');
  const [metrics, setMetrics] = useState<SalesMetrics>({
    totalSales: 28500,
    totalOrders: 87,
    conversionRate: 32.5,
    avgOrderValue: 327.59,
    monthlyTarget: 26000,
    achievedPercentage: 109.6,
    totalLeads: 203,
    activeQuotes: 24,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sales Analytics</h1>
          <p className="text-gray-600 mt-2">
            Track your sales performance and targets
          </p>
        </div>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalSales)}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12.5% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Avg. value: {formatCurrency(metrics.avgOrderValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              From {metrics.totalLeads} leads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Target Achievement</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.achievedPercentage}%</div>
            <Progress value={metrics.achievedPercentage} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Sales Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Performance</CardTitle>
          <CardDescription>
            Monthly sales vs. targets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="Actual Sales"
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#EF4444"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Target"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Product Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Product Category</CardTitle>
            <CardDescription>
              Distribution of sales across categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productCategoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {productCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Lead Conversion */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Conversion</CardTitle>
            <CardDescription>
              Weekly lead generation and conversion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="leads" fill="#94A3B8" name="Total Leads" />
                  <Bar dataKey="converted" fill="#10B981" name="Converted" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>
            Your achievements and areas for improvement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Award className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-semibold">Excellent Performance!</p>
                  <p className="text-sm text-gray-600">
                    You've exceeded your monthly target by 9.6%
                  </p>
                </div>
              </div>
              <Badge variant="success" className="text-lg px-3 py-1">
                Top Performer
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Best Selling Day</p>
                <p className="font-semibold">Tuesday</p>
                <p className="text-xs text-gray-500">Average 15% higher sales</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Top Product</p>
                <p className="font-semibold">Motorized Smart Blinds</p>
                <p className="text-xs text-gray-500">35% of total sales</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Quote Success Rate</p>
                <p className="font-semibold">68%</p>
                <p className="text-xs text-gray-500">Industry avg: 55%</p>
              </div>
            </div>

            <Alert>
              <AlertDescription>
                <strong>Opportunity:</strong> Your lead conversion rate is strong, but there's 
                potential to increase average order value. Consider upselling smart home 
                integration and premium fabrics.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}