import { Effect, Schema } from "effect";
import { Fetcher, FetcherLive } from "./http";

class UserNotFound extends Schema.TaggedErrorClass<UserNotFound>()(
  "UserNotFound",
  { message: Schema.String, userName: Schema.String, status: Schema.Number },
) {}

class ServerError extends Schema.TaggedErrorClass<ServerError>()(
  "ServerError",
  {
    message: Schema.String,
    status: Schema.optional(Schema.Number),
  },
) {}

class ValidationError extends Schema.TaggedErrorClass<ValidationError>()(
  "ValidationError",
  { message: Schema.String },
) {}

class User extends Schema.Class<User>("User")({
  id: Schema.Number,
  login: Schema.String,
  email: Schema.NullOr(Schema.String),
  name: Schema.NullOr(Schema.String),
  public_repos: Schema.Number,
}) {}

export const getGithubUser = (
  username: string,
): Effect.Effect<User, UserNotFound | ServerError | ValidationError, Fetcher> =>
  Effect.gen(function* () {
    const fetcher = yield* Fetcher;
    const response = yield* fetcher
      .get(`https://api.github.com/users/${username}`)
      .pipe(Effect.mapError((e) => new ServerError({ message: e.message })));

    if (!response.ok && response.status !== 404) {
      return yield* new ServerError({
        message: "somethign went wrong",
        status: response.status,
      });
    }
    if (response.status === 404) {
      return yield* new UserNotFound({
        message: "User not found ",
        userName: username,
        status: response.status,
      });
    }

    const responseData = yield* Effect.tryPromise({
      try: () => response.json(),
      catch: () => new ServerError({ message: "Invalid JSON from server" }),
    });
    const user = yield* Schema.decodeUnknownEffect(User)(responseData).pipe(
      Effect.mapError(
        () =>
          new ValidationError({ message: "Response shape did not match User" }),
      ),
    );

    return user;
  });

// Step 1. Call fetch with username
// If response.ok is false return ServerError with proper statuscode and if we get any message in error response
// Step 2: If response is not ok, ServerError
// Step 3.If response not ok check status 404, UserNotFound
// Step 4. get the response json
// Step 4. if valid json from server, check schema decode success do next step,  failed show ValidationError with appropiate message
// Step 5. If all ok return the urser
// step 6. Catch other cases like dns fail, offline, timeout to the pipe catch all case
//

// Effect.runPromise(
//   getGithubUser("torvalds").pipe(Effect.provide(FetcherLive)),
// ).then(console.log);
