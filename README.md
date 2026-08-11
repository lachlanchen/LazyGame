# Game Teaching Framework

Game Teaching Framework turns deterministic game engines into interactive,
evidence-aware teachers. It extracts the reusable authority, candidate,
localization, persistence, and teaching patterns proven in
[Path of Influence](https://github.com/lachlanchen/Weiqi) without pretending
that one rules engine can govern unrelated games.

The framework is intentionally strict:

- deterministic adapters own rules, legal actions, state transitions, scoring,
  hidden information, and replayable event history;
- candidates bind the complete state, actor, and canonical action;
- previews never mutate a session and commitment is explicit;
- engines and models can analyze only server/client-supplied legal candidates;
- every teaching claim is labeled as exact, calculated, engine, authored,
  model-generated, or analogy;
- English, Simplified Chinese, and Japanese use stable message keys.

## Workspace

```text
packages/core/   Pure contracts, candidate binding, redaction, i18n, sessions
packages/react/ Accessible teaching components and controller hooks
apps/demo/       A small complete reference game
Chess/           Chess/Xiangqi/Shogi product submodule
Poker/           Hold'em/Bridge/Guandan product submodule
Mahjong/         Mahjong product submodule
```

The products are independently released at
[Chess](https://github.com/lachlanchen/Chess),
[Poker](https://github.com/lachlanchen/Poker), and
[Mahjong](https://github.com/lachlanchen/Mahjong), then linked here as Git
submodules so their histories and release gates remain separate.

## Quick start

```bash
npm ci
npm run check
npm run dev
```

Open <http://127.0.0.1:5173/>. The demo is intentionally small; its purpose is
to prove stale-candidate rejection, non-mutating previews, explicit commitment,
locale switching, evidence labels, and duplicate-free resume behavior.

## Adapter shape

```ts
interface GameAdapter<State, Action, PublicView, Config> {
  manifest: GameManifest
  initialState(config: Config, seed: string): State
  serializeState(state: State): unknown
  activeActor(state: State): string | null
  legalActions(state: State, actorId: string): readonly Action[]
  canonicalAction(action: Action): unknown
  describeAction(state: State, action: Action, actorId: string): ActionDescription
  applyAction(state: State, action: Action, actorId: string): Transition<State>
  publicView(state: State, viewer: ViewerIdentity): PublicView
  teaching(state: State, action: Action, actorId: string): TeachingBundle
}
```

See [the full contract](docs/framework-contract.md) for state tokens,
visibility, revisions, idempotency, and evidence provenance.

The included browser demo is intentionally single-writer because Web Storage
has no multi-key transaction. `AtomicStorageLike` protects only one-session
`mutate` compare-and-set; it does not make create, resume, delete, or the index
transactional. Production multi-tab or server deployments must externally
serialize the entire lifecycle or use a transactional database.

## Validation

```bash
npm run lint
npm test
npm run build
npm audit --audit-level=high
git diff --check
```

Downloaded models, engines, databases, browser profiles, and evidence stay in
ignored local directories and never enter the repository.

## License and citation

Source is MIT licensed. External engines and models retain their own licenses.
GitHub reads [`CITATION.cff`](CITATION.cff) to expose **Cite this repository**.

```bibtex
@software{chen_game_teaching_framework_2026,
  author  = {Chen, Lachlan},
  title   = {Game Teaching Framework},
  year    = {2026},
  version = {0.1.0},
  url     = {https://github.com/lachlanchen/Game}
}
```

## Support

Support continued open-source work through [GitHub Sponsors](https://github.com/sponsors/lachlanchen)
or visit [Lazying Art](https://lazying.art). Funding links are also declared in
[`.github/FUNDING.yml`](.github/FUNDING.yml).
