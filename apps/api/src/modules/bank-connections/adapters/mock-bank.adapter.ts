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

export class MockBankAdapter
  extends BaseBankAdapter
  implements IBankAdapter
{
  protected readonly authBaseUrl = "http://localhost/mock-bank/auth";
  protected readonly tokenUrl = "http://localhost/mock-bank/token";

  getBankCode(): string {
    return "mock";
  }

  getBankName(): string {
    return "Demo Banka";
  }

  isDemoProvider(): boolean {
    return true;
  }

  async startConnection(
    params: AuthorizationStartParams
  ): Promise<AuthorizationStartResult> {
    return this.buildStartResult(params);
  }

  async exchangeAuthorizationCode(
    params: TokenExchangeParams
  ): Promise<TokenExchangeResult> {
    return this.buildSimulatedExchangeResult(params);
  }

  async refreshAccessToken(
    credentials: BankConnectionCredentials
  ): Promise<TokenExchangeResult> {
    return this.buildSimulatedRefreshResult(credentials);
  }

  async getAccounts(
    credentials: BankConnectionCredentials
  ): Promise<AccountsResult> {
    if (!credentials.accessToken) {
      return {
        success: false,
        error: this.normalizeProviderError({
          providerCode: "missing_token",
          providerMessage: "Mock token missing",
        }),
      };
    }

    return {
      success: true,
      accounts: this.getSimulatedAccounts(),
    };
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
          providerMessage: "Mock token missing",
        }),
      };
    }

    return {
      success: true,
      transactions: this.getSimulatedTransactions(fromDate, toDate),
    };
  }

  normalizeProviderError(error: unknown): NormalizedBankError {
    if (typeof error === "object" && error !== null) {
      const payload = error as {
        providerCode?: string;
        providerMessage?: string;
        statusCode?: number;
      };
      return this.buildNormalizedError(
        payload,
        "Demo banka bağlantısı işlenemedi."
      );
    }

    return {
      code: "mock_provider_error",
      message: "Demo banka bağlantısı işlenemedi.",
      detail: error instanceof Error ? error.message : undefined,
    };
  }
}
