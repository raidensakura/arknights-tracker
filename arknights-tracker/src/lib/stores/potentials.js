// src/lib/stores/potentials.js
import { writable } from 'svelte/store';

const isBrowser = typeof window !== 'undefined';
const storedPots = isBrowser ? localStorage.getItem('operatorPotentialsByAccount') : null;
const initialPots = storedPots ? JSON.parse(storedPots) : {};

export const manualPotentials = writable(initialPots);

if (isBrowser) {
    manualPotentials.subscribe(value => {
        localStorage.setItem('operatorPotentialsByAccount', JSON.stringify(value));
    });
}