import Link from "next/link";

import { siteConfig } from "@/config/site.config";

/**
 * Terms of service. Drafted by Claude at the owner's request (2026-10-25)
 * from public sources and the business rules already set with the owner
 * (KES/USD invoicing, no VAT, M-Pesa/bank payment, free post-launch bug
 * fixes, indicative estimates, owner-approved pricing). Not legal advice:
 * have it reviewed by a Kenyan advocate. Commercial specifics (deposits,
 * milestones, the bug-fix period) are deliberately left to each written
 * proposal rather than invented here.
 */

export const TERMS_UPDATED = "25 October 2026";

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

export function TermsOfService() {
  const { email } = siteConfig.contact;
  const mail = (
    <a href={`mailto:${email}`} className="text-primary hover:underline">
      {email}
    </a>
  );

  return (
    <div>
      <p className="text-muted-foreground text-sm leading-relaxed">
        These terms apply when you use this website or our portal, and to the services{" "}
        {siteConfig.legalName} (&ldquo;NillTech&rdquo;, &ldquo;we&rdquo;) provides to you.
        If you sign a proposal or agreement with us, that document sets the specifics of
        your project and takes priority over these terms where they differ.
      </p>

      <Section id="terms-website" title="1. Using this website">
        <p>
          The information on this site is general and may change. You agree not to misuse
          the site — for example by trying to break its security, overload it, or submit
          false or automated enquiries. Links to other websites are for convenience; we
          aren&rsquo;t responsible for their content.
        </p>
      </Section>

      <Section id="terms-estimates" title="2. Prices, estimates and quotes">
        <p>
          Prices on our pricing page are starting points, and results from our estimators
          are indicative only. Neither is an offer. Your price is fixed in a written quote
          or proposal after a discovery conversation, and is valid for the period stated
          on it.
        </p>
        <p>
          We invoice in Kenyan shillings (KES) or US dollars (USD), as agreed. We
          aren&rsquo;t currently VAT-registered, so our invoices don&rsquo;t include VAT;
          if that changes, we&rsquo;ll tell you before it affects any invoice.
        </p>
      </Section>

      <Section id="terms-engagement" title="3. How projects work">
        <p>
          A project starts when you accept our proposal and any first payment it requires
          is received. The proposal sets out the scope, deliverables, timeline and payment
          schedule. Timelines depend on you sharing content, access and feedback on time;
          delays on either side move the timeline accordingly.
        </p>
        <p>
          Changes to the agreed scope are welcome — we&rsquo;ll confirm any effect on
          price or timeline in writing before doing the extra work.
        </p>
      </Section>

      <Section id="terms-payment" title="4. Payment">
        <p>
          Invoices are due by the date shown on them. You can pay by M-Pesa or bank
          transfer using the details on the invoice, quoting the invoice number. We issue
          a receipt for every payment. If an invoice is overdue, we may pause work on that
          project until it&rsquo;s paid, after letting you know.
        </p>
      </Section>

      <Section id="terms-support" title="5. Bug fixes after launch">
        <p>
          Every project includes free fixes for bugs in the work we delivered — meaning it
          doesn&rsquo;t work as described in the agreed scope — for the bug-fix period
          stated in your proposal. New features, design changes and work caused by changes
          made by others are quoted separately.
        </p>
      </Section>

      <Section id="terms-ownership" title="6. Who owns the work">
        <p>
          You own the outcome. Once you&rsquo;ve paid in full for a project, we assign to
          you ownership of the custom work we created for it, including the code, designs
          and content made specifically for you.
        </p>
        <p>
          We keep ownership of our own pre-existing tools, templates and know-how, and you
          get a permanent licence to use any of them included in your deliverables.
          Open-source and third-party components stay under their own licences.
        </p>
      </Section>

      <Section id="terms-responsibilities" title="7. Your responsibilities">
        <p>
          You confirm that the content, logos and data you give us are yours to use, and
          that your use of what we build complies with the law. Please give us accurate
          information and the access we need to do the work.
        </p>
      </Section>

      <Section id="terms-third-party" title="8. Third-party services">
        <p>
          Projects often rely on services we don&rsquo;t control — such as hosting,
          domains, payment providers, WhatsApp and AI models. Their running costs are
          billed at cost or paid by you directly, and they&rsquo;re provided under their
          own terms. We aren&rsquo;t responsible for their outages or changes, but
          we&rsquo;ll help you deal with them.
        </p>
      </Section>

      <Section id="terms-confidentiality" title="9. Confidentiality">
        <p>
          We keep your business information confidential and use it only for your project.
          We may mention that we worked with you, or show your project in our portfolio,
          only with your permission.
        </p>
      </Section>

      <Section id="terms-accounts" title="10. Portal accounts">
        <p>
          Portal accounts are created by us for clients, team members and approved talent.
          Keep your password private and tell us straight away if you think your account
          has been misused. We may suspend accounts that are misused.
        </p>
      </Section>

      <Section id="terms-applicants" title="11. Applying to work with us">
        <p>
          Sending an application doesn&rsquo;t create an employment or contractor
          relationship. Anyone we take on is engaged under a separate written agreement.
        </p>
      </Section>

      <Section id="terms-liability" title="12. Liability">
        <p>
          We do our work with reasonable skill and care. To the extent the law allows, we
          aren&rsquo;t liable for indirect or consequential losses (such as lost profits
          or data), and our total liability for any project is limited to the amount you
          paid us for it in the 12 months before the claim.
        </p>
        <p>
          Nothing in these terms limits liability that can&rsquo;t be limited by law, or
          takes away rights you have under Kenyan law, including the Consumer Protection
          Act.
        </p>
      </Section>

      <Section id="terms-ending" title="13. Ending a project">
        <p>
          Either of us can end a project in writing if the other seriously breaks these
          terms or the proposal and doesn&rsquo;t fix it within 14 days of being asked. If
          a project ends early, you pay for the work done up to that point, and we hand
          over that work once it&rsquo;s paid for.
        </p>
      </Section>

      <Section id="terms-privacy" title="14. Privacy">
        <p>
          How we handle personal data is explained in our{" "}
          <Link href="/legal#privacy" className="text-primary hover:underline">
            privacy notice
          </Link>
          .
        </p>
      </Section>

      <Section id="terms-law" title="15. Law and disputes">
        <p>
          These terms are governed by the laws of Kenya. If a dispute comes up,
          we&rsquo;ll first try to resolve it by talking it through in good faith. If that
          doesn&rsquo;t work, the courts of Kenya will decide it.
        </p>
      </Section>

      <Section id="terms-changes" title="16. Changes and contact">
        <p>
          We may update these terms; changes don&rsquo;t affect a proposal you&rsquo;ve
          already accepted. Questions? Email {mail}.
        </p>
      </Section>
    </div>
  );
}
