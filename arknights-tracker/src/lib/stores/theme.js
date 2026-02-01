// src/lib/stores/theme.js
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// 1. Ставим false (Светлая тема по умолчанию)
const defaultValue = false;

// 2. Убираем проверку системных настроек (window.matchMedia), 
// чтобы сайт не становился черным, если у пользователя на ПК темная тема.
// Теперь он будет темным ТОЛЬКО если пользователь сам нажал кнопку (сохранено в localStorage).
const initialValue = browser
    ? localStorage.getItem('theme') === 'dark'
    : defaultValue;

export const isDarkMode = writable(initialValue);

// Подписка для обновления класса на html (чтобы tailwind работал)
if (browser) {
    isDarkMode.subscribe((value) => {
        if (value) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    });
}