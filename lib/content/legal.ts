import { siteConfig } from "@/config/site.config";

/**
 * Legal documents as data — the single source for the /legal page and the
 * downloadable PDFs (/legal/privacy-notice.pdf, /legal/terms-of-service.pdf),
 * so the two can never drift apart.
 *
 * Drafted by Claude at the owner's request (2026-10-25) from public sources
 * (Kenya Data Protection Act 2019, ODPC guidance notes, Tax Procedures Act
 * s. 23, Kenya Information and Communications Act, Consumer Protection Act
 * 2012) and the business rules agreed with the owner. Not legal advice —
 * have a Kenyan advocate review both. Update whenever a form, vendor, data
 * use or commercial rule changes, and bump `updated`.
 *
 * Inline links use [label](href). Text is plain Unicode within WinAnsi
 * (curly quotes, en/em dashes) so the PDF fonts can render it.
 */

export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "table"; head: string[]; rows: string[][] };

export type LegalSection = { id: string; title: string; blocks: LegalBlock[] };

export type LegalDocument = {
  slug: "privacy-notice" | "terms-of-service";
  anchor: string;
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};

const { email } = siteConfig.contact;
const company = siteConfig.legalName;
const mail = `[${email}](mailto:${email})`;

export const privacyNotice: LegalDocument = {
  slug: "privacy-notice",
  anchor: "privacy",
  title: "Privacy notice",
  updated: "30 October 2026",
  intro: `This notice explains what personal data ${company} (“NillTech”, “we”) collects through this website and our client and team portal, why we collect it, who we share it with, how long we keep it, and the rights you have under the Kenya Data Protection Act, 2019.`,
  sections: [
    {
      id: "who-we-are",
      title: "1. Who we are",
      blocks: [
        {
          type: "p",
          text: `${company} is a company registered in Kenya and is the data controller for the personal data described here. You can reach us at ${mail}, through the chat on this website, or by post at P.O. Box 2007-00202, Nairobi, Kenya.`,
        },
      ],
    },
    {
      id: "what-we-collect",
      title: "2. What we collect and why",
      blocks: [
        {
          type: "p",
          text: "We only collect what you give us or what is needed to run the service you use.",
        },
        {
          type: "table",
          head: ["When you…", "We collect", "Why (lawful basis)"],
          rows: [
            [
              "Send an enquiry (contact form)",
              "Name, email, phone (optional), company (optional), the service you’re interested in, your timeline, your message",
              "To reply and discuss your project (steps taken at your request before a contract)",
            ],
            [
              "Book a call online",
              "Name, email, phone (required for a phone call, otherwise optional), company (optional), the kind of call, what it’s about, how you’d like to meet, your chosen time and any notes",
              "To arrange and hold the call and follow up about your enquiry (steps taken at your request before a contract)",
            ],
            [
              "Use the project or AI cost estimator",
              "Name, email, company (optional), your project or usage details, budget band, region, and the estimate shown to you",
              "To give you an indicative estimate and follow up (steps taken at your request before a contract)",
            ],
            [
              "Apply to join our delivery teams",
              "Name, email, phone (optional), country, role, skills, years of experience, portfolio and profile links, availability, your message, and when you agreed to this notice. Our recruiters add screening and test-task notes",
              "To assess your application (your consent, and steps taken at your request before an engagement)",
            ],
            [
              "Are hired full-time in Kenya",
              "Your KRA PIN (stored encrypted)",
              "To meet our tax obligations as an employer (legal obligation)",
            ],
            [
              "Become a client",
              "Contact and billing details, invoices, payments and payment references (e.g. M-Pesa or bank reference)",
              "To deliver and bill for our services (performance of a contract), and to keep tax records (legal obligation)",
            ],
            [
              "Sign in to the portal",
              "Email, name, role, sign-in activity, and a record of key actions (such as role changes and financial actions)",
              "To give you secure access and keep an audit trail (performance of a contract and our legitimate interest in security)",
            ],
            [
              "Chat with the assistant on this website",
              "Your questions and the assistant’s answers. These are sent to our AI provider to write each answer; we don’t store a conversation that stays with the assistant",
              "To answer your questions (steps taken at your request, and our legitimate interest in helping visitors)",
            ],
            [
              "Ask in the chat for a person, or leave a message there",
              "Your name, email (required to leave a message, otherwise optional), the page you were on, the recent questions and answers from the assistant, and the messages you exchange with our team",
              "To answer you and follow up about your enquiry (steps taken at your request before a contract)",
            ],
            [
              "Submit any form",
              "Technical information about your browser and connection, checked by Cloudflare Turnstile, and a one-way scrambled (hashed) version of your IP address that can’t be turned back into it, to limit repeated submissions",
              "To block spam and automated abuse (our legitimate interest in protecting the site)",
            ],
            [
              "Send an enquiry or use an estimator",
              "How you found us: campaign tags in the link you followed, the website that referred you, and the first page you visited",
              "To understand which of our marketing works (our legitimate interest in improving our marketing)",
            ],
            [
              "Browse the website",
              "Anonymous page views, the referring website, device type and page speed, measured by Cloudflare Web Analytics without cookies and without identifying you. We also record, anonymously, which of our buttons and forms are used (for example “Book a call” clicked on the services page) and how the visit arrived, without cookies, names or IP addresses",
              "To see how the site is used and keep it fast (our legitimate interest in running the site)",
            ],
          ],
        },
        {
          type: "p",
          text: "Giving us your details is voluntary, but we can’t answer an enquiry, prepare an estimate or consider an application without the details the form asks for. We don’t ask for sensitive personal data (such as health or biometric data) through this website.",
        },
      ],
    },
    {
      id: "automated",
      title: "3. How we prioritise enquiries",
      blocks: [
        {
          type: "p",
          text: "Enquiries are given an automatic priority score (for example from your timeline and the service you choose) so our team can respond to urgent requests first. The score never decides on its own whether we work with you. A person reviews every enquiry and application.",
        },
      ],
    },
    {
      id: "sharing",
      title: "4. Who we share it with",
      blocks: [
        {
          type: "p",
          text: "We don’t sell your personal data. Only NillTech staff who need it for their role can see it, and access in our portal is restricted by role. We use these service providers to run the website and portal:",
        },
        {
          type: "table",
          head: ["Provider", "What they do", "Where"],
          rows: [
            [
              "Supabase",
              "Stores our database and handles portal sign-in",
              "European Union (Frankfurt, Germany)",
            ],
            [
              "Vercel",
              "Hosts the website; our server code runs in Frankfurt",
              "European Union, with a global delivery network",
            ],
            [
              "Anthropic",
              "AI provider that writes the chat assistant’s answers from our website content. Under its commercial terms it doesn’t use this data to train its models",
              "United States",
            ],
            [
              "Cloudflare",
              "Turnstile spam and bot protection on our forms, and cookieless website analytics",
              "Global network",
            ],
            [
              "Google (YouTube)",
              "Only if you choose to play an embedded video",
              "Global, under Google’s own privacy policy",
            ],
          ],
        },
        {
          type: "p",
          text: "We may also disclose personal data where the law requires it, for example to the Kenya Revenue Authority or in response to a lawful order.",
        },
      ],
    },
    {
      id: "transfers",
      title: "5. Transfers outside Kenya",
      blocks: [
        {
          type: "p",
          text: "Because our providers operate outside Kenya, your data is processed abroad, mainly in Germany, which has data protection law at least as strong as Kenya’s, and, for the chat assistant’s answers, in the United States. We rely on our providers’ contractual data protection commitments as appropriate safeguards, as section 48 of the Act requires, and we only transfer what is needed for the purposes above.",
        },
      ],
    },
    {
      id: "retention",
      title: "6. How long we keep it",
      blocks: [
        {
          type: "table",
          head: ["Data", "How long"],
          rows: [
            [
              "Enquiries and estimates that don’t become projects",
              "Up to 24 months after our last contact with you",
            ],
            [
              "Unsuccessful applications",
              "Up to 12 months after our decision, so we can consider you for future roles",
            ],
            [
              "Approved talent and employees (including KRA PIN)",
              "For the engagement, then 5 years for tax and legal records",
            ],
            [
              "Invoices, receipts and payment records",
              "5 years from the end of the relevant tax period (Tax Procedures Act, s. 23), longer if a proceeding is open",
            ],
            [
              "Chats with the assistant alone",
              "Not stored by us; kept in your browser until you close the tab",
            ],
            [
              "Live chats with our team",
              "12 months after the last message (a message left in the chat is kept like an enquiry)",
            ],
            ["Hashed IP records used to limit repeated form submissions", "24 hours"],
            ["Anonymous button and form usage records", "13 months"],
            [
              "Portal accounts",
              "While your account is active; audit records up to 5 years",
            ],
          ],
        },
        { type: "p", text: "When data is no longer needed we delete or anonymise it." },
      ],
    },
    {
      id: "security",
      title: "7. How we protect it",
      blocks: [
        {
          type: "p",
          text: "Data is sent over encrypted connections. Access is limited by role and enforced in our database, sensitive identifiers such as KRA PINs are encrypted at rest, and changes to roles and financial records are logged. If a breach puts your data at real risk, we will notify the Office of the Data Protection Commissioner within 72 hours and tell you where the law requires it.",
        },
      ],
    },
    {
      id: "cookies",
      title: "8. Cookies",
      blocks: [
        {
          type: "p",
          text: "We don’t use advertising or analytics cookies; our website analytics are cookieless. The portal sets the cookies needed to keep you signed in, and only when you sign in. Embedded videos load from YouTube’s privacy-enhanced domain only when you press play; YouTube may then set its own cookies.",
        },
      ],
    },
    {
      id: "rights",
      title: "9. Your rights",
      blocks: [
        { type: "p", text: "Under the Data Protection Act, 2019 you have the right to:" },
        {
          type: "list",
          items: [
            "be informed about how your personal data is used;",
            "access the personal data we hold about you;",
            "object to our processing of some or all of your data;",
            "have false or misleading data corrected, and have data deleted where it applies;",
            "receive your data in a portable format, where it applies;",
            "withdraw your consent at any time, where we rely on consent; and",
            "not be subject to a decision based only on automated processing that significantly affects you.",
          ],
        },
        {
          type: "p",
          text: `To use any of these rights, email ${mail}. We may need to confirm your identity first. We’ll respond within the timelines set by the Act and its Regulations.`,
        },
        {
          type: "p",
          text: "If you’re unhappy with how we’ve handled your data, please tell us first so we can put it right. You can also complain to the [Office of the Data Protection Commissioner](https://www.odpc.go.ke/file-a-complaint).",
        },
      ],
    },
    {
      id: "children",
      title: "10. Children",
      blocks: [
        {
          type: "p",
          text: "Our services aren’t directed at children under 18, and we don’t knowingly collect their personal data.",
        },
      ],
    },
    {
      id: "changes",
      title: "11. Changes to this notice",
      blocks: [
        {
          type: "p",
          text: `We’ll update this notice when how we use personal data changes, and change the date above. Questions? Email ${mail} or see our [contact page](/contact).`,
        },
      ],
    },
  ],
};

