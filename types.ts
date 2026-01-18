
export interface IncomeData {
  fixed: number[];
  extra: number[];
  investments: number[];
}

export interface ExpenseData {
  fixed: number[];
  creditCard: number[];
  monthlyPurchases: number[];
  butcher: number[];
  weekly: number[];
  otherExpenses: number[];
}

export interface FinancialState {
  income: IncomeData;
  expenses: ExpenseData;
}

export interface CalculationResults {
  annualIncome: number;
  annualGross: number;
  annualExpenses: number;
  annualBalance: number;
  savingsRate: number;
  pGross: number;
  pIncome: number;
  pExpenses: number;
  pInvested: number;
  pBalance: number;
  allMonthlyResults: { 
    income: number; 
    gross: number;
    expense: number; 
    balance: number;
    invested: number;
    month: string;
    shortMonth: string;
  }[];
  cumulativeResults: { month: string; balance: number }[];
  periodResults: any[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
