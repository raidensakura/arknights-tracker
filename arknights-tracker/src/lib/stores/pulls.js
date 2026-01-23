// src/lib/stores/pulls.js
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { mergePulls, calculatePity, calculateBannerStats } from '$lib/utils/importUtils';

// Три основных "корзины"
const defaultData = {
    standard: { pulls: [], stats: {} },
    special: { pulls: [], stats: {} },
    new_player: { pulls: [], stats: {} }
};

function createPullData() {
    const store = writable(defaultData);
    const { subscribe, set, update } = store;

    return {
        subscribe,
        
        init: () => {
            if (browser) {
                const stored = localStorage.getItem('ark_tracker_pulls');
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        // Восстанавливаем даты
                        Object.keys(parsed).forEach(key => {
                            if (parsed[key].pulls) {
                                parsed[key].pulls.forEach(p => p.time = new Date(p.time));
                                // Пересчитываем статы (на случай обновления логики)
                                parsed[key].stats = calculateBannerStats(parsed[key].pulls, key);
                            }
                        });
                        set(parsed);
                    } catch (e) {
                        console.error("Cache error", e);
                    }
                }
            }
        },

        smartImport: async (newPulls) => {
            await new Promise(r => setTimeout(r, 500));

            return new Promise((resolve) => {
                update(currentData => {
                    const newData = JSON.parse(JSON.stringify(currentData));
                    // Восстанавливаем даты после копирования
                    Object.keys(newData).forEach(k => {
                        if(newData[k].pulls) newData[k].pulls.forEach(p => p.time = new Date(p.time));
                    });

                    const report = { status: 'up_to_date', addedCount: {}, totalAdded: 0 };
                    
                    // Группировка по баннерам (теперь используем bannerId из parseGachaLog)
                    const incomingByBanner = {};
                    
                    newPulls.forEach(p => {
                        // bannerId здесь уже равен 'special', 'standard' или 'new_player' 
                        // благодаря функции parseGachaLog
                        const bid = p.bannerId; 

                        if (!incomingByBanner[bid]) incomingByBanner[bid] = [];
                        incomingByBanner[bid].push(p);
                    });

                    let hasUpdates = false;

                    Object.keys(incomingByBanner).forEach(bid => {
                        // Если пришел неизвестный ID, игнорируем или кидаем в standard
                        const targetKey = newData[bid] ? bid : 'standard';
                        
                        // Если даже standard нет (странно), создаем
                        if (!newData[targetKey]) newData[targetKey] = { pulls: [], stats: {} };

                        const oldList = newData[targetKey].pulls;
                        const incomeList = incomingByBanner[bid];
                        
                        // Фильтр дубликатов
                        const existingIds = new Set(oldList.map(p => p.id));
                        const reallyNew = incomeList.filter(p => !existingIds.has(p.id));

                        if (reallyNew.length > 0) {
                            // 1. Мержим
                            const mergedList = mergePulls(oldList, reallyNew);
                            
                            // 2. Считаем Pity (визуальное)
                            const pullsWithPity = calculatePity(mergedList, targetKey);
                            newData[targetKey].pulls = pullsWithPity;

                            // 3. Считаем Статистику (Гаранты 80/120)
                            newData[targetKey].stats = calculateBannerStats(pullsWithPity, targetKey);

                            report.addedCount[targetKey] = (report.addedCount[targetKey] || 0) + reallyNew.length;
                            report.totalAdded += reallyNew.length;
                            hasUpdates = true;
                        }
                    });

                    if (hasUpdates) {
                        report.status = 'updated';
                        if (browser) localStorage.setItem('ark_tracker_pulls', JSON.stringify(newData));
                    }

                    resolve(report);
                    return newData;
                });
            });
        },

        clear: () => {
            set(defaultData);
            if (browser) localStorage.removeItem('ark_tracker_pulls');
        }
    };
}

export const pullData = createPullData();