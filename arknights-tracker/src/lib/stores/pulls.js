// src/lib/stores/pulls.js
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { mergePulls, calculatePity, calculateBannerStats } from '$lib/utils/importUtils';

// ВАЖНО: Ключи совпадают с id в bannerTypes.js
const defaultData = {
    "standard": { pulls: [], stats: {} },
    "special": { pulls: [], stats: {} },
    "new-player": { pulls: [], stats: {} } // Ключ с дефисом!
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
                        
                        // Миграция старых ключей (если был new_player, переносим в new-player)
                        if (parsed['new_player'] && !parsed['new-player']) {
                            parsed['new-player'] = parsed['new_player'];
                            delete parsed['new_player'];
                        }

                        // Восстанавливаем даты и пересчитываем статы
                        Object.keys(parsed).forEach(key => {
                            if (parsed[key].pulls) {
                                parsed[key].pulls.forEach(p => p.time = new Date(p.time));
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
                    
                    // Восстанавливаем даты
                    Object.keys(newData).forEach(k => {
                        if(newData[k] && newData[k].pulls) {
                            newData[k].pulls.forEach(p => p.time = new Date(p.time));
                        }
                    });

                    // Создаем ключи, если их нет (защита)
                    if (!newData["new-player"]) newData["new-player"] = { pulls: [], stats: {} };
                    if (!newData["standard"]) newData["standard"] = { pulls: [], stats: {} };
                    if (!newData["special"]) newData["special"] = { pulls: [], stats: {} };

                    const report = { status: 'up_to_date', addedCount: {}, totalAdded: 0 };
                    
                    // Группировка
                    const incomingByBanner = {};
                    newPulls.forEach(p => {
                        // bannerId здесь уже определен в parseGachaLog как standard/special/new-player
                        const bid = p.bannerId; 

                        if (!incomingByBanner[bid]) incomingByBanner[bid] = [];
                        incomingByBanner[bid].push(p);
                    });

                    let hasUpdates = false;

                    Object.keys(incomingByBanner).forEach(bid => {
                        // Если ключ валидный, используем его, иначе кидаем в standard
                        const targetKey = newData[bid] ? bid : 'standard';
                        
                        const oldList = newData[targetKey].pulls;
                        const incomeList = incomingByBanner[bid];
                        
                        // Фильтр дублей
                        const existingIds = new Set(oldList.map(p => p.id));
                        const reallyNew = incomeList.filter(p => !existingIds.has(p.id));

                        if (reallyNew.length > 0) {
                            // 1. Мержим
                            const mergedList = mergePulls(oldList, reallyNew);
                            
                            // 2. Считаем Pity
                            const pullsWithPity = calculatePity(mergedList, targetKey);
                            newData[targetKey].pulls = pullsWithPity;

                            // 3. Считаем Статистику
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