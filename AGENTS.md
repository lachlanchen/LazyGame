# Game teaching framework guidance

This workspace contains a reusable teaching framework and three independently
publishable product repositories: `Chess/`, `Poker/`, and `Mahjong/`.

## Authority contract

- Deterministic code owns rules, legal actions, state transitions, scoring,
  hidden-information boundaries, replayable history, and persistence.
- Engines and models provide bounded analysis evidence. They never mutate a
  game or invent an action outside a server/client supplied legal candidate.
- Candidate identifiers bind the complete state, acting player, and action.
  Stale, unknown, or unauthorized selections fail closed.
- A companion may explain or ask questions but never acts. Explicit one-turn
  delegation is issued only to a player-agent through the opaque, consumed
  `DelegationRegistry` capability boundary.
- Hidden cards, tiles, hands, seeds, and private analyses are exposed only to
  the authorized viewer. Spectator and teaching views must not leak them.

## Teaching contract

- Keep exact facts, calculated/search evidence, authored strategy, model prose,
  and analogy visually distinct.
- Never present heuristic "energy", control, safety, odds, or confidence as an
  exact physical quantity.
- Explanations should answer: what can I do, why here/now, what changes, what is
  the likely reply, what should I calculate next, and what principle transfers.
- Variants and simplified lessons must be visibly labeled.
- English, Simplified Chinese, and Japanese strings use stable message keys;
  do not hard-code learner-facing prose inside rules modules.

## Repository and runtime policy

- `Game/` is the reusable framework repository. `Chess/`, `Poker/`, and
  `Mahjong/` are separate Git repositories and later tracked as submodules.
- Do not copy `.git`, `.env`, `data`, `.local`, browser profiles, databases,
  caches, downloaded binaries, or model weights between repositories.
- Models and engines live under each repository's ignored `.local/` tree and
  require pinned source, license, size, and checksum documentation.
- Keep at most one live app/noVNC stack for this workspace. Reuse it between
  product reviews and stop superseded owned processes.
- Do not start overlapping heavyweight builds, engine tuning, or model
  downloads. Check RAM, swap, disk, owned processes, and ports first.

## Baseline gates

Every repository must provide deterministic tests, TypeScript lint/build,
dependency audit, shell syntax checks where scripts exist, and `git diff
--check`. Browser changes require a loopback-only noVNC/CDP desktop and mobile
check with screenshots, zero unexpected console/network errors, and cleanup of
only the exact test sessions it created.
