import { browser } from '$app/environment';
import { createAppKit } from '@reown/appkit';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { mainnet, sepolia, baseSepolia } from '@reown/appkit/networks';

// Only initialize in browser environment
let modal: ReturnType<typeof createAppKit> | undefined = undefined;

if (browser) {
	const projectId = import.meta.env.VITE_PROJECT_ID || 'd534471ba14c42c650ce486040d07423';
	if (!projectId) {
		throw new Error('VITE_PROJECT_ID is not set');
	}

	// Create adapter
	const ethersAdapter = new EthersAdapter();

	// Initialize AppKit
	modal = createAppKit({
		adapters: [ethersAdapter],
		networks: [mainnet, baseSepolia],
		defaultNetwork: baseSepolia,
		projectId,
		themeMode: 'light',
		enableReconnect: true,
		features: {
			email: false,
			socials: false,
			swaps: false,
			onramp: false,
			pay: false
		},
		// themeMode: 'dark',
		metadata: {
			name: 'SvelteKit Example',
			description: 'SvelteKit Example using Ethers adapter',
			url: 'https://reown.com/appkit',
			icons: ['https://avatars.githubusercontent.com/u/179229932?s=200&v=4']
		}
	});
}

export { modal };
