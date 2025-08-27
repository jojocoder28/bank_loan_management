
/**
 * @fileOverview This file contains all the business logic and calculations
 * specific to the cooperative bank's rules.
 */

/**
 * Calculates the required amounts for Share and Guaranteed funds based on the loan amount.
 * @param loanAmount The total loan amount requested.
 * @returns An object containing the required share and guaranteed fund amounts.
 */
export function calculateRequiredFunds(loanAmount: number): { requiredShare: number; requiredGuaranteed: number } {
  if (loanAmount <= 0) {
    return { requiredShare: 0, requiredGuaranteed: 0 };
  }
  const percentage = 0.05; // 5%
  const requiredAmount = loanAmount * percentage;
  return {
    requiredShare: requiredAmount,
    requiredGuaranteed: requiredAmount,
  };
}

/**
 * Calculates the monthly interest payment on the outstanding loan principal.
 * The bank charges 10% annual interest, which translates to a monthly rate.
 * @param outstandingPrincipal The remaining principal amount of the loan.
 * @param annualInterestRate The annual interest rate as a percentage (e.g., 10 for 10%).
 * @returns The calculated monthly interest payment.
 */
export function calculateMonthlyInterest(outstandingPrincipal: number, annualInterestRate: number): number {
    if (outstandingPrincipal <= 0 || annualInterestRate <= 0) {
        return 0;
    }
    const monthlyInterestRate = annualInterestRate / 12 / 100;
    return outstandingPrincipal * monthlyInterestRate;
}


/**
 * Calculates the annual interest earned on a fund balance.
 * @param balance The balance in the fund.
 * @param annualInterestRate The annual interest rate as a percentage (e.g., 6 for 6%).
 * @returns The total interest earned for the year.
 */
export function calculateAnnualInterest(balance: number, annualInterestRate: number): number {
    if (balance <= 0 || annualInterestRate <= 0) {
        return 0;
    }
    return balance * (annualInterestRate / 100);
}

/**
 * Calculates the dividend for the Share Fund.
 * @param shareFundBalance The member's balance in the Share Fund.
 * @param dividendRate The dividend rate as a percentage (e.g., 12 for 12%).
 * @returns The calculated dividend amount.
 */
export function calculateDividend(shareFundBalance: number, dividendRate: number): number {
    if (shareFundBalance <= 0 || dividendRate <= 0) {
        return 0;
    }
    return shareFundBalance * (dividendRate / 100);
}


