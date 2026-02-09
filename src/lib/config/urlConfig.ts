export const DEV_STATUS = Number(import.meta.env.VITE_DEV_STATUS) as 1 | 2 | 3;

const LOCAL_IP = import.meta.env.VITE_LAN_IP // your machine LAN IP

function resolveSocketEndpoint(): string {
	switch (DEV_STATUS) {
		case 1:
			return 'http://localhost:10000';
		case 2:
			if (!LOCAL_IP) return 'http://localhost:10000';
			return `http://${LOCAL_IP}:10000`;
		case 3:
			return 'https://evm-realtimechat-server.onrender.com';
		default:
			// Fallback prevents "/undefined/..." URLs when env vars are missing.
			return 'http://localhost:10000';
	}
}

export const SOCKET_ENDPOINT = resolveSocketEndpoint();
export const AUTH_ENDPOINT = SOCKET_ENDPOINT;
