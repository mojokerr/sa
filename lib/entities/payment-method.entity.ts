export enum PaymentMethodType {
  VODAFONE_CASH = 'vodafone_cash',
  USDT_TRC20 = 'usdt_trc20',
  REDOTPAY = 'redotpay',
  MANUAL = 'manual'
}

export interface PaymentMethodDetails {
  // Vodafone Cash
  phone?: string;
  name?: string;
  
  // USDT TRC20
  address?: string;
  network?: string;
  
  // RedotPay
  email?: string;
  merchant_id?: string;
  
  // Manual
  instructions?: string;
  account_info?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentMethodType;
  details: PaymentMethodDetails;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentProof {
  id: string;
  order_id: string;
  payment_method_id: string;
  proof_url: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  created_at: Date;
  updated_at: Date;
}