# DevAtlas design system

> **Purpose:** Record the shared visual and interaction rules. **Related:** [`appflow.md`](appflow.md) describes journeys; [`prd.md`](prd.md) owns behavior; [`trd.md`](trd.md) sets technical constraints. Apply `$design-system-engineering` when implementing shared interface foundations.

**Status:** Approved direction; tokens are implementation proposals | **Design owner:** Product owner | **Platform:** Responsive web

**Styling implementation:** Tailwind CSS v4.3.3 is the primary frontend styling system (verified as the current stable package on 20 October 2026). The official `@tailwindcss/postcss` plugin compiles utilities from `apps/web/postcss.config.mjs`; `apps/web/src/app/globals.css` imports Tailwind and maps semantic CSS variables through `@theme inline`. Component layout, spacing, responsive behavior and interaction states use utilities where they aid reuse. Global CSS keeps theme values, base/focus/reduced-motion behavior and the bespoke atlas illustration.

## Design goals and references

- **[Confirmed]** Create an original, premium developer-focused experience with the quality and clarity associated with Linear, Vercel and Raycast.
- **[Confirmed]** Prioritize typography, spacing, readability, navigation and visual consistency. Avoid generic dashboard templates and excessive gradients.
- **[Recommendation]** Use a content-first editorial layout: a calm dark/light neutral canvas, clear hierarchy, restrained accent color, purposeful borders and high-contrast code surfaces. Do not copy another product's branding.

## Foundations

- **Color [Recommendation]:** Semantic CSS variables for canvas, surface, elevated surface, text, muted text, border, accent, success, warning and error; values should meet WCAG contrast targets in both themes.
- **Themes [Confirmed]:** Light and dark themes. Persist preference locally; use system preference before an explicit choice. Tailwind semantic color utilities reference CSS variables that switch from `data-theme`; avoid a flash of the wrong theme where possible.
- **Typography [Recommendation]:** Readable sans-serif for interface/body and a legible monospace for code. Use a limited responsive scale and comfortable article line lengths.
- **Spacing/layout [Recommendation]:** Consistent spacing scale, responsive content width, clear section rhythm and persistent but compact navigation/search access.
- **Motion [Recommendation]:** Small state transitions only; honor `prefers-reduced-motion`.
- **Icons [Confirmed]:** React Icons, with accessible names supplied by adjacent text or labels.

## Shared components and states

- Site header/navigation with current-page indication, search entry and mobile menu.
- Search input/results and technology category filter.
- Technology cards, release feed cards, guide cards, metadata/source links and related-content links.
- Article headings, callouts, prerequisites/steps and syntax-highlighted code blocks with copy control.
- Theme control, breadcrumbs, loading skeleton/status, empty state, retryable error and not-found page.
- Every interactive component has clear keyboard focus, hover/pressed, disabled and relevant loading/error/success behavior.

## Accessibility and responsive requirements

- Use landmarks and semantic heading order; provide accessible names, visible focus, keyboard operation and status announcements for asynchronous results.
- Target WCAG 2.2 AA contrast for text and controls; verify instead of assuming token values are sufficient.
- Support 320 CSS-pixel width without horizontal page scrolling, zoom/reflow and touch-sized controls; adapt navigation and code blocks gracefully.
- Respect reduced-motion preference. Do not rely on color alone to communicate status.
- Test representative mobile (320/375px), tablet (768px) and desktop (1280px) viewports, plus keyboard-only navigation.

## Acceptance and comparison

At mobile, tablet and desktop sizes, inspect home/shell, search, technology article, release article and guide layouts. Verify both themes, focus visibility, contrast, reduced motion, loading/empty/error states and no unintended horizontal overflow. No supplied Figma source exists; compare implementations against this written system, not a claim of pixel-matching external references.

Phase 1.5 verification checks that Tailwind utilities compile in the relocated `apps/web` workspace, the sticky responsive navigation uses theme tokens, and the light/dark canvas color changes when the theme toggle changes `data-theme`. Custom global selectors remain only where they preserve shared browser behavior or bespoke illustration details.

## Related documents and approval

See [`appflow.md`](appflow.md), [`prd.md`](prd.md) and [`trd.md`](trd.md). Product direction is approved in the PDF; detailed token values and component anatomy are reversible engineering decisions to refine during Phase 1.
