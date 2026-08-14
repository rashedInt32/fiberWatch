import {
  Context,
  Effect,
  Layer,
  PubSub,
  Schedule,
  Scope,
  Stream,
} from "effect";
import { EndpointResult, probe } from "./probe";
import { HttpServerResponse } from "effect/unstable/http";

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

export const MonitorLoop = (urls: string[]) =>
  Effect.gen(function* () {
    const hub = yield* MonitorHub;
    const report = yield* probe(urls);
    yield* Effect.forEach(report.results, (r) => hub.publish(r));
  }).pipe(Effect.repeat(Schedule.spaced("10 seconds")));

export const handleStream = Effect.gen(function* () {
  const hub = yield* MonitorHub;
  const sub = yield* hub.subscribe();

  const body = Stream.fromSubscription(sub).pipe(
    Stream.map((r) => `data: ${JSON.stringify(r)} \n\n`),
    Stream.encodeText,
  );

  return HttpServerResponse.stream(body, {
    headers: { "content-type": "text/event-stream" },
  });
});
