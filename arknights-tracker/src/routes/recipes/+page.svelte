<script>
    import {t} from "$lib/i18n";
    import {itemFilters, itemManual, itemSearch} from "$lib/stores/filterStore.js";
    import {Item} from "$lib/classes/items/Item.js";
    import DataToolbar from "$lib/components/DataToolbar.svelte";
    import ItemCard from "$lib/components/recipes/ItemCard.svelte";
    import {craftableItemsList} from "$lib/data/crafts/craftableItemsList.js";

    $: filters = $itemFilters;
    $: searchQuery = $itemSearch;

    const allItems = craftableItemsList.map((itemId) => Item.getItem(itemId));

    let filters = {
        rarity: [5, 4, 3, 2, 1],
        itemGroup: ["nature", "gatherable", "product", "usable", "facility"]
    };

    let sortField = "itemGroup";
    let sortDirection = "desc";
    let searchQuery = "";

    $: filteredItems = (() => {
        const baseFiltered = [...allItems].filter((item) => {
            const query = searchQuery.toLowerCase().trim();
            const localizedName = ($t(`items.${item.id}`) || "").toLowerCase();
            const idStr = (item.id || "").toLowerCase();

            const matchesSearch = !query || localizedName.includes(query) || idStr.includes(query);

            if (!matchesSearch) return false;

            const matchesRarity =
                filters.rarity.length === 0
                || filters.rarity.includes(item.rarity);
            const matchesGroup =
                filters.itemGroup.length === 0
                || filters.itemGroup.includes(item.groupId);

            return matchesRarity && matchesGroup;
        });

        const sortLogic = (itemA, itemB) => {
            let diff = 0;
            let aWeight = 0;
            let bWeight = 0;

            if (sortField === "itemGroup") {
                aWeight = itemGroupWeight[itemA.groupId] ?? 0;
                bWeight = itemGroupWeight[itemB.groupId] ?? 0;
            } else if (sortField === "rarity") {
                aWeight = itemA.rarity;
                bWeight = itemB.rarity;
            }

            diff = aWeight - bWeight;

            if (diff !== 0) {
                return sortDirection === "asc" ? diff : -diff;
            }

            aWeight = itemA.rarity;
            bWeight = itemB.rarity;

            diff = bWeight - aWeight;

            if (diff !== 0) {
                return diff;
            }

            return itemA.id.localeCompare(itemB.id);
        };

        return baseFiltered.sort(sortLogic);
    })();

    const itemGroupWeight = {
        "nature": 5,
        "gatherable": 4,
        "product": 3,
        "usable": 2,
        "facility": 1
    };

    let displayLimit = 100;
    $: if (searchQuery !== undefined || filters || sortField || sortDirection) {
        displayLimit = 100;
    }
    $: displayedItems = filteredItems.slice(0, displayLimit);

    function infiniteScroll(node) {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && displayLimit < filteredItems.length) {
                displayLimit += 100;
            }
        }, {
            rootMargin: "400px"
        });

        observer.observe(node);
        return {
            destroy() { observer.disconnect(); }
        };
    }
</script>

<div class="max-w-[100%] max-h-[100%] justify-start min-h-screen">

    <div class="flex items-baseline flex-wrap gap-2 md:gap-3 mb-8 font-sdk">
        <h2 class="text-3xl md:text-5xl tracking-wide text-[#21272C] dark:text-[#FDFDFD]">
            {$t("pages.recipes") || "Recipes"}
        </h2>
        <span class="text-gray-400 text-xl md:text-3xl font-normal">
            / {filteredItems.length}
        </span>
    </div>

    <div class="w-full xl:w-[70%] mb-4">
        <DataToolbar
            bind:sortField
            bind:sortDirection
            bind:filters={$itemFilters}
            bind:searchQuery={$itemSearch}
            bind:manualMode={$itemManual}
            mode="items"
        />
    </div>

    <div class="w-full xl:w-[85%] pb-8">
        <div class="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] md:grid-cols-[repeat(auto-fill,100px)] gap-5 justify-start">
            {#each displayedItems as item}
                <div class="flex justify-center">
                    <ItemCard item={item} />
                </div>
            {/each}
        </div>

        {#if displayLimit < filteredItems.length}
            <div use:infiniteScroll class="h-10 w-full mt-4"></div>
        {/if}
    </div>

</div>