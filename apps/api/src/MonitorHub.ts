import { Context, Effect, Layer, PubSub, Scope } from "effect";
import { EndpointResult } from "./probe";

interface MonitorHubInt {
  publish: (event: EndpointResult) => Effect.Effect<void>;
  subscribe: () => Effect.Effect<
    PubSub.Subscription<EndpointResult>,
    never,
    Scope.Scope
  >;
}

export class MonitorHub extends Context.Service<MonitorHub, MonitorHubInt>()(
  "MonitorHub",
) {}

export const MonitorHubLive = Layer.effect(
  MonitorHub,
  Effect.gen(function* () {
    const hub = yield* PubSub.unbounded<EndpointResult>();
    return {
      publish: (event) => PubSub.publish(hub, event),
      subscribe: () => PubSub.subscribe(hub),
    };
  }),
);
