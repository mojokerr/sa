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
  Wallet
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'vodafone_cash' | 'usdt_trc20' | 'redotpay' | 'manual';
  details: Record<string, any>;
  is_active: boolean;
}

interface PaymentMethodSelectorProps {
  paymentMethods: PaymentMethod[];
  selectedMethodId: string;
  onMethodSelect: (methodId: string) => void;
  onProofUpload: (proofUrl: string) => void;
  totalAmount: number;
  currency: string;
}

export function PaymentMethodSelector({
  paymentMethods,
  selectedMethodId,
  onMethodSelect,
  onProofUpload,
  totalAmount,
  currency
}: PaymentMethodSelectorProps) {
  const [copiedField, setCopiedField] = useState<string>('');
  const [uploadedProof, setUploadedProof] = useState<File | null>(null);

  const selectedMethod = paymentMethods.find(method => method.id === selectedMethodId);

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'vodafone_cash':
        return <Smartphone className="h-5 w-5 text-red-500" />;
      case 'usdt_trc20':
        return <DollarSign className="h-5 w-5 text-green-500" />;
      case 'redotpay':
        return <CreditCard className="h-5 w-5 text-blue-500" />;
      default:
        return <Wallet className="h-5 w-5 text-gray-500" />;
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedProof(file);
      // In a real app, you would upload the file to a server and get a URL
      // For demo purposes, we'll just use the file name
      onProofUpload(`proof_${Date.now()}_${file.name}`);
    }
  };

  const formatAmount = (amount: number, curr: string) => {
    if (curr === 'EGP') {
      return `${amount.toFixed(2)} ج.م`;
    }
    return `${amount.toFixed(2)} ${curr}`;
  };

  return (
    <div className="space-y-4">
      {/* Payment Method Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paymentMethods.map((method) => (
          <Card
            key={method.id}
            className={`cursor-pointer transition-all duration-200 ${
              selectedMethodId === method.id
                ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'hover:shadow-md'
            }`}
            onClick={() => onMethodSelect(method.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                {getMethodIcon(method.type)}
                <div className="flex-1">
                  <h3 className="font-semibold">{method.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {method.type === 'vodafone_cash' && 'محفظة فودافون كاش'}
                    {method.type === 'usdt_trc20' && 'عملة رقمية USDT'}
                    {method.type === 'redotpay' && 'محفظة RedotPay'}
                    {method.type === 'manual' && 'طريقة دفع يدوية'}
                  </p>
                </div>
                {selectedMethodId === method.id && (
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment Details */}
      {selectedMethod && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
              {getMethodIcon(selectedMethod.type)}
              <span>تفاصيل الدفع - {selectedMethod.name}</span>
            </CardTitle>
            <CardDescription>
              المبلغ المطلوب: <span className="font-bold text-blue-600">{formatAmount(totalAmount, currency)}</span>
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Vodafone Cash */}
            {selectedMethod.type === 'vodafone_cash' && (
              <div className="space-y-3">
                <Alert>
                  <Smartphone className="h-4 w-4" />
                  <AlertDescription>
                    قم بتحويل المبلغ إلى رقم فودافون كاش التالي:
                  </AlertDescription>
                </Alert>
                
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">رقم المحفظة</Label>
                      <p className="text-lg font-mono">{selectedMethod.details.phone}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(selectedMethod.details.phone, 'phone')}
                    >
                      {copiedField === 'phone' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="mt-2">
                    <Label className="text-sm font-medium">اسم المستلم</Label>
                    <p className="text-sm text-muted-foreground">{selectedMethod.details.name}</p>
                  </div>
                </div>
              </div>
            )}

            {/* USDT TRC20 */}
            {selectedMethod.type === 'usdt_trc20' && (
              <div className="space-y-3">
                <Alert>
                  <DollarSign className="h-4 w-4" />
                  <AlertDescription>
                    قم بإرسال USDT على شبكة TRC20 إلى العنوان التالي:
                  </AlertDescription>
                </Alert>
                
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label className="text-sm font-medium">عنوان المحفظة</Label>
                      <p className="text-sm font-mono break-all">{selectedMethod.details.address}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(selectedMethod.details.address, 'address')}
                    >
                      {copiedField === 'address' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="mt-2">
                    <Label className="text-sm font-medium">الشبكة</Label>
                    <p className="text-sm text-muted-foreground">{selectedMethod.details.network}</p>
                  </div>
                  
                  <Badge variant="outline" className="mt-2">
                    <AlertCircle className="h-3 w-3 mr-1 rtl:ml-1 rtl:mr-0" />
                    تأكد من استخدام شبكة TRC20 فقط
                  </Badge>
                </div>
              </div>
            )}

            {/* RedotPay */}
            {selectedMethod.type === 'redotpay' && (
              <div className="space-y-3">
                <Alert>
                  <CreditCard className="h-4 w-4" />
                  <AlertDescription>
                    قم بإرسال المبلغ عبر RedotPay إلى البيانات التالية:
                  </AlertDescription>
                </Alert>
                
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">البريد الإلكتروني</Label>
                        <p className="text-sm">{selectedMethod.details.email}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(selectedMethod.details.email, 'email')}
                      >
                        {copiedField === 'email' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">معرف التاجر</Label>
                      <p className="text-sm text-muted-foreground">{selectedMethod.details.merchant_id}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Proof Upload */}
            <div className="space-y-3">
              <Label htmlFor="payment-proof">رفع إثبات الدفع *</Label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  اختر صورة إثبات الدفع أو اسحبها هنا
                </p>
                <Input
                  id="payment-proof"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('payment-proof')?.click()}
                >
                  اختر ملف
                </Button>
                
                {uploadedProof && (
                  <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-700 dark:text-green-300">
                        تم رفع الملف: {uploadedProof.name}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                يرجى رفع صورة واضحة لإثبات الدفع (لقطة شاشة من التطبيق أو إيصال)
              </p>
            </div>

            {/* Instructions */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>تعليمات مهمة:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>تأكد من إرسال المبلغ الصحيح بالضبط</li>
                  <li>احتفظ بإثبات الدفع حتى اكتمال الطلب</li>
                  <li>سيتم مراجعة الدفع خلال 30 دقيقة</li>
                  <li>في حالة وجود مشكلة، تواصل مع الدعم الفني</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

