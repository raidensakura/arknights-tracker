export class PumpingFormula {
    _pump;
    _pumpingLiquidId;

    constructor(pump, pumpingLiquidId) {
        this._pump = pump;
        this._pumpingLiquidId = pumpingLiquidId;
    }

    get formulaType() {
        return "pumpingFormula";
    }

    get pump() {
        return this._pump;
    }

    get pumpId() {
        return this._pump.id;
    }

    get pumpTimeMs() {
        return this._pump.pumpTimeMs;
    }

    get pumpingLiquidId() {
        return this._pumpingLiquidId;
    }
}