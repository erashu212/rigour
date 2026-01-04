# 🛡️ Rigour Philosophy: Engineering vs. Vibe Coding

Rigour was built to solve the "Stochastic Spaghetti" problem in AI-assisted development.

## The Problem: "Vibe Coding"
When an agent writes code, it often prioritizes "appearing correct" over "being maintainable". 
- It leaves `// TODO` for things it doesn't want to solve.
- It writes giant, 1000-line "God Files".
- It ignores project architecture because it's not explicitly in the prompt.

This is "Vibe Coding"—if the tests pass and the UI looks okay, it's considered "done".

## The Solution: The Stateless Feedback Loop
Rigour introduces a deterministic supervisor that enforces **Engineering Rigour** before the agent can claim victory.

### 1. Statelessness
Rigour doesn't care about the agent's history or session. It only cares about the current state of the filesystem. This makes it repo-agnostic and universally compatible.

### 2. The definion of "Done"
In a Rigour-enabled workflow, "Done" means:
- The tests pass.
- The linter is happy.
- **The code adheres to the project's structural constraints (AST Gates).**
- **The project memory is preserved (Required Docs).**

### 3. High-Fidelity Diagnostics
Instead of "it failed", Rigour provides **Fix Packets**. These are structured JSON payloads that tell the agent *exactly* what is wrong (e.g., "Complexity is 12, limit is 10 in `auth.ts` L45") so it can self-heal without human intervention.

---

## 🆚 Comparison Table

| Feature | 🚫 Typical AI Agent | 🛡️ Agent with Rigour |
| :--- | :--- | :--- |
| **Feedback Loop** | Human manual review. | Automated AST-based gates. |
| **Quality Bar** | Minimum viable prototype. | Production-grade (SOLID/DRY). |
| **Technical Debt** | High (leaks TODOs/FIXMEs). | Zero (Debt markers are forbidden). |
| **Architecture** | Ad-hoc / Drift. | Enforced by `rigour.yml`. |
| **Scaling** | Slows down as repo grows. | Constant velocity via structural gates. |
