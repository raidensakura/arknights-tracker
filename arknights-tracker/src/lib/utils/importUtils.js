// src/lib/utils/importUtils.js
import { characters } from "$lib/data/characters";
import { banners } from "$lib/data/banners";

const normalize = (str) => {
    if (!str || typeof str !== 'string') return "";
    return str.toLowerCase().replace(/\s+/g, "");
};

/**
 * ОПРЕДЕЛЕНИЕ ТИПА БАННЕРА
 * Здесь мы решаем, куда положить крутку.
 */
export function getInternalBannerType(rawId) {
    // Если ID нет, считаем стандартом
    if (rawId === undefined || rawId === null) return 'standard';
    
    const id = String(rawId).toLowerCase().trim();

    // === ОТЛАДКА: СМОТРИ СЮДА В КОНСОЛИ ===
    // Мы увидим, какой ID пришел и куда мы его определили
    // =======================================

    // 1. Баннер новичка
    // Обычно это ID '2', но может быть 'new', 'beginner', '100'...
    if (id === '2' || id.includes('new') || id.includes('beginner') || id.includes('novice')) {
        return 'new-player';
    }

    // 2. Стандартный баннер
    // Обычно '1', 'standard', 'permanent'
    if (id === '1' || id.includes('standard') || id.includes('permanent')) {
        return 'standard';
    }

    // 3. Если это не 1 и не 2 — скорее всего это Спешл (Ивент)
    // ID '3', '4', 'limit', 'special' и т.д.
    return 'special';
}

export function parseGachaLog(list) {
    if (!Array.isArray(list)) return [];
    
    const sortedList = [...list].sort((a, b) => (a.ts || 0) - (b.ts || 0));

    return sortedList.map((item, i) => {
        // Достаем сырой ID баннера
        const rawBannerId = item.bannerId || item.pool || item.gacha_type;
        
        // Определяем наш внутренний тип
        const internalId = getInternalBannerType(rawBannerId);

        // !!! ЛОГ ДЛЯ ОТЛАДКИ !!!
        if (i < 5) { // Выведем только первые 5 круток, чтобы не спамить
            console.log(`[DEBUG IMPORTER] Item Name: ${item.name}, Raw Banner ID: "${rawBannerId}", Result Type: "${internalId}"`);
        }

        const rawName = item.name || item.character || item.chars || "Unknown";
        const rarity = Number(item.rarity || item.rank || 3);
        
        const uniqueId = item.id || `${item.ts}_${rawName}_${i}`;
        
        return {
            id: uniqueId,
            time: item.time ? new Date(item.time) : new Date((item.ts || 0) * 1000),
            name: rawName,
            rarity: isNaN(rarity) ? 3 : rarity,
            bannerId: internalId // <-- Сюда пишется результат
        };
    }).sort((a, b) => a.time - b.time);
}

// ... ОСТАЛЬНЫЕ ФУНКЦИИ БЕЗ ИЗМЕНЕНИЙ ...
export function mergePulls(oldList, newList) {
    const map = new Map();
    oldList.forEach(p => map.set(p.id, p));
    newList.forEach(p => map.set(p.id, p));
    return Array.from(map.values()).sort((a, b) => new Date(a.time) - new Date(b.time));
}

export function calculatePity(pulls, bannerId) {
    const isSpecial = bannerId?.includes('special');
    let pityCounter = 0;
    
    return pulls.map((pull, index) => {
        const isFreePull = isSpecial && (index >= 30 && index < 40);

        if (!isFreePull) pityCounter++;
        
        if (pull.rarity === 6) {
            const resultPity = pityCounter;
            pityCounter = 0; 
            return { ...pull, pity: resultPity, isFree: isFreePull };
        }

        return { ...pull, pity: pityCounter, isFree: isFreePull };
    });
}

export function calculateBannerStats(pulls, bannerId) {
    // Ищем конфиг
    let bannerConfig = banners.find(b => b.id === bannerId);
    if (!bannerConfig) {
         if (bannerId.includes('new')) bannerConfig = banners.find(b => b.type === 'new-player');
         else if (bannerId.includes('special')) bannerConfig = banners.find(b => b.type === 'special');
         else bannerConfig = banners.find(b => b.type === 'standard');
    }

    const featured6 = bannerConfig?.featured6 || [];
    // Проверка isSpecial должна быть строгой. Если это стандарт или новичок - false.
    const isSpecial = bannerId.includes('special');

    let total = pulls.length;
    let count6 = 0;
    let count5 = 0;
    let sumPity6 = 0;
    let sumPity5 = 0;
    let won5050 = 0;
    let total5050 = 0;
    let last6WasFeatured = true; 
    let hasReceivedRateUp = false;
    let currentPity6 = 0;
    let currentPity5 = 0;
    let guarantee120 = 0; 

    pulls.forEach((pull, index) => {
        const charName = normalize(pull.name);
        const isFreePull = isSpecial && (index >= 30 && index < 40);

        if (pull.rarity === 6) {
            count6++;
            sumPity6 += currentPity6 + (isFreePull ? 0 : 1); 

            const isFeatured = featured6.some(fid => {
                const c = characters[fid];
                return c && normalize(c.name) === charName;
            });

            if (last6WasFeatured) {
                total5050++;
                if (isFeatured) won5050++;
            }
            last6WasFeatured = isFeatured;
            currentPity6 = 0;

            if (isSpecial) {
                if (isFeatured) {
                    guarantee120 = 0;
                    hasReceivedRateUp = true;
                } else {
                    if (!isFreePull && !hasReceivedRateUp) guarantee120++;
                }
            }
        } else {
            if (!isFreePull) {
                currentPity6++;
                if (isSpecial && !hasReceivedRateUp) guarantee120++;
            }
        }

        if (pull.rarity === 5) {
            count5++;
            sumPity5 += currentPity5 + (isFreePull ? 0 : 1);
            currentPity5 = 0;
        } else {
            if (!isFreePull) currentPity5++;
        }
    });

    return {
        total,
        pity6: currentPity6,
        pity5: currentPity5,
        guarantee120: isSpecial && !hasReceivedRateUp ? guarantee120 : 0,
        hasReceivedRateUp,
        count6,
        count5,
        avg6: count6 ? (sumPity6 / count6).toFixed(1) : "0.0",
        avg5: count5 ? (sumPity5 / count5).toFixed(1) : "0.0",
        percent6: total ? ((count6 / total) * 100).toFixed(2) : "0.00",
        percent5: total ? ((count5 / total) * 100).toFixed(2) : "0.00",
        winRate: {
            won: won5050,
            total: total5050,
            percent: total5050 ? ((won5050 / total5050) * 100).toFixed(0) : 0
        }
    };
}