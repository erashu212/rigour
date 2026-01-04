import chalk from 'chalk';

export async function setupCommand() {
    console.log(chalk.bold.cyan('\n🛠️ Rigour Labs | Setup & Installation\n'));

    console.log(chalk.bold('1. Global Installation (Recommended)'));
    console.log(chalk.dim('   To use Rigour anywhere in your terminal:'));
    console.log(chalk.green('   $ npm install -g @rigour-labs/cli\n'));

    console.log(chalk.bold('2. Project-Local installation'));
    console.log(chalk.dim('   To keep Rigour versioned with your project:'));
    console.log(chalk.green('   $ npm install --save-dev @rigour-labs/cli\n'));

    console.log(chalk.bold('3. Standalone Binaries (Zero-Install)'));
    console.log(chalk.dim('   If you do not want to use Node.js:'));
    console.log(chalk.dim('   • macOS: ') + chalk.cyan('https://github.com/erashu212/rigour/releases/latest/download/rigour-macos'));
    console.log(chalk.dim('   • Linux: ') + chalk.cyan('https://github.com/erashu212/rigour/releases/latest/download/rigour-linux'));
    console.log(chalk.dim('   • Windows: ') + chalk.cyan('https://github.com/erashu212/rigour/releases/latest/download/rigour-windows.exe\n'));

    console.log(chalk.bold('4. MCP Integration (for AI Agents)'));
    console.log(chalk.dim('   To let Cursor or Claude use Rigour natively:'));
    console.log(chalk.dim('   Path to MCP: ') + chalk.cyan('packages/rigour-mcp/dist/index.js'));
    console.log(chalk.dim('   Add this to your Cursor/Claude settings.\n'));

    console.log(chalk.bold('Update Guidance:'));
    console.log(chalk.dim('   Keep Rigour sharp by updating regularly:'));
    console.log(chalk.green('   $ npm install -g @rigour-labs/cli@latest\n'));
}
