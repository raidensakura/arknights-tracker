import {manualCrafts} from "$lib/data/crafts/manualCrafts.js";

export class ManualCraft {
    _craftObj;

    constructor(craftObj) {
        this._craftObj = craftObj;
    }

    get formulaType() {
        return "manualCraft";
    }

    get id() {
        return this._craftObj.id;
    }

    get ingredients() {
        return this._craftObj.ingredients;
    }

    get outcomes() {
        return this._craftObj.outcomes;
    }

    static getManualCraft(formulaId) {
        let manualCraftObj = manualCrafts[formulaId];

        if (!manualCraftObj) return null;

        return new ManualCraft(manualCraftObj);
    }

    static isManualCraft(formulaId) {
        return manualCrafts.hasOwnProperty(formulaId);
    }
}