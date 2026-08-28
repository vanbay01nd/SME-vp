import { headers } from "next/headers";
import { SmeWorkspace } from "./sme-workspace";

export default async function Home() {
  const requestHeaders = await headers();
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get(
    "oai-authenticated-user-full-name",
  );
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : encodedFullName;

  return <SmeWorkspace displayName={fullName ?? email ?? "Chuyên viên SME"} />;
}
