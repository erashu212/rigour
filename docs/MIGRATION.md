# 📦 Rigour Labs: Organizational Migration Plan

To finalize the professional branding of Rigour, we are moving from a personal repository to a dedicated GitHub Organization.

## 🎯 Target State
- **Organization**: `github.com/rigour-labs`
- **Repository**: `github.com/rigour-labs/rigour`
- **Docs Domain**: `rigour.run` (Vercel)
- **Email/Identity**: `rigour-labs.dev` (Redirect)

## 🛠️ Step-by-Step Migration Guide

### 1. GitHub Organization Move (User Action Required)
1.  Go to **Settings** > **General** for your current repository.
2.  Scroll down to **Danger Zone** > **Transfer ownership**.
3.  Enter the destination: `rigour-labs`.
4.  Confirm the transfer. GitHub will automatically redirect old URLs to the new ones!

### 2. Update Actions & Secrets
Once transferred, we need to ensure the CI/CD pipeline remains hot:
1.  **NPM_TOKEN**: Ensure the secret is present in the `rigour-labs/rigour` repository settings.
2.  **GITHUB_TOKEN**: Semantic Release uses this to create tags/releases.

### 3. Vercel Deployment (Automated)
I have scaffolded the documentation hub in `apps/docs`. Once the repo is moved:
1.  Import the `rigour-labs/rigour` project into Vercel.
2.  Set the Root Directory to `apps/docs`.
3.  Add the domain `rigour.run`.

### 4. Semantic Versioning (Pre-releases)
I have configured `.releaserc.json` to support:
- `beta` branch -> publishes `@rigour-labs/cli@beta`.
- `next` branch -> publishes `@rigour-labs/cli@next`.
- `main` branch -> publishes stable `@rigour-labs/cli@latest`.

---
**Verdict**: This move establishes Rigour as a first-class citizen in the AI Engineering ecosystem. 🛡️🏆🚀
