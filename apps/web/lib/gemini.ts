'use client';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Transaction, chatWithAssistant } from './api';
import { FinancialInsight, SmartParseResult, TransactionType, Language } from './types';

// Initialize Gemini client - API key should be in environment variable
const getAI = () => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('NEXT_PUBLIC_GEMINI_API_KEY is not set. AI features will be disabled.');
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
};

const MODEL_ID = 'gemini-1.5-flash';

/**
 * Parses natural language input into a structured transaction object.
 * Example: "BugÃ¼n markette 250 TL harcadÄ±m" -> { description: "Market alÄ±ÅŸveriÅŸi", amount: 250, type: "expense", category: "AlÄ±ÅŸveriÅŸ" }
 */
export async function parseTransactionNaturalLanguage(
  input: string,
  language: Language = 'tr'
): Promise<SmartParseResult | null> {
  const ai = getAI();
  if (!ai) return null;

  try {
    const model = ai.getGenerativeModel({ model: MODEL_ID });

    const prompt = `Parse this financial transaction text into JSON: "${input}". 
The user language is ${language === 'tr' ? 'Turkish' : 'English'}.
If the text implies spending, it is "expense". If receiving money, "income".
Today's date is ${new Date().toISOString().split('T')[0]}.

Return ONLY a valid JSON object with these fields:
{
  "description": "A concise description of the transaction",
  "amount": numeric value (always positive),
  "type": "income" or "expense",
  "category": "Best fit category from: MaaÅŸ, Freelance, YatÄ±rÄ±m, Hediye, Yemek, UlaÅŸÄ±m, Konut, Faturalar, EÄŸlence, SaÄŸlÄ±k, AlÄ±ÅŸveriÅŸ, DiÄŸer",
  "date": "YYYY-MM-DD format, default to today if not specified"
}

Return ONLY the JSON, no additional text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) return null;

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const data = JSON.parse(jsonMatch[0]);

    return {
      description: data.description,
      amount: Math.abs(Number(data.amount)),
      type: data.type === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE,
      category: data.category,
      date: data.date || new Date().toISOString().split('T')[0],
    };
  } catch (error) {
    console.error('Error parsing transaction with Gemini:', error);
    return null;
  }
}

/**
 * Generates financial insights based on the list of transactions.
 */
export async function generateFinancialInsights(
  transactions: Transaction[],
  language: Language = 'tr'
): Promise<FinancialInsight[]> {
  const ai = getAI();
  if (!ai || transactions.length === 0) return [];

  const simplifiedData = transactions
    .slice(-50) // Last 50 transactions for context
    .map((t) => `${t.date}: ${t.type} of ${t.amount} for ${t.categoryLabel} (${t.description})`)
    .join('\n');

  try {
    const model = ai.getGenerativeModel({ model: MODEL_ID });

    const prompt = `Analyze these transactions and provide 3 helpful, specific financial insights. 
User Language: ${language === 'tr' ? 'Turkish (TÃ¼rkÃ§e)' : 'English'}.
CRITICAL: Write the 'title' and 'advice' strictly in ${language === 'tr' ? 'Turkish' : 'English'}.
Focus on spending habits, potential savings, or kudos.

Transactions:
${simplifiedData}

Return ONLY a valid JSON array with objects having these fields:
[
  {
    "title": "Short, punchy title for the insight",
    "advice": "2-3 sentences of specific financial advice based on the data",
    "color": "green" or "yellow" or "red" or "blue"
  }
]

Use "green" for positive insights, "yellow" for warnings, "red" for urgent issues, "blue" for general tips.
Return ONLY the JSON array, no additional text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) return [];

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    return JSON.parse(jsonMatch[0]) as FinancialInsight[];
  } catch (error) {
    console.error('Error generating insights:', error);
    return [
      {
        title: language === 'tr' ? 'Analiz BaÅŸarÄ±sÄ±z' : 'Analysis Failed',
        advice: language === 'tr' ? 'Åu anda iÃ§gÃ¶rÃ¼ oluÅŸturulamadÄ±.' : 'Could not generate AI insights at this time.',
        color: 'red',
      },
    ];
  }
}

/**
 * Allows the user to chat with their financial data using Gemini.
 */
export async function askFinancialAdvisor(
  query: string,
  transactions: Transaction[],
  language: Language = 'tr'
): Promise<string> {
  try {
    const response = await chatWithAssistant(query);
    if (response?.message) {
      return response.message;
    }
  } catch (error) {
    console.warn('AI chat fallback to client model:', error);
  }

  const ai = getAI();
  if (!ai) {
    return language === 'tr'
      ? 'AI servisi ÅŸu anda kullanÄ±lamÄ±yor. LÃ¼tfen API anahtarÄ±nÄ± kontrol edin.'
      : 'AI service is currently unavailable. Please check the API key.';
  }

  if (transactions.length === 0) {
    return language === 'tr'
      ? 'HenÃ¼z analiz edilecek iÅŸlem verisi yok. LÃ¼tfen Ã¶nce bazÄ± iÅŸlemler ekleyin.'
      : "I don't have any transaction data to analyze yet. Please add some transactions first.";
  }

  const contextData = transactions
    .slice(-100) // Last 100 transactions for context
    .map((t) => `- ${t.date}: ${t.type} ${t.amount} (${t.categoryLabel}) - ${t.description}`)
    .join('\n');

  try {
    const model = ai.getGenerativeModel({ model: MODEL_ID });

    const prompt = `You are a smart, encouraging, and professional personal finance assistant named Lumina.
User Language: ${language === 'tr' ? 'Turkish (TÃ¼rkÃ§e)' : 'English'}.

DATA:
Here is the user's recent financial transaction history (last 100 items):
${contextData}

USER QUESTION: "${query}"

INSTRUCTIONS:
1. Answer ONLY in ${language === 'tr' ? 'Turkish' : 'English'}.
2. Base your answer STRICTLY on the provided data. Do not make up numbers.
3. When mentioning money, format it nicely (e.g., 1.200,50 â‚º for Turkish or $1,200.50 for English).
4. Be concise but helpful. If the user asks for a total, calculate it.
5. If the data implies a problem (e.g., spending more than earning), gently point it out.
6. Be friendly and supportive in your tone.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text || (language === 'tr' ? 'Cevap oluÅŸturulamadÄ±.' : "I couldn't generate a response.");
  } catch (error) {
    console.error('Chat error:', error);
    return language === 'tr'
      ? 'ÃœzgÃ¼nÃ¼m, verilerinizi analiz ederken bir hata oluÅŸtu.'
      : 'Sorry, I encountered an error while analyzing your data.';
  }
}

/**
 * Check if AI features are available (API key is set)
 */
export function isAIAvailable(): boolean {
  return true;
}

