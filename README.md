# PARADOX LAB — The Language Crime Scene

An interactive laboratory for formal language theory. Strings are evidence, properties are clues, machines do the questioning. Every verdict on the site is computed in the browser by tested logic. Nothing is pre-recorded.

| Room | What you do there |
| --- | --- |
| **00 Briefing** | Live pump bench and a stepping stack preview, both driven by the real engines. |
| **01 The Pumping Paradox** | Prove that `L = { aⁿbⁿcⁿ \| n ≥ 0 }` is not context-free. Build and forge strings, walk the 8-step proof with optional hints, cut `s = uvxyz` with draggable or keyboard handles, pump `v` and `y`, and attack the proof by defending the claim. |
| **02 Stack Protocol** | Operate a deterministic PDA for `L = { aⁿb²ⁿ \| n ≥ 1 }`: editable tape, state diagram, live stack, play, pause, step back and forward, a replayable transition log and a rejection casebook. |
| **03 Comparison Chamber** | A real bounded DFA against the PDA on the same tape, plus the pigeonhole argument computed for the current DFA. |
| **04 Field Manual** | Short definitions linked to demos, a grammar derivation for `S → aSbb \| abb`, and the Counterexample Forge. |
| **05 Certificate** | The complete formal proofs and a record of your session. Print, copy or download as text. |

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit, property and UI tests (Vitest)
npm run build      # type-check + production build into dist/
npm run preview    # serve dist/ on http://localhost:4173
npm run qa         # Playwright smoke check (needs `npm run preview` running and
                   #  `npx playwright install chromium` once)
```

There is no backend, account or network dependency. Fonts are bundled locally.

## Architecture

```
src/
  logic/            pure, framework-free mathematics (all unit-tested)
    languages.ts    membership checkers that name the violated condition
    pumping.ts      uvxyz decomposition, constraints, pumping, case classification,
                    attack evaluation, exhaustive per-p audit
    pda.ts          generic deterministic PDA engine with recorded traces
    stackProtocol.ts  the aⁿb²ⁿ machine, halt explanations, stack table
    dfa.ts          bounded DFA family for the comparison chamber
    grammar.ts      S → aSbb | abb derivations, pigeonhole collision finder
  features/         UI for each experiment (pumping/, stack/, certificate/)
  components/       shared evidence primitives: tiles, count bars, stamps, notation
  pages/            one component per room
  app/              shell, hash router, session case log
```

The simulator never animates canned states. `run()` executes the PDA once per input and records every configuration. Playback, including stepping backwards and jumping from the log, selects configurations from that trace, so a rewind restores exactly the state, head position and stack the machine had.

## Mathematical notes

- **Five-part decomposition.** The proof uses the context-free lemma (`uvxyz`, both `v` and `y` pumped, `|vxy| ≤ p`, `|vy| > 0`), not the regular-language `xyz` form.
- **Boundary crossings are handled.** The case analysis does not assume each part lies inside one block. Case A (straddle) breaks the order at `i = 2`. Case B (uniform) leaves one of `a`/`c` frozen at `p` while another count changes. The key claim is that `vxy` can never contain both `a` and `c`, because that would need length at least `p + 2`.
- **Illustration ≠ proof.** Proof Attack and the exhaustive audit check decompositions for one concrete `p`, and the UI says so. The general argument covers every `p`. The lemma is presented as a *necessary* condition, never as a test that decides context-freeness.
- **PDA.** `Q = {q0,q1,q2,q3}`, `Γ = {X, Z₀}`. Each `a` pushes two `X`, each `b` pops one, and an ε-move on `Z₀` enters the accepting `q3`. It accepts by final state with all input consumed. Stacks are written top-first, so `XXZ₀` has `X` on top. Tests check the machine against the language definition on all 2,047 strings over `{a,b}` of length ≤ 10.

## Testing

`npm test` covers, among other things:

- membership of `abc`, `aabbcc`, `aaabbbccc`, and rejection by count and by order;
- five-part decompositions, constraint checks, straddling `v`/`y` cases, and an exhaustive audit for `p = 1…7` that finds zero survivors, with no `vxy` window touching all three blocks;
- the exact stack evolution for `aabbbb` (`Z₀ → XXZ₀ → XXXXZ₀ → XXXZ₀ → XXZ₀ → XZ₀ → Z₀`, then accept), rejections of `ab`, `aabbb`, `aabbbbb`, `ba`, `ε` and foreign symbols, and acceptance of `aaabbbbbb` (= a³b⁶, which is in the language);
- determinism, rewind and replay equivalence, and UI tests for stepping, rewinding, autoplay, keyboard control, malformed and oversized input, and every route.

## Known limitations

- The exhaustive audit is capped at `p ≤ 8` so it stays instant. Larger `p` only adds more of the same cases.
- The simulator implements deterministic PDAs. Nondeterministic machines are detected and reported, not explored branch by branch.
- The investigation record is stored in this browser's `localStorage` when available. If storage is blocked it lasts only for the visit.
