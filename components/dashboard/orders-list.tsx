'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/language-context';
import { 
  Users, 
  Clock, 
  DollarSign, 
  Eye, 
  Search, 
  Filter,
  Calendar,
  TrendingUp,
  ExternalLink,
  AlertCircle
} from 'lucide-react';

interface Order {
  id: string;
  groupLink: string;
  targetGroupLink?: string;
  targetCount: number;
  currentCount: number;
  status: string;
  priority: string;
  notes?: string;
  createdAt: string;
  completedAt?: string;
  estimatedCompletion?: string;
  price: number;
  currency: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  progress?: Array<{
    count: number;
    message?: string;
    createdAt: string;
  }>;
}

interface OrdersListProps {
  orders: Order[];
  onViewDetails: (order: Order) => void;
  showUserInfo?: boolean;
}

export function OrdersList({ orders, onViewDetails, showUserInfo = false }: OrdersListProps) {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'COMPLETED': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'FAILED': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'PAUSED': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-gray-100 text-gray-800';
      case 'NORMAL': return 'bg-blue-100 text-blue-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'URGENT': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getProgressPercentage = (current: number, target: number) => {
    return target > 0 ? Math.round((current / target) * 100) : 0;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4" />;
      case 'PROCESSING': return <TrendingUp className="h-4 w-4" />;
      case 'COMPLETED': return <Users className="h-4 w-4" />;
      case 'FAILED': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Filter orders based on search and filters
  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchTerm || 
      order.groupLink.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.targetGroupLink?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
              <Users className="h-5 w-5" />
              <span>{t('dashboard.recentOrders')}</span>
              <Badge variant="outline">{filteredOrders.length}</Badge>
            </CardTitle>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="البحث في الطلبات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="PENDING">معلقة</SelectItem>
                  <SelectItem value="PROCESSING">قيد المعالجة</SelectItem>
                  <SelectItem value="COMPLETED">مكتملة</SelectItem>
                  <SelectItem value="FAILED">فاشلة</SelectItem>
                  <SelectItem value="CANCELLED">ملغية</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="الأولوية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأولويات</SelectItem>
                  <SelectItem value="LOW">منخفضة</SelectItem>
                  <SelectItem value="NORMAL">عادية</SelectItem>
                  <SelectItem value="HIGH">عالية</SelectItem>
                  <SelectItem value="URGENT">عاجلة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-slate-900 dark:text-white mb-2">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
                ? 'لا توجد نتائج مطابقة'
                : t('dashboard.noOrders')
              }
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'جرب تغيير معايير البحث أو الفلترة'
                : 'ابدأ بإنشاء أول طلب نقل أعضاء'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && priorityFilter === 'all' && (
              <Button className="bg-gradient-to-r from-cyan-500 to-purple-600">
                {t('dashboard.createFirst')}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredOrders.map((order) => {
            const progressPercentage = getProgressPercentage(order.currentCount, order.targetCount);
            
            return (
              <Card key={order.id} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Order Info */}
                    <div className="flex-1 space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                            <h3 className="text-lg font-semibold">
                              طلب #{order.id.slice(-8)}
                            </h3>
                            <Badge className={getStatusColor(order.status)}>
                              {getStatusIcon(order.status)}
                              <span className="mr-1">{order.status}</span>
                            </Badge>
                            <Badge className={getPriorityColor(order.priority)}>
                              {order.priority}
                            </Badge>
                          </div>
                          
                          {showUserInfo && order.user && (
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              المستخدم: {order.user.name} ({order.user.email})
                            </p>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-bold text-cyan-600">
                            ${order.price.toFixed(2)}
                          </div>
                          <div className="text-sm text-slate-600">
                            {new Date(order.createdAt).toLocaleDateString('ar-SA')}
                          </div>
                        </div>
                      </div>

                      {/* Group Links */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              المجموعة المصدر
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(order.groupLink, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                            {order.groupLink}
                          </p>
                        </div>
                        
                        {order.targetGroupLink && (
                          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                المجموعة المستهدفة
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(order.targetGroupLink!, '_blank')}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                              {order.targetGroupLink}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Progress */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">التقدم</span>
                          <span className="text-slate-600">
                            {order.currentCount.toLocaleString()} / {order.targetCount.toLocaleString()} أعضاء
                          </span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                        <div className="text-right text-sm font-medium text-cyan-600">
                          {progressPercentage}%
                        </div>
                      </div>

                      {/* Notes */}
                      {order.notes && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                          <p className="text-sm text-amber-800 dark:text-amber-200">
                            {order.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Stats & Actions */}
                    <div className="lg:w-64 space-y-4">
                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <Users className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                          <div className="text-lg font-bold text-blue-600">
                            {order.currentCount.toLocaleString()}
                          </div>
                          <div className="text-xs text-blue-600">تم النقل</div>
                        </div>
                        
                        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <DollarSign className="h-6 w-6 mx-auto mb-1 text-green-600" />
                          <div className="text-lg font-bold text-green-600">
                            ${order.price.toFixed(2)}
                          </div>
                          <div className="text-xs text-green-600">التكلفة</div>
                        </div>
                      </div>

                      {/* Timing */}
                      {order.estimatedCompletion && (
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                          <Clock className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                          <div className="text-sm font-medium text-purple-700 dark:text-purple-300">
                            الانتهاء المتوقع
                          </div>
                          <div className="text-xs text-purple-600">
                            {new Date(order.estimatedCompletion).toLocaleDateString('ar-SA')}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="space-y-2">
                        <Link href={`/dashboard/orders/${order.id}`} className="block">
                          <Button variant="outline" className="w-full">
                            <Eye className="h-4 w-4 mr-2" />
                            عرض التفاصيل
                          </Button>
                        </Link>
                        
                        <Button
                          variant="ghost"
                          onClick={() => onViewDetails(order)}
                          className="w-full"
                        >
                          مراقبة النقل
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
