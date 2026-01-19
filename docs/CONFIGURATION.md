# ⚙️ Configuration Guide (`rigour.yml`)

Rigour is controlled by a `rigour.yml` file in your root directory.

## Schema Overview

```yaml
version: 1
preset: ui        # ui, api, infra, data
paradigm: oop    # oop, functional, minimal

gates:
  max_file_lines: 300
  forbid_todos: true
  forbid_fixme: true
  required_files:
    - docs/SPEC.md
    - docs/ARCH.md
  
  # Structural (AST) Analysis
  ast:
    complexity: 10      # Max cyclomatic complexity
    max_methods: 12     # Max methods per class
    max_params: 5       # Max parameters per function

commands:
  lint: "npm run lint"
  test: "npm test"
  typecheck: "npx tsc --noEmit"

output:
  report_path: "rigour-report.json"

# Ignore specific paths from all gates
ignore:
  - "**/generated/**"
  - "**/vendor/**"
  - "legacy/**"
```

## Gate Definitions

### `max_file_lines`
Enforces the **Single Responsibility Principle** by capping file length. Large files are usually a sign of "God Objects" or "Spaghetti Code".

### `forbid_todos` / `forbid_fixme`
Zero tolerance for technical debt markers. Engineering is finished when the code is clean, not when a comment is left for later.

### `ast.complexity`
Uses AST traversal to calculate **Cyclomatic Complexity**. It counts branches (if, for, while, case, etc.). Functions with complexity > 10 are difficult to test and maintain.

### `ast.max_methods`
Ensures classes stay focused. If a class has more than 10-12 methods, it should likely be split into multiple smaller services.

### `commands`
Any shell command that returns a non-zero exit code will cause the Rigour check to fail. This is where you integrate your existing CI tools.

---

## Ignore Paths

The `ignore` array allows you to exclude specific files or directories from **all gates**.

```yaml
ignore:
  - "**/generated/**"
  - "**/vendor/**"
  - "legacy/**"
  - "**/*.generated.ts"
```

### Pattern Syntax

Rigour uses **glob patterns** to match files:

| Pattern | Matches |
|---------|---------|
| `**/folder/**` | `folder` at any depth (e.g., `src/folder/`, `packages/app/folder/`) |
| `folder/**` | `folder` at **root only** |
| `**/*.ext` | All files with `.ext` extension |
| `path/to/file.ts` | Specific file |

> [!IMPORTANT]
> Use `**/` prefix to match directories at any depth. For example, `**/node_modules/**` matches both `node_modules/` and `frontend/node_modules/`.

### Default Ignores

Rigour automatically ignores these patterns (merged with your custom ignores):

- `**/node_modules/**`
- `**/dist/**`
- `**/build/**`
- `**/*.test.*` / `**/*.spec.*`
- `**/__pycache__/**`
- `**/.git/**`
- `**/package-lock.json`
- `**/pnpm-lock.yaml`

### Context-Specific Ignores

For the context mining gate, use `ignored_patterns`:

```yaml
gates:
  context:
    ignored_patterns:
      - "legacy/**"
      - "*.config.js"
```

