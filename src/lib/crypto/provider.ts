// src/lib/provider.ts
import { BrowserProvider, ethers } from 'ethers';

let provider: BrowserProvider | null = null;

/**
 * Returns a singleton Ethers BrowserProvider using window.ethereum
 */
export async function getBrowserProvider(modal: any): Promise<ethers.BrowserProvider> {
	if (typeof window === 'undefined') {
		throw new Error('window is not defined — must be used in the browser');
	}

	if (!modal?.getProvider) {
		throw new Error('Wallet modal is not ready or not passed in');
	}

	const eip1193Provider = await modal.getProvider('eip155');
	if (!eip1193Provider) {
		throw new Error('No provider returned from modal');
	}

	// Optional: cache for reuse
	if (!provider) {
		provider = new ethers.BrowserProvider(eip1193Provider);
	}

	return provider;
}
