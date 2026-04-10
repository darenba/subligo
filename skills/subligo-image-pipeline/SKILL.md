---
name: subligo-image-pipeline
description: Use when preparing, replacing, or refining product visuals for Subligo. Focus on mockups, transparent cutouts, apparel surface views, commercial consistency, and safe integration into web-facing UI without breaking existing product logic.
---

# Subligo Image Pipeline

Use this skill when adjusting product visuals in Subligo, especially apparel mockups and storefront imagery.

## Best available image skill

For real bitmap generation or edits, use the built-in `imagegen` skill first.

## Workflow

1. Check whether the asset should be:
   - generated
   - cropped from a provided source
   - cleaned up from a photo/vector export
   - reused across home, catalog, and PDP
2. Prefer web-ready PNG/JPG assets already supplied by the user.
3. Keep filenames stable and descriptive inside the repo.
4. Use one source of truth for apparel surfaces:
   - front
   - back
   - lateral/profile
5. Reuse the same visual set in:
   - design lab
   - product cards
   - hero spots
   - promotional sections where relevant

## Apparel-specific rules

- Front, back, and lateral must read as one coherent family.
- If recoloring is supported in UI, preserve enough neutral texture for tint overlays.
- Do not replace working mockups with lower-quality imagery.
- Prefer transparent-background assets for configurable products.

## Integration targets

- `apps/web/public/mockups`
- `apps/web/components/apparel-mockup.tsx`
- `packages/ui/src/brand-product-art.tsx`
- `apps/web/app/page.tsx`
- product pages that showcase apparel or merch

## Validation

After image changes, verify:

- front/back/lateral switching in the lab
- preview readability on white and dark garment colors
- homepage hero and featured cards
- no broken image paths in `3100`

