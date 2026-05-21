export class BuildingSearchResult {
    _resultObj;

    constructor(resultObj) {
        this._resultObj = resultObj;
    }

    get buildingIdList() {
        return this._resultObj.buildingList;
    }

    containsBuilding(buildingId) {
        return this.buildingIdList.includes(buildingId);
    }

    isEmpty() {
        return this.buildingIdList.length === 0;
    }
}