
// Pure utility — no DB calls. Safe to import anywhere.

export interface ComplianceResult {
    // Per-fund requirements (each is 5% of loan principal)
    requiredSf: number;
    requiredGf: number;

    // Current balances
    currentSf: number;
    currentGf: number;

    // Per-fund shortfalls (0 if already meets requirement)
    sfShortfall: number;
    gfShortfall: number;

    // Combined totals for convenience
    totalRequired: number;   // requiredSf + requiredGf = 10% of principal
    totalCurrent: number;    // currentSf + currentGf
    totalShortfall: number;  // sfShortfall + gfShortfall

    // Per-fund compliance flags
    isSfCompliant: boolean;
    isGfCompliant: boolean;
    isCompliant: boolean;    // true only when BOTH are compliant

    // Amounts to top up (equal to the respective shortfalls)
    sfTopUp: number;
    gfTopUp: number;
}

/**
 * Compute SF and GF compliance individually.
 *
 * Rule: 
 *   SF must be >= 5% of totalActiveLoanPrincipal
 *   GF must be >= 5% of totalActiveLoanPrincipal
 *
 * A member is fully compliant only when BOTH conditions are met.
 */
export function computeCompliance(
    shareFund: number,
    guaranteedFund: number,
    totalActiveLoanPrincipal: number,
): ComplianceResult {
    const requiredSf = Math.ceil(totalActiveLoanPrincipal * 0.05);
    const requiredGf = Math.ceil(totalActiveLoanPrincipal * 0.05);

    const currentSf = shareFund || 0;
    const currentGf = guaranteedFund || 0;

    const sfShortfall = Math.max(0, requiredSf - currentSf);
    const gfShortfall = Math.max(0, requiredGf - currentGf);

    const isSfCompliant = sfShortfall === 0;
    const isGfCompliant = gfShortfall === 0;
    const isCompliant = isSfCompliant && isGfCompliant;

    return {
        requiredSf,
        requiredGf,
        currentSf,
        currentGf,
        sfShortfall,
        gfShortfall,
        totalRequired: requiredSf + requiredGf,
        totalCurrent: currentSf + currentGf,
        totalShortfall: sfShortfall + gfShortfall,
        isSfCompliant,
        isGfCompliant,
        isCompliant,
        sfTopUp: sfShortfall,
        gfTopUp: gfShortfall,
    };
}
