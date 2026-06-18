import { createTRPCReact } from "@trpc/react-query";

// Use a generic type instead of importing AppRouter directly
// This avoids circular dependency issues during build
export const trpc = createTRPCReact<any>();
