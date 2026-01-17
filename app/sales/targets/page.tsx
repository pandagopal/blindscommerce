'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  TrendingUp, 
  Calendar,
  DollarSign,
  Trophy,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SalesTarget {
  period: string;
  target: number;
  achieved: number;
  percentage: number;
  status: 'on-track' | 'at-risk' | 'exceeded' | 'missed';
  daysRemaining?: number;
}

interface ProductTarget {
  product: string;
  targetUnits: number;
  soldUnits: number;
  percentage: number;
}

const currentTargets: SalesTarget[] = [
  {
    period: 'July 2024',
    target: 35000,
    achieved: 28500,
    percentage: 81.4,
    status: 'on-track',
    daysRemaining: 12,
  },
  {
    period: 'Q3 2024',
    target: 105000,
    achieved: 28500,
    percentage: 27.1,
    status: 'on-track',
    daysRemaining: 72,
  },
  {
    period: '2024',
    target: 420000,
    achieved: 186500,
    percentage: 44.4,
    status: 'on-track',
    daysRemaining: 180,
  },
];

const historicalTargets: SalesTarget[] = [
  {
    period: 'June 2024',
    target: 30000,
    achieved: 32500,
    percentage: 108.3,
    status: 'exceeded',
  },
  {
    period: 'May 2024',
    target: 28000,
    achieved: 27200,
    percentage: 97.1,
    status: 'missed',
  },
  {
    period: 'April 2024',
    target: 28000,
    achieved: 29500,
    percentage: 105.4,
    status: 'exceeded',
  },
];

const productTargets: ProductTarget[] = [
  {
    product: 'Motorized Blinds',
    targetUnits: 50,
    soldUnits: 42,
    percentage: 84,
  },
  {
    product: 'Wood Blinds',
    targetUnits: 40,
    soldUnits: 38,
    percentage: 95,
  },
  {
    product: 'Roller Shades',
    targetUnits: 35,
    soldUnits: 28,
    percentage: 80,
  },
  {
    product: 'Cellular Shades',
    targetUnits: 25,
    soldUnits: 18,
    percentage: 72,
  },
];

export default function SalesTargetsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'exceeded':
        return 'success';
      case 'on-track':
        return 'default';
      case 'at-risk':
        return 'warning';
      case 'missed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 80) return 'bg-red-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateDailyTarget = (remaining: number, daysLeft: number) => {
    return Math.ceil(remaining / daysLeft);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sales Targets</h1>
        <p className="text-gray-600 mt-2">
          Track your progress toward sales goals
        </p>
      </div>

      {/* Current Targets Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {currentTargets.map((target) => (
          <Card key={target.period}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">{target.period}</CardTitle>
                <Badge variant={getStatusColor(target.status) as any}>
                  {target.status.replace('-', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{formatCurrency(target.achieved)}</span>
                    <span className="text-gray-500">{formatCurrency(target.target)}</span>
                  </div>
                  <Progress 
                    value={target.percentage} 
                    className="h-2"
                    indicatorClassName={getProgressColor(target.percentage)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {target.percentage.toFixed(1)}% achieved
                  </p>
                </div>
                {target.daysRemaining && (
                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Days remaining:</span>
                      <span className="font-semibold">{target.daysRemaining}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-600">Daily target:</span>
                      <span className="font-semibold">
                        {formatCurrency(
                          calculateDailyTarget(
                            target.target - target.achieved,
                            target.daysRemaining
                          )
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance Details</TabsTrigger>
          <TabsTrigger value="products">Product Targets</TabsTrigger>
          <TabsTrigger value="history">Historical Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          {/* Monthly Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Target Breakdown</CardTitle>
              <CardDescription>
                Detailed view of your current month's performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Base Target</span>
                      <span className="font-semibold">{formatCurrency(30000)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Stretch Goal (+17%)</span>
                      <span className="font-semibold">{formatCurrency(35000)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Current Achievement</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(28500)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Working Days Left</span>
                      <span className="font-semibold">9 days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Required Daily Average</span>
                      <span className="font-semibold">{formatCurrency(722)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Current Daily Average</span>
                      <span className="font-semibold">{formatCurrency(1425)}</span>
                    </div>
                  </div>
                </div>

                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    You're on track to exceed your monthly target! Maintain your current 
                    pace to achieve 110% of your goal.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          {/* Incentives */}
          <Card>
            <CardHeader>
              <CardTitle>Incentive Structure</CardTitle>
              <CardDescription>
                Your commission and bonus opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">Base Commission</p>
                      <p className="text-sm text-gray-600">0-100% of target</p>
                    </div>
                    <span className="text-xl font-bold">5%</span>
                  </div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">Performance Bonus</p>
                      <p className="text-sm text-gray-600">100-120% of target</p>
                    </div>
                    <span className="text-xl font-bold text-red-600">7.5%</span>
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">Excellence Bonus</p>
                      <p className="text-sm text-gray-600">120%+ of target</p>
                    </div>
                    <span className="text-xl font-bold text-green-600">10%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product-Specific Targets</CardTitle>
              <CardDescription>
                Track your performance across different product categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Category</TableHead>
                    <TableHead className="text-center">Target Units</TableHead>
                    <TableHead className="text-center">Sold Units</TableHead>
                    <TableHead className="text-center">Achievement</TableHead>
                    <TableHead>Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productTargets.map((product) => (
                    <TableRow key={product.product}>
                      <TableCell className="font-medium">{product.product}</TableCell>
                      <TableCell className="text-center">{product.targetUnits}</TableCell>
                      <TableCell className="text-center">{product.soldUnits}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={product.percentage >= 80 ? 'success' : 'warning'}>
                          {product.percentage}%
                        </Badge>
                      </TableCell>
                      <TableCell className="w-[200px]">
                        <Progress 
                          value={product.percentage} 
                          className="h-2"
                          indicatorClassName={getProgressColor(product.percentage)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historical Performance</CardTitle>
              <CardDescription>
                Your past target achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {historicalTargets.map((target) => (
                  <div key={target.period} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        {target.status === 'exceeded' ? (
                          <Trophy className="h-8 w-8 text-green-500" />
                        ) : (
                          <Target className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">{target.period}</p>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(target.achieved)} / {formatCurrency(target.target)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={getStatusColor(target.status) as any}>
                        {target.percentage.toFixed(1)}%
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">{target.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}