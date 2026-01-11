'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Check, X } from 'lucide-react';
import { parseTransactionNaturalLanguage, isAIAvailable } from '@/lib/gemini';
import { createTransaction } from '@/lib/api';
import { usePreferences } from '@/lib/PreferencesContext';
import { useTranslation } from '@/lib/translations';
import { SmartParseResult, TransactionType } from '@/lib/types';

interface SmartTransactionInputProps {
  onSuccess?: () => void;
}

export function SmartTransactionInput({ onSuccess }: SmartTransactionInputProps) {
  const { language } = usePreferences();
  const { t } = useTranslation(language);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedResult, setParsedResult] = useState<SmartParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleParse = async () => {
    if (!input.trim()) return;

    setIsLoading(true);
    setError(null);
    setParsedResult(null);

    try {
      const result = await parseTransactionNaturalLanguage(input, language);
      if (result) {
        setParsedResult(result);
      } else {
        setError(language === 'tr' ? 'Islem parse edilemedi. Lutfen farkli bir ifade deneyin.' : 'Could not parse transaction. Please try a different phrase.');
      }
    } catch {
      setError(language === 'tr' ? 'Bir hata oldu.' : 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!parsedResult) return;

    setIsLoading(true);
    try {
      await createTransaction({
        date: parsedResult.date || new Date().toISOString().split('T')[0],
        description: parsedResult.description,
        amount: parsedResult.amount,
        type: parsedResult.type === TransactionType.INCOME ? 'income' : 'expense',
        categoryLabel: parsedResult.category,
      });

      setInput('');
      setParsedResult(null);
      onSuccess?.();
    } catch {
      setError(language === 'tr' ? 'Islem kaydedilemedi.' : 'Failed to save transaction.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setParsedResult(null);
    setInput('');
    setError(null);
  };

  if (!isAIAvailable()) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-primary-50 to-accent/20 rounded-xl p-4 border border-border">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-primary-600" />
        <h3 className="font-semibold text-foreground">{t('smart_input')}</h3>
      </div>

      {!parsedResult ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleParse()}
            placeholder={t('smart_input_placeholder')}
            className="flex-1 px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:ring-2 focus:ring-primary/30 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={handleParse}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {t('analyze')}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">{t('description')}:</span>
                <p className="font-medium text-foreground">{parsedResult.description}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t('amount')}:</span>
                <p className={`font-bold ${parsedResult.type === TransactionType.INCOME ? 'text-success' : 'text-destructive'}`}>
                  {parsedResult.type === TransactionType.INCOME ? '+' : '-'}{parsedResult.amount.toLocaleString('tr-TR')} TL
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">{t('category')}:</span>
                <p className="font-medium text-foreground">{parsedResult.category}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t('type')}:</span>
                <p className="font-medium text-foreground">
                  {parsedResult.type === TransactionType.INCOME ? t('income') : t('expense')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-success text-success-foreground rounded-lg hover:bg-success/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {t('save')}
            </button>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 flex items-center gap-2 transition-colors"
            >
              <X className="w-4 h-4" />
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

