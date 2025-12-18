// Bank Adapter Interface
// Defines the contract for bank-specific implementations

export interface BankAccount {
  id: string;
  accountNumber: string;
  accountName: string;
  accountType: "checking" | "savings" | "credit";
  balance: number;
  currency: string;
}

export interface BankTransaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: "income" | "expense";
  balance?: number;
  category?: string;
  merchantName?: string;
}

export interface ConnectionResult {
  success: boolean;
  accounts?: BankAccount[];
  error?: string;
}

export interface TransactionFetchResult {
  success: boolean;
  transactions?: BankTransaction[];
  error?: string;
}

export interface IBankAdapter {
  // Bank identification
  getBankCode(): string;
  getBankName(): string;

  // Connection lifecycle
  connect(credentials: Record<string, any>): Promise<ConnectionResult>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  // Refresh token if needed
  refreshConnection?(): Promise<boolean>;

  // Account operations
  getAccounts(): Promise<BankAccount[]>;

  // Transaction fetching
  getTransactions(
    accountId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<TransactionFetchResult>;
}
