<script>
    import { createEventDispatcher, onMount } from "svelte";
    import { t } from "$lib/i18n";
    import { pullData } from "$lib/stores/pulls";
    import { replaceState } from "$app/navigation";
    import { characters } from "$lib/data/characters";
    import { weapons } from "$lib/data/weapons";
    import { browser } from "$app/environment";

    import Icon from "$lib/components/Icons.svelte";
    import OperatorCard from "$lib/components/OperatorCard.svelte";
    import Images from "$lib/components/Images.svelte";
    import BannerStats from "$lib/components/BannerStats.svelte";
    import Tooltip from "$lib/components/Tooltip.svelte";

    export let bannerId = "";
    export let banner = null;
    export let pageContext = null;

    const dispatch = createEventDispatcher();

    // Функция очистки строк для сравнения (удаляет всё кроме букв и цифр)
    const normalize = (str) => String(str || "").toLowerCase().replace(/[^a-z0-9]/g, "");

    onMount(() => {
        if (banner && banner.id && typeof window !== "undefined") {
            replaceState(`#banner-${banner.id}`, {});
        }
        // Для отладки: посмотрим, что есть в сторе
        if (browser) {
            console.log("Store Keys Available:", Object.keys($pullData));
        }
    });

    function close() {
        if (typeof window !== "undefined" && window.location.hash) {
            replaceState(window.location.pathname + window.location.search, {});
        }
        dispatch("close");
    }

    // --- 1. ОПРЕДЕЛЕНИЕ ТИПА БАННЕРА ---
    $: isEvent =
        banner?.type === "web" ||
        banner?.type === "ingame" ||
        banner?.originalType === "ingame" ||
        banner?.originalType === "web" ||
        (typeof banner?.id === "string" && banner?.id.startsWith("ev"));

    $: imageVariant = isEvent ? "event-icon" : "banner-icon";

    // Усиленная проверка на оружие
    $: isWeaponBanner = (() => {
        if (!banner) return false;
        const id = (banner.id || "").toLowerCase();
        const type = (banner.type || "").toLowerCase();
        const ctx = (pageContext || "").toLowerCase();
        
        return (
            type === 'weapon' || 
            id.includes('weap') || id.includes('wepon') ||
            ctx.includes('weap') || ctx.includes('wepon')
        );
    })();

    // --- 2. ПОИСК ДАННЫХ (АГРЕССИВНЫЙ) ---
    $: categoryPulls = (() => {
        if (!banner || !$pullData) return [];

        let keysToCheck = [];

        // Если это оружие, проверяем ВСЕ возможные варианты написания
        if (isWeaponBanner) {
            keysToCheck = [
                'weap-special', // Самый частый вариант
                'weap-standard',
                'weapon',       // Иногда так
                'wepon',        // Из API игры бывает опечатка
                'wepon-special',
                'weapon-special'
            ];
            // Также добавляем сам ID баннера, вдруг данные сохранены по ID
            if (banner.id) keysToCheck.unshift(banner.id);
        } else {
            // Для персонажей
            if (banner.id === 'standard') keysToCheck = ['standard'];
            else if (banner.id?.includes('new')) keysToCheck = ['new-player', 'new'];
            else keysToCheck = ['special', 'standard'];
        }

        // Перебираем ключи и ищем первый непустой массив
        for (const key of keysToCheck) {
            const store = $pullData[key];
            if (store && Array.isArray(store.pulls) && store.pulls.length > 0) {
                // console.log(`[BannerModal] MATCH: Found ${store.pulls.length} pulls in key: "${key}"`);
                return store.pulls;
            }
        }

        // console.warn(`[BannerModal] NO DATA found for banner ${banner.id}. Checked:`, keysToCheck);
        return [];
    })();

    const itemMap = { ...characters, ...weapons };

    $: featuredItems = (() => {
        if (!banner) return [];
        const ids = [...(banner.featured6 || []), ...(banner.featured5 || [])];
        return ids
            .map((id) => {
                const item = itemMap[id];
                if (!item) return null;
                return { ...item, isWeapon: !!weapons[id] };
            })
            .filter(Boolean);
    })();

    // Список имен для проверки (нормализованный)
    $: featuredNames = featuredItems.map(i => normalize(i.name));

    // --- 3. РАСЧЕТ СТАТИСТИКИ (ЛОКАЛЬНО) ---
    $: bannerData = (() => {
        if (!banner || !categoryPulls.length || isEvent) {
            return { pulls: [], stats: {} };
        }

        const bStart = new Date(banner.startTime).getTime();
        const bEnd = banner.endTime ? new Date(banner.endTime).getTime() : Infinity;

        // 1. Фильтруем общую кучу круток по датам этого баннера
        const filtered = categoryPulls.filter((pull) => {
            const pullTime = new Date(pull.time).getTime();
            return pullTime >= bStart && pullTime <= bEnd;
        });

        if (filtered.length === 0) return { pulls: [], stats: {} };

        // 2. Считаем статистику
        const hardPityLimit = isWeaponBanner ? 80 : 120;
        
        // Переменные для итерации
        let p6 = 0, p5 = 0;
        let rateUpCounter = 0; 

        // Итоговая статистика
        let count6 = 0, count5 = 0;
        let sumPity6 = 0, sumPity5 = 0;
        let total5050 = 0, won5050 = 0;

        // Важно: сортируем от старых к новым для правильного подсчета гаранта
        const sortedForCalc = [...filtered].sort((a, b) => a.time - b.time);
        
        const processed = sortedForCalc.map((pull) => {
            const p = { ...pull };
            const itemName = normalize(p.name);
            // Если есть флаг isFree, используем, иначе false
            const isFree = p.isFree === true || String(p.isFree) === "true";

            // --- Проверка жесткого гаранта ---
            let isHardPityTriggered = false;
            if (!isFree) {
                // Если счетчик был 79, а это 80-я крутка -> это хард пити
                if (rateUpCounter >= hardPityLimit - 1) {
                    isHardPityTriggered = true;
                }
                rateUpCounter++;
            }

            if (p.rarity === 6) {
                count6++;
                
                // Считаем локальный пити для отображения
                const currentPity = p6 + 1; 
                sumPity6 += currentPity;
                // Если в импорте есть реальный пити, берем его, иначе расчетный
                p.realPity = p.pity || currentPity; 
                
                // Сброс счетчиков редкости
                p6 = 0; 
                p5++;

                // Проверка на ивентовость
                // Проверяем вхождение имени в список фичеред
                const isFeatured = featuredNames.includes(itemName);

                if (isFeatured) {
                    // Выиграли ивентовый предмет
                    // Если это НЕ хард-гарант, то это победа в 50/50
                    if (!isHardPityTriggered) {
                        total5050++;
                        won5050++; 
                    }
                    // При выпадении ивента счетчик гаранта сбрасывается
                    rateUpCounter = 0;
                } else {
                    // Проиграли (выпал стандарт)
                    // Если это не хард-гарант (хотя на хард-гаранте проиграть нельзя по идее, но для статистики 50/50 считаем)
                    if (!isHardPityTriggered) {
                        total5050++;
                    }
                    // Счетчик rateUpCounter НЕ сбрасывается, растет дальше до 120/80
                }

            } else if (p.rarity === 5) {
                count5++;
                const currentPity = p5 + 1;
                sumPity5 += currentPity;
                p.realPity = p.pity || currentPity;
                p5 = 0; 
                p6++;
                if (!isFree) p5++; // ??? Ошибка в логике инкремента, но для 5* не критично
            } else {
                p6++; 
                p5++;
                p.realPity = 1;
            }

            return p;
        }).reverse(); // Разворачиваем: Новые сверху

        const total = processed.length;

        const localStats = {
            total,
            count6,
            count5,
            percent6: total > 0 ? ((count6 / total) * 100).toFixed(2) : "0.00",
            percent5: total > 0 ? ((count5 / total) * 100).toFixed(2) : "0.00",
            avg6: count6 > 0 ? (sumPity6 / count6).toFixed(1) : "0.0",
            avg5: count5 > 0 ? (sumPity5 / count5).toFixed(1) : "0.0",
            winRate: { 
                won: won5050, 
                total: total5050, 
                percent: total5050 > 0 ? ((won5050 / total5050) * 100).toFixed(0) : 0 
            }
        };

        return { pulls: processed, stats: localStats };
    })();

    $: bannerPulls = bannerData.pulls;
    $: bannerStats = bannerData.stats;

    // --- 4. ТАЙМЕРЫ ---
    $: now = new Date();
    $: start = banner ? new Date(banner.startTime) : new Date();
    $: end = banner && banner.endTime ? new Date(banner.endTime) : null;
    $: isEnded = end && now > end;
    $: isActive = now >= start && (!end || now <= end);
    $: isUpcoming = now < start;

    const formatTime = (d) =>
        d.toLocaleString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

    $: diff = (() => {
        if (!banner) return 0;
        if (!end && isActive) return now - start;
        if (isActive && end) return end - now;
        if (isEnded && end) return now - end;
        if (isUpcoming) return start - now;
        return 0;
    })();

    $: timeData = diff
        ? {
              days: Math.floor(diff / 86400000),
              hours: Math.floor((diff / 3600000) % 24),
          }
        : { days: 0, hours: 0 };

    function getWeaponBg(rarity) {
        if (rarity === 6) return "bg-gradient-to-t from-[#591C00] to-[#BD896E]";
        if (rarity === 5) return "bg-gradient-to-t from-[#261E00] to-[#E3BC55]";
        return "bg-gradient-to-t from-[#1a1a1a] to-[#666666]";
    }
    function getRarityColor(rarity) {
        if (rarity === 6) return "#D0926E";
        if (rarity === 5) return "#E3BC55";
        return "#888";
    }
