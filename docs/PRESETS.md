# ⚙️ Standards Packs

Rigour uses **Standards Packs** to apply opinionated engineering rules based on your project's role.

## 📦 `api` Pack (Backend Engineering)
Optimized for Node.js, TypeScript, and Python backends.

| Rule | Status | Type | Description |
|:---|:---:|:---:|:---|
| **SOLID Density** | ✅ | AST | Classes cannot exceed 12 methods (God Object prevention). |
| **Complexity Cap** | ✅ | AST | Individual functions cannot exceed cyclomatic complexity of 10. |
| **SRP Enforcement** | ✅ | File | Max 500 lines per file to prevent "Spaghetti Code". |
| **Layer Boundaries** | 🧭 | Logic | `controllers` cannot import from `db` directly (Service Layer enforcement). |
| **Repo Pattern** | 🧭 | Logic | Database access is forbidden outside of `repositories/` or `models/`. |

## 📦 `ui` Pack (Frontend Engineering)
Optimized for React, Vue, Next.js, and Vite.

| Rule | Status | Type | Description |
|:---|:---:|:---:|:---|
| **Component Size** | ✅ | File | Max 300 lines per React/Vue component. |
| **God Components** | ✅ | AST | Limits number of hooks and handlers in a single file. |
| **A11y Checks** | ✅ | Cmd | Enforces `eslint-plugin-jsx-a11y` via command gate. |
| **Fetch Hygiene** | 🧭 | Logic | No `fetch` or `axios` calls outside of `api/` or `hooks/` folders. |

## 📦 `data` Pack (Data Science & Engineering)
Optimized for Python, Pandas, and Notebook environments.

| Rule | Status | Type | Description |
|:---|:---:|:---:|:---|
| **Secret Scanning** | ✅ | Regex | Universal ban on hardcoded keys in Notebooks/Scripts. |
| **Function Signatures** | ✅ | AST | Max 5 parameters per data processing function. |
| **Determinism** | 🧭 | Logic | Enforces seed setting for stochastic operations (Plan). |

---

## 🔍 Selection & Overrides

Rigour automatically selects a pack during `init`. You can manually override:

```bash
rigour init --preset api
```

### 🔭 Dry Run & Explain
Not sure what Rigour detected? Run:
- `rigour init --dry-run`: View detected role/paradigm without writing files.
- `rigour init --explain`: Shows exactly which markers triggered the detection.