export const termsOfService: LegalDocument = {
  slug: "terms-of-service",
  anchor: "terms",
  title: "Terms of service",
  updated: "25 October 2026",
  intro: `These terms apply when you use this website or our portal, and to the services ${company} (“NillTech”, “we”) provides to you. If you sign a proposal or agreement with us, that document sets the specifics of your project and takes priority over these terms where they differ.`,
  sections: [
    {
      id: "terms-website",
      title: "1. Using this website",
      blocks: [
        {
          type: "p",
          text: "The information on this site is general and may change. You agree not to misuse the site, for example by trying to break its security, overload it, or submit false or automated enquiries. Links to other websites are for convenience; we aren’t responsible for their content.",
        },
      ],
    },
    {
      id: "terms-estimates",
      title: "2. Prices, estimates and quotes",
      blocks: [
        {
          type: "p",
          text: "Prices on our pricing page are starting points, and results from our estimators are indicative only. Neither is an offer. Your price is fixed in a written quote or proposal after a discovery conversation, and is valid for the period stated on it.",
        },
        {
          type: "p",
          text: "We invoice in Kenyan shillings (KES) or US dollars (USD), as agreed. We aren’t currently VAT-registered, so our invoices don’t include VAT; if that changes, we’ll tell you before it affects any invoice.",
        },
      ],
    },
    {
      id: "terms-engagement",
      title: "3. How projects work",
      blocks: [
        {
          type: "p",
          text: "A project starts when you accept our proposal and any first payment it requires is received. The proposal sets out the scope, deliverables, timeline and payment schedule. Timelines depend on you sharing content, access and feedback on time; delays on either side move the timeline accordingly.",
        },
        {
          type: "p",
          text: "Changes to the agreed scope are welcome. We’ll confirm any effect on price or timeline in writing before doing the extra work.",
        },
      ],
    },
    {
      id: "terms-payment",
      title: "4. Payment",
      blocks: [
        {
          type: "p",
          text: "Invoices are due by the date shown on them. You can pay by M-Pesa or bank transfer using the details on the invoice, quoting the invoice number. We issue a receipt for every payment. If an invoice is overdue, we may pause work on that project until it’s paid, after letting you know.",
        },
      ],
    },
    {
      id: "terms-support",
      title: "5. Bug fixes after launch",
      blocks: [
        {
          type: "p",
          text: "Every project includes free fixes for bugs in the work we delivered (meaning it doesn’t work as described in the agreed scope) for the bug-fix period stated in your proposal. New features, design changes and work caused by changes made by others are quoted separately.",
        },
      ],
    },
    {
      id: "terms-ownership",
      title: "6. Who owns the work",
      blocks: [
        {
          type: "p",
          text: "You own the outcome. Once you’ve paid in full for a project, we assign to you ownership of the custom work we created for it, including the code, designs and content made specifically for you.",
        },
        {
          type: "p",
          text: "We keep ownership of our own pre-existing tools, templates and know-how, and you get a permanent licence to use any of them included in your deliverables. Open-source and third-party components stay under their own licences.",
        },
      ],
    },
    {
      id: "terms-responsibilities",
      title: "7. Your responsibilities",
      blocks: [
        {
          type: "p",
          text: "You confirm that the content, logos and data you give us are yours to use, and that your use of what we build complies with the law. Please give us accurate information and the access we need to do the work.",
        },
      ],
    },
    {
      id: "terms-third-party",
      title: "8. Third-party services",
      blocks: [
        {
          type: "p",
          text: "Projects often rely on services we don’t control, such as hosting, domains, payment providers, WhatsApp and AI models. Their running costs are billed at cost or paid by you directly, and they’re provided under their own terms. We aren’t responsible for their outages or changes, but we’ll help you deal with them.",
        },
      ],
    },
    {
      id: "terms-confidentiality",
      title: "9. Confidentiality",
      blocks: [
        {
          type: "p",
          text: "We keep your business information confidential and use it only for your project. We may mention that we worked with you, or show your project in our portfolio, only with your permission.",
        },
      ],
    },
    {
      id: "terms-accounts",
      title: "10. Portal accounts",
      blocks: [
        {
          type: "p",
          text: "Portal accounts are created by us for clients, team members and approved talent. Keep your password private and tell us straight away if you think your account has been misused. We may suspend accounts that are misused.",
        },
      ],
    },
    {
      id: "terms-applicants",
      title: "11. Applying to work with us",
      blocks: [
        {
          type: "p",
          text: "Sending an application doesn’t create an employment or contractor relationship. Anyone we take on is engaged under a separate written agreement.",
        },
      ],
    },
    {
      id: "terms-liability",
      title: "12. Liability",
      blocks: [
        {
          type: "p",
          text: "We do our work with reasonable skill and care. To the extent the law allows, we aren’t liable for indirect or consequential losses (such as lost profits or data), and our total liability for any project is limited to the amount you paid us for it in the 12 months before the claim.",
        },
        {
          type: "p",
          text: "Nothing in these terms limits liability that can’t be limited by law, or takes away rights you have under Kenyan law, including the Consumer Protection Act.",
        },
      ],
    },
    {
      id: "terms-ending",
      title: "13. Ending a project",
      blocks: [
        {
          type: "p",
          text: "Either of us can end a project in writing if the other seriously breaks these terms or the proposal and doesn’t fix it within 14 days of being asked. If a project ends early, you pay for the work done up to that point, and we hand over that work once it’s paid for.",
        },
      ],
    },
    {
      id: "terms-privacy",
      title: "14. Privacy",
      blocks: [
        {
          type: "p",
          text: "How we handle personal data is explained in our [privacy notice](/legal#privacy).",
        },
      ],
    },
    {
      id: "terms-law",
      title: "15. Law and disputes",
      blocks: [
        {
          type: "p",
          text: "These terms are governed by the laws of Kenya. If a dispute comes up, we’ll first try to resolve it by talking it through in good faith. If that doesn’t work, the courts of Kenya will decide it.",
        },
      ],
    },
    {
      id: "terms-changes",
      title: "16. Changes and contact",
      blocks: [
        {
          type: "p",
          text: `We may update these terms; changes don’t affect a proposal you’ve already accepted. Questions? Email ${mail}.`,
        },
      ],
    },
  ],
};

export const legalDocuments = [privacyNotice, termsOfService] as const;

const LINK = /\[([^\]]+)\]\(([^)]+)\)/g;

/** Splits text into plain and link segments for rendering. */
export function parseInline(
  text: string,
): ({ text: string } | { text: string; href: string })[] {
  const parts: ({ text: string } | { text: string; href: string })[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK)) {
    if (match.index > last) parts.push({ text: text.slice(last, match.index) });
    parts.push({ text: match[1], href: match[2] });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}
