/**
 * Abstraction cache (Redis).
 * Client technique : `@/lib/redis`. Rate-limit auth en échec fermé si Redis down.
 */
export { getRedis } from "@/lib/redis";
