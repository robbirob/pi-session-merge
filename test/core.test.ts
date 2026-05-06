import test from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { expandTildePath, parseMergeArgs } from "../src/utils/args.ts";
import { filterAndSortSessions, resolveSessionRef } from "../src/sessions/listSessions.ts";
import { formatSessionLabel } from "../src/sessions/sessionMetadata.ts";
import { entriesToTextRecords } from "../src/sessions/extractBranch.ts";
import { buildSessionDigest, extractCommands, extractFiles } from "../src/merge/buildSessionDigest.ts";
import { formatImportedContext } from "../src/merge/formatImportedContext.ts";
import type { SessionInfoLike } from "../src/types.ts";

function session(partial: Partial<SessionInfoLike>): SessionInfoLike {
  return {
    path: partial.path ?? `/sessions/${partial.id ?? "id"}.jsonl`,
    id: partial.id ?? "id",
    cwd: partial.cwd ?? "/work/a",
    created: partial.created ?? new Date("2026-05-01T00:00:00Z"),
    modified: partial.modified ?? new Date("2026-05-01T00:00:00Z"),
    messageCount: partial.messageCount ?? 1,
    firstMessage: partial.firstMessage ?? "First prompt",
    name: partial.name,
  };
}

test("parseMergeArgs supports all, cwd, and refs", () => {
  assert.deepEqual(parseMergeArgs("--all abc"), { all: true, sessionRef: "abc" });
  assert.deepEqual(parseMergeArgs("--cwd \"/tmp/my project\" foo"), { all: false, cwd: "/tmp/my project", sessionRef: "foo" });
});

test("expandTildePath expands home-directory shorthand", () => {
  assert.equal(expandTildePath("~/work/project", "/home/me"), join("/home/me", "work/project"));
  assert.equal(expandTildePath("~\\work\\project", "C:/Users/me"), join("C:/Users/me", "work\\project"));
  assert.equal(expandTildePath("/tmp/project", "/home/me"), "/tmp/project");
});

test("candidate filtering excludes current session and sorts newest first", () => {
  const old = session({ id: "old", path: "/s/old.jsonl", modified: new Date("2026-01-01") });
  const current = session({ id: "cur", path: "/s/cur.jsonl", modified: new Date("2026-03-01") });
  const recent = session({ id: "new", path: "/s/new.jsonl", modified: new Date("2026-04-01") });
  assert.deepEqual(filterAndSortSessions([old, current, recent], "/s/cur.jsonl").map((s) => s.id), ["new", "old"]);
});

test("resolveSessionRef handles unique and ambiguous refs", () => {
  const sessions = [session({ id: "abcdef" }), session({ id: "abc999", name: "Other" })];
  assert.equal(resolveSessionRef(sessions, "abc"), "ambiguous");
  assert.equal((resolveSessionRef(sessions, "999") as SessionInfoLike).id, "abc999");
});

test("session labels include useful metadata", () => {
  const label = formatSessionLabel(session({ name: "Planning", cwd: "/home/me/project", modified: new Date("2026-05-04T21:13:00Z"), messageCount: 42 }));
  assert.match(label, /Planning/);
  assert.match(label, /project/);
  assert.match(label, /42 entries/);
});

test("entriesToTextRecords extracts message text and custom messages", () => {
  const records = entriesToTextRecords([
    { type: "message", timestamp: "t", message: { role: "user", content: "Hello" } },
    { type: "custom_message", timestamp: "t", content: "Context" },
  ]);
  assert.deepEqual(records.map((r) => r.text), ["Hello", "Context"]);
});

test("digest extracts goal, files, commands, todos, constraints", () => {
  const records = entriesToTextRecords([
    { type: "message", message: { role: "user", content: "Build MVP in src/index.ts. Must be safe. TODO add tests." } },
    { type: "message", message: { role: "assistant", content: [{ type: "text", text: "Run:\n```bash\nnpm test\ngit status\n```\nFinal state done." }] } },
  ]);
  const digest = buildSessionDigest(records, session({ id: "s1" }));
  assert.match(digest.originalGoal, /Build MVP/);
  assert.ok(digest.files.some((f) => f.path === "src/index.ts"));
  assert.ok(digest.commands.some((c) => c.command === "npm test"));
  assert.ok(digest.todos.some((t) => /TODO/.test(t)));
  assert.ok(digest.constraints.some((c) => /Must/.test(c)));
});

test("extract helpers find paths and shell commands", () => {
  assert.deepEqual(extractFiles("edit src/foo.ts and ./test/bar.test.ts"), ["src/foo.ts", "test/bar.test.ts"]);
  assert.ok(extractCommands("```bash\nnode test.js\n```\n$ git status").includes("git status"));
});

test("formatImportedContext has required heading and sections", () => {
  const digest = buildSessionDigest([{ role: "user", text: "Goal" }], session({ id: "s1" }));
  const text = formatImportedContext(digest);
  assert.match(text, /^# Imported Session Context/);
  assert.match(text, /## Open TODOs \/ Next Steps/);
});

test("large session is flagged and empty session does not crash", () => {
  const large = buildSessionDigest(Array.from({ length: 250 }, (_, i) => ({ role: "user", text: `message ${i}` })), session({ id: "large" }));
  assert.equal(large.largeSession, true);
  const empty = buildSessionDigest([], session({ id: "empty" }));
  assert.match(formatImportedContext(empty), /no readable message text/i);
});
