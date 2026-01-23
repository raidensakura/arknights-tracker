// src/lib/utils/importUtils.js
import { characters } from "$lib/data/characters";
import { banners } from "$lib/data/banners";

// Нормализация имени
const normalize = (str) => {
    if (!str || typeof str !== 'string') return "";
    return str.toLowerCase().replace(/\s+/g, "");
};

/**
 * ОПРЕДЕЛЕНИЕ ТИПА БАННЕРА
 * Эта функция решает, куда положить крутку: в Special, Standard или New Player.
 * Зависит от того, какие ID приходят от сервера игры.
 */
export function getInternalBannerType(rawId) {
    if (!rawId) return 'standard';
    const id = String(rawId).toLowerCase();

    // 1. Баннер новичка (обычно имеет ID '2' или слова 'beginner', 'new')
    if (id === '2' || id.includes('beginner') || id.includes('new') || id.includes('novice')) {
        return 'new_player';
    }

    // 2. Стандартный баннер (обычно ID '1' или 'standard')
    if (id === '1' || id.includes('standard') || id.includes('permanent')) {
        return 'standard';
    }

    // 3. Все остальное считаем Специальным (ивентовым)
    // ID '3', '4', названия ивентов и т.д.
    return 'special';
}

/**
 * Парсинг логов
 */
export function parseGachaLog(list) {
    if (!Array.isArray(list)) return [];
    
    // Сортировка по времени
    const sortedList = [...list].sort((a, b) => (a.ts || 0) - (b.ts || 0));

    return sortedList.map((item, i) => {
        // Определяем внутренний ID баннера (standard / special / new_player)
        // item.pool, item.gacha_type - поля, которые обычно приходят от API
        const rawBannerId = item.bannerId || item.pool || item.gacha_type;
        const internalId = getInternalBannerType(rawBannerId);

        return {
            id: item.id || `${item.ts}_${item.name}_${i}`,
            time: item.time ? new Date(item.time) : new Date((item.ts || 0) * 1000),
            name: item.name || "Unknown",
            rarity: Number(item.rarity) || 3,
            bannerId: internalId // <-- Теперь здесь будет правильный тип
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
 * Расчет Pity для визуализации в списке
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
        
        // Любая 6* сбрасывает визуальный счетчик гаранта (80)
        if (pull.rarity === 6) {
            const resultPity = pityCounter;
            pityCounter = 0; 
            return { ...pull, pity: resultPity, isFree: isFreePull };
        }

        return { ...pull, pity: pityCounter, isFree: isFreePull };
    });
}

/**
 * ГЛАВНАЯ МАТЕМАТИКА (ПО ТВОИМ НОВЫМ ПРАВИЛАМ)
 */
export function calculateBannerStats(pulls, bannerId) {
    // 1. Конфиг (пытаемся найти featured персонажей для этого типа баннера)
    // Т.к. мы сваливаем все ивентовые баннеры в одну кучу 'special', 
    // нам нужно брать актуальный список featured из banners.js, 
    // но для истории это сложно. Пока берем дефолтный конфиг 'special'.
    let bannerConfig = banners.find(b => b.type === bannerId) || banners.find(b => b.id === bannerId);
    
    // Если это generic тип, ищем любой подходящий конфиг
    if (!bannerConfig) {
         bannerConfig = banners.find(b => b.type === bannerId);
    }

    const featured6 = bannerConfig?.featured6 || [];
    const isSpecial = bannerId === 'special';

    // 2. Счетчики
    let total = pulls.length;
    let count6 = 0;
    let count5 = 0;
    let sumPity6 = 0;
    let sumPity5 = 0;

    let won5050 = 0;
    let total5050 = 0;
    
    // Счетчики гарантов
    let currentPity6 = 0; // До 80 (сбрасывается на любой леге)
    let currentPity5 = 0;
    let guarantee120 = 0; // До 120 (сбрасывается ТОЛЬКО на Featured)
    
    // Флаг, получили ли мы featured (для UI, чтобы скрыть счетчик 120, если уже выпал)
    // Но т.к. ты сказал, что гарант сбрасывается, мы просто будем показывать текущий счетчик.
    
    pulls.forEach((pull, index) => {
        const charName = normalize(pull.name);
        
        // --- 1. ПРОВЕРКА НА БЕСПЛАТНЫЕ (Только Special, 31-40) ---
        const isFreePull = isSpecial && (index >= 30 && index < 40);

        // --- 2. ОБРАБОТКА 6 ЗВЕЗД ---
        if (pull.rarity === 6) {
            count6++;
            
            // Статистика (средний пити)
            sumPity6 += currentPity6 + (isFreePull ? 0 : 1);

            // Проверка: это Featured персонаж?
            // (В идеале нужно знать, какой был баннер в момент крутки, но пока берем текущий конфиг)
            const isFeatured = featured6.some(fid => {
                const c = characters[fid];
                return c && normalize(c.name) === charName;
            });

            // Статистика 50/50
            total5050++;
            if (isFeatured) won5050++;
            
            // СБРОС СЧЕТЧИКОВ
            
            // Гарант 80: Сбрасывается при ЛЮБОЙ 6*
            currentPity6 = 0;

            // Гарант 120: Сбрасывается ТОЛЬКО при Featured
            if (isSpecial) {
                if (isFeatured) {
                    guarantee120 = 0;
                } else {
                    // Если выпал стандартный -> гарант 120 НЕ сбрасывается.
                    // Вопрос: эта крутка идет в зачет 120? 
                    // Обычно да, если она не бесплатная.
                    if (!isFreePull) guarantee120++;
                }
            }
        } 
        // --- 3. ОБРАБОТКА НЕ 6 ЗВЕЗД ---
        else {
            if (!isFreePull) {
                // Обычный пити растет
                currentPity6++;
                
                // Гарант 120 растет (только на special)
                if (isSpecial) {
                    guarantee120++;
                }
            }
        }

        // --- 4. 5 ЗВЕЗД ---
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
        pity6: currentPity6,   // До 80
        pity5: currentPity5,
        guarantee120: isSpecial ? guarantee120 : 0, // До 120
        
        count6,
        count5,
        
        // В Endfield 50/50 это просто шанс, без гаранта на след. крутку
        winRate: {
            won: won5050,
            total: total5050,
            percent: total5050 ? ((won5050 / total5050) * 100).toFixed(0) : 0
        },

        // Доп. статистика
        avg6: count6 ? (sumPity6 / count6).toFixed(1) : "0.0",
        avg5: count5 ? (sumPity5 / count5).toFixed(1) : "0.0",
        percent6: total ? ((count6 / total) * 100).toFixed(2) : "0.00",
        percent5: total ? ((count5 / total) * 100).toFixed(2) : "0.00",
    };
}