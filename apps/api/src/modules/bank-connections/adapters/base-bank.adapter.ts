import {
  AuthorizationStartParams,
  AuthorizationStartResult,
  BankAccount,
  BankConnectionCredentials,
  BankProviderErrorPayload,
  BankTransaction,
  NormalizedBankError,
  TokenExchangeParams,
  TokenExchangeResult,
} from "./bank-adapter.interface";

export abstract class BaseBankAdapter {
  protected abstract readonly authBaseUrl: string;
  protected abstract readonly tokenUrl: string;

  abstract getBankCode(): string;
  abstract getBankName(): string;

  isDemoProvider(): boolean {
    return false;
  }

  protected buildAuthorizationUrl(params: AuthorizationStartParams): string {
    const redirect = new URL(params.redirectUri);
    redirect.searchParams.set("bankCode", this.getBankCode());
    redirect.searchParams.set("state", params.state);
    redirect.searchParams.set("code", `${this.getBankCode()}-sandbox-code`);
    return redirect.toString();
  }

  protected buildStartResult(params: AuthorizationStartParams): AuthorizationStartResult {
    if (this.useSandboxSimulation()) {
      return {
        success: true,
        authorizationUrl: this.buildAuthorizationUrl(params),
        providerConnectionId: `${this.getBankCode()}-${params.state}`,
      };
    }

    const authorizationUrl = new URL(this.authBaseUrl);
    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("client_id", this.getClientId());
    authorizationUrl.searchParams.set("redirect_uri", params.redirectUri);
    authorizationUrl.searchParams.set("state", params.state);
    authorizationUrl.searchParams.set("scope", "accounts transactions offline_access");

    return {
      success: true,
      authorizationUrl: authorizationUrl.toString(),
      providerConnectionId: `${this.getBankCode()}-${params.state}`,
    };
  }

  protected buildSimulatedExchangeResult(
    params: TokenExchangeParams
  ): TokenExchangeResult {
    const now = Date.now();
    return {
      success: true,
      credentials: {
        accessToken: `${this.getBankCode()}-access-${params.code}-${now}`,
        refreshToken: `${this.getBankCode()}-refresh-${now}`,
        expiresAt: new Date(now + 55 * 60 * 1000),
        metadata: {
          simulation: true,
          code: params.code,
        },
      },
      accounts: this.getSimulatedAccounts(),
    };
  }

  protected buildSimulatedRefreshResult(
    credentials: BankConnectionCredentials
  ): TokenExchangeResult {
    const now = Date.now();
    return {
      success: true,
      credentials: {
        accessToken: `${this.getBankCode()}-refreshed-${now}`,
        refreshToken:
          credentials.refreshToken || `${this.getBankCode()}-refresh-${now}`,
        expiresAt: new Date(now + 55 * 60 * 1000),
        metadata: {
          ...(credentials.metadata || {}),
          simulation: true,
          refreshed: true,
        },
      },
      accounts: this.getSimulatedAccounts(),
    };
  }

  protected getSimulatedAccounts(): BankAccount[] {
    return [
      {
        id: `${this.getBankCode()}-checking-1`,
        accountNumber: `TR${this.getBankCode().toUpperCase().slice(0, 2)}0001`,
        accountName: `${this.getBankName()} Ana Hesap`,
        accountType: "checking",
        balance: 24500,
        currency: "TRY",
      },
      {
        id: `${this.getBankCode()}-savings-1`,
        accountNumber: `TR${this.getBankCode().toUpperCase().slice(0, 2)}0002`,
        accountName: `${this.getBankName()} Birikim`,
        accountType: "savings",
        balance: 61500,
        currency: "TRY",
      },
    ];
  }

  protected getSimulatedTransactions(
    fromDate: Date,
    toDate: Date
  ): BankTransaction[] {
    const samples = [
      {
        description: "Netflix Subscription",
        amount: 199.99,
        type: "expense" as const,
        category: "abonelik",
      },
      {
        description: "Migros Market",
        amount: 1460,
        type: "expense" as const,
        category: "market",
      },
      {
        description: "Salary Payment",
        amount: 82000,
        type: "income" as const,
        category: "maas",
      },
      {
        description: "Electricity Bill",
        amount: 980,
        type: "expense" as const,
        category: "fatura",
      },
    ];

    const spanMs = Math.max(1, toDate.getTime() - fromDate.getTime());
    return samples.map((sample, index) => {
      const date = new Date(fromDate.getTime() + (spanMs / samples.length) * index);
      return {
        id: `${this.getBankCode()}-tx-${index + 1}-${date.getTime()}`,
        date,
        description: sample.description,
        amount: sample.amount,
        type: sample.type,
        category: sample.category,
        merchantName: sample.description,
      };
    });
  }

  protected useSandboxSimulation(): boolean {
    return !this.getClientId();
  }

  protected getClientId(): string {
    return process.env[`${this.getBankCode().toUpperCase()}_CLIENT_ID`] || "";
  }

  protected getClientSecret(): string {
    return process.env[`${this.getBankCode().toUpperCase()}_CLIENT_SECRET`] || "";
  }

  protected buildNormalizedError(
    error: BankProviderErrorPayload | undefined,
    fallbackMessage: string
  ): NormalizedBankError {
    const providerCode = error?.providerCode || "";
    const providerMessage = error?.providerMessage || fallbackMessage;
    const statusCode = error?.statusCode;

    if (providerCode === "invalid_grant" || statusCode === 401) {
      return {
        code: "reauth_required",
        message: "Banka oturumu yenilenmeli. Lütfen bağlantıyı tekrar doğrulayın.",
        detail: providerMessage,
        reauthRequired: true,
      };
    }

    if (providerCode === "access_denied") {
      return {
        code: "consent_denied",
        message: "Banka izin akışı kullanıcı tarafından iptal edildi.",
        detail: providerMessage,
      };
    }

    if (statusCode === 429) {
      return {
        code: "rate_limited",
        message: "Banka sağlayıcısı şu anda çok fazla istek alıyor. Kısa süre sonra tekrar deneyin.",
        detail: providerMessage,
        retryable: true,
      };
    }

    if ((statusCode || 0) >= 500) {
      return {
        code: "provider_unavailable",
        message: "Banka sağlayıcısı geçici olarak kullanılamıyor.",
        detail: providerMessage,
        retryable: true,
      };
    }

    return {
      code: providerCode || "provider_error",
      message: fallbackMessage,
      detail: providerMessage,
    };
  }
}
