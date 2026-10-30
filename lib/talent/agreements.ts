import { siteConfig } from "@/config/site.config";
import type { LegalBlock } from "@/lib/content/legal";
import { formatAmount, type Currency } from "@/lib/finance/money";

/**
 * Freelancer documents generated in the portal (owner, 2026-10-30): an NDA,
 * a freelance services agreement and an onboarding letter, in the style of
 * NillTech's existing client NDA (NDA-2026-0001).
 *
 * Drafted by Claude as plain-language templates for a Kenyan technology
 * company engaging independent contractors. NOT LEGAL ADVICE: have a Kenyan
 * advocate review the text before relying on it, then set
 * TALENT_AGREEMENTS_REVIEWED in config/talent-agreements.ts. Business terms
 * (rates, notice, durations) are never assumed: recruitment enters them.
 *
 * Plain text within WinAnsi (no em or en dashes, per the site rule).
 */

export type AgreementKind = "nda" | "contract" | "onboarding_letter";

export const RATE_BASES = ["hour", "day", "month", "project", "milestone"] as const;
export type RateBasis = (typeof RATE_BASES)[number];

export const RATE_BASIS_LABELS: Record<RateBasis, string> = {
  hour: "per hour",
  day: "per day",
  month: "per month",
  project: "for the whole project",
  milestone: "per milestone",
};

export type Party = { heading: string; lines: string[] };

export type AgreementDocument = {
  kind: AgreementKind;
  /** Big title on page one, e.g. "NON-DISCLOSURE AGREEMENT". */
  title: string;
  /** Used for the running header, file name and portal list. */
  shortTitle: string;
  reference: string;
  date: string;
  parties: Party[] | null;
  intro: string[];
  sections: { title: string; blocks: LegalBlock[] }[];
  /** Two signature blocks for agreements; a single sign-off for letters. */
  signatures:
    | {
        kind: "agreement";
        left: { heading: string; name: string; title: string };
        right: { heading: string; name: string };
      }
    | { kind: "letter"; name: string; title: string };
  acceptanceNote: string | null;
  footer: string;
};

export type FreelancerParty = {
  name: string;
  email: string;
  phone: string | null;
  country: string;
};

type Common = {
  reference: string;
  /** Display date, e.g. "30 October 2026". */
  date: string;
  freelancer: FreelancerParty;
  signatory: { name: string; title: string };
};

export type NdaInput = Common & { durationYears: number; purpose: string };

export type ContractInput = Common & {
  role: string;
  startDate: string;
  endDate: string | null;
  scope: string;
  rateMinor: number;
  currency: Currency;
  rateBasis: RateBasis;
  paymentTermsDays: number;
  noticeDays: number;
  nonSolicitMonths: number;
  ndaReference: string | null;
};

export type LetterInput = Common & {
  role: string;
  startDate: string;
  reportingTo: { name: string; email: string };
  workingPattern: string | null;
  tools: string | null;
  firstWeek: string | null;
  ndaReference: string | null;
  contractReference: string | null;
};

