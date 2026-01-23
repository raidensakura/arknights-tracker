// src/lib/utils/importUtils.js
import { characters } from "$lib/data/characters";
import { banners } from "$lib/data/banners";

// Безопасная нормализация
const normalize = (str) => {
    if (!str || typeof str !== 'string') return "";
    return str.toLowerCase().replace(/\s+/g, "");
};

/**
 * ОПРЕДЕЛЕНИЕ ТИПА БАННЕРА
 * Приводит сырой ID из логов к нашим ключам: 'standard', 'special', 'new-player'
 */
export function getInternalBannerType(rawId) {
    if (!rawId) return 'standard';
    const id = String(rawId).toLowerCase();

    // 1. Баннер новичка (apiType: beginner)
    if (id === '2' || id.includes('beginner') || id.includes('new') || id.includes('novice')) {
        return 'new-player'; // Ключ как в bannerTypes.js
    }

    // 2. Стандартный баннер
    if (id === '1' || id.includes('standard') || id.includes('permanent')) {
        return 'standard';
    }

    // 3. Спешл (все остальные)
    return 'special';
}

/**
 * ПАРСИНГ ЛОГОВ (Исправлен баг с типами и именами)
 */
export function parseGachaLog(list) {
    if (!Array.isArray(list)) return [];
    
    // Сортируем по времени
    const sortedList = [...list].sort((a, b) => (a.ts || 0) - (b.ts || 0));

    return sortedList.map((item, i) => {
        // 1. Извлекаем имя (пробуем разные поля, которые бывают в API)
        const rawName = item.name || item.character || item.chars || "Unknown";
        
        // 2. Извлекаем редкость и ПРИВОДИМ К ЧИСЛУ (Фикс бага "12/10")
        // Иногда приходит rank, иногда rarity
        const rarity = Number(item.rarity || item.rank || 3);

        // 3. Определяем ID баннера
        const rawBannerId = item.bannerId || item.pool || item.gacha_type;
        const internalId = getInternalBannerType(rawBannerId);

        // 4. Генерируем уникальный ID для крутки
        const uniqueId = item.id || `${item.ts}_${rawName}_${i}`;
        
        return {
            id: uniqueId,
            time: item.time ? new Date(item.time) : new Date((item.ts || 0) * 1000),
            name: rawName,
            rarity: isNaN(rarity) ? 3 : rarity,
            bannerId: internalId
        };
    }).sort((a, b) => a.time - b.time);
}

/**
 * Слияние списков
 */
export function mergePulls(oldList, newList) {
    const map = new Map();
    oldList.forEach(p => map.set(p.id, p));
    newList.forEach(p => map.set(p.id, p));
    return Array.from(map.values()).sort((a, b) => new Date(a.time) - new Date(b.time));
}

/**
 * Расчет Pity (для отображения в списке истории)
 */
export function calculatePity(pulls, bannerId) {
    const isSpecial = bannerId === 'special';
    let pityCounter = 0;
    
    return pulls.map((pull, index) => {
        // Правило: 30-40 крутки бесплатные ТОЛЬКО на special
        const isFreePull = isSpecial && (index >= 30 && index < 40);

        if (!isFreePull) {
            pityCounter++;
        }
        
        // 6* сбрасывает счетчик всегда
        if (pull.rarity === 6) {
            const resultPity = pityCounter;
            pityCounter = 0; 
            return { ...pull, pity: resultPity, isFree: isFreePull };
        }

        return { ...pull, pity: pityCounter, isFree: isFreePull };
    });
}

/**
 * РАСЧЕТ СТАТИСТИКИ (Гаранты, WinRate)
 */
export function calculateBannerStats(pulls, bannerId) {
    // 1. Ищем конфиг
    let bannerConfig = banners.find(b => b.id === bannerId);
    
    // Если по ID не нашли, ищем по типу
    if (!bannerConfig) {
         bannerConfig = banners.find(b => b.type === bannerId);
    }

    const featured6 = bannerConfig?.featured6 || [];
    const isSpecial = bannerId === 'special';

    // 2. Инициализация
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

    // 3. Проход
    pulls.forEach((pull, index) => {
        const charName = normalize(pull.name);
        
        // Бесплатные (31-40) только на Special
        const isFreePull = isSpecial && (index >= 30 && index < 40);

        // --- 6 ЗВЕЗД ---
        if (pull.rarity === 6) {
            count6++;
            sumPity6 += currentPity6 + (isFreePull ? 0 : 1); 

            // Featured?
            const isFeatured = featured6.some(fid => {
                const c = characters[fid];
                return c && normalize(c.name) === charName;
            });

            // 50/50
            if (last6WasFeatured) {
                total5050++;
                if (isFeatured) won5050++;
            }
            last6WasFeatured = isFeatured;

            // Сброс обычного пити
            currentPity6 = 0;

            // Гарант 120
            if (isSpecial) {
                if (isFeatured) {
                    guarantee120 = 0;
                    hasReceivedRateUp = true;
                } else {
                    if (!isFreePull && !hasReceivedRateUp) {
                        guarantee120++;
                    }
                }
            }
        } 
        else {
            if (!isFreePull) {
                currentPity6++;
                if (isSpecial && !hasReceivedRateUp) guarantee120++;
            }
        }

        // --- 5 ЗВЕЗД ---
        if (pull.rarity === 5) {
            count5++;
            sumPity5 += currentPity5 + (isFreePull ? 0 : 1);
            currentPity5 = 0; // СБРОС (здесь была ошибка из-за типов данных)
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
        
        winRate: {
            won: won5050,
            total: total5050,
            percent: total5050 ? ((won5050 / total5050) * 100).toFixed(0) : 0
        },

        avg6: count6 ? (sumPity6 / count6).toFixed(1) : "0.0",
        avg5: count5 ? (sumPity5 / count5).toFixed(1) : "0.0",
        percent6: total ? ((count6 / total) * 100).toFixed(2) : "0.00",
        percent5: total ? ((count5 / total) * 100).toFixed(2) : "0.00",
    };
}