import {MachineCraftSearcher} from "$lib/classes/crafts/searchers/MachineCraftSearcher.js";
import {ManualCraftSearcher} from "$lib/classes/crafts/searchers/ManualCraftSearcher.js";
import {HubCraftSearcher} from "$lib/classes/crafts/searchers/HubCraftSearcher.js";
import {MinerSearcher} from "$lib/classes/crafts/searchers/MinerSearcher.js";
import {PumpSearcher} from "$lib/classes/crafts/searchers/PumpSearcher.js";
import {Miner} from "$lib/classes/buildings/Miner.js";
import {Pump} from "$lib/classes/buildings/Pump.js";
import {MachineCraft} from "$lib/classes/crafts/MachineCraft.js";
import {ManualCraft} from "$lib/classes/crafts/ManualCraft.js";
import {HubCraft} from "$lib/classes/crafts/HubCraft.js";
import {Item} from "$lib/classes/items/Item.js";

export class FormulaTree {
    _machineCraftSearcher = new MachineCraftSearcher();
    _manualCraftSearcher = new ManualCraftSearcher();
    _hubCraftSearcher = new HubCraftSearcher();
    _minerSearcher = new MinerSearcher();
    _pumpSearcher = new PumpSearcher();

    _startNode;

    constructor(startItem, startFormula = null) {

    }

    updateNode(node) {
        const item = Item.getItem(node.itemId);

        if (!node.formula) {
            node.formula = this._getFirstFormula(item);
        }

        node.resetChildNodes();

        const stack = [node];

        while (stack.length > 0) {

        }
    }

    _getFirstFormula(item) {
        let functionList;

        if (item.subGroupId === "nature_liquid") {
            functionList = [
                this._getFirstMiningFormula,
                this._getFirstPumpingFormula,
                this._getFirstMachineCraft,
                this._getFirstManualCraft,
                this._getFirstHubCraft
            ];
        } else {
            functionList = [
                this._getFirstMiningFormula,
                this._getFirstMachineCraft,
                this._getFirstPumpingFormula,
                this._getFirstManualCraft,
                this._getFirstHubCraft
            ];
        }

        for (let func of functionList) {
            let formula = func(item.id);

            if (formula) return formula;
        }

        return null;
    }

    _getFirstMachineCraft(itemId) {
        let result = this._machineCraftSearcher.searchByItemAsOutcome(itemId);

        return result.isEmpty()
            ? null
            : MachineCraft.getMachineCraft(result.craftList[0]);
    }

    _getFirstManualCraft(itemId) {
        let result = this._manualCraftSearcher.searchByItemAsOutcome(itemId);

        return result.isEmpty()
            ? null
            : ManualCraft.getManualCraft(result.craftList[0]);
    }

    _getFirstHubCraft(itemId) {
        let result = this._hubCraftSearcher.searchByItemAsOutcome(itemId);

        return result.isEmpty()
            ? null
            : HubCraft.getHubCraft(result.craftList[0]);
    }

    _getFirstMiningFormula(itemId) {
        let result = this._minerSearcher.searchByItemAsOutcome(itemId);

        if (result.isEmpty()) return null;

        let minerId = result.buildingIdList[0];
        let miner = Miner.getMiner(minerId);

        return miner.getMiningFormula(itemId);
    }

    _getFirstPumpingFormula(itemId) {
        let result = this._pumpSearcher.searchByItemAsOutcome(itemId);

        if (result.isEmpty()) return null;

        let pumpId = result.buildingIdList[0];
        let pump = Pump.getPump(pumpId);

        return pump.getPumpingFormula(itemId);
    }
}

class Node {
    _formula;
    _itemId;

    _parentNode;
    _childNodes = [];

    constructor(formula, itemId, parentNode) {
        this._formula = formula;
        this._itemId = itemId;
        this._parentNode = parentNode;
    }

    get formula() {
        return this._formula;
    }

    set formula(formula) {
        this._formula = formula;
    }

    get itemId() {
        return this._itemId;
    }

    get parentNode() {
        return this._parentNode;
    }

    get childNodes() {
        return this._childNodes;
    }

    addChildNode(node) {
        this._childNodes.push(node);
    }

    resetChildNodes() {
        this._childNodes = [];
    }
}