import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../server/routers";

// Create TRPC client with type-only import to avoid circular dependencies
export const trpc = createTRPCReact<AppRouter>();
