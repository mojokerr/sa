import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Order } from './order.entity';

export enum PaymentMethodType {
  VODAFONE_CASH = 'vodafone_cash',
  USDT_TRC20 = 'usdt_trc20',
  REDOTPAY = 'redotpay',
  MANUAL = 'manual'
}

@Entity('payment_methods')
export class PaymentMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: PaymentMethodType
  })
  type: PaymentMethodType;

  @Column('jsonb')
  details: Record<string, any>;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Order, order => order.payment_method)
  orders: Order[];
}

