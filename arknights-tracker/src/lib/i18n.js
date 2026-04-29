// src/lib/i18n.js

import { derived, writable } from 'svelte/store';
import { currentLocale } from '$lib/stores/locale';

const localeModules = import.meta.glob('./locales/*.json');
const loadedTranslations = writable({});

export const isI18nReady = writable(false);

const getNestedValue = (obj, path) => {
    if (!obj) return null;
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

const formatString = (str, vars) => {
    if (!vars) return str;
    return Object.keys(vars).reduce((acc, key) => {
        return acc.replace(new RegExp(`{${key}}`, 'g'), vars[key]);
    }, str);
};

const getFileName = (code) => {
    if (code === 'zh-CN') return 'zhcn';
    if (code === 'zh-TW') return 'zhtw';
    return code;
};

const loadLocale = async (locale) => {
    isI18nReady.set(false);

    const fileName = getFileName(locale);
    let isAlreadyLoaded = false;

    loadedTranslations.subscribe(current => {
        if (current[locale]) isAlreadyLoaded = true;
    })();

    if (!isAlreadyLoaded) {
        const loaders = [];

        const loader = localeModules[`./locales/${fileName}.json`];
        if (loader) loaders.push(loader().then(mod => ({ locale, data: mod.default || mod })));

        let hasEnglish = false;
        loadedTranslations.subscribe(current => { if (current['en']) hasEnglish = true; })();
        
        if (!hasEnglish && locale !== 'en') {
            const enLoader = localeModules[`./locales/en.json`];
            if (enLoader) loaders.push(enLoader().then(mod => ({ locale: 'en', data: mod.default || mod })));
        }

        if (loaders.length > 0) {
            const results = await Promise.all(loaders);
            loadedTranslations.update(current => {
                const next = { ...current };
                results.forEach(res => { next[res.locale] = res.data; });
                return next;
            });
        }
    }

    if (typeof document !== 'undefined') {
        document.documentElement.lang = locale;
    }

    isI18nReady.set(true);
};

currentLocale.subscribe(locale => {
    loadLocale(locale);
});

export const t = derived([loadedTranslations, currentLocale], ([$translations, $locale]) => (key, vars = {}) => {
    const localeData = $translations[$locale] || {};
    const enData = $translations['en'] || {};
    
    let text = getNestedValue(localeData, key);
    
    if (!text && $locale !== 'en') {
        text = getNestedValue(enData, key);
    }

    if (!text) return key;

    return formatString(text, vars);
});