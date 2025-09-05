export type ClientPrincipal = {
  identityProvider: string;
  userId: string;
  userDetails: string; // usually email/UPN
  userRoles: string[]; // includes "authenticated" and any app roles/group names
  claims?: { typ: string; val: string }[];
};

export function getClientPrincipal(req: {
  headers: Headers | Record<string, string>;
}): ClientPrincipal | null {
  // Azure Functions v4 Node: req.headers may be a Headers-like map
  const get = (name: string) =>
    (req.headers as any).get?.(name) ??
    (req.headers as any)[name] ??
    (req.headers as any)[name.toLowerCase()];
  const encoded = get('x-ms-client-principal');
  if (!encoded) return null;
  const json = Buffer.from(encoded, 'base64').toString('utf8');
  return JSON.parse(json);
}
