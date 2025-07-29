'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/components/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TransferMonitor } from '@/components/dashboard/transfer-monitor';
import { useLanguage } from '@/contexts/language-context';
import { 
  ArrowLeft, 
  Users, 
  Clock, 
  DollarSign, 
  AlertCircle, 
  RefreshCw,
  ExternalLink,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Order {
  id: string;
  groupLink: string;
  targetGroupLink: string;
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
  transferType: string;
  sourceGroupInfo?: any;
  targetGroupInfo?: any;
  transferErrors?: any;
  user: {
    id: string;
    name: string;
    email: string;
  };
  progress: Array<{
    id: string;
    count: number;
    message?: string;
    createdAt: string;
  }>;
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { t } = useLanguage();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && params.id) {
      fetchOrder();
    }
  }, [status, params.id, router]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${params.id}`);
      if (response.ok) {
        const orderData = await response.json();
        setOrder(orderData);
      } else if (response.status === 404) {
        toast.error('الطلب غير موجود');
        router.push('/dashboard');
      } else {
        toast.error('فشل في تحميل بيانات الطلب');
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
    fetchOrder();
  };

  const handleOrderUpdate = (updatedOrder: Order) => {
    setOrder(updatedOrder);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'COMPLETED': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'FAILED': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
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

  const downloadReport = () => {
    if (!order) return;
    
    const reportData = {
      orderId: order.id,
      sourceGroup: order.groupLink,
      targetGroup: order.targetGroupLink,
      targetCount: order.targetCount,
      currentCount: order.currentCount,
      status: order.status,
      priority: order.priority,
      createdAt: order.createdAt,
      completedAt: order.completedAt,
      progress: order.progress,
      errors: order.transferErrors
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transfer-report-${order.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('تم تحميل التقرير');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">جاري تحميل بيانات الطلب...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <Navbar />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              الطلب غير موجود
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              لا يمكن العثور على الطلب المطلوب
            </p>
            <Link href="/dashboard">
              <Button className="bg-gradient-to-r from-cyan-500 to-purple-600">
                <ArrowLeft className="h-4 w-4 mr-2" />
                العودة للوحة التحكم
              </Button>
            </Link>
          </div>
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
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                رجوع
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-purple-600 bg-clip-text text-transparent">
                تفاصيل الطلب #{order.id.slice(-8)}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                تم الإنشاء في {new Date(order.createdAt).toLocaleDateString('ar-SA')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
            <Button
              onClick={downloadReport}
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              تحميل التقرير
            </Button>
          </div>
        </div>

        {/* Order Summary Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>ملخص الطلب</span>
              <div className="flex space-x-2 rtl:space-x-reverse">
                <Badge className={getStatusColor(order.status)}>
                  {order.status}
                </Badge>
                <Badge className={getPriorityColor(order.priority)}>
                  {order.priority}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold text-blue-600">{order.currentCount.toLocaleString()}</div>
                <div className="text-sm text-blue-600">تم النقل</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <div className="text-2xl font-bold text-purple-600">{order.targetCount.toLocaleString()}</div>
                <div className="text-sm text-purple-600">الهدف</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold text-green-600">${order.price.toFixed(2)}</div>
                <div className="text-sm text-green-600">التكلفة</div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <Clock className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <div className="text-2xl font-bold text-orange-600">
                  {order.estimatedCompletion ? 
                    new Date(order.estimatedCompletion).toLocaleDateString('ar-SA') : 
                    'غير محدد'
                  }
                </div>
                <div className="text-sm text-orange-600">الانتهاء المتوقع</div>
              </div>
            </div>

            {/* Group Links */}
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  المجموعة المصدر
                </h3>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600 dark:text-slate-400 break-all">
                    {order.groupLink}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(order.groupLink, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
                {order.sourceGroupInfo && (
                  <div className="mt-2 text-xs text-slate-500">
                    <p>العنوان: {order.sourceGroupInfo.title}</p>
                    <p>الأعضاء: {order.sourceGroupInfo.memberCount?.toLocaleString()}</p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  المجموعة المستهدفة
                </h3>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600 dark:text-slate-400 break-all">
                    {order.targetGroupLink}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(order.targetGroupLink, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
                {order.targetGroupInfo && (
                  <div className="mt-2 text-xs text-slate-500">
                    <p>العنوان: {order.targetGroupInfo.title}</p>
                    <p>الأعضاء: {order.targetGroupInfo.memberCount?.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <h3 className="font-semibold mb-2">ملاحظات</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{order.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transfer Monitor */}
        <TransferMonitor 
          order={order} 
          onStatusUpdate={handleOrderUpdate}
        />

        {/* Progress History */}
        {order.progress && order.progress.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>سجل التقدم</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.progress.map((progress, index) => (
                  <div
                    key={progress.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">
                        تم نقل {progress.count.toLocaleString()} عضو
                      </div>
                      {progress.message && (
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {progress.message}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-slate-500">
                      {new Date(progress.createdAt).toLocaleString('ar-SA')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Errors */}
        {order.transferErrors && order.transferErrors.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-red-600">الأخطاء والمشاكل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {order.transferErrors.map((error: any, index: number) => (
                  <div
                    key={index}
                    className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-red-800 dark:text-red-200">
                          العضو: {error.memberId}
                        </div>
                        <div className="text-sm text-red-600 dark:text-red-400">
                          {error.error}
                        </div>
                      </div>
                      <div className="text-xs text-red-500">
                        {new Date(error.timestamp).toLocaleString('ar-SA')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
