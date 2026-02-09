<script lang="ts">
	import { modal } from '$lib/crypto/appkit';
	import { account, network, walletActions } from '$lib/stores/walletStore';
	import { Copy, ExternalLink, Wallet, Unplug } from 'lucide-svelte';
	import { socket } from '$lib/socket';

	// Format address for display
	function formatAddress(address: string): string {
		if (!address) return '';
		return `${address.slice(0, 6)}...${address.slice(-6)}`;
	}

	// Copy address to clipboard
	async function copyAddress() {
		if ($account.address) {
			await navigator.clipboard.writeText($account.address);
		}
	}

	// Open address in explorer
	function openInExplorer() {
		if ($account.address && $network.chainId) {
			const explorer = modal?.getCaipNetwork()?.blockExplorers?.default.url;
			if (explorer) {
				window.open(`${explorer}/address/${$account.address}`, '_blank');
			}
		}
	}

	async function openModal() {
		return await modal?.open();
	}

	async function disconnectWallet() {
		await walletActions.disconnect();
		socket.emit('disconnect');
	}
</script>

<div class="flex items-center gap-1 rounded-lg border border-primary-500/60 p-1 sm:gap-2 sm:p-1.5">
	{#if $account.isConnected}
		<!-- Connected -->
		<div class="flex items-center gap-1 sm:gap-2">
			<!-- Wallet button -->
			<button
				onclick={openModal}
				class="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium
					transition-colors hover:text-primary-500
					sm:px-3 sm:py-2 sm:text-sm"
				aria-roledescription="Open wallet"
			>
				<Wallet class="h-3.5 w-3.5 sm:h-4 sm:w-4" />

				<!-- Address: shorter on mobile -->
				<span class="hidden sm:inline">
					{formatAddress($account.address || '')}
				</span>
				<span class="sm:hidden">
					{$account.address?.slice(0, 4)}…{$account.address?.slice(-3)}
				</span>
			</button>

			<!-- Actions -->
			<div class="flex items-center">
				<button
					onclick={copyAddress}
					title="Copy address"
					class="hidden rounded-md p-1.5 transition-colors hover:text-primary-500 sm:inline-flex"
				>
					<Copy class="h-3.5 w-3.5 sm:h-4 sm:w-4" />
				</button>

				<button
					onclick={openInExplorer}
					title="View in explorer"
					class="rounded-md p-1.5 transition-colors hover:text-primary-500"
				>
					<ExternalLink class="h-3.5 w-3.5 sm:h-4 sm:w-4" />
				</button>

				<button
					onclick={disconnectWallet}
					title="Disconnect"
					class="rounded-md p-1.5 transition-colors hover:text-red-400"
				>
					<Unplug class="h-3.5 w-3.5 sm:h-4 sm:w-4" />
				</button>
			</div>
		</div>
	{:else}
		<!-- Disconnected -->
		<button
			onclick={() => walletActions.open()}
			class="flex items-center gap-1.5 rounded-md bg-primary-500
				px-3 py-1.5 text-xs font-semibold text-white
				transition-colors hover:bg-primary-600
				sm:px-4 sm:py-2 sm:text-sm"
		>
			<Wallet class="h-3.5 w-3.5 sm:h-4 sm:w-4" />
			<span class="hidden sm:inline">Connect Wallet</span>
			<span class="sm:hidden">Connect</span>
		</button>
	{/if}
</div>
