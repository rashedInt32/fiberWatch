import { Array, Effect, Schema } from "effect";
import { Input } from "effect/Duration";

type EndpointResult = {
  url: string;
  status: "up" | "down";
  statusCode: number | undefined;
  responseTime: number | undefined;
  message?: string;
};

type ProbeReport = {
  results: EndpointResult[];
  total: number;
  up: number;
  down: number;
};

type ProbeOptions = {
  timeout?: Input;
};

class InvalidTargets extends Schema.TaggedErrorClass<InvalidTargets>()(
  "InvalidTargets",
  {
    message: Schema.String,
  },
) {}

const probe = (
  targets: string | string[],
  options?: ProbeOptions,
): Effect.Effect<ProbeReport, InvalidTargets> =>
  Effect.gen(function* () {
    const urls = Array.isArray(targets) ? targets : [targets];
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

    return {
      results,
      up,
      down,
      total: results.length,
    };
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
    return {
      url,
      status: response.ok ? "up" : "down",
      statusCode: response.status,
      responseTime: end.getTime() - start.getTime(),
    } satisfies EndpointResult;
  }).pipe(
    Effect.timeout(timeout),
    Effect.catch((error) =>
      Effect.succeed({
        url,
        status: "down",
        statusCode: undefined,
        responseTime: undefined,
        message: String(error),
      } satisfies EndpointResult),
    ),
  );

const report = await Effect.runPromise(
  probe(
    [
      "https://example.com",
      "https://github.com",
      "https://cloudflare.com",
      "https://wikipedia.org",
      "https://mozilla.org",
    ],
    { timeout: "1 second" },
  ),
).then(console.log);
//console.log(report.total, `${Date.now() - t}ms`);

// Step1: Check url is present
// Step2: store the time before fetch call
// Step3: await fetch call to that url
// Step4: Store the end time after fetch call (response time will be in between)
// Step5: check response status, if it success
// status: 'up', statusCode: get it from reseponse
// reseponseTime: calculate step2 and 4
// If it fails status: 'down', statusCode: reseponse.statusCode/status reseponseTime: same
// Steps6: Response that never reached the server or time out before getting a response, we'll show status: 'down' with statusCode: undefined, responseTime could undefined, I think in that case we might need an optional messageType to let user know whats just happen with this rul particualarly, becaus its neither success nor failed type situation
