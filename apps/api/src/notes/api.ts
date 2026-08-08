import { Effect, Schema } from "effect";
import {
  HttpApiBuilder,
  HttpApiEndpoint,
  HttpApiGroup,
} from "effect/unstable/httpapi";
import { InvalidNote, Note, NoteNotFound } from "./domain";
import { NoteStore } from "./NoteStore";
import { params } from "effect/unstable/http/HttpRouter";

export const createNote = HttpApiEndpoint.post("createNote", "/", {
  payload: Schema.Struct({
    text: Schema.String,
  }),
  success: Note,
  error: [InvalidNote],
});

export const getNote = HttpApiEndpoint.get("getNote", "/:id", {
  params: { id: Schema.FiniteFromString },
  success: Note,
  error: [NoteNotFound],
});

export const NoteGroup = HttpApiGroup.make("notes")
  .add(createNote, getNote)
  .prefix("/notes");
