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
import { useLanguage } from '@/contexts/language-context';
import { X, Calculator, Clock, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

type FormData = z.infer<typeof createOrderSchema>;

interface OrderFormProps {
  onClose: () => void;
  onSuccess: () => void;
  userCredits: number;
}

export function OrderForm({ onClose, onSuccess, userCredits }: OrderFormProps) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [estimatedCredits, setEstimatedCredits] = useState(0);

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

  const onSubmit = async (data: FormData) => {
    if (!validateTelegramLink(data.groupLink)) {
      toast.error('Please enter a valid Telegram group link');
      return;
    }

    if (estimatedCredits > userCredits) {
      toast.error(`Insufficient credits. Required: ${estimatedCredits}, Available: ${userCredits}`);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
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
            {t('dashboard.createOrder')}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 mr-1" />
            Available Credits: {userCredits.toLocaleString()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

          {/* Price Estimation */}
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
              </CardContent>
            </Card>
          )}

          <div className="flex space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
              disabled={isLoading || estimatedCredits > userCredits}
            >
              {isLoading ? t('common.loading') : t('dashboard.createOrder')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}