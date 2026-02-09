import { browser } from '$app/environment';

let audio: HTMLAudioElement | null = null;

export async function playIncomingMessageSound() {
	if (!browser) return;

	if (!audio) {
		audio = new Audio('/sounds/incoming-message.mp3');
		audio.volume = 0.1;
	}

	// rewind in case messages arrive quickly
	audio.currentTime = 0;
	await audio.play().catch(() => {});
}

export async function playOutgoingMessageSound() {
	if (!browser) return;

	if (!audio) {
		audio = new Audio('/sounds/outgoing-message.mp3');
		audio.volume = 0.1;
	}

	// rewind in case messages arrive quickly
	audio.currentTime = 0;
	await audio.play().catch(() => {});
}
