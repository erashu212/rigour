# Lazy Agent Demo — Rigour Loop Enforcement

This demo proves that an AI agent cannot mark a task as "Done" until it satisfies Rigour's quality gates.

## The Scenario

You have a file `src/lazy.ts` that works but contains:
1.  A `TODO` comment (banned by defaults).
2.  A `console.log` (banned by defaults).

## Run the Demo

### 1. The "Lazy" Attempt

If you were running a normal agent, it might say:
> "I added the feature. It works. Task Complete."

But with Rigour:

```bash
# This mimics the agent trying to finish
npx @rigour-labs/cli check
```

**Result**: 🛑 FAIL. The agent is forced to see the violations.

### 2. The "Forced" Fix

The agent must now remove the `TODO` and `console.log` to exit the loop.

```typescript
// src/lazy.ts (Before)
export function calculate() {
  console.log("calculating..."); // Violation
  // TODO: optimize this // Violation
  return 1 + 1;
}
```

```typescript
// src/lazy.ts (After)
export function calculate() {
  return 1 + 1;
}
```
