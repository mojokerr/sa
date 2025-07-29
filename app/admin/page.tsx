'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { OrdersList } from '@/components/dashboard/orders-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/language-context';
import { RefreshCw, Users, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface Order {
  id: string;
  groupLink: string;
  targetCount: number;
  currentCount: number;
  status: string;
  priority: string;
  notes?: string;
  createdAt: string;
  completedAt?: string;
  estimatedCompletion?: string;
  price: number;
  user: {
    id: string;
    name: string;
    email: string;
  };
  progress?: Array<{
    id: string;
    count: number;
    message?: string;
    createdAt: string;
  }>;
}

interface AdminStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  failedOrders: number;
  pausedOrders: number;
  totalUsers: number;
  activeUsers: number;
  totalMembers: number;
  totalRevenue: number;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const { t } = useLanguage();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
        router.push('/dashboard');
      } else {
        fetchData();
      }
    }
  }, [status, session, router, statusFilter]);

  const fetchData = async () => {
    try {
      const [ordersRes, statsRes] = await Promise.all([
        fetch(`/api/orders?limit=20${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}`),
        fetch('/api/stats'),
      ]);

      if (ordersRes.ok && statsRes.ok) {
        const ordersData = await ordersRes.json();
        const statsData = await statsRes.json();
        setOrders(ordersData.orders);
        setStats(statsData);
      } else {
        toast.error('Failed to load admin data');
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success('Order status updated successfully!');
        fetchData();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update order');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">{t('common.loading')}</p>
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
              {t('admin.title')}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              {t('admin.subtitle')}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/admin/users')}
              className="flex items-center space-x-2"
            >
              <Users className="w-4 h-4" />
              <span>Manage Users</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/admin/settings')}
              className="flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="mb-8">
            <StatsCards stats={stats} isAdmin={true} />
          </div>
        )}

        {/* Orders Management */}
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('admin.orders')}</CardTitle>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.filter.all')}</SelectItem>
                  <SelectItem value="PENDING">{t('status.pending')}</SelectItem>
                  <SelectItem value="PROCESSING">{t('status.processing')}</SelectItem>
                  <SelectItem value="COMPLETED">{t('status.completed')}</SelectItem>
                  <SelectItem value="CANCELLED">{t('status.cancelled')}</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
        </Card>

        {/* Orders List */}
        <OrdersList 
          orders={orders}
          isAdmin={true}
          onStatusChange={updateOrderStatus}
          onViewDetails={(order) => {
            router.push(`/admin/orders/${order.id}`);
          }}
        />
      </div>
    </div>
  );
}