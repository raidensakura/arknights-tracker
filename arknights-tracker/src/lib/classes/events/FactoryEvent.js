import {GameEvent} from "$lib/classes/events/GameEvent.js";
import {factoryEvents} from "$lib/data/events/factoryEvents.js";

export class FactoryEvent extends GameEvent {
    _factoryEventObj;

    constructor(eventObj, factoryEventObj) {
        super(eventObj);

        this._factoryEventObj = factoryEventObj;
    }

    get eventItemIds() {
        return this._eventObj.eventItemIds;
    }

    containsEventItemId(itemId) {
        return this.eventItemIds.includes(itemId);
    }

    static getFactoryEvent(eventId) {
        let event = GameEvent.getEvent(eventId);

        if (!event) return null;

        return FactoryEvent.getFactoryEventFromGameEvent(event);
    }

    static getFactoryEventFromGameEvent(gameEvent) {
        let factoryEvent = factoryEvents[gameEvent.id];

        if (!factoryEvent) return null;

        return new FactoryEvent(gameEvent, factoryEvent);
    }
}