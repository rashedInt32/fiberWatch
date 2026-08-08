import { Array, Effect, Schema } from "effect";
import { Input } from "effect/Duration";

export class EndpointResult extends Schema.Class<EndpointResult>(
  "EndpointResult",
)({
  url: Schema.String,
  status: Schema.Literals(["up", "down"]),
  statusCode: Schema.Union([Schema.Number, Schema.Undefined]),
  responseTime: Schema.Union([Schema.Number, Schema.Undefined]),
  message: Schema.optional(Schema.String),
}) {}

export class ProbeReport extends Schema.Class<ProbeReport>("ProbeReport")({
  results: Schema.Array(EndpointResult),
  total: Schema.Number,
  up: Schema.Number,
  down: Schema.Number,
}) {}

export type ProbeOptions = {
  timeout?: Input;
};

export class InvalidTargets extends Schema.TaggedErrorClass<InvalidTargets>()(
  "InvalidTargets",
  {
    message: Schema.String,
  },
  { httpApiStatus: 400 },
) {}

export const probe = (
  targets: string | readonly string[],
  options?: ProbeOptions,
): Effect.Effect<ProbeReport, InvalidTargets> =>
  Effect.gen(function* () {
    const urls = typeof targets === "string" ? [targets] : targets;
    if (urls.length === 0 || urls.some((u) => u.trim() === "")) {
      return yield* new InvalidTargets({
        message: "Url is either empty or missing",
      });
    }

    const results = yield* Effect.all(
      urls.map((u) => probeImpl(u, options?.timeout)),
      { concurrency: 10 },
    );

    const up = results.filter((r) => r.status === "up").length;
    const down = results.filter((r) => r.status === "down").length;

    return new ProbeReport({
      results,
      up,
      down,
      total: results.length,
    });
  });

const probeImpl = (
  url: string,
  timeout: Input = "10 second",
): Effect.Effect<EndpointResult> =>
  Effect.gen(function* () {
    const start = new Date();
    const response = yield* Effect.tryPromise({
      try: () => fetch(url),
      catch: (error) => error,
    });

    const end = new Date();
    return new EndpointResult({
      url,
      status: response.ok ? "up" : "down",
      statusCode: response.status,
      responseTime: end.getTime() - start.getTime(),
    });
  }).pipe(
    Effect.timeout(timeout),
    Effect.catch((error) =>
      Effect.succeed(
        new EndpointResult({
          url,
          status: "down",
          statusCode: undefined,
          responseTime: undefined,
          message: String(error),
        }),
      ),
    ),
  );

// Step1: Check url is present
// Step2: store the time before fetch call
// Step3: await fetch call to that url
// Step4: Store the end time after fetch call (response time will be in between)
// Step5: check response status, if it success
// status: 'up', statusCode: get it from reseponse
// reseponseTime: calculate step2 and 4
// If it fails status: 'down', statusCode: reseponse.statusCode/status reseponseTime: same
// Steps6: Response that never reached the server or time out before getting a response, we'll show status: 'down' with statusCode: undefined, responseTime could undefined, I think in that case we might need an optional messageType to let user know whats just happen with this rul particualarly, becaus its neither success nor failed type situation
