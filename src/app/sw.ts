/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type {
  PrecacheEntry,
  RouteMatchCallbackOptions,
  RuntimeCaching,
  SerwistGlobalConfig,
} from "serwist";
import {
  ExpirationPlugin,
  Serwist,
  StaleWhileRevalidate,
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Widget taps open a cold PWA. Default @serwist/next caching is NetworkFirst,
// which still waits for the server round-trip before painting. For shell paths
// we instead want StaleWhileRevalidate: paint last-known HTML/RSC instantly
// from cache, then refresh it in the background for the next launch.
//
// Items come from localStorage (see src/lib/item-cache.ts) so the shell only
// carries store metadata (name/icon/color) that rarely changes — safe to
// serve stale for a minute or two.
function isShellPath(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname.startsWith("/s/")) return true;
  return false;
}

function buildShellStrategy(cacheName: string): StaleWhileRevalidate {
  return new StaleWhileRevalidate({
    cacheName,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 24,
        maxAgeSeconds: 24 * 60 * 60,
      }),
    ],
  });
}

const shellRscStrategy = buildShellStrategy("shell-rsc");
const shellHtmlStrategy = buildShellStrategy("shell-html");

// Must run BEFORE the defaultCache's HTML/RSC handlers — serwist evaluates
// runtimeCaching in order and stops at the first match.
const shellCaching: RuntimeCaching[] = [
  {
    matcher: ({ request, url, sameOrigin }: RouteMatchCallbackOptions) =>
      sameOrigin &&
      request.headers.get("RSC") === "1" &&
      isShellPath(url.pathname),
    handler: shellRscStrategy,
  },
  {
    matcher: ({ request, url, sameOrigin }: RouteMatchCallbackOptions) =>
      sameOrigin &&
      request.mode === "navigate" &&
      isShellPath(url.pathname),
    handler: shellHtmlStrategy,
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [...shellCaching, ...defaultCache],
});

serwist.addEventListeners();
