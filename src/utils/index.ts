export function getNotFoundResponse(path: string, httpMethod: string) {
  return {
    statusCode: 400,
    body: JSON.stringify({ message: "NOT FOUND", path, httpMethod }),
  };
}
