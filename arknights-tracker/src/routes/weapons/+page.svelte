<script>
    import { t } from "$lib/i18n";
    import { weapons } from "$lib/data/weapons.js"; 
    import WeaponCard from "$lib/components/WeaponCard.svelte";
    import DataToolbar from "$lib/components/DataToolbar.svelte";
    import Icon from "$lib/components/Icons.svelte";

    const allWeapons = Object.values(weapons || {}).filter(
        (wp) => wp && wp.id
    );
    

    let sortField = "rarity";
    let sortDirection = "desc";
    let searchQuery = "";
    
    let filters = {
        rarity: [6, 5, 4, 3],
        type: ["sword", "polearm", "artsUnit", "greatSword", "handcannon"], 
    };

    $: filteredWeapons = allWeapons
        .filter((wp) => {
            const query = searchQuery.toLowerCase().trim();
            const locName = ($t(`weaponsList.${wp.id}`) || "").toLowerCase();
            const baseName = (wp.name || "").toLowerCase();
            const idName = wp.id.toLowerCase();

            const matchesSearch =
                !query ||
                baseName.includes(query) ||
                locName.includes(query) ||
                idName.includes(query);

            if (!matchesSearch) return false;
            
            const matchesRarity =
                filters.rarity.length === 0 ||
                filters.rarity.includes(wp.rarity);
                
            const wpType = wp.type || wp.weapon;
            const matchesType =
                filters.type.length === 0 || 
                (wpType && filters.type.some(w => w.toLowerCase() === wpType.toLowerCase()));

            return matchesRarity && matchesType;
        })
        .sort((a, b) => {
            let valA = sortField === "type" ? (a.type || a.weapon) : a[sortField];
            let valB = sortField === "type" ? (b.type || b.weapon) : b[sortField];
            
            if (sortField === "rarity") {
                return sortDirection === "asc" ? valA - valB : valB - valA;
            }
            
            if (!valA) valA = "";
            if (!valB) valB = "";

            return sortDirection === "asc"
                ? String(valA).localeCompare(String(valB))
                : String(valB).localeCompare(String(valA));
        });
</script>

<div class="max-w-[100%] max-h-[100%] justify-start min-h-screen">
    
    <div class="flex items-center gap-4 mb-8">
        <h2 class="font-sdk text-[#21272C] dark:text-[#FDFDFD] flex flex-col items-start gap-0 md:flex-row md:items-center md:gap-3">
            <span class="text-3xl md:text-5xl tracking-wide">
                {$t("pages.weapons") || "Weapons"}
            </span>
            <span class="text-gray-400 text-xl md:pl-3 md:text-3xl font-normal">
                / {filteredWeapons.length}
            </span>
        </h2>
    </div>

    <div class="w-full xl:w-[70%] mb-4">
        <DataToolbar
            bind:sortField
            bind:sortDirection
            bind:searchQuery
            bind:filters
            mode="weapons" 
        />
    </div>

    <div class="w-full xl:w-[80%] pb-8">
        <div class="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] md:grid-cols-[repeat(auto-fill,100px)] gap-4 justify-start">
            {#each filteredWeapons as wp (wp.id)}
                <div class="flex justify-center">
                    <WeaponCard weapon={wp} />
                </div>
            {/each}
        </div>

        {#if filteredWeapons.length === 0}
            <div class="text-center py-20 text-gray-400 italic flex flex-col items-center justify-center bg-gray-50 dark:bg-[#2C2C2C] rounded-2xl border border-dashed border-gray-200 dark:border-[#444]">
                <Icon name="noData" class="w-10 h-10 mb-3 opacity-30" />
                <p class="text-sm font-medium">
                    {$t("emptyState.noData") || "No weapons found"}
                </p>
            </div>
        {/if}
    </div>
</div>