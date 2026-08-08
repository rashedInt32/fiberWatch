import { expect, test } from "bun:test";
import { Effect, Layer } from "effect";
import { getGithubUser } from "./github";
import { Fetcher } from "./http";

// the seam: one fake Fetcher, parameterised by a canned response
const fake = (res: Response) =>
  Layer.succeed(Fetcher, { get: () => Effect.succeed(res) });

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

const validUser = {
  id: 1,
  login: "ada",
  name: null,
  email: null,
  public_repos: 3,
};

test("200 + valid body → User", async () => {
  const user = await Effect.runPromise(
    getGithubUser("ada").pipe(Effect.provide(fake(json(validUser)))),
  );
  expect(user.login).toBe("ada");
});

test("404 → UserNotFound", async () => {
  const err = await Effect.runPromise(
    getGithubUser("nope").pipe(
      Effect.provide(fake(json({}, 404))),
      Effect.flip,
    ),
  );
  expect(err._tag).toBe("UserNotFound");
});
test("500 → Server error", async () => {
  const err = await Effect.runPromise(
    getGithubUser("nope").pipe(
      Effect.provide(fake(json({}, 500))),
      Effect.flip,
    ),
  );
  expect(err._tag).toBe("ServerError");
});
