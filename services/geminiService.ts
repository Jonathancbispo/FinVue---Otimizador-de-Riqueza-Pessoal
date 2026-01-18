
import { GoogleGenAI, Type } from "@google/genai";
import { CalculationResults, ExpenseData, IncomeData, FinancialState } from "../types";

export const getFinancialAdvice = async (
  state: FinancialState,
  results: CalculationResults,
  currentMonthIdx: number
): Promise<string> => {
  // Always create a new instance inside the function to use latest process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const currentMonthName = MONTHS[currentMonthIdx];
  const monthlyRes = results.allMonthlyResults[currentMonthIdx];
  const balance = monthlyRes.income - monthlyRes.expense;
  
  const currentIncome = state.income.fixed[currentMonthIdx] + state.income.extra[currentMonthIdx];
  const currentInvestments = state.income.investments[currentMonthIdx];

  const prompt = `Analise: Mês ${currentMonthName}, Renda R$${currentIncome}, Investido R$${currentInvestments}, Gasto R$${monthlyRes.expense}, Saldo R$${balance}. Responda com 1 frase motivadora curta em Português do Brasil.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget: 0 } }
    });
    // Extract text output using the .text property (not a method)
    return response.text || "Foco no seu futuro financeiro!";
  } catch (error) {
    return "Consistência é a chave para a liberdade financeira.";
  }
};

export const getMarketIntelligence = async (newsHeadlines: string[]): Promise<any> => {
  // Always create a new instance inside the function to use latest process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const context = newsHeadlines && newsHeadlines.length > 0 
    ? `Notícias Atuais: ${newsHeadlines.slice(0, 5).join(" | ")}` 
    : "Tendências econômicas globais para o investidor brasileiro em 2025";

  // Instrução explícita de idioma e velocidade
  const prompt = `Aja como analista financeiro sênior. Analise o contexto e retorne um JSON estrito. 
  IMPORTANTE: Todos os textos explicativos, nomes de ativos no portfólio e descrições DEVEM estar em PORTUGUÊS DO BRASIL.
  Contexto: ${context}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: { type: Type.STRING, description: 'Ex: Otimista, Pessimista, Estável' },
            explanation: { type: Type.STRING, description: 'Explicação curta em português' },
            shortTerm: {
              type: Type.OBJECT,
              properties: {
                outlook: { type: Type.STRING, description: 'Perspectiva em português' },
                risk: { type: Type.STRING, description: 'Nível de risco: Baixo, Médio ou Alto' },
                portfolio: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Lista de ativos em português' }
              },
              required: ['outlook', 'risk', 'portfolio']
            },
            mediumTerm: {
              type: Type.OBJECT,
              properties: {
                outlook: { type: Type.STRING },
                risk: { type: Type.STRING },
                portfolio: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ['outlook', 'risk', 'portfolio']
            },
            longTerm: {
              type: Type.OBJECT,
              properties: {
                outlook: { type: Type.STRING },
                risk: { type: Type.STRING },
                portfolio: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ['outlook', 'risk', 'portfolio']
            },
            drivers: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Fatores determinantes em português' }
          },
          required: ['sentiment', 'explanation', 'shortTerm', 'mediumTerm', 'longTerm', 'drivers']
        }
      },
    });
    // Extract text output using the .text property (not a method)
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
  // Always create a new instance inside the function to use latest process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const systemInstruction = `Você é o FinVue Voice. Especialista em finanças pessoais.
  Responda SEMPRE em Português do Brasil de forma extremamente direta. 
  Dados atuais do usuário: ${JSON.stringify(fullData)}.`;

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
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingBudget: 0 }
      },
    });
    // Extract text output using the .text property (not a method)
    return response.text || "Não consegui processar sua solicitação.";
  } catch (error) {
    return "Erro na conexão com o servidor de IA.";
  }
};
