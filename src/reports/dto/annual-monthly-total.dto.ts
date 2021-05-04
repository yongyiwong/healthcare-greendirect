export interface AnnualMonthlyTotalDto {
  [year: number]: {
    total: number;
    monthlyTotal: number[]; // array of monthly total
  };
}
