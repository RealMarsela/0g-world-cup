export interface Env {
  ROOM_STATE: DurableObjectNamespace<RoomState>;
  ACTIVE_SNAPSHOT: KVNamespace;
  DB: D1Database;
  SNAPSHOTS: R2Bucket;
}

type RoomMessage =
  | { type: "join"; playerId: string }
  | { type: "pick"; playerId: string; playerName: string }
  | { type: "lock"; lineupHash: string };

export class RoomState {
  private state: DurableObjectState;
  private sockets = new Set<WebSocket>();

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      const stored = await this.state.storage.get("room");
      return Response.json(stored ?? { picks: [], locked: [] });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();
    this.sockets.add(server);

    server.addEventListener("message", async (event) => {
      const message = JSON.parse(String(event.data)) as RoomMessage;
      const room = ((await this.state.storage.get("room")) as any) ?? { picks: [], locked: [] };
      if (message.type === "pick") room.picks.push(message);
      if (message.type === "lock") room.locked.push(message.lineupHash);
      await this.state.storage.put("room", room);
      this.broadcast(room);
    });

    server.addEventListener("close", () => this.sockets.delete(server));
    return new Response(null, { status: 101, webSocket: client });
  }

  private broadcast(payload: unknown) {
    const body = JSON.stringify(payload);
    for (const socket of this.sockets) socket.send(body);
  }
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    const roomId = url.pathname.split("/").filter(Boolean).at(-1) || "demo";
    const id = env.ROOM_STATE.idFromName(roomId);
    return env.ROOM_STATE.get(id).fetch(request);
  },
};
