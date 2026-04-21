<script>
    import { t } from "$lib/i18n";
    import { changelogData } from "$lib/data/versions.js";
    import { equipment } from "$lib/data/items/equipment.js";
    import { characters } from "$lib/data/characters.js";
    import { weapons } from "$lib/data/weapons.js";

    import Select from "$lib/components/Select.svelte";
    import WeaponCard from "$lib/components/WeaponCard.svelte";
    import OperatorCard from "$lib/components/OperatorCard.svelte";
    import Icon from "$lib/components/Icons.svelte";

    $: versionOptions = changelogData
        .map((v) => ({
            value: v.version,
            label: `${$t("systemNames.version") || "Version"} ${v.version}`,
        }))
        .sort((a, b) => b.value.localeCompare(a.value, undefined, { numeric: true }));

    let selectedVersion = "";
    
    $: if (!selectedVersion && versionOptions.length > 0) {
        selectedVersion = versionOptions[0].value;
    }

    $: currentVersionData = changelogData.find(
        (v) => v.version === selectedVersion,
    ) || {
        characters: [],
        weapons: [],
        equipment: [],
    };

    $: displayCharacters = (currentVersionData.characters || []).map((id) => ({
        id,
        ...characters[id],
    }));

    $: displayWeapons = (currentVersionData.weapons || []).map((id) => ({
        id,
        ...weapons[id],
    }));

    $: displayEquipment = (currentVersionData.equipment || []).map((id) => ({
        id,
        ...equipment[id],
    }));

    $: equipmentByPack = displayEquipment.reduce((acc, eq) => {
        const packName = eq.pack || "none";
        if (!acc[packName]) acc[packName] = [];
        acc[packName].push(eq);
        return acc;
    }, {});

    $: packKeys = Object.keys(equipmentByPack).sort();
</script>

<div class="max-w-[100%] max-h-[100%] justify-start min-h-screen">
    <div
        class="flex flex-col gap-3 mb-6 font-sdk"
    >
        <div class="flex items-baseline flex-wrap gap-2 md:gap-3">
            <h2
                class="text-3xl md:text-5xl tracking-wide text-[#21272C] dark:text-[#FDFDFD]"
            >
                {$t("pages.changelog") || "Changelog"}
            </h2>
        </div>
    </div>

    <div class="flex max-w-[800px] z-50 mb-4">
        <Select
            options={versionOptions}
            bind:value={selectedVersion}
            placeholder="Select version"
            variant="black"
        />
    </div>

    <div class="w-full xl:w-[80%] pb-12 flex flex-col gap-3 relative">
        {#if displayCharacters.length > 0}
            <div class="flex flex-col gap-4 animate-fadeIn">
                <h3
                    class="text-2xl font-bold text-[#21272C] dark:text-[#E4E4E4] font-sdk flex items-center gap-2"
                >
                    {$t("pages.operators") || "Operators"}
                </h3>

                <div
                    class="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] md:grid-cols-[repeat(auto-fill,110px)] gap-6 justify-start"
                >
                    {#each displayCharacters as char (char.id)}
                        <div
                            class="flex justify-center transition-transform"
                        >
                            <OperatorCard operator={char} />
                        </div>
                    {/each}
                </div>
            </div>
        {/if}

        {#if displayWeapons.length > 0}
            <div class="flex flex-col gap-4 animate-fadeIn">
                <h3
                    class="text-2xl font-bold text-[#21272C] dark:text-[#E4E4E4] font-sdk flex items-center gap-2 mt-4"
                >
                    {$t("pages.weapons") || "Weapons"}
                </h3>

                <div
                    class="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] md:grid-cols-[repeat(auto-fill,110px)] gap-4 justify-start"
                >
                    {#each displayWeapons as wpn (wpn.id)}
                        <div
                            class="flex justify-center transition-transform"
                        >
                            <WeaponCard weapon={wpn} isEquipment={false} />
                        </div>
                    {/each}
                </div>
            </div>
        {/if}

        {#if displayEquipment.length > 0}
            <div class="flex flex-col gap-4 animate-fadeIn">
                <h3
                    class="text-2xl font-bold text-[#21272C] dark:text-[#E4E4E4] font-sdk flex items-center gap-2 mt-4"
                >
                    {$t("pages.equipment") || "Equipment"}
                </h3>

                <div class="flex flex-col gap-3">
                    {#each packKeys as packName}
                        <div class="flex flex-col gap-2">
                            <h4
                                class="text-lg font-bold text-gray-500 dark:text-[#888] font-sdk"
                            >
                                {$t(`packs.${packName}`) || packName}
                            </h4>

                            <div
                                class="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] md:grid-cols-[repeat(auto-fill,110px)] gap-5 justify-start"
                            >
                                {#each equipmentByPack[packName] as eq (eq.id)}
                                    <div
                                        class="flex justify-center transition-transform "
                                    >
                                        <WeaponCard
                                            weapon={eq}
                                            isEquipment={true}
                                        />
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}

        {#if displayCharacters.length === 0 && displayWeapons.length === 0 && displayEquipment.length === 0}
            <div
                class="text-center py-20 text-gray-400 italic flex flex-col items-center justify-center bg-gray-50 dark:bg-[#2C2C2C] rounded-2xl border border-dashed border-gray-200 dark:border-[#444] animate-fadeIn"
            >
                <Icon name="noData" class="w-10 h-10 mb-3 opacity-30" />
                <p class="text-sm font-medium">
                    {$t("emptyState.noChanges") || "No added content"}
                </p>
            </div>
        {/if}
    </div>
</div>
