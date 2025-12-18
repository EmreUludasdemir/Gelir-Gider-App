import {
  IBankAdapter,
  BankAccount,
  BankTransaction,
  ConnectionResult,
  TransactionFetchResult,
} from "./bank-adapter.interface";

// Mock Bank Adapter for development and testing
// Simulates a bank API with random transactions

export class MockBankAdapter implements IBankAdapter {
  private connected: boolean = false;
  private mockAccounts: BankAccount[] = [];

  getBankCode(): string {
    return "mock";
  }

  getBankName(): string {
    return "Demo Banka";
  }

  async connect(credentials: Record<string, any>): Promise<ConnectionResult> {
    // Simulate connection delay
    await this.delay(500);

    // Generate mock accounts
    this.mockAccounts = [
      {
        id: "mock-checking-1",
        accountNumber: "1234567890",
        accountName: "Ana Hesap",
        accountType: "checking",
        balance: 15750.5,
        currency: "TRY",
      },
      {
        id: "mock-savings-1",
        accountNumber: "0987654321",
        accountName: "Birikim Hesabı",
        accountType: "savings",
        balance: 45000.0,
        currency: "TRY",
      },
    ];

    this.connected = true;

    return {
      success: true,
      accounts: this.mockAccounts,
    };
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.mockAccounts = [];
  }

  isConnected(): boolean {
    return this.connected;
  }

  async getAccounts(): Promise<BankAccount[]> {
    if (!this.connected) {
      throw new Error("Not connected to bank");
    }
    return this.mockAccounts;
  }

  async getTransactions(
    accountId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<TransactionFetchResult> {
    if (!this.connected) {
      return {
        success: false,
        error: "Not connected to bank",
      };
    }

    // Simulate delay
    await this.delay(300);

    // Generate random transactions
    const transactions = this.generateMockTransactions(fromDate, toDate, 15);

    return {
      success: true,
      transactions,
    };
  }

  private generateMockTransactions(
    fromDate: Date,
    toDate: Date,
    count: number
  ): BankTransaction[] {
    const transactions: BankTransaction[] = [];
    const categories = {
      expense: [
        {
          desc: "Market Alışverişi - Migros",
          cat: "market",
          amount: [50, 500],
        },
        { desc: "Akaryakıt - Shell", cat: "ulasim", amount: [200, 800] },
        { desc: "Restaurant - Ödemesi", cat: "yemek", amount: [80, 400] },
        { desc: "Netflix Abonelik", cat: "abonelik", amount: [64.99, 64.99] },
        { desc: "Spotify Premium", cat: "abonelik", amount: [29.99, 29.99] },
        { desc: "Elektrik Faturası", cat: "fatura", amount: [150, 600] },
        { desc: "Su Faturası", cat: "fatura", amount: [50, 200] },
        { desc: "Doğalgaz Faturası", cat: "fatura", amount: [100, 500] },
        {
          desc: "Online Alışveriş - Trendyol",
          cat: "alisveris",
          amount: [100, 1500],
        },
        { desc: "Sağlık - Eczane", cat: "saglik", amount: [50, 300] },
      ],
      income: [
        { desc: "Maaş Ödemesi", cat: "maas", amount: [15000, 30000] },
        { desc: "Freelance Ödeme", cat: "freelance", amount: [2000, 10000] },
        { desc: "Kira Geliri", cat: "kira_geliri", amount: [5000, 15000] },
        { desc: "Yatırım Getirisi", cat: "yatirim", amount: [500, 5000] },
      ],
    };

    const timeDiff = toDate.getTime() - fromDate.getTime();

    for (let i = 0; i < count; i++) {
      const isIncome = Math.random() < 0.2; // 20% income, 80% expense
      const type = isIncome ? "income" : "expense";
      const categoryList = categories[type];
      const category =
        categoryList[Math.floor(Math.random() * categoryList.length)];

      const randomTime = fromDate.getTime() + Math.random() * timeDiff;
      const date = new Date(randomTime);

      const amount = this.randomBetween(category.amount[0], category.amount[1]);

      transactions.push({
        id: `mock-tx-${Date.now()}-${i}`,
        date,
        description: category.desc,
        amount: Math.round(amount * 100) / 100,
        type,
        category: category.cat,
      });
    }

    // Sort by date descending
    transactions.sort((a, b) => b.date.getTime() - a.date.getTime());

    return transactions;
  }

  private randomBetween(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
