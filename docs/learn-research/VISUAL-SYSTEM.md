# Visual system: graphics, charts and motion

Status: plan, ready to build. Nothing here is built yet.
Decided by the operator on 2026-09-26: benchmark is grade 8 with readers working in English as a
second language; the deep material stays verbatim; the printable worksheet is deferred to the
roadmap below rather than dropped.

## Why a system rather than one-off drawings

Three diagrams drawn on three different days get three arrow styles, three colours and three ways of
labelling the same thing. Each new one also tends to add words instead of replacing them, which fights
the gate. A small set of primitives keeps every diagram consistent, keeps the accessibility decisions
in one place, and turns the reduced motion switch into a single decision rather than one per
animation. The whole system is planned at roughly 250 lines of JavaScript plus CSS custom properties,
with no new dependencies, so the page stays dependency free and works offline.

## Colour and tokens, semantic rather than decorative

Five roles, each with a light and a dark value and a non-colour equivalent:

| Role | Used for | Non-colour equivalent |
|---|---|---|
| secret | private keys, seed words | solid border, notched corner |
| public | public keys, xpub | solid border, rounded corner |
| hashed | anything hashed or encoded | dashed border |
| address | the final address | double border |
| warning | what leaks, what fails | hatched fill plus the warning box already in use |

Every colour cue gets a second channel, so it survives greyscale, colour blindness, and a black and
white print. Contrast targets: 4.5 to 1 for text and 3 to 1 for graphical shapes, measured per new
pairing and recorded in the commit that adds it.

## Primitives

Diagram:

- `node(label, kind)` - a labelled box. `kind` picks the colour role and the corner shape.
- `flow(from, to, kind)` - an arrow, straight or elbowed, with an optional label.
- `branch(parent, children)` - one parent to many children. This is hardened against normal.
- `group(title, children)` - a labelled container. This is a chain or a format family.
- `legend()` - generated from the same tokens, so a legend can never drift from the drawing.
- `trace(route)` - a highlight that follows one value through a diagram. The only primitive with
  motion.

Chart:

- `barChart(rows)` - label, value, unit, scale, plus a marker row for the reader's own value.

Motion, three primitives and no more:

- `fadeValue(el)` - a value changing in place.
- `drawTrace(route)` - a highlight travelling along a named route.
- `pulseOnce(el)` - one attention nudge, at most once per segment.

Fixed grammar, reused everywhere:

- Durations 120ms micro, 240ms value change, 600ms trace. Ease-out on entry. No bounce, no spring.
- Nothing animates on first paint. Every animation is triggered by a reader action or by a value
  changing.
- `prefers-reduced-motion` turns all three into instant state changes. Motion never carries
  information on its own, so nothing is lost when it is off.
- Viewed end state is always readable without having watched the animation.

## Where each piece goes

| Segment | Diagram | Primitives |
|---|---|---|
| 1 seed | words to bits to checksum, with the reader's own last word marked | node, flow, trace |
| 2 master key | the 512-bit seed splitting into two halves | node, branch |
| 3 path | the path as a labelled ladder, the reader's own path lit | node, flow, trace |
| 4 hardened | two branches from one parent, showing what an xpub reaches | branch, trace |
| 5 key to address | the pipeline per chain, private key to public key to address | node, flow |
| 6 formats | four Bitcoin formats and the nine-chain grid | group, node |
| 1 chart | the randomness comparison: axis labels, stated scale, the reader's value marked | barChart |

## How it gets built and verified

- New file `src/learn-visuals.js`, loaded by `index.html` and by `test/self-test.html`. The suite has
  a drift guard that fails when the two pages load different script sets, so a half-added module is
  caught by `npm test` rather than shipped.
- Styles as CSS custom properties next to the existing tokens in `src/styles.css`, so both themes
  come free.
- A fixture page, `test/learn-visuals-sample.html`, renders every primitive once for eyeballing and
  for screenshots. It is not linked from the app.
- Checks after every application: the reading gate (a diagram can add words), contrast measured and
  recorded per new pairing, the print stylesheet re-checked because the paper wallet depends on it,
  works from `file://` with the network off, and reduced motion proven by forcing the media feature
  and confirming nothing transitions.
- Honest limit: the gate measures reading load, not beauty, and it will not be asked to. Whether it
  looks good is the operator's eye. The deliverable for that judgement is screenshots, not a claim.

## Gotchas found while building it

- **var() does not work in an SVG presentation attribute.** `stroke="var(--viz-secret)"` is not an error, it simply paints nothing, so every diagram rendered as unstyled black shapes while every structural test passed. Colours are set as CSS (`element.style.fill`), and a test now walks a built diagram and fails if a var() appears in an attribute.
- **`<defs>` pollutes naive selectors.** Arrowhead tips and hatch patterns live in the same SVG, so `querySelectorAll("rect")` or `("path")` returns defs children first and a probe of the first one measures an invisible pattern rectangle. Select by the primitive's own group (`g.viz-node rect`, `g.viz-flow path`).
- **A CDN can serve a stale asset after a deploy.** Measured here: `index.html` returns `cf-cache-status: DYNAMIC` (always fresh) while `/src/*.js` and `/src/styles.css` came back `HIT` with an age. So a fresh page can be paired with old scripts. Verify a deploy by fetching the asset with a cache-buster (`?v=<sha>`), and consider purging the cache or shortening the edge TTL for `/src/*`.

## Order

1. Build the system and the fixture page, no content changes. Self-contained and provable: the
   fixture renders every primitive and `npm test` stays green including the drift guard.
2. Apply while recasting segments 2, 3 and 4, so the words and the diagrams are designed together
   instead of one after the other.
3. Apply to segments 1, 5 and 6, and build the chart.
4. Practice pool and teach-back boxes last, so they are not written twice.

## Roadmap, decided and not now

- **Printable worksheet (deliverable D7).** Deferred by the operator on 2026-09-26. One page, the
  ladder plus the five categories, for classroom use. Tracked here so it is a decision rather than a
  forgotten idea, and revisited after the reader sessions, when there is evidence about what a
  reader actually needs on paper.
