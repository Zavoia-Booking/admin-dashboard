# Zavoia — Open Legal Questions Explained

**Date:** 23 July 2026  
**Scope:** the Marketplace appointment model, the free Marketplace account, DSA/ANCOM, OUG 49/2009, DAC7, accessibility/EAA, company-size exemptions, and the Dashboard's professional-use model.  
**Purpose:** explain why each subject appears in the compliance audit, what is already known, what is genuinely unresolved, who can decide or enforce it, and what Zavoia should do next.

This is an operational decision document based on the current source trees and official EU/Romanian sources. It is not a substitute for a written opinion from Romanian counsel or tax counsel. Its main purpose is to stop classification questions from being presented as confirmed product bugs.

## 1. Executive conclusion

| Subject | Current conclusion | Status | What Zavoia should do |
|---|---|---|---|
| Marketplace bookings | The product owner has confirmed an **appointment-coordination model**. The Zavoia action must not itself oblige the customer to attend/pay or the provider to perform, and it must not create a no-show, cancellation-fee or damages claim. | **Management decision recorded for this document. Current wording and behavior must be aligned with it.** | State the model in customer and provider terms; remove contradictory contract/payment language; distinguish fixed prices from estimates; make cancellation settings platform-calendar controls, not debt rules; obtain a short Romanian-law validation of the completed flow. |
| Free Marketplace account and personal data | A service can fall under digital-consumer law even when no money is paid if personal data is used for purposes beyond what is necessary to provide the service or comply with law. That does **not** mean data is automatically “payment,” and it is not automatically applicable to Zavoia. | **Purpose-by-purpose classification required; not a confirmed bug.** | Map every data purpose. Keep necessary processing separate from optional marketing/analytics. Fix consent defaults independently of the classification. |
| DSA | Because Zavoia stores and publicly displays provider listings and customer reviews, it is very likely a hosting service and likely an online platform under the DSA. This does not depend on whether an appointment is a contract. | **High-confidence classification requiring a documented legal confirmation.** | Implement or verify the DSA baseline: contact points, moderation terms, notice-and-action, reasons for restrictions, and the serious-crime escalation procedure. Apply size exemptions only to the duties they actually cover. |
| ANCOM notification | Law 50/2024 creates a notification duty for Romanian intermediary-service providers. For providers already operating when the law entered into force, the 45-day period starts when ANCOM's implementing decision enters into force. | **Real duty, but no basis found to declare Zavoia overdue as of 23 July 2026.** | Prepare the information, monitor the official decision, and ask ANCOM or counsel in writing about the timing ambiguity. Do not describe this as a licence. |
| OUG 49/2009 | Covered service providers have identity/service/complaint information duties. The unusual five-day interval may be shortened with the beneficiary's written agreement. The rule can matter even where no written contract is formed because the statute also refers to the time before actual service. | **Category and implementation assessment required; not a five-day booking ban.** | Map covered/excluded provider categories, decide which information must be collected and where it is accessible, and validate an electronic short-notice agreement mechanism. |
| DAC7 | Offline personal services facilitated by a platform can be in scope even when the platform does not process payment. Reporting still depends on consideration paid or credited to a seller whose value is known or reasonably knowable by Zavoia. | **Tax-classification question; not a confirmed violation or code bug.** | Obtain a tax memo based on the real booking/completion/price data. If outside scope, retain the reasoning and reassess when the commercial model changes. |
| EAA / accessibility | Consumer e-commerce services can be covered even when payment happens offline. A genuine microenterprise service exemption exists in the EU directive, but Romanian Law 232/2022 contains a material cross-reference problem. | **Scope and exemption require actual facts and Romanian legal analysis.** | Have the accountant establish size and linked-enterprise status; obtain Romanian counsel's opinion and, if useful, written administrative guidance from ADR; only then label any gap a statutory violation. |
| Dashboard B2C | A natural person using a personal card can still buy Zavoia professionally. The Dashboard is business operating software, so Zavoia can allow person billing without forcing company details and still make the product professional-use-only. | **Recommended product position; source lacks the evidence controls proposed for that position.** | State and record professional purpose at workspace/trial creation as an evidence-hardening measure. Keep “person/company invoice recipient” separate from “professional/consumer legal capacity.” Add a consumer checkout if Zavoia permits, supplies or in practice accepts genuine private-purpose use. |

The practical distinction throughout this document is:

- **confirmed product mismatch:** the code or copy conflicts with a product decision or a rule that applies regardless of an unresolved classification;
- **classification gate:** facts or legal interpretation must be established before building a compliance flow;
- **future trigger:** a later feature such as deposits, online payment, no-show fees, transaction commission or private-purpose Dashboard use can change the answer.

## 2. Marketplace bookings: appointment coordination, not a sale through Zavoia

### 2.1 Direct answer

The product owner has confirmed the following intended model for this document:

- Zavoia helps a customer and a provider coordinate a date and time;
- Zavoia does not collect the service price, a deposit, a no-show charge or a cancellation charge;
- the customer is not legally forced by Zavoia to attend or pay;
- the provider is not legally forced by Zavoia to perform;
- neither party owes damages merely because the Zavoia appointment is cancelled or missed;
- under the intended terms, the parties remain free to discuss and agree the actual offline service directly.

EU consumer-rights guidance recognizes that a simple appointment-request model can fall outside the distance-contract category. Zavoia does **not** need to convert an appointment into an online sale merely because it is scheduled in an application. The final legal effect still depends on Romanian law and the objective complete flow, which is why the finished implementation needs a narrow legal review.

The European Commission's Consumer Rights Directive guidance expressly distinguishes a simple appointment request from a binding reservation. Its example says that requesting an appointment with a hairdresser is not a distance contract, while a binding reservation is likely to be one. The Directive also leaves contract formation and the legal effect of contracts to national law. Official sources: [Commission CRD guidance, section 4.1](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52021XC1229(04)), [Directive 2011/83/EU](https://eur-lex.europa.eu/eli/dir/2011/83/oj/eng), and the [Romanian Civil Code](https://legislatie.just.ro/Public/DetaliiDocument/205332).

