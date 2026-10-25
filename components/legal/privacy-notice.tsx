import Link from "next/link";

import { siteConfig } from "@/config/site.config";

/**
 * Privacy notice under the Kenya Data Protection Act, 2019 (s. 29 duty to
 * notify, s. 26 rights) and the Data Protection (General) Regulations,
 * 2021. Drafted by Claude at the owner's request (2026-10-25) from public
 * sources — the Act, ODPC guidance notes and the Tax Procedures Act — and
 * describing what this site and portal actually collect. Not legal advice:
 * have it reviewed by a Kenyan advocate. Update it whenever a new form,
 * vendor or data use is added.
 */

export const PRIVACY_NOTICE_UPDATED = "25 October 2026";

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-10 scroll-mt-24">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="text-muted-foreground mt-3 space-y-3 text-sm leading-relaxed">
        {children}
      </div>
    </section>
  );
}

/** A table on wider screens; stacked label/value cards on phones so no column is hidden. */
function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <>
      <ul className="space-y-3 sm:hidden">
        {rows.map((row) => (
          <li key={row[0]} className="border-border rounded-lg border p-3">
            <dl className="space-y-2">
              {row.map((cell, i) => (
                <div key={i}>
                  <dt className="text-foreground text-xs font-medium">{head[i]}</dt>
                  <dd>{cell}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
      <table className="hidden w-full text-left text-sm sm:table">
        <thead className="text-foreground">
          <tr>
            {head.map((h) => (
              <th key={h} className="border-border border-b py-2 pr-4 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]} className="align-top">
              {row.map((cell, i) => (
                <td key={i} className="border-border border-b py-2 pr-4">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export function PrivacyNotice() {
  const { email, phoneDisplay } = siteConfig.contact;
  const mail = (
    <a href={`mailto:${email}`} className="text-primary hover:underline">
      {email}
    </a>
  );

  return (
    <div>
      <p className="text-muted-foreground text-sm leading-relaxed">
        This notice explains what personal data {siteConfig.legalName}{" "}
        (&ldquo;NillTech&rdquo;, &ldquo;we&rdquo;) collects through this website and our
        client and team portal, why we collect it, who we share it with, how long we keep
        it, and the rights you have under the Kenya Data Protection Act, 2019.
      </p>

      <Section id="who-we-are" title="1. Who we are">
        <p>
          {siteConfig.legalName} is a company registered in Kenya and is the data
          controller for the personal data described here. You can reach us at {mail}, on{" "}
          {phoneDisplay}, or by post at P.O. Box 2007-00202, Nairobi, Kenya.
        </p>
      </Section>

      <Section id="what-we-collect" title="2. What we collect and why">
        <p>
          We only collect what you give us or what is needed to run the service you use.
        </p>
        <Table
          head={["When you…", "We collect", "Why (lawful basis)"]}
          rows={[
            [
              "Send an enquiry (contact form)",
              "Name, email, phone (optional), company (optional), the service you're interested in, your timeline, your message",
              "To reply and discuss your project — steps taken at your request before a contract",
            ],
            [
              "Use the project or AI cost estimator",
              "Name, email, company (optional), your project or usage details, budget band, region, and the estimate shown to you",
              "To give you an indicative estimate and follow up — steps taken at your request before a contract",
            ],
            [
              "Apply to join our delivery teams",
              "Name, email, phone (optional), country, role, skills, years of experience, portfolio and profile links, availability, your message, and when you agreed to this notice. Our recruiters add screening and test-task notes",
              "To assess your application — your consent, and steps taken at your request before an engagement",
            ],
            [
              "Are hired full-time in Kenya",
              "Your KRA PIN (stored encrypted)",
              "To meet our tax obligations as an employer — legal obligation",
            ],
            [
              "Become a client",
              "Contact and billing details, invoices, payments and payment references (e.g. M-Pesa or bank reference)",
              "To deliver and bill for our services — performance of a contract; and to keep tax records — legal obligation",
            ],
            [
              "Sign in to the portal",
              "Email, name, role, sign-in activity, and a record of key actions (such as role changes and financial actions)",
              "To give you secure access and keep an audit trail — performance of a contract and our legitimate interest in security",
            ],
            [
              "Submit any form",
              "Technical information about your browser and connection, checked by Cloudflare Turnstile",
              "To block spam and automated abuse — our legitimate interest in protecting the site",
            ],
          ]}
        />
        <p>
          Giving us your details is voluntary, but we can&rsquo;t answer an enquiry,
          prepare an estimate or consider an application without the details the form asks
          for. We don&rsquo;t ask for sensitive personal data (such as health or biometric
          data) through this website.
        </p>
      </Section>

      <Section id="automated" title="3. How we prioritise enquiries">
        <p>
          Enquiries are given an automatic priority score (for example from your timeline
          and the service you choose) so our team can respond to urgent requests first.
          The score never decides on its own whether we work with you — a person reviews
          every enquiry and application.
        </p>
      </Section>

      <Section id="sharing" title="4. Who we share it with">
        <p>
          We don&rsquo;t sell your personal data. Only NillTech staff who need it for
          their role can see it — access in our portal is restricted by role. We use these
          service providers to run the website and portal:
        </p>
        <Table
          head={["Provider", "What they do", "Where"]}
          rows={[
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
              "Cloudflare",
              "Turnstile spam and bot protection on our forms",
              "Global network",
            ],
            [
              "Google (YouTube)",
              "Only if you choose to play an embedded video",
              "Global — under Google's own privacy policy",
            ],
          ]}
        />
        <p>
          We may also disclose personal data where the law requires it, for example to the
          Kenya Revenue Authority or in response to a lawful order.
        </p>
      </Section>

      <Section id="transfers" title="5. Transfers outside Kenya">
        <p>
          Because our providers operate outside Kenya, your data is processed abroad —
          mainly in Germany, which has data protection law at least as strong as
          Kenya&rsquo;s. We rely on our providers&rsquo; contractual data protection
          commitments as appropriate safeguards, as section 48 of the Act requires, and we
          only transfer what is needed for the purposes above.
        </p>
      </Section>

      <Section id="retention" title="6. How long we keep it">
        <Table
          head={["Data", "How long"]}
          rows={[
            [
              "Enquiries and estimates that don't become projects",
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
              "Portal accounts",
              "While your account is active; audit records up to 5 years",
            ],
          ]}
        />
        <p>When data is no longer needed we delete or anonymise it.</p>
      </Section>

      <Section id="security" title="7. How we protect it">
        <p>
          Data is sent over encrypted connections. Access is limited by role and enforced
          in our database, sensitive identifiers such as KRA PINs are encrypted at rest,
          and changes to roles and financial records are logged. If a breach puts your
          data at real risk, we will notify the Office of the Data Protection Commissioner
          within 72 hours and tell you where the law requires it.
        </p>
      </Section>

      <Section id="cookies" title="8. Cookies">
        <p>
          We don&rsquo;t use advertising or analytics cookies. The portal sets the cookies
          needed to keep you signed in, and only when you sign in. Embedded videos load
          from YouTube&rsquo;s privacy-enhanced domain only when you press play; YouTube
          may then set its own cookies.
        </p>
      </Section>

      <Section id="rights" title="9. Your rights">
        <p>Under the Data Protection Act, 2019 you have the right to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>be informed about how your personal data is used;</li>
          <li>access the personal data we hold about you;</li>
          <li>object to our processing of some or all of your data;</li>
          <li>
            have false or misleading data corrected, and have data deleted where it
            applies;
          </li>
          <li>receive your data in a portable format, where it applies;</li>
          <li>withdraw your consent at any time, where we rely on consent; and</li>
          <li>
            not be subject to a decision based only on automated processing that
            significantly affects you.
          </li>
        </ul>
        <p>
          To use any of these rights, email {mail}. We may need to confirm your identity
          first. We&rsquo;ll respond within the timelines set by the Act and its
          Regulations.
        </p>
        <p>
          If you&rsquo;re unhappy with how we&rsquo;ve handled your data, please tell us
          first so we can put it right. You can also complain to the{" "}
          <a
            href="https://www.odpc.go.ke/file-a-complaint"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Office of the Data Protection Commissioner
          </a>
          .
        </p>
      </Section>

      <Section id="children" title="10. Children">
        <p>
          Our services aren&rsquo;t directed at children under 18, and we don&rsquo;t
          knowingly collect their personal data.
        </p>
      </Section>

      <Section id="changes" title="11. Changes to this notice">
        <p>
          We&rsquo;ll update this notice when how we use personal data changes, and change
          the date below. Questions? Email {mail} or see our{" "}
          <Link href="/contact" className="text-primary hover:underline">
            contact page
          </Link>
          .
        </p>
      </Section>
    </div>
  );
}
