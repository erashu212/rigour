# 🤖 AI Agent Integration

Rigour is designed to be the "governor" for AI agents. It works with all major agentic tools.

## 1. The Universal Handshake

When you run `rigour init`, it creates:
- `.cursor/rules/rigour.mdc`: Global instructions for the **Cursor** IDE.
- `docs/AGENT_INSTRUCTIONS.md`: A universal markdown guide that any agent (Claude, Gemini, ChatGPT) can read upon entry.

These files tell the agent that:
- Engineering excellence is mandatory.
- Code must pass `rigour check` before being submitted.
- High-fidelity `rigour-fix-packet.json` files contain diagnostic data on failure.

## 2. Model Context Protocol (MCP)

Rigour exposes an MCP server for agents that support the protocol (Claude Desktop, VS Code Cline).

### Configuration

```json
{
  "mcpServers": {
    "rigour": {
      "command": "npx",
      "args": ["-y", "@rigour-labs/mcp"]
    }
  }
}
```

### Available Tools

- `rigour_check_status`: Get the current PASS/FAIL state of the project.
- `rigour_get_fix_packet`: Get structured JSON instructions for making the code pass.

## 3. The `run` Loop (Best for CLI Agents)

For agents that run in the terminal (like **Claude Code**), use the `run` wrapper for a self-healing automation loop.

```bash
npx @rigour-labs/cli run -- <agent-cli-command>
```

Rigour will intercept the agent's work, run checks, and feed failure metadata back into the agent's next turn until the code is perfect.
