# Monolith Demo — Rigour Modularity Enforcement

This demo simulates a common "AI Slop" pattern: outputting one massive file instead of a modular architecture.

## The Scenario

You have a file `src/god.ts` that is 600+ lines long.
Rigour's `max_file_lines` gate is set to `300` (default for `api` preset).

## Run the Demo

### 1. The "Dump" Attempt

The agent dumps all the logic into one file.

```bash
npx @rigour-labs/cli check
```

**Result**: 🛑 FAIL.
`[structure-001] File src/god.ts has 600 lines (max: 300).`

### 2. The Required Fix

Rigour forces the agent to refactor into:
- `src/controllers/`
- `src/services/`
- `src/utils/`

Only when the file size drops below the limit will the gate OPEN.
