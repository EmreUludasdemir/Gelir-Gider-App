/**
 * İşbank (Türkiye İş Bankası) Open Banking API Adapter
 *
 * Bu adapter İşbank'ın Open Banking API'sini kullanarak
 * hesap bilgileri ve işlem geçmişini çeker.
 *
 * API: https://developer.isbank.com.tr
 */

import {
  IBankAdapter,
  BankAccount,
  BankTransaction,
  ConnectionResult,
  TransactionFetchResult,
} from "./bank-adapter.interface";

interface IsbankCredentials {
  accessToken: string | null;
  refreshToken: string | null;
}

interface IsbankTokenResponse {
  access_token: string;
  refresh_token?: string;
}

interface IsbankAccountsResponse {
  hesaplar?: any[];
  accounts?: any[];
}

interface IsbankTransactionsResponse {
  hareketler?: any[];
  transactions?: any[];
}

export class IsbankAdapter implements IBankAdapter {
  private readonly API_BASE = "https://api.isbank.com.tr/v1";
  private readonly SANDBOX_API_BASE = "https://sandbox.isbank.com.tr/api/v1";

  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private connected = false;
  private useSandbox = true;

  getBankCode(): string {
    return "isbank";
  }

  getBankName(): string {
    return "Türkiye İş Bankası";
  }

  private getBaseUrl(): string {
    return this.useSandbox ? this.SANDBOX_API_BASE : this.API_BASE;
  }

  async connect(credentials: IsbankCredentials): Promise<ConnectionResult> {
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
        error: `İşbank bağlantısı başarısız: ${errorMessage}`,
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
      const response = await fetch(`${this.getBaseUrl()}/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: this.refreshToken,
        }),
      });

      if (!response.ok) return false;

      const data = (await response.json()) as IsbankTokenResponse;
      this.accessToken = data.access_token;
      if (data.refresh_token) this.refreshToken = data.refresh_token;

      return true;
    } catch {
      return false;
    }
  }

  async getAccounts(): Promise<BankAccount[]> {
    if (!this.accessToken) throw new Error("Token gerekli");

    const response = await fetch(`${this.getBaseUrl()}/hesaplar`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        "X-Request-ID": this.generateRequestId(),
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        const refreshed = await this.refreshConnection();
        if (refreshed) return this.getAccounts();
      }
      throw new Error(`Hesap bilgileri alınamadı: ${response.statusText}`);
    }

    const data = (await response.json()) as IsbankAccountsResponse;

    return (data.hesaplar || data.accounts || []).map((acc: any) => ({
      id: acc.hesapNo || acc.accountId,
      accountNumber: acc.iban || acc.hesapNo,
      accountName: acc.hesapAdi || acc.alias || "Hesap",
      accountType: this.mapAccountType(acc.hesapTipi || acc.accountType),
      balance: parseFloat(acc.bakiye || acc.balance || 0),
      currency: acc.paraBirimi || acc.currency || "TRY",
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
        baslangicTarihi: fromDate.toISOString().split("T")[0],
        bitisTarihi: toDate.toISOString().split("T")[0],
      });

      const response = await fetch(
        `${this.getBaseUrl()}/hesaplar/${accountId}/hareketler?${params}`,
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
          if (refreshed)
            return this.getTransactions(accountId, fromDate, toDate);
        }
        return {
          success: false,
          error: `İşlem geçmişi alınamadı: ${response.statusText}`,
        };
      }

      const data = (await response.json()) as IsbankTransactionsResponse;

      const transactions: BankTransaction[] = (
        data.hareketler ||
        data.transactions ||
        []
      ).map((tx: any) => ({
        id: tx.islemNo || tx.transactionId || String(Date.now()),
        date: new Date(tx.islemTarihi || tx.date),
        description: tx.aciklama || tx.description || "İşlem",
        amount: Math.abs(parseFloat(tx.tutar || tx.amount || 0)),
        type: this.determineType(tx),
        balance: tx.bakiye ? parseFloat(tx.bakiye) : undefined,
        category: this.categorizeTransaction(
          tx.aciklama || tx.description || ""
        ),
        merchantName: tx.isyeriAdi || tx.merchantName,
      }));

      return { success: true, transactions };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Bilinmeyen hata",
      };
    }
  }

  private generateRequestId(): string {
    return `isb-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private mapAccountType(type: string): "checking" | "savings" | "credit" {
    const t = (type || "").toLowerCase();
    if (t.includes("vadeli") || t.includes("savings")) return "savings";
    if (t.includes("kredi") || t.includes("credit")) return "credit";
    return "checking";
  }

  private determineType(tx: any): "income" | "expense" {
    const amount = parseFloat(tx.tutar || tx.amount || 0);
    if (amount > 0) return "income";
    if (amount < 0) return "expense";
    return tx.islemTipi === "ALACAK" || tx.type === "credit"
      ? "income"
      : "expense";
  }

  private categorizeTransaction(description: string): string {
    const desc = description.toLowerCase();

    if (["migros", "bim", "a101", "market"].some((k) => desc.includes(k)))
      return "market";
    if (["akaryakıt", "petrol", "shell", "opet"].some((k) => desc.includes(k)))
      return "ulasim";
    if (
      ["restaurant", "cafe", "yemek", "lokanta"].some((k) => desc.includes(k))
    )
      return "yemek";
    if (["elektrik", "su", "fatura", "doğalgaz"].some((k) => desc.includes(k)))
      return "fatura";
    if (["maaş", "maas", "ücret"].some((k) => desc.includes(k))) return "maas";

    return "diger";
  }
}
