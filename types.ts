
export interface IncomeData {
  fixed: number[];
  extra: number[];
  investments: number[];
}

export interface ExpenseData {
  fixed: number[];
  creditCard: number[];
  monthlyPurchases: number[]; // Substituído 'groceries'
  butcher: number[];
  weekly: number[];
  otherExpenses: number[];
}

export interface FinancialState {
  income: IncomeData;
  expenses: ExpenseData;
}

export interface CalculationResults {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyBalance: number;
  annualIncome: number;
  annualExpenses: number;
  annualBalance: number;
  allMonthlyResults: { income: number; expense: number; month: string }[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
