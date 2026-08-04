export const PUBLIC_PATHS = ["/login", "/signup"];

export const isPublicPath = (pathname: string) =>
  PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
