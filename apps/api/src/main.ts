import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { Layer, Schema } from "effect";
import {
  HttpMiddleware,
  HttpRouter,
  HttpServerResponse,
} from "effect/unstable/http";
import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";

// In Effect v4 each route is a Layer produced by HttpRouter.add(method, path, handler).
// Handlers may be a plain HttpServerResponse or an Effect that yields one.
const HomeRoute = HttpRouter.add(
  "GET",
  "/",
  HttpServerResponse.text("fiberWatch api"),
);

const HealthRoute = HttpRouter.add(
  "GET",
  "/health",
  HttpServerResponse.json({ status: "ok" }),
);

const UserLoginSchema = Schema.Struct({
  email: Schema.String,
  password: Schema.String,
});

const AuthApiGroup = HttpApiGroup.make("auth").add(
  HttpApiEndpoint.post("login", "/login").success(Schema.String),
);

// Combine the route layers, serve them (with request logging), and back the
// server with the Bun runtime on port 3001 (the dashboard owns 3000).
const HttpLive = HttpRouter.serve(Layer.mergeAll(HomeRoute, HealthRoute), {
  middleware: HttpMiddleware.logger,
}).pipe(Layer.provide(BunHttpServer.layer({ port: 3001 })));

BunRuntime.runMain(Layer.launch(HttpLive));
