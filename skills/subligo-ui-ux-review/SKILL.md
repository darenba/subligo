---
name: subligo-ui-ux-review
description: Use when improving the public storefront or admin experience in Subligo. Focus on conversion, hierarchy, spacing, responsive layout, header/navigation quality, brand consistency, and preserving existing ecommerce flows.
---

# Subligo UI/UX Review

Use this skill when updating visual structure in Subligo's `apps/web` or `apps/admin`.

## Goals

- Keep the experience commercial, clear, and premium.
- Preserve working logic, routes, pricing, personalization, and checkout flows.
- Improve hierarchy before adding decoration.
- Prefer reusable changes over one-off styling.

## Workflow

1. Identify the affected route and its data source.
2. Inspect the existing layout before editing.
3. Fix structural issues first:
   - container width
   - header and navigation
   - hero composition
   - CTA hierarchy
   - card consistency
   - mobile overflow
4. Reuse existing global tokens and shared UI helpers when possible.
5. Keep copy direct and commercial.
6. Validate with live HTTP checks after edits.

## Subligo-specific heuristics

- The logo/banner must never compete with the navigation.
- Public pages should prioritize `Catalogo`, design lab access, and conversion CTAs.
- Product pages should center the preview and customization flow.
- Admin pages should prioritize density, clarity, and scanability over decoration.
- Use the SubliGo palette consistently:
  - dark ink background
  - warm paper surface
  - yellow accent
  - lime CTA
  - sky/plum as supporting accents

## Avoid

- Overlapping header zones
- Double-primary CTAs with equal weight
- Huge paragraphs above the fold
- Decorative blocks that push product selection lower
- Changes that hardcode data already coming from the app

## Validation

After edits, verify:

- `http://localhost:3100/`
- `http://localhost:3100/catalogo`
- one product page
- `http://localhost:3101/dashboard`
- `http://localhost:3102/api/docs`

