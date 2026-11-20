---
name: whitelabel-theming
description: Use for tenant branding in the streaming SaaS: logo, colors, fonts, app name, favicon, legal links, email and mobile branding. Covers the tenant_branding token payload, CSS variable injection in Next.js, Tailwind 4 theme variables, contrast checks and mobile runtime brand. Triggers on branding, theme, white-label, studio brand settings.
---

# White-label theming

One codebase, N brands. A tenant changes brand without a rebuild or a deploy.

## Token payload (`tenant_branding.tokens`, validated by Zod)

```ts
{
  appName: string, logoMediaId: string, faviconMediaId: string, ogImageMediaId?: string,
  colors: { primary, primaryForeground, background, surface, text, muted, accent, danger }, // #rrggbb
  radius: 'none'|'sm'|'md'|'lg', fontFamily: 'system'|'inter'|'poppins'|'merriweather',
  legal: { termsUrl?, privacyUrl?, supportEmail? }
}
```

Fonts are an allowlist, self-hosted; tenants cannot inject arbitrary font URLs or CSS.

## Web injection

`proxy.ts` resolves the tenant; the root layout (a Server Component) loads branding through the
cached tenant loader and renders `<style>:root{--color-primary:#...}</style>` plus metadata
(title, icons, Open Graph). Components use Tailwind 4 theme variables declared once in `@theme`
(`--color-primary: var(--tenant-primary, #e50914)`). No per-tenant classes, no per-tenant CSS files.
Cache key includes the tenant id; invalidate on branding save.

## Safety

- Colors validated as `#rrggbb` only; never write tenant strings into CSS unvalidated (CSS injection).
- Logos and icons go through the media module: size cap, content-type sniffing, SVG sanitized or rejected.
- On save compute WCAG contrast of `text` on `background` and `primaryForeground` on `primary`;
  below 4.5:1 returns a validation error with the measured ratio.
- A tenant with no branding falls back to the platform default theme.

## Mobile

The app fetches `GET /v1/branding` for the tenant bound at login or by deep link, caches it in
storage, and builds a theme object for NativeWind variables at boot. Store listing name and icon
are ours until per-tenant store builds (Phase 8).

## Email and other surfaces

Transactional emails take `appName`, logo URL and primary color from the same payload.

## Tests

- Two tenants, two hosts: Playwright asserts different title, logo and `--color-primary`.
- Invalid color, low contrast and oversized logo are rejected with specific errors.
- Cache invalidation: saving branding changes the page within the cache TTL.
