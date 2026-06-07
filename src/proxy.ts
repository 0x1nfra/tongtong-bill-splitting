import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";

export const proxy = convexAuthNextjsMiddleware();

// Only intercept auth action proxy routes — no route gating (auth is optional per D-01)
export const config = {
  matcher: ["/api/auth(.*)"],
};
