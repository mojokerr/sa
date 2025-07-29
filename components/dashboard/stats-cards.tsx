'use client';

import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  DollarSign,
  Target,
  Zap,
  AlertCircle
} from 'lucide-react';
import { formatNumber, formatCurrency } from '@/lib/utils';

interface StatsCardsProps {
  stats: {
    totalOrders: number;
    pendingOrders: number;
    processingOrders: number;
    completedOrders: number;
    totalMembers: number;
    totalSpent?: number;
    totalRevenue?: number;
    activeUsers?: number;
  };
  isAdmin?: boolean;
}

export function StatsCards({ stats, isAdmin = false }: StatsCardsProps) {
  const cards = isAdmin ? [
    {
      title: 'Total Orders',
      value: formatNumber(stats.totalOrders),
      icon: TrendingUp,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
    },
    {
      title: 'Pending',
      value: formatNumber(stats.pendingOrders),
      icon: Clock,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    {
      title: 'Processing',
      value: formatNumber(stats.processingOrders),
      icon: Zap,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Completed',
      value: formatNumber(stats.completedOrders),
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Total Members',
      value: formatNumber(stats.totalMembers),
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue || 0),
      icon: DollarSign,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      title: 'Active Users',
      value: formatNumber(stats.activeUsers || 0),
      icon: Target,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    },
  ] : [
    {
      title: 'Total Orders',
      value: formatNumber(stats.totalOrders),
      icon: TrendingUp,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
    },
    {
      title: 'Pending',
      value: formatNumber(stats.pendingOrders),
      icon: Clock,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    {
      title: 'Processing',
      value: formatNumber(stats.processingOrders),
      icon: Zap,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Completed',
      value: formatNumber(stats.completedOrders),
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Total Members',
      value: formatNumber(stats.totalMembers),
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'Total Spent',
      value: formatCurrency(stats.totalSpent || 0),
      icon: DollarSign,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card key={index} className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {card.value}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${card.bgColor} flex items-center justify-center`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}