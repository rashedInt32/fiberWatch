import { HttpApi, HttpApiBuilder } from "effect/unstable/httpapi";
import { NoteGroup } from "./api";
import { Effect } from "effect";
import { NoteStore } from "./NoteStore";
import { InvalidNote } from "./domain";

export const api = HttpApi.make("NoteApi").add(NoteGroup);

export const NoteLive = HttpApiBuilder.group(api, "notes", (handlers) =>
  handlers
    .handle("createNote", ({ payload }) =>
      Effect.gen(function* () {
        const store = yield* NoteStore;
        if (payload.text.trim() === "") {
          return yield* new InvalidNote({
            message: "Note is empty",
          });
        }
        return yield* store.create(payload.text);
      }),
    )
    .handle("getNote", ({ params }) =>
      Effect.gen(function* () {
        const store = yield* NoteStore;
        return yield* store.get(params.id);
      }),
    ),
);
