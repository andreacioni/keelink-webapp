import { check, fail, sleep } from "k6";
import http from "k6/http";

const publicKey = open("public.pem");

export const options = {
  scenarios: {
    contacts: {
      executor: "constant-vus",
      vus: 10,
      duration: "10s",
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

  for (let i = 0; i < 60; i++) {
    res = http.get(
      `https://keelink.cloud/getcredforsid.php?sid=${sid}&token=${token}`
    );

    if (
      !check(res, {
        "no error thrown": (r) => r.status === 200,
      })
    ) {
      fail("failed to read credentials");
    }
    sleep(1);
  }
}
