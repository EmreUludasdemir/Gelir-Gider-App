'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles, Minimize2, Wrench } from 'lucide-react';
import { usePreferences } from '@/lib/PreferencesContext';
import { useTranslation } from '@/lib/translations';
import { ChatMessage } from '@/lib/types';
import { useAuth } from '@/components/auth-provider';

interface ChatResponse {
  reply: string;
  toolsUsed?: string[];
  data?: Record<string, unknown>;
}

export function FinancialAssistant() {
  const { language } = usePreferences();
  const { t } = useTranslation(language);
  const { isAuthenticated, fetchWithAuth } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toolsUsed, setToolsUsed] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendChatMessage = useCallback(async (message: string): Promise<ChatResponse> => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const conversationHistory = messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const response = await fetchWithAuth(`${apiUrl}/ai/chat`, {
      method: 'POST',
      body: JSON.stringify({
        message,
        conversationHistory,
        language,
      }),
    });

    if (!response.ok) {
      throw new Error(`Chat request failed: ${response.status}`);
    }

    return response.json();
  }, [fetchWithAuth, messages, language]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setToolsUsed([]);

    try {
      const response = await sendChatMessage(userMessage.content);

      if (response.toolsUsed) {
        setToolsUsed(response.toolsUsed);
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.reply,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: language === 'tr' ? 'Bir hata oluştu. Lütfen tekrar deneyin.' : 'An error occurred. Please try again.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Only show for authenticated users
  if (!isAuthenticated) {
    return null;
  }

  // Floating button when closed
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center z-50"
        aria-label={t('financial_assistant')}
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div
      className={`fixed right-6 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 ${
        isMinimized ? 'bottom-6 w-72 h-14' : 'bottom-6 w-96 h-[500px]'
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold">{t('financial_assistant')}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ height: 'calc(100% - 120px)' }}>
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-6">
                <Sparkles className="w-10 h-10 mx-auto mb-3 text-purple-400" />
                <p className="text-sm mb-4">
                  {language === 'tr'
                    ? 'Merhaba! Ben Lumina, finansal asistanınız. Harcamalarınız hakkında sorular sorabilirsiniz.'
                    : "Hi! I'm Lumina, your financial assistant. Ask me anything about your spending."}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {(language === 'tr' ? [
                    'Bu ay ne kadar harcadım?',
                    'Bütçe durumum nasıl?',
                    'Tasarruf hedeflerim ne durumda?',
                    'Yaklaşan faturalarım var mı?',
                  ] : [
                    'How much did I spend this month?',
                    'How are my budgets?',
                    'How are my savings goals?',
                    'Any upcoming bills?',
                  ]).map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setInput(suggestion)}
                      className="px-3 py-1.5 text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-purple-600 text-white rounded-br-none'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-2xl rounded-bl-none">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {language === 'tr' ? 'Veriler alınıyor...' : 'Fetching data...'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            {toolsUsed.length > 0 && !isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                  <Wrench className="w-3 h-3" />
                  <span>
                    {language === 'tr' ? 'Kullanılan: ' : 'Used: '}
                    {toolsUsed.map(t => t.replace('get_', '')).join(', ')}
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={language === 'tr' ? 'Bir soru yazın...' : 'Type a question...'}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
