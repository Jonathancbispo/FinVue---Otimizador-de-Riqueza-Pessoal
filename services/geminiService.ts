
import { GoogleGenAI, Type } from "@google/genai";
import { CalculationResults, ExpenseData, IncomeData, FinancialState } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFinancialAdvice = async (
  state: FinancialState,
  results: CalculationResults,
  currentMonthIdx: number
): Promise<string> => {
  const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const currentMonthName = MONTHS[currentMonthIdx];
  const monthlyRes = results.allMonthlyResults[currentMonthIdx];
  const balance = monthlyRes.income - monthlyRes.expense;
  
  const currentIncome = state.income.fixed[currentMonthIdx] + state.income.extra[currentMonthIdx];
  const currentInvestments = state.income.investments[currentMonthIdx];

  const prompt = `
    Como um consultor financeiro inteligente, analise o contexto completo deste usuário para o mês de ${currentMonthName}:
    - Renda Bruta: R$${currentIncome}
    - Valor Investido: R$${currentInvestments}
    - Gastos Totais: R$${monthlyRes.expense}
    - Saldo Final: R$${balance}
    Responda com apenas UMA frase curta, impactante e motivadora em Português do Brasil.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Mantenha o foco em seus objetivos financeiros!";
  } catch (error) {
    return "Analise seus gastos fixos para garantir estabilidade no próximo mês.";
  }
};

export const getMarketIntelligence = async (newsHeadlines: string[]): Promise<any> => {
  if (!newsHeadlines || newsHeadlines.length === 0) return null;

  const prompt = `
    Você é um estrategista de investimentos sênior. Analise estas manchetes e forneça uma visão estratégica consolidada:
    ${newsHeadlines.join(" | ")}

    REGRAS:
    - O sentimento deve ser EXATAMENTE: "Otimista", "Pessimista" ou "Neutro".
    - Todas as perspectivas e riscos devem estar em Português do Brasil.
    - Seja direto e profissional.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: { type: Type.STRING, description: 'Sentimento único: Otimista, Pessimista ou Neutro.' },
            explanation: { type: Type.STRING, description: 'Resumo macro de até 2 frases.' },
            shortTerm: {
              type: Type.OBJECT,
              properties: {
                outlook: { type: Type.STRING, description: 'Perspectiva de 0-3 meses.' },
                risk: { type: Type.STRING, description: 'Nível: Baixo, Médio ou Alto.' },
                portfolio: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Lista de ativos recomendados.' }
              },
              required: ['outlook', 'risk', 'portfolio']
            },
            mediumTerm: {
              type: Type.OBJECT,
              properties: {
                outlook: { type: Type.STRING, description: 'Perspectiva de 3-12 meses.' },
                risk: { type: Type.STRING, description: 'Nível: Baixo, Médio ou Alto.' },
                portfolio: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ['outlook', 'risk', 'portfolio']
            },
            longTerm: {
              type: Type.OBJECT,
              properties: {
                outlook: { type: Type.STRING, description: 'Perspectiva de 1-5 anos.' },
                risk: { type: Type.STRING, description: 'Nível: Baixo, Médio ou Alto.' },
                portfolio: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ['outlook', 'risk', 'portfolio']
            },
            drivers: { type: Type.ARRAY, items: { type: Type.STRING }, description: '3 fatores influenciadores.' }
          },
          required: ['sentiment', 'explanation', 'shortTerm', 'mediumTerm', 'longTerm', 'drivers']
        }
      },
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Erro Inteligência de Mercado:", error);
    return null;
  }
};

export const chatWithAi = async (
  message: string,
  fullData: FinancialState,
  history: { role: 'user' | 'model'; text: string }[]
): Promise<string> => {
  const systemInstruction = `
    Você é o Agente FinVue, um especialista em análise financeira pessoal e investimentos.
    Você tem acesso aos dados reais do usuário: ${JSON.stringify(fullData)}.
    Sempre responda em Português do Brasil de forma estratégica, empática e objetiva.
  `;

  const contents = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));

  contents.push({
    role: 'user',
    parts: [{ text: message }]
  });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: contents,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingBudget: 32768 }
      },
    });
    return response.text || "Desculpe, não consegui processar sua dúvida agora.";
  } catch (error) {
    return "Houve um erro ao processar sua consulta.";
  }
};
