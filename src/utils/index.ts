export function getNotFoundResponse(path: string, httpMethod: string) {
  return {
    statusCode: 400,
    body: JSON.stringify({ message: "NOT FOUND", path, httpMethod }),
  };
}

export const parseCookies = (cookieHeader: string | undefined) => {
  if (!cookieHeader) {
    return {};
  }
  return cookieHeader.split(";").reduce(
    (cookies, cookie) => {
      const [name, value] = cookie.split("=").map((c) => c.trim());
      cookies[name] = value;
      return cookies;
    },
    {} as Record<string, string>,
  );
};
