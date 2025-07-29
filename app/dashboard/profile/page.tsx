'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Navbar } from '@/components/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/language-context';
import { updateProfileSchema } from '@/lib/validations';
import { 
  User, 
  Settings, 
  Bell, 
  Key, 
  Shield, 
  CreditCard,
  Save,
  RefreshCw,
  Trash2,
  Plus,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

type ProfileFormData = z.infer<typeof updateProfileSchema>;

interface ApiKey {
  id: string;
  name: string;
  key: string;
  isActive: boolean;
  lastUsed?: string;
  createdAt: string;
  expiresAt?: string;
}

interface NotificationSettings {
  orderUpdates: boolean;
  systemNotifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const { t, language, setLanguage } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [notifications, setNotifications] = useState<NotificationSettings>({
    orderUpdates: true,
    systemNotifications: true,
    emailNotifications: false,
    pushNotifications: false
  });
  const [showApiKey, setShowApiKey] = useState<{ [key: string]: boolean }>({});

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      language: 'ar',
      theme: 'dark'
    }
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && session?.user) {
      // Set form values
      setValue('name', session.user.name || '');
      setValue('email', session.user.email || '');
      setValue('language', language);
      
      fetchApiKeys();
      fetchNotificationSettings();
    }
  }, [status, session, router, setValue, language]);

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/profile/api-keys');
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.apiKeys);
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    }
  };

  const fetchNotificationSettings = async () => {
    try {
      const response = await fetch('/api/profile/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to fetch notification settings:', error);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        // Update language if changed
        if (data.language !== language) {
          setLanguage(data.language);
        }
        
        // Update session
        await update();
        
        toast.success('تم حفظ الإعدادات بنجاح');
      } else {
        const error = await response.json();
        toast.error(error.error || 'فشل في حفظ الإعدادات');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    const name = prompt('أدخل اسم المفتاح:');
    if (!name) return;

    try {
      const response = await fetch('/api/profile/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });

      if (response.ok) {
        toast.success('تم إنشاء مفتاح API بنجاح');
        fetchApiKeys();
      } else {
        const error = await response.json();
        toast.error(error.error || 'فشل في إنشاء المفتاح');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إنشاء المفتاح');
    }
  };

  const deleteApiKey = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المفتاح؟')) return;

    try {
      const response = await fetch(`/api/profile/api-keys/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('تم حذف المفتاح بنجاح');
        fetchApiKeys();
      } else {
        toast.error('فشل في حذف المفتاح');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  const copyApiKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('تم نسخ المفتاح');
  };

  const updateNotifications = async (settings: NotificationSettings) => {
    try {
      const response = await fetch('/api/profile/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        setNotifications(settings);
        toast.success('تم حفظ إعدادات الإشعارات');
      }
    } catch (error) {
      toast.error('فشل في حفظ الإعدادات');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <Navbar />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-purple-600 bg-clip-text text-transparent">
            إعدادات الملف الشخصي
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            إدارة حسابك وإعداداتك الشخصية
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>الملف الشخصي</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span>الإشعارات</span>
            </TabsTrigger>
            <TabsTrigger value="api-keys" className="flex items-center space-x-2">
              <Key className="h-4 w-4" />
              <span>مفاتيح API</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>الأمان</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>المعلومات الشخصية</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">الاسم الكامل</Label>
                          <Input
                            id="name"
                            {...register('name')}
                            placeholder="أدخل اسمك الكامل"
                          />
                          {errors.name && (
                            <p className="text-sm text-red-500">{errors.name.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">البريد الإلكتروني</Label>
                          <Input
                            id="email"
                            type="email"
                            {...register('email')}
                            placeholder="example@domain.com"
                          />
                          {errors.email && (
                            <p className="text-sm text-red-500">{errors.email.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone">رقم الهاتف</Label>
                          <Input
                            id="phone"
                            {...register('phone')}
                            placeholder="+966501234567"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="country">البلد</Label>
                          <Input
                            id="country"
                            {...register('country')}
                            placeholder="المملكة العربية السعودية"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>اللغة</Label>
                          <Select
                            value={watch('language')}
                            onValueChange={(value) => setValue('language', value as 'ar' | 'en')}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ar">العربية</SelectItem>
                              <SelectItem value="en">English</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>المظهر</Label>
                          <Select
                            value={watch('theme')}
                            onValueChange={(value) => setValue('theme', value as 'light' | 'dark' | 'system')}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="light">فاتح</SelectItem>
                              <SelectItem value="dark">داكن</SelectItem>
                              <SelectItem value="system">النظام</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={loading}
                        className="bg-gradient-to-r from-cyan-500 to-purple-600"
                      >
                        {loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                        <Save className="h-4 w-4 mr-2" />
                        حفظ التغييرات
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>معلومات الحساب</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">الاشتراك</span>
                      <Badge variant="outline">{session?.user?.subscription}</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">الرصيد</span>
                      <span className="font-medium">{session?.user?.credits} كريديت</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">تاريخ الانضمام</span>
                      <span className="text-sm">
                        {new Date().toLocaleDateString('ar-SA')}
                      </span>
                    </div>

                    <Button variant="outline" className="w-full">
                      <CreditCard className="h-4 w-4 mr-2" />
                      إدارة الاشتراك
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات الإشعارات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">تحديثات الطلبات</h3>
                    <p className="text-sm text-slate-600">إشعارات عند تغيير حالة ��لطلبات</p>
                  </div>
                  <Switch
                    checked={notifications.orderUpdates}
                    onCheckedChange={(checked) =>
                      updateNotifications({ ...notifications, orderUpdates: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">إشعارات النظام</h3>
                    <p className="text-sm text-slate-600">إشعارات مهمة من النظام</p>
                  </div>
                  <Switch
                    checked={notifications.systemNotifications}
                    onCheckedChange={(checked) =>
                      updateNotifications({ ...notifications, systemNotifications: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">البريد الإلكتروني</h3>
                    <p className="text-sm text-slate-600">إرسال الإشعارات عبر البريد</p>
                  </div>
                  <Switch
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) =>
                      updateNotifications({ ...notifications, emailNotifications: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">الإشعارات الفورية</h3>
                    <p className="text-sm text-slate-600">إشعارات المتصفح الفورية</p>
                  </div>
                  <Switch
                    checked={notifications.pushNotifications}
                    onCheckedChange={(checked) =>
                      updateNotifications({ ...notifications, pushNotifications: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api-keys">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>مفاتيح API</CardTitle>
                  <Button onClick={createApiKey}>
                    <Plus className="h-4 w-4 mr-2" />
                    إنشاء مفتاح جديد
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {apiKeys.map((apiKey) => (
                    <div
                      key={apiKey.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium">{apiKey.name}</h3>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse mt-1">
                          <code className="text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                            {showApiKey[apiKey.id] ? apiKey.key : '••••••••••••••••'}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowApiKey(prev => ({
                              ...prev,
                              [apiKey.id]: !prev[apiKey.id]
                            }))}
                          >
                            {showApiKey[apiKey.id] ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyApiKey(apiKey.key)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          آخر استخدام: {apiKey.lastUsed ? 
                            new Date(apiKey.lastUsed).toLocaleDateString('ar-SA') : 
                            'لم يستخدم بعد'
                          }
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Badge variant={apiKey.isActive ? 'default' : 'secondary'}>
                          {apiKey.isActive ? 'نشط' : 'معطل'}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteApiKey(apiKey.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {apiKeys.length === 0 && (
                    <p className="text-center text-slate-600 py-8">
                      لا توجد مفاتيح API. أنشئ مفتاحاً جديداً للبدء.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات الأمان</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">تغيير كلمة المرور</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    قم بتحديث كلمة المرور لحماية حسابك
                  </p>
                  <Button variant="outline">
                    تغيير كلمة المرور
                  </Button>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">المصادقة الثنائية</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    أضف طبقة حماية إضافية لحسابك
                  </p>
                  <Button variant="outline">
                    تفعيل المصادقة الثنائية
                  </Button>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2 text-red-600">حذف الحساب</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    حذف نهائي لحسابك وجميع البيانات المرتبطة به
                  </p>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    حذف الحساب
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
