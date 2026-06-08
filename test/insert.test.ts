import test from "node:test";
import assert from "node:assert/strict";
import { insertImportedContext } from "../src/merge/insertImportedContext.ts";

test("insertImportedContext uses Pi sendMessage with nextTurn delivery", () => {
  const calls: any[] = [];
  const pi = {
    sendMessage(message: any, options: any) {
      calls.push({ message, options });
    },
  };

  insertImportedContext(pi as any, "# Imported Session Context", {
    sourceSessionPath: "/tmp/session.jsonl",
    mergeMode: "context-summary",
    importedAt: "2026-06-08T00:00:00.000Z",
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].message.customType, "session-merge");
  assert.equal(calls[0].message.content, "# Imported Session Context");
  assert.equal(calls[0].message.display, true);
  assert.equal(calls[0].options.deliverAs, "nextTurn");
});
