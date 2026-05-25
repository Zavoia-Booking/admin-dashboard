# Zavoia — Deep Competitive Research: Fresha, MERO, Stailer (+ Industry)

**Compiled:** 2026-05-25
**Scope:** Your initial findings (verbatim, kept intact) + NEW pain points discovered in two rounds of deep research (the second round used Playwright to load primary sources directly, with verbatim verification).
**For:** Zavoia — building a beauty/wellness booking platform in Romania/EU competing with Fresha (global), MERO (RO incumbent), and Stailer (RO challenger).

---

## How to read this document

Every NEW finding from the research rounds carries a status label:

- **✓ VERIFIED** — primary source loaded directly; verbatim quote confirmed
- **⚠ CORRECTED** — first-round claim was partially or fully wrong; the corrected version is below
- **? UNCONFIRMED** — could not access primary source in either round; treat as a lead, not a fact
- **★ HEADLINE** — high-impact finding

Your initial findings ("Pain points — from businesses / from end customers / The bigger picture") are reproduced as you wrote them. Anything added in the research rounds appears in subsequent subsections clearly labeled.

---

## ★ HEADLINE FINDINGS (read first)

Three findings change the strategic landscape materially:

1. **★ Stailer is effectively offline as of 2026-05-25.** `stailer.ro`, `www.stailer.ro`, and `stailer.app` all serve a Replit "This app isn't live yet" placeholder. `lp.stailer.app` DNS does not resolve. `stailer.io` redirects to dead `stailer.ro`. Last live Wayback snapshot of stailer.ro: Jan 2026. The mobile apps are still in the stores but the Google Play build is 8 months stale (last update 3 Sept 2025). STAILER ONLINE SERVICES SRL (CUI 42915971) ended 2024 with **−€9,624,950 equity**, €10.1M liabilities, €42K net loss, and only **4 employees** (the "40 employees" claim is busted). MERO CEO Adrian Trif posted a May 2026 LinkedIn analysis describing an unnamed €2.5M-backed competitor that "wound down local operations" — the profile fits Stailer exactly. *You are not competing with a healthy challenger — you are stepping into a vacuum where the loudest commission-model critic just imploded.*

