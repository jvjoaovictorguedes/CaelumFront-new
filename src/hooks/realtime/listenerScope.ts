import type { Socket } from "socket.io-client";

// Each domain removes only handlers that it registered on the shared socket.
export function createListenerScope(socket: Pick<Socket, "on" | "off">) {
  const removers: Array<() => void> = [];
  return {
    on<Args extends unknown[]>(
      event: string,
      handler: (...args: Args) => void,
    ) {
      socket.on(event, handler);
      removers.push(() => socket.off(event, handler));
    },
    dispose() {
      removers.splice(0).forEach((remove) => remove());
    },
  };
}
