# Legal and compliance review (research-based, not legal advice)

Reviewed 2026-11-13 against the site as built. **This is a structured research review by an AI assistant. It is not legal advice, it is not a lawyer's opinion, and it has not been checked by a lawyer.** Rule citations come from general knowledge of the laws named and could not all be checked against the current official texts from the build environment. Treat each citation as a pointer for a qualified lawyer in India and in the US to confirm, and check commencement dates and recent amendments.

Status key: **Compliant** (the site's design already meets the point as understood) · **Fixed** (a gap was found and changed in this pass) · **Owner action** (needs real details or a registration only the owner can supply) · **Lawyer** (needs a qualified lawyer's judgment).

## India

| # | Area and rule | Status | What the site does, or what is needed |
|---|---|---|---|
| 1 | Digital Personal Data Protection Act, 2023: notice (s.5) and consent (s.6), withdrawal as easy as giving (s.6(4)) | Compliant / Fixed | Banner has equal "Accept all" and "Reject all", per-purpose choices (advertising, analytics), nothing loads before consent, withdrawal through "Cookie settings" in the footer. Consent re-asked after 12 months. Privacy Policy states purposes. |
| 2 | DPDP Act rights (ss.11 to 14): summary of data, correction and erasure, grievance redressal, nomination | Fixed | Section 7 and 12 of the Privacy Policy describe each right and the route (email to the Grievance Officer, 7-day acknowledgement and 30-day response aim). |
| 3 | DPDP Act, children (s.9): verifiable parental consent for under-18s, no tracking, behavioural monitoring or targeted advertising directed at children | Lawyer | The site is general audience and says it does not knowingly process children's data. Whether ad cookies shown to an unknown visitor who is a minor fall under s.9 is a legal question; a lawyer should advise on ad settings (for example restricting personalised ads). |
| 4 | DPDP Rules: phased commencement, Data Protection Board, consent managers | Lawyer | Check the commencement dates that currently apply and whether any duty (for example breach notification) applies at the site's scale. |
| 5 | IT Act, 2000, s.43A and the SPDI Rules, 2011: published privacy policy (Rule 4), Grievance Officer with a published name and contact (Rule 5(9)) | Fixed / Owner action | Policy published and linked in the footer. The Grievance Officer name is a `[placeholder]` in `OPERATOR` (`src/config/site.ts`); the owner must name a real person. The site collects no sensitive personal data. |
| 6 | IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, Rule 3(1)(a) to (c) | Lawyer | Applies to intermediaries. The site hosts no user content, so it is probably not one; a lawyer should confirm. Terms and the privacy policy are published in any case. |
| 7 | Consumer Protection Act, 2019 (misleading advertisement, s.2(28), ss.21 and 89), CCPA Guidelines for Prevention of Misleading Advertisements, 2022; Consumer Protection (E-Commerce) Rules, 2020 | Compliant / Fixed | Copy lint (`scripts/lib/copy-rules.mjs`, run by tests and by `npm run check:built`) blocks guarantees, "most accurate", "official calculator", endorsement claims and savings or returns promises. The site is not an e-commerce entity. Advertisements served by Google are the advertiser's responsibility, and the disclosure page says so. |
| 8 | SEBI (Investment Advisers) Regulations, 2013 (reg. 3: no person may act as an investment adviser without registration) and SEBI (Research Analysts) Regulations, 2014 | Compliant / Lawyer | Tools compute from user-entered numbers and assumed returns, with no personalised recommendation, no product ranking and no "better for you" wording (the old "Better for you: New regime" headline was replaced with a neutral difference). Guides describe rules and do not recommend. Disclaimer states the operator is not a registered adviser or analyst **unless the owner is; the owner must confirm that sentence is true**. A lawyer should confirm the boundary for the SIP and tax content. |
| 9 | Income-tax law: no statutory disclaimer is required; return preparation is regulated (Tax Return Preparer Scheme, 2006) | Compliant | The site does not prepare or file returns, and says so. |
| 10 | State Emblem of India (Prohibition of Improper Use) Act, 2005; names of departments | Compliant | No emblem, logo or seal is used. Bodies are named only to cite sources, with a non-affiliation statement on the Disclaimer, About and Copyright pages. |
| 11 | Copyright Act, 1957 (fair dealing, s.52) | Compliant | Figures are restated in our own words and tables with links; no official text is copied. Copyright notice and takedown route on `/copyright/`. |
| 12 | Accessibility: Rights of Persons with Disabilities Act, 2016, GIGW | Compliant (voluntary) | Private websites are not directly bound. See row 27. |

