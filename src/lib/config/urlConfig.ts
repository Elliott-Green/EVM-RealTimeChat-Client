export const DEV_STATUS = Number(import.meta.env.VITE_DEV_STATUS) as 1 | 2 | 3;

const LOCAL_IP = import.meta.env.VITE_LAN_IP // your machine LAN IP


export const SOCKET_ENDPOINT = (() => {
	switch (DEV_STATUS) {
		case 1:
			return 'http://localhost:10000';
		case 2:
			return `http://${LOCAL_IP}:10000`;
		case 3:
			return 'https://evm-realtimechat-server.onrender.com';
	}
})();
