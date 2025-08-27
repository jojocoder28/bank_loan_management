/**
 * Calculates the monthly payment for a loan using the amortization formula.
 * @param principal The total loan amount.
 * @param annualInterestRate The annual interest rate as a percentage (e.g., 5 for 5%).
 * @param loanTermInYears The duration of the loan in years.
 * @returns The calculated monthly payment amount.
 */
export function calculateMonthlyPayment(
  principal: number,
  annualInterestRate: number,
  loanTermInYears: number
): number {
  if (principal <= 0 || annualInterestRate < 0 || loanTermInYears <= 0) {
    return 0;
  }

  const monthlyInterestRate = annualInterestRate / 100 / 12;
  const numberOfPayments = loanTermInYears * 12;

  if (monthlyInterestRate === 0) {
    return principal / numberOfPayments;
  }

  const monthlyPayment =
    principal *
    (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) /
    (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);

  return monthlyPayment;
}

/**
 * Calculates the loan tenure in months based on principal, interest rate, and monthly payment.
 * @param principal The total loan amount.
 * @param annualInterestRate The annual interest rate as a percentage.
 * @param monthlyPayment The desired monthly payment amount.
 * @returns The total number of months to repay the loan, or Infinity if payment is too low.
 */
export function calculateLoanTenure(
  principal: number,
  annualInterestRate: number,
  monthlyPayment: number,
): number {
    if (principal <= 0 || annualInterestRate < 0 || monthlyPayment <= 0) {
        return 0;
    }

    const monthlyInterestRate = annualInterestRate / 100 / 12;

    // If the monthly payment is less than or equal to the first month's interest, the loan will never be paid off.
    if (monthlyPayment <= principal * monthlyInterestRate) {
        return Infinity;
    }

    if (monthlyInterestRate === 0) {
      return Math.ceil(principal / monthlyPayment);
    }
    
    const numberOfPayments = 
        -(Math.log(1 - (principal * monthlyInterestRate) / monthlyPayment)) / 
        Math.log(1 + monthlyInterestRate);
        
    return Math.ceil(numberOfPayments);
}
