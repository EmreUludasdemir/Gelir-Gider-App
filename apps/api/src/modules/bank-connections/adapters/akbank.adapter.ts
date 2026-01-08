/**
 * Akbank Open Banking API Adapter
 *
 * Bu adapter Akbank'ın Open Banking API'sini kullanarak
 * hesap bilgileri ve işlem geçmişini çeker.
 *
 * Sandbox API: https://developer.akbank.com
 *
 * NOT: Gerçek kullanım için Akbank Developer Portal'dan
 * API key almanız gerekmektedir.
 */

import {
  IBankAdapter,
  BankAccount,
  BankTransaction,
  ConnectionResult,
  TransactionFetchResult,
} from "./bank-adapter.interface";

interface AkbankCredentials {
  accessToken: string | null;
  refreshToken: string | null;
  clientId?: string;
  clientSecret?: string;
}

interface AkbankTokenResponse {
  access_token: string;
  refresh_token?: string;
}

interface AkbankAccountsResponse {
  accounts?: any[];
}

interface AkbankTransactionsResponse {
  transactions?: any[];
}

export class AkbankAdapter implements IBankAdapter {
  private readonly API_BASE = "https://api.akbank.com/v1"; // Production
  private readonly SANDBOX_API_BASE = "https://sandbox.akbank.com/api/v1"; // Sandbox

  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private connected = false;
  private useSandbox = true; // Default to sandbox for development

  getBankCode(): string {
    return "akbank";
  }

  getBankName(): string {
    return "Akbank";
  }

  private getBaseUrl(): string {
    return this.useSandbox ? this.SANDBOX_API_BASE : this.API_BASE;
  }

  async connect(credentials: AkbankCredentials): Promise<ConnectionResult> {
    try {
      this.accessToken = credentials.accessToken;
      this.refreshToken = credentials.refreshToken;

      // Validate token by fetching accounts
      const accounts = await this.getAccounts();

      this.connected = true;

      return {
        success: true,
        accounts,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Bağlantı hatası";
      return {
        success: false,
        error: `Akbank bağlantısı başarısız: ${errorMessage}`,
      };
    }
  }

  async disconnect(): Promise<void> {
    this.accessToken = null;
    this.refreshToken = null;
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected && this.accessToken !== null;
  }

  async refreshConnection(): Promise<boolean> {
    if (!this.refreshToken) {
      return false;
    }

    try {
      // OAuth2 token refresh
      const response = await fetch(`${this.getBaseUrl()}/oauth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: this.refreshToken,
        }),
      });

      if (!response.ok) {
        return false;
      }

      const data = (await response.json()) as AkbankTokenResponse;
      this.accessToken = data.access_token;
      if (data.refresh_token) {
        this.refreshToken = data.refresh_token;
      }

      return true;
    } catch {
      return false;
    }
  }

  async getAccounts(): Promise<BankAccount[]> {
    if (!this.accessToken) {
      throw new Error("Token gerekli");
    }

    const response = await fetch(`${this.getBaseUrl()}/accounts`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        "X-Request-ID": this.generateRequestId(),
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Try to refresh token
        const refreshed = await this.refreshConnection();
        if (refreshed) {
          return this.getAccounts(); // Retry
        }
      }
      throw new Error(`Hesap bilgileri alınamadı: ${response.statusText}`);
    }

    const data = (await response.json()) as AkbankAccountsResponse;

    // Map Akbank response to our interface
    return (data.accounts || []).map((acc: any) => ({
      id: acc.accountId || acc.id,
      accountNumber: acc.iban || acc.accountNumber,
      accountName: acc.alias || acc.name || "Hesap",
      accountType: this.mapAccountType(acc.accountType),
      balance: parseFloat(acc.balance?.amount || acc.currentBalance || 0),
      currency: acc.balance?.currency || acc.currency || "TRY",
    }));
  }

  async getTransactions(
    accountId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<TransactionFetchResult> {
    if (!this.accessToken) {
      return {
        success: false,
        error: "Token gerekli",
      };
    }

    try {
      const params = new URLSearchParams({
        fromDate: fromDate.toISOString().split("T")[0],
        toDate: toDate.toISOString().split("T")[0],
      });

      const response = await fetch(
        `${this.getBaseUrl()}/accounts/${accountId}/transactions?${params}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
            "X-Request-ID": this.generateRequestId(),
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          const refreshed = await this.refreshConnection();
          if (refreshed) {
            return this.getTransactions(accountId, fromDate, toDate);
          }
        }
        return {
          success: false,
          error: `İşlem geçmişi alınamadı: ${response.statusText}`,
        };
      }

      const data = (await response.json()) as AkbankTransactionsResponse;

      const transactions: BankTransaction[] = (data.transactions || []).map(
        (tx: any) => ({
          id: tx.transactionId || tx.id,
          date: new Date(tx.bookingDate || tx.date),
          description: tx.description || tx.remittanceInformation || "İşlem",
          amount: Math.abs(parseFloat(tx.amount?.amount || tx.amount || 0)),
          type: this.determineTransactionType(tx),
          balance: tx.balanceAfterTransaction
            ? parseFloat(tx.balanceAfterTransaction)
            : undefined,
          category: this.categorizeTransaction(tx.description || ""),
          merchantName: tx.merchantName || tx.creditorName || tx.debtorName,
        })
      );

      return {
        success: true,
        transactions,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Bilinmeyen hata";
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Helper methods
  private generateRequestId(): string {
    return `akb-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private mapAccountType(type: string): "checking" | "savings" | "credit" {
    const typeMap: Record<string, "checking" | "savings" | "credit"> = {
      VADESIZ: "checking",
      CHECKING: "checking",
      CURRENT: "checking",
      VADELI: "savings",
      SAVINGS: "savings",
      DEPOSIT: "savings",
      KREDI: "credit",
      CREDIT: "credit",
      CREDITCARD: "credit",
    };
    return typeMap[type?.toUpperCase()] || "checking";
  }

  private determineTransactionType(tx: any): "income" | "expense" {
    const amount = parseFloat(tx.amount?.amount || tx.amount || 0);
    if (amount > 0) return "income";
    if (amount < 0) return "expense";

    // Fallback to credit/debit indicator
    const indicator = tx.creditDebitIndicator || tx.type;
    return indicator === "CREDIT" ? "income" : "expense";
  }

  private categorizeTransaction(description: string): string {
    const desc = description.toLowerCase();

    const categoryMap: Record<string, string[]> = {
      market: ["migros", "bim", "a101", "carrefour", "şok", "market"],
      ulasim: ["akaryakıt", "petrol", "opet", "shell", "bp", "metro", "otobüs"],
      yemek: ["restaurant", "cafe", "yemek", "pizza", "burger", "döner"],
      fatura: ["elektrik", "su", "doğalgaz", "internet", "telefon", "fatura"],
      abonelik: ["spotify", "netflix", "youtube", "amazon", "subscription"],
    };

    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some((keyword) => desc.includes(keyword))) {
        return category;
      }
    }

    return "diger";
  }
}