const company = siteConfig.legalName;
const host = siteConfig.url.replace(/^https?:\/\//, "");
const companyLines = (signatory: Common["signatory"]) => [
  company,
  `Represented by: ${signatory.name} (${signatory.title})`,
  `${host} | ${siteConfig.contact.email}`,
  "Nairobi, Kenya",
];
const freelancerLines = (f: FreelancerParty) =>
  [f.name, f.email, f.phone ? `Tel: ${f.phone}` : null, f.country].filter(
    (line): line is string => Boolean(line),
  );

const p = (text: string): LegalBlock => ({ type: "p", text });
const list = (...items: string[]): LegalBlock => ({ type: "list", items });

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

const ACCEPTANCE_NOTE =
  "This document can be accepted electronically in the NillTech portal. The Contractor's typed full name and the time of acceptance, recorded by the portal, count as their signature. It can also be printed and signed by hand.";

const footer = (reference: string, shortTitle: string) =>
  `Ref: ${reference} | ${company} | ${host} | ${shortTitle} | Governing law: Republic of Kenya`;

// ---------------------------------------------------------------------------

export function buildNda(input: NdaInput): AgreementDocument {
  const years = plural(input.durationYears, "year", "years");
  return {
    kind: "nda",
    title: "NON-DISCLOSURE AGREEMENT",
    shortTitle: "Non-disclosure agreement",
    reference: input.reference,
    date: input.date,
    parties: [
      { heading: "DISCLOSING PARTY", lines: companyLines(input.signatory) },
      {
        heading: "RECEIVING PARTY (THE CONTRACTOR)",
        lines: freelancerLines(input.freelancer),
      },
    ],
    intro: [
      `This Non-Disclosure Agreement ("Agreement") is entered into on ${input.date} between ${company} ("NillTech") and the Contractor named above, in connection with ${input.purpose} (the "Purpose").`,
    ],
    sections: [
      {
        title: "1. DEFINITION OF CONFIDENTIAL INFORMATION",
        blocks: [
          p(
            `"Confidential Information" means any non-public information that NillTech, or a NillTech client, makes available to the Contractor in connection with the Purpose, in any form, including:`,
          ),
          list(
            "Source code, designs, architecture, documentation and all other technical assets.",
            "Login credentials, API keys and access to hosting, repositories, cloud accounts, CMS and third-party services.",
            "The identity, plans, products, data and affairs of NillTech's clients and prospective clients.",
            "Personal data of NillTech's clients, their customers, staff and users.",
            "NillTech's pricing, proposals, contracts, financial information, processes and business plans.",
            "Communications, project boards, recordings and supporting documents.",
          ),
        ],
      },
      {
        title: "2. OBLIGATIONS OF THE CONTRACTOR",
        blocks: [
          p("The Contractor agrees to:"),
          list(
            "Hold all Confidential Information in strict confidence.",
            "Use it only for the Purpose and only as instructed by NillTech.",
            "Not disclose it to any third party, including other clients of the Contractor, without NillTech's prior written consent.",
            "Not copy it to personal devices, personal cloud storage or AI tools that keep or train on the input, except as NillTech approves in writing.",
            "Take all reasonable precautions to prevent unauthorised access or disclosure.",
            "Tell NillTech at once on discovering any unauthorised access, loss or disclosure.",
          ),
        ],
      },
      {
        title: "3. EXCLUSIONS",
        blocks: [
          p("Clause 2 does not apply to information that the Contractor can show:"),
          list(
            "Is or becomes public through no breach of this Agreement.",
            "Was lawfully known to the Contractor before NillTech disclosed it.",
            "Was developed independently without using any Confidential Information.",
            "Must be disclosed by law or court order, provided the Contractor gives NillTech prompt written notice (where the law allows) and discloses only what is required.",
          ),
        ],
      },
      {
        title: "4. PERSONAL DATA",
        blocks: [
          p(
            "Where Confidential Information includes personal data, the Contractor will process it only on NillTech's documented instructions, keep it secure, not transfer it outside Kenya without NillTech's approval, and otherwise comply with the Data Protection Act, 2019 of Kenya.",
          ),
        ],
      },
      {
        title: "5. CREDENTIALS AND ACCESS SECURITY",
        blocks: [
          p(
            "Credentials and access details are Confidential Information. The Contractor agrees to:",
          ),
          list(
            "Store credentials in a reputable password manager and use two-factor authentication where available.",
            "Never share credentials with anyone, including other team members, outside the channel NillTech specifies.",
            "Tell NillTech immediately if credentials may have been exposed.",
            "Hand back or have revoked all access when the engagement or a project ends.",
          ),
        ],
      },
      {
        title: "6. INTELLECTUAL PROPERTY",
        blocks: [
          p(
            "This Agreement does not grant the Contractor any rights in NillTech's or its clients' intellectual property. Ownership of work the Contractor produces is governed by the Freelance Services Agreement between the Parties.",
          ),
        ],
      },
      {
        title: "7. TERM",
        blocks: [
          p(
            `This Agreement takes effect on the date above and continues for ${years} after the Contractor's engagement with NillTech ends. Obligations relating to trade secrets and personal data continue for as long as the information remains a trade secret or personal data.`,
          ),
        ],
      },
      {
        title: "8. RETURN OR DESTRUCTION OF INFORMATION",
        blocks: [
          p(
            "On NillTech's written request, or when the engagement ends, the Contractor will promptly:",
          ),
          list(
            "Return all materials containing Confidential Information.",
            "Permanently delete all digital copies, including from devices, email and cloud storage.",
            "Confirm in writing that this has been done.",
          ),
        ],
      },
      {
        title: "9. REMEDIES",
        blocks: [
          p(
            "The Contractor acknowledges that a breach may cause NillTech and its clients irreparable harm. NillTech may seek an injunction or specific performance in addition to any other remedy, and the Contractor will be responsible for losses caused by their breach.",
          ),
        ],
      },
      {
        title: "10. GOVERNING LAW AND ENTIRE AGREEMENT",
        blocks: [
          p(
            "This Agreement is governed by the laws of the Republic of Kenya, and the courts of Kenya have jurisdiction over any dispute. It is the entire agreement between the Parties on confidentiality and replaces earlier discussions on the subject. Changes must be in writing and accepted by both Parties.",
          ),
        ],
      },
    ],
    signatures: {
      kind: "agreement",
      left: {
        heading: `FOR ${company.toUpperCase()}`,
        name: input.signatory.name,
        title: input.signatory.title,
      },
      right: { heading: "THE CONTRACTOR", name: input.freelancer.name },
    },
    acceptanceNote: ACCEPTANCE_NOTE,
    footer: footer(input.reference, "Non-disclosure agreement"),
  };
}

// ---------------------------------------------------------------------------

export function buildContract(input: ContractInput): AgreementDocument {
  const rate = `${input.currency} ${formatAmount(input.rateMinor)} ${RATE_BASIS_LABELS[input.rateBasis]}`;
  const notice = input.noticeDays === 1 ? "1 day's" : `${input.noticeDays} days'`;
  // Clause numbers after 8 shift when there's no non-solicitation clause.
  const n = (k: number) => k + (input.nonSolicitMonths > 0 ? 0 : -1);
  const paymentDays = plural(input.paymentTermsDays, "day", "days");
  const term = input.endDate
    ? `starts on ${input.startDate} and ends on ${input.endDate}, unless ended earlier under clause ${n(10)} or extended in writing`
    : `starts on ${input.startDate} and continues until ended under clause ${n(10)}`;

  const sections: AgreementDocument["sections"] = [
    {
      title: "1. ENGAGEMENT",
      blocks: [
        p(
          `NillTech engages the Contractor as an independent contractor in the role of ${input.role}, to provide the services described in clause 2 to NillTech and, through NillTech, to its clients. The engagement ${term}.`,
        ),
      ],
    },
    {
      title: "2. SERVICES",
      blocks: [
        p(input.scope),
        p(
          "NillTech will describe specific assignments in the NillTech portal or in writing, including deliverables and deadlines. The Contractor decides how to carry out the work, within NillTech's quality, security and client requirements.",
        ),
      ],
    },
    {
      title: "3. STANDARD OF WORK",
      blocks: [
        list(
          "Work must be the Contractor's own, delivered with reasonable skill and care, and meet the agreed requirements and deadlines.",
          "NillTech reviews deliverables against its QA checklist. The Contractor will correct defects in their own work that NillTech reports within a reasonable time, at no extra charge.",
          "The Contractor will tell NillTech promptly about anything likely to affect a deadline or the quality of the work.",
          "The Contractor will not use code, assets or AI-generated material whose licence would stop NillTech or its client from owning or using the deliverable as intended. Open-source components must be disclosed and their licences respected.",
        ),
      ],
    },
    {
      title: "4. FEES AND PAYMENT",
      blocks: [
        p(
          `NillTech will pay the Contractor ${rate}, unless a different amount is agreed in writing for a specific assignment.`,
        ),
        list(
          `NillTech pays within ${paymentDays} of approving the work or the Contractor's invoice or timesheet for it.`,
          "Payment is made by M-Pesa or bank transfer to a Kenyan bank, to the details the Contractor keeps up to date in the NillTech portal. NillTech issues a payment advice for each payment.",
          "Fees include all of the Contractor's own costs (equipment, internet, software and travel) unless NillTech agrees in writing to cover a cost in advance.",
          "Where Kenyan law requires NillTech to withhold tax from a payment, NillTech will do so and give the Contractor the withholding certificate.",
        ),
      ],
    },
    {
      title: "5. INDEPENDENT CONTRACTOR",
      blocks: [
        p(
          "The Contractor is not an employee of NillTech. Nothing in this Agreement creates employment, partnership or agency. In particular:",
        ),
        list(
          "The Contractor is responsible for their own income tax, statutory contributions and any registrations their business requires.",
          "The Contractor is not entitled to salary, leave, benefits or other employment rights from NillTech.",
          "The Contractor provides their own equipment and internet connection and keeps them secure.",
          "The Contractor may not sign agreements or make commitments on NillTech's behalf.",
        ),
      ],
    },
    {
      title: "6. INTELLECTUAL PROPERTY",
      blocks: [
        list(
          "All work the Contractor creates for NillTech or its clients under this Agreement (code, designs, documents and other deliverables) belongs to NillTech once it has been paid for. The Contractor assigns all intellectual property rights in it to NillTech, and will sign any document reasonably needed to confirm this.",
          "To the extent the law allows, the Contractor waives any moral rights in those deliverables.",
          "Tools, libraries or know-how the Contractor owned before the engagement remain theirs. Where any of it is built into a deliverable, the Contractor grants NillTech and its client a permanent, royalty-free licence to use, modify and distribute it as part of that deliverable.",
          "The Contractor may show deliverables in a portfolio only with NillTech's written permission.",
        ),
      ],
    },
    {
      title: "7. CONFIDENTIALITY AND DATA PROTECTION",
      blocks: [
        p(
          input.ndaReference
            ? `The Non-Disclosure Agreement between the Parties (Ref: ${input.ndaReference}) applies to all Confidential Information and forms part of this Agreement.`
            : "The Contractor will keep all non-public information about NillTech and its clients confidential, during the engagement and afterwards, and use it only to provide the services.",
        ),
        p(
          "The Contractor will process personal data only on NillTech's documented instructions and in line with the Data Protection Act, 2019 of Kenya, keep systems and credentials secure, and report any suspected data breach to NillTech immediately.",
        ),
      ],
    },
    {
      title: "8. CONFLICTS OF INTEREST",
      blocks: [
        p(
          "The Contractor may work for others during this Agreement, provided that work does not conflict with their obligations here or use NillTech's Confidential Information. The Contractor will tell NillTech before working directly for any NillTech client.",
        ),
      ],
    },
  ];

  if (input.nonSolicitMonths > 0) {
    sections.push({
      title: "9. NON-SOLICITATION",
      blocks: [
        p(
          `During the engagement and for ${plural(input.nonSolicitMonths, "month", "months")} after it ends, the Contractor will not, without NillTech's written consent, directly offer services to any NillTech client that the Contractor worked with or learned of through NillTech, or encourage any NillTech team member to leave NillTech.`,
        ),
      ],
    });
  }

  sections.push(
    {
      title: `${n(10)}. ENDING THE AGREEMENT`,
      blocks: [
        list(
          `Either Party may end this Agreement by giving ${notice} written notice.`,
          "Either Party may end it immediately by written notice if the other materially breaches it and, where the breach can be fixed, does not fix it within seven days of being asked to.",
          "On ending, NillTech pays for work properly completed and approved up to the end date, and the Contractor hands over all work in progress, returns NillTech's materials and gives up all access.",
          `Clauses on intellectual property, confidentiality, data protection${input.nonSolicitMonths > 0 ? ", non-solicitation" : ""} and liability continue after this Agreement ends.`,
        ),
      ],
    },
    {
      title: `${n(11)}. LIABILITY`,
      blocks: [
        p(
          "The Contractor is responsible for losses NillTech suffers because of the Contractor's breach of the confidentiality, data protection or intellectual property clauses, or the Contractor's fraud, wilful misconduct or gross negligence. Nothing in this Agreement limits liability that cannot be limited by law.",
        ),
      ],
    },
    {
      title: `${n(12)}. GENERAL`,
      blocks: [
        list(
          "This Agreement is governed by the laws of the Republic of Kenya. The Parties will first try to settle any dispute by good-faith discussion; failing that, the courts of Kenya have jurisdiction.",
          "This Agreement, together with any Non-Disclosure Agreement between the Parties and assignment details given in the NillTech portal, is the entire agreement on its subject. Changes must be in writing and accepted by both Parties.",
          "The Contractor may not assign or subcontract this Agreement, or have someone else do the work, without NillTech's written consent.",
          "Notices may be given by email to the addresses above, or through the NillTech portal.",
        ),
      ],
    },
  );

  return {
    kind: "contract",
    title: "FREELANCE SERVICES AGREEMENT",
    shortTitle: "Freelance services agreement",
    reference: input.reference,
    date: input.date,
    parties: [
      { heading: "NILLTECH", lines: companyLines(input.signatory) },
      { heading: "THE CONTRACTOR", lines: freelancerLines(input.freelancer) },
    ],
    intro: [
      `This Freelance Services Agreement ("Agreement") is entered into on ${input.date} between ${company} ("NillTech") and the Contractor named above (together, the "Parties").`,
    ],
    sections,
    signatures: {
      kind: "agreement",
      left: {
        heading: `FOR ${company.toUpperCase()}`,
        name: input.signatory.name,
        title: input.signatory.title,
      },
      right: { heading: "THE CONTRACTOR", name: input.freelancer.name },
    },
    acceptanceNote: ACCEPTANCE_NOTE,
    footer: footer(input.reference, "Freelance services agreement"),
  };
}

// ---------------------------------------------------------------------------

export function buildOnboardingLetter(input: LetterInput): AgreementDocument {
  const firstName = input.freelancer.name.split(/\s+/)[0] ?? input.freelancer.name;
  const docs = [
    input.ndaReference ? `Non-Disclosure Agreement (Ref: ${input.ndaReference})` : null,
    input.contractReference
      ? `Freelance Services Agreement (Ref: ${input.contractReference})`
      : null,
  ].filter((d): d is string => Boolean(d));

  const details = list(
    `Role: ${input.role}`,
    "Engagement: freelance (independent contractor)",
    `Start date: ${input.startDate}`,
    `Your NillTech contact: ${input.reportingTo.name} (${input.reportingTo.email})`,
    ...(input.workingPattern ? [`Working pattern: ${input.workingPattern}`] : []),
  );

  const sections: AgreementDocument["sections"] = [
    { title: "YOUR ENGAGEMENT", blocks: [details] },
    {
      title: "BEFORE YOU START",
      blocks: [
        p("Please complete these steps in the NillTech portal before your start date:"),
        list(
          ...(docs.length
            ? [`Read and accept your ${docs.join(" and ")} under Documents.`]
            : ["Read and accept your agreements under Documents."]),
          "Add your M-Pesa or Kenyan bank details under Payments, so we can pay you without delay.",
          "Check your profile (phone, skills, links and availability) and keep it up to date.",
          "Turn on two-factor authentication for your email, code hosting and any accounts you will use for NillTech work.",
        ),
      ],
    },
    {
      title: "HOW WE WORK",
      blocks: [
        list(
          "Your assignments, deadlines and QA checklist appear under Projects in the portal.",
          "Every deliverable is reviewed against our QA checklist before it reaches the client. Your delivery reviews appear in the portal too.",
          "Client information, code and credentials are confidential. Keep them in the tools we provide and never on personal storage.",
          "Tell your NillTech contact early if anything could affect a deadline.",
          ...(input.tools ? [`Tools and channels: ${input.tools}`] : []),
        ),
      ],
    },
  ];
  if (input.firstWeek) {
    sections.push({ title: "YOUR FIRST WEEK", blocks: [p(input.firstWeek)] });
  }
  sections.push({
    title: "PAYMENTS",
    blocks: [
      p(
        "You are paid as set out in your Freelance Services Agreement, by M-Pesa or bank transfer to the details in your portal. Each payment comes with a payment advice you can download under Payments. As an independent contractor, you handle your own tax unless your agreement says otherwise.",
      ),
    ],
  });

  return {
    kind: "onboarding_letter",
    title: "WELCOME TO NILLTECH",
    shortTitle: "Onboarding letter",
    reference: input.reference,
    date: input.date,
    parties: null,
    intro: [
      `Dear ${firstName},`,
      `Welcome to ${company}. We are glad to have you join our delivery team as ${input.role}, starting on ${input.startDate}. At NillTech we build the team and our clients own the outcome, and that depends on people who take pride in their craft. This letter sets out what happens next.`,
    ],
    sections,
    signatures: {
      kind: "letter",
      name: input.signatory.name,
      title: input.signatory.title,
    },
    acceptanceNote: null,
    footer: footer(input.reference, "Onboarding letter"),
  };
}
