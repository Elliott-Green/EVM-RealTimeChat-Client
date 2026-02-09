<script lang="ts">
	import { registerSocketListeners, socket } from '$lib/socket';
	import { account, walletActions } from '$lib/stores/walletStore';
	import { AUTH_ENDPOINT } from '$lib/config/urlConfig';
	import { ethers } from 'ethers';
	import { messageStore, presenceStore, socketStatus } from '$lib/stores/chatPresence';
	import { SendIcon } from 'lucide-svelte';
	import { playOutgoingMessageSound } from '$lib/common/playSound';
	import { get } from 'svelte/store';

	// Contains the address that's selected via the online users
	let activeChatWith: string | null = $state(null);
	// Contains the current entered chat message
	let currentMessage = $state('');
	// A reference to the chat's textbox to perform scroll actions on message sent/recieved
	let chatTextBox: HTMLElement;
	let authenticatedAddress: string | null = $state(null);
	let isAuthenticating = $state(false);
	let authError: string | null = $state(null);
	let hasRegisteredListeners = false;

	async function authenticateSocket(address: string) {
		if (isAuthenticating) return;
		isAuthenticating = true;
		authError = null;
		socketStatus.set('authenticating');

		try {
			const walletProvider = await walletActions.getProvider();
			if (!walletProvider) throw new Error('Wallet provider is unavailable');

			const provider = new ethers.BrowserProvider(walletProvider);
			const chainId = Number((await provider.getNetwork()).chainId);
			const signer = await provider.getSigner();

			const query = new URLSearchParams({ address, chainId: String(chainId) });
			const nonceResponse = await fetch(`${AUTH_ENDPOINT}/auth/nonce?${query.toString()}`, {
				credentials: 'include'
			});

			if (!nonceResponse.ok) {
				throw new Error('Could not create a sign-in challenge');
			}

			const { typedData } = await nonceResponse.json();
			const signature = await signer.signTypedData(typedData.domain, typedData.types, typedData.message);

			socket.auth = {
				address,
				signature,
				typedData: {
					domain: typedData.domain,
					message: typedData.message
				}
			};

			if (!hasRegisteredListeners) {
				registerSocketListeners();
				hasRegisteredListeners = true;
			}

			if (socket.connected) {
				socket.disconnect();
			}

			socket.connect();
			authenticatedAddress = address.toLowerCase();
		} catch (error) {
			authenticatedAddress = null;
			socket.disconnect();
			socketStatus.set('auth failed');
			authError = error instanceof Error ? error.message : 'Sign-in failed';
		} finally {
			isAuthenticating = false;
		}
	}

	$effect(() => {
		const rawAddress = $account?.address;
		const connected = $account?.isConnected;
		const normalizedAddress = rawAddress?.toLowerCase();

		if (!rawAddress || !connected) {
			authenticatedAddress = null;
			authError = null;
			activeChatWith = null;
			socket.auth = {};
			if (socket.connected) socket.disconnect();
			socketStatus.set('disconnected');
			messageStore.set(new Map());
			presenceStore.set(new Map());
			return;
		}

		if (normalizedAddress !== authenticatedAddress) {
			void authenticateSocket(rawAddress);
		}
	});

	/**
	 * @summary Emits a message to the websocket server to another user
	 */
	function sendMessage() {
		if (!activeChatWith || !currentMessage.trim() || get(socketStatus) !== 'connected') return;

		socket.emit('dm:send', {
			from: $account.address,
			to: activeChatWith,
			body: currentMessage.trim(),
			ts: new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
		});
		currentMessage = '';
	}

	/**
	 * @summary Scrolls the text to the bottom of the window after a short delay
	 * 			Contains all of the keys for the behaviour of the window scrolls
	 * @param event the event containing the key pressed
	 */
	export async function scrollChatBottom(behavior?: 'auto' | 'instant' | 'smooth') {
		if (chatTextBox) {
			console.log(`scrolling`);
			await new Promise((resolve) => setTimeout(resolve, 100));

			chatTextBox.scrollTo({ top: chatTextBox.scrollHeight, behavior });
		}
	}

	/**
	 * @summary Whenever a key is pressed in the text input:
	 * 			Check if it contains an enter if so, send message
	 * @param event the event containing the key pressed
	 */
	function onPromptKeydown(event: KeyboardEvent) {
		if (['Enter'].includes(event.code)) {
			event.preventDefault();
			sendMessage();
			scrollChatBottom('smooth');
		}
	}

	/**
	 * @summary Opens a chat between the current user and some other 'online' user
	 * 			This onclick handler is disabled for 'offline' users
	 * @param requestAddress
	 */
	function startOrOpenChatWith(requestAddress: string): any {
		activeChatWith = requestAddress;
	}

	// Scroll chat to the bottom on a new message, either from user or recipient
	messageStore.subscribe(async () => await scrollChatBottom('smooth'));

	// Hook into dm:recieve to play a noise
	socket.on('dm:receive', async () => {
		await playOutgoingMessageSound();
	});
