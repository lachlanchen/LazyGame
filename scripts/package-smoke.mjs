#!/usr/bin/env node

const core = await import('../packages/core/dist/index.js')
const react = await import('../packages/react/dist/index.js')

for (const [name, value] of [
  ['legalCandidates', core.legalCandidates],
  ['replaySession', core.replaySession],
  ['DelegationRegistry', core.DelegationRegistry],
  ['GameFrame', react.GameFrame],
]) {
  if (typeof value !== 'function') throw new Error(`Missing packaged export: ${name}`)
}

process.stdout.write('[package-smoke] PASS\n')
