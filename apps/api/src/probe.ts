import { Effect } from "effect";

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

declare const probe: (
  targets: string | string[],
  options?: ProbeOptions,
) => Effect.Effect<ProbeReport, InvalidTargets>;

// Step1: Check url is present
// Step2: store the time before fetch call
// Step3: await fetch call to that url
// Step4: Store the end time after fetch call (response time will be in between)
// Step5: check response status, if it success
// status: 'up', statusCode: get it from reseponse
// reseponseTime: calculate step2 and 4
// If it fails status: 'down', statusCode: reseponse.statusCode/status reseponseTime: same
// Steps6: Response that never reached the server or time out before getting a response, we'll show status: 'down' with statusCode: undefined, responseTime could undefined, I think in that case we might need an optional messageType to let user know whats just happen with this rul particualarly, becaus its neither success nor failed type situation
