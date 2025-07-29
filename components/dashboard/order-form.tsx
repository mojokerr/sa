'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { createOrderSchema } from '@/lib/validations';
import { calculateOrderPrice, validateTelegramLink } from '@/lib/utils';
import { PaymentMethodSelector } from '@/components/payment/PaymentMethodSelector';
import { PaymentMethod } from '@/lib/entities/payment-method.entity';
import { useLanguage } from '@/contexts/language-context';
import { X, Calculator, Clock, DollarSign, CreditCard, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import React from 'react';

type FormData = z.infer<typeof createOrderSchema>;

interface OrderFormProps {
  onClose: () => void;
  onSuccess: () => void;
  userCredits: number;
}

type FormStep = 'details' | 'payment' | 'confirmation';

export function OrderForm({ onClose, onSuccess, userCredits }: OrderFormProps) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [estimatedCredits, setEstimatedCredits] = useState(0);
  const [currentStep, setCurrentStep] = useState<FormStep>('details');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [useCredits, setUseCredits] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      priority: 'NORMAL',
    },
  });

  const watchedValues = watch();

  // Fetch payment methods
  React.useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const response = await fetch('/api/payment-methods');
        if (response.ok) {
          const data = await response.json();
          setPaymentMethods(data.paymentMethods);
          if (data.paymentMethods.length > 0) {
            setSelectedPaymentMethod(data.paymentMethods[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch payment methods:', error);
      }
    };

    if (currentStep === 'payment') {
      fetchPaymentMethods();
    }
  }, [currentStep]);

  // Calculate price when values change
  React.useEffect(() => {
    if (watchedValues.targetCount && watchedValues.targetCount > 0) {
      const price = calculateOrderPrice(watchedValues.targetCount, watchedValues.priority);
      const credits = Math.ceil(price * 100);
      setEstimatedPrice(price);
      setEstimatedCredits(credits);
    } else {
      setEstimatedPrice(0);
      setEstimatedCredits(0);
    }
  }, [watchedValues.targetCount, watchedValues.priority]);

  const handleNextStep = () => {
    if (currentStep === 'details') {
      // Validate form before proceeding
      const isValid = watchedValues.groupLink && 
                     watchedValues.targetCount && 
                     watchedValues.targetCount >= 10 && 
                     watchedValues.targetCount <= 100000 &&
                     validateTelegramLink(watchedValues.groupLink);
      
      if (!isValid) {
        toast.error('Please fill all required fields correctly');
        return;
      }
      
      // Check if user wants to use credits or pay
      if (estimatedCredits <= userCredits) {
        setCurrentStep('confirmation');
      } else {
        setUseCredits(false);
        setCurrentStep('payment');
      }
    } else if (currentStep === 'payment') {
      if (!selectedPaymentMethod) {
        toast.error('Please select a payment method');
        return;
      }
      if (!paymentProofUrl) {
        toast.error('Please upload payment proof');
        return;
      }
      setCurrentStep('confirmation');
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 'payment') {
      setCurrentStep('details');
    } else if (currentStep === 'confirmation') {
      if (useCredits) {
        setCurrentStep('details');
      } else {
        setCurrentStep('payment');
      }
    }
  };

  const onSubmit = async () => {
    const data = watchedValues;
    
    if (!validateTelegramLink(data.groupLink)) {
      toast.error('Please enter a valid Telegram group link');
      return;
    }

    if (useCredits && estimatedCredits > userCredits) {
      toast.error(`Insufficient credits. Required: ${estimatedCredits}, Available: ${userCredits}`);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          paymentMethod: useCredits ? 'credits' : selectedPaymentMethod,
          paymentProofUrl: useCredits ? null : paymentProofUrl,
        }),
      });

      if (response.ok) {
        toast.success('Order created successfully!');
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to create order');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'details':
        return t('dashboard.createOrder');
      case 'payment':
        return 'Payment Details';
      case 'confirmation':
        return 'Confirm Order';
      default:
        return t('dashboard.createOrder');
    }
  };

  const priorityOptions = [
    { value: 'LOW', label: 'Low Priority', multiplier: '0.8x', color: 'bg-gray-100 text-gray-800' },
    { value: 'NORMAL', label: 'Normal Priority', multiplier: '1.0x', color: 'bg-blue-100 text-blue-800' },
    { value: 'HIGH', label: 'High Priority', multiplier: '1.5x', color: 'bg-orange-100 text-orange-800' },
    { value: 'URGENT', label: 'Urgent Priority', multiplier: '2.0x', color: 'bg-red-100 text-red-800' },
  ];

  return (
    <Card className="border-0 shadow-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-purple-600 bg-clip-text text-transparent">
            {getStepTitle()}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Step Indicator */}
        <div className="flex items-center space-x-4 rtl:space-x-reverse mt-4">
          <div className={`flex items-center space-x-2 rtl:space-x-reverse ${
            currentStep === 'details' ? 'text-cyan-600' : 'text-gray-400'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'details' ? 'bg-cyan-100 text-cyan-600' : 'bg-gray-100 text-gray-400'
            }`}>
              1
            </div>
            <span className="text-sm font-medium">Order Details</span>
          </div>
          
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
          
          <div className={`flex items-center space-x-2 rtl:space-x-reverse ${
            currentStep === 'payment' ? 'text-cyan-600' : 'text-gray-400'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'payment' ? 'bg-cyan-100 text-cyan-600' : 'bg-gray-100 text-gray-400'
            }`}>
              2
            </div>
            <span className="text-sm font-medium">Payment</span>
          </div>
          
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
          
          <div className={`flex items-center space-x-2 rtl:space-x-reverse ${
            currentStep === 'confirmation' ? 'text-cyan-600' : 'text-gray-400'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'confirmation' ? 'bg-cyan-100 text-cyan-600' : 'bg-gray-100 text-gray-400'
            }`}>
              3
            </div>
            <span className="text-sm font-medium">Confirmation</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 mr-1" />
            Available Credits: {userCredits.toLocaleString()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Order Details */}
        {currentStep === 'details' && (
          <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="groupLink">{t('form.source.label')} *</Label>
              <Input
                id="groupLink"
                type="url"
                placeholder="https://t.me/groupname"
                {...register('groupLink')}
                className="h-12"
              />
              {errors.groupLink && (
                <p className="text-sm text-red-500">{errors.groupLink.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetCount">{t('form.members.label')} *</Label>
              <Input
                id="targetCount"
                type="number"
                placeholder="1000"
                min="10"
                max="100000"
                {...register('targetCount', { valueAsNumber: true })}
                className="h-12"
              />
              {errors.targetCount && (
                <p className="text-sm text-red-500">{errors.targetCount.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority Level</Label>
            <Select
              value={watchedValues.priority}
              onValueChange={(value) => setValue('priority', value as any)}
            >
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center justify-between w-full">
                      <span>{option.label}</span>
                      <div className="flex items-center space-x-2 ml-4">
                        <Badge className={option.color}>{option.multiplier}</Badge>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t('dashboard.notes')}</Label>
            <Textarea
              id="notes"
              placeholder={t('dashboard.notesPlaceholder')}
              {...register('notes')}
              rows={3}
            />
            {errors.notes && (
              <p className="text-sm text-red-500">{errors.notes.message}</p>
            )}
          </div>
          </div>
        )}

        {/* Step 2: Payment */}
        {currentStep === 'payment' && (
          <div className="space-y-6">
            <PaymentMethodSelector
              paymentMethods={paymentMethods}
              selectedMethodId={selectedPaymentMethod}
              onMethodSelect={setSelectedPaymentMethod}
              onProofUpload={setPaymentProofUrl}
              totalAmount={estimatedPrice}
              currency="USD"
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Step 3: Confirmation */}
        {currentStep === 'confirmation' && (
          <div className="space-y-6">
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-4">
                  Order Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Group:</span>
                    <span className="font-medium">{watchedValues.groupLink}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Members:</span>
                    <span className="font-medium">{watchedValues.targetCount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Priority:</span>
                    <span className="font-medium">{watchedValues.priority}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Payment Method:</span>
                    <span className="font-medium">
                      {useCredits ? 'Credits' : paymentMethods.find(m => m.id === selectedPaymentMethod)?.name}
                    </span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-green-600 dark:text-green-400">
                        {useCredits ? `${estimatedCredits.toLocaleString()} Credits` : `$${estimatedPrice.toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Price Estimation (shown on details step) */}
        {currentStep === 'details' && (
          {estimatedPrice > 0 && (
            <Card className="bg-gradient-to-r from-cyan-50 to-purple-50 dark:from-cyan-900/20 dark:to-purple-900/20 border-cyan-200 dark:border-cyan-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calculator className="h-5 w-5 text-cyan-600" />
                    <span className="font-medium text-slate-900 dark:text-white">
                      Estimated Cost
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-cyan-600">
                      {estimatedCredits.toLocaleString()} Credits
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      ${estimatedPrice.toFixed(2)} USD
                    </p>
                  </div>
                </div>
                {estimatedCredits > userCredits && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      ⚠️ Insufficient credits. You need {(estimatedCredits - userCredits).toLocaleString()} more credits.
                    </p>
                  </div>
                )}
                
                {/* Payment Option Toggle */}
                {estimatedCredits <= userCredits && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                          You have enough credits for this order
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          You can pay with credits or choose another payment method
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setUseCredits(!useCredits)}
                        className="text-blue-600 border-blue-300 hover:bg-blue-100"
                      >
                        {useCredits ? 'Pay with Money' : 'Use Credits'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between space-x-4 rtl:space-x-reverse">
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === 'details' ? onClose : handlePrevStep}
            disabled={isLoading}
            className="flex items-center space-x-2 rtl:space-x-reverse"
          >
            {currentStep !== 'details' && (
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            )}
            <span>
              {currentStep === 'details' ? t('common.cancel') : 'Back'}
            </span>
          </Button>
          
          {currentStep === 'confirmation' ? (
            <Button
              onClick={onSubmit}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
              disabled={isLoading}
            >
              {isLoading ? t('common.loading') : 'Create Order'}
            </Button>
          ) : (
            <Button
              onClick={handleNextStep}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
              disabled={isLoading || (currentStep === 'details' && !useCredits && estimatedCredits > userCredits)}
            >
              <span>Next</span>
              <ArrowRight className="h-4 w-4 ml-2 rtl:mr-2 rtl:ml-0 rtl:rotate-180" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}