import { Schema } from "effect";

export class Note extends Schema.Class<Note>("Note")({
  id: Schema.Number,
  text: Schema.String,
}) {}

export class NoteNotFound extends Schema.TaggedErrorClass<NoteNotFound>()(
  "NoteNotFound",
  {
    id: Schema.Number,
    message: Schema.String,
  },
  { httpApiStatus: 404 },
) {}

export class InvalidNote extends Schema.TaggedErrorClass<InvalidNote>()(
  "InvalidNote",
  {
    message: Schema.String,
  },
  { httpApiStatus: 400 },
) {}
