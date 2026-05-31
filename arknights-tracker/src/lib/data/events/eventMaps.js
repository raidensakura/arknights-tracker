import {rawEvents} from "$lib/data/timeline.js";

export const eventId2EventObj = getEventId2EventObj(rawEvents);

function getEventId2EventObj(list) {
    let map = {};

    for (let eventObj of list) {
        let eventId = eventObj.id;

        if (!map.hasOwnProperty(eventId)) map[eventId] = [];

        map[eventId].push(eventObj);
    }

    return map;
}