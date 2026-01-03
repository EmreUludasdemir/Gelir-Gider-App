/**
 * Garanti BBVA Open Banking API Adapter
 *
 * Bu adapter Garanti BBVA'nın Open Banking API'sini kullanarak
 * hesap bilgileri ve işlem geçmişini çeker.
 *
 * API: https://developer.garantibbva.com
 */

import {
  IBankAdapter,
  BankAccount,
  BankTransaction,
  ConnectionResult,
  TransactionFetchResult,
} from "./bank-adapter.interface";

interface GarantiCredentials {
  accessToken: string | null;
  refreshToken: string | null;
}

export class GarantiAdapter implements IBankAdapter {
  private readonly API_BASE = "https://api.garantibbva.com.tr/v1";
  private readonly SANDBOX_API_BASE =
    "https://sandbox.garantibbva.com.tr/api/v1";

  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private connected = false;
  private useSandbox = true;

  getBankCode(): string {
    return "garanti";
  }

  getBankName(): string {
    return "Garanti BBVA";
  }

  private getBaseUrl(): string {
    return this.useSandbox ? this.SANDBOX_API_BASE : this.API_BASE;
  }

  async connect(credentials: GarantiCredentials): Promise<ConnectionResult> {
    try {
      this.accessToken = credentials.accessToken;
      this.refreshToken = credentials.refreshToken;

      const accounts = await this.getAccounts();
      this.connected = true;

      return { success: true, accounts };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Bağlantı hatası";
      return {
        success: false,
        error: `Garanti BBVA bağlantısı başarısız: ${errorMessage}`,
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
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${this.getBaseUrl()}/oauth2/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: this.refreshToken,
        }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      this.accessToken = data.access_token;
      if (data.refresh_token) this.refreshToken = data.refresh_token;

      return true;
    } catch {
      return false;
    }
  }

  async getAccounts(): Promise<BankAccount[]> {
    if (!this.accessToken) throw new Error("Token gerekli");

    const response = await fetch(`${this.getBaseUrl()}/accounts`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        "X-Correlation-ID": this.generateCorrelationId(),
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        const refreshed = await this.refreshConnection();
        if (refreshed) return this.getAccounts();
      }
      throw new Error(`Hesap bilgileri alınamadı: ${response.statusText}`);
    }

    const data = await response.json();

    return (data.Data?.Account || []).map((acc: any) => ({
      id: acc.AccountId,
      accountNumber: acc.Account?.[0]?.Identification || acc.AccountId,
      accountName: acc.Nickname || acc.Account?.[0]?.Name || "Hesap",
      accountType: this.mapAccountType(acc.AccountType || acc.AccountSubType),
      balance: 0, // Fetch separately if needed
      currency: acc.Currency || "TRY",
    }));
  }

  async getTransactions(
    accountId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<TransactionFetchResult> {
    if (!this.accessToken) {
      return { success: false, error: "Token gerekli" };
    }

    try {
      const params = new URLSearchParams({
        fromBookingDateTime: fromDate.toISOString(),
        toBookingDateTime: toDate.toISOString(),
      });

      const response = await fetch(
        `${this.getBaseUrl()}/accounts/${accountId}/transactions?${params}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
            "X-Correlation-ID": this.generateCorrelationId(),
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          const refreshed = await this.refreshConnection();
          if (refreshed)
            return this.getTransactions(accountId, fromDate, toDate);
        }
        return {
          success: false,
          error: `İşlem geçmişi alınamadı: ${response.statusText}`,
        };
      }

      const data = await response.json();

      const transactions: BankTransaction[] = (
        data.Data?.Transaction || []
      ).map((tx: any) => ({
        id: tx.TransactionId,
        date: new Date(tx.BookingDateTime || tx.ValueDateTime),
        description:
          tx.TransactionInformation ||
          tx.MerchantDetails?.MerchantName ||
          "İşlem",
        amount: Math.abs(parseFloat(tx.Amount?.Amount || 0)),
        type: tx.CreditDebitIndicator === "Credit" ? "income" : "expense",
        balance: tx.Balance
          ? parseFloat(tx.Balance.Amount?.Amount || 0)
          : undefined,
        category: this.categorizeTransaction(tx.TransactionInformation || ""),
        merchantName: tx.MerchantDetails?.MerchantName,
      }));

      return { success: true, transactions };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Bilinmeyen hata",
      };
    }
  }

  private generateCorrelationId(): string {
    return `gbb-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private mapAccountType(type: string): "checking" | "savings" | "credit" {
    const typeMap: Record<string, "checking" | "savings" | "credit"> = {
      CurrentAccount: "checking",
      SavingsAccount: "savings",
      CreditCard: "credit",
    };
    return typeMap[type] || "checking";
  }

  private categorizeTransaction(description: string): string {
    const desc = description.toLowerCase();

    if (["migros", "bim", "a101", "market"].some((k) => desc.includes(k)))
      return "market";
    if (["akaryakıt", "petrol", "shell"].some((k) => desc.includes(k)))
      return "ulasim";
    if (["restaurant", "cafe", "yemek"].some((k) => desc.includes(k)))
      return "yemek";
    if (["elektrik", "su", "fatura"].some((k) => desc.includes(k)))
      return "fatura";

    return "diger";
  }
}
