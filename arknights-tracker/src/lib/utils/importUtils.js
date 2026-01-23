// src/lib/utils/importUtils.js
import { characters } from "$lib/data/characters";
import { banners } from "$lib/data/banners";

const normalize = (str) => {
    if (!str || typeof str !== 'string') return "";
    return str.toLowerCase().replace(/\s+/g, "");
};

/**
 * ОПРЕДЕЛЕНИЕ ТИПА БАННЕРА
 */
export function getInternalBannerType(rawId) {
    if (!rawId) return 'standard';
    const id = String(rawId).toLowerCase().trim();

    if (id === '2' || id.includes('beginner') || id.includes('new') || id.includes('novice')) {
        return 'new-player';
    }
    if (id === '1' || id.includes('standard') || id.includes('permanent')) {
        return 'standard';
    }
    return 'special';
}

/**
 * ПАРСИНГ ЛОГОВ (ИСПРАВЛЕНА СОРТИРОВКА)
 */
export function parseGachaLog(list) {
    if (!Array.isArray(list)) throw new Error("Invalid data: expected an array");
    if (list.length === 0) throw new Error("No data found in the list");

    // 1. Сначала преобразуем в нормальный вид, чтобы достать дату
    const parsedList = list.map((item, i) => {
        // Поиск имени
        const rawName = item.name || item.charName || item.character || item.item_name;
        
        // Поиск редкости
        const rarity = Number(item.rarity || item.rank || item.rank_type);

        // Поиск времени (gachaTs - это миллисекунды, ts - секунды)
        let dateObj;
        if (item.gachaTs) dateObj = new Date(Number(item.gachaTs)); 
        else if (item.ts) dateObj = new Date(Number(item.ts) * 1000);
        else if (item.time) dateObj = new Date(item.time);
        else dateObj = new Date(0); // Fallback
        
        const rawBannerId = item.bannerId || item.poolId || item.pool || item.gacha_type;

        // Валидация
        if (!rawName) throw new Error(`Item #${i} has no name.`);
        if (!rarity || isNaN(rarity)) throw new Error(`Item #${i} has invalid rarity.`);

        const internalId = getInternalBannerType(rawBannerId);

        return {
            // Временно без ID, сгенерируем после сортировки
            tempId: item.id,
            time: dateObj,
            name: rawName,
            rarity: rarity,
            bannerId: internalId
        };
    });

    // 2. СОРТИРУЕМ: От старых к новым (ОБЯЗАТЕЛЬНО для правильного расчета гаранта)
    parsedList.sort((a, b) => a.time - b.time);

    // 3. Теперь, когда порядок правильный, генерируем стабильные ID
    // Это решит проблему, когда "первая" крутка считалась "последней"
    return parsedList.map((item, index) => {
        const uniqueId = item.tempId || `${item.time.getTime()}_${item.name}_${index}`;
        
        return {
            id: uniqueId,
            time: item.time,
            name: item.name,
            rarity: item.rarity,
            bannerId: item.bannerId
        };
    });
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
        
        // Сброс только на 6*
        if (pull.rarity === 6) {
            const resultPity = pityCounter;
            pityCounter = 0; 
            return { ...pull, pity: resultPity, isFree: isFreePull };
        }

        return { ...pull, pity: pityCounter, isFree: isFreePull };
    });
}

export function calculateBannerStats(pulls, bannerId) {
    let bannerConfig = banners.find(b => b.id === bannerId);
    if (!bannerConfig) {
         if (bannerId.includes('new')) bannerConfig = banners.find(b => b.type === 'new-player');
         else if (bannerId.includes('special')) bannerConfig = banners.find(b => b.type === 'special');
         else bannerConfig = banners.find(b => b.type === 'standard');
    }

    const featured6 = bannerConfig?.featured6 || [];
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