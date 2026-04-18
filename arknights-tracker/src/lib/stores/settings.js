import { writable } from "svelte/store";
import { browser } from "$app/environment";

const storedDarkening = browser ? localStorage.getItem("disableDarkening") === "true" : false;

export const disableDarkening = writable(storedDarkening);

if (browser) {
    disableDarkening.subscribe(value => {
        localStorage.setItem("disableDarkening", value.toString());
    });
}