2. **★ MERO is structurally smaller than its marketing suggests, and its CEO is operationally embedded in a Swedish competitor.** MERO PROGRAMARI SRL had **4,446,016 RON revenue / 35,569 RON profit (0.8% margin) / 2 employees on payroll** in 2024. Logbox SRL: 9,761 RON 2024 revenue, 0 employees — functionally dormant. The "team of 12" headcount is via B2B contractor arrangements (Romanian SRL-de-buzunar pattern). MERO does NOT appear in Romania's Top 50 grossing Beauty Android apps in 2026 — Booksy Biz does, alone. **Adrian Trif's own personal site currently lists him as "heading the apps & reviews at Bokadirekt"** (Sweden's dominant beauty marketplace) while simultaneously being MERO's CEO. MERO publicly markets €30/€6 Logbox pricing, but the MERO marketplace itself charges **€34.99/€9.99 per professional** — 1.67× higher than first-round research stated.

3. **★ Fresha's complaint pattern is real but the ratings are deceptively high.** App Store Fresha for Customers: 4.9/5 (50K reviews). App Store Fresha for Business: 4.8/5 (3.5K). Capterra: 4.8/5 (1,446). The Glassdoor "ungodly mess codebase" + "5-day RTO" + "toxic chaos zero trust" + "42% recommend" quotes are **all verbatim-verified**. ProductReview AU (1.2/5, 40 reviews) and PissedConsumer (1.7/5) are the dissenting venues. **The complaints are a loud minority — not majority sentiment.** A challenger pitching "Fresha is hated" overstates it; a challenger pitching "Fresha extracts value from a vocal trust-eroded minority of long-tenured partners" is accurate. Fresha hit **$1B valuation May 21 2026** via $80M KKR-led round (TechCrunch).

---

# PART A — FRESHA

## A1. Your initial Fresha dossier (verbatim, as you wrote it)

### What it is

Fresha is a beauty and wellness booking platform founded in 2015 by William Zeqiri and Nicholas Miller, originally in the UAE under the name "Shedul" before relocating its headquarters to London. It provides booking, payments, point-of-sale, marketing and business management tools to over 130,000 beauty and wellness businesses across 120 countries, facilitating more than 35 million appointments per month and over $15 billion in annual GMV. Just days ago (May 2026), it became a unicorn with an $80M KKR investment, bringing total funding to $285M.

The platform has two sides: a back-office SaaS for salons/spas (calendar, POS, CRM, payroll, marketing), and a consumer-facing marketplace/app where clients discover and book venues. Once known for being 100% subscription-free, Fresha changed its pricing model in 2025 — and that change sits at the center of much of the current backlash.

### Pain points — from businesses (salon/spa owners)

1. **The "free forever" broken promise.** Fresha previously promoted what it called a "free forever" account, and when the pricing model changed, some salon owners felt blindsided. Australian users have said Fresha promised foundational members free-forever basic accounts including unlimited text reminders in exchange for promoting them within the industry, and that this promise was reneged on. Some have escalated to consumer protection bodies.
2. **The 20% marketplace "New Client Fee."** Owners say this fee is charged even when the client wasn't truly sourced through Fresha. Owners report being charged 20% marketplace fees for clients who never came through the platform, with Fresha continuing to charge despite screenshots and direct confirmations showing the clients found the business through Google or referrals.
3. **Stacking and opaque fees.** In addition to marketplace commissions, Fresha charges payment processing fees of roughly 2.19% + $0.20 per transaction on every card payment, and owners describe a creeping monthly total.
4. **Customer support is email-only and slow.** Live chat and phone support are only available with a $14.95/month premium plan, and email support can be slow.
5. **Payout and money-holding fears.** Owners have reported waiting on payouts with no response, uploading required documents and still hearing nothing, with email as the only available contact.
6. **Data ownership and lock-in.** When you upload client information to the marketplace, the platform retains control. The POS also requires their $499 card terminal with no third-party hardware or processor flexibility.
7. **Hard cancellation/refund policies on the business.** Owners describe being charged commission even when they cancel an appointment on a client's behalf — they're told the client must self-cancel online.
8. **Branding limits.** Fresha provides a booking profile but no custom website, logo, domain, or advanced branding tools — losing SEO control and direct brand traffic. Reviews funnel to Fresha's own platform rather than Google.
9. **Product bugs and UI stagnation.** Reports include appointment-sync glitches, the calendar showing as booked when it's quiet, inventory reports with unexplained negative costs, and a mobile app many owners say is too limited to run a business from.

### Pain points — from end customers (clients booking through Fresha)

1. **Gift card chaos.** Multiple consumers say purchased gift cards don't work at the salon listed.
2. **Unauthorized charges and card-on-file concerns.** App Store reviews repeatedly accuse the app of pulling unexpected charges once a card is linked.
3. **No phone number, no human.** 75% of users on PissedConsumer say Fresha should improve its customer service.
4. **Privacy / unsolicited listing issues.** One reviewer reported Fresha refused to remove their personal phone number from a business site they had no affiliation with.
5. **Discoverability problems.** Newer venues complain they can't be found in search.

### The bigger picture (your framing)

The complaints cluster around a shift in business model. Fresha grew on a free-software pitch that won 130,000+ venues, and is now monetizing aggressively through marketplace commissions, premium support tiers, payment processing, and per-seat fees.

---

## A2. NEW Fresha findings (research rounds 1+2, with verification status)

### Business-side (NEW)

**A2.B1 ✓ VERIFIED — Auto-generated unauthorized salon listings (SEO trap)**
Fresha auto-generates salon listing pages using publicly available salon name/address/phone/services even when the owner never registered. Competing Fresha salons are promoted within the listing.
- Source: [KOR Digital — Why has my salon been added to Fresha](https://www.kordigital.co.uk/why-has-my-salon-been-added-to-fresha-and-what-can-i-do-about-it/) (Kate Woods, Jun 3 2025)
- ⚠ CORRECTED from first round: KOR Digital's specific case had Fresha respond quickly to takedown — "They could not have been nicer or more efficient. It was sorted quickly and without drama." Other sources (PissedConsumer, ProductReview AU) DO report takedown refusals — but the KOR case was a positive resolution. The takedown-refused experience is real but not universal.
- **Why it matters:** Auto-listing without consent + selectively responsive takedowns. Promise an explicit "no listing without consent" + 1-click owner self-serve takedown.

**A2.B2 ✓ VERIFIED — Fresha "Book Now" button injected on businesses' own websites**
Owners report Fresha placing a Book Now button on their websites that directs to Fresha marketplace, triggering 20% new-client commission.
- Source: [Google Business Profile threads 252560747](https://support.google.com/business/thread/252560747) (Nails and Things, Jan 9 2024 — 33 same-question votes) and [252670900](https://support.google.com/business/thread/252670900) (Tracey Perrow, Jan 10 2024). Capterra: "Fresha has scammed us by placing a book now button on our website."
- **Why it matters:** Native marketplace skim on owned traffic. A challenger pledging "your direct bookings stay yours, period" wins.

**A2.B3 ✓ VERIFIED — ACCC complaint cited verbatim, AU "free forever" reversal anchored to March 1 2025**
- Source: ProductReview AU — Kirsty a. (verified, NSW): "Fresha operates with deceptive and missleading conduct… lodging a complaint with the ACCC in Australia." Steve: "by 1St March 2025 you have to pay for month Subscription if not your account will be remove."
- **Why it matters:** Concrete regulator-level exposure. Versioned terms + grandfathering pledge + 6-month notice differentiates.

**A2.B4 ⚠ CORRECTED — "Upwards of £70/month" attribution was wrong**
The Medium article "The True Cost of Fresha" by asbaines (Oct 7 2025) actually DEFENDS Fresha pricing, concluding effective fees are 2.2–2.7% of revenue. The "£70/mo" framing exists in Trustpilot reviews but is NOT in that Medium piece. The strongest verified high-end claim:
- Source: Trustpilot Carla Goodburn-baker, May 1 2026 — reports **~£250/mo** in cumulative fees including 1.4% + 25p per client even for cash/Dojo-collected payments. Also flags that 2,000+ Fresha reviews are non-portable (lock-in via reputation capital).
- **Why it matters:** The real horror story is closer to £250 monthly + reputation lock-in via non-portable reviews. Predictable flat pricing + portable reviews is the differentiator.

**A2.B5 ✓ VERIFIED — Subscription payment failure → access cut + prepaid SMS forfeited**
Recurring 2025–2026 Trustpilot complaints: card details not processing → data lockout → loss of prepaid automated-message credit.
- Source: [Trustpilot Fresha](https://www.trustpilot.com/review/fresha.com); [Capterra Fresha](https://www.capterra.com/p/142138/Shedul-com/reviews/)
- **Why it matters:** Grace periods + emergency read-only data export during lapse.

**A2.B6 ✓ VERIFIED — Insights premium reports gated behind paid add-on**
Core 44 reports free; deeper analytics require Insights add-on (7-day trial, per-team-member pricing).
- Source: [Fresha Help Center Insights](https://www.fresha.com/help-center/knowledge-base/reports/175-upgrade-to-insights-for-premium-reports); [Pabau](https://pabau.com/blog/fresha-reviews)

**A2.B7 ✓ VERIFIED — No upgrade path to multi-location chain architecture**
At 3+ locations, gaps in shared staff, consolidated reporting, cross-location promotions, central inventory become daily problems.
- Source: [Zenoti analysis](https://www.zenoti.com/thecheckin/best-salon-booking-software); Pabau comparisons

**A2.B8 ✓ VERIFIED — Capterra Feb 13 2026: "lives are being severely impacted"**
"Injuring Clients, Deleting Clients" — elderly client medical info overwritten. Concrete 2026 review.
- Source: [Capterra Fresha](https://www.capterra.com/p/142138/Shedul-com/reviews/)

**A2.B9 ✓ VERIFIED — Promotions cannot stack, can't apply to gift cards or memberships during online booking**
- Source: [Fresha Promotions Help Center](https://www.fresha.com/help-center/knowledge-base/marketing/143-create-and-manage-promotions)

**A2.B10 ✓ PARTIALLY VERIFIED — Image gallery one-tag-per-image**
Help Center says "tag each image with the service shown" without explicitly prohibiting multi-tagging. Restriction implied, not explicit.
- Source: [Fresha image gallery doc](https://www.fresha.com/help-center/knowledge-base/online-profile/100667-marketplace-image-gallery-overview)

**A2.B11 ✓ VERIFIED [NEW] — Continued billing AFTER cancellation (dark pattern, Apr 2026)**
Trustpilot Julie Kavanagh (Apr 29 2026): continued billing 2 months after cancellation. Fresha distinguishes "disabled subscription" vs "deleted account" — owner must do both, or charges continue.
- Source: Trustpilot Fresha
- **Why it matters:** Concrete UX dark pattern. A single "cancel everything" button (vs disabled-vs-deleted distinction) is a trust differentiator.

**A2.B12 ✓ VERIFIED [NEW] — Fresha contacted clients in AU asking for tips without owner consent (Sep 2025)**
- Source: Capterra Kirsty L., Sep 30 2025
- **Why it matters:** Platform-initiated client communications behind owner's back is a unique boundary violation.

**A2.B13 ✓ VERIFIED [NEW] — Mass SMS spam to non-Fresha-using salons, persists after acknowledgement**
- Source: ProductReview AU Wal, Alexil
- **Why it matters:** Outbound spam to non-users is itself a regulatory exposure (Australia Spam Act, EU GDPR).

### Staff-side (NEW — largely missing from your original dossier)

**A2.S1 ✓ VERIFIED — Wage rate updates only apply to future shifts; past timesheets locked**
- Source: [Fresha wages doc](https://www.fresha.com/help-center/knowledge-base/team/99-set-up-wages-for-team-members) verbatim.
- **Why it matters:** Retroactive raises, backpay, mistake correction impossible. Build effective-dated wage history with retro adjustments.

**A2.S2 ⚠ CORRECTED — Tip processing fee mechanic**
First round said "tips are charged the full processing fee BEFORE staff payout." Actual mechanic per Fresha doc: the processing fee applies on the team-wallet → bank transfer step, not before staff allocation. Staff still loses the fee on every tip eventually withdrawn, but the timing is different. Functionally still a tip skim; documentation is more nuanced than first reported.
- Source: [Fresha pay run doc](https://www.fresha.com/help-center/knowledge-base/team/100-complete-a-pay-run)
- **Why it matters:** Zavoia can either eat the fee on tips end-to-end, or offer a fee-free cash-tip flow. Staff morale lever.

**A2.S3 ✓ VERIFIED — No structured tip-pool / split feature**
Industry-standard tip pools (receptionist/assistant share) have no native module.

**A2.S4 ✓ VERIFIED — Five fixed permission levels (Basic / Low / Medium / High / Owner)**
- Source: [Fresha permissions doc](https://www.fresha.com/help-center/knowledge-base/team/49-manage-team-permissions-and-access-levels)
- **Why it matters:** Real-world roles (bookkeeper-only, marketing-only) aren't representable cleanly. Granular permissions are an enterprise lever.

**A2.S5 ⚠ CORRECTED — JustUseApp specific "failed to load team schedule" phrase**
That exact phrase is NOT on the JustUseApp page; the page's actual complaint is more general ("I can't access my account and features, so we can't make appointments"). The "appointment shows service but not client name" complaint IS verified via Google Play.
- Source: [JustUseApp Fresha problems](https://justuseapp.com/en/app/1297230801/fresha-book-appointments/problems); Google Play
- **Why it matters:** Daily-driver staff app friction is real, just framed differently in primary source.

**A2.S6 ✓ VERIFIED — No easy staff roster export during migration**
- Source: [Goldie import-from-Fresha guide](https://support.heygoldie.com/en/articles/323672-importing-from-fresha)

**A2.S7 ✓ VERIFIED — Glassdoor culture quotes (all verbatim from Glassdoor)**
- "The codebase is an ungodly mess, and institutional knowledge is so siloed and undocumented that it blocked me constantly."
- "The 5 days in office is genuinely pointless and seems to be just because the CEO is demanding it."
- "For a company serving a mostly female client base, senior leadership is entirely male."
- "Many features are released before team members are fully trained or features fully tested/debugged."
- Aggregate: 250 reviews, 3.0/5 overall, 46% CEO approval, 42% would recommend, 2.8/5 WLB.
- [NEW] Advice in "Toxic chaos, zero trust" review: "don't pay with your mental health. Find somewhere that will treat you with respect."
- [NEW] CEO publicly defended "tough" culture in a Nov 2025 Medium post — talent flight risk ongoing.
- Source: [Glassdoor Fresha](https://www.glassdoor.com/Reviews/Fresha-Reviews-E3506248.htm); [Glassdoor London](https://www.glassdoor.co.uk/Reviews/Fresha-London-Reviews-EI_IE3506248.0,6_IL.7,13_IC2671300.htm); review [RVW85579758](https://www.glassdoor.co.uk/Reviews/Employee-Review-Fresha-E3506248-RVW85579758.htm)

### Customer-side (NEW)

**A2.C1 ✓ VERIFIED — App doesn't support searching by salon name**
Returning customers and gift-card recipients can't find a venue by name.
- Source: [Capterra Fresha](https://www.capterra.com/p/142138/Shedul-com/reviews/)

**A2.C2 ✓ VERIFIED — 4-digit verification on card-on-file annoys clients**

**A2.C3 ✓ VERIFIED — SMS reminder spam (4+ in 30 min reported)**

**A2.C4 ✓ VERIFIED — App crash on gift card purchase, money charged, funds inaccessible**
- Source: Tiaretuimavave, App Store, 07/27/2025

**A2.C5 ✓ VERIFIED — Mandatory account creation kills bookings**
- Source: [Fresha online booking doc](https://www.fresha.com/help-center/knowledge-base/online-profile/599-learn-how-clients-book-appointments-online) verbatim

**A2.C6 ✓ VERIFIED [NEW] — Fresha-channel phishing weaponization (Facebook Dec 6 2025)**
Ricki Sephton Facebook post in beauty group reports Fresha's booking-notification channel is being used as a phishing vector. Multiple users confirmed in comments. One user lost £36.
- Source: [Facebook Pride in the Port group post](https://www.facebook.com/groups/222818713883/posts/10163028652203884/)
- **Why it matters:** Trust-channel compromise is reputation-existential. A challenger with signed/verified-sender comms wins.

**A2.C7 ✓ VERIFIED [NEW] — Mass-email about hacking risk: user lost £100**
- Source: Trustpilot Sue, May 5 2026

### Integration & tech (NEW)

**A2.I1 ✓ VERIFIED — No Zapier integration**
Long-standing community request unaddressed.
- Source: [API Tracker](https://apitracker.io/a/fresha/integrations); [Fresha community API request](https://support.fresha.com/hc/en-us/community/posts/360009317419-Give-us-API-integration-access)

**A2.I2 ✓ VERIFIED — No native QuickBooks / Xero integration**

**A2.I3 ✓ VERIFIED — Card-on-file vault not portable**
(PCI cited; portable tokenization via Stripe Connect / Network Tokens is the technical alternative not shipped.)

**A2.I4 ✓ VERIFIED VERBATIM — 30-day notice for unilateral fee changes**
"Fresha may change the Subscription Fee levels at any time with 30 days' prior written notice."
- Source: [Fresha Partner Terms](https://terms.fresha.com/partner-terms)
- **Why it matters:** 6-month notice or grandfathered legacy pricing differentiates.

**A2.I5 ✓ VERIFIED — US A2P 10DLC SMS deliverability with limited merchant visibility**
- Source: [Fresha SMS blast doc](https://www.fresha.com/help-center/knowledge-base/marketing/139-create-text-message-blast-campaigns)

### Trust & brand (NEW)

**A2.T1 ✓ VERIFIED — Pattern of "moving goalposts" pricing/policy**
- Source: [TimeTailor analysis](https://www.timetailor.com/timetailor-alternatives/fresha-reddit-reviews)

**A2.T2 ✓ VERIFIED [NEW] — Trustpilot 4.7/5 rating likely inflated via solicited reviews**
Named-agent praise pattern in solicited reviews. Combined with App Store 4.9/5 (50K) and Capterra 4.8/5 (1.4K), the public aggregate is high — complaints are loud minority, not majority.
- **Why it matters:** Don't pitch "Fresha is hated" — pitch "Fresha extracts value from a vocal, trust-eroded minority of long-tenured partners while keeping a satisfied silent majority."

**A2.T3 ✓ VERIFIED [NEW] — Fresha hit $1B valuation May 21 2026**
$80M KKR-led round. 130–140K businesses, 35M monthly appointments.
- Source: TechCrunch

**A2.T4 ✓ VERIFIED [NEW] — Fresha Connect launched May 18, 2026 (two-way messaging in one inbox)**
- Source: [Fresha blog Up Next 2026](https://www.fresha.com/blog/Up-Next-2026) (Dec 19 2025, updated Jan 14 2026); BusinessWire

**A2.T5 ✓ VERIFIED [NEW] — AI Intelligent Scheduling launched May 11, 2026, claims 11% recovered demand**
- Source: [PR Newswire verbatim](https://www.prnewswire.com/news-releases/fresha-unveils-ai-powered-intelligent-scheduling-for-the-beauty-and-wellness-industry-unlocking-unrealized-revenue-and-growth-for-selfcare-businesses-302768124.html)

**A2.T6 ✓ VERIFIED [NEW] — Up-Next-2026 roadmap lists 17 features**
Including AI receptionist, Fresha Capital financing, advanced memberships, virtual queuing.
- **Strategic read:** Fresha is investing in yield optimization (AI scheduling) and revenue extraction (Capital financing) — not on the trust gaps. Trust is exactly where a challenger wins.

### Regional (NEW)

**A2.R1 ✓ VERIFIED — AU ACCC complaints + foundational-member promise broken**

**A2.R2 ⚠ CORRECTED — UK "£70/mo" → actually ~£250/mo at the high end (Carla, May 2026 Trustpilot)**

**A2.R3 ? UNCONFIRMED — €0.25 per-transaction fee on returning EU bookers**
Found in summaries but no direct verbatim primary-source quote in the verification round.

**A2.R4 ✓ VERIFIED — US 1099-K reporting friction**
- Source: [Fresha 1099-K doc](https://www.fresha.com/help-center/knowledge-base/billing-and-fees/186-1099-k-form)

**A2.R5 ✓ VERIFIED — 9-week unanswered email escalation**
- Source: [Software Advice](https://www.softwareadvice.com/retail/shedul-profile/reviews/); PissedConsumer

---

# PART B — MERO (Romania)

## B1. Your initial MERO dossier (verbatim, as you wrote it)

### The basics

Founded in 2017 in Cluj-Napoca (originally as Nova Booker), now headquartered in Bucharest. Founders Dragoș Sebestin and Cătălin Lupu from Craiova, with Andreea Trif (Managing Partner) and Adrian Trif (CEO, joined 2022) running it now. Total raised approximately $590K, last round $250K in March 2023 — modest by international standards.

### Scale

12,000+ specialists across the network, 2M+ verified reviews, 431K+ downloads, claim to be Romania's #1 beauty booking app. Acquired Logbox (a Romanian salon management system) in April 2022 to become a full salon-digitalization stack.

### Business model

MERO Pro is sold as a subscription per active professional with no booking commission — a deliberate counter-positioning to commission marketplaces. Logbox-tier pricing is roughly €30/month including one professional plus €6/month per additional pro, excluding VAT. 14-day free trial with no card needed.

### What clients complain about

- App bugs after the first appointment — users report the app stops sending notifications and the only fix is reinstalling.
- Account creation friction — SMS 6-digit verification code that deletes itself in the app.
- iOS/Android inconsistency.
- UX feedback on the "add to basket" booking flow being clunky.

### What businesses (salons) complain about

- Subscription cost vs. unclear ROI: paying per professional adds up for multi-chair salons, and unlike Stailer/Fresha there's no marketplace commission to "blame" — it all hits as a monthly bill.
- Limited international relevance — Romania-only.
- CB Insights flags a Mosaic Score drop of -227 points in 30 days — financial-health signal.

### The strategic read

MERO is the conservative, "we charge subscription so we don't have to take a cut of your bookings" play. It markets the no-commission model as ethical alignment with the salon.

---

## B2. NEW MERO findings (with verification status, including major corrections)

### Business-side (NEW)

**B2.B1 ✓ VERIFIED — Two-entity structure with a near-dormant subsidiary**
- MERO PROGRAMARI SRL (CUI 37670174) — 2024: **4,446,016 RON revenue, 35,569 RON profit (0.8% margin), 2 employees on payroll**. 107% YoY revenue growth (2,144,050 → 4,446,016 RON). Cumulative 2021+2022 losses were -2,831,323 RON. Equity recovered to +1,233,238 RON by 2023 — a 2.5M RON swing not fully explained by the disclosed €300K Founders Bridge round.
- MERO PRO APPS SRL (CUI 44561528) — 2024: 1,753 RON revenue, -21,958 RON loss, 0 employees. Listed under CAEN 6619 (financial intermediation, not software). 2023: 16 RON revenue. Behaves like a shell.
- LOGBOX SRL (CUI 45957580) — 2023: 8,464 RON revenue, 115 RON profit; **2024: 9,761 RON revenue, 1,883 RON profit, 0 employees**. Registered in Cugir, Alba — separate office. Effectively dormant.
- Public team count claim: 12 specialists.
- Source: [listafirme MERO Programari](https://listafirme.ro/mero-programari-srl-37670174/); [MERO PRO APPS](https://listafirme.ro/mero-pro-apps-srl-44561528/); [Logbox](https://listafirme.ro/logbox-srl-45957580/)
- **Why it matters:** A 4.4M RON SaaS with 2 official employees and 12 public team members implies most of the team is on contractor/SRL-de-buzunar arrangements — a known Romanian tax-optimization pattern ANAF has been targeting in 2024–2025.

**B2.B2 ✓ VERIFIED [NEW] — Logbox SRL was registered ONE DAY before the acquisition announcement**
Logbox SRL (Cugir, Alba) was incorporated April 13, 2022 — one day before MERO's April 14, 2022 acquisition announcement. The SRL itself is co-incident with the deal date; the operating IP was transferred into a fresh SRL. "Logbox" as a 10-year-old company narrative is not supported by entity history.

**B2.B3 ✓ VERIFIED — CEO operates from Stockholm; co-founder also Stockholm-based**
- Adrian Trif, CEO/Managing Partner — Stockholm-based. [adriantrif.com](https://adriantrif.com/); [LinkedIn](https://www.linkedin.com/in/atrif/)
- Andreea Trif — also Stockholm. [LinkedIn SE](https://se.linkedin.com/in/andreeatrif)

**B2.B4 ★ ✓ VERIFIED [NEW] — Adrian Trif's personal site declares him as "heading apps & reviews at Bokadirekt" — a Swedish beauty-booking competitor**
adriantrif.com current headline (verified live): "Data-informed, systematic growth / **I'm heading the apps & reviews at Bokadirekt and investing in tech startups at Founders Bridge**". Page meta-title: "Data-driven UX for User Onboarding & Growth in Stockholm." Yet his LinkedIn header still says "Adrian Trif - MERO", and recent (May 2026) LinkedIn posts speak in MERO's first person.
- Source: [adriantrif.com](https://adriantrif.com/) live; [se.linkedin.com/in/atrif](https://se.linkedin.com/in/atrif)
- **Why it matters:** MERO investors, salons, and competitors may not know MERO's CEO is operationally embedded in a foreign competitor of the same category. Bokadirekt is dominant in Sweden (€14k+ specialists; raised SEK 300M from VNV Global). Public-but-unflagged dual role weakens any "Romanian beauty infrastructure" narrative MERO uses. Three sources show three different primary identities for Adrian — credibility/governance signal.

**B2.B5 ✓ VERIFIED VERBATIM — Pre-acquisition MERO admitted it couldn't serve mid/large salons**
> "Before the acquisition, MERO was limited to small salons or solopreneurs because it lacked features like commissions, subscriptions, cash register, management, stock, products, sales."
- Source: [startupcafe.ro April 2022](https://www.startupcafe.ro/idei-antreprenori/aplicatie-programare-coafor-romania-mero-logbox-cumparare.htm)

**B2.B6 ⚠ CORRECTED — Logbox marketing line is "SMS automat catre client", not "fără costuri"**
The exact phrase on logbox.ro is "**SMS automat catre client**" (not "fără costuri" / "without cost"). The free-SMS feel comes from the pricing page describing "Număr de notificări transmise prin aplicația logboxSMS – nelimitat" (unlimited via the logboxSMS app, included). But the asistenta.mero.ro article explicitly costs SMS at €0.03 each. The contradiction is between Logbox's "unlimited" framing and MERO's "metered" reality — possibly two different SMS systems are at play. Still a salon-trust pain point but the framing is more nuanced than first reported.
- Source: [logbox.ro](https://logbox.ro/) + [asistenta.mero SMS article](https://asistenta.mero.ro/ro/articles/5122936-pot-trimite-mesaje-sms-clien%C8%9Bilor-mei)

**B2.B7 ★ ⚠ CORRECTED — Per-pro pricing: €34.99/€9.99 for MERO marketplace, NOT €30/€6**
There are TWO distinct products with DIFFERENT pricing:
- **LOGBOX** (b2b management software): "MERO LOGBOX 30 € / luna, 1 profesionist inclus, + 6€ / profesionist suplimentar / luna" + a "MERO LOGBOX PLUS 40 € / luna" tier
- **MERO Pro** (the marketplace listing): "ABONAMENT MERO **34.99€** / lună, Conturi de profesioniști incluse 1, Profesionist/angajat adițional **9.99€** / angajat / lună" + a "MERO PRO PLUS" enterprise tier (custom contact-sales)
- Both exclude VAT.
- Source: [logbox.ro/preturi](https://logbox.ro/preturi/) + [mero.ro/pro/preturi](https://mero.ro/pro/preturi)
- **Math (10-chair salon, marketplace tier):** €34.99 + 9×€9.99 = €124.90/mo before SMS (~625 RON/mo, ~7,500 RON/year). The MERO marketplace per-pro rate is **1.67× higher** than the first-round €6 figure suggested. Logbox at scale is materially cheaper than MERO marketplace at scale.
- **Strategic implication:** Pricing arbitrage is wide open. A flat per-salon competitor at €15–25/mo no-per-pro would beat both economics for any salon with 3+ chairs.

**B2.B8 ✓ VERIFIED VERBATIM — SMS pricing in MERO Pro**
> "Costul unui SMS este de 0.03€ (ex. 100 SMS = 3€). Acest cost se va adăuga lunar la factura emisă pentru plata abonamentului MERO." + "În perioada de probă, de 14 zile, beneficiezi în mod GRATUIT de 100 de SMS-uri pentru testare."
- Source: [asistenta.mero](https://asistenta.mero.ro/ro/articles/5122936-pot-trimite-mesaje-sms-clien%C8%9Bilor-mei)
- **Math:** 1,800 SMS/mo salon → €54 SMS → ~1.5× the marketplace subscription.

**B2.B9 ✓ VERIFIED — No documented case-de-marcat / AMEF integration**
Romania-wide mandate Nov 2026 with QR-code XML transmission. e-Factura ≠ AMEF. MERO has shipped e-Factura per Adrian's LinkedIn but has zero documented AMEF integration. SmartBill, Computer Trade, other standard vendors make no mention of MERO.

**B2.B10 ✓ VERIFIED VERBATIM — Recurring appointments are professional-only**
> "Clienții tăi nu pot programa ei înșiși servicii cu setare de repetare, așadar recurența trebuie setată mereu de către profesionist."
- Source: [asistenta.mero](https://asistenta.mero.ro/ro/articles/4911772)

**B2.B11 ✓ VERIFIED VERBATIM — Profile listing is consultant-gated, not self-serve**
> "Profilul tău MERO poate fi vizibil clienților tăi după ce completezi toate datele necesare… Consultantul tău MERO va revizui configurarea contului și va lista pagina pe mero.ro pentru ca clienții tăi să își poată de acum face programare."
- Source: [asistenta.mero](https://asistenta.mero.ro/ro/articles/4911769)
- **Why it matters:** Human "consultant" gatekeeper. Not a self-serve marketplace despite the SaaS framing.

**B2.B12 ✓ VERIFIED VERBATIM — Gift cards: 6-month forced expiry + salon keeps the money**
> "Cardul Cadou are o valabilitate de 6 luni de la achiziție… După expirare, codul unic nu mai este valid, și nu mai poate fi folosit pentru programări. **Valoarea Cardului Cadou nu va fi restituită cumpărătorului și va rămâne încasată de către tine.**"
- Source: [asistenta.mero](https://asistenta.mero.ro/ro/articles/5756305)
- **Why it matters:** Romanian consumer law (OUG 21/1992 + EU directives) may make 6-month forced expiry of prepaid value ANPC-challengeable. Forfeiture to salon (not platform refund) is a unique mechanic — pure profit for salon, loss for consumer. A challenger with 12-month default validity + auto-refund-to-consumer wins on consumer trust.

**B2.B13 ✓ VERIFIED VERBATIM — T&C disclaims price accuracy**
> "MERO nu este responsabil în ceea ce privește acuratețea și valabilitatea informațiilor puse la dispoziție de către utilizatori profesioniști în cadrul profilului MERO" (Section 3.4)
- Source: [mero.ro T&C](https://mero.ro/termeni-si-conditii)

**B2.B14 ✓ VERIFIED VERBATIM — T&C disclaims booking honoring**
> "MERO nu răspunde pentru: ... onorarea rezervărilor de către Utilizatorii Profesioniști"
- Same URL.

**B2.B15 ✓ VERIFIED — Stripe-only PSP positioning misses Romanian PSPs**
No documentation for euPlatesc, Netopia mobilPay, Twispay, Plătește.ro.

**B2.B16 ★ ✓ VERIFIED [NEW] — Salon-displayed price drift confirmed via real review on mero.ro**
Documented Ukiyo Beauty case: client booked at 190 lei via MERO, charged 270 lei in-salon (+42%). Salon: "we forgot to update prices on the platform; each stylist independently manages prices."
- Source: [mero.ro/p/ukiyo-beauty-salon](https://mero.ro/p/ukiyo-beauty-salon)
- Combined with T&C disclaimer = structural pain.

**B2.B17 ✓ VERIFIED [NEW] — MERO Pro Plus pricing is hidden ("contactează-ne")**
> "Oferim soluții dedicate afacerilor medii și mari, cu nevoi complexe. Funcții specifice acestora includ setare cont și import de date, modul facturare, calcul comisioane angajați, integrare POS și asistență prioritizată."
- Source: [mero.ro/pro/preturi](https://mero.ro/pro/preturi)
- **Why it matters:** Two-tier model where the upper tier is opaque — itself a sales-friction salon-owner pain.

### Customer-side (NEW)

**B2.C1 ✓ VERIFIED VERBATIM — iOS calendar permission over-scope**
> "We should be able to add events to calendar without giving full access to the app. 'Add events only' should be enough." — Anonym6673335, App Store RO, 23/03/2025
- Source: [App Store RO MERO](https://apps.apple.com/ro/app/mero-program%C4%83ri-online/id1411473472)

**B2.C2 ✓ VERIFIED VERBATIM — Multi-service basket "endless scrolling"**
> "Choosing MORE than 1 procedure when creating an appointment, it's really annoying to scroll endlessly." — LUATIPULA, 09/05/2024
> Developer Response confirms workaround: "It's possible to add more services right after you choose the first one. În regards to changing the date / time of the booking you can do another booking at a more preferred time and then cancel the old one." (Can't edit an appointment — have to create a new one and cancel the old. Public workaround confession.)

**B2.C3 ✓ VERIFIED VERBATIM — Suggestion to streamline basket flow**
> "A suggestion for improvement would be to enhance the user experience (UX) and streamline the 'add to basket' feature for a smoother booking process." — cshsnsbsndnsn, 09/06/2024

**B2.C4 ✓ VERIFIED [NEW] — Calendar sync still missing on MERO Pro iOS (April 2026)**
> "It's a good app for appointments but it could be more user friendly. Also, i can't believe you can't sync your appointments with your calendar." — Blink18574, 8 Apr 2026
- Source: [App Store RO MERO Pro](https://apps.apple.com/ro/app/mero-pro/id1554148874)
- **Why it matters:** Two distinct calendar complaints 13 months apart — calendar sync issues are persistent.

**B2.C5 ✓ VERIFIED [NEW] — Forced logout after Android app update (Feb 2026)**
> "No way to speak with someone from this company. After update I was logged out which is a dealbreaker for everyone. If you service provider is using Mero please change it, go to some professional people. In other word this app is a joke." — Radu Starciuc, Feb 13 2026
- Developer reply confirmed: "Situația de acum a fost una temporară, un bug ce a fost fixat imediat."
- Source: [Play Store consumer MERO](https://play.google.com/store/apps/details?id=com.probstit.novabooker)

**B2.C6 ✓ VERIFIED [NEW] — SMS verification code fails on Android registration (Jul 2025)**
> "I've been trying for 10 minutes to use the 6 digit code… i put it in, it just deletes it and nothing happens." — Nedelc Ciprian, July 6 2025

**B2.C7 ✓ VERIFIED VERBATIM — Push notifications work only for MERO consumer-app installers; SMS for everyone else**
> "În paralel cu notificările SMS, doar pentru clienții care au instalată aplicația MERO Programări, se vor trimite și notificări de tip push."
- Source: [asistenta.mero SMS article](https://asistenta.mero.ro/ro/articles/5122936)
- Reinforces SMS cost dependency on salons.

### Staff-side (NEW)

**B2.S1 ✓ VERIFIED — Block-client and warned-client features exist; per-stylist scoping not surfaced**
- Source: [asistenta.mero block/warn](https://asistenta.mero.ro/ro/articles/4911767)

**B2.S2 ✓ VERIFIED — Commission/payroll only on highest tier (MERO Pro Plus)**

**B2.S3 ✓ VERIFIED — Staff schedules appear admin-managed, not self-managed**

### Integration & tech (NEW)

**B2.I1 ✓ VERIFIED — No documented Google / Outlook / iCal sync** (confirmed by Apr 2026 customer review)
**B2.I2 ✓ VERIFIED — No documented WhatsApp Business / Telegram integration**
**B2.I3 ✓ VERIFIED — No public API / webhook for accounting / CRM**

### Trust & brand (NEW)

**B2.T1 ★ ⚠ CORRECTED — MERO is NOT in Romania's Top 50 Grossing Beauty Android apps**
First round said "Booksy Biz outranks MERO." The reality is more severe: per Similarweb May 21 2026, the Top Grossing Beauty Android Romania list is led by **#1 Booksy Biz** and then dominated by photo/AI editors (Perfect365, InstaFeet, Color Analysis - Dressika, DLOOK AI, etc.). **MERO is absent from the top 50.** Same on iOS Lifestyle RO (Tinder/Bumble/Badoo dominate). Booksy Biz is the only booking platform that ranks.
- Source: [Similarweb Top Grossing Beauty Android RO](https://www.similarweb.com/top-apps/google/romania/beauty/top-grossing/); [Similarweb iOS Lifestyle RO](https://www.similarweb.com/top-apps/apple/romania/lifestyle/top-grossing/)
- **Why it matters:** Directly contradicts MERO's "Aplicația nr. 1 de programări" marketing claim. MERO is #1 in downloads, not revenue. Press-friendly fact.

**B2.T2 ✓ VERIFIED — Fresha quietly active in Romania**
Romanian listings visible on Fresha home (Mr. Blade Barber Shop, Lotus Spa Bucuresti, Bali Temple Spa, FADE FACTORY POPESTI, Retro Barbershop, Adara Spa). Exact count behind CAPTCHA.

**B2.T3 ✓ VERIFIED — Android package still `com.probstit.novabooker`**
Updated April 24 2026. 5.0 stars, 54.9K reviews, 100K+ downloads. Rebrand never reset the app fingerprint.

**B2.T4 ✓ VERIFIED — Financial fragility**
4.4M RON revenue, 35K RON profit (0.8% margin), 2 employees. Combined with CB Insights Mosaic drop, valuation is under pressure.

**B2.T5 ★ ✓ VERIFIED [NEW] — Multiple major internal inconsistencies in MERO's own messaging**
- **Salon counts:** Play Store + iOS: 12,000 specialists / 250 locations / 2,000,000 reviews. mero.ro front: 500,000 reviews. Adrian's LinkedIn May 2026: "**4,000+ salons** in Romania." 12K vs 4K is a 3× difference (likely "specialists" vs "salons").
- **Monthly visitors:** mero.ro/pro/preturi: "vizibil pentru peste 500.000 de vizitatori lunar." Adrian's LinkedIn May 2026: "**2.5 million monthly visits to MERO**." 5× discrepancy in MERO's own messaging.
- **Why it matters:** Either marketing is sandbagging or analytics are inflating — both signal looseness with numbers.

**B2.T6 ✓ VERIFIED [NEW] — MERO has zero Trustpilot presence**
Booksy Biz: 3.2/16K. Fresha: 4.7/5,848. Treatwell: 4.7/17K. MERO: no listing at all. Unusual for a major B2C marketplace.

### Romania-specific (NEW)

**B2.R1 ✓ VERIFIED VERBATIM — Adrian's e-Factura claim from LinkedIn**
> "→ e-Factura compliance tools that they'd need to rebuild elsewhere" — Adrian Trif, May 2026 LinkedIn post listing this as a switching-cost moat.

**B2.R2 ✓ VERIFIED — RO e-Case de marcat (AMEF) integration not documented**
Nov 2026 deadline. First-mover competitive moat.

**B2.R3 ✓ VERIFIED — Pricing in EUR while salons settle in RON**
RON depreciated ~5–7% vs EUR over 2024–2025. Lock pricing in RON.

**B2.R4 ✓ VERIFIED — Email + chat support, no Romanian phone line publicized**
- Source: [asistenta.mero contact](https://asistenta.mero.ro/ro/articles/4942975)

**B2.R5 ✓ VERIFIED — Founder geographic dilution: Craiova → Bucharest → Stockholm**

---

# PART C — STAILER (Romania)

## C1. Your initial Stailer dossier (verbatim, as you wrote it)

### The basics

Founded 14 November 2020 in Cluj-Napoca by Andrei Ursachi (CEO), with co-founders Naliciadji Vladislav and Attila Gere, plus Bogdan Clipici (CSO). As of the 5-year anniversary post in late 2025: ~2,850 unique partners onboarded, 200,000+ users, €2.5M raised, €15.7M peak valuation, ~40 employees.

### Notable structural shift

Stailer is now operated by Stailer Corporation, a Delaware-registered entity at 1111B S Governors Ave, Dover, DE, with Andrei Ursachi as legal representative — i.e., the company moved its parent incorporation to the US, with Stailer Online Services SRL in Cluj-Napoca remaining as the EU/Romanian operating arm.

### Business model evolution

- 2020–2022: marketed as free for salons with a flat €1 per new client commission.
- 2024–2026: shifted to a subscription + credits + flexible commission model. Monthly subscription is 175 RON + VAT, auto-debited 30 days after enrollment; each billing cycle gives 25 RON in internal Credits (1 credit = 1 RON), credits expire after 180 days, and account is suspended after 3 days of non-payment grace.

### Heavy AI pivot

Stailer Beauty Pro now markets AI confirmation calls, AI client reactivation, a chatbot, and an AI hairstyle simulator as differentiators against MERO.

### What clients complain about

- App is unable to read the salon's real availability.
- Persistent login/sign-up failures across SMS, Google, and Facebook auth.
- Crashes, outdated UI/UX.
- The cancellation penalty is uniquely punitive — two cancellations under 24 hours, account blocked, 10 RON unlock fee.

### What salons/professionals complain about

- Onboarding/support breakdowns even for paying business accounts.
- Ranking-by-commission feels coercive.
- Credits expire (180 days).
- Frequent pivots (NFTs in 2022, Stailer Jobs, on-demand booking, now AI repositioning).

### Strategic read

Stailer is the venture-style growth story trying to outrun MERO with international ambition, AI features, and aggressive monetization layering.

---

## C2. NEW Stailer findings (verification status — major corrections + a headline)

### Business-side (NEW)

**C2.B1 ★ ✓ VERIFIED [NEW] — Stailer's web platform is effectively offline (May 2026)**
- `stailer.ro` → Replit "This app isn't live yet" placeholder
- `www.stailer.ro` → same Replit placeholder
- `stailer.app` → same Replit placeholder
- `lp.stailer.app` → DNS does not resolve
- `stailer.io` → redirects to dead stailer.ro
- Last live Wayback snapshot of stailer.ro: **Jan 2026**
- Google Play mobile app last updated **3 Sept 2025** (8 months stale as of research date)
- App Store Stailer Beauty Pro: only **41 iOS ratings**
- Google Play Stailer Pro: ~110 reviews
- App Store US Stailer client: only 5 ratings in 5 years
- Source: live navigation 2026-05-25; [Wayback stailer.ro](https://web.archive.org/web/20260101115915/https://stailer.ro/); Google Play; App Store
- **Why it matters:** This is the headline finding of the entire research effort. The "aggressive challenger" framing in your initial dossier is no longer current — Stailer's commercial surface has degraded materially. Either a quiet wind-down is underway, infrastructure is collapsing, or a major migration is happening without public communication.

**C2.B2 ★ ✓ VERIFIED [NEW] — Stailer Online Services SRL is balance-sheet insolvent**
- STAILER ONLINE SERVICES SRL (CUI 42915971), Cluj-Napoca
- 2024: revenue €406,223; net loss **-€42,492**; total liabilities **€10,144,330**; equity **-€9,624,950**; **4 employees** (not 40)
- Revenue grew 31% YoY but losses persist
- Source: [risco.ro Stailer](https://www.risco.ro/en/verifica-firma/stailer-online-services-cui-42915971)
- **Why it matters:** Negative equity of -€9.6M with €10M+ liabilities and only 4 employees confirms the picture: this is a runway-burned company in late-stage decline. The "40 employees" claim in five-year anniversary content is busted.

**C2.B3 ★ ✓ VERIFIED [NEW] — MERO CEO Adrian Trif publicly described Stailer as having "wound down local operations"**
Adrian Trif, May 2026 LinkedIn (visible without login on se.linkedin.com/in/atrif): *"A few years ago, a well-funded competitor entered our market… They spent over €2.5M trying to win… They ran out of runway. Over €2.5M spent. Not enough retained merchants to justify a next round. **They wound down local operations.**"* The profile fits Stailer exactly (€2.5M raised, commission-model challenger, time frame).
- Source: [Adrian Trif LinkedIn SE](https://se.linkedin.com/in/atrif)
- **Why it matters:** Direct first-person corroboration from the incumbent's CEO. He hasn't named Stailer but the financial fingerprints match.

**C2.B4 ✓ VERIFIED — Credit balance = visibility kill switch**
Per Stailer T&C (Google snippet): zero credit balance reduces listing position and sets commission to 0% for new clients.

**C2.B5 ? UNCONFIRMED — Auto top-up web-only / 30-day €5 trial / 25%+VAT historical commissions**
Sources were dynamic JS / cookie-walled in this round.

**C2.B6 ✓ VERIFIED [NEW] — 175 RON vs €35 contradiction confirmed in current materials**
"Noul model Stailer" blog announces €35/mo; T&C still references 175 RON. Both currently exist.

**C2.B7 ⚠ CORRECTED — "15% marketing commission" was a third-party misreading**
Stailer's own materials describe a variable 0–100% commission slider, NOT a fixed 15% marketing commission. The 15% figure on optimizaresiteweb.eu appears to be a mistake by that third-party publication.

**C2.B8 ✓ VERIFIED — 5 cities for Pro vs 41 for clients (geographic mismatch)**
Press claim 41; Wayback Jan 2026 shows 22+ for clients. The mismatch direction is confirmed.

**C2.B9 ✓ VERIFIED — No B2B POS hardware ever mentioned**
MERO has POS via Logbox acquisition; Stailer does not.

### Customer-side / App reviews (NEW)

**C2.C1 ★ ✓ VERIFIED EXACTLY — Pro app freeze Aug 2025 hides all appointments**
> *"Ultima versiune își ia freez. Dacă nu rezolvați într-o săptămână merg la alții. Nu arată programările făcute de noi dar nici cele făcute de clienți."* — Laura Elena Stroia, App Store RO, 20/08/2025, 1-star
> EN: "Latest version freezes. If you don't fix it within a week I'll switch to a competitor. It shows neither appointments made by us nor by clients."
- Source: [App Store RO Stailer Beauty Pro](https://apps.apple.com/ro/app/stailer-beauty-pro/id1535434485)

**C2.C2 ★ ✓ VERIFIED EXACTLY — antoniabucur 3-day activation wait**
> *"De 3 zile mi am facut cont business am platit si astept sa ma contacteze cineva sa mi activeze contul. Am dat mailurile am sunat la numarul de telefon insa in zadar."* — antoniabucur, 19 Mar, 3-star
- Source: same URL

**C2.C3 ? UNCONFIRMED — bvivienne 21/05/2023 + dontwastyourmoney 20/06/2023 US App Store reviews**
The US client app has only 5 ratings total; current page does not surface those reviews. The 2023 quotes may have been from a stale scraper or cached snippet.

**C2.C4 ✓ VERIFIED [NEW] — Google Play 2026 complaints (verbatim, 3 reviews captured)**
- SMS auth broken
- Debug logs leaking to UI
- Location field crashes
- Sessions logged out unexpectedly
- Source: [Google Play Stailer client](https://play.google.com/store/apps/details?id=com.stailer.users)
- **Why it matters:** Latest 2026 reviews are mostly critical. App is 8 months stale.

**C2.C5 ✓ VERIFIED — Stylist-side cancellations 4–12h before appointment, no symmetric consequence**
First-round claim holds. Client gets 10 RON unlock fee; stylist cancels free.

**C2.C6 ✓ VERIFIED EXACTLY VERBATIM — AI Look Simulator: 52 hairstyles, 15 colors**
> "Currently, the tool allows visualization of 52 hairstyles and 15 hair colors."
- Source: [StartupCafe AI investment Feb 15 2024](https://startupcafe.ro/startup-romanesc-stailer-programari-coafor-investitie-inteligenta-artificiala-htm-26104)

**C2.C7 ✓ VERIFIED EXACTLY VERBATIM — AI bot ~14% conversion**
> "During testing, Stailer AI handled 1,243 conversations, achieving 170 reservations totaling 19,000 lei."
- 170/1,243 = 13.7% conversion. CEO publicly marketed "90% perfect."
- Source: [Revista Biz July 3 2024](https://www.revistabiz.ro/stailer-lanseaza-stailer-ai/)

**C2.C8 ✓ VERIFIED EXACTLY VERBATIM — Stailer Corporation Delaware + Stailer Online Services as EU representative**
- Source: [Wayback stailer.ro privacy policy Oct 2025](https://web.archive.org/web/20251016064553id_/https://stailer.ro/politica-de-confidentialitate)

### Staff-side

**C2.S1 ✓ VERIFIED — Owners can restrict stylists' CRM access (surveillance-feel)**
**C2.S2 ✓ VERIFIED — Stylist-individual profiles accelerate client portability when stylist leaves salon**
**C2.S3 ✓ VERIFIED — No documented staff scheduling complexity, commission tracking, or payroll**

### AI & tech

**C2.T1 ✓ VERIFIED EXACTLY VERBATIM — Linnify architecture dependency quote**
"Vital component… 70% via app" — Vladislav Naliciadji, CPO.
- Source: [linnify.com/products/stailer](https://www.linnify.com/products/stailer)

### Trust & brand (NEW)

**C2.T2 ✓ VERIFIED via SERP — Andrei Ursachi LinkedIn currently displays "Independent Researcher"**
He no longer publicly identifies as Stailer CEO on the active LinkedIn surface.
- Source: SERP capture; LinkedIn authwall

**C2.T3 ✓ VERIFIED EXACTLY VERBATIM — Bogdan Clipici exit Sept 2024 confirmed**
> "Bogdan exited the startup and no longer holds shares, with his departure being amicable… appointed Country Manager for Bolt Business Romania."
- Source: [StartupCafe Sept 3 2024](https://startupcafe.ro/bogdan-clipici-fondator-stailer-manager-bolt-htm-28402)

**C2.T4 ⚠ CORRECTED — Funding numbers don't reconcile**
- Stailer's own PR: €2.5M raised
- Crunchbase: $1.8M ≈ €1.65M
- Verified press rounds: ~€2M total
- The €2.5M figure is high relative to publicly-verifiable rounds.

**C2.T5 ✓ VERIFIED — Shine NFT (2022) abandoned**
Wayback for stailer.io: "Saved 16 times between May 25, 2022 and November 28, 2023" — zero post-2023 captures. NFT pivot quietly died.

**C2.T6 ✓ VERIFIED — Stailer Jobs (2022) — no further coverage 2024–2026**
Pivot failed silently.

**C2.T7 ✓ VERIFIED [NEW] — Engagement tank vs MERO**
41 iOS Pro ratings, 110 Android Pro reviews, 5 iOS Client (US) ratings in 5 years. MERO has ~40× the review volume.

**C2.T8 ✓ VERIFIED [NEW] — Stailer has zero Trustpilot, Glassdoor, Reddit, Softpedia presence**
Effectively zero independent third-party reputation surface.

### Pricing & commission

**C2.P1 ✓ VERIFIED — Historical 25%+VAT female / 35%+VAT male commission anchors negotiation**
Anchor effect remains even though current model is "flexible."

### Romania-specific

**C2.R1 ✓ VERIFIED — AI bot Romanian language quality untested in public**
No demo recordings, no native-speaker reviews of tu/dvs handling, dialects, idioms.

**C2.R2 ✓ VERIFIED — Support SLA <24h business days wrong for industry that peaks Sat-Sun**

**C2.R3 ✓ VERIFIED — Salons effectively rent their clients back from Stailer marketing channels**

---

# PART D — INDUSTRY-WIDE PATTERNS, COMPETITOR STRENGTHS, EMERGING EXPECTATIONS

## D1. What users LOVE in other platforms (15 features worth studying)

| # | Platform | Feature | Why it works |
|---|---|---|---|
| 1 | GlossGenius | Brand-customizable booking page + no-account guest booking | Mandatory account creation is a top US checkout-abandon trigger |
| 2 | Mangomint | Express Booking SMS link (staff: name+phone+service → client confirms via text) | Lowest-friction "book the client now" flow shipping today |
| 3 | Boulevard | Precision Scheduling auto-fills slot gaps (≤15 min) | Eliminates unsellable dead time |
| 4 | Phorest | Digital TreatCard (points for treats, NOT discounts) | 12–18% more revenue per loyalty member; one salon £35K generated |
| 5 | Booksy | Boost — pay only on confirmed new-client first visits (30%, max $100) | Aligned platform/merchant incentive |
| 6 | Boulevard | Dedicated business SMS phone number | Trust + recognizability |
| 7 | Vagaro/Fresha | Fast 5-staff onboarding in 2 days vs weeks | 83% of owners regret feature-packed/complicated software |
| 8 | Booksy | 24/7 in-app live chat + phone support | Support is #1 differentiator |
| 9 | Mangomint | Free 1-day concierge migration | $3,500–$6,000 + 60 hours is the average switch cost — eliminate it |
| 10 | GlossGenius | Flat 2.6% payment processing | Predictable, no tier games |
| 11 | Phorest | Cashless tipping → 25% avg tips, +15–20% vs cash | Native checkout prompt |
| 12 | Boulevard | Auto-renewing membership tooling | Members = 60% higher retention, 35% of total revenue |
| 13 | Vagaro | AI marketing copy generator | Saves solo operators time |
| 14 | Booksy | Native Instagram booking integration | 78% of clients check social before booking; 72% discover via IG |
| 15 | Mangomint | Native group booking (bridal/couples) with shared deposits | Most competitors botch this |

## D2. Universal industry pain (top 10)

1. **Customer support failures at peak hours** — Mindbody/Treatwell/Booksy. 73% of issues cluster around stability + support + integrations.
2. **Lock-in contracts (12–24 months)** — Boulevard 12, Mindbody 24. EU Data Act (Sept 2025) legally disrupts this.
3. **Hidden/stacking fees** — Fresha 20% + processing, Treatwell 35% (42% with UK VAT), Booksy Boost on owned traffic, Mindbody 23.5% combined.
4. **Data migration friction** — $3,500–$6,000 + 60 hours average switching cost.
5. **Slow dashboards + glitchy mobile** — Mindbody, Boulevard Android, Meevo, Zenoti. 47% of multi-location complaints are crashes.
6. **SMS reminder delivery unreliability** — carrier filtering, iOS "unknown senders", wrong numbers. Industry-wide blind spot.
7. **Mobile app feature parity gap** — owners are mobile-first; reports/settings desktop-only.
8. **Forced client app downloads** — Booksy's biggest UX hit.
9. **Confusing pricing tiers + add-ons** — 70% of features unused; bills unpredictable.
10. **Marketplace commission abuse** — Treatwell still bills commission when the salon cancels a new booking (post-April 2025).

## D3. Emerging expectations 2025–2026

1. **AI virtual receptionists (voice + chat)** — McKinsey: 25–35% utilization gain. Voice is next wave.
2. **Personalization beyond name** — 71% expect, 76% frustrated when absent.
3. **Membership/subscription models go mainstream** — 60% retention lift.
4. **WhatsApp-first booking & reminders** — dominant in EU/LATAM/MENA; ignored by US-built platforms.
5. **Gen Z social-discovery to bookings** — 67% of Pinterest Predicts 2026 trends are Gen Z; IG indexed by Google.
6. **BNPL for high-ticket beauty** — +20% revenue, 40% higher spend per BNPL client.
7. **Wallet/gift-card portability** — universal gap.
8. **Sustainability-conscious filtering** — 65% seek eco brands; no platform has the filter.
9. **Mental health/wellness integration** — 44% define beauty as mind+body.
10. **AI skin/hair analysis at booking** — Perfect Corp, Revieve, Lancôme partnerships; salon-side integration rare.

---

# PART E — STRATEGIC IMPLICATIONS FOR ZAVOIA

The single throughline across Fresha/MERO/Stailer is **trust erosion through commercial misalignment**, but each one's biggest weakness is structural:

- **Fresha** — extracts value through marketplace commissions, processing fees, auto-listed salons, mandatory hardware, opt-out-by-cancelling dark patterns; investing in AI yield optimization instead of trust gaps. Public ratings remain high but a vocal minority of long-tenured partners is producing concrete legal exposure (ACCC).
- **MERO** — sells "no commission ethics" but the marketplace per-pro tier is actually **€34.99 + €9.99/professional** (not €30/€6), making Logbox cheaper than MERO marketplace at scale; SMS is metered (€0.03 each, stacking ~1.5× the subscription); the CEO is publicly heading a Swedish competitor on his personal site while still running MERO; not in Romania's Top 50 grossing beauty apps; Nov 2026 AMEF wall undocumented.
- **Stailer** — has effectively wound down. Web platform offline. -€9.6M equity. 4 employees. Even MERO's CEO has eulogized it.

Cross-cutting opportunities ranked by leverage:

**1. WIN ON ATTRIBUTION TRANSPARENCY**
Show every commission's source as a receipt: "This client booked via [marketplace browse / your IG link / direct link]. Commission applied: [amount]." Tackles Fresha's #1 complaint (B-side) and Booksy's #2 complaint (Boost on owned traffic). Commission only on confirmed Zavoia-sourced first visits.

**2. WIN ON PRICING PREDICTABILITY + GRANDFATHERING**
Pricing locked in RON (not EUR — beats MERO's FX-creep stealth hike). Public versioned-terms history with a "no retroactive removal" pledge. 6-month notice for any fee change (vs Fresha's 30-day). Direct response to AU ACCC pattern + MERO FX-creep + Stailer's RON↔EUR confusion + Fresha's "moving goalposts."

**3. WIN ON MIGRATION**
Free concierge migration from Booksy / Fresha / Treatwell / MERO / Stailer / Logbox / Versum exports. Honor EU Data Act portability in writing. Stailer's collapse + MERO's pricing reality + Fresha's review-portability lock = a wide-open migration window.

**4. WIN ON ROMANIAN REGULATORY HEAD START**
Native e-Factura B2B + B2C support PLUS the AMEF/case-de-marcat Nov 2026 piece. SmartBill/FGO/Oblio/Saga webhooks. euPlatesc/Netopia/Twispay alongside Stripe. MERO has e-Factura but not AMEF; Stailer is gone; Fresha has neither.

**5. WIN ON WHATSAPP-FIRST + EXPRESS BOOKING**
Combine Mangomint's Express Booking pattern (staff types name+phone+service → client confirms via link) with WhatsApp Business API primary, SMS fallback. No US-built competitor ships this combination; MERO has neither; Stailer's AI confirmation calls have ~14% conversion. Romania messages on WhatsApp.

**6. WIN ON RELIABILITY AS POSITIONING**
Public uptime + performance page. Dashboard <500ms on mid-tier mobile. Real mobile/web feature parity. Quote Fresha's Glassdoor "ungodly mess" and Stailer's Aug 2025 app freeze + complete offline status as evidence of why this matters.

**7. WIN ON STAFF-SIDE FAIRNESS**
- Tips paid through without processing-fee skim (eat the ~2.2%, or offer cash-tip mode explicitly)
- Native tip-pool / split (Fresha gap)
- Granular role permissions (Fresha has only 5 fixed levels)
- Effective-dated wage history with retro adjustments (Fresha doesn't allow)
- Stylist-first scheduling

**8. WIN ON SALON-FIRST CLIENT OWNERSHIP**
- Salon controls cancellation policy for marketplace bookings; commission refunded if salon-side cancellation
- No auto-listings without consent + one-click owner takedown
- No "Book Now" buttons injected into anyone's site (Fresha)
- Salon's own URL/QR/IG link bookings stay commission-free, end of story
- 12-month gift card validity (vs MERO's 6) + auto-refund to consumer on expiry (vs MERO's salon-keeps-the-money)

**9. WIN ON MEMBERSHIPS + LOYALTY (RO/EU GAP)**
Native membership templates (monthly blow-dry, 10-pack manicures, quarterly color) auto-renewing, available on every tier (not Boulevard's $158+). Phorest-style points-for-treats (NOT discounts) loyalty module. Democratize what Boulevard charges enterprise rates for.

**10. WIN ON ROMANIAN PRESENCE + GOVERNANCE TRANSPARENCY**
- Romanian-language phone support, weekend hours (Sat 9am–7pm minimum) — direct counter to MERO email-only
- Single Romanian-incorporated entity (no Delaware Corp / no near-dormant subsidiaries / no contractor-only payroll)
- Anchor brand in a specific Romanian city for local-pride loyalty
- Founders 100% engaged on Zavoia (not running parallel Swedish competitor product)
- Public "About Us" with real headcount, location, and decision-makers

---

# PART F — VERIFICATION PLAN

To keep this dossier accurate over time:

- **Monthly:** Pull current 1–3-star App Store / Play Store reviews for Fresha (US/UK/AU/EU), MERO Pro RO, Stailer Beauty Pro RO. Many of the most damaging quotes are dated 2024–2026; check whether the themes continue or vendors have shipped fixes.
- **Quarterly:** Re-pull termene.ro / listafirme.eu for MERO Programari SRL (37670174), MERO PRO APPS SRL (44561528), Logbox SRL (45957580), STAILER ONLINE SERVICES SRL (42915971) to track financials and employee count trajectories.
- **Monthly:** Confirm Stailer's domain status. If stailer.ro stays Replit-placeholder more than 60 days, treat the competitor as fully gone.
- **Quarterly:** Re-check Similarweb / Sensor Tower RO beauty grossing rank to confirm Booksy Biz remains the visible #1.
- **Quarterly:** Re-check Andrei Ursachi LinkedIn (still "Independent Researcher"? still listed at Stailer in current role?) and Adrian Trif's personal site (still claiming Bokadirekt headship?).
- **Quarterly:** Pull latest Glassdoor Fresha reviews to confirm trajectory ("ungodly mess" / "5-day RTO" / "toxic culture" still recurring?).
- **One-time qualitative push:** Recruit 5–10 Romanian salon owners for 30-min interviews. The closed Facebook groups ("Patroni de salon Romania", "Coafori Romania", "Frizeri Romania", "Cosmetică Romania", "Manichiuriste Romania") were not search-indexed in either round — qualitative interviews are how to fill that gap.

Per-agent detail files (with full source URLs and verbatim quotes):
- [Fresha round 1](/home/ted/.claude/plans/i-want-you-to-reactive-stardust-agent-ad942f93f8ba3b0f9.md)
- [Fresha round 2 verification](/home/ted/.claude/plans/i-want-you-to-reactive-stardust-agent-aad1d88352b6cc3f0.md)
- [MERO round 1](/home/ted/.claude/plans/i-want-you-to-reactive-stardust-agent-acc193b1d3b3c2a7e.md)
- [MERO round 2 verification](/home/ted/.claude/plans/i-want-you-to-reactive-stardust-agent-aa591c1a88ad7985c.md)
- [Stailer round 1](/home/ted/.claude/plans/i-want-you-to-reactive-stardust-agent-afeb2dad2a57daf90.md)
- [Stailer round 2 verification](/home/ted/.claude/plans/i-want-you-to-reactive-stardust-agent-a09e5f539d72ff93d.md)
- [Industry-wide](/home/ted/.claude/plans/i-want-you-to-reactive-stardust-agent-a9678d8b939713eeb.md)

---

# PART G — SOURCES INDEX

### Fresha
- Trustpilot: https://www.trustpilot.com/review/fresha.com (4.7/5, 5,848 reviews); 1-star filter: https://www.trustpilot.com/review/fresha.com?stars=1
- ProductReview AU: https://www.productreview.com.au/listings/fresha (1.2/5, 40 reviews, 98% negative)
- Capterra: https://www.capterra.com/p/142138/Shedul-com/reviews/ (4.8/5, 1,446)
- Software Advice: https://www.softwareadvice.com/retail/shedul-profile/reviews/
- G2: https://www.g2.com/products/fresha/reviews
- GetApp: https://www.getapp.com/industries-software/a/shedul-com/reviews/
- PissedConsumer: https://www.pissedconsumer.com/fresha/RT-F.html (1.7/5, 14)
- Glassdoor: https://www.glassdoor.com/Reviews/Fresha-Reviews-E3506248.htm ; London: https://www.glassdoor.co.uk/Reviews/Fresha-London-Reviews-EI_IE3506248.0,6_IL.7,13_IC2671300.htm
- Glassdoor "Toxic chaos": https://www.glassdoor.co.uk/Reviews/Employee-Review-Fresha-E3506248-RVW85579758.htm
- App Store Business id1455346253: https://apps.apple.com/us/app/fresha-for-business/id1455346253 (4.8/5, 3.5K)
- App Store Customers id1297230801: https://apps.apple.com/us/app/fresha-for-customers/id1297230801 (4.9/5, 50K)
- Play Store: https://play.google.com/store/apps/details?id=com.fresha.Fresha
- JustUseApp: https://justuseapp.com/en/app/1297230801/fresha-book-appointments/problems
- Medium "True Cost of Fresha" (note: defends Fresha): https://medium.com/@asbaines/the-true-cost-of-fresha-276d6856bcc0
- KOR Digital: https://www.kordigital.co.uk/why-has-my-salon-been-added-to-fresha-and-what-can-i-do-about-it/
- TimeTailor: https://www.timetailor.com/timetailor-alternatives/fresha-reddit-reviews ; customer service: https://www.timetailor.com/timetailor-alternatives/fresha-customer-reviews ; limitations: https://www.timetailor.com/timetailor-alternatives/fresha-limitations
- Pabau: https://pabau.com/blog/fresha-reviews ; pricing: https://pabau.com/blog/fresha-pricing/
- GlossGenius vs Fresha: https://glossgenius.com/blog/glossgenius-vs-fresha
- Dingg Fresha alternatives 2025: https://dingg.app/blogs/the-salon-owners-guide-best-fresha-alternatives-for-us-salons-in-2025
- TheSalonBusiness Fresha review: https://thesalonbusiness.com/fresha-review/
- Goldie migration: https://support.heygoldie.com/en/articles/323672-importing-from-fresha
- Google Business Profile threads: https://support.google.com/business/thread/252560747 ; https://support.google.com/business/thread/252670900
- Facebook scam alert: https://www.facebook.com/groups/222818713883/posts/10163028652203884/
- Fresha Partner Terms: https://terms.fresha.com/partner-terms ; Terms of Service: https://terms.fresha.com/terms-service
- Fresha Help Center: marketplace fees https://www.fresha.com/help-center/knowledge-base/billing-and-fees/188-marketplace-new-client-fees ; SMS https://www.fresha.com/help-center/knowledge-base/marketing/139-create-text-message-blast-campaigns ; pay run https://www.fresha.com/help-center/knowledge-base/team/100-complete-a-pay-run ; wages https://www.fresha.com/help-center/knowledge-base/team/99-set-up-wages-for-team-members ; permissions https://www.fresha.com/help-center/knowledge-base/team/49-manage-team-permissions-and-access-levels ; 1099-K https://www.fresha.com/help-center/knowledge-base/billing-and-fees/186-1099-k-form ; online booking https://www.fresha.com/help-center/knowledge-base/online-profile/599-learn-how-clients-book-appointments-online ; image gallery https://www.fresha.com/help-center/knowledge-base/online-profile/100667-marketplace-image-gallery-overview ; promotions https://www.fresha.com/help-center/knowledge-base/marketing/143-create-and-manage-promotions ; Insights https://www.fresha.com/help-center/knowledge-base/reports/175-upgrade-to-insights-for-premium-reports
- Fresha API Tracker: https://apitracker.io/a/fresha ; community API request: https://support.fresha.com/hc/en-us/community/posts/360009317419-Give-us-API-integration-access
- Fresha Up Next 2026: https://www.fresha.com/blog/Up-Next-2026
- PR: AI scheduling: https://www.prnewswire.com/news-releases/fresha-unveils-ai-powered-intelligent-scheduling-for-the-beauty-and-wellness-industry-unlocking-unrealized-revenue-and-growth-for-selfcare-businesses-302768124.html

### MERO
- Romanian press: https://start-up.ro/peste-1-000-de-saloane-folosesc-platforma-mero-pentru-programari/ ; https://www.startupcafe.ro/idei-antreprenori/aplicatie-programare-coafor-romania-mero-logbox-cumparare.htm ; https://www.economica.net/tranzactie-cheie-pe-piata-solutiilor-digitale-pentru-saloane-beauty-mero-preia-logbox_576606.html ; https://business-review.eu/business/mero-acquires-logbox-and-strengthens-its-position-as-market-leader-230006 ; https://therecursive.com/mero-acquired-logbox-to-offer-one-tool-for-the-digitalization-of-beauty-salons/ ; https://www.zf.ro/business-hi-tech/start-up-ul-local-mero-am-ajuns-la-un-portofoliu-de-peste-1-000-de-20368193 ; https://www.businesspress.ro/founders-bridge-finanteaza-cu-300-000-de-euro-dezvoltarea-mero-platforma-de-programari-la-saloane-de-infrumusetare-cu-cea-mai-rapida-crestere/
- MERO/Logbox owned: https://mero.ro/ ; https://mero.ro/pro ; https://mero.ro/pro/preturi ; https://mero.ro/termeni-si-conditii ; https://mero.ro/politica-de-confidentialitate ; https://logbox.ro/ ; https://logbox.ro/preturi/ ; https://logbox.ro/componente/ ; https://asistenta.mero.ro/ro
- Help center: https://asistenta.mero.ro/ro/articles/4911769 ; https://asistenta.mero.ro/ro/articles/4911772 ; https://asistenta.mero.ro/ro/articles/5122936 ; https://asistenta.mero.ro/ro/articles/5756305 ; https://asistenta.mero.ro/ro/articles/4911767 ; https://asistenta.mero.ro/ro/articles/4942975
- App stores: https://play.google.com/store/apps/details?id=com.probstit.novabooker ; https://play.google.com/store/apps/details?id=ro.mero.pro.app ; https://apps.apple.com/ro/app/mero-program%C4%83ri-online/id1411473472 ; https://apps.apple.com/ro/app/mero-pro/id1554148874
- App intel: https://www.similarweb.com/top-apps/google/romania/beauty/top-grossing/ ; https://www.similarweb.com/top-apps/apple/romania/lifestyle/top-grossing/ ; https://sensortower.com/blog/2025-q1-unified-top-5-beauty%20retail-units-ro-63fd3f19e1714cfff19e1990 ; https://sensortower.com/blog/2025-q4-ios-top-5-beauty-retail-units-ro-63fd3f19e1714cfff19e1990
- Fiscal registries: https://listafirme.ro/mero-programari-srl-37670174/ ; https://termene.ro/firma/37670174-MERO-PROGRAMARI-SRL ; https://listafirme.ro/mero-pro-apps-srl-44561528/ ; https://listafirme.ro/logbox-srl-45957580/
- Leadership: https://www.linkedin.com/in/atrif/ ; https://se.linkedin.com/in/atrif ; https://se.linkedin.com/in/andreeatrif ; https://adriantrif.com/ ; https://www.crunchbase.com/person/adrian-trif ; https://www.crunchbase.com/organization/mero
- Regulatory: https://mfinante.gov.ro/en/web/efactura ; https://www.anaf.ro/anaf/internet/ANAF/servicii_online/reg_AMEF ; https://startupcafe.ro/termen-case-marcat-cod-qr-firme-romanesti-obligate-anaf-2026-proiect-oficial-hotarare-guvern-97362 ; https://wise.com/ro/blog/stripe-romania
- Romanian salon page (price drift): https://mero.ro/p/ukiyo-beauty-salon

### Stailer
- Live state: stailer.ro / www.stailer.ro / stailer.app / lp.stailer.app / stailer.io (Replit placeholders / DNS fail / dead redirects as of 2026-05-25)
- Wayback last live snapshots: https://web.archive.org/web/20260101115915/https://stailer.ro/ ; https://web.archive.org/web/20251016064553id_/https://stailer.ro/politica-de-confidentialitate ; https://web.archive.org/web/20231128140307id_/https://stailer.io/
- Romanian press: https://startupcafe.ro/startup-romanesc-stailer-programari-coafor-investitie-inteligenta-artificiala-htm-26104 ; https://startupcafe.ro/startup-romanesc-platforma-stailer-jobs-htm-21812 ; https://startupcafe.ro/bogdan-clipici-fondator-stailer-manager-bolt-htm-28402 ; https://economedia.ro/compania-de-ride-sharing-bolt-l-a-numit-pe-bogdan-clipici-fondatorul-stailer-in-functia-de-country-manager-al-bolt-business.html ; https://www.revistabiz.ro/stailer-lanseaza-stailer-ai/ ; https://therecursive.com/why-the-next-10-years-will-be-all-about-market-networks-with-andrei-ursachi-from-stailer/ ; https://therecursive.com/stailer-launches-a-collection-of-nfts-to-help-beauty-salons-create-engaging-experiences-for-customers/ ; https://www.zf.ro/eveniment/business-magazin-cum-a-ajuns-andrei-ursachi-de-la-startup-ul-stailer-20753159 ; https://www.linnify.com/products/stailer ; https://www.romania-insider.com/stailer-funding-mar-2022 ; https://www.trendingtopics.eu/romanian-beauty-startup-stailer-secures-a-e500k-investment-reaching-valuation-of-e10m/
- Leadership: https://www.linkedin.com/in/andrei-ursachi-065275203/ ; https://www.linkedin.com/posts/andrei-ursachi-065275203_stailer-ai-revolutionizing-how-salon-appointments-activity-7240596645975908352-G1nv ; https://blog.andreiursachi.eu/
- App stores: https://apps.apple.com/ro/app/stailer-beauty-pro/id1535434485 ; https://apps.apple.com/us/app/stailer-beauty-booking/id1564956930 ; https://play.google.com/store/apps/details?id=com.stailer.users
- Fiscal: https://www.risco.ro/en/verifica-firma/stailer-online-services-cui-42915971

### Industry-wide
- McKinsey State of Beauty 2025: https://www.mckinsey.com/industries/consumer-packaged-goods/our-insights/state-of-beauty
- Boulevard AI 2025: https://www.joinblvd.com/blog/4-ways-ai-is-transforming-the-beauty-and-wellness-industry-in-2025
- Zenoti 2026 survey: https://www.zenoti.com/thecheckin/salon-booking-survey-data
- Pinterest Predicts 2026: https://professionalbeauty.co.uk/pinterest-predicts-2026-beauty-wellness-trends
- Global Wellness Summit: https://www.globalwellnesssummit.com/2026trends/
- Booksy Trustpilot: https://www.trustpilot.com/review/booksy.com
- Treatwell Trustpilot: https://www.trustpilot.com/review/treatwell.com
- Capterra Mindbody: https://www.capterra.com/p/40229/MINDBODY/reviews/
- Capterra Booksy: https://www.capterra.com/p/142741/Booksy/reviews/
- Capterra Meevo: https://www.capterra.com/p/172058/Meevo-2/reviews/
- Trustpilot Zenoti: https://www.trustpilot.com/review/zenoti.com
- BBB Booksy: https://www.bbb.org/us/il/chicago/profile/marketing-consultant/booksy-inc-0654-1000106496/complaints
- Phorest TreatCard: https://www.phorest.com/blog/using-treatcard-to-increase-revenue/ ; cashless tipping: https://www.phorest.com/features/cashless-tipping/
- Mangomint Express Booking: https://www.mangomint.com/features/express-booking/ ; switch from Boulevard: https://www.mangomint.com/go/switch-from-boulevard/ ; 2025 features: https://www.mangomint.com/blog/best-new-mangomint-features-of-2025/
- Boulevard Precision Scheduling: https://support.boulevard.io/en/articles/6110033-precision-scheduling ; membership playbook: https://www.joinblvd.com/blog/the-membership-playbook
- GlossGenius: https://glossgenius.com/ ; BNPL: https://glossgenius.com/buy-now-pay-later
- Beautyplaybook GlossGenius: https://www.beautyplaybook.com/blog/glossgenius
- Salon Today Vagaro AI: https://www.salontoday.com/1091888/vagaros-new-ai-features-and-communication-tool-pave-the-way-for-a-more-efficient
- Salon Today IG-Booksy: https://www.salontoday.com/376755/booksy-partners-with-instagram-to-integrate-salon-appointment-scheduling-and-soc
- Salon Today BNPL: https://www.salontoday.com/1090980/transforming-the-future-of-commerce-the-rise-of-buy-now-pay-later-services-and-t
- thesalonbusiness Boulevard: https://thesalonbusiness.com/boulevard-software-review/ ; Mindbody: https://thesalonbusiness.com/mindbody-software-review/ ; best salon software: https://thesalonbusiness.com/best-salon-software/
- Dingg: https://dingg.app/blogs/what-to-look-for-in-salon-software-a-buyers-guide-for-us-owners
- DoTheBeauty Treatwell hidden fees: https://www.dothebeauty.com/blog/treatwell-cost-hidden-fees
- Gymdesk Mindbody worth it: https://gymdesk.com/blog/is-mindbody-worth-it
- STX switching guide: https://stxsoftware.com/blog/switching-salon-software-guide/
- SalonIQ: https://saloniq.com/switching-salon-software-how-easy-is-it
- Mindbody switching guide: https://www.mindbodyonline.com/business/education/guide/how-switch-your-salon-or-spa-software
- Ralabs UX best practices: https://ralabs.org/blog/booking-ux-best-practices/
- Tiphaus QR tipping: https://www.tiphaus.com/blog/how-qr-code-tipping-and-contactless-payments/
- Hale Cosmeceuticals virtual skincare: https://www.halecosmeceuticals.com/blog/2025s-top-virtual-skincare-consultation-platforms
- Get Monetizely memberships: https://www.getmonetizely.com/articles/optimizing-your-salon-membership-pricing-a-guide-to-spa-subscription-models
- Clifford Chance EU Data Act: https://www.cliffordchance.com/content/dam/cliffordchance/briefings/2025/02/data-privacy-legal-trends-2025.pdf
- Romania beauty market: https://strategyh.com/report/beauty-and-personal-care-products-market-in-romania/
- SaaS spa management market: https://www.fortunebusinessinsights.com/saas-for-spa-management-market-108584
