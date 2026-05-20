import {machineCrafts} from "$lib/data/crafts/machineCrafts.js";
import {manualCrafts} from "$lib/data/crafts/manualCrafts.js";
import {hubCrafts} from "$lib/data/crafts/hubCrafts.js";

export const machineCraftItemAsIncome = getCraftItemAs("ingredients", machineCrafts);
export const machineCraftItemAsOutcome = getCraftItemAs("outcomes", machineCrafts);

export const manualCraftItemAsIncome = getCraftItemAs("ingredients", manualCrafts);
export const manualCraftItemAsOutcome = getCraftItemAs("outcomes", manualCrafts);

export const hubCraftItemAsIncome = getCraftItemAs("ingredients", hubCrafts);
export const hubCraftItemAsOutcome = getCraftItemAs("outcomes", hubCrafts);


function getCraftItemAs(fieldName, table) {
    let map = {};

    for (let obj of Object.values(table)) {
        let formulaId = obj.id;

        for (let item of obj[fieldName]) {
            let itemId = item.itemId;

            if (!map.hasOwnProperty(itemId)) map[itemId] = [];

            map[itemId].push(formulaId);
        }
    }

    return map;
}