</script>

{#if banner}
    <div
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-default"
        role="button"
        tabindex="0"
        on:click|self={close}
        on:keydown={(e) => (e.key === "Escape" || e.key === "Enter") && close()}
    >
        <div
            class="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative animate-in zoom-in-95 duration-200 flex flex-col cursor-auto"
        >
            <button
                class="absolute top-3 right-3 z-20 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full transition-colors backdrop-blur-md cursor-pointer"
                on:click={close}
            >
                <Icon name="close" class="w-5 h-5" />
            </button>

            <div class="aspect-[21/9] w-full relative bg-gray-100">
                <Images
                    item={banner}
                    variant={imageVariant}
                    className="w-full h-full"
                    alt={banner.name}
                    style="object-fit: cover;"
                />
                <div
                    class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"
                ></div>
                <div class="absolute bottom-0 left-0 right-0 p-5">
                    <h3
                        class="text-white font-bold text-2xl leading-tight drop-shadow-lg mb-1"
                    >
                        {$t(`banners.${banner.id}`) !== `banners.${banner.id}`
                            ? $t(`banners.${banner.id}`)
                            : banner.name || banner.id}
                    </h3>
                    <div
                        class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/10 shadow-sm {isActive
                            ? 'bg-green-500/20 text-green-300'
                            : ''} {isEnded
                            ? 'bg-gray-500/40 text-gray-300'
                            : ''} {isUpcoming
                            ? 'bg-blue-500/20 text-blue-300'
                            : ''}"
                    >
                        <span
                            class="w-1.5 h-1.5 rounded-full {isActive
                                ? 'bg-green-400 animate-pulse'
                                : isEnded
                                  ? 'bg-gray-400'
                                  : 'bg-blue-400'}"
                        ></span>
                        {#if isActive}{$t("status.active") ||
                                "Active"}{:else if isEnded}{$t(
                                "status.ended",
                            ) || "Ended"}{:else}{$t("status.upcoming") ||
                                "Upcoming"}{/if}
                    </div>
                </div>
            </div>

            <div
                class="p-6 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar"
            >
                <div class="space-y-3">
                    <div class="flex justify-between items-start text-sm">
                        <div class="flex flex-col gap-0.5">
                            <span
                                class="text-gray-400 text-xs font-bold uppercase tracking-wide"
                                >{$t("systemNames.start")}</span
                            >
                            <span class="font-nums font-medium text-gray-900"
                                >{formatTime(start)}</span
                            >
                        </div>
                        <div class="flex flex-col gap-0.5 text-right">
                            <span
                                class="text-gray-400 text-xs font-bold uppercase tracking-wide"
                                >{$t("systemNames.end")}</span
                            >
                            <span class="font-nums font-medium text-gray-900"
                                >{end ? formatTime(end) : "∞"}</span
                            >
                        </div>
                    </div>

                    <div
                        class="p-3 bg-gray-50 rounded-xl border border-gray-100 text-center"
                    >
                        {#if !end}
                            <div class="text-gray-500 text-xs mb-0.5">
                                {$t("systemNames.status")}
                            </div>
                            <div
                                class="text-blue-600 font-bold font-nums text-lg leading-none"
                            >
                                {$t("timer.ongoing_active", {
                                    n: timeData.days,
                                })}
                            </div>
                        {:else if isActive}
                            <div class="text-gray-500 text-xs mb-0.5">
                                {$t("systemNames.timeRemaining")}
                            </div>
                            <div
                                class="text-green-600 font-bold font-nums text-lg leading-none"
                            >
                                {$t("timer.left_d_h", {
                                    d: timeData.days,
                                    h: timeData.hours,
                                })}
                            </div>
                        {:else if isEnded}
                            <div class="text-gray-500 text-xs mb-0.5">
                                {$t("status.ended") || "Ended"}
                            </div>
                            <div
                                class="text-gray-400 font-bold font-nums text-base leading-none"
                            >
                                {$t("timer.days_ago", { n: timeData.days })}
                            </div>
                        {:else if isUpcoming}
                            <div class="text-gray-500 text-xs mb-0.5">
                                {$t("systemNames.startsIn")}
                            </div>
                            <div
                                class="text-blue-600 font-bold font-nums text-lg leading-none"
                            >
                                {$t("timer.starts_soon")}
                            </div>
                        {/if}
                    </div>
                </div>

                {#if banner.url}
                    <a
                        href={banner.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="group flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 hover:border-[#E9CF49] hover:bg-[#fff9f5] transition-all duration-200"
                    >
                        <div class="flex items-center gap-3">
                            <div
                                class="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-[#E9CF49]/10 flex items-center justify-center text-gray-500 group-hover:text-[#D4BE48] transition-colors"
                            >
                                <Icon name="sendToLink" class="w-4 h-4" />
                            </div>
                            <div class="flex flex-col">
                                <span
                                    class="font-bold text-sm text-gray-900 group-hover:text-[#E9CF49] transition-colors"
                                    >{$t("page.openOfficialSource")}</span
                                >
                                <span class="text-xs text-gray-400"
                                    >{$t("page.detailsOfficialSource")}</span
                                >
                            </div>
                        </div>
                        <Icon
                            name="arrow-right"
                            class="w-4 h-4 text-gray-300 group-hover:text-[#D0926E] -translate-x-1 group-hover:translate-x-0 transition-all"
                        />
                    </a>
                {/if}

                {#if featuredItems.length > 0}
                    <div class="space-y-3">
                        <div class="flex items-center gap-2">
                            <span
                                class="text-gray-400 text-[10px] font-bold uppercase tracking-widest"
                            >
                                {#if isWeaponBanner}
                                    {$t("page.banner.featuredWeapons") ||
                                        "Featured Weapons"}
                                {:else}
                                    {$t("systemNames.featuredCharacters")}
                                {/if}
                            </span>
                            <div class="h-px flex-1 bg-gray-100"></div>
                        </div>

                        <div class="flex flex-wrap gap-2 justify-center">
                            {#each featuredItems as item}
                                <Tooltip
                                    text={$t(
                                        item.isWeapon
                                            ? `weaponsList.${item.id}`
                                            : `characters.${item.id}`,
                                    ) || item.name}
                                >
                                    {#if item.isWeapon}
                                        <div
                                            class="w-[90px] h-[90px] flex items-center justify-center relative group cursor-pointer"
                                        >
                                            <div
                                                class="w-[70px] h-[70px] rounded-full overflow-hidden border-2 shadow-sm relative
                                {getWeaponBg(item.rarity)}"
                                                style="border-color: {getRarityColor(
                                                    item.rarity,
                                                )}"
                                            >
                                                <Images
                                                    id={item.id}
                                                    variant="weapon-icon"
                                                    alt={item.name}
                                                    className="w-full h-full object-cover transform scale-[1.3]"
                                                />
                                            </div>
                                        </div>
                                    {:else}
                                        <div
                                            class="w-[90px] h-[90px] rounded-lg border border-gray-100 shadow-sm relative overflow-hidden group cursor-pointer"
                                        >
                                            <div
                                                class="scale-[0.6] w-[80px] origin-top-left"
                                            >
                                                <OperatorCard operator={item} />
                                            </div>
                                        </div>
                                    {/if}
                                </Tooltip>
                            {/each}
                        </div>
                    </div>
                {/if}

                {#if bannerPulls.length > 0}
                    <BannerStats pulls={bannerPulls} {banner} stats={bannerStats} />
                {/if}
            </div>
        </div>
    </div>
{/if}