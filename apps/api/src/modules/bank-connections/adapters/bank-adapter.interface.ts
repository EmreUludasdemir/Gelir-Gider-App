export type BankLifecycleState =
  | "pending_consent"
  | "connected"
  | "reauth_required"
  | "failed";

export type BankSyncStatus =
  | "pending"
  | "success"
  | "failed"
  | "reauth_required";

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

export interface BankConnectionCredentials {
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresAt?: Date | null;
  metadata?: Record<string, unknown>;
}

export interface BankProviderErrorPayload {
  providerCode?: string;
  providerMessage?: string;
  statusCode?: number;
  detail?: string;
}

export interface NormalizedBankError {
  code: string;
  message: string;
  detail?: string;
  reauthRequired?: boolean;
  retryable?: boolean;
}

export interface AuthorizationStartParams {
  state: string;
  redirectUri: string;
  reconnect?: boolean;
}

export interface AuthorizationStartResult {
  success: boolean;
  authorizationUrl?: string;
  providerConnectionId?: string;
  error?: NormalizedBankError;
}

export interface TokenExchangeParams {
  code: string;
  redirectUri: string;
}

export interface TokenExchangeResult {
  success: boolean;
  credentials?: BankConnectionCredentials;
  accounts?: BankAccount[];
  error?: NormalizedBankError;
}

export interface AccountsResult {
  success: boolean;
  accounts?: BankAccount[];
  refreshedCredentials?: BankConnectionCredentials;
  error?: NormalizedBankError;
}

export interface TransactionFetchResult {
  success: boolean;
  transactions?: BankTransaction[];
  refreshedCredentials?: BankConnectionCredentials;
  error?: NormalizedBankError;
}

export interface ProviderDescriptor {
  code: string;
  name: string;
  isDemo: boolean;
}

export interface IBankAdapter {
  getBankCode(): string;
  getBankName(): string;
  isDemoProvider(): boolean;

  startConnection(params: AuthorizationStartParams): Promise<AuthorizationStartResult>;
  exchangeAuthorizationCode(params: TokenExchangeParams): Promise<TokenExchangeResult>;
  refreshAccessToken(
    credentials: BankConnectionCredentials
  ): Promise<TokenExchangeResult>;
  getAccounts(credentials: BankConnectionCredentials): Promise<AccountsResult>;
  getTransactions(
    accountId: string,
    fromDate: Date,
    toDate: Date,
    credentials: BankConnectionCredentials
  ): Promise<TransactionFetchResult>;
  normalizeProviderError(error: unknown): NormalizedBankError;
}
