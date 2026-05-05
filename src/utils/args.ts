export interface MergeArgs {
  all: boolean;
  cwd?: string;
  sessionRef?: string;
}

export function parseMergeArgs(args: string | undefined): MergeArgs {
  const tokens = tokenize(args ?? "");
  const out: MergeArgs = { all: false };
  const refs: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === "--all" || token === "-a") {
      out.all = true;
    } else if (token === "--cwd") {
      const value = tokens[++i];
      if (!value) throw new Error("/merge --cwd requires a path");
      out.cwd = value;
    } else if (token.startsWith("--cwd=")) {
      out.cwd = token.slice("--cwd=".length);
    } else if (token.trim()) {
      refs.push(token);
    }
  }

  if (refs.length > 0) out.sessionRef = refs.join(" ");
  if (out.cwd) out.all = false;
  return out;
}

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input))) tokens.push(m[1] ?? m[2] ?? m[3]);
  return tokens;
}
