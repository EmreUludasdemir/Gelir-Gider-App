import { BaseBankAdapter } from "./base-bank.adapter";
import {
  AccountsResult,
  AuthorizationStartParams,
  AuthorizationStartResult,
  BankConnectionCredentials,
  IBankAdapter,
  NormalizedBankError,
  TokenExchangeParams,
  TokenExchangeResult,
  TransactionFetchResult,
} from "./bank-adapter.interface";

export class AkbankAdapter extends BaseBankAdapter implements IBankAdapter {
  protected readonly authBaseUrl =
    process.env.AKBANK_AUTH_URL || "https://api.akbank.com/oauth/authorize";
  protected readonly tokenUrl =
    process.env.AKBANK_TOKEN_URL || "https://api.akbank.com/oauth/token";
  private readonly apiBase =
    process.env.AKBANK_API_URL || "https://api.akbank.com/v1";

  getBankCode(): string {
    return "akbank";
  }

  getBankName(): string {
    return "Akbank";
  }

  async startConnection(
    params: AuthorizationStartParams
  ): Promise<AuthorizationStartResult> {
    return this.buildStartResult(params);
  }

  async exchangeAuthorizationCode(
    params: TokenExchangeParams
  ): Promise<TokenExchangeResult> {
    if (this.useSandboxSimulation()) {
      return this.buildSimulatedExchangeResult(params);
    }

    try {
      const response = await fetch(this.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: params.code,
          redirect_uri: params.redirectUri,
          client_id: this.getClientId(),
          client_secret: this.getClientSecret(),
        }),
      });

      if (!response.ok) {
        return {
          success: false,
          error: this.normalizeProviderError({
            statusCode: response.status,
            providerMessage: response.statusText,
          }),
        };
      }

      const data = (await response.json()) as {
        access_token?: string;
        refresh_token?: string;
        expires_in?: number;
      };

      const credentials = {
        accessToken: data.access_token || null,
        refreshToken: data.refresh_token || null,
        expiresAt: data.expires_in
          ? new Date(Date.now() + data.expires_in * 1000)
          : null,
      };
      const accounts = await this.getAccounts(credentials);

      return {
        success: accounts.success,
        credentials,
        accounts: accounts.accounts,
        error: accounts.error,
      };
    } catch (error) {
      return {
        success: false,
        error: this.normalizeProviderError(error),
      };
    }
  }

  async refreshAccessToken(
    credentials: BankConnectionCredentials
  ): Promise<TokenExchangeResult> {
    if (!credentials.refreshToken) {
      return {
        success: false,
        error: this.normalizeProviderError({
          providerCode: "missing_refresh_token",
          providerMessage: "Refresh token is required",
        }),
      };
    }

    if (this.useSandboxSimulation()) {
      return this.buildSimulatedRefreshResult(credentials);
    }

    try {
      const response = await fetch(this.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: credentials.refreshToken,
          client_id: this.getClientId(),
          client_secret: this.getClientSecret(),
        }),
      });

      if (!response.ok) {
        return {
          success: false,
          error: this.normalizeProviderError({
            statusCode: response.status,
            providerMessage: response.statusText,
          }),
        };
      }

      const data = (await response.json()) as {
        access_token?: string;
        refresh_token?: string;
        expires_in?: number;
      };

      return {
        success: true,
        credentials: {
          accessToken: data.access_token || null,
          refreshToken: data.refresh_token || credentials.refreshToken,
          expiresAt: data.expires_in
            ? new Date(Date.now() + data.expires_in * 1000)
            : null,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: this.normalizeProviderError(error),
      };
    }
  }

  async getAccounts(
    credentials: BankConnectionCredentials
  ): Promise<AccountsResult> {
    if (!credentials.accessToken) {
      return {
        success: false,
        error: this.normalizeProviderError({
          providerCode: "missing_token",
          providerMessage: "Access token is required",
        }),
      };
    }

    if (this.useSandboxSimulation()) {
      return {
        success: true,
        accounts: this.getSimulatedAccounts(),
      };
    }

    try {
      const response = await fetch(`${this.apiBase}/accounts`, {
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: this.normalizeProviderError({
            statusCode: response.status,
            providerMessage: response.statusText,
          }),
        };
      }

      const payload = (await response.json()) as {
        accounts?: Array<{
          id?: string;
          iban?: string;
          name?: string;
          accountType?: string;
          balance?: { amount?: string; currency?: string };
        }>;
      };

      return {
        success: true,
        accounts: (payload.accounts || []).map((account, index) => ({
          id: account.id || `akbank-account-${index + 1}`,
          accountNumber: account.iban || `TRAKB${index + 1}`,
          accountName: account.name || `Akbank Hesap ${index + 1}`,
          accountType:
            account.accountType === "savings" ? "savings" : "checking",
          balance: Number(account.balance?.amount || 0),
          currency: account.balance?.currency || "TRY",
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: this.normalizeProviderError(error),
      };
    }
  }

  async getTransactions(
    _accountId: string,
    fromDate: Date,
    toDate: Date,
    credentials: BankConnectionCredentials
  ): Promise<TransactionFetchResult> {
    if (!credentials.accessToken) {
      return {
        success: false,
        error: this.normalizeProviderError({
          providerCode: "missing_token",
          providerMessage: "Access token is required",
        }),
      };
    }

    if (this.useSandboxSimulation()) {
      return {
        success: true,
        transactions: this.getSimulatedTransactions(fromDate, toDate),
      };
    }

    try {
      const response = await fetch(
        `${this.apiBase}/transactions?fromDate=${fromDate.toISOString()}&toDate=${toDate.toISOString()}`,
        {
          headers: {
            Authorization: `Bearer ${credentials.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        return {
          success: false,
          error: this.normalizeProviderError({
            statusCode: response.status,
            providerMessage: response.statusText,
          }),
        };
      }

      const payload = (await response.json()) as {
        transactions?: Array<{
          id?: string;
          date?: string;
          description?: string;
          amount?: number | string;
          direction?: "credit" | "debit";
          merchantName?: string;
        }>;
      };

      return {
        success: true,
        transactions: (payload.transactions || []).map((transaction, index) => ({
          id: transaction.id || `akbank-tx-${index + 1}`,
          date: new Date(transaction.date || Date.now()),
          description: transaction.description || "İşlem",
          amount: Math.abs(Number(transaction.amount || 0)),
          type: transaction.direction === "credit" ? "income" : "expense",
          merchantName: transaction.merchantName,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: this.normalizeProviderError(error),
      };
    }
  }

  normalizeProviderError(error: unknown): NormalizedBankError {
    if (typeof error === "object" && error !== null) {
      const payload = error as {
        providerCode?: string;
        providerMessage?: string;
        statusCode?: number;
      };
      return this.buildNormalizedError(payload, "Akbank bağlantısı işlenemedi.");
    }

    return {
      code: "provider_error",
      message: "Akbank bağlantısı işlenemedi.",
      detail: error instanceof Error ? error.message : undefined,
    };
  }
}
