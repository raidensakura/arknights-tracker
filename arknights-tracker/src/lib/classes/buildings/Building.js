import {buildings} from "$lib/data/buildings/buildings.js";
import {itemId2BuildingId} from "$lib/data/buildings/itemId2BuildingId.js";

export class Building {
    _buildingObj;

    constructor(buildingObj) {
        this._buildingObj = buildingObj;
    }

    get id() {
        return this._buildingObj.id;
    }

    get type() {
        return this._buildingObj.type;
    }

    get itemId() {
        return this._buildingObj.itemId;
    }

    isCrafter() {
        return this.type === "crafter";
    }

    isMiner() {
        return this.type === "miner";
    }

    isPump() {
        return this.type === "pump";
    }

    isPowerStation() {
        return this.type === "powerStation";
    }

    static getBuilding(buildingId) {
        if (!this.isBuilding(buildingId)) return null;

        let buildingObj = buildings[buildingId];

        return new Building(buildingObj);
    }

    static getBuildingFromItemId(itemId) {
        if (!this.isItemBuilding(itemId)) return null;

        let buildingId = this.getBuildingIdFromItemId(itemId);

        return this.getBuilding(buildingId);
    }

    static getBuildingIdFromItemId(itemId) {
        return itemId2BuildingId[itemId];
    }

    static isBuilding(buildingId) {
        return buildings.hasOwnProperty(buildingId);
    }

    static isItemBuilding(itemId) {
        return itemId2BuildingId.hasOwnProperty(itemId);
    }
}