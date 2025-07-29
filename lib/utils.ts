import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'bg_';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function calculateOrderPrice(memberCount: number, priority: string = 'NORMAL'): number {
  const basePrice = 0.01; // $0.01 per member
  const priorityMultiplier = {
    LOW: 0.8,
    NORMAL: 1.0,
    HIGH: 1.5,
    URGENT: 2.0,
  };
  
  return memberCount * basePrice * (priorityMultiplier[priority as keyof typeof priorityMultiplier] || 1.0);
}

export function getOrderStatusColor(status: string): string {
  const colors = {
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    PROCESSING: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    FAILED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    PAUSED: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  };
  
  return colors[status as keyof typeof colors] || colors.PENDING;
}

export function getPriorityColor(priority: string): string {
  const colors = {
    LOW: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    NORMAL: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    URGENT: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };
  
  return colors[priority as keyof typeof colors] || colors.NORMAL;
}

export function getSubscriptionColor(subscription: string): string {
  const colors = {
    FREE: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    BASIC: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    PRO: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    ENTERPRISE: 'bg-gold-100 text-gold-800 dark:bg-gold-900 dark:text-gold-300',
  };
  
  return colors[subscription as keyof typeof colors] || colors.FREE;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function validateTelegramLink(url: string): boolean {
  const telegramRegex = /^https?:\/\/(t\.me|telegram\.me)\/[a-zA-Z0-9_]+$/;
  return telegramRegex.test(url);
}

export function extractGroupName(url: string): string {
  const match = url.match(/(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]+)/);
  return match ? match[1] : '';
}

export function calculateProgress(current: number, target: number): number {
  if (target === 0) return 0;
  return Math.min((current / target) * 100, 100);
}

export function estimateCompletionTime(memberCount: number, priority: string = 'NORMAL'): Date {
  const baseTimePerMember = 60; // 1 minute per member
  const priorityMultiplier = {
    LOW: 2.0,
    NORMAL: 1.0,
    HIGH: 0.5,
    URGENT: 0.25,
  };
  
  const totalMinutes = memberCount * baseTimePerMember * (priorityMultiplier[priority as keyof typeof priorityMultiplier] || 1.0);
  const completionDate = new Date();
  completionDate.setMinutes(completionDate.getMinutes() + totalMinutes);
  
  return completionDate;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}