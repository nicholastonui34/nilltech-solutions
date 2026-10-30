/**
 * Banks freelancers can be paid into (owner, 2026-10-30: M-Pesa or a Kenyan
 * bank only). Compiled from the Central Bank of Kenya's list of licensed
 * commercial banks as known in 2026. It is NOT verified against CBK's live
 * directory (the cloud session can't reach centralbank.go.ke): check it at
 * https://www.centralbank.go.ke/bank-supervision/ and update this list when
 * banks merge, rename or close. Freelancers can still pick "Other Kenyan
 * bank" and type the name, so a gap here never blocks a payout.
 */
export const KENYAN_BANKS = [
  "Absa Bank Kenya",
  "Access Bank Kenya",
  "African Banking Corporation (ABC Bank)",
  "Bank of Africa Kenya",
  "Bank of Baroda (Kenya)",
  "Bank of India",
  "Citibank Kenya",
  "Consolidated Bank of Kenya",
  "Co-operative Bank of Kenya",
  "Credit Bank",
  "Development Bank of Kenya",
  "Diamond Trust Bank Kenya (DTB)",
  "DIB Bank Kenya",
  "Ecobank Kenya",
  "Equity Bank Kenya",
  "Family Bank",
  "First Community Bank",
  "Guaranty Trust Bank Kenya",
  "Guardian Bank",
  "Gulf African Bank",
  "Habib Bank AG Zurich",
  "HFC (HF Group)",
  "I&M Bank",
  "KCB Bank Kenya",
  "Kingdom Bank",
  "Mayfair CIB Bank",
  "Middle East Bank Kenya",
  "M Oriental Bank",
  "National Bank of Kenya",
  "NCBA Bank Kenya",
  "Paramount Bank",
  "Premier Bank Kenya",
  "Prime Bank",
  "SBM Bank Kenya",
  "Sidian Bank",
  "Stanbic Bank Kenya",
  "Standard Chartered Bank Kenya",
  "UBA Kenya Bank",
  "Victoria Commercial Bank",
] as const;

export const OTHER_BANK = "Other Kenyan bank";
