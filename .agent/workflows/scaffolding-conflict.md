---
description: How to run framework scaffolding tools (like create-next-app) when Rigour is already initialized.
---

If you need to run a framework scaffolding tool (e.g., `npx create-next-app`, `npm init vite`) in a directory that is non-empty because of Rigour files, follow these steps:

1. **Identify Rigour Files**: Common files include `rigour.yml`, `docs/`, `.cursor/`, and `.rigour/`.
2. **Move to Temp**: Create a temporary directory and move these files into it.
   ```bash
   mkdir .rigour_temp
   mv rigour.yml docs .cursor .rigour .rigour_temp/
   ```
3. **Run Scaffolding**: Execute your framework initialization command in the now-empty directory.
   ```bash
   npx create-next-app@latest ./ [your-options]
   ```
4. **Restore Rigour**: Move the Rigour files back into the project root, merging them with any new framework files.
   ```bash
   cp -r .rigour_temp/* ./
   rm -rf .rigour_temp
   ```
5. **Verify**: Run `npx @rigour-labs/cli check` to ensure the new framework structure aligns with Rigour standards.
