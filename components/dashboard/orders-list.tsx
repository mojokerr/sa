'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Link as LinkIcon, 
  Calendar, 
  Users, 
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  Eye
} from 'lucide-react';
import { formatDate, formatDateTime, getOrderStatusColor, getPriorityColor, calculateProgress, extractGroupName } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';

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
  user?: {
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

interface OrdersListProps {
  orders: Order[];
  isAdmin?: boolean;
  onStatusChange?: (orderId: string, status: string) => void;
  onViewDetails?: (order: Order) => void;
}

export function OrdersList({ orders, isAdmin = false, onStatusChange, onViewDetails }: OrdersListProps) {
  const { t } = useLanguage();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const filteredOrders = orders.filter(order => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && order.priority !== priorityFilter) return false;
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4" />;
      case 'PROCESSING': return <TrendingUp className="h-4 w-4" />;
      case 'COMPLETED': return <CheckCircle className="h-4 w-4" />;
      case 'CANCELLED': return <XCircle className="h-4 w-4" />;
      case 'FAILED': return <AlertCircle className="h-4 w-4" />;
      case 'PAUSED': return <Pause className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (orders.length === 0) {
    return (
      <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <CardContent className="p-12 text-center">
          <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            {t('dashboard.noOrders')}
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Create your first order to start growing your Telegram community.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{isAdmin ? 'All Orders' : t('dashboard.recentOrders')}</CardTitle>
          <div className="flex space-x-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="PAUSED">Paused</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="NORMAL">Normal</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const progress = calculateProgress(order.currentCount, order.targetCount);
            const groupName = extractGroupName(order.groupLink);
            
            return (
              <div
                key={order.id}
                className="p-6 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <LinkIcon className="w-5 h-5 text-slate-400" />
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        @{groupName}
                      </h3>
                      <Badge className={getOrderStatusColor(order.status)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(order.status)}
                          <span>{t(`status.${order.status.toLowerCase()}`)}</span>
                        </div>
                      </Badge>
                      <Badge className={getPriorityColor(order.priority)}>
                        {order.priority}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600 dark:text-slate-400 mb-3">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        <span>{order.currentCount.toLocaleString()} / {order.targetCount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                      {order.estimatedCompletion && (
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>ETA: {formatDate(order.estimatedCompletion)}</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <span className="font-medium">${order.price.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Progress
                        </span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {progress.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    {order.notes && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                        {order.notes}
                      </p>
                    )}

                    {isAdmin && order.user && (
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        <span>User: {order.user.name} ({order.user.email})</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {onViewDetails && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetails(order)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    )}
                    
                    {isAdmin && onStatusChange && (
                      <Select
                        value={order.status}
                        onValueChange={(value) => onStatusChange(order.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="PROCESSING">Processing</SelectItem>
                          <SelectItem value="COMPLETED">Completed</SelectItem>
                          <SelectItem value="CANCELLED">Cancelled</SelectItem>
                          <SelectItem value="FAILED">Failed</SelectItem>
                          <SelectItem value="PAUSED">Paused</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                {/* Recent Progress */}
                {order.progress && order.progress.length > 0 && (
                  <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Latest Update
                    </h4>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">
                        {order.progress[0].message || `Updated to ${order.progress[0].count.toLocaleString()} members`}
                      </span>
                      <span className="text-slate-500 dark:text-slate-500">
                        {formatDateTime(order.progress[0].createdAt)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}