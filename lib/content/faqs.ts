/**
 * Frequently asked questions shown on the public pages, in one place so the
 * pages and the website chat assistant (lib/chat/knowledge.ts) always give
 * the same answers. Edit answers here; facts only (CLAUDE.md §2).
 */
export type FaqItem = { question: string; answer: string };

export const faqs = {
  academy: [
    {
      question: "Are the courses really free?",
      answer:
        "Yes. Free courses are open to everyone with no sign-up or payment. Paid courses, when they launch, will be clearly marked.",
    },
    {
      question: "Do I need experience to start?",
      answer:
        "No. Each course says who it's for and what you need before you start, and beginner courses assume no background.",
    },
    {
      question: "Can you train our company's team?",
      answer:
        "Yes. Contact us with your team's size and goals, and we'll plan training around the tools and work you already do.",
    },
  ],
  aiDataServices: [
    {
      question: "What is RLHF?",
      answer:
        "RLHF (reinforcement learning from human feedback) trains an AI model using human judgements of its answers. People rank or score responses, and the model learns to prefer the answers people rate higher. NillTech provides the trained, managed teams that produce those judgements.",
    },
    {
      question: "What kinds of data do you annotate?",
      answer:
        "Image, text, audio, video and document data: for example bounding boxes and tags for images, entity tagging and classification for text, transcription for audio, and data extraction from documents.",
    },
    {
      question: "How do you keep quality consistent?",
      answer:
        "Every project starts with written guidelines and a pilot batch you review. In production, reviewers check the team's work against the guidelines, and edge cases are escalated instead of guessed.",
    },
    {
      question: "Where is the team based?",
      answer:
        "In East Africa: Kenya, Uganda, Tanzania and Rwanda. NillTech recruits, trains and manages the team, so you work with one company, not individual contractors.",
    },
    {
      question: "How is our data protected?",
      answer:
        "Access is limited to the people working on your project, and we follow your data handling rules. Our privacy notice explains how we handle data, and we can sign an NDA before you share anything.",
    },
    {
      question: "How much does annotation or RLHF work cost?",
      answer:
        "It depends on the task, data type, volume, quality bar and turnaround, so we quote per project after scoping. A pilot batch shows the real cost per item before you commit to volume.",
    },
  ],
  aiSolutions: [
    {
      question: "What can AI do for a small business?",
      answer:
        "The quickest wins are answering repeat customer questions on WhatsApp or your website, automating follow-ups and reminders, and pulling information out of documents and forms. We start with the one task that saves your team the most time.",
    },
    {
      question: "How much does an AI chatbot cost in Kenya?",
      answer:
        "Setup starts from KES 40,000. Running costs start from about KES 5,000 a month and cover hosting, WhatsApp messaging and AI usage, which we bill at cost. The AI token estimator shows usage costs for different models.",
    },
    {
      question: "Will the AI give customers wrong answers?",
      answer:
        "We limit each assistant to the information you approve, test it with you before launch, and set it to hand over to a person when it isn't sure.",
    },
    {
      question: "Is my customer data safe?",
      answer:
        "We only connect the data the solution needs, restrict access by role, and use providers with strong data protection. Our privacy notice explains how data is handled.",
    },
  ],
  managedTeams: [
    {
      question: "How is this different from hiring freelancers?",
      answer:
        "Freelancers leave you to manage, review and replace them. NillTech recruits and screens the engineers, manages delivery and quality, and stays accountable for the result. You get one contract and one point of contact.",
    },
    {
      question: "How much does a dedicated developer cost?",
      answer:
        "From KES 180,000 per developer per month for East African clients, and from USD 1,800 for clients in the US, UK and Canada. Senior specialists and larger teams cost more; longer engagements cost less.",
    },
    {
      question: "How quickly can a team start?",
      answer: "Usually within 1 to 2 weeks of agreeing the team size and skills.",
    },
    {
      question: "Where are your engineers based?",
      answer:
        "Across East Africa: Kenya, Uganda, Tanzania and Rwanda. Every engineer is screened by our recruitment team and completes a test task before joining a client team.",
    },
    {
      question: "Can your engineers join our existing team?",
      answer:
        "Yes. Engineers can work inside your tools, processes and meetings while NillTech keeps responsibility for their reporting, quality and delivery standards. You get regular status reports and a clear route to raise issues.",
    },
    {
      question: "What happens when the engagement ends?",
      answer:
        "We run a planned handover: documentation and knowledge transfer to your team, so the work continues without us.",
    },
    {
      question: "Who owns the work?",
      answer:
        "You do. Ownership of everything the team builds for you passes to you on payment, as set out in our terms.",
    },
  ],
  partnerships: [
    {
      question: "Can you deliver under our brand?",
      answer:
        "Yes. We can work as your white-label delivery team, so your clients deal with you and we stay behind the scenes.",
    },
    {
      question: "How do partnerships work commercially?",
      answer:
        "Either a fixed price per project or a monthly rate per engineer, invoiced in KES or USD. Contact sales and we'll agree the model that fits your pipeline.",
    },
    {
      question: "How do you protect quality and confidentiality?",
      answer:
        "Every engineer is screened and completes a test task before joining a team, every delivery goes through code review and a QA checklist, and we're happy to sign your NDA.",
    },
  ],
  pricing: [
    {
      question: "Why is the USD price different from the KES price?",
      answer:
        "KES prices are for clients in East Africa. USD prices are for clients in the US, UK and Canada and reflect international project requirements, so they aren't a straight currency conversion.",
    },
    {
      question: "How do payments work?",
      answer:
        "Each proposal sets out a payment schedule. You can pay by M-Pesa Paybill or bank transfer, in KES or USD, and every payment gets a receipt.",
    },
    {
      question: "What's included in the price?",
      answer:
        "Design, build, testing, launch and free bug fixes for the period in your proposal. Hosting, domains and other third-party services are billed at cost, and new features after launch are quoted separately.",
    },
    {
      question: "Is the estimate my final price?",
      answer:
        "No. The estimator gives an indicative range. After a short discovery call we confirm a fixed quote in writing before any work starts.",
    },
  ],
  services: [
    {
      question: "How much does a website cost in Kenya?",
      answer:
        "A NillTech business website starts from KES 45,000 and usually lands between KES 45,000 and 90,000, depending on pages and features. Online stores start from KES 95,000. Use the estimator for a range based on your project.",
    },
    {
      question: "How long does it take to build a website or system?",
      answer:
        "Business websites take 1 to 7 days, online stores 1 to 2 weeks, and business systems or custom software 2 to 4 weeks. Having your content ready at kickoff keeps things on the fast end.",
    },
    {
      question: "Do I own the website and code?",
      answer:
        "Yes. Ownership of the code and design we create for you passes to you once the project is paid in full.",
    },
    {
      question: "What do I receive at handover?",
      answer:
        "The finished product, deployed and tested, plus the source code with its version history, technical documentation and deployment guides, the test reports, and a handover session with your team.",
    },
    {
      question: "What happens after launch?",
      answer:
        "Bug fixes are free for the period stated in your proposal. New features and changes are quoted separately, and hosting or third-party services are billed at cost.",
    },
    {
      question: "Can you accept M-Pesa?",
      answer:
        "Yes. You can pay us by M-Pesa Paybill or bank transfer, in KES or USD. Online stores we build include M-Pesa and card checkout.",
    },
  ],
} satisfies Record<string, FaqItem[]>;
