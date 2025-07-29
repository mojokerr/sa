'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { OrdersList } from '@/components/dashboard/orders-list';
import { OrderForm } from '@/components/dashboard/order-form';
import { useLanguage } from '@/contexts/language-context';
import { Plus, RefreshCw } from 'lucide-react';
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
  progress?: Array<{
    id: string;
    count: number;
    message?: string;
    createdAt: string;
  }>;
}

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  totalMembers: number;
  totalSpent: number;
}

export default function DashboardPage() {
  const { data: session, status, update } = useSession();
  const { t } = useLanguage();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      const [ordersRes, statsRes] = await Promise.all([
        fetch('/api/orders?limit=10'),
        fetch('/api/stats'),
      ]);

      if (ordersRes.ok && statsRes.ok) {
        const ordersData = await ordersRes.json();
        const statsData = await statsRes.json();
        setOrders(ordersData.orders);
        setStats(statsData);
      } else {
        toast.error('Failed to load dashboard data');
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
    // Update session to get latest credits
    update();
  };

  const handleOrderSuccess = () => {
    fetchData();
    // Update session to reflect new credit balance
    update();
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
              {t('dashboard.welcome')}, {session?.user?.name}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              {t('dashboard.subtitle')}
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
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('dashboard.newOrder')}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="mb-8">
            <StatsCards stats={stats} />
          </div>
        )}

        {/* Create Order Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
              <OrderForm
                onClose={() => setShowCreateForm(false)}
                onSuccess={handleOrderSuccess}
                userCredits={session?.user?.credits || 0}
              />
            </div>
          </div>
        )}

        {/* Orders List */}
        <OrdersList 
          orders={orders}
          onViewDetails={(order) => {
            router.push(`/dashboard/orders/${order.id}`);
          }}
        />
      </div>
    </div>
  );
}