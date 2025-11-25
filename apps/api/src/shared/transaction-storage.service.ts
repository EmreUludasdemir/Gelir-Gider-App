import { Injectable } from '@nestjs/common';
import { TransactionEntity, TransactionQuery } from './types';
import { generateSeedData } from './seed-data';

@Injectable()
export class TransactionStorageService {
  private transactions: Map<string, TransactionEntity> = new Map();

  constructor() {
    // Initialize with seed data
    this.initializeSeedData();
  }

  private initializeSeedData(): void {
    const seedData = generateSeedData();
    seedData.forEach(tx => {
      this.transactions.set(tx.id, tx);
    });
    console.log(`✅ Initialized with ${this.transactions.size} seed transactions`);
  }

  findAll(query?: TransactionQuery): TransactionEntity[] {
    let results = Array.from(this.transactions.values());

    // Apply filters
    if (query) {
      if (query.type) {
        results = results.filter(tx => tx.type === query.type);
      }

      if (query.categoryId) {
        results = results.filter(tx => tx.categoryId === query.categoryId);
      }

      if (query.source) {
        results = results.filter(tx => tx.source === query.source);
      }

      if (query.dateFrom) {
        results = results.filter(tx => tx.date >= query.dateFrom!);
      }

      if (query.dateTo) {
        results = results.filter(tx => tx.date <= query.dateTo!);
      }

      if (query.minAmount !== undefined) {
        results = results.filter(tx => Math.abs(tx.amount) >= query.minAmount!);
      }

      if (query.maxAmount !== undefined) {
        results = results.filter(tx => Math.abs(tx.amount) <= query.maxAmount!);
      }

      if (query.search) {
        const searchLower = query.search.toLowerCase();
        results = results.filter(tx =>
          tx.description.toLowerCase().includes(searchLower) ||
          tx.categoryLabel.toLowerCase().includes(searchLower)
        );
      }

      // Sorting
      const sortBy = query.sortBy || 'date';
      const sortOrder = query.sortOrder || 'desc';

      results.sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
          case 'date':
            comparison = a.date.localeCompare(b.date);
            break;
          case 'amount':
            comparison = Math.abs(a.amount) - Math.abs(b.amount);
            break;
          case 'category':
            comparison = a.categoryLabel.localeCompare(b.categoryLabel);
            break;
        }

        return sortOrder === 'asc' ? comparison : -comparison;
      });

      // Pagination
      if (query.offset !== undefined || query.limit !== undefined) {
        const offset = query.offset || 0;
        const limit = query.limit || 50;
        results = results.slice(offset, offset + limit);
      }
    } else {
      // Default sort by date descending
      results.sort((a, b) => b.date.localeCompare(a.date));
    }

    return results;
  }

  findOne(id: string): TransactionEntity | undefined {
    return this.transactions.get(id);
  }

  create(transaction: TransactionEntity): TransactionEntity {
    this.transactions.set(transaction.id, transaction);
    return transaction;
  }

  update(id: string, updates: Partial<TransactionEntity>): TransactionEntity | undefined {
    const transaction = this.transactions.get(id);
    if (!transaction) {
      return undefined;
    }

    const updated = {
      ...transaction,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.transactions.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.transactions.delete(id);
  }

  count(): number {
    return this.transactions.size;
  }

  clear(): void {
    this.transactions.clear();
  }
}
