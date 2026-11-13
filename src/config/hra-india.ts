/** House rent allowance (HRA) exemption parameters. Applies only where the old tax regime is chosen. */
export const hraIndia = {
  lastUpdated: '2026-11-13',
  /** Share of basic salary (plus dearness allowance) that bounds the exemption. */
  metroShare: 0.5,
  otherShare: 0.4,
  /** Rent paid minus this share of basic salary is one of the three limits. */
  rentExcessShare: 0.1,
  /** Cities treated as "metro" for the 50% limit. */
  metroCities: ['Mumbai', 'Delhi', 'Kolkata', 'Chennai', 'Bengaluru', 'Hyderabad', 'Pune', 'Ahmedabad'],
  verified: false,
  verificationNote:
    'The 50% / 40% / rent-minus-10% structure is long-standing. The extension of the 50% rate to Bengaluru, Hyderabad, Pune and Ahmedabad from 1 April 2026 comes from press coverage of the Income Tax Rules, 2026; the rule text itself was not opened.',
  // TODO(verify): read the Income-tax Rules 2026 provision on HRA and confirm the eight-city list and the 10% / 40% / 50% limits.
  sourceUrls: ['https://www.moneylife.in/article/new-income-tax-rules-from-1st-april-hra-exemption-extended-to-8-cities-fewer-forms-but-landlord-disclosure-now-mandatory/79998.html'],
};
