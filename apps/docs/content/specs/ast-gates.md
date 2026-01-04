# 🧪 AST-Based Analysis

Rigour uses Abstract Syntax Tree (AST) analysis to enforce production-grade engineering standards that simple regex pattern matching cannot catch.

## 🏗️ Technical Implementation

### Current Engine: TypeScript Compiler API
Rigour currently uses the official **TypeScript Compiler API** to parse and analyze source code. This allows for high-fidelity detection of code structures across both TypeScript and JavaScript projects.

| Language | Engine | Status |
|:---|:---|:---:|
| **TypeScript (.ts, .tsx)** | TS Compiler API | ✅ Stable |
| **JavaScript (.js, .jsx)** | TS Compiler API | ✅ Stable |
| **Python** | `python-ast` / `ruff` | 🧭 Planned |
| **Go** | `go/ast` | 🧭 Researching |

## 📏 Enforced Metrics

### 1. Cyclomatic Complexity
**Statutory Limit**: 10 (Configurable)
Measured by counting branching points (`if`, `switch`, `while`, `for`, `&&`, `||`). High complexity correlates directly with high bug density and poor testability.

### 2. Class Density (SOLID)
**Statutory Limit**: 12 methods (Configurable)
Rigour flags classes that are becoming "God Objects". This forces the agent to extract logic into smaller, composed services.

### 3. Function Signatures
**Statutory Limit**: 5 parameters (Configurable)
Large parameter lists are a sign of poor abstraction. Rigour forces the use of options objects or better encapsulation.

---

## 🧭 Roadmap: Advanced AST Gates

We are researching the following "Engineering Patterns" for future release:
- **Import Boundary Enforcement**: Prevent circular dependencies and layer leaks.
- **Dead Code Detection**: Automated removal of unused exports and local variables.
- **Async Hygiene**: Ensuring `await` is used correctly and preventing unhandled promise rejections at the structural level.
