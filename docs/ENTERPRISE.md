# 🏢 Rigour for Enterprise & Teams

While Rigour is a local-first tool, it is designed to be the "Quality Firewall" for high-velocity engineering teams using AI.

## 🚀 CI Integration: GitHub Actions

Ensuring that no code—agent-generated or otherwise—hits your main branch without meeting standards.

```yaml
name: Rigour Quality Gate

on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          
      - run: npm install
      
      # The --ci flag ensures a non-zero exit on any gate failure
      - name: Run Rigour Audit
        run: npx @rigour-labs/cli check --ci
        
      - name: Upload Quality Report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: rigour-report
          path: rigour-report.json
```

## 📋 Team Adoption Strategy

### 1. Shared Presets
Standardize your `rigour.yml` across all microservices. Use the same `api` or `ui` packs to ensure uniform quality.

### 2. PR Annotations (Planned)
We are building automated PR annotations so that if an agent fails a gate in CI, the specific line is flagged in the PR UI with the Rigour Fix Packet as a comment.

### 3. Local-First Enforcement
Encourage developers to run `rigour check` locally before pushing. This reduces CI "noise" and keeps the feedback loop tight.

```text
# Suggested git pre-push hook
npx @rigour-labs/cli check --ci || (echo "Rigour check failed. Refactor before pushing." && exit 1)
```

## 🔒 Security & Privacy
Because Rigour runs entirely locally on your filesystem, it is naturally compliant with strict security policies. **No code or metadata ever leaves your infrastructure.**
