# Website Copy Guidelines

## Product Intent

Website Builder helps an owner shape and publish a service-business website. The interface should
feel like an editor, not an online shop. Copy should make the next decision clear without exposing
implementation language such as draft records, catalog keys, checkout sessions, or cart state.

## Canonical Vocabulary

| Concept | English | Romanian |
| --- | --- | --- |
| Module name | Website | Website |
| Website in a sentence | website | site |
| Editor | Website Builder | Constructor de site |
| Visual choice | style | stil |
| Paid choice | premium option | opțiune premium |
| Free entitlement | Included | Inclus |
| Purchased entitlement | Unlocked | Deblocat |
| Waiting for grouped payment | Selected | Selectat |
| Grouped payment panel | Selected premium options | Opțiuni premium selectate |
| Add grouped option | Add to selection | Adaugă în selecție |
| Remove grouped option | Remove from selection | Elimină din selecție |
| Immediate payment | Unlock now · {{price}} | Deblochează acum · {{price}} |
| Grouped payment | Unlock selected | Deblochează selecția |
| Generic booking action | Book now | Programează acum |
| Location booking action | Book at {{name}} | Programează la {{name}} |

Do not use `cart`, `add to cart`, `product`, `item`, `layout`, `variant`, or `owned` in customer-facing
Website Builder copy. Those terms can remain in internal code where renaming would add risk without
changing the experience.

## State Language

Keep these state families distinct:

- `Saved` describes whether editor changes reached the server.
- `Live` or `Online` describes whether visitors can see the website.
- `Selected` describes a premium option waiting for grouped payment.
- `Unlocked` describes a premium option the business can use permanently.
- `Previewing` describes a temporary visual choice that is not saved or publishable yet.

Never use `published` as a synonym for `saved`, or `selected` as a synonym for `unlocked`.

## Premium Flow

- Explain the outcome first: the option is unlocked permanently after a one-time payment.
- Use the same entitlement language for immediate and grouped payments.
- Say that other selected options stay selected when an immediate payment covers only one option.
- For mixed currencies, show localized subtotals and block payment until one currency remains.
- Preserve the selection after cancellation, failure, timeout, or an unavailable payment status.
- Do not imply that previewing a locked style saves it to the website.

## Owner Guidance

- Prefer short, direct sentences and active voice.
- Name what visitors will see, not the underlying data model.
- Distinguish blocking errors from readiness guidance.
- Tell the owner how to recover when an action fails.
- Keep controls explicit: `Show {{name}}`, `Remove question {{number}}`, and similar action labels.
- Use persistent field labels; placeholders are examples, not labels.

## Visitor Copy

- Use booking language that works across beauty, wellness, dental, veterinary, pet care, training,
  and other service industries.
- Romanian generic booking copy uses `Programează acum`, not `Programează-te`.
- Location-specific booking copy uses `Programează la {{name}}`.
- Avoid claims that are not true for every industry, such as every visit starting with a consultation.
- Keep `Vino la {{name}}` where a warm location invitation is appropriate.

## Romanian Style

- Use `site` in sentences. Avoid `website-ul`, `ciornă website`, and repeated `versiune de lucru`.
- Prefer natural Romanian over word-for-word translation.
- Use `filă` for a browser tab and `dispozitiv` for a device.
- Use `evaluare` for the aggregate score and feminine `Verificată` when it describes a review.
- Use `Retrage site-ul` for the action that takes a live website offline.

## Copy Ownership

- Website Builder UI copy lives in `src/locales/{en,ro}/website.json`.
- Website-related API error copy lives in `src/locales/{en,ro}/messages.json`.
- Marketplace copy must not own or duplicate the `businessPage` translation subtree.
- Backend catalog names remain available for Stripe and admin tooling.
- Dashboard catalog labels and descriptions must be derived from stable `sectionType` and
  `variantKey` values through Website translations.
- Unknown catalog keys must fall back to localized generic Website copy, never backend English.

## Review Checklist

- EN and RO have the same key shape and interpolation variables.
- No customer-facing `cart`, `add to cart`, `layout`, `variant`, or `owned` remains.
- Every implemented section and style has localized display copy.
- Every icon-only Website control has a localized accessible name.
- Payment outcomes state what happened to both access and the current selection.
- Mobile labels remain understandable without relying on nearby desktop-only context.