</script>

{#if !$account.isConnected}
	<div class="mx-4 mt-4">
		<div class="w-full space-y-4 card preset-filled-surface-500 p-6 ">
			<p class=" text-xl">
				Connect an Ethereum wallet to join the WebSocket server and start chatting - best enjoyed
				with a friend.
			</p>

			<p class="text-base sm:text-lg">
				Check out the frontend README for a deeper dive into the architecture, design motivation,
				and technical trade-offs behind this project. Contributions that push the boilerplate
				forward are always welcome.
			</p>

			<div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
				<a href="https://github.com/Elliott-Green/EVM-RealTimeChat-Client" target="_blank">
					<button type="button" class="btn w-full preset-filled-primary-500 lg:btn-lg sm:w-auto">
						SvelteKit Frontend Repo
					</button></a
				>
				<a href="https://github.com/Elliott-Green/EVM-RealTimeChat-Server" target="_blank">
					<button type="button" class="btn w-full preset-filled-secondary-500 lg:btn-lg sm:w-auto">
						Node WebSocket Backend Repo
					</button></a
				>
				<a href="https://x.com/CryptoNines" target="_blank">
					<button type="button" class="btn w-full preset-filled-warning-500 lg:btn-lg sm:w-auto">
						Dev Twitter
					</button></a
				>
			</div>
		</div>
	</div>
{/if}

<div class="flex h-[90dvh] flex-col overflow-hidden">
	<div class="grid min-h-0 w-full flex-1 grid-cols-1 gap-4 p-4 xl:grid-cols-10">
		<!-- Sidebar -->
		<div
			class="col-span-1 flex min-h-0 w-full flex-col rounded-xl bg-surface-500/30 p-4 xl:col-span-2"
		>
			<div class="flex items-center justify-between">
				<p class="text-xl font-extrabold">Connected Users</p>
				<span class="text-sm text-surface-300">
				{#if $account.isConnected && $socketStatus === 'connected'}
						{[...$presenceStore.values()].filter((v) => v === true).length}
					{:else}
						0
					{/if}
				</span>
			</div>

			<hr class="my-2 border-white/20" />

			{#if $account.isConnected && $socketStatus === 'connected'}
				<div class="flex min-h-0 flex-1 flex-col overflow-y-auto">
					{#each [...$presenceStore].sort( ([a], [b]) => a.localeCompare(b) ) as [address, online] (address)}
						<button
							type="button"
							class="
								flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left
								transition-colors
								{online ? 'hover:bg-primary-200/30' : 'cursor-not-allowed hover:bg-surface-400/20'}
								{activeChatWith == address ? 'bg-primary-500' : ''}
							"
							disabled={!online}
							onclick={() => startOrOpenChatWith(address)}
						>
							<span
								class="
									size-2 shrink-0 rounded-full
									{online ? 'bg-success-500' : 'bg-surface-500'}
								"
							></span>

							<p
								class="truncate text-sm sm:text-base
								{online ? '' : 'text-surface-500'}"
							>
								{address.slice(0, 8)}…{address.slice(-8)}
								{#if address.toLowerCase() === $account?.address?.toLowerCase()}
									<span class="ml-1 text-xs text-surface-400">(You)</span>
								{/if}
							</p>
						</button>
					{/each}
				</div>
				{:else}
					<div class="flex flex-1 items-center justify-center text-surface-300">
						{#if $account.isConnected && $socketStatus === 'authenticating'}
							Waiting for signature...
						{:else if $account.isConnected && $socketStatus === 'auth failed'}
							Authentication failed{authError ? `: ${authError}` : ''}. Reconnect wallet and sign again.
						{:else}
							Connect wallet and sign to chat
						{/if}
					</div>
				{/if}
			</div>

		<!-- Chat -->
		<div
			class="col-span-1 flex min-h-0 w-full flex-col overflow-hidden rounded-xl bg-surface-800/30 p-4 xl:col-span-8"
		>
			<!-- Header -->
			<header class="shrink-0">
				<p class="text-xl font-extrabold">
					{#if activeChatWith}
						Chatting with {activeChatWith.slice(0, 6)}…{activeChatWith.slice(-4)}
					{:else}
						Chat
					{/if}
				</p>
				<hr class="my-2 border-white/20" />
			</header>

			<!-- Body -->
			<div class="flex min-h-0 flex-1 flex-col">
				<!-- Messages -->
				<div
					bind:this={chatTextBox}
					class="
				flex min-h-0 flex-1 flex-col gap-4
				overflow-y-auto
				p-8 pb-4
			"
				>
					<!-- Empty state lives INSIDE messages area -->
					{#if ($messageStore.get(activeChatWith ?? '')?.length ?? 0) === 0}
						<div class="flex flex-1 items-center justify-center">
							<p class="text-sm text-surface-400">Start the conversation 👋</p>
						</div>
					{/if}

					{#each $messageStore.get(activeChatWith ?? '') ?? [] as msg, i (`${msg.ts}-${i}`)}
						<div class="flex w-full">
							{#if msg.from.toLowerCase() === $account?.address?.toLowerCase()}
								<!-- From You -->
								<div
									class="
								ml-auto max-w-[80%]
								rounded-xl rounded-bl-none
								bg-primary-500/20 p-4
							"
								>
									<div class="mb-1 flex justify-between space-x-10 text-[10px] opacity-70">
										<p>You</p>
										<p>{new Date(msg.ts).toLocaleTimeString()}</p>
									</div>
									<p class="wrap-break-words">{msg.body}</p>
								</div>
							{:else}
								<!-- From Friend -->
								<div
									class="
								mr-auto max-w-[80%]
								rounded-xl rounded-tr-none
								bg-secondary-500/20 p-4
							"
								>
									<div class="mb-1 flex space-x-10 text-[10px] opacity-70">
										<p>{msg.from.slice(0, 6)}…{msg.from.slice(-4)}</p>
										<p>{new Date(msg.ts).toLocaleTimeString()}</p>
									</div>
									<p class="wrap-break-words">{msg.body}</p>
								</div>
							{/if}
						</div>
					{/each}
				</div>

				<!-- Input (ALWAYS bottom) -->
				<section class="shrink-0 border-t border-white/10 pt-4">
					<div
						class="
					grid grid-cols-[1fr_auto]
					overflow-hidden rounded-lg
					border border-primary-500 outline-none focus:border-0 focus:ring-0 focus:outline-none
				"
					>
							<input
								bind:value={currentMessage}
								class="border-0 bg-transparent p-10 px-3 py-2 outline-none focus:border-0 focus:ring-0 focus:outline-none"
								placeholder={activeChatWith ? 'Write a message…' : 'Choose a recipient...'}
								onkeydown={onPromptKeydown}
								disabled={!activeChatWith || $socketStatus !== 'connected'}
							/>

						<button
							type="button"
								class="
							px-4 transition-colors
							{currentMessage ? 'bg-primary-500 hover:bg-primary-400' : 'bg-surface-700'}
						"
								onclick={sendMessage}
								disabled={!currentMessage || $socketStatus !== 'connected'}
							>
							<SendIcon />
						</button>
					</div>
				</section>
			</div>
		</div>
	</div>
</div>
