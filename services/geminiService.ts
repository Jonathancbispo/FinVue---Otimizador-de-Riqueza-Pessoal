
import { GoogleGenAI, Type } from "@google/genai";
import { CalculationResults, ExpenseData, IncomeData, FinancialState } from "../types";

// Always use process.env.API_KEY directly as a named parameter.
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
    Responda com apenas UMA frase curta, impactante e motivadora em Português.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // response.text is a property, not a method.
    return response.text || "Mantenha o foco em seus objetivos financeiros!";
  } catch (error) {
    return "Analise seus gastos fixos para garantir estabilidade no próximo mês.";
  }
};

export const getMarketIntelligence = async (newsHeadlines: string[]): Promise<any> => {
  const prompt = `
    Você é um estrategista de investimentos e macroeconomia. Analise estas manchetes:
    ${newsHeadlines.join(" | ")}

    Retorne os dados estruturados sobre o sentimento do mercado, explicação macro, e projeções de curto, médio e longo prazo incluindo sugestões de ativos.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        // Using responseSchema for robust JSON structure as recommended.
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: { type: Type.STRING, description: 'Bullish, Bearish ou Neutral.' },
            explanation: { type: Type.STRING, description: 'Resumo macro de 2 frases.' },
            shortTerm: {
              type: Type.OBJECT,
              properties: {
                outlook: { type: Type.STRING },
                risk: { type: Type.STRING },
                portfolio: { type: Type.ARRAY, items: { type: Type.STRING } }
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
            drivers: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Principais fatores influenciadores.' }
          },
          required: ['sentiment', 'explanation', 'shortTerm', 'mediumTerm', 'longTerm', 'drivers'],
          propertyOrdering: ["sentiment", "explanation", "shortTerm", "mediumTerm", "longTerm", "drivers"]
        }
      },
    });
    // response.text is a property.
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Market Intel Error:", error);
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
    Responda de forma estratégica e objetiva.
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
    // response.text is a property.
    return response.text || "Desculpe, não consegui processar sua dúvida agora.";
  } catch (error) {
    return "Houve um erro ao processar sua consulta.";
  }
};
