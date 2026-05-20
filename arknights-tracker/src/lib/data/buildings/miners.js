export const miners = {
    "miner_1": {
        "id": "miner_1",
        "mineable": [
            {
                "miningItemId": "item_originium_ore",
                "miningTimeMs": 3000
            }
        ]
    },
    "miner_2": {
        "id": "miner_2",
        "mineable": [
            {
                "miningItemId": "item_originium_ore",
                "miningTimeMs": 3000
            },
            {
                "miningItemId": "item_quartz_sand",
                "miningTimeMs": 3000
            }
        ]
    },
    "miner_3": {
        "id": "miner_3",
        "mineable": [
            {
                "miningItemId": "item_originium_ore",
                "miningTimeMs": 3000
            },
            {
                "miningItemId": "item_quartz_sand",
                "miningTimeMs": 3000
            },
            {
                "miningItemId": "item_iron_ore",
                "miningTimeMs": 3000
            }
        ]
    },
    "miner_4": {
        "id": "miner_4",
        "mineable": [
            {
                "miningItemId": "item_originium_ore",
                "miningTimeMs": 3000,
                "consumeItem": {
                    "itemId": "item_liquid_water",
                    "count": 1
                }
            },
            {
                "miningItemId": "item_quartz_sand",
                "miningTimeMs": 3000,
                "consumeItem": {
                    "itemId": "item_liquid_water",
                    "count": 1
                }
            },
            {
                "miningItemId": "item_iron_ore",
                "miningTimeMs": 3000,
                "consumeItem": {
                    "itemId": "item_liquid_water",
                    "count": 1
                }
            },
            {
                "miningItemId": "item_copper_ore",
                "miningTimeMs": 3000,
                "consumeItem": {
                    "itemId": "item_liquid_water",
                    "count": 1
                }
            }
        ]
    }
}