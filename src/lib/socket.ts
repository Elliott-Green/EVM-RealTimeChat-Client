import { io } from 'socket.io-client';
import { SOCKET_ENDPOINT } from './config/urlConfig';
import { messageStore, presenceStore, socketStatus } from './stores/chatPresence';
import { account } from './stores/walletStore';
import type { ChatMessage } from '../app';
import { playIncomingMessageSound } from './common/playSound';
import { get } from 'svelte/store';

export let socket: ReturnType<typeof io>;
try {
	socket = io(SOCKET_ENDPOINT, {
		withCredentials: true,
		autoConnect: false,
		reconnection: true,
		transports: ['websocket']
	});
} catch (e) {
	console.log(`Server is cold starting, repolling until ready`);
	socketStatus.set('server warming');
}

let listenersRegistered = false;

export function registerSocketListeners() {
	if (listenersRegistered) return;
	listenersRegistered = true;

	socket.on('connect', () => {
		socketStatus.set('connected');
	});

	socket.on('disconnect', () => {
		socketStatus.set('disconnected');
	});

	socket.on('connect_error', () => {
		socketStatus.set('auth failed');
	});

	socket.on('presence:snapshot', ({ users }: { users: { address: string; online: boolean }[] }) => {
		presenceStore.set(new Map(users.map((u) => [u.address, u.online])));
	});

	socket.on('presence:online', ({ address }: { address: string }) => {
		presenceStore.update((map) => {
			const next = new Map(map);
			next.set(address, true);
			return next;
		});
	});

	socket.on('presence:offline', ({ address }: { address: string }) => {
		presenceStore.update((map) => {
			const next = new Map(map);
			next.set(address, false);
			return next;
		});
	});

	// outgoing
	socket.on('dm:sent', (msg: ChatMessage) => {
		const peer = msg.to;

		messageStore.update((map) => {
			const next = new Map(map);
			const history = next.get(peer) ?? [];
			next.set(peer, [...history, msg]);
			return next;
		});
	});

	// incoming
	socket.on('dm:message', async (msg: ChatMessage) => {
		const isSelf = msg.from === get(account)?.address?.toLowerCase();
		const peer = isSelf ? msg.to : msg.from;

		if (!isSelf) {
			await playIncomingMessageSound();
		}

		messageStore.update((map) => {
			const next = new Map(map);
			const history = next.get(peer) ?? [];
			next.set(peer, [...history, msg]);
			return next;
		});
	});
}
