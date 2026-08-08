// NoteStore will be our service
// is should contain method
// -- create: (text: string) => Effect.Effect<Note>
// -- get: (id: number) => Effect.Effect<Note, NoteNotFound>
//

import { Context, Effect, Layer, Ref } from "effect";
import { Note, NoteNotFound } from "./domain";

//
export class NoteStore extends Context.Service<
  NoteStore,
  {
    create: (text: string) => Effect.Effect<Note>;
    get: (id: number) => Effect.Effect<Note, NoteNotFound>;
  }
>()("api/notes/NoteStore") {}

export const NoteServiceLive = Layer.effect(
  NoteStore,
  Effect.gen(function* () {
    const state = yield* Ref.make({ notes: [] as Note[], nextId: 1 });

    const create = (text: string) =>
      Ref.modify(state, (s) => {
        const note = new Note({ id: s.nextId, text });
        return [note, { notes: [...s.notes, note], nextId: s.nextId + 1 }];
      });

    const get = (id: number) =>
      Effect.gen(function* () {
        const noteState = yield* Ref.get(state);
        const note = noteState.notes.find((n) => n.id === id);
        if (!note) {
          return yield* new NoteNotFound({
            id,
            message: "Note not found",
          });
        }
        return note;
      });

    return { create, get };
  }),
);
