import {pumpingItemId2PumpId} from "$lib/data/crafts/craftMaps.js";
import {BuildingSearcher} from "$lib/classes/crafts/searchers/BuildingSearcher.js";

export class PumpSearcher extends BuildingSearcher {

    constructor({ itemId2BuildingIdMap = pumpingItemId2PumpId } = {}) {
        super({itemId2BuildingIdMap});
    }

    searchByItemAsOutcome(itemId) {
        return this.searchByItem(itemId);
    }
}