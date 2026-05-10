export interface User {
  id: string;
  name: string;
  email: string;
  userId: string;
  balance: number;
  role: 'member' | 'admin';
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  stock: number;
}

export interface Transaction {
  id: string;
  amount: number;
  transactionId: string;
  type: 'deposit' | 'payout' | 'purchase';
  status: 'pending' | 'completed' | 'failed';
  date: Date;
  description?: string;
}