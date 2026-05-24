// The poker table relies heavily on browser-only APIs (socket.io, matchMedia,
// localStorage, requestAnimationFrame, screen.orientation). Disabling SSR for
// this subroute removes the need for browser guards throughout the table code.
export const ssr = false;
