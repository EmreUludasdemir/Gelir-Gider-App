'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Plus, Check, X } from 'lucide-react';
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
        setError(language === 'tr' ? 'İşlem parse edilemedi. Lütfen farklı bir ifade deneyin.' : 'Could not parse transaction. Please try a different phrase.');
      }
    } catch {
      setError(language === 'tr' ? 'Bir hata oluştu.' : 'An error occurred.');
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
      setError(language === 'tr' ? 'İşlem kaydedilemedi.' : 'Failed to save transaction.');
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
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold text-gray-900 dark:text-white">{t('smart_input')}</h3>
      </div>

      {!parsedResult ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleParse()}
            placeholder={t('smart_input_placeholder')}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={handleParse}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
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
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">{t('description')}:</span>
                <p className="font-medium text-gray-900 dark:text-white">{parsedResult.description}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">{t('amount')}:</span>
                <p className={`font-bold ${parsedResult.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'}`}>
                  {parsedResult.type === TransactionType.INCOME ? '+' : '-'}{parsedResult.amount.toLocaleString('tr-TR')} ₺
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">{t('category')}:</span>
                <p className="font-medium text-gray-900 dark:text-white">{parsedResult.category}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">{t('type')}:</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {parsedResult.type === TransactionType.INCOME ? t('income') : t('expense')}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {t('save')}
            </button>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-2 transition-colors"
            >
              <X className="w-4 h-4" />
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
