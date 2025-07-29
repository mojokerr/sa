'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/language-context';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Target,
  Activity,
  BarChart3,
  PieChart,
  RefreshCw,
  Download,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface AnalyticsData {
  totalOrders: number;
  completedOrders: number;
  totalMembers: number;
  totalRevenue: number;
  successRate: number;
  avgCompletionTime: number;
  ordersThisMonth: number;
  membersThisMonth: number;
  chartData: {
    daily: Array<{
      date: string;
      orders: number;
      members: number;
      revenue: number;
    }>;
    monthly: Array<{
      month: string;
      orders: number;
      members: number;
      revenue: number;
    }>;
    statusDistribution: Array<{
      name: string;
      value: number;
      color: string;
    }>;
    priorityDistribution: Array<{
      name: string;
      value: number;
      color: string;
    }>;
  };
  topGroups: Array<{
    groupLink: string;
    orders: number;
    totalMembers: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const { t } = useLanguage();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');
  const [chartType, setChartType] = useState('line');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchAnalytics();
    }
  }, [status, router, timeRange]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics?timeRange=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        toast.error('فشل في تحميل الإحصائيات');
      }
    } catch (error) {
      toast.error('حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const exportData = () => {
    if (!analytics) return;
    
    const csvData = analytics.chartData.daily.map(item => ({
      التاريخ: item.date,
      'عدد الطلبات': item.orders,
      'عدد الأعضاء': item.members,
      'الإيرادات': item.revenue
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `analytics-${timeRange}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('تم تصدير البيانات');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">جاري تحميل الإحصائيات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <Navbar />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-purple-600 bg-clip-text text-transparent">
              الإحصائيات والتحليلات
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              تحليل شامل لأداء عمليات نقل الأعضاء
            </p>
          </div>
          
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 أيام</SelectItem>
                <SelectItem value="30d">30 يوم</SelectItem>
                <SelectItem value="90d">90 يوم</SelectItem>
                <SelectItem value="1y">سنة</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
            
            <Button onClick={exportData} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              تصدير
            </Button>
          </div>
        </div>

        {analytics && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        إجمالي الطلبات
                      </p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-white">
                        {analytics.totalOrders.toLocaleString()}
                      </p>
                      <p className="text-sm text-green-600">
                        +{analytics.ordersThisMonth} هذا الشهر
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        إجمالي الأعضاء
                      </p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-white">
                        {analytics.totalMembers.toLocaleString()}
                      </p>
                      <p className="text-sm text-green-600">
                        +{analytics.membersThisMonth.toLocaleString()} هذا الشهر
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        معدل النجاح
                      </p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-white">
                        {analytics.successRate.toFixed(1)}%
                      </p>
                      <p className="text-sm text-blue-600">
                        {analytics.completedOrders} طلب مكتمل
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                      <Target className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        إجمالي الإيرادات
                      </p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-white">
                        ${analytics.totalRevenue.toFixed(2)}
                      </p>
                      <p className="text-sm text-orange-600">
                        متوسط {analytics.avgCompletionTime} ساعة
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              {/* Orders & Members Chart */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>الطلبات والأعضاء</CardTitle>
                    <Select value={chartType} onValueChange={setChartType}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="line">خط</SelectItem>
                        <SelectItem value="area">منطقة</SelectItem>
                        <SelectItem value="bar">عمود</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    {chartType === 'line' && (
                      <LineChart data={analytics.chartData.daily}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="orders" stroke="#0891b2" strokeWidth={2} />
                        <Line type="monotone" dataKey="members" stroke="#8b5cf6" strokeWidth={2} />
                      </LineChart>
                    )}
                    {chartType === 'area' && (
                      <AreaChart data={analytics.chartData.daily}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="orders" stackId="1" stroke="#0891b2" fill="#0891b2" />
                        <Area type="monotone" dataKey="members" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" />
                      </AreaChart>
                    )}
                    {chartType === 'bar' && (
                      <BarChart data={analytics.chartData.daily}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="orders" fill="#0891b2" />
                        <Bar dataKey="members" fill="#8b5cf6" />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>توزيع حالات الطلبات</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={analytics.chartData.statusDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {analytics.chartData.statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Top Groups & Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Top Groups */}
              <Card>
                <CardHeader>
                  <CardTitle>أكثر المجموعات استخداماً</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.topGroups.map((group, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm truncate">{group.groupLink}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {group.orders} طلب • {group.totalMembers.toLocaleString()} عضو
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-cyan-600">#{index + 1}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>النشاط الأخير</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 rtl:space-x-reverse">
                        <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <Activity className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {new Date(activity.timestamp).toLocaleString('ar-SA')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
