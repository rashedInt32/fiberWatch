import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { Effect, Layer, Schema } from "effect";
import { HttpRouter } from "effect/unstable/http";
import {
  HttpApi,
  HttpApiBuilder,
  HttpApiEndpoint,
  HttpApiError,
  HttpApiGroup,
  OpenApi,
} from "effect/unstable/httpapi";

export class User extends Schema.Class<User>("User")({
  id: Schema.String,
  name: Schema.String,
  email: Schema.String,
}) {}

export class UserNotFound extends Schema.TaggedErrorClass<UserNotFound>()(
  "UserNotFound",
  { userId: Schema.String },
  {
    httpApiStatus: 404,
  },
) {}

export const getUser = HttpApiEndpoint.get("getUser", "/:id", {
  params: { id: Schema.String },
  success: User,
  error: [UserNotFound, HttpApiError.NotFound],
});

export const createUser = HttpApiEndpoint.post("createUser", "/create", {
  payload: User,
  success: User,
  error: [HttpApiError.Forbidden],
});

export const userGroup = HttpApiGroup.make("users")
  .add(getUser, createUser)
  .prefix("/users")
  .annotate(OpenApi.Description, "User Management");

export const api = HttpApi.make("MyApi")
  .add(userGroup)
  .prefix("/api")
  .annotateMerge(
    OpenApi.annotations({
      title: "My Api",
      version: "1.0.0",
      description: "Users Service",
    }),
  );

export const UsersLive = HttpApiBuilder.group(api, "users", (handlers) =>
  handlers
    .handle("getUser", ({ params }) =>
      Effect.succeed(
        new User({ id: params.id, name: "Ada", email: "ada@example.com" }),
      ),
    )
    .handle("createUser", ({ payload }) =>
      Effect.succeed(
        new User({ id: "1", name: payload.name, email: payload.email }),
      ),
    ),
);

export const AppLive = HttpApiBuilder.layer(api).pipe(Layer.provide(UsersLive));

const BunServerLive = HttpRouter.serve(AppLive).pipe(
  Layer.provide(BunHttpServer.layer({ port: 3002 })),
);

BunRuntime.runMain(Layer.launch(BunServerLive));
