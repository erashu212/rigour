# 📖 Rigour: The Documentation Strategy

To become the **Standard for AI Engineering**, Rigour's documentation must be as beautiful as its code is clean.

## 🎯 The Primary Goal: Professional Presence

While `.io` is the industry standard for SaaS, it is notoriously expensive ($40-$60/year). To align with `@rigour-labs` on NPM while staying cost-effective, here are my top recommendations:

### 1. **`rigour.run`** (Top Recommendation)
- **Cost**: ~$25/year.
- **Vibe**: Perfect for Rigour’s core loop. The CLI command is `rigour run`. It feels active and performance-oriented.

### 2. **`rigour.cloud`** (Available)
- **Cost**: ~$20/year.
- **Vibe**: Very SaaS-forward. It tells people exactly where the "Cloud Dashboard" will live.

### 3. **`rigour-labs.io`** (Professional Match)
- **Cost**: ~$60/year.
- **Vibe**: Direct match to your NPM organization. High authority, though pricier.

| Domain | Est. Cost | Rating | Verdict |
|:---|:---|:---|:---|
| `rigour.run` | $25 | ⭐⭐⭐⭐⭐ | **Best Semantic Match** |
| `rigour.cloud` | $20 | ⭐⭐⭐⭐ | Best for SaaS Future |
| `rigour-labs.io` | $60 | ⭐⭐⭐⭐ | Perfect NPM Brand Match |
| `rigour.builders`| $20 | ⭐⭐⭐ | Strong Industry Vibe |

### 4. Maintaining the Brand Balance
I recommend using **Nextra** (Next.js + Markdown).
- **Pros**: Used by top OSS projects (SWC, Turbo, The Guild).
- **Features**: Fast, beautiful dark mode by default, powerful search, and MDX support (interactive code blocks).

### 2. Site Structure (The "OSS Home")

| Section | Content |
|:---|:---|
| **🚀 Getting Started** | The "Zero-Config" promise. 30-second setup guide. |
| **🛡️ Gates Reference** | Deep-dives into every logic gate with "Before/After" code. |
| **🧩 Standard Packs** | Explaining `api`, `ui`, and `data` role-based rules. |
| **🤖 AI Integration** | Guided setup for Cursor, Claude Code, and MCP. |
| **📈 Premium/Cloud** | The roadmap for Dashboards and Enterprise Sync. |

### 3. Maintaining the Brand Balance
- **Home Page**: "Rigour: The Quality Gate Loop for AI Engineering."
- **NPM Footer**: "Powered by the `@rigour-labs` organization."
- **Repository**: Keep everything in our current monorepo under `/apps/docs`.

## 📈 Future: Documentation as a Service
We should provide a way for *other* teams to generate their own "Engineering Standard" sites.
- `rigour docs --site` -> Generates a static site based on *their* `rigour.yml` rules.
- This allows companies to say: "These are OUR engineering standards, powered by Rigour."

## 🛠️ Next Step
Register `rigour.io` and point it to a Vercel-hosted doc site.
