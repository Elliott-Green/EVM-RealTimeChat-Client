<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.jpg';
	import WalletConnectButton from '../components/WalletConnectButton.svelte';

	let { children } = $props();

	import { AppBar } from '@skeletonlabs/skeleton-svelte';
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<AppBar>
	<AppBar.Toolbar class="grid-cols-[auto_1fr_auto]">
		<AppBar.Lead />
		<AppBar.Headline>
			<p class="text-md lg:text-2xl">EVM RealTimeChat</p>
		</AppBar.Headline>
		<AppBar.Trail>
			<WalletConnectButton />
		</AppBar.Trail>
	</AppBar.Toolbar>
</AppBar>

<main class="grid min-h-0 flex-1 grid-rows-[1fr] overflow-hidden">
	{@render children?.()}
</main>
