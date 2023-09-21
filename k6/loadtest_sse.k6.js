import { check, fail } from "k6";
import http from "k6/http";

const publicKey = open("public.pem");

export const options = {
  scenarios: {
    contacts: {
      executor: "constant-vus",
      vus: 10,
      duration: "1s",
      gracefulStop: "2m",
    },
  },
};
export default function () {
  let formData = {
    PUBLIC_KEY: publicKey,
  };

  let res = http.post("https://keelink.cloud/init.php", formData);

  if (
    !check(res, {
      "is http_status 200 & status is 'true'": (r) =>
        r.status === 200 && r.json()["status"] === true,
    })
  ) {
    fail("failed to initialize");
  }

  const [sid, token] = res.json()["message"].split("###");

  res = http.get(
    `https://keelink.cloud/getcredforsid.php?sid=${sid}&token=${token}`,
    {
      headers: {
        Accept: "text/event-stream",
      },
      timeout: "120s",
    }
  );

  if (
    !check(res, {
      "no error thrown": (r) =>
        r.error === "" && (r.status === 0 || r.status === 200),
    })
  ) {
    fail("failed to read credentials");
  }
}
