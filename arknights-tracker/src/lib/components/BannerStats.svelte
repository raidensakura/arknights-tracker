<script>
    import { t } from "$lib/i18n";
    import { characters } from "$lib/data/characters";
    import { weapons } from "$lib/data/weapons";
    import Icon from "$lib/components/Icons.svelte";
    import Tooltip from "$lib/components/Tooltip.svelte";
    import Images from "$lib/components/Images.svelte";

    // Принимаем не только pulls и banner, но и уже готовые stats
    export let pulls = [];
    export let banner = null;
    export let stats = {}; // <--- Новое свойство

    $: isSpecial = banner?.type === "special";
    $: isNewPlayer = banner?.type === "new-player" || banner?.type === "new_player";

    $: isWeaponBanner =
        banner?.type === "weapon" ||
        banner?.id?.includes("weap") ||
        banner?.id?.includes("wepon");

    $: hasRateUp = isSpecial || isWeaponBanner;

    // --- БЕРЕМ ДАННЫЕ ИЗ ГОТОВОЙ СТАТИСТИКИ ---
    // (Если stats пустой, ставим заглушки)
    $: total = stats.total || 0;
    $: spent = (total * 500).toLocaleString("ru-RU");

    $: count6 = stats.count6 || 0;
    $: count5 = stats.count5 || 0;
    
    $: percent6 = stats.percent6 || "0.00";
    $: percent5 = stats.percent5 || "0.00";
    
    $: avg6 = stats.avg6 || "0.0";
    $: avg5 = stats.avg5 || "0.0";

    $: winRateStats = stats.winRate || { won: 0, total: 0, percent: 0 };

    // Формируем строки для таблицы
    $: statsRows = [
        {
            label: "6",
            count: count6,
            percent: percent6,
            avg: avg6,
            winRate: winRateStats, // Используем общую стату винрейта для 6*
        },
        {
            label: "5",
            count: count5,
            percent: percent5,
            avg: avg5,
            winRate: { won: 0, total: 0, percent: 0 }, // Для 5* винрейт обычно не считаем так подробно
        },
    ];

    // --- ЛОГИКА ИКОНОК (Оставляем, так как это визуализация списка) ---
    const normalize = (str) => str?.toLowerCase().replace(/\s+/g, "") || "";
    const itemMap = { ...characters, ...weapons };
    const lookupMap = Object.values(itemMap).reduce((acc, item) => {
        if (item.name) acc[normalize(item.name)] = item;
        acc[normalize(item.id)] = item;
        return acc;
    }, {});

    $: icons = pulls
        .filter((p) => p.rarity === 6)
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 6)
        .map((p) => {
            const lookupKey = normalize(p.name);
            const itemData = lookupMap[lookupKey];
            const itemId = itemData?.id || normalize(p.name);
            const isWeaponItem = itemData ? !!weapons[itemData.id] : isWeaponBanner;

            return {
                id: itemId,
                // Используем сохраненный pity или realPity, если есть
                pity: typeof p.pity === "number" ? p.pity : "?",
                name: p.name,
                isWeapon: isWeaponItem,
            };
        });

    function getPityColor(pity, isWeapon) {
        if (!pity || pity === "?") return "#21272C";
        const max = isWeapon ? 80 : 80; // Для цвета можно оставить стандартную шкалу

        const p = (pity / max) * 100;

        if (p <= 25) return "#5DBE5A";
        if (p <= 40) return "#3CAF38";
        if (p <= 60) return "#D4AD3D";
        if (p <= 85) return "#C55E2F";
        return "#9A3404";
    }

    function getWeaponBg(rarity) {
        if (rarity === 6) return "bg-gradient-to-t from-[#591C00] to-[#BD896E]";
        if (rarity === 5) return "bg-gradient-to-t from-[#261E00] to-[#E3BC55]";
        return "bg-gradient-to-t from-[#1a1a1a] to-[#666666]";
    }
</script>

