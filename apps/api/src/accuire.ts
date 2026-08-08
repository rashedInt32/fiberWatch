import { Console, Effect } from "effect";

const resource = Effect.acquireRelease(
  Effect.sync(() => console.log("Connection OPen")),
  () => Console.log("connection close"),
);

const program = Effect.gen(function* () {
  const r = yield* resource;
  yield* Effect.fail(new Error("boom"));
  return r;
});

Effect.runPromise(Effect.scoped(program)).catch(() => console.log("failed"));
