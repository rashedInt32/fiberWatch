import { Context, Effect, Layer, Schema } from "effect";

class RequestFailedError extends Schema.TaggedErrorClass<RequestFailedError>()(
  "RequestFailedError",
  {
    message: Schema.String,
  },
) {}

export class Fetcher extends Context.Service<
  Fetcher,
  {
    get: (url: string) => Effect.Effect<Response, RequestFailedError>;
  }
>()("api/http/Fetcher") {}

export const FetcherLive = Layer.succeed(Fetcher, {
  get: (url) =>
    Effect.tryPromise({
      try: () => fetch(url),
      catch: (e) => new RequestFailedError({ message: `Network error ${e}` }),
    }),
});