### 2.2 Why legal validation was raised

The question was not raised because Zavoia should force either party into a contract. It was raised because a court or regulator looks at the **objective complete flow**, not only at what the product owner intended.

The audited flow currently contains signals that can look stronger than a simple request:

- the button says **“Confirm booking”**;
- an auto-confirmed result says **“You're booked”**;
- the application displays an exact **Total**;
- the provider can enable automatic confirmation;
- the API creates a durable appointment that occupies staff time, refreshes availability and causes conflicting requests to be rejected;
- the appointment snapshots the service and exact price.

At the same time, the flow says payment occurs directly at the venue and implements no customer payment obligation. Those are mixed signals. Romanian counsel is needed for a narrow purpose: to verify that the final terms, screens, messages and provider rules consistently produce the nonbinding model Zavoia has selected. Counsel is not being asked to decide whether Zavoia wants appointments to be binding.

Ultimately, a Romanian court decides contract formation in a dispute. ANPC can investigate consumer-facing wording or practices that are misleading. A counsel memo reduces the chance of reaching either situation; it is not regulatory approval.

### 2.3 What the current code proves—and what it does not

The booking payload contains listing, location, date/time, service or bundle, and staff identifiers. It contains no payment, deposit, fee, attendance promise or contract-acceptance field. The flow nevertheless creates a durable appointment, performs calendar-conflict checks, snapshots price/currency and returns either `PENDING` or `CONFIRMED`, depending on provider settings.

Relevant source evidence:

- booking request: `/home/ted/zavoia/admin-api/src/modules/marketplace/appointments/dto/create-booking.dto.ts`;
- booking creation and auto-confirmation: `/home/ted/zavoia/admin-api/src/modules/marketplace/appointments/appointments.service.ts`;
- review, total and result copy: `/home/ted/zavoia/zavoia-web/src/lib/booking/BookingDrawer.tsx`;
- English booking messages: `/home/ted/zavoia/zavoia-web/src/i18n/dictionaries/en.ts`;
- provider settings: `/home/ted/zavoia/admin-api/src/entities/bookingSettings.entity.ts`.

Code cannot prove what a Romanian court would conclude, whether a provider honors a displayed price offline, or whether a provider separately attempts to charge a customer. Those are legal and operational facts, not properties the source code can establish.

### 2.4 What must change to support the chosen nonbinding model

#### A. Define the effect of the appointment

Customer terms, provider terms and the booking interface should say consistently that:

1. Zavoia facilitates an appointment request or calendar reservation.
2. The Zavoia action does not itself create an obligation to attend, pay, perform the service, or pay cancellation/no-show fees or damages.
3. Provider acknowledgment or automatic calendar confirmation means that the time was recorded/reserved in the platform; it does not convert the action into an enforceable payment or attendance commitment.
4. The provider and customer may later agree the service scope, final price and other terms directly.
5. Zavoia is not the provider of the offline service and does not collect its payment.

The provider agreement should also prohibit providers from representing that a Zavoia appointment **by itself** creates a debt, fee or damages claim. Otherwise the customer-facing nonbinding promise could be undermined outside the platform.

The direct negotiation/final-price rule above is a proposed business and contractual rule. The current application has no negotiation, estimate, final-price-confirmation or actual-price-reporting workflow; it currently snapshots and displays an exact total.

#### B. Change the wording that currently implies final contract formation

Use wording such as:

- **“Request appointment”** or **“Reserve this time”**, depending on the exact operational result;
- **“Appointment request sent”** for provider-approval flows;
- **“Time reserved in the provider's Zavoia calendar”** for automatic acknowledgment;
- a nearby, short explanation that service and payment are agreed directly with the provider.

Avoid using a contract conclusion label such as “order with obligation to pay.” It does not belong in the selected model.

#### C. Make price semantics honest

The nonbinding model does not allow an inaccurate price to become harmless.

- If the provider commits to a fixed price for the described service, the product may show a fixed amount.
- If the final amount can change after the provider assesses duration, materials, complexity or scope, the product needs an **“from,” “estimated,” or “price confirmed by provider”** mode.
- Provider terms should require listings to be kept accurate and require changes to be communicated before the service.
- Zavoia should provide a report/support route for materially inaccurate listings.

Zavoia cannot guarantee everything a provider does offline, but it should not present an estimate as a guaranteed exact total.

#### D. Treat cancellation settings as platform controls

The provider's cancellation window can control when the customer may self-cancel through Zavoia. In the nonbinding model it should not create money owed by the customer.

Current issues to correct:

- the source includes copy saying a venue cancellation fee “may apply,” although no fee amount or charging mechanism exists;
- the API applies the provider's **current** cancellation settings to an existing appointment, because the policy shown at booking is not snapshotted.

The first statement conflicts with the selected no-fee model and should be removed unless Zavoia later intentionally designs and legally supports a different flow. The policy relevant to an existing appointment should be preserved, or the product should clearly say that the setting is only a current self-service availability rule and may change. Silent retroactive changes create an avoidable fairness and evidence problem.

#### E. Keep a durable, accurate appointment record

The customer should receive a retrievable record of:

- provider, location, service, date/time and appointment status;
- whether the displayed amount was fixed or indicative;
- the platform self-cancellation/rescheduling controls shown at creation;
- the statement that the appointment itself creates no payment, attendance, performance, no-show-fee or damages obligation.

This is an appointment receipt, not a contract-confirmation receipt.

### 2.5 What Zavoia does not need for the present model

For the current nonbinding appointment flow, Zavoia should **not automatically build**:

- an online “order with obligation to pay” button;
- a consumer withdrawal function for the offline service appointment;
- deposits or card authorization;
- a platform no-show fee;
- a mandatory five-day waiting period;
- a promise that Zavoia enforces the provider's offline price.

Reassess the specific affected flow before introducing online payment, deposits, cancellation/no-show fees, transaction commissions based on actual services, a guaranteed final price, or a rule allowing either party to claim performance or damages.

