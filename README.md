# pi-session-merge

A Pi Coding Agent Extension that adds `/merge`, allowing you to import summarized context from another Pi session into your current session.

`pi-session-merge` performs a safe **context merge** instead of rewriting or raw-merging session history. It lets you pick a source session, previews a structured summary of its goals, decisions, files, commands, constraints, risks, and TODOs, and then inserts that reviewed summary into the current session as contextual information.

## Features

- Adds a `/merge` slash command to Pi
- Lists candidate sessions from the current working directory by default
- Supports searching all known sessions with `/merge --all`
- Excludes the current session from candidates
- Builds a deterministic structured summary
- Shows an editable preview before insertion
- Requires confirmation before writing anything
- Inserts a clearly labeled `Imported Session Context` block
- Does not modify the source session
- Does not raw-merge or rewrite Pi JSONL session files

## Installation / Usage

Install it as a Pi package so Pi uses the package name instead of showing the extension as `src`.

Install from GitHub:

```bash
pi install git:github.com/robbirob/pi-session-merge
```

For local development from a checkout, install the package directory instead of pointing Pi at `src/index.ts`:

```bash
pi install /path/to/pi-session-merge
```

Use `pi -e ./index.ts` only for quick one-off testing.

Then inside Pi:

```text
/merge
```

Useful variants:

```text
/merge --all
/merge --cwd ~/work/some-project
/merge <session-id-or-name-fragment>
```

## How It Works

When `/merge` runs, the extension:

1. Finds other Pi sessions for the current working directory.
2. Lets you select a source session.
3. Reads the selected session safely.
4. Extracts useful messages from the active/latest branch.
5. Builds a structured context summary.
6. Opens an editable preview.
7. Asks for confirmation.
8. Inserts the reviewed summary into the current session as a custom context message.

The inserted block is marked as imported context and includes source metadata.

## Safety Notes

This extension intentionally does **not** perform a raw session merge. Pi session files can contain branches, parent/child relationships, tool calls, compactions, labels, model metadata, and other internal state. Raw-merging those files risks corruption or misleading context.

For the MVP, `pi-session-merge` only imports a summarized context block.

It will not:

- mutate the source session
- rewrite current session history
- copy raw JSONL entries
- delete, compact, rename, or relabel sessions
- apply file patches or Git merges

## Development

Run tests:

```bash
npm test
```

Project structure:

```text
src/
  index.ts
  commands/
  sessions/
  merge/
  ui/
  utils/
test/
```

The core session parsing and digest-building logic is kept in pure functions where possible so it can be tested without depending on your real `~/.pi` session directory.

## License

MIT
