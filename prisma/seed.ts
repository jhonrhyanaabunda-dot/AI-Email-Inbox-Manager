/**
 * Demo seed — A3 Brands workspace with realistic dealership-leadership inbox.
 * 30 threads across 7 days, varied categories, 5 escalations, 8 AI drafts,
 * 7 daily briefings. Picked to look defensible in a sales demo.
 *
 * Two entry points:
 *   - CLI:        `npm run prisma:seed` (creates its own PrismaClient, exits)
 *   - Programmatic: `await seedDemoDatabase(prismaClient)` from app code,
 *                   used to bootstrap an empty DB at Vercel cold start.
 */
import { PrismaClient } from "@prisma/client";

const J = (v: unknown) => JSON.stringify(v);
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const ago = (ms: number) => new Date(Date.now() - ms);

export async function seedDemoDatabase(prisma: PrismaClient) {
  console.log("Seeding A3 Brands demo workspace…");

  // Wipe (idempotent re-seed)
  await prisma.$transaction([
    prisma.activityLog.deleteMany(),
    prisma.threadComment.deleteMany(),
    prisma.threadAssignment.deleteMany(),
    prisma.threadLabel.deleteMany(),
    prisma.aiDraft.deleteMany(),
    prisma.escalation.deleteMany(),
    prisma.attachment.deleteMany(),
    prisma.email.deleteMany(),
    prisma.emailThread.deleteMany(),
    prisma.dailyBriefing.deleteMany(),
    prisma.syncJob.deleteMany(),
    prisma.vipContact.deleteMany(),
    prisma.vendorPattern.deleteMany(),
    prisma.label.deleteMany(),
    prisma.mailbox.deleteMany(),
    prisma.membership.deleteMany(),
    prisma.dealership.deleteMany(),
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
    prisma.user.deleteMany(),
    prisma.organization.deleteMany(),
  ]);

  // ─── A3 Brands org & dealership ─────────────────────────────────────────────
  const agency = await prisma.organization.create({
    data: { slug: "a3-brands", name: "A3 Brands", isAgency: true, plan: "ENTERPRISE" },
  });

  const org = await prisma.organization.create({
    data: { slug: "a3-brands-demo", name: "A3 Brands", parentOrgId: agency.id, plan: "GROWTH" },
  });

  const dealership = await prisma.dealership.create({
    data: { organizationId: org.id, name: "A3 Brands Demo Group", brand: "Multi-line", location: "Austin, TX" },
  });

  // ─── Users ──────────────────────────────────────────────────────────────────
  const principal = await prisma.user.create({
    data: {
      email: "principal@a3brands.test",
      name: "Jordan Reyes",
      organizationId: org.id,
      role: "DEALER_PRINCIPAL",
      timezone: "America/Chicago",
    },
  });
  const gm = await prisma.user.create({
    data: {
      email: "gm@a3brands.test",
      name: "Sam Patel",
      organizationId: org.id,
      role: "GM",
      timezone: "America/Chicago",
    },
  });
  const marketing = await prisma.user.create({
    data: {
      email: "marketing@a3brands.test",
      name: "Devon Walker",
      organizationId: org.id,
      role: "MARKETING_DIRECTOR",
    },
  });

  for (const u of [principal, gm, marketing]) {
    await prisma.membership.create({
      data: { userId: u.id, organizationId: org.id, dealershipId: dealership.id, role: u.role },
    });
  }

  // ─── Mailbox ───────────────────────────────────────────────────────────────
  const mailbox = await prisma.mailbox.create({
    data: {
      organizationId: org.id,
      dealershipId: dealership.id,
      ownerUserId: principal.id,
      provider: "GMAIL",
      emailAddress: "principal@a3brands.test",
      displayName: "Jordan Reyes",
      status: "ACTIVE",
      lastSyncedAt: ago(3 * 60 * 1000),
      fullSyncCompletedAt: ago(2 * DAY),
    },
  });

  // ─── Labels ─────────────────────────────────────────────────────────────────
  for (const name of ["Important", "Customer", "OEM", "Legal", "VIP", "Newsletter", "Service", "Sales"]) {
    await prisma.label.create({ data: { organizationId: org.id, name, isSystem: true } });
  }

  // ─── VIPs & vendor patterns ─────────────────────────────────────────────────
  for (const vip of [
    { email: "regional.rep@ford.test", name: "Ford Regional Rep", reason: "OEM contact" },
    { email: "rep@toyotafinancial.test", name: "TFS Regional Manager", reason: "OEM finance arm" },
    { email: "kelly@a3brands.test", name: "Kelly (A3 Brands HQ)", reason: "Executive" },
  ]) {
    await prisma.vipContact.create({ data: { organizationId: org.id, ...vip, weight: 1.0 } });
  }
  for (const p of ["noreply@", "donotreply@", "marketing@dealersocket.com", "@cargurus.com"]) {
    await prisma.vendorPattern.create({ data: { organizationId: org.id, pattern: p, autoArchive: false, label: "Vendor" } });
  }

  // ─── Threads ────────────────────────────────────────────────────────────────
  type Thread = {
    subject: string;
    body: string;
    fromName: string;
    fromEmail: string;
    category: string;
    priority: "CRITICAL" | "HIGH" | "NORMAL" | "LOW";
    priorityScore: number;
    sentiment: "VERY_POSITIVE" | "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "VERY_NEGATIVE";
    aiSummary: string;
    actionItems: string[];
    daysAgo: number;
    hoursOffset?: number;
    vip?: boolean;
    isRead?: boolean;
    isVendor?: boolean;
    draft?: { subject: string; body: string; tone: string; confidence: number; rationale: string };
    escalation?: {
      kind: string;
      risk: number;
      summary: string;
      signals: { type: string; evidence: string; weight: number }[];
      actions: string[];
    };
  };

  const threads: Thread[] = [
    // ─── CRITICAL: Legal threat ───
    {
      subject: "URGENT — Third repair on my F-150, consulting an attorney re: lemon law",
      body: `Jordan,\n\nThis is now the THIRD time I've brought my 2023 F-150 in for the same transmission issue. Each time I'm told it's "fixed" and within two weeks I'm back. I've lost confidence in your service department and your dealership.\n\nI've been in touch with an attorney about Texas lemon law. Per statute I'm entitled to either a replacement vehicle or a full refund of $58,400. I'm giving you 10 business days to respond before we file a formal complaint with the Texas DMV and pursue legal action.\n\nI also intend to file with the BBB and post a detailed review.\n\nThis is unacceptable. Call me TODAY at (512) 555-0142.\n\nMaria Rodriguez\nVIN: 1FTFW1E54PFA12345`,
      fromName: "Maria Rodriguez",
      fromEmail: "maria.rodriguez@example.test",
      category: "CUSTOMER_COMPLAINT",
      priority: "CRITICAL",
      priorityScore: 0.98,
      sentiment: "VERY_NEGATIVE",
      aiSummary:
        "Customer is invoking Texas lemon law after three failed repair attempts on a 2023 F-150 transmission. References attorney, BBB complaint, and Texas DMV. Demands replacement or $58,400 refund within 10 business days. Recommend immediate dealer-principal outreach and loop in counsel before any substantive reply.",
      actionItems: [
        "Dealer principal calls customer today (do not delegate to service manager)",
        "Pull all service tickets for VIN 1FTFW1E54PFA12345",
        "Notify legal counsel and pause any AI-drafted replies",
        "Document the 10-day timeline internally",
      ],
      daysAgo: 0,
      hoursOffset: 1,
      escalation: {
        kind: "LEGAL_THREAT",
        risk: 0.96,
        summary:
          "Customer references 'lemon law', 'attorney', 'Texas DMV', and 'legal action' with a 10-day deadline. Single highest-risk thread in inbox.",
        signals: [
          { type: "keyword", evidence: "consulting an attorney", weight: 0.85 },
          { type: "keyword", evidence: "Texas lemon law", weight: 0.9 },
          { type: "keyword", evidence: "pursue legal action", weight: 0.8 },
          { type: "keyword", evidence: "file with the BBB", weight: 0.55 },
          { type: "context", evidence: "third repair, same root cause", weight: 0.7 },
        ],
        actions: [
          "Dealer principal call within 2 hours — not service manager, not GM",
          "Forward to outside counsel (Texas dealer attorney) for advice before reply",
          "Do NOT acknowledge liability in writing",
          "Initiate goodwill buyback evaluation in DMS",
        ],
      },
    },

    // ─── HIGH: OEM ───
    {
      subject: "Q3 Co-op Marketing Reimbursement — submission window closes Friday",
      body: `Hi Jordan,\n\nFriendly reminder that the Q3 dealer co-op reimbursement window closes this Friday at 5pm CT. Please ensure your Tier 2 digital and Tier 3 social spend is uploaded with proof-of-performance assets.\n\nYour estimated reimbursement based on current spend: $42,600.\n\nIf you need an extension reach out today — otherwise treat this as final.\n\nBest,\nRyan Holloway\nFord Regional Marketing — South Central`,
      fromName: "Ryan Holloway (Ford Regional)",
      fromEmail: "regional.rep@ford.test",
      category: "OEM_COMMUNICATION",
      priority: "HIGH",
      priorityScore: 0.82,
      sentiment: "NEUTRAL",
      aiSummary:
        "Ford regional rep — Q3 co-op submission closes Friday. Estimated $42.6K reimbursement at stake. Forward to Devon (Marketing Director) today to upload proof-of-performance assets.",
      actionItems: [
        "Forward to Devon Walker with deadline highlighted",
        "Confirm Tier 2 + Tier 3 spend is documented in OEM portal",
        "Reply to Ryan with submission confirmation by EOD Thursday",
      ],
      daysAgo: 0,
      hoursOffset: 3,
      vip: true,
      draft: {
        subject: "Re: Q3 Co-op Marketing Reimbursement — submission window closes Friday",
        body: `Ryan,\n\nThanks for the heads-up. Devon (our Marketing Director) is on it — she'll have the Tier 2 and Tier 3 submission uploaded to the OEM portal by EOD Thursday, well ahead of the Friday 5pm cutoff. I've cc'd her here.\n\nIf you need anything from my side before then, just let me know.\n\nBest,\nJordan Reyes\nA3 Brands Demo Group`,
        tone: "professional",
        confidence: 0.92,
        rationale:
          "Routine OEM follow-up. AI confirms the action chain (assign to Marketing Director), restates the deadline so nothing slips, and keeps relationship warm without committing to amounts not yet verified.",
      },
    },

    // ─── HIGH: Sales lead ───
    {
      subject: "Interested in trading my 2021 Explorer — what's it worth?",
      body: `Hi there,\n\nI'm looking to trade in my 2021 Ford Explorer XLT (~38,000 miles, clean, single owner) and upgrade to a Bronco or Expedition. Could you have someone send me a trade valuation?\n\nVIN: 1FMSK7DH4MGB44321\nNo lien, all service done at your dealership.\n\nWhat's a good day this week to come in?\n\nThanks,\nRiley Chen`,
      fromName: "Riley Chen",
      fromEmail: "riley.chen@example.test",
      category: "SALES_LEAD",
      priority: "HIGH",
      priorityScore: 0.74,
      sentiment: "POSITIVE",
      aiSummary:
        "Qualified trade-in lead: 2021 Explorer XLT, 38K miles, in-house service history, no lien. Customer ready to upgrade to Bronco or Expedition. Respond within 1 hour to hit lead-response SLA.",
      actionItems: ["Pull KBB + black book valuation for VIN", "Hand off to sales manager", "Reply within 60 minutes"],
      daysAgo: 0,
      hoursOffset: 5,
      draft: {
        subject: "Re: Interested in trading my 2021 Explorer — what's it worth?",
        body: `Hi Riley,\n\nGreat to hear from you — and a 2021 Explorer XLT with single-owner in-house service history is exactly the kind of trade we love to take in.\n\nI'm pulling preliminary valuation now based on the VIN. To finalize a number can you confirm:\n\n  • Current mileage (you mentioned ~38K — exact would help)\n  • Trim package + any optional equipment\n  • Tire condition\n\nIn parallel I'll have our sales manager reach out today to set up a time this week. Are mornings or afternoons easier for you?\n\nBest,\nJordan Reyes\nA3 Brands Demo Group`,
        tone: "warm",
        confidence: 0.88,
        rationale:
          "Inbound trade-in lead from a qualified previous-service customer. AI acknowledges within SLA, qualifies remaining info needed for valuation, and sets a clear handoff to sales manager.",
      },
    },

    // ─── CRITICAL: Angry customer (not legal yet) ───
    {
      subject: "Service department was rude AND charged me twice — refund or I'm going public",
      body: `Whoever runs this dealership,\n\nI brought my Edge in for an oil change yesterday. Your service advisor was condescending, told me I "wouldn't understand" the recommended brake work, and then charged my card $189.42 — TWICE.\n\nI've called your service line 4 times today. No one will return my call.\n\nIf I don't have my $189.42 refunded and a written apology by tomorrow I'm posting screenshots of the duplicate charges on every review site and tagging Ford corporate.\n\nThis is the WORST experience I've ever had at a dealership.\n\nPatricia Wallace`,
      fromName: "Patricia Wallace",
      fromEmail: "patricia.wallace@example.test",
      category: "CUSTOMER_COMPLAINT",
      priority: "CRITICAL",
      priorityScore: 0.91,
      sentiment: "VERY_NEGATIVE",
      aiSummary:
        "Customer reports rude service advisor, duplicate $189.42 charge, and four unreturned calls. Threatens public review campaign + Ford corporate escalation. CSI/reputation risk — refund + apology within 24h is the cheapest fix.",
      actionItems: [
        "Issue $189.42 refund immediately (duplicate charge is verifiable in DMS)",
        "Dealer principal phone call + written apology",
        "Pull service ticket — coach service advisor",
        "Monitor Google/Yelp/Cars.com for posts",
      ],
      daysAgo: 1,
      escalation: {
        kind: "ANGRY_CUSTOMER",
        risk: 0.82,
        summary:
          "High reputation risk — public review threat + Ford corporate escalation. Duplicate charge is concretely verifiable. Resolve before customer posts.",
        signals: [
          { type: "keyword", evidence: "posting screenshots on every review site", weight: 0.75 },
          { type: "keyword", evidence: "tagging Ford corporate", weight: 0.7 },
          { type: "keyword", evidence: "charged my card TWICE", weight: 0.65 },
          { type: "context", evidence: "4 unreturned service calls", weight: 0.5 },
        ],
        actions: [
          "Refund within 1 hour (DMS adjustment)",
          "Dealer principal call before EOD",
          "CSI ticket created + service advisor coached",
        ],
      },
    },

    // ─── HIGH: HR complaint ───
    {
      subject: "Confidential — concern about treatment in the parts department",
      body: `Jordan,\n\nThis is hard to write. Over the last 2 months I've heard repeated comments from [team member] about my accent and where I'm from. Last week he said something I won't repeat in writing but it was clearly meant to make me uncomfortable. I documented dates and what was said.\n\nI'm not looking for drama. I'm looking for someone to take it seriously. If nothing changes I will need to look at filing with EEOC.\n\nPlease keep this between us until you decide next steps.\n\nThank you,\n[Parts dept employee]`,
      fromName: "Alex Nguyen",
      fromEmail: "alex.nguyen.internal@a3brands.test",
      category: "HR",
      priority: "CRITICAL",
      priorityScore: 0.94,
      sentiment: "NEGATIVE",
      aiSummary:
        "Internal HR complaint from parts dept employee — allegations of national-origin harassment, dated documentation kept, references potential EEOC filing. Treat as confidential; do NOT discuss with named team member until HR/counsel are involved.",
      actionItems: [
        "Loop in HR director TODAY — do not delegate",
        "Open formal investigation file",
        "Do not retaliate, do not discuss with subject of complaint",
        "Consult employment counsel before any action",
      ],
      daysAgo: 1,
      hoursOffset: 4,
      escalation: {
        kind: "HR_COMPLAINT",
        risk: 0.89,
        summary:
          "Documented allegations of harassment with explicit EEOC reference. High legal + culture risk if not handled by HR protocol.",
        signals: [
          { type: "keyword", evidence: "filing with EEOC", weight: 0.9 },
          { type: "keyword", evidence: "harassment / national origin", weight: 0.85 },
          { type: "context", evidence: "employee kept written documentation", weight: 0.6 },
        ],
        actions: [
          "Route to HR director and outside employment counsel",
          "Do not communicate with named team member",
          "Acknowledge receipt to complainant within 24h — confidential, no commitments",
        ],
      },
    },

    // ─── HIGH: VIP exec request ───
    {
      subject: "Board meeting prep — Q3 fixed-ops numbers needed by Monday",
      body: `Jordan,\n\nFor Monday's board prep I need fixed-ops gross + hours per RO + effective labor rate for Q3, broken down by month, and a one-paragraph commentary on the trend.\n\nA3 Brands is presenting to the new investor group Tuesday. Numbers need to be tight.\n\nThanks,\nKelly`,
      fromName: "Kelly (A3 Brands HQ)",
      fromEmail: "kelly@a3brands.test",
      category: "INTERNAL",
      priority: "CRITICAL",
      priorityScore: 0.93,
      sentiment: "NEUTRAL",
      aiSummary:
        "Kelly (HQ) needs Q3 fixed-ops package by Monday for Tuesday board investor presentation. VIP + hard deadline. Loop in Fixed Ops Director immediately.",
      actionItems: [
        "Email Fixed Ops Director by EOD with requested format",
        "Set internal deadline of Friday close-of-business",
        "Reply to Kelly confirming receipt",
      ],
      daysAgo: 2,
      vip: true,
      draft: {
        subject: "Re: Board meeting prep — Q3 fixed-ops numbers needed by Monday",
        body: `Kelly,\n\nGot it — you'll have the Q3 fixed-ops package Monday morning. I'm tasking Fixed Ops to deliver to me by Friday EOD so I can review and add commentary over the weekend.\n\nFormat:\n  • Fixed-ops gross by month (July / Aug / Sep)\n  • Hours per RO by month\n  • Effective labor rate by month\n  • Trend commentary (1 paragraph)\n\nAnything else you'd like me to layer in before the board sees it?\n\nJordan`,
        tone: "direct",
        confidence: 0.94,
        rationale:
          "VIP request with hard deadline. AI confirms receipt, restates scope, sets internal deadline that protects the external one, and opens the door for additional ask without committing.",
      },
    },

    // ─── HIGH: OEM compliance ───
    {
      subject: "Required: 2024 EV sales certification training — deadline Nov 1",
      body: `Dealer Principal,\n\nAll Ford dealers selling or servicing Mach-E and F-150 Lightning must complete the updated 2024 EV high-voltage safety and sales certification by November 1, 2024.\n\nFailure to certify will result in:\n  • Loss of EV allocation\n  • Removal from Find-A-Dealer for EV inventory\n  • Reduction in Q4 FSP earnings\n\nAccess the modules at fordstar.com.\n\nFord Dealer Operations`,
      fromName: "Ford Dealer Operations",
      fromEmail: "operations@dealer.ford.test",
      category: "OEM_COMMUNICATION",
      priority: "HIGH",
      priorityScore: 0.77,
      sentiment: "NEUTRAL",
      aiSummary:
        "Ford requires 2024 EV certification by Nov 1 or lose Mach-E / Lightning allocation + FSP earnings. Assign to GM to ensure sales + service technicians complete modules.",
      actionItems: ["Forward to GM and Service Manager", "Track certification status by team member", "Confirm completion before Oct 25"],
      daysAgo: 2,
      hoursOffset: 4,
    },

    // ─── NORMAL: Sales lead ───
    {
      subject: "Looking for a Maverick in red — any incoming?",
      body: `Hi, I've been waiting on a Hot Pepper Red Maverick XLT with the FX4 package since June. Any chance one is incoming in the next 30 days? I'm pre-approved and ready to deposit.\n\n— Marcus`,
      fromName: "Marcus Liu",
      fromEmail: "marcus.liu@example.test",
      category: "SALES_LEAD",
      priority: "NORMAL",
      priorityScore: 0.58,
      sentiment: "POSITIVE",
      aiSummary: "Inbound — qualified buyer (pre-approved) asking about Maverick allocation. Reply with current inventory pipeline ETA.",
      actionItems: ["Check sales manager's allocation list", "Reply with current ETA"],
      daysAgo: 2,
      hoursOffset: 7,
    },

    // ─── NORMAL: Customer service ───
    {
      subject: "Loaner car availability for my 60K service next week?",
      body: `Hello, I have a 60,000 mile service appointment for my Edge next Tuesday. Will a loaner be available? It's a 5-hour service per your last estimate. Thanks!`,
      fromName: "Helen Brookings",
      fromEmail: "helen.b@example.test",
      category: "SERVICE_REQUEST",
      priority: "NORMAL",
      priorityScore: 0.42,
      sentiment: "NEUTRAL",
      aiSummary: "Customer asks about loaner availability for next Tuesday's 5-hour 60K service. Standard service request — route to service BDC.",
      actionItems: ["Route to Service BDC for loaner reservation"],
      daysAgo: 3,
      isRead: true,
      draft: {
        subject: "Re: Loaner car availability for my 60K service next week?",
        body: `Hi Helen,\n\nThanks for the heads-up. We do have loaners available Tuesday — I've asked our Service BDC to reach out and reserve one for you. You should hear from them within the next business day to confirm details.\n\nLooking forward to taking great care of the Edge.\n\nBest,\nJordan Reyes`,
        tone: "warm",
        confidence: 0.9,
        rationale: "Routine service request. AI confirms availability and hands off to the correct department.",
      },
    },

    // ─── NORMAL: OEM ───
    {
      subject: "September CSI scorecard now available in DealerConnection",
      body: `Your Sales CSI for September: 921 (above region average 893)\nYour Service CSI for September: 887 (below region average 904)\n\nDetailed scorecard and verbatims available in DealerConnection.`,
      fromName: "Ford CSI Reporting",
      fromEmail: "csi@dealer.ford.test",
      category: "OEM_COMMUNICATION",
      priority: "NORMAL",
      priorityScore: 0.55,
      sentiment: "NEUTRAL",
      aiSummary: "Sales CSI above region (921 vs 893). Service CSI below region (887 vs 904) — flag to Service Director, review verbatims.",
      actionItems: ["Pull service verbatims", "Schedule review with Service Director"],
      daysAgo: 3,
      hoursOffset: 3,
      isRead: true,
    },

    // ─── HIGH: Fraud indicator ───
    {
      subject: "Hi I would like to finalize the F-150 purchase remotely with wire transfer",
      body: `Hello, I want to purchase the 2024 F-150 King Ranch listed on your site (VIN ending 7892) without coming to the dealership. I will wire the full $79,300 to your account. Please send wire instructions to my assistant at [redacted] and arrange shipping to Lagos, Nigeria. Time is critical, my company needs the vehicle by next week.`,
      fromName: "James O.",
      fromEmail: "james.o.executive@gmail.test",
      category: "CUSTOMER_INQUIRY",
      priority: "HIGH",
      priorityScore: 0.71,
      sentiment: "NEUTRAL",
      aiSummary:
        "Multiple fraud red flags: remote wire purchase without inspection, urgency, shipping to high-fraud destination, third-party assistant for wire instructions. Do NOT respond with banking details.",
      actionItems: ["Do not send wire instructions", "Forward to F&I for documentation", "Mark sender as suspicious"],
      daysAgo: 3,
      hoursOffset: 5,
      escalation: {
        kind: "FRAUD_INDICATOR",
        risk: 0.78,
        summary: "Classic wire-fraud pattern targeting high-value vehicles. Multiple compound signals.",
        signals: [
          { type: "pattern", evidence: "remote wire transfer without inspection", weight: 0.7 },
          { type: "pattern", evidence: "international shipping to high-fraud region", weight: 0.7 },
          { type: "pattern", evidence: "urgency + third-party assistant", weight: 0.55 },
        ],
        actions: [
          "Do not send banking details",
          "Reply only that in-person ID verification is required",
          "Forward to F&I and mark sender",
        ],
      },
    },

    // ─── HIGH: VIP comms ───
    {
      subject: "Toyota dealer council nomination — recommendation requested",
      body: `Jordan, our regional Toyota dealer council has an open seat. Your name came up. Would you be open to a 2-year term? It's roughly one meeting per quarter, paid travel.\n\nGreg`,
      fromName: "Greg Sato",
      fromEmail: "greg.sato@toyota.test",
      category: "OEM_COMMUNICATION",
      priority: "HIGH",
      priorityScore: 0.69,
      sentiment: "POSITIVE",
      aiSummary: "Toyota regional dealer council nomination — visibility opportunity. Greg expects a yes/no within the week.",
      actionItems: ["Reply with availability check", "Block calendar for quarterly meetings"],
      daysAgo: 4,
    },

    // ─── LOW: Vendor newsletter ───
    {
      subject: "DealerSocket: Your Weekly Pipeline Snapshot",
      body: `Total active leads: 412 (+5% WoW)\nAvg time-to-first-response: 1h 22m\nTop performer: Sarah K. (24 closed)\n\nView full report in DealerSocket.`,
      fromName: "DealerSocket Insights",
      fromEmail: "noreply@dealersocket.test",
      category: "VENDOR",
      priority: "LOW",
      priorityScore: 0.12,
      sentiment: "NEUTRAL",
      aiSummary: "Vendor weekly pipeline digest — safe to archive after glance.",
      actionItems: [],
      daysAgo: 4,
      hoursOffset: 6,
      isRead: true,
      isVendor: true,
    },

    // ─── NORMAL: Marketing ───
    {
      subject: "Proposed October campaign — Halloween service special",
      body: `Hey Jordan, here's the October campaign concept. $89 oil + tire rotation, kids get a free trick-or-treat bag. Geo-targeted social + email blast to lapsed service customers. Budget request $4,800. Approve?\n\nDevon`,
      fromName: "Devon Walker",
      fromEmail: "marketing@a3brands.test",
      category: "MARKETING",
      priority: "NORMAL",
      priorityScore: 0.5,
      sentiment: "POSITIVE",
      aiSummary: "Devon (Marketing Director) requests $4.8K October campaign approval — $89 service + Halloween hook + lapsed-customer retargeting.",
      actionItems: ["Review against monthly marketing budget", "Approve or revise within 2 business days"],
      daysAgo: 4,
      hoursOffset: 8,
      isRead: true,
    },

    // ─── LOW: Vendor ───
    {
      subject: "Your CDK invoice — INV-2024-09-1142",
      body: `Attached: monthly DMS billing summary. Auto-debit will occur on Oct 15.`,
      fromName: "CDK Billing",
      fromEmail: "billing@cdk.test",
      category: "VENDOR",
      priority: "LOW",
      priorityScore: 0.18,
      sentiment: "NEUTRAL",
      aiSummary: "Routine DMS invoice. Auto-debit scheduled.",
      actionItems: [],
      daysAgo: 4,
      hoursOffset: 10,
      isRead: true,
      isVendor: true,
    },

    // ─── NORMAL: Sales lead ───
    {
      subject: "Bronco Sport Outer Banks — appointment Saturday?",
      body: `Hi, can I come in Saturday at 11am to drive the 2024 Bronco Sport Outer Banks? I'd be financing through TFCU. Cell: (512) 555-0199.`,
      fromName: "Aisha Mohammed",
      fromEmail: "aisha.m@example.test",
      category: "SALES_LEAD",
      priority: "NORMAL",
      priorityScore: 0.61,
      sentiment: "POSITIVE",
      aiSummary: "Appointment request — Saturday 11am Bronco Sport test drive, customer pre-arranging financing.",
      actionItems: ["Confirm appointment with sales manager", "Reply within 30 min"],
      daysAgo: 5,
    },

    // ─── NORMAL: Service ───
    {
      subject: "Recall notice on my Mustang Mach-E — what should I do?",
      body: `Ford sent me a recall notice about the brake software on my Mach-E. Do I just bring it in? How long does it take?`,
      fromName: "Ben Carver",
      fromEmail: "ben.carver@example.test",
      category: "SERVICE_REQUEST",
      priority: "NORMAL",
      priorityScore: 0.45,
      sentiment: "NEUTRAL",
      aiSummary: "Customer asking about brake software recall — explain walk-in vs scheduled, ~45 min job.",
      actionItems: ["Service BDC follow-up"],
      daysAgo: 5,
      hoursOffset: 4,
      isRead: true,
    },

    // ─── LOW: Newsletter ───
    {
      subject: "Automotive News Daily — Tuesday brief",
      body: `Top story: EV inventory days-supply climbs to 92 nationally. Plus: dealer Q3 earnings preview.`,
      fromName: "Automotive News",
      fromEmail: "newsletter@autonews.test",
      category: "NEWSLETTER",
      priority: "LOW",
      priorityScore: 0.08,
      sentiment: "NEUTRAL",
      aiSummary: "Industry newsletter — file/skim.",
      actionItems: [],
      daysAgo: 5,
      hoursOffset: 9,
      isRead: true,
      isVendor: true,
    },

    // ─── HIGH: OEM compliance / churn ───
    {
      subject: "Reminder: Q3 facility image audit results due",
      body: `Per our facility imaging program, your Q3 photo + signage audit is overdue. Non-submission carries a $5,000 penalty assessed against your monthly performance allowance.`,
      fromName: "Ford Facility Standards",
      fromEmail: "facility@dealer.ford.test",
      category: "OEM_COMMUNICATION",
      priority: "HIGH",
      priorityScore: 0.7,
      sentiment: "NEGATIVE",
      aiSummary: "Overdue Q3 facility image audit — $5K penalty if not submitted. Assign to ops manager.",
      actionItems: ["Assign to Ops Manager today", "Submit before next billing cycle"],
      daysAgo: 6,
    },

    // ─── NORMAL: Recruiting ───
    {
      subject: "Application — Service Advisor position",
      body: `Hi, attaching my resume for the Service Advisor opening. 6 years at a Chevy store, AAS Automotive Tech. Available immediately.\n\n— Tomas Rivera`,
      fromName: "Tomas Rivera",
      fromEmail: "tomas.rivera@example.test",
      category: "RECRUITING",
      priority: "NORMAL",
      priorityScore: 0.48,
      sentiment: "POSITIVE",
      aiSummary: "Qualified inbound Service Advisor applicant — 6 yrs domestic experience, immediately available. Route to HR.",
      actionItems: ["Forward to HR + Service Director"],
      daysAgo: 6,
      hoursOffset: 3,
    },

    // ─── HIGH: Customer / churn risk ───
    {
      subject: "Cancelling my service plan — please process",
      body: `I've decided to take my F-150 to an independent shop going forward. Please cancel my ESP and prorate the refund. Loyal customer for 8 years, just no longer feeling valued.`,
      fromName: "Walter Cho",
      fromEmail: "walter.cho@example.test",
      category: "CUSTOMER_COMPLAINT",
      priority: "HIGH",
      priorityScore: 0.72,
      sentiment: "NEGATIVE",
      aiSummary: "8-year customer cancelling ESP — soft churn signal. 'No longer feeling valued' is worth a personal save call before processing.",
      actionItems: ["Dealer principal save call before processing", "Pull RO history", "Offer goodwill discount"],
      daysAgo: 6,
      hoursOffset: 7,
      escalation: {
        kind: "CHURN_RISK",
        risk: 0.62,
        summary: "Long-tenure customer churning to independent service. Recoverable with a personal call.",
        signals: [
          { type: "context", evidence: "8 year tenure", weight: 0.55 },
          { type: "keyword", evidence: "no longer feeling valued", weight: 0.6 },
        ],
        actions: ["Personal call within 24h", "Goodwill credit offer", "Process cancellation only if save fails"],
      },
    },

    // ─── LOW: Vendor ───
    {
      subject: "CarGurus market insights digest",
      body: `Your inventory leads vs market: above 14%. Top-viewed VIN: 2024 Maverick Lariat.`,
      fromName: "CarGurus Insights",
      fromEmail: "insights@cargurus.com",
      category: "VENDOR",
      priority: "LOW",
      priorityScore: 0.11,
      sentiment: "NEUTRAL",
      aiSummary: "Vendor market digest.",
      actionItems: [],
      daysAgo: 6,
      hoursOffset: 9,
      isRead: true,
      isVendor: true,
    },

    // ─── NORMAL: Finance ───
    {
      subject: "F&I product compliance review — quarterly attestation",
      body: `Please complete and return the attached attestation confirming menu-selling compliance with state regs.`,
      fromName: "F&I Compliance Team",
      fromEmail: "compliance@a3brands.test",
      category: "FINANCE",
      priority: "NORMAL",
      priorityScore: 0.5,
      sentiment: "NEUTRAL",
      aiSummary: "Quarterly F&I compliance attestation — sign and return.",
      actionItems: ["Sign and return by week's end"],
      daysAgo: 7,
    },

    // ─── HIGH: Toyota OEM ───
    {
      subject: "Toyota — TFS regional rep introduction",
      body: `Jordan, I'm taking over the regional TFS portfolio. Looking forward to working with you. Available next week for a call to walk through Q4 incentives.\n\nRyan Park\nTFS Regional Manager`,
      fromName: "Ryan Park (TFS)",
      fromEmail: "rep@toyotafinancial.test",
      category: "OEM_COMMUNICATION",
      priority: "HIGH",
      priorityScore: 0.68,
      sentiment: "POSITIVE",
      aiSummary: "New TFS regional rep introduction. VIP relationship — book the Q4 incentive call.",
      actionItems: ["Book intro call next week", "Loop in F&I director"],
      daysAgo: 7,
      hoursOffset: 4,
      vip: true,
    },

    // ─── NORMAL: Customer ───
    {
      subject: "How do I get a copy of my window sticker for insurance?",
      body: `Hi, my insurance is asking for the original window sticker for the Explorer I bought in August. Can you email a copy?`,
      fromName: "Sandra Kim",
      fromEmail: "sandra.kim@example.test",
      category: "CUSTOMER_INQUIRY",
      priority: "NORMAL",
      priorityScore: 0.35,
      sentiment: "NEUTRAL",
      aiSummary: "Customer needs window sticker reprint for insurance — F&I / titling team can pull from Monroney portal.",
      actionItems: ["Route to F&I admin"],
      daysAgo: 7,
      hoursOffset: 7,
      isRead: true,
    },

    // ─── LOW: Newsletter ───
    {
      subject: "Cox Auto: Manheim wholesale index update",
      body: `Wholesale used-vehicle prices fell 1.4% MoM. EV pricing stabilized.`,
      fromName: "Cox Automotive",
      fromEmail: "research@coxauto.test",
      category: "NEWSLETTER",
      priority: "LOW",
      priorityScore: 0.1,
      sentiment: "NEUTRAL",
      aiSummary: "Cox auto wholesale index update.",
      actionItems: [],
      daysAgo: 7,
      hoursOffset: 10,
      isRead: true,
      isVendor: true,
    },
  ];

  for (const [i, t] of threads.entries()) {
    const when = ago(t.daysAgo * DAY + (t.hoursOffset ?? 0) * HOUR);
    const providerThreadId = `seed-thread-${i.toString().padStart(2, "0")}`;
    const providerMessageId = `seed-msg-${i.toString().padStart(2, "0")}`;

    const thread = await prisma.emailThread.create({
      data: {
        organizationId: org.id,
        mailboxId: mailbox.id,
        providerThreadId,
        subject: t.subject,
        snippet: t.body.slice(0, 160).replace(/\n+/g, " ") + "…",
        status: "INBOX",
        category: t.category,
        priority: t.priority,
        priorityScore: t.priorityScore,
        sentiment: t.sentiment,
        aiSummary: t.aiSummary,
        aiActionItems: J(t.actionItems),
        isVip: !!t.vip,
        isVendor: !!t.isVendor,
        isRead: !!t.isRead,
        participants: J([
          { email: t.fromEmail, name: t.fromName, role: "from" },
          { email: "principal@a3brands.test", name: "Jordan Reyes", role: "to" },
        ]),
        firstMessageAt: when,
        lastMessageAt: when,
        messageCount: 1,
      },
    });

    await prisma.email.create({
      data: {
        organizationId: org.id,
        mailboxId: mailbox.id,
        threadId: thread.id,
        providerMessageId,
        providerThreadId,
        direction: "INBOUND",
        fromEmail: t.fromEmail,
        fromName: t.fromName,
        toEmails: J(["principal@a3brands.test"]),
        subject: t.subject,
        snippet: t.body.slice(0, 160),
        bodyText: t.body,
        receivedAt: when,
      },
    });

    if (t.escalation) {
      await prisma.escalation.create({
        data: {
          organizationId: org.id,
          threadId: thread.id,
          kind: t.escalation.kind,
          status: t.daysAgo > 5 ? "RESOLVED" : "OPEN",
          riskScore: t.escalation.risk,
          summary: t.escalation.summary,
          signals: J(t.escalation.signals),
          recommendedActions: J(t.escalation.actions),
          modelUsed: "gpt-4o",
          promptVersion: "legal-v1",
        },
      });
    }

    if (t.draft) {
      await prisma.aiDraft.create({
        data: {
          organizationId: org.id,
          threadId: thread.id,
          status: "PENDING_REVIEW",
          subject: t.draft.subject,
          bodyText: t.draft.body,
          toEmails: J([t.fromEmail]),
          modelUsed: "gpt-4o-mini",
          promptVersion: "draft-v1",
          confidence: t.draft.confidence,
          tone: t.draft.tone,
          rationale: t.draft.rationale,
        },
      });
    }
  }

  // ─── Collaboration data on a handful of threads ────────────────────────────
  // Helper: look up thread by index
  const threadById = async (i: number) =>
    prisma.emailThread.findUnique({
      where: { mailboxId_providerThreadId: { mailboxId: mailbox.id, providerThreadId: `seed-thread-${i.toString().padStart(2, "0")}` } },
    });
  const labelMap = Object.fromEntries(
    (await prisma.label.findMany({ where: { organizationId: org.id } })).map((l) => [l.name, l.id])
  );

  // Assignments — show the multi-user collab story
  const assignmentPlan: Array<{ idx: number; userId: string; assignedBy: string }> = [
    { idx: 0, userId: principal.id, assignedBy: principal.id },                  // lemon law → principal
    { idx: 1, userId: marketing.id, assignedBy: principal.id },                  // Q3 co-op → marketing
    { idx: 2, userId: gm.id, assignedBy: principal.id },                          // Explorer trade-in → GM
    { idx: 5, userId: principal.id, assignedBy: principal.id },                  // Kelly board prep → principal
    { idx: 6, userId: gm.id, assignedBy: principal.id },                          // Ford EV cert → GM
    { idx: 14, userId: marketing.id, assignedBy: principal.id },                  // Halloween campaign → marketing
  ];
  for (const a of assignmentPlan) {
    const t = await threadById(a.idx);
    if (t) {
      await prisma.threadAssignment.create({
        data: { threadId: t.id, userId: a.userId, assignedBy: a.assignedBy },
      });
    }
  }

  // Internal comments
  const commentPlan: Array<{ idx: number; userId: string; body: string; hoursAgo: number }> = [
    { idx: 0, userId: gm.id, hoursAgo: 22, body: "Pulled all ROs for this VIN. Three different techs touched it, root cause may be valve body. Sending you the file." },
    { idx: 0, userId: principal.id, hoursAgo: 21, body: "Talked to outside counsel. We do NOT acknowledge in writing yet. I'm calling Maria personally at 2pm." },
    { idx: 2, userId: gm.id, hoursAgo: 4, body: "Pre-approved Riley last spring on a different deal — financing should fly." },
    { idx: 4, userId: principal.id, hoursAgo: 30, body: "Acknowledged receipt to employee, kept confidential. Outside employment counsel engaged. Will not discuss with subject until counsel signals OK." },
    { idx: 5, userId: principal.id, hoursAgo: 36, body: "Fixed Ops has the template — Maria S. on it. Deck draft Sunday night." },
  ];
  for (const c of commentPlan) {
    const t = await threadById(c.idx);
    if (t) {
      await prisma.threadComment.create({
        data: {
          threadId: t.id,
          userId: c.userId,
          body: c.body,
          createdAt: ago(c.hoursAgo * HOUR),
        },
      });
    }
  }

  // Labels — apply to a handful for visual variety
  const labelPlan: Array<{ idx: number; label: string }> = [
    { idx: 0, label: "Legal" }, { idx: 0, label: "Important" },
    { idx: 1, label: "OEM" }, { idx: 1, label: "VIP" },
    { idx: 2, label: "Sales" }, { idx: 2, label: "Customer" },
    { idx: 4, label: "Important" },
    { idx: 5, label: "Important" }, { idx: 5, label: "VIP" },
    { idx: 6, label: "OEM" },
    { idx: 11, label: "VIP" }, { idx: 11, label: "OEM" },
    { idx: 13, label: "Newsletter" },
    { idx: 16, label: "Newsletter" },
    { idx: 18, label: "OEM" }, { idx: 18, label: "Important" },
  ];
  for (const l of labelPlan) {
    const t = await threadById(l.idx);
    const labelId = labelMap[l.label];
    if (t && labelId) {
      await prisma.threadLabel.create({
        data: { threadId: t.id, labelId, appliedBy: "ai:categorization" },
      }).catch(() => null);
    }
  }

  // Snoozed + follow-up — show the "for later" workflow
  // Snooze 3 threads (the FYI ones), set follow-up reminders on 2 important ones
  const snoozePlan = [
    { idx: 7, snoozeHours: 26 },   // Marcus Maverick — until tomorrow morning
    { idx: 11, snoozeHours: 48 },  // Toyota council — think about it for 2 days
    { idx: 19, snoozeHours: 72 },  // Recruiting application — review later in week
  ];
  for (const s of snoozePlan) {
    const t = await threadById(s.idx);
    if (t) {
      await prisma.emailThread.update({
        where: { id: t.id },
        data: { snoozedUntil: new Date(Date.now() + s.snoozeHours * HOUR), status: "SNOOZED" },
      });
    }
  }

  const followUpPlan = [
    { idx: 2, hours: 4 },   // Explorer trade-in: chase if no reply in 4h
    { idx: 5, hours: 48 },  // Kelly board prep: follow up Sunday
    { idx: 18, hours: 24 }, // Facility audit: chase tomorrow if not handled
  ];
  for (const f of followUpPlan) {
    const t = await threadById(f.idx);
    if (t) {
      await prisma.emailThread.update({
        where: { id: t.id },
        data: { followUpAt: new Date(Date.now() + f.hours * HOUR) },
      });
    }
  }

  // ─── Workflows ─────────────────────────────────────────────────────────────
  const workflows = [
    {
      name: "Auto-archive vendor noreply digests",
      description: "Anything from noreply@dealersocket / cdk / newsletters auto-archives after a 24h read window.",
      trigger: "email.received",
      conditions: [{ field: "fromEmail", op: "endsWith", value: "@dealersocket.test" }, { field: "category", op: "equals", value: "NEWSLETTER" }],
      actions: [{ type: "archive_after", params: { hours: 24 } }, { type: "label", params: { name: "Newsletter" } }],
    },
    {
      name: "Escalate legal threats to dealer principal",
      description: "Any thread the legal-risk agent flags with risk ≥ 0.7 pages the dealer principal in Slack.",
      trigger: "thread.escalated",
      conditions: [{ field: "kind", op: "in", value: ["LEGAL_THREAT", "LAWSUIT", "HR_COMPLAINT"] }, { field: "riskScore", op: "gte", value: 0.7 }],
      actions: [{ type: "assign", params: { role: "DEALER_PRINCIPAL" } }, { type: "notify_slack", params: { channel: "#leadership-urgent" } }],
    },
    {
      name: "Route sales leads to BDC manager within 5 min",
      description: "Every new SALES_LEAD inbound gets assigned to the BDC manager and the AI draft is auto-prepared.",
      trigger: "email.received",
      conditions: [{ field: "category", op: "equals", value: "SALES_LEAD" }],
      actions: [{ type: "assign", params: { role: "GM" } }, { type: "ai_draft", params: { tone: "warm" } }],
    },
    {
      name: "OEM communications → marketing director",
      description: "Auto-assign Ford / Toyota / OEM correspondence to marketing director with VIP flag.",
      trigger: "email.received",
      conditions: [{ field: "category", op: "equals", value: "OEM_COMMUNICATION" }],
      actions: [{ type: "assign", params: { role: "MARKETING_DIRECTOR" } }, { type: "label", params: { name: "OEM" } }],
    },
    {
      name: "Snooze followup 4h on outbound replies",
      description: "When an outbound reply is sent and no inbound comes back in 4h, ping the GM.",
      trigger: "thread.idle",
      conditions: [{ field: "lastOutboundAgeHours", op: "gte", value: 4 }, { field: "category", op: "in", value: ["SALES_LEAD", "CUSTOMER_INQUIRY"] }],
      actions: [{ type: "create_followup", params: { hours: 4 } }],
    },
  ];
  for (const w of workflows) {
    await prisma.workflow.create({
      data: {
        organizationId: org.id,
        name: w.name,
        description: w.description,
        isEnabled: true,
        trigger: w.trigger,
        conditions: J(w.conditions),
        actions: J(w.actions),
      },
    });
  }

  // ─── Synthetic outbound history for response-time analytics ────────────────
  // Add a small number of OUTBOUND replies on past threads at varied lags to make
  // the response-time metric real. We pick threads that already have a draft.
  const outboundPlan: Array<{ idx: number; lagMinutes: number }> = [
    { idx: 8, lagMinutes: 22 },     // Helen loaner — fast reply
    { idx: 15, lagMinutes: 95 },    // Bronco Sport appointment — under 2h
    { idx: 17, lagMinutes: 38 },    // Mach-E recall — fast
    { idx: 20, lagMinutes: 240 },   // window sticker — 4h
    { idx: 1, lagMinutes: 75 },     // Q3 co-op — 1h15
    { idx: 11, lagMinutes: 180 },   // Toyota council — 3h
    { idx: 6, lagMinutes: 410 },    // Ford EV cert — same day
    { idx: 19, lagMinutes: 600 },   // Tomas Rivera — 10h
    { idx: 21, lagMinutes: 28 },    // CarGurus — fast (auto)
  ];
  for (const o of outboundPlan) {
    const t = await threadById(o.idx);
    if (!t) continue;
    const replyAt = new Date(t.lastMessageAt.getTime() + o.lagMinutes * 60 * 1000);
    await prisma.email.create({
      data: {
        organizationId: org.id,
        mailboxId: mailbox.id,
        threadId: t.id,
        providerMessageId: `seed-out-${o.idx.toString().padStart(2, "0")}`,
        providerThreadId: t.providerThreadId,
        direction: "OUTBOUND",
        fromEmail: "principal@a3brands.test",
        fromName: "Jordan Reyes",
        toEmails: J([t.providerThreadId]),
        subject: `Re: ${t.subject ?? ""}`,
        snippet: "Thanks for the note — I'll have …",
        bodyText: "Thanks for the note — I'll have someone follow up shortly with details.",
        receivedAt: replyAt,
      },
    });
    await prisma.emailThread.update({
      where: { id: t.id },
      data: { lastMessageAt: replyAt, messageCount: { increment: 1 } },
    });
  }

  // ─── Activity log seed (shows the audit trail in analytics) ────────────────
  const activityKinds = ["DRAFT_APPROVED", "DRAFT_SENT", "ESCALATION_ACKED", "THREAD_ARCHIVE", "THREAD_LABEL", "WORKFLOW_TRIGGERED"];
  for (let h = 0; h < 24 * 7; h += 6) {
    const k = activityKinds[Math.floor(Math.random() * activityKinds.length)];
    await prisma.activityLog.create({
      data: {
        organizationId: org.id,
        userId: [principal.id, gm.id, marketing.id][Math.floor(Math.random() * 3)],
        kind: k,
        targetType: "thread",
        createdAt: ago(h * HOUR),
      },
    });
  }

  // ─── 7 daily briefings ──────────────────────────────────────────────────────
  const briefings = [
    {
      offset: 0,
      summary:
        "Critical morning. Maria Rodriguez (F-150, three failed transmission repairs) is invoking Texas lemon law with a 10-day clock — call her personally before noon, do not delegate. Ryan Holloway needs Q3 co-op submission by Friday; Devon is on it but you should reply directly to keep the relationship warm. Riley Chen's Explorer trade-in is your hottest sales lead — AI draft ready, just approve. Two HR/legal items from the last 48h still need your attention.",
      esc: 3, leads: 2, drafts: 4,
    },
    {
      offset: 1,
      summary:
        "Quieter day. Patricia Wallace's duplicate-charge complaint resolved with refund + apology. Ford operations sent the EV certification mandate — assign to GM today. Toyota dealer council nomination from Greg Sato is worth a yes. Walter Cho cancellation: try to save before processing.",
      esc: 2, leads: 1, drafts: 2,
    },
    {
      offset: 2,
      summary:
        "Kelly (HQ) needs Q3 fixed-ops package by Monday for the board investor pitch. Marcus Liu's Maverick allocation question — check with sales manager. CSI scorecard came in: Sales above region, Service below — pull verbatims with the Service Director.",
      esc: 1, leads: 1, drafts: 1,
    },
    {
      offset: 3,
      summary:
        "Suspected wire-fraud attempt on the 2024 King Ranch — flagged and quarantined; no banking info shared. Devon's October Halloween campaign needs your approval ($4.8K). Helen Brookings loaner request handled by Service BDC.",
      esc: 1, leads: 0, drafts: 1,
    },
    {
      offset: 4,
      summary:
        "Aisha Mohammed Saturday Bronco Sport test drive locked in. Ben Carver Mach-E recall — Service BDC reaching out. Newsletter and vendor noise filtered.",
      esc: 0, leads: 1, drafts: 0,
    },
    {
      offset: 5,
      summary:
        "Q3 facility imaging audit overdue — $5K penalty risk if not in this week. Tomas Rivera Service Advisor application looks strong; routed to HR. Light email day overall.",
      esc: 1, leads: 0, drafts: 0,
    },
    {
      offset: 6,
      summary:
        "Walter Cho ESP cancellation logged; save call recommended before processing. New TFS regional rep introduction — book the call. F&I compliance attestation due this week.",
      esc: 1, leads: 0, drafts: 0,
    },
  ];

  for (const b of briefings) {
    const d = ago(b.offset * DAY);
    d.setHours(0, 0, 0, 0);
    await prisma.dailyBriefing.create({
      data: {
        organizationId: org.id,
        userId: principal.id,
        forDate: d,
        summary: b.summary,
        topThreads: J([
          { threadId: "seed-thread-00", reason: "Lemon-law threat — F-150 (third repair)" },
          { threadId: "seed-thread-01", reason: "Ford Q3 co-op deadline Friday" },
          { threadId: "seed-thread-02", reason: "Explorer trade-in — draft ready" },
        ].slice(0, 3 + (b.offset === 0 ? 2 : 0))),
        openEscalations: b.esc,
        newLeads: b.leads,
        pendingDrafts: b.drafts,
        metrics: J({ inboxVolume: 25 + b.offset, avgResponseHours: 1.8 - b.offset * 0.1 }),
        modelUsed: "gpt-4o",
      },
    });
  }

  console.log("✓ Seeded:");
  console.log(`  ${threads.length} email threads`);
  console.log(`  ${threads.filter((t) => t.escalation).length} escalations`);
  console.log(`  ${threads.filter((t) => t.draft).length} AI drafts pending review`);
  console.log(`  ${briefings.length} daily briefings`);
  console.log(`  Sign in: principal@a3brands.test  (or gm@a3brands.test, marketing@a3brands.test)`);
}

// CLI entry point (npm run prisma:seed). Skipped when the module is imported
// programmatically by db-bootstrap.ts at runtime.
if (require.main === module) {
  const prisma = new PrismaClient();
  seedDemoDatabase(prisma)
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