### 2.6 Decision owner and verification

| Question | Owner |
|---|---|
| Is Zavoia's product an appointment-coordination service with no appointment-derived obligation? | Zavoia management/product — **already decided** |
| Do screens, emails, terms and provider rules consistently implement that decision? | Product, engineering and legal |
| Does the completed flow have the intended legal effect under Romanian law? | Romanian contract/consumer counsel; ultimately Romanian courts in a dispute |
| Is consumer-facing copy misleading? | Zavoia review first; ANPC can investigate |

A focused counsel deliverable is sufficient: a short written opinion on the completed appointment flow, the exact nonbinding clause, the price wording and the provider prohibition. This does not require a theoretical redesign of the whole Marketplace.

## 3. The free Marketplace account and “personal data instead of money”

### 3.1 What the phrase means

EU and Romanian digital-consumer law can cover some digital services for which the consumer pays no money but supplies personal data. Romanian OUG 141/2021 applies where a trader supplies a digital service and the consumer supplies personal data, **except** where that data is processed exclusively to provide the requested service or to comply with law. See [OUG 141/2021, article 3](https://legislatie.just.ro/Public/DetaliiDocumentAfis/250054) and [Directive (EU) 2019/770](https://eur-lex.europa.eu/eli/dir/2019/770/oj/eng).

In plain language:

- an email address used to create the account, secure login and send appointment messages may be necessary to supply the account;
- a phone number used only for an appointment communication the customer requested may be necessary for that function;
- data used for unrelated advertising, cross-service profiling or another commercial purpose can move the service outside the “necessary only” exception.

This does **not** mean:

- personal data is legally treated as money in every free account;
- GDPR consent is required for every necessary account operation;
- Zavoia should add a checkbox saying “I pay with my data”;
- every Marketplace appointment becomes a contract;
- the classification is already resolved from the database schema.

OUG 141 and GDPR/ePrivacy are separate but overlapping regimes. A processing purpose may be lawful under GDPR and still matter to the OUG 141 scope analysis.

### 3.2 What is known about Zavoia

The current source creates a `CUSTOMER` user with active account status but `email_verified: false`, then attempts to send a verification email; no checkout is involved. Public discovery works without an account. Authenticated customer functionality stores or can store account identity, contact/profile information, login/security data, favorites, appointment data, reviews, support history, notifications/device tokens and communication preferences. After a booking, a provider-specific customer record is created; the provider can add local CRM notes and custom fields to that record. Recent searches and recent views are stored locally in the browser by the audited web implementation, rather than as account-linked server records.

The source also initializes marketing preference fields to `true`. The audit did **not** establish that marketing campaigns are currently sent, so it would be wrong to claim active unsolicited marketing from that fact alone. It does establish that those stored values cannot be relied upon as evidence of express marketing consent.

Relevant source evidence:

- account creation: `/home/ted/zavoia/admin-api/src/modules/marketplace/auth/customer-auth.service.ts`;
- user and preference fields: `/home/ted/zavoia/admin-api/src/entities/user.entity.ts`;
- favorites/profile/reviews/notifications: `/home/ted/zavoia/admin-api/src/modules/marketplace/customer`;
- booking snapshot and provider customer creation: `/home/ted/zavoia/admin-api/src/modules/marketplace/appointments/appointments.service.ts`.

Source code alone cannot establish every deployed tracker, vendor, runtime analytic event, business purpose, data-sharing arrangement or retention practice.

### 3.3 The decision test

For each category of personal data, record:

1. the exact field/event;
2. the feature that needs it;
3. the purpose;
4. the GDPR legal basis;
5. whether it is strictly needed for the requested Marketplace service or a legal obligation;
6. every separate optional purpose;
7. recipients/processors;
8. retention/deletion rule;
9. whether the processing actually occurs in staging/production.

Then classify the account:

- **Necessary/legal purposes only:** the statutory exception may apply; retain a written explanation.
- **Any material purpose beyond necessary/legal use:** treat the account as potentially within the personal-data digital-service regime and have consumer counsel confirm the consequences.

This cannot be solved by writing in the terms that data is or is not “payment.” Actual processing controls the answer.

### 3.4 Work required regardless of the final classification

- New marketing preference values must default to `false`.
- Existing `true` rows need a migration or re-consent plan; changing only the model default does not repair existing records.
- Marketing consent must be separate, optional, channel-specific, evidenced and withdrawable.
- Operational appointment/security messages must remain separate from marketing.
- The privacy notice must describe actual purposes, recipients and retention; acknowledging it is not the same as consenting to every processing purpose.
- Deployed tracking/storage must be audited at runtime before claiming that no nonessential tracking occurs.

### 3.5 Additional work only if the account is covered

If counsel concludes that the free customer account is supplied in exchange for personal data within OUG 141/OUG 34, Zavoia must map the actual requirements for:

- conformity, continuity, security updates and advertised functionality;
- remedies where the digital service is not supplied or conforming;
- material modifications to the service;
- termination effects and retrieval of eligible user-created content;
- pre-contract information and any applicable withdrawal route.

Ordinary account deletion is not automatically the statutory withdrawal function. Conversely, Zavoia should not build a withdrawal flow merely because a free account exists; first resolve the purpose map and classification.

### 3.6 Who verifies or enforces this

| Body/person | Role |
|---|---|
| Zavoia product/privacy owner | Supplies the true processing purposes and deployed vendor facts |
| Privacy counsel/DPO | GDPR/ePrivacy purpose and legal-basis assessment |
| Consumer counsel | OUG 141/OUG 34 account classification |
| ANSPDCP | Romanian data-protection/ePrivacy supervision |
| ANPC | Romanian digital-consumer-law enforcement |
| Courts | Decide disputed contractual rights |

This is presently a **classification and data-governance task**, not proof that the free Marketplace account is unlawful.

## 4. DSA and the ANCOM notification

### 4.1 Why the DSA likely applies

The Digital Services Act classifies services by what they do:

- a **hosting service** stores information supplied by a recipient at that recipient's request;
- an **online platform** is a hosting service that also disseminates that information to the public at the recipient's request, unless the public dissemination is only a minor and purely ancillary feature.

Zavoia stores provider-created listings and customer-created reviews and publishes them to Marketplace visitors. On the audited facts, hosting status is very likely and online-platform status is likely. Romanian counsel should document the classification, including confirmation that the public publication occurs at the relevant recipient's request and is not merely ancillary.

This classification comes from listings and reviews. It does **not** depend on:

- Zavoia processing the offline service payment;
- the appointment being binding;
- the provider being a company rather than an individual professional.

Official source: [Regulation (EU) 2022/2065, especially article 3](https://eur-lex.europa.eu/eli/reg/2022/2065/oj/eng).

### 4.2 Baseline duties likely relevant to Zavoia

The size-independent intermediary/hosting baseline includes:

1. a contact point for authorities (article 11);
2. a contact point that users can access electronically without relying only on automation (article 12);
3. terms that clearly explain content/account restrictions, policies, procedures, measures, algorithmic tools and human review, with due regard for users' fundamental rights (article 14);
4. a usable notice-and-action route for allegedly illegal content, capable of receiving sufficiently precise notices (article 16);
5. a clear statement of reasons when listed content, visibility, monetization, service access or an account is restricted for covered reasons (article 17);
6. a procedure to notify competent authorities when Zavoia becomes aware of information giving rise to a suspicion of a criminal offence involving a threat to a person's life or safety (article 18).

Article 15 transparency reporting and most additional online-platform duties have specific micro/small-enterprise rules. The exemption does not erase articles 11–14 and 16–18.

The additional DSA obligations for platforms that allow consumers to conclude distance contracts with traders, including trader traceability in article 30, should not be attached automatically to Zavoia's selected nonbinding appointment model. Counsel should classify those provisions separately. That narrower uncertainty does not remove the listings/reviews hosting analysis.

### 4.3 Who supervises Zavoia

- **ANCOM** is Romania's Digital Services Coordinator and principal DSA supervisor for providers established in Romania.
- The authority responsible for a specific field—and in some cases a court—decides whether particular content is illegal and may issue an order. ANCOM is not the universal decision-maker on the underlying illegality of every item.
- The European Commission directly supervises designated very large online platforms/search engines and can become involved through the DSA's allocation procedures. Nothing in the audit establishes that Zavoia is a designated VLOP/VLOSE.

Regulators do not normally pre-approve a startup's DSA classification. Zavoia should document its analysis and implement the applicable controls; ANCOM can inspect or act following monitoring, a complaint, an incident or a referral.

### 4.4 What Law 50/2024 says

Romanian [Law 50/2024, article 5](https://legislatie.just.ro/public/DetaliiDocument/280106) requires Romanian intermediary-service providers to notify ANCOM:

- normally within 45 days of starting to offer the service;
- using the form, content and conditions established by an ANCOM decision;
- with changes to notified information reported within 10 days;
- for providers already operating when the law entered into force, within 45 days from the effective date of that ANCOM decision.

Failure to submit the required complete notification or update in the prescribed time/format is punishable under article 33 by a fine of **5,000–30,000 lei**.

The notification supplies provider identity and DSA contact information. It is an information/registration duty, not a licence that gives permission to operate.

### 4.5 Is Zavoia overdue?

The correct answer as of **23 July 2026** is: **the available facts and official evidence do not support declaring Zavoia overdue**. If Zavoia was already offering the classified intermediary service when Law 50 entered into force, the special pre-existing-provider clock applies. If the classified service began later, the start date and the absence of the mandatory procedure create the separate ambiguity described below.

ANCOM's official site still presents the procedure as a [draft decision under consultation](https://www.ancom.ro/consultare/proiect-de-decizie-privind-procedura-de-informare-pentru-furnizorii-de-servicii-intermediare-o-noua-versiune-a-proiectului-de-decizie/). The ANCOM 2026 action plan still lists preparation of the decision, and the current decisions register did not show the final notification-procedure decision:

- [ANCOM 2026 action plan](https://www.ancom.ro/wp-content/uploads/2011/01/PA_2026_public_1.pdf);
- [ANCOM decisions register](https://www.ancom.ro/category/legislatie/decizii-ancom/).

For a provider that began operating after Law 50 entered into force, article 5 says 45 days from commencement, while the mandatory submission procedure is still absent. That creates a genuine timing/procedure ambiguity. Zavoia should not resolve it by guessing.

### 4.6 Concrete next steps

1. Have Romanian DSA counsel record the hosting/online-platform classification and the size-dependent duty map.
2. Inventory the source and deployed product against DSA articles 11–18.
3. Prepare the company identity and authority/user contact details needed for the ANCOM filing.
4. Ask ANCOM in writing whether any action is expected before the implementing decision and retain the response.
5. Monitor the official decisions register; when the decision enters into force, calculate the deadline from the rule applicable to Zavoia.
6. Do not call Zavoia “ANCOM authorised” after notification and do not claim that a filing is already late without official confirmation.

## 5. OUG 49/2009: provider information and the five-day rule

### 5.1 What this law covers

[OUG 49/2009](https://legislatie.just.ro/Public/DetaliiDocument/175406) implements the EU Services Directive framework in Romania. It applies broadly to independent remunerated services. Its “beneficiary” is broader than a consumer and can include a professional user or legal entity.

It excludes or specially treats several fields, including healthcare supplied within the statutory healthcare definition, financial services, regulated parts of electronic communications, transport, temporary-agency work, audiovisual services, gambling, certain social services, private security, and notarial/bailiff activities. Sector-specific rules can also add requirements.

Zavoia has two potentially relevant roles:

- Zavoia supplies a platform/SaaS service to its recipients;
- Marketplace providers supply their own offline services to customers.

The provider performing the offline service remains responsible for its own legal information. Zavoia can collect and display that information and can require accuracy in the provider agreement, but should not silently claim that it becomes the offline provider.

### 5.2 What information can be required

Article 26 includes, depending on the provider and service:

- provider name, legal form, address and contact details;
- registry, authorisation, regulated-profession and VAT information where applicable;
- general terms and clauses, if used;
- a price fixed in advance, where one exists;
- main service characteristics;
- professional liability insurance or guarantee information where applicable;
- relevant codes of conduct and dispute-resolution information.

The statute allows several delivery methods: direct communication, easy access at the place where the service/contract occurs, easy electronic access, or inclusion in information documents. It does **not** establish that every possible field must be printed publicly on every Marketplace card.

The correct implementation starts with a field-by-field/category-by-category legal basis. Some identity visibility also follows from other laws, including e-commerce and P2B rules, but those should not be confused with OUG 49.

### 5.3 What the five-day provision actually says

Article 26(4)–(5) requires the information to be supplied completely, correctly, precisely and in time:

- before contract conclusion; or
- where there is no written contract, before the service is performed.

The interval between providing the information and contracting/actual performance normally cannot be shorter than five days. The beneficiary may agree **in writing** to shorten it.

Important consequences:

- The nonbinding Zavoia appointment model does not automatically make the rule disappear, because the statute separately refers to actual service where no written contract exists.
- The rule does not automatically ban same-day or next-day appointments.
- Zavoia should not force every user to wait five days if a valid written reduction can be captured.
- It must be verified under Romanian law whether the proposed electronic action/text creates the required written agreement and what evidence must be stored.
- The analysis must be performed for the provider categories actually offered; excluded healthcare and sector-regulated services need their own mapping.

An implementation could, if counsel validates it, place the required provider/service information before the booking action and record a concise affirmative statement for appointments occurring sooner than five days. That statement should not falsely turn the appointment into a binding contract; it would record only the beneficiary's agreement to a shorter information interval.

### 5.4 Complaints

Article 27 requires contact details for complaints/information requests and evidence that the provider answered complaints as soon as possible and no later than 30 calendar days. Zavoia should distinguish:

- a complaint to Zavoia about the platform, listing, review or account; and
- a complaint to the provider about the offline service.

Both routes can be made clear without Zavoia promising to adjudicate the quality or price of every offline service.

### 5.5 Who verifies or enforces this

- Romanian services/consumer counsel maps categories, fields, delivery method and the short-notice record.
- The provider supplies and warrants the accuracy of its own information.
- Zavoia decides which fields and evidence the platform will collect.
- ANPC can inspect and sanction articles 26–27 where consumer interests are or may be affected. The official text provides fines of **1,000–10,000 lei** for article 26 and **1,000–5,000 lei** for article 27.
- Sector/professional regulators and courts can be relevant for regulated services.

This is a substantive assessment, but it is **not evidence that every existing short-notice Zavoia appointment is unlawful**.

## 6. DAC7: tax reporting for platform-facilitated personal services

### 6.1 Why DAC7 appears in the audit

DAC7 covers certain platform-facilitated activities and expressly includes time- or task-based **personal services**, including services performed physically offline after facilitation through a platform. A platform does not need to process the payment to be within the definition.

The exclusions are narrow. Software that, without further intervention in carrying out the relevant activity, exclusively processes payments, merely lists/advertises, or only redirects users can be excluded. Zavoia's provider/service/time selection and appointment creation make the pure-listing exclusion unlikely, but the meaning of “further intervention,” platform/operator status and the other exclusions remain part of the tax classification.

Official sources:

- [Directive (EU) 2021/514](https://eur-lex.europa.eu/eli/dir/2021/514/oj/eng);
- [OG 16/2023 — Romanian implementation](https://legislatie.just.ro/Public/DetaliiDocument/264508);
- [ANAF DAC7 guide](https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/AEOI/GhidDAC7.pdf);
- [ANAF Order 1226/2023 — verification procedure](https://legislatie.just.ro/Public/DetaliiDocument/273737).

### 6.2 Why applicability remains unresolved

A DAC7 `Relevant Activity` must be carried out for **consideration** paid or credited to the seller whose value is known or reasonably knowable by the platform. Whether it is reportable also depends on the operator's status, the seller's status and the statutory exclusions.

Zavoia records:

- the provider and selected service;
- the displayed/snapshotted price;
- the requested appointment date/time;
- appointment statuses recorded by the platform.

Zavoia does not presently process the offline payment. Under the chosen nonbinding model, an appointment can be cancelled, missed, changed or performed at a different final price. A listed or snapshotted amount therefore does not automatically prove the consideration actually paid or credited.

The key tax question is whether, considering the live workflow and all data available to Zavoia, actual consideration is nevertheless **reasonably knowable**. That is a DAC7 interpretation for tax counsel, not a frontend bug and not something company management should guess.

### 6.3 What does not decide DAC7

- No online payment: **not enough by itself** to exclude Zavoia.
- Nonbinding appointment: important to the facts, but **not an automatic exclusion**.
- Small company size: DAC7 has no general startup/SME exemption.
- Fewer than 30 personal-service appointments or less than EUR 2,000: the low-volume exclusion applies to qualifying sellers of **goods**, not generally to personal-service sellers.
- A displayed price: not automatically proof of actual consideration.

### 6.4 What to do now

Give Romanian tax counsel a short factual pack containing:

- the exact appointment lifecycle and status meanings;
- that authenticated Dashboard owners/team members can manually set `COMPLETED`, and whether that status reliably proves actual performance or consideration;
- displayed/snapshotted price behavior;
- whether providers can change price offline;
- all provider, customer and appointment data available to Zavoia;
- whether Zavoia charges any amount tied to an individual appointment;
- whether providers report actual transactions or consideration to Zavoia.

Ask for a written answer on:

1. whether Zavoia is a reporting platform operator;
2. whether the facilitated activities are relevant activities for consideration;
3. whether consideration is known or reasonably knowable;
4. if outside scope, what product changes would trigger reassessment;
5. if inside scope, the first reporting period and due-diligence requirements.

If in scope, Zavoia would need seller identity/tax due diligence, verification, recordkeeping and annual reporting that includes quarterly consideration/activity information and relevant fees/taxes. Reporting is generally due by 31 January after the reporting year. ANAF verifies and enforces the Romanian regime and exchanges reportable information with other EU tax authorities.

Ordinary reporting/due-diligence failures can attract fines of **20,000–100,000 lei**. Website-blocking provisions should not be generalized from special rules aimed at specified non-EU operator cases.

Until the tax memo exists, classify DAC7 as an **assessment**, not a confirmed current violation. Reassess immediately if Zavoia adds payment, deposits, transaction commission, reliable service-completion reporting or actual-price reporting.

## 7. EAA, Romanian accessibility law and company size

### 7.1 Why Marketplace accessibility can be a legal question

The European Accessibility Act, implemented in Romania by Law 232/2022, applies from 28 June 2025 to covered products and services. Covered services include consumer **e-commerce services** supplied remotely through websites/mobile services, electronically, at a consumer's individual request, with a view to concluding a consumer contract.

Online payment is not a condition. Therefore a consumer-facing Marketplace journey can potentially be covered even where payment happens later and directly at the venue.

The selected nonbinding appointment model narrows the analysis but does not conclusively resolve the phrase “with a view to concluding a consumer contract.” The customer may use Zavoia to coordinate a meeting at which the offline service and price are finally agreed. Romanian accessibility counsel should analyse that flow rather than assuming either inclusion or exclusion; a written ADR view can provide useful administrative guidance but is not binding pre-clearance or a definitive interpretation.

The Dashboard is relevant to this consumer e-commerce category only where it is genuinely supplied to a legal consumer. A professional using it to run a service business is not a consumer merely because billing is in the individual's name.

Official sources: [Directive (EU) 2019/882](https://eur-lex.europa.eu/eli/dir/2019/882/oj/eng) and [Romanian Law 232/2022](https://legislatie.just.ro/Public/DetaliiDocument/257778).

### 7.2 The microenterprise exemption

At EU level, a microenterprise providing services is exempt from the service requirements. Under the EU SME definition, a microenterprise has:

- fewer than 10 persons; and
- annual turnover no more than EUR 2 million **or** an annual balance-sheet total no more than EUR 2 million.

This is not the same as Romanian “microenterprise” tax status.

Partner and linked enterprises can have to be aggregated:

- partner-enterprise figures are normally added proportionally;
- linked/control-enterprise figures are generally added at 100%;
- indirect ownership/control and certain common-control relationships can matter;
- changes across thresholds ordinarily require analysis across accounting periods.

Official source: [Commission Recommendation 2003/361/EC](https://eur-lex.europa.eu/eli/reco/2003/361/oj/eng).

### 7.3 Romanian drafting problem

Directive 2019/882 article 4(5) exempts service microenterprises from the general service accessibility requirements in article 4(3).

Romanian Law 232/2022 article 4(5) also states a microenterprise service exemption, but refers to Romanian paragraph (3), which addresses urban, suburban and regional transport-service requirements; the Romanian general service requirement is in paragraph (1). This is a material cross-reference mismatch in the official national text.

Zavoia should therefore not rely on the exemption solely because its current standalone numbers appear small. Obtain:

- a Romanian accessibility opinion on the national provision; and
- if useful, written guidance from the **Autoritatea pentru Digitalizarea României (ADR)**, understanding that such guidance is not binding pre-clearance.

ADR—not ANPC—is the Romanian surveillance/enforcement authority identified for e-commerce services under Law 232/2022.

### 7.4 Evidence needed from the accountant and management

For the latest relevant accounting periods, collect:

- annual-work-unit headcount, including owner-managers/working partners where required;
- turnover;
- balance-sheet total;
- cap table and voting rights;
- shareholder or control agreements;
- board appointment/removal rights;
- all partner and linked enterprises, including indirect links.

Counsel applies those facts to the statutory test. Engineering cannot infer the exemption from the repository or a Romanian tax label.

### 7.5 What happens after classification

- **Covered and not exempt:** perform an accessibility compliance audit of the full consumer journey on web and mobile, implement applicable service/accessibility requirements, publish the required service-conformity information in accessible general terms or an equivalent document, and establish an internal monitoring/feedback process.
- **Exempt:** retain the calculation and legal conclusion, review it annually and after ownership/headcount/financial changes.
- **Scope uncertain:** obtain Romanian counsel's written answer and, if useful, ADR administrative guidance before calling existing UI defects statutory EAA violations.

Accessibility improvements remain good product and risk-management practice even if Zavoia is exempt. That product benefit should not be confused with a confirmed legal violation.

## 8. Which laws actually use company-size exemptions

One “we are a small company” conclusion cannot be reused across every law.

| Regime | Size effect |
|---|---|
| DSA | Article 15(2) exempts qualifying micro/small intermediary providers from article 15(1) transparency reporting unless designated VLOP. Article 19 exempts them from Section 3 except article 24(3), and article 29 separately addresses the Section 4 marketplace exemption where relevant. Articles 19 and 29 preserve their exemptions for 12 months after loss of micro/small status unless VLOP. These exemptions do **not** remove the baseline intermediary/hosting duties in articles 11–14 and 16–18. |
| DSA / Romanian Law 50 notification | No general micro/small exemption from the Romanian intermediary-provider notification duty was identified. |
| P2B Regulation | Small-enterprise status affects the internal complaint-system and mediator obligations. It does not remove the core business-user terms, ranking, change-notice and restriction/suspension transparency rules. |
| EAA / accessibility | EU law has a microenterprise exemption for service providers, subject to the Romanian cross-reference issue explained above. |
| DAC7 | No general SME/startup exemption. The seller exclusions are activity-specific, not a platform-company-size safe harbour. |
| OUG 49/2009 | No general exemption identified merely because Zavoia or a provider is small. |
| Consumer law / GDPR / ePrivacy | Being a startup does not generally remove the relevant customer and data obligations. Some duties have their own risk/proportionality rules, which are not blanket exemptions. |

The EU thresholds most likely relevant here are:

- **microenterprise:** fewer than 10 persons and turnover no more than EUR 2 million **or** balance-sheet total no more than EUR 2 million;
- **small enterprise:** fewer than 50 persons and turnover no more than EUR 10 million **or** balance-sheet total no more than EUR 10 million.

The accountant provides the numbers and relationship evidence. Counsel determines how they are aggregated and which statutory exemption they satisfy. Management should store the signed conclusion and repeat the check after ownership changes and at least annually.

## 9. Dashboard B2C: person billing is not consumer use

### 9.1 “Consumer” of what?

In this section, “consumer” means a person acquiring the **Zavoia Dashboard digital/SaaS service** for purposes outside their trade, craft, business or profession. It does not mean a customer booking a provider in the Marketplace.

The legal test is the purpose of the specific transaction. The CJEU has treated the concept objectively: professional knowledge or being a natural person does not decide it; whether the contract relates to professional activity does. See [CJEU, Costea, C-110/14](https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=CELEX:62014CJ0110).

Examples:

- a self-employed hairdresser uses a personal card to pay for Zavoia calendar/CRM/listing tools: **professional purpose**;
- an individual psychologist receives the invoice in their own name and uses Zavoia for their practice: **professional purpose**;
- a natural person buys a tool genuinely for private household purposes unrelated to any profession: potentially **consumer purpose**.

The card being personal or corporate does not determine the result. Having an SRL/PFA does not determine the result. A person can contract professionally in their own name.

### 9.2 What the product actually is

The audited Dashboard is structured as professional operating software:

- onboarding asks for business name, industry, location, working hours, invited team members and team/solo setup; services are configured later;
- wizard completion creates a business workspace and trial;
- core routes cover calendar, locations, services, team, customers/CRM, Marketplace publication and Website Builder;
- paid checkout is owner-only and tied to the workspace;
- billing already supports both a `company` and a `person` invoice recipient;
- fiscal code/registration fields are required only for company billing.

Relevant source evidence:

- Dashboard routes: `/home/ted/zavoia/admin-dashboard/src/App.tsx`;
- wizard input and workspace creation: `/home/ted/zavoia/admin-api/src/modules/wizard`;
- billing entity model and validation: `/home/ted/zavoia/admin-api/src/entities/business.entity.ts` and `/home/ted/zavoia/admin-api/src/modules/business/business.service.ts`;
- billing UI: `/home/ted/zavoia/admin-dashboard/src/features/settings/components/BillingAndSubscriptionV2.tsx`.

Allowing “person” billing is therefore correct. It supports individual professionals and does not prove that Zavoia is selling a private consumer product.

### 9.3 Recommended model

Make the Dashboard **professional-use-only**, while allowing:

- companies;
- sole traders/PFAs and other individual professionals;
- a natural person acting for their own professional activity;
- personal or business payment cards;
- invoices to a company or to the individual professional, as permitted by accounting/tax requirements.

Do not force company details where the buyer does not contract through a company.

At workspace/trial creation, show a clear statement such as:

> I am creating this workspace for my trade, business, craft or professional activity, including where I operate as an individual professional.

As an evidence-hardening control—not as a standalone statutory checkbox requirement—record:

- user and workspace;
- statement/SaaS Agreement version;
- timestamp;
- acceptance action;
- only technical evidence that is necessary and proportionate, such as session/IP/user agent where justified by the privacy and retention assessment.

This statement is evidence of the intended and represented purpose. It is **not** a waiver that can remove mandatory consumer rights where the real transaction is genuinely private.

Keep two concepts separate in code, UI and documents:

- **billing entity:** company or person;
- **contracting capacity/purpose:** professional or consumer.

### 9.4 When a real Dashboard consumer flow would be needed

If Zavoia permits, supplies or in practice accepts the Dashboard for genuine private-purpose use—even without intentionally marketing it that way—it should build the appropriate B2C SaaS path. That path would require a separate review covering:

- consumer pre-contract information and fair terms;
- statutory withdrawal and the online withdrawal function where applicable;
- immediate-start requests/acknowledgments;
- digital-service conformity, updates and remedies;
- consumer complaint/SAL information;
- consumer billing and cancellation behavior.

A professional-use clause cannot be used as camouflage if actual private use is encouraged or accepted. Conversely, Zavoia does not need to design a consumer checkout merely because an individual professional uses a personal card.

### 9.5 Who verifies or enforces this

- Zavoia management defines and consistently markets the professional-use product.
- SaaS/consumer counsel validates the clause, acceptance evidence and edge-case handling.
- The accountant validates invoice/VAT/e-Factura fields; the accountant does not decide legal consumer status.
- ANPC can investigate a genuine consumer transaction or misleading classification.
- Courts decide disputed status from the objective facts.

The current source gaps are not that “Zavoia accepts personal cards.” The evidence-hardening gaps include the absence, at workspace/trial creation, of the proposed professional-purpose statement, the relevant versioned agreement/statement acceptance evidence, and an express record of whether the user contracts personally or represents another person/entity. These are recommended controls for the selected product position, not proof of standalone legal noncompliance.

## 10. Who does what

| Actor | Required output | Why this actor |
|---|---|---|
| Zavoia management/product | Written nonbinding appointment decision; professional-only Dashboard decision; true description of prices, cancellation, data uses and provider operations | Lawyers and engineers cannot invent the business facts |
| Romanian contract/consumer counsel | Short opinion on appointment effect; OUG 49 matrix; free-account OUG 141/OUG 34 classification; Dashboard professional-purpose wording | These depend on Romanian contract and consumer law |
| Romanian DSA counsel | Hosting/platform classification; baseline/additional duty matrix; ANCOM timing advice | DSA classification and national procedure |
| Romanian tax counsel | DAC7 reporting-operator/consideration memo | DAC7 is a tax reporting regime administered by ANAF |
| Accountant/finance | Headcount, turnover, balance sheet, ownership/linked-enterprise pack; billing/e-Factura facts | These cannot be inferred from code and determine size status |
| Accessibility counsel; ADR guidance | Counsel opinion on EAA/Law 232 scope and the Romanian microenterprise exemption; optional written ADR guidance | ADR is the competent Romanian authority for e-commerce-service accessibility, but its guidance is not binding pre-clearance |
| Privacy counsel/DPO | Data-purpose/legal-basis/retention/vendor map; marketing consent migration | OUG 141 classification depends on actual purposes, and GDPR/ePrivacy apply independently |
| Engineering/design/content | Implement only the settled product/legal requirements and preserve acceptance/evidence records | Classification questions should not be converted into speculative features |

No regulator generally reviews and approves the entire app before launch. Verification usually happens through a filing duty, market surveillance, a complaint, a tax review, a content incident, an investigation or court proceedings. The purpose of the written internal/counsel records is to show that Zavoia identified the correct regime, established the facts and implemented a reasoned conclusion.

## 11. Ordered action plan

### Phase 1 — implement the settled appointment model and consent fix

1. **Nonbinding appointment package**
   - approve the exact nonbinding appointment wording;
   - align booking buttons, status messages, emails and provider terms;
   - remove unsupported venue-fee wording;
   - introduce fixed-versus-estimated price semantics;
   - ensure cancellation settings do not imply financial liability;
   - preserve the relevant appointment disclosure/policy evidence.

2. **Marketing consent data fix**
   - default optional marketing preferences to false;
   - migrate or invalidate unsupported existing `true` values;
   - collect real channel-specific opt-in before sending marketing.

### Phase 2 — complete classifications that require facts

3. **Decide the Dashboard product position**
   - confirm whether it is professional-use-only while retaining person/company billing;
   - if yes, add the proposed professional-purpose evidence at workspace/trial creation;
   - if Zavoia permits or in practice accepts private-purpose use, design the separate B2C path.
4. Create the Marketplace account data-purpose/runtime-vendor map.
5. Have counsel produce the OUG 141/OUG 34 account conclusion.
6. Complete the OUG 49 provider-category and information-delivery matrix.
7. Obtain the accountant's SME/linked-enterprise evidence pack.
8. Obtain the DAC7 tax memo.
9. Obtain the EAA/Law 232 scope and exemption opinion from Romanian counsel and, if useful, written administrative guidance from ADR.

### Phase 3 — DSA and regulator readiness

10. Record the DSA hosting/online-platform classification.
11. Verify and implement the applicable articles 11–18 controls.
12. Prepare ANCOM notification data.
13. Ask ANCOM for written timing guidance and monitor the final implementing decision.

### Phase 4 — reassess only when a trigger changes

Run a focused reclassification before adding:

- customer payment, deposits, no-show/cancellation fees or damages;
- a transaction commission tied to performed appointments;
- reliable reporting of actual offline consideration;
- a binding provider/customer performance guarantee;
- private-purpose Dashboard use;
- optional data use such as targeted advertising or unrelated profiling;
- a material ownership/headcount/turnover change.

## 12. Items that should not be called confirmed bugs today

Do **not** currently state that:

- every Zavoia appointment is a provider–customer contract;
- Zavoia must force attendance, payment or performance;
- every appointment needs a statutory withdrawal button;
- same-day appointments must be disabled for five days;
- every free account is automatically “paid for” with personal data;
- Zavoia is already late with the Law 50/2024 ANCOM notification;
- Zavoia is definitely reportable under DAC7;
- Zavoia is definitely noncompliant with the EAA before scope and exemption are resolved;
- a person invoice or personal card makes the Dashboard B2C;
- small-company status removes all DSA, DAC7, consumer, privacy or services-law duties.

The concrete current work is narrower: align the app with the appointment and professional-SaaS models Zavoia has chosen, fix consent evidence, build the factual maps, and obtain short specialist answers for the classifications that source code cannot decide.

## 13. Official-source index

- [Commission guidance on Directive 2011/83/EU](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52021XC1229(04))
- [Directive 2011/83/EU on consumer rights](https://eur-lex.europa.eu/eli/dir/2011/83/oj/eng)
- [Romanian Civil Code](https://legislatie.just.ro/Public/DetaliiDocument/205332)
- [OUG 34/2014 — Romanian consumer rights](https://legislatie.just.ro/Public/DetaliiDocument/307805)
- [OUG 141/2021 — digital content and services](https://legislatie.just.ro/Public/DetaliiDocumentAfis/250054)
- [Directive (EU) 2019/770](https://eur-lex.europa.eu/eli/dir/2019/770/oj/eng)
- [Digital Services Act — Regulation (EU) 2022/2065](https://eur-lex.europa.eu/eli/reg/2022/2065/oj/eng)
- [Romanian Law 50/2024](https://legislatie.just.ro/public/DetaliiDocument/280106)
- [ANCOM draft notification procedure](https://www.ancom.ro/consultare/proiect-de-decizie-privind-procedura-de-informare-pentru-furnizorii-de-servicii-intermediare-o-noua-versiune-a-proiectului-de-decizie/)
- [ANCOM decisions register](https://www.ancom.ro/category/legislatie/decizii-ancom/)
- [OUG 49/2009 — services](https://legislatie.just.ro/Public/DetaliiDocument/175406)
- [Directive (EU) 2021/514 — DAC7](https://eur-lex.europa.eu/eli/dir/2021/514/oj/eng)
- [OG 16/2023 — Romanian DAC7 implementation](https://legislatie.just.ro/Public/DetaliiDocument/264508)
- [ANAF DAC7 guide](https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/AEOI/GhidDAC7.pdf)
- [Directive (EU) 2019/882 — European Accessibility Act](https://eur-lex.europa.eu/eli/dir/2019/882/oj/eng)
- [Romanian Law 232/2022 — accessibility](https://legislatie.just.ro/Public/DetaliiDocument/257778)
- [Commission Recommendation 2003/361/EC — SME definition](https://eur-lex.europa.eu/eli/reco/2003/361/oj/eng)
- [CJEU C-110/14, Costea](https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=CELEX:62014CJ0110)
