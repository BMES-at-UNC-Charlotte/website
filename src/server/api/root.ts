import { donationRouter } from "@/server/api/routers/donation";
import { sponsorshipRouter } from "@/server/api/routers/sponsorship";
import { officerRouter } from "@/server/api/routers/officer";
import { embedRouter } from "@/server/api/routers/embed";
import { postRouter } from "@/server/api/routers/post";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  donation: donationRouter,
  sponsorship: sponsorshipRouter,
  post: postRouter,
  officer: officerRouter,
  embed: embedRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
