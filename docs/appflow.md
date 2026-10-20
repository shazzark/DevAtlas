# DevAtlas application flow

> **Purpose:** Show how visitors and editors move through the primary journeys and states. **Related:** [`prd.md`](prd.md) defines product behavior; [`design-system.md`](design-system.md) defines shared interface behavior; [`trd.md`](trd.md) defines technical constraints.

**Status:** Approved baseline flow | **Product owner:** Product owner | **Platform:** Responsive web

## Primary public journey: find and learn

**User and goal:** A learner or working developer wants to understand a tool, current change, stack combination or practical project.

1. **[Confirmed] Entry:** Visitor opens Home, Technology Explorer, What's New, Stack Guides or Build Guides using responsive primary navigation.
2. **[Confirmed] Discover:** Visitor searches a title/topic or browses the relevant catalog/feed. Search is planned for technologies, releases, integrations and projects; technology category filters narrow results.
3. **[Confirmed] Loading:** The page communicates progress without hiding navigation or creating false success.
4. **[Confirmed] Success:** Visitor opens a detail page with readable, structured content, official/source links, current verification metadata and related items.
5. **[Confirmed] Continue:** Visitor follows a related technology, release explanation or guide, or copies a code sample.

## Primary editorial journey: verify and publish

**User and goal:** An authorized editor turns a source-backed candidate into reviewed public content.

1. **[Confirmed] Entry:** Administrator signs into private administration; unauthenticated requests are denied.
2. **[Confirmed] Draft:** Editor creates or reviews a technology, release, stack guide or build guide; release claims include source and version applicability.
3. **[Confirmed] Review:** An editor checks sources and content; automated monitoring can create drafts only. **[Recommendation]** Require an explicit reviewer action before publication.
4. **[Confirmed] Publish:** An authorized editor publishes after review; public pages/APIs expose only published records. Review and verification timestamps are retained.
5. **[Confirmed] Correct:** Editor can update or withdraw inaccurate content and leave correction provenance.

## Important alternate and failure states

| Trigger | User-visible result | Recovery/next step | Certainty/status |
|---|---|---|---|
| Search has no matches | Clear empty state says no results matched. | Change terms or remove category filter. | [Confirmed] |
| A catalog/feed has no published content | Helpful empty state; no fabricated records. | Use navigation to another available section. | [Recommendation] |
| Content is loading | Accessible loading indication; no stale success claim. | Wait; retry if an error follows. | [Confirmed] |
| Database unavailable | Explicit unavailable/error state; readiness endpoint reports not ready. | Retry later or restore database configuration. | [Recommendation] |
| Content is not published | It does not appear in public results or detail routes. | Admin reviews and publishes it. | [Confirmed] |
| Visitor copies code | Button reports copied or explains failure. | Select code manually if clipboard access is denied. | [Confirmed] |
| Admin session missing/expired | Private route denies access and offers sign-in when configured. | Authenticate; do not render private content. | [Confirmed] |

## Acceptance checks

- A public visitor can move from navigation to a published technology/release/guide and follow related links (PR-01 through PR-05).
- Search results and empty states clearly distinguish matching published items from no matches (PR-05).
- Draft, review and publication transitions are private and server-authorized; public requests never reveal drafts (PR-02, PR-06).
- The core shell, navigation and content remain usable at mobile and desktop widths and via keyboard (TR-05, TR-06).

## Related documents and approval

See [`prd.md`](prd.md), [`trd.md`](trd.md), [`design-system.md`](design-system.md), [`backend-database-schema.md`](backend-database-schema.md) and [`implementation-plan.md`](implementation-plan.md). Flow is derived from the approved product PDF and explicit implementation requirements; details labeled recommendations are reversible engineering choices.
