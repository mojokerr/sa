'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  Smartphone, 
  DollarSign, 
  Copy, 
  CheckCircle, 
  Upload,
  AlertCircle,
  Wallet,
  Image as ImageIcon
} from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { PaymentMethod, PaymentMethodType } from '@/lib/entities/payment-method.entity';
import { toast } from 'sonner';

interface PaymentMethodSelectorProps {
  paymentMethods: PaymentMethod[];
  selectedMethodId: string;
  onMethodSelect: (methodId: string) => void;
  onProofUpload: (proofUrl: string) => void;
  totalAmount: number;
  currency: string;
  isLoading?: boolean;
}

export function PaymentMethodSelector({
  paymentMethods,
  selectedMethodId,
  onMethodSelect,
  onProofUpload,
  totalAmount,
  currency,
  isLoading = false
}: PaymentMethodSelectorProps) {
  const { t, language } = useLanguage();
  const [copiedField, setCopiedField] = useState<string>('');
  const [uploadedProof, setUploadedProof] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const selectedMethod = paymentMethods.find(method => method.id === selectedMethodId);

  const getMethodIcon = (type: PaymentMethodType) => {
    switch (type) {
      case PaymentMethodType.VODAFONE_CASH:
        return <Smartphone className="h-5 w-5 text-red-500" />;
      case PaymentMethodType.USDT_TRC20:
        return <DollarSign className="h-5 w-5 text-green-500" />;
      case PaymentMethodType.REDOTPAY:
        return <CreditCard className="h-5 w-5 text-blue-500" />;
      default:
        return <Wallet className="h-5 w-5 text-gray-500" />;
    }
  };

  const getMethodName = (type: PaymentMethodType) => {
    const names = {
      [PaymentMethodType.VODAFONE_CASH]: language === 'ar' ? 'محفظة فودافون كاش' : 'Vodafone Cash',
      [PaymentMethodType.USDT_TRC20]: language === 'ar' ? 'عملة رقمية USDT' : 'USDT Cryptocurrency',
      [PaymentMethodType.REDOTPAY]: language === 'ar' ? 'محفظة RedotPay' : 'RedotPay Wallet',
      [PaymentMethodType.MANUAL]: language === 'ar' ? 'طريقة دفع يدوية' : 'Manual Payment'
    };
    return names[type];
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(language === 'ar' ? 'تم النسخ بنجاح' : 'Copied successfully');
      setTimeout(() => setCopiedField(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error(language === 'ar' ? 'فشل في النسخ' : 'Failed to copy');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(language === 'ar' ? 'يرجى اختيار ملف صورة فقط' : 'Please select an image file only');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(language === 'ar' ? 'حجم الملف كبير جداً (الحد الأقصى 5 ميجابايت)' : 'File size too large (max 5MB)');
      return;
    }

    setUploading(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'payment_proof');

      // Upload file to server
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setUploadedProof(file);
      onProofUpload(data.url);
      toast.success(language === 'ar' ? 'تم رفع الملف بنجاح' : 'File uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(language === 'ar' ? 'فشل في رفع الملف' : 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const formatAmount = (amount: number, curr: string) => {
    if (curr === 'EGP') {
      return `${amount.toFixed(2)} ج.م`;
    }
    if (curr === 'USD') {
      return `$${amount.toFixed(2)}`;
    }
    return `${amount.toFixed(2)} ${curr}`;
  };

  if (paymentMethods.length === 0) {
    return (
      <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {language === 'ar' ? 'لا توجد طرق دفع متاحة' : 'No Payment Methods Available'}
          </h3>
          <p className="text-muted-foreground">
            {language === 'ar' 
              ? 'يرجى التواصل مع الدعم الفني لإضافة طرق الدفع'
              : 'Please contact support to add payment methods'
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Method Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          {language === 'ar' ? 'اختر طريقة الدفع' : 'Select Payment Method'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentMethods.filter(method => method.is_active).map((method) => (
            <Card
              key={method.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedMethodId === method.id
                  ? 'ring-2 ring-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200'
                  : 'hover:border-gray-300 dark:hover:border-gray-600'
              } ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
              onClick={() => !isLoading && onMethodSelect(method.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  {getMethodIcon(method.type)}
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 dark:text-white">
                      {method.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {getMethodName(method.type)}
                    </p>
                  </div>
                  {selectedMethodId === method.id && (
                    <CheckCircle className="h-5 w-5 text-cyan-500" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Payment Details */}
      {selectedMethod && (
        <Card className="border-cyan-200 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
              {getMethodIcon(selectedMethod.type)}
              <span>
                {language === 'ar' 
                  ? `تفاصيل الدفع - ${selectedMethod.name}`
                  : `Payment Details - ${selectedMethod.name}`
                }
              </span>
            </CardTitle>
            <CardDescription className="text-lg">
              {language === 'ar' ? 'المبلغ المطلوب:' : 'Amount Required:'}{' '}
              <span className="font-bold text-cyan-600 dark:text-cyan-400">
                {formatAmount(totalAmount, currency)}
              </span>
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Vodafone Cash */}
            {selectedMethod.type === PaymentMethodType.VODAFONE_CASH && (
              <div className="space-y-4">
                <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
                  <Smartphone className="h-4 w-4" />
                  <AlertDescription>
                    {language === 'ar' 
                      ? 'قم بتحويل المبلغ إلى رقم فودافون كاش التالي:'
                      : 'Transfer the amount to the following Vodafone Cash number:'
                    }
                  </AlertDescription>
                </Alert>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {language === 'ar' ? 'رقم المحفظة' : 'Wallet Number'}
                        </Label>
                        <p className="text-xl font-mono font-bold text-gray-900 dark:text-white">
                          {selectedMethod.details.phone}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(selectedMethod.details.phone || '', 'phone')}
                        className="flex items-center space-x-1 rtl:space-x-reverse"
                      >
                        {copiedField === 'phone' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        <span className="text-xs">
                          {language === 'ar' ? 'نسخ' : 'Copy'}
                        </span>
                      </Button>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {language === 'ar' ? 'اسم المستلم' : 'Recipient Name'}
                      </Label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedMethod.details.name}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* USDT TRC20 */}
            {selectedMethod.type === PaymentMethodType.USDT_TRC20 && (
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                  <DollarSign className="h-4 w-4" />
                  <AlertDescription>
                    {language === 'ar' 
                      ? 'قم بإرسال USDT على شبكة TRC20 إلى العنوان التالي:'
                      : 'Send USDT on TRC20 network to the following address:'
                    }
                  </AlertDescription>
                </Alert>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {language === 'ar' ? 'عنوان المحفظة' : 'Wallet Address'}
                        </Label>
                        <p className="text-sm font-mono break-all bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1">
                          {selectedMethod.details.address}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(selectedMethod.details.address || '', 'address')}
                        className="flex items-center space-x-1 rtl:space-x-reverse ml-2 rtl:mr-2 rtl:ml-0"
                      >
                        {copiedField === 'address' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        <span className="text-xs">
                          {language === 'ar' ? 'نسخ' : 'Copy'}
                        </span>
                      </Button>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {language === 'ar' ? 'الشبكة' : 'Network'}
                      </Label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedMethod.details.network}
                      </p>
                    </div>
                    
                    <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300">
                      <AlertCircle className="h-3 w-3 mr-1 rtl:ml-1 rtl:mr-0" />
                      {language === 'ar' 
                        ? 'تأكد من استخدام شبكة TRC20 فقط'
                        : 'Make sure to use TRC20 network only'
                      }
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {/* RedotPay */}
            {selectedMethod.type === PaymentMethodType.REDOTPAY && (
              <div className="space-y-4">
                <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                  <CreditCard className="h-4 w-4" />
                  <AlertDescription>
                    {language === 'ar' 
                      ? 'قم بإرسال المبلغ عبر RedotPay إلى البيانات التالية:'
                      : 'Send the amount via RedotPay to the following details:'
                    }
                  </AlertDescription>
                </Alert>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                        </Label>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {selectedMethod.details.email}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(selectedMethod.details.email || '', 'email')}
                        className="flex items-center space-x-1 rtl:space-x-reverse"
                      >
                        {copiedField === 'email' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        <span className="text-xs">
                          {language === 'ar' ? 'نسخ' : 'Copy'}
                        </span>
                      </Button>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {language === 'ar' ? 'معرف التاجر' : 'Merchant ID'}
                      </Label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedMethod.details.merchant_id}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Proof Upload */}
            <div className="space-y-4">
              <Label htmlFor="payment-proof" className="text-base font-semibold">
                {language === 'ar' ? 'رفع إثبات الدفع *' : 'Upload Payment Proof *'}
              </Label>
              
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-cyan-400 dark:hover:border-cyan-500 transition-colors">
                <div className="space-y-4">
                  <div className="flex justify-center">
                    {uploadedProof ? (
                      <ImageIcon className="h-12 w-12 text-green-500" />
                    ) : (
                      <Upload className="h-12 w-12 text-gray-400" />
                    )}
                  </div>
                  
                  <div>
                    <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {language === 'ar' 
                        ? 'اختر صورة إثبات الدفع أو اسحبها هنا'
                        : 'Choose payment proof image or drag it here'
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' 
                        ? 'PNG, JPG, JPEG حتى 5 ميجابايت'
                        : 'PNG, JPG, JPEG up to 5MB'
                      }
                    </p>
                  </div>
                  
                  <Input
                    id="payment-proof"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('payment-proof')?.click()}
                    disabled={uploading}
                    className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {uploading ? (
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>{language === 'ar' ? 'جاري الرفع...' : 'Uploading...'}</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                        {language === 'ar' ? 'اختر ملف' : 'Choose File'}
                      </>
                    )}
                  </Button>
                  
                  {uploadedProof && (
                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-green-700 dark:text-green-300">
                            {language === 'ar' ? 'تم رفع الملف بنجاح' : 'File uploaded successfully'}
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400 truncate">
                            {uploadedProof.name}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                {language === 'ar' 
                  ? 'يرجى رفع صورة واضحة لإثبات الدفع (لقطة شاشة من التطبيق أو إيصال)'
                  : 'Please upload a clear image of payment proof (screenshot from app or receipt)'
                }
              </p>
            </div>

            {/* Instructions */}
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">
                    {language === 'ar' ? 'تعليمات مهمة:' : 'Important Instructions:'}
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>
                      {language === 'ar' 
                        ? 'تأكد من إرسال المبلغ الصحيح بالضبط'
                        : 'Make sure to send the exact correct amount'
                      }
                    </li>
                    <li>
                      {language === 'ar' 
                        ? 'احتفظ بإثبات الدفع حتى اكتمال الطلب'
                        : 'Keep payment proof until order completion'
                      }
                    </li>
                    <li>
                      {language === 'ar' 
                        ? 'سيتم مراجعة الدفع خلال 30 دقيقة'
                        : 'Payment will be reviewed within 30 minutes'
                      }
                    </li>
                    <li>
                      {language === 'ar' 
                        ? 'في حالة وجود مشكلة، تواصل مع الدعم الفني'
                        : 'In case of any issue, contact technical support'
                      }
                    </li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}