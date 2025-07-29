'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Pause, 
  Square, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Activity
} from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { toast } from 'sonner';

interface TransferProgress {
  total: number;
  completed: number;
  failed: number;
  skipped: number;
  currentBatch: number;
  status: 'preparing' | 'transferring' | 'completed' | 'failed' | 'paused';
  errors: Array<{
    memberId: string;
    error: string;
    timestamp: Date;
  }>;
}

interface Order {
  id: string;
  groupLink: string;
  targetGroupLink: string;
  targetCount: number;
  currentCount: number;
  status: string;
  priority: string;
  estimatedCompletion?: string;
  startedAt?: string;
  progress?: Array<{
    count: number;
    message?: string;
    createdAt: string;
  }>;
}

interface TransferMonitorProps {
  order: Order;
  onStatusUpdate?: (order: Order) => void;
}

export function TransferMonitor({ order, onStatusUpdate }: TransferMonitorProps) {
  const { t } = useLanguage();
  const [isTransferring, setIsTransferring] = useState(false);
  const [progress, setProgress] = useState<TransferProgress | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const progressPercentage = order.targetCount > 0 
    ? Math.round((order.currentCount / order.targetCount) * 100) 
    : 0;

  // Poll for updates when transfer is active
  useEffect(() => {
    if (order.status === 'PROCESSING') {
      const interval = setInterval(fetchOrderStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [order.status, order.id]);

  const fetchOrderStatus = async () => {
    try {
      const response = await fetch(`/api/orders/${order.id}`);
      if (response.ok) {
        const updatedOrder = await response.json();
        onStatusUpdate?.(updatedOrder);
      }
    } catch (error) {
      console.error('Failed to fetch order status:', error);
    }
  };

  const startTransfer = async () => {
    setIsTransferring(true);
    addLog('🚀 بدء عملية نقل الأعضاء...');

    try {
      const response = await fetch('/api/telegram/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          sourceGroupLink: order.groupLink,
          targetGroupLink: order.targetGroupLink,
          memberLimit: order.targetCount,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        addLog('✅ تم بدء النقل بنجاح');
        toast.success('تم بدء عملية النقل');
      } else {
        const error = await response.json();
        addLog(`❌ فشل في بدء النقل: ${error.error}`);
        toast.error(error.error);
      }
    } catch (error) {
      addLog(`❌ خطأ في النظام: ${error}`);
      toast.error('حدث خطأ في النظام');
    } finally {
      setIsTransferring(false);
    }
  };

  const validateGroups = async () => {
    setRefreshing(true);
    addLog('🔍 فحص المجموعات...');

    try {
      const [sourceValidation, targetValidation] = await Promise.all([
        fetch(`/api/telegram/transfer?groupLink=${encodeURIComponent(order.groupLink)}`),
        fetch(`/api/telegram/transfer?groupLink=${encodeURIComponent(order.targetGroupLink)}`),
      ]);

      if (sourceValidation.ok && targetValidation.ok) {
        const sourceData = await sourceValidation.json();
        const targetData = await targetValidation.json();

        addLog(`📊 المجموعة المصدر: ${sourceData.groupInfo?.title || 'غير معروف'} (${sourceData.groupInfo?.memberCount || 0} عضو)`);
        addLog(`📊 المجموعة المستهدفة: ${targetData.groupInfo?.title || 'غير معروف'} (${targetData.groupInfo?.memberCount || 0} عضو)`);

        if (!sourceData.validation.canAccess) {
          addLog('⚠️ تحذير: لا يمكن الوصول للمجموعة المصدر');
        }
        if (!targetData.validation.canInvite) {
          addLog('⚠️ تحذير: لا يمكن دعوة أعضاء للمجموعة المستهدفة');
        }

        toast.success('تم فحص المجموعات بنجاح');
      } else {
        addLog('❌ فشل في فحص المجموعات');
        toast.error('فشل في فحص المجموعات');
      }
    } catch (error) {
      addLog(`❌ خطأ في فحص المجموعات: ${error}`);
      toast.error('خطأ في فحص المجموعات');
    } finally {
      setRefreshing(false);
    }
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('ar-SA');
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
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

  return (
    <div className="space-y-6">
      {/* Order Status Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">مراقبة عملية النقل</CardTitle>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(order.status)}>
                {order.status}
              </Badge>
              <Badge className={getPriorityColor(order.priority)}>
                {order.priority}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">التقدم</span>
              <span className="text-sm text-muted-foreground">
                {order.currentCount.toLocaleString()} / {order.targetCount.toLocaleString()} أعضاء
              </span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            <div className="text-center text-lg font-bold text-cyan-600">
              {progressPercentage}%
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Users className="h-6 w-6 mx-auto mb-1 text-blue-600" />
              <div className="text-lg font-bold text-blue-600">{order.currentCount.toLocaleString()}</div>
              <div className="text-xs text-blue-600">تم النقل</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <Activity className="h-6 w-6 mx-auto mb-1 text-purple-600" />
              <div className="text-lg font-bold text-purple-600">{order.targetCount.toLocaleString()}</div>
              <div className="text-xs text-purple-600">الهدف</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-6 w-6 mx-auto mb-1 text-green-600" />
              <div className="text-lg font-bold text-green-600">{progressPercentage}%</div>
              <div className="text-xs text-green-600">مكتمل</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <Clock className="h-6 w-6 mx-auto mb-1 text-orange-600" />
              <div className="text-lg font-bold text-orange-600">
                {order.estimatedCompletion ? 
                  new Date(order.estimatedCompletion).toLocaleDateString('ar-SA') : 
                  'غير محدد'
                }
              </div>
              <div className="text-xs text-orange-600">الانتهاء المتوقع</div>
            </div>
          </div>

          {/* Group Links */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <h4 className="font-medium mb-2">المجموعة المصدر</h4>
              <p className="text-sm text-slate-600 break-all">{order.groupLink}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <h4 className="font-medium mb-2">المجموعة المستهدفة</h4>
              <p className="text-sm text-slate-600 break-all">{order.targetGroupLink}</p>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex flex-wrap gap-3">
            {order.status === 'PENDING' && (
              <Button
                onClick={startTransfer}
                disabled={isTransferring}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              >
                <Play className="h-4 w-4 mr-2" />
                {isTransferring ? 'جاري البدء...' : 'بدء النقل'}
              </Button>
            )}
            
            <Button
              onClick={validateGroups}
              disabled={refreshing}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              فحص المجموعات
            </Button>

            <Button
              onClick={fetchOrderStatus}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              تحديث الحالة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">سجل العمليات</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64 w-full">
            <div className="space-y-1">
              {logs.length === 0 ? (
                <p className="text-slate-500 text-center py-8">لا توجد عمليات بعد</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="p-2 bg-slate-50 rounded text-sm font-mono">
                    {log}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
