
// Pure utility — no DB calls. Safe to import anywhere.

export interface ComplianceResult {
    required: number;       // 5% of total active loan principal
    current: number;        // shareFund + guaranteedFund
    shortfall: number;      // how much is missing (0 if compliant)
    isCompliant: boolean;
    sfTopUp: number;        // shortfall split 50/50 → SF portion
    gfTopUp: number;        // shortfall split 50/50 → GF portion
}

/**
 * Compute SF/GF compliance for a single member.
 * Required = totalActiveLoanPrincipal * 5%.
 * The shortfall is split evenly between SF and GF.
 */
export function computeCompliance(
    shareFund: number,
    guaranteedFund: number,
    totalActiveLoanPrincipal: number,
): ComplianceResult {
    const required = Math.ceil(totalActiveLoanPrincipal * 0.05);
    const current = (shareFund || 0) + (guaranteedFund || 0);
    const shortfall = Math.max(0, required - current);
    const isCompliant = shortfall === 0;

    // Split shortfall evenly; if odd number give extra rupee to SF
    const gfTopUp = Math.floor(shortfall / 2);
    const sfTopUp = shortfall - gfTopUp;

    return { required, current, shortfall, isCompliant, sfTopUp, gfTopUp };
}
