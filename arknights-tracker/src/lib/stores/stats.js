// src/lib/stores/stats.js

import { derived } from 'svelte/store';
import { pullData } from './pulls';

const AVERAGE_PITY_6 = 34.5;
const AVERAGE_PITY_5 = 10;

export const pullStats = derived(pullData, ($pullData) => {
    let totalPulls = 0;
    let total6 = 0;
    let total5 = 0;
    let win5050 = 0;
    let lose5050 = 0;
    let sumPity6 = 0;
    let sumPity5 = 0;
    let count6_for_luck = 0;
    let count5_for_luck = 0;

    Object.values($pullData).forEach(banner => {
        totalPulls += banner.total || 0;
        
        (banner.pulls || []).forEach(pull => {
            if (pull.rarity === 6) {
                total6++;
                if (pull.pity) {
                    sumPity6 += pull.pity;
                    count6_for_luck++;
                }

                if (pull.isRateUp !== undefined) { 
                    if (pull.isRateUp) win5050++;
                    else lose5050++;
                }
            }
            if (pull.rarity === 5) {
                total5++;
                if (pull.pity) {
                    sumPity5 += pull.pity;
                    count5_for_luck++;
                }
            }
        });
    });
    
    const myAvg6 = count6_for_luck > 0 ? sumPity6 / count6_for_luck : 0;
    const myAvg5 = count5_for_luck > 0 ? sumPity5 / count5_for_luck : 0;
    const calculateLuckPercent = (avg, standard) => {
        if (avg === 0) return 50;
        let luck = 50 + (standard - avg) * 2; 
        return Math.min(Math.max(luck, 1), 99).toFixed(0);
    };

    const luck6 = calculateLuckPercent(myAvg6, AVERAGE_PITY_6);
    const luck5 = calculateLuckPercent(myAvg5, AVERAGE_PITY_5);

    return {
        totalPulls,
        total6,
        total5,
        win5050,
        lose5050,
        total5050: win5050 + lose5050,
        luck6,
        luck5,
        avgPity6: myAvg6.toFixed(1)
    };
});
