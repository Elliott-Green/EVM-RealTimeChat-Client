import { writable } from 'svelte/store';
import type { ChatMessage } from '../../app';

export const socketStatus = writable<'connected' | 'disconnected' | 'server warming'>('disconnected');

export const presenceStore = writable<Map<string, boolean>>(new Map());

export const messageStore = writable<Map<string, ChatMessage[]>>(new Map());
