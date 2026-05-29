import {PowerStation} from "$lib/classes/buildings/PowerStation.js";
import {Fuel} from "$lib/classes/items/Fuel.js";

export class PowerFormula {
    _powerStation;
    _fuel;

    constructor(powerStation, fuel) {
        this._powerStation = powerStation;
        this._fuel = fuel;
    }

    get formulaType() {
        return "powerFormula";
    }

    get powerStation() {
        return this._powerStation;
    }

    get powerStationId() {
        return this._powerStation.id;
    }

    get fuel() {
        return this._fuel;
    }

    get fuelId() {
        return this._fuel.id;
    }

    get powerTimeMs() {
        return this.powerStation.msPerRound * this.fuel.progressRound;
    }

    get powerProvide() {
        return this.fuel.powerProvide;
    }

    static getPowerFormula(powerStation, fuel) {
        return new PowerFormula(powerStation, fuel);
    }

    static getPowerFormulaFromId(powerStationId, fuelId) {
        let powerStation = PowerStation.getPowerStation(powerStationId);
        let fuel = Fuel.getFuel(powerStationId);

        if (!powerStation || !fuel) return null;

        return PowerFormula.getPowerFormula(powerStation, fuel);
    }
}