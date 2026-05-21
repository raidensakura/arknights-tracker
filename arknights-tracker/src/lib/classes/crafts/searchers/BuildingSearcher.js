import {BuildingSearchResult} from "$lib/classes/crafts/searchers/BuildingSearchResult.js";

export class BuildingSearcher {
    _itemId2BuildingIdMap;

    constructor({itemId2BuildingIdMap}) {
        this._itemId2BuildingIdMap = itemId2BuildingIdMap;
    }

    searchByItem(itemId) {
        let buildings = this._itemId2BuildingIdMap[itemId] ?? [];

        return new BuildingSearchResult({
            buildingList: buildings
        })
    }
}