## United States

| # | Area and rule | Status | What the site does, or what is needed |
|---|---|---|---|
| 13 | California Consumer Privacy Act as amended by CPRA (Cal. Civ. Code § 1798.100 et seq.): notice at collection, opt-out of sale and sharing (§ 1798.120, § 1798.135), Global Privacy Control (regs § 7025) | Fixed / Lawyer | Footer has "Do Not Sell or Share My Personal Information", which switches advertising cookies off; GPC is honoured as an opt-out. Notice at collection is in the Privacy Policy. Whether the site meets the CCPA applicability thresholds (revenue, number of consumers, share of revenue from selling or sharing) is a question for a lawyer; a very small site may be outside it, but the controls cost nothing to keep. |
| 14 | Other state privacy laws (for example Virginia, Colorado, Connecticut, Texas, Oregon and others): notice, opt-out of targeted advertising, universal opt-out signals in several | Compliant / Lawyer | Same controls cover them. Thresholds and rights differ by state; a lawyer should confirm which apply. |
| 15 | COPPA (15 U.S.C. §§ 6501 to 6506; 16 CFR Part 312) | Compliant | General-audience site, not directed to children, no knowing collection from under-13s. Do not add child-directed content without revisiting this. |
| 16 | FTC Act § 5 and the Endorsement Guides (16 CFR Part 255), FTC online disclosure guidance | Compliant | No endorsements, testimonials or affiliate links today. The Advertising Disclosure page commits to clear disclosure beside any affiliate link added later. |
| 17 | CAN-SPAM Act (15 U.S.C. §§ 7701 to 7713) | Not applicable | No email sending. If a newsletter is added: physical address, unsubscribe, accurate headers. |
| 18 | IRS Circular 230 (31 CFR Part 10) | Compliant | It governs practitioners who practice before the IRS. The site is not one and says so. A "Circular 230 disclaimer" is not required and was dropped from the rules for practitioners' written advice in 2014, so none is shown. |
| 19 | Tax return preparer rules (Internal Revenue Code § 7701(a)(36), § 6694; state registration regimes such as California CTEC, Oregon, Maryland, New York) | Compliant | The site does not prepare returns for compensation. Disclaimer says so. |
| 20 | Investment Advisers Act of 1940, § 202(a)(11); publisher exclusion (Lowe v. SEC, 472 U.S. 181 (1985)) and state adviser laws | Lawyer | Content is general, not personalised, and of general circulation, which points to the publisher exclusion. A lawyer should confirm, especially for the retirement and 401(k) tools. |
| 21 | DMCA, 17 U.S.C. § 512(c): takedown procedure and **a designated agent registered with the Copyright Office** for safe harbour | Owner action | Notice and counter-notice text is on `/copyright/`. The owner must register an agent and fill `OPERATOR.dmcaAgent`. |
| 22 | Americans with Disabilities Act, Title III, and the Department of Justice's WCAG position | Lawyer / Owner action | No fixed legal standard for private sites. WCAG 2.1 AA is the target, automated checks show no violations, but there has been no independent audit and no manual screen-reader testing. The Accessibility Statement says exactly that. |

## Google advertising and consent policies

| # | Area and rule | Status | What the site does, or what is needed |
|---|---|---|---|
| 23 | AdSense Program Policies: content and privacy-policy disclosure of ad cookies and data use | Compliant | Privacy and Cookie Policies describe Google's cookies and link to Google's partner-sites page and ad settings. Ads are labelled "Advertisement" and kept apart from results. Google's own review of the site is separate and may raise points not listed here. |
| 24 | Google EU user consent policy: for visitors in the EEA, the UK and Switzerland, ads require a consent management platform that is certified by Google and integrates the IAB Transparency and Consent Framework | **Owner action** | The site's own banner is **not** a Google-certified CMP. It loads no ad scripts before consent, so it is conservative, but it may not satisfy Google for European traffic. Options: turn on Google's free "Privacy & messaging" CMP in the AdSense account, use another certified CMP, or serve ads only outside the EEA, UK and Switzerland. A lawyer or Google's account support can confirm which is needed for the traffic the site actually receives. |
| 25 | Google Consent Mode v2 signals | Fixed (analytics path only) | The Google Analytics loader sets all four consent types to denied first and updates them to the visitor's choice. Ads are not loaded at all without consent, so no signal is needed for them. |
| 26 | `ads.txt`, AdSense publisher ID | Owner action | `public/ads.txt` is a placeholder; fill it from the AdSense account. |

