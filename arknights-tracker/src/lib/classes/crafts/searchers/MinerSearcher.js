import {miningItemId2MinerId} from "$lib/data/crafts/craftMaps.js";
import {BuildingSearcher} from "$lib/classes/crafts/searchers/BuildingSearcher.js";

export class MinerSearcher extends BuildingSearcher {

    constructor({ itemId2BuildingIdMap = miningItemId2MinerId } = {}) {
        super({itemId2BuildingIdMap});
    }

    searchByItemAsOutcome(itemId) {
        return this.searchByItem(itemId);
    }
}