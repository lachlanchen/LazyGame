# @lazyingart/game-core

Pure TypeScript contracts for deterministic game authority: canonical state
identity, state-bound legal candidates, hidden-information visibility,
evidence validation, replayable chronicles, one-use delegation, localization,
and revision/idempotency-aware persistence. Exact retry responses use a bounded
window; older request ids remain reserved and fail closed instead of mutating twice.

This package does not contain rules for a particular game. Implement a
`GameAdapter`, keep model output outside authority, and read the repository's
[framework contract](https://github.com/lachlanchen/LazyGame/blob/main/docs/framework-contract.md).

Browser `Storage` is a single-writer demo backend. `AtomicStorageLike` protects
only `mutate` on one session value; create/resume/delete/index remain multi-key
operations. Externally serialize the whole lifecycle or use a transactional
server store whenever multiple writers are possible.

MIT licensed.
