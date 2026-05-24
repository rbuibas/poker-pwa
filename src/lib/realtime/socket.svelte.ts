import { io, type Socket } from 'socket.io-client';
import { PUBLIC_GAME_SERVER_URL } from '$env/static/public';
import type { ClientToServerEvents, ConnectionStatus, ServerToClientEvents } from './protocol';

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface Holder {
	socket: TypedSocket;
	token: string;
}

let current: Holder | null = null;

export const connection = $state<{ status: ConnectionStatus }>({ status: 'disconnected' });

function attachStatusListeners(socket: TypedSocket): void {
	socket.on('connect', () => {
		connection.status = 'connected';
	});
	socket.on('disconnect', () => {
		connection.status = 'disconnected';
	});
	socket.io.on('reconnect_attempt', () => {
		connection.status = 'reconnecting';
	});
	socket.io.on('reconnect_failed', () => {
		connection.status = 'disconnected';
	});
}

/**
 * Get the singleton socket. If the supplied token differs from the active one,
 * the existing socket is disposed and a fresh one is created. Re-entrant: safe
 * to call from `onMount` on every navigation.
 */
export function getSocket(token: string): TypedSocket {
	if (current && current.token === token) {
		return current.socket;
	}
	if (current) {
		current.socket.removeAllListeners();
		current.socket.disconnect();
		current = null;
	}

	connection.status = 'connecting';
	const socket: TypedSocket = io(PUBLIC_GAME_SERVER_URL, {
		auth: { token },
		transports: ['websocket'],
		reconnection: true,
		reconnectionAttempts: Infinity,
		reconnectionDelay: 500,
		reconnectionDelayMax: 5000,
		autoConnect: true
	});
	attachStatusListeners(socket);
	current = { socket, token };
	return socket;
}

/** Update the auth token on an existing socket and force a reconnect. */
export function refreshSocketAuth(newToken: string): TypedSocket | null {
	if (!current) return null;
	// socket.io-client allows updating handshake.auth before reconnect
	(current.socket.auth as { token: string }) = { token: newToken };
	current.token = newToken;
	current.socket.disconnect();
	connection.status = 'connecting';
	current.socket.connect();
	return current.socket;
}

export function disposeSocket(): void {
	if (!current) return;
	current.socket.removeAllListeners();
	current.socket.disconnect();
	current = null;
	connection.status = 'disconnected';
}