<div class="space-y-4">
    <div class="flex items-center gap-2">
        <span class="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
            {$t("page.banner.stats") || "Statistics"}
        </span>
        <div class="h-px flex-1 bg-gray-100"></div>
    </div>

    <div class="bg-gray-50 rounded-lg p-3 flex items-center justify-between w-full">
        <div class="flex-1 flex flex-col items-center justify-center">
            <span class="text-gray-500 text-xs block mb-0.5">{$t("page.banner.total")}</span>
            <span class="font-bold text-gray-800 font-nums text-lg leading-none">{total}</span>
        </div>

        {#if !isNewPlayer && !isWeaponBanner}
            <div class="w-px h-8 bg-gray-300 mx-2"></div>
            <div class="flex-1 flex flex-col items-center justify-center">
                <span class="text-gray-500 text-xs block mb-0.5">{$t("page.banner.spent")}</span>
                <div class="flex items-center gap-1.5">
                    <Images id="oroberyl" variant="currency" size={18} />
                    <span class="font-bold text-gray-800 font-nums text-lg leading-none">{spent}</span>
                </div>
            </div>
        {/if}
    </div>

    <div>
        <div class="grid grid-cols-4 text-xs text-gray-500 mb-1 font-medium">
            <div>{$t("page.banner.rarity")}</div>
            <div class="text-right">{$t("page.banner.count")}</div>
            <div class="text-right">{$t("page.banner.percent")}</div>
            <div class="text-right">{$t("page.banner.avg")}</div>
        </div>

        {#each statsRows as row}
            <div class="border-b border-gray-50 last:border-0">
                <div class="grid grid-cols-4 text-sm items-center py-1">
                    <div class="font-bold text-gray-700 flex items-center gap-1 font-nums">
                        {row.label}
                        <Icon name="star" class="w-4 h-4" />
                    </div>
                    <div class="text-right font-bold font-nums text-[#21272C]">
                        {row.count}
                    </div>
                    <div class="text-right text-gray-600 font-nums">
                        {row.percent}%
                    </div>
                    <div class="text-right font-bold font-nums text-[#1D6F42]">
                        {row.avg}
                    </div>
                </div>

                {#if hasRateUp && row.label === "6" && row.winRate.total > 0}
                    <div class="grid grid-cols-4 text-sm items-center py-1">
                        <div class="text-gray-600 text-xs pl-6">
                            {$t("page.banner.won5050")}
                        </div>
                        <div class="text-right font-nums text-[#21272C]">
                            {row.winRate.won}/{row.winRate.total}
                        </div>
                        <div class="text-right text-gray-600 font-nums">
                            {row.winRate.percent}%
                        </div>
                        <div class="text-right"></div>
                    </div>
                {/if}
            </div>
        {/each}
    </div>

    {#if icons.length > 0}
        <div class="space-y-2">
            <h4 class="text-xs font-bold text-[#21272C] flex items-center gap-1">
                <span>{$t("page.banner.pulled")}</span>
                <span>6</span>
                <Icon name="star" class="w-3 h-3" />
                <span>{$t(isWeaponBanner ? "page.banner.recent_weapons" : "page.banner.operators")}</span>
            </h4>

            <div class="flex flex-wrap gap-2">
                {#each icons as icon}
                    <Tooltip text={$t(icon.isWeapon ? `weaponsList.${icon.id}` : `characters.${icon.id}`) || icon.name}>
                        <div class="relative w-12 h-12 rounded-full cursor-pointer shadow-sm hover:scale-110 transition-transform">
                            <div class="w-full h-full overflow-hidden rounded-full border-2 {icon.isWeapon ? `border-[#ff6600] ${getWeaponBg(6)}` : 'border-[#D0926E] bg-gray-100'}">
                                <Images
                                    id={icon.id}
                                    variant={icon.isWeapon ? "weapon-icon" : "operator-icon"}
                                    size="100%"
                                    alt={icon.name}
                                    className={icon.isWeapon ? "scale-125" : ""}
                                />
                            </div>
                            <div class="absolute -bottom-1 -right-1 min-w-7 px-2 py-1 rounded font-nums leading-none font-bold shadow-lg pointer-events-none flex items-center justify-center" style="font-size: 0.85rem; min-width: 1.7rem;">
                                <div class="absolute inset-0 rounded opacity-90" style="background-color: {getPityColor(icon.pity, icon.isWeapon)};"></div>
                                <span class="relative text-white z-10">{icon.pity}</span>
                            </div>
                        </div>
                    </Tooltip>
                {/each}
            </div>
        </div>
    {/if}
</div>