## Cross-cutting

| # | Area | Status | Notes |
|---|---|---|---|
| 27 | GDPR / UK GDPR and ePrivacy (Art. 6, 7, 13, 15 to 21; storage and access consent) | Compliant / Lawyer | Opt-in consent, equal reject option, granular choices, withdrawal, 12-month expiry, no pre-ticked boxes, rights and complaint routes in the policy. A lawyer should consider whether the site "targets" the EEA or UK (which would bring an Article 27 representative into play) and whether a legitimate-interest assessment is needed for server logs. |
| 28 | Calculator inputs and shared links | Fixed | Inputs are processed only in the browser. "Copy link" builds a link containing inputs only on request. A page opened from such a link removes the inputs from the address bar immediately, so analytics and ad scripts cannot read them from the URL. Analytics is also told the page address without a query string. |
| 29 | Unverified figures | Fixed | Every page whose figures are not fully confirmed shows "Applies to" and "Not yet confirmed" labels, driven from the config files. A test fails if a file containing `TODO(verify)` is not registered with a visible label. India income tax is stated for FY 2025-26 (confirmed); FY 2026-27 is shown as not confirmed. US state schedules, the PPF rate, the HRA metro list and GST special rates are labelled or not modelled. |
| 30 | "Estimate" wording | Fixed | Every result headline reads "Estimated ..." and every result carries "Estimate only. Actual amounts may differ." in the page, the copied text, print and the mobile result bar. Tests and `check:built` enforce this. |
| 31 | Advice language | Fixed | Copy lint covers tool copy, FAQs, guides, page and layout text, worked-example steps and hints; `check:built` re-checks the built HTML. |
| 32 | Terms of use: limitation of liability, indemnity, governing law and courts | Lawyer / Owner action | Template wording. Enforceability against consumers differs by country and state. Governing law and court fields are placeholders. |
| 33 | Operator identity, address, contact email | Owner action | All `[bracketed]` placeholders on the legal pages must be replaced; `npm run check:built` reports how many remain. A named operator is needed for the DPDP, IT Rules, CCPA and DMCA pages. |
| 34 | Template notice on legal pages | Owner action | Each legal page shows a visible notice that it is an unreviewed template. After a lawyer reviews the pages, set `LEGAL_TEMPLATE_NOTICE` to `false` in `src/config/site.ts`. |

## Added with the everyday tools

| # | Area | Status | Notes |
|---|---|---|---|
| 35 | Expense tracker: personal data kept in the browser | Compliant | Entries stay in local storage on the visitor's device and are never sent to the site, so the operator does not hold them. The Privacy and Cookie Policies list the storage key and how to delete the data. Amounts are not sensitive identifiers, but notes are free text; the tool tells users where data lives. |
| 36 | Currency converter: no third-party call from the visitor's browser | Compliant | Rates are a build-time snapshot, so no visitor IP address goes to a rate provider and no extra consent is needed. Labelled "Indicative", dated, with a staleness warning after 7 days. Rates are not a basis for transactions; the page says banks and card networks differ. |
| 37 | Deadline calendar: dates must not be wrong | Lawyer / Owner action | Only dates read on an official page are shown, each with its link; unconfirmed India and US-2027 dates are listed as "not included". A wrong or changed deadline could cause real harm to a user who relies on it, so the page and every `.ics` entry say to confirm on the official page and that this is not tax advice. A lawyer should review that wording; the owner should add India dates only after reading the official calendar. |
| 38 | Third-party data licence for rates | Lawyer | The rates come from the ECB reference rates through the Frankfurter service. Check the current terms of use of both before relying on this commercially. |

## What this review did not do

- It did not consult each statute's current official text; it did not check state-by-state variations or recent amendments.
- It did not review Google's account-level policy decisions, the actual traffic mix, or the operator's real business structure.
- It is not an audit of the code against any certification. A lawyer in India and one in the US should review the Privacy Policy, Cookie Policy, Terms, Disclaimer, Advertising Disclosure and Copyright pages before launch.
