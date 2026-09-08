import { randomUUID } from "node:crypto";

export const REQUEST_ID_HEADER = "x-request-id";

type HeaderBag = { headers: Record<string, unknown> };
type HeaderReply = { header: (name: string, value: string) => unknown };

export function attachRequestId(req: HeaderBag, reply: HeaderReply, done: () => void) {
  const incoming = req.headers[REQUEST_ID_HEADER];
  const id = typeof incoming === "string" && incoming.length <= 80 ? incoming : randomUUID();
  req.headers[REQUEST_ID_HEADER] = id;
  reply.header(REQUEST_ID_HEADER, id);
  done();
}

export function getRequestId(req: HeaderBag): string {
  const value = req.headers[REQUEST_ID_HEADER];
  return typeof value === "string" ? value : "unknown";
}
