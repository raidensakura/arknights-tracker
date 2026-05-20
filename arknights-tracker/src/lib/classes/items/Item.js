import {items} from "$lib/data/items/items.js";
import {Fuel} from "$lib/classes/items/Fuel.js";
import {FullBottle} from "$lib/classes/items/FullBottle.js";

export class Item {
    _itemObj;

    constructor(itemObj) {
        this._itemObj = itemObj;
    }

    get id() {
        return this._itemObj.id;
    }

    get rarity() {
        return this._itemObj.rarity;
    }

    get groupId() {
        return this._itemObj.groupId;
    }

    isFuel() {
        return Fuel.isFuel(this.id);
    }

    toFuel() {
        return Fuel.getFuelFromItem(this);
    }

    isFullBottle() {
        return FullBottle.isFullBottle(this.id);
    }

    toFullBottle() {
        return FullBottle.getFullBottleFromItem(this);
    }

    static getItem(itemId) {
        let itemObj = items[itemId];

        if (itemObj ?? false) return null;

        return new Item(itemObj);
    }

    static itemExists(itemId) {
        return items.hasOwnProperty(itemId);
    }
}
