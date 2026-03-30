'use client';

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles, Minimize2, Copy, Check } from 'lucide-react';
import { askFinancialAdvisor } from '@/lib/gemini';
import { usePreferences } from '@/lib/PreferencesContext';
import { useTranslation } from '@/lib/translations';
import { useTransactions } from '@/lib/hooks';
import { ChatMessage } from '@/lib/types';

// Memoized message component to prevent re-renders
const Message = memo(function Message({ 
  msg, 
  onCopy 
}: { 
  msg: ChatMessage
  onCopy: (content: string) => void 
}) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = useCallback(() => {
    onCopy(msg.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [msg.content, onCopy])
  
  return (
    <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div
        className={`max-w-[80%] px-4 py-2 rounded-2xl relative group ${
          msg.role === 'user'
            ? 'bg-primary-600 text-white rounded-br-none'
            : 'bg-muted text-foreground rounded-bl-none'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
        {msg.role === 'assistant' && (
          <button
            onClick={handleCopy}
            className="absolute -right-8 top-1 p-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
            aria-label="Copy message"
          >
            {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  )
})

// Typing indicator component
const TypingIndicator = memo(function TypingIndicator({ language }: { language: string }) {
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-2">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="text-xs text-muted-foreground ml-1">
          {language === 'tr' ? 'Düşünüyor...' : 'Thinking...'}
        </span>
      </div>
    </div>
  )
})

export function FinancialAssistant() {
  const { language } = usePreferences();
  const { t } = useTranslation(language);
  const { data: transactions } = useTransactions();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Memoized scroll function
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Memoized copy handler
  const handleCopy = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('assistant') === 'open') {
      setIsOpen(true);
    }
  }, []);

  // Memoized send handler
  const handleSend = useCallback(async () => {
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

    try {
      const response = await askFinancialAdvisor(userMessage.content, transactions || [], language);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
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
  }, [input, isLoading, transactions, language]);

  // Keyboard handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Toggle handlers
  const handleOpen = useCallback(() => setIsOpen(true), []);
  const handleClose = useCallback(() => setIsOpen(false), []);
  const handleToggleMinimize = useCallback(() => setIsMinimized(prev => !prev), []);

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-primary-600 to-accent text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center z-50 animate-bounce-in"
        aria-label={t('financial_assistant')}
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div
      className={`fixed right-6 z-50 bg-card rounded-2xl shadow-2xl border border-border overflow-hidden transition-all duration-200 animate-scale-in ${
        isMinimized ? 'bottom-6 w-72 h-14' : 'bottom-6 w-96 h-[520px]'
      }`}
      role="dialog"
      aria-label={t('financial_assistant')}
    >
      <div className="bg-gradient-to-r from-primary-700 to-primary-500 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold">{t('financial_assistant')}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleToggleMinimize}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label={isMinimized ? 'Expand' : 'Minimize'}
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div 
            className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin" 
            style={{ height: 'calc(100% - 120px)' }}
            role="log"
            aria-live="polite"
          >
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 animate-fade-in">
                <Sparkles className="w-12 h-12 mx-auto mb-3 text-accent animate-float" />
                <p className="text-sm">
                  {language === 'tr'
                    ? 'Merhaba! Tasarruf odaklı sorularınızı yanıtlayabilirim.'
                    : 'Hi! I can help with savings-focused questions.'}
                </p>
                <div className="mt-4 space-y-2">
                  <p className="text-xs text-muted-foreground/70">
                    {language === 'tr' ? 'Örnek sorular:' : 'Example questions:'}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {(language === 'tr' ? [
                      'Bu ay ne kadar tasarruf edebilirim?',
                      'En çok harcama yaptığım kategoriler?'
                    ] : [
                      'How much can I save this month?',
                      'Which categories do I spend most on?'
                    ]).map((q, i) => (
                      <button
                        key={i}
                        onClick={() => setInput(q)}
                        className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-foreground transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <Message key={msg.id} msg={msg} onCopy={handleCopy} />
              ))
            )}
            {isLoading && <TypingIndicator language={language} />}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-border">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={language === 'tr' ? 'Bir soru yazın...' : 'Type a question...'}
                className="flex-1 px-4 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/30 focus:border-transparent transition-all"
                disabled={isLoading}
                aria-label={language === 'tr' ? 'Mesaj girin' : 'Enter message'}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label={language === 'tr' ? 'Gönder' : 'Send'}
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


