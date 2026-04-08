import * as path from "node:path";
import * as os from "node:os";
import * as readline from "node:readline";

export function expandHome(p: string): string {
  if (p.startsWith("~/") || p === "~") {
    return path.join(os.homedir(), p.slice(1));
  }
  return p;
}

export function resolvePath(p: string): string {
  return path.resolve(expandHome(p));
}

/** Collapse home directory to ~ for display */
export function collapseHome(p: string): string {
  const home = os.homedir();
  if (p.startsWith(home + "/") || p === home) {
    return "~" + p.slice(home.length);
  }
  return p;
}

export function ensureTrailingSlash(p: string): string {
  return p.endsWith("/") ? p : p + "/";
}

const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  bold: "\x1b[1m",
  reset: "\x1b[0m",
} as const;

export function red(s: string): string {
  return `${colors.red}${s}${colors.reset}`;
}
export function green(s: string): string {
  return `${colors.green}${s}${colors.reset}`;
}
export function yellow(s: string): string {
  return `${colors.yellow}${s}${colors.reset}`;
}
export function blue(s: string): string {
  return `${colors.blue}${s}${colors.reset}`;
}
export function bold(s: string): string {
  return `${colors.bold}${s}${colors.reset}`;
}

export function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export function promptYesNo(question: string): Promise<boolean> {
  return prompt(`${yellow(question)} [y/n] `).then((answer) => {
    const lower = answer.toLowerCase();
    if (lower === "y" || lower === "yes") return true;
    if (lower === "n" || lower === "no") return false;
    console.log(red("Please answer y or n."));
    return promptYesNo(question);
  });
}
