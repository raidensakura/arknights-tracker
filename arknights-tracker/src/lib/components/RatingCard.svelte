<script>
  import { t } from "$lib/i18n";
  import { pullData } from "$lib/stores/pulls";
  import { bannerTypes } from "$lib/data/bannerTypes";
  import { fetchGlobalStats } from "$lib/api";
  import { browser } from "$app/environment";
  import { currentUid } from "$lib/stores/auth";
  import Button from "./Button.svelte";
  import Icon from "./Icons.svelte";

  // --- ТАБЫ ---
  $: ratingTabs = [...bannerTypes]
    .filter((b) => b.showInRating)
    .sort((a, b) => a.order - b.order);

  let activeTab = ratingTabs?.[0]?.id ?? "special";
  
  // Для оружия тоже будем пытаться показать данные (пусть сервер решает, есть они или нет)
  $: isWeaponTab = activeTab.includes("weap");

  // --- ЛОКАЛЬНЫЕ ДАННЫЕ ---
  $: localStore = $pullData[activeTab] || { pulls: [], stats: {} };
  $: localStats = localStore.stats || {};
  $: localTotal = localStats.total || 0;
  
  $: localAvg6 = localStats.avg6 ? parseFloat(localStats.avg6) : 0;
  $: localAvg5 = localStats.avg5 ? parseFloat(localStats.avg5) : 0;
  $: localWinRate = localStats.winRate?.percent ? parseFloat(localStats.winRate.percent) : 0;

  // --- ДАННЫЕ С СЕРВЕРА ---
  let serverData = null;

  $: displayTotal = serverData?.myStats?.total ?? localTotal;
  
  $: displayAvg6 = serverData?.myStats?.avg6 
      ? parseFloat(serverData.myStats.avg6) 
      : localAvg6;

  $: displayWinRate = serverData?.myStats?.winRate 
      ? parseFloat(serverData.myStats.winRate) 
      : localWinRate;

  // --- ПАРСИНГ ---
  const safeParse = (val) => {
      if (val === null || val === undefined) return null;
      const num = parseFloat(val);
      return isNaN(num) ? null : num;
  };

  $: rankTotal = safeParse(serverData?.rankTotal);
  $: rankLuck6 = safeParse(serverData?.rankLuck6);
  $: rank5050 = safeParse(serverData?.rank5050);
  $: rankLuck5 = safeParse(serverData?.rankLuck5);

  // --- ХЕЛПЕРЫ (Возвращают "..." если null) ---

  const getPercentile = (rank) => {
      if (rank === null) return "---";
      return rank.toFixed(0); 
  };

  const getRankValue = (rank) => {
      if (rank === null) return "---";
      // Если больше 50%, считаем обратное (Топ). Иначе оставляем как есть (Ниже).
      return (rank > 50 ? (100 - rank) : rank).toFixed(0);
  };

  const getRankLabel = (rank) => {
      if (rank === null) return "page.rating.top"; // Дефолт
      return rank > 50 ? "page.rating.top" : "page.rating.bottom";
  };

  const getTopRank = (rank) => {
      if (rank === null) return "---";
      return (100 - rank).toFixed(0);
  };

  // --- ЗАГРУЗКА ---
  $: if (browser && activeTab && $currentUid) {
      loadRankings(activeTab, $currentUid);
  }

  async function loadRankings(poolId) {
    if (!browser) return;
    const uid = localStorage.getItem("user_uid");
    if (!uid) return;

    serverData = null; 

    try {
      const response = await fetchGlobalStats(uid, poolId);
      if (response && (response.code === 0 || response.found)) {
         serverData = response.data || response;
      } 
    } catch (e) {
      console.error("Fetch Failed", e);
    }
  }

  function formatVal(val) {
    return val !== null && val !== undefined && !isNaN(val) ? val : "---";
  }
</script>

<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-full min-w-[320px]">
  <h3 class="text-xl font-bold mb-6 font-sdk text-[#21272C]">
    {$t("page.rating.ratingTitle")}
  </h3>

  <div class="space-y-6">
    
    <div class="flex justify-between items-end border-b border-gray-100 pb-4">
      <div>
        <div class="font-medium text-gray-700">{$t("page.rating.luckyTotal")}</div>
        <div class="text-xs text-gray-400 mt-1 h-4">
          {#if rankTotal !== null}
             {$t("page.rating.luckyMoreThan", { n: getPercentile(rankTotal) })}
          {/if}
        </div>
      </div>
      <div class="text-right">
        {#if rankTotal !== null}
            <div class="text-2xl font-black text-gray-900 font-nums">
               {$t(getRankLabel(rankTotal))} {getRankValue(rankTotal)}%
            </div>
        {/if}
        <div class="text-sm font-bold text-gray-900 font-nums">
          {displayTotal.toLocaleString("ru-RU")}
        </div>
      </div>
    </div>

    <div class="flex justify-between items-end border-b border-gray-100 pb-4">
      <div>
        <div class="font-medium text-gray-700">{$t("page.rating.lucky5050")}</div>
        <div class="text-xs text-gray-400 mt-1 h-4">
          {#if rank5050 !== null}
            {$t("page.rating.luckyLuckierThan", { n: getPercentile(rank5050) })}
          {/if}
        </div>
      </div>
      <div class="text-right">
        {#if rank5050 !== null}
            <div class="text-2xl font-black text-[#21272C] font-nums">
               {$t(getRankLabel(rank5050))} {getRankValue(rank5050)}%
            </div>
        {/if}
        <div class="text-sm font-bold text-gray-900 font-nums">
          {formatVal(displayWinRate)}%
        </div>
      </div>
    </div>

    <div class="flex justify-between items-end border-b border-gray-100 pb-4">
      <div>
        <div class="font-medium text-[#21272C] flex items-center gap-1">
          {$t("page.rating.lucky6")} 6 <Icon name="star" class="w-4 h-4" />
        </div>
        <div class="text-xs text-gray-400 mt-1 h-4">
          {#if rankLuck6 !== null}
             {$t("page.rating.luckyLuckierThan", { n: getPercentile(rankLuck6) })}
          {/if}
        </div>
      </div>
      <div class="text-right">
        {#if rankLuck6 !== null}
            <div class="text-2xl font-black text-gray-900 font-nums">
               {$t(getRankLabel(rankLuck6))} {getRankValue(rankLuck6)}%
            </div>
        {/if}
        <div class="text-sm font-bold text-gray-900 font-nums">
          {formatVal(displayAvg6)} <span class="text-gray-400 font-normal">avg</span>
        </div>
      </div>
    </div>

    <div class="flex justify-between items-end border-b border-gray-100 pb-4">
      <div>
        <div class="font-medium text-[#21272C] flex items-center gap-1">
          {$t("page.rating.lucky5")} 5 <Icon name="star" class="w-4 h-4" />
        </div>
        <div class="text-xs text-gray-400 mt-1 h-4">
           {#if rankLuck5 !== null}
              {#if rankLuck5 < 50}
                 {$t("page.rating.luckyLessLuckierThan", { n: getRankValue(rankLuck5) })}
              {:else}
                 {$t("page.rating.luckyLuckierThan", { n: getPercentile(rankLuck5) })}
              {/if}
           {/if}
        </div>
      </div>
      <div class="text-right">
        {#if rankLuck5 !== null}
            <div class="text-2xl font-black text-[#21272C] font-nums">
               {$t(getRankLabel(rankLuck5))} {getRankValue(rankLuck5)}%
            </div>
        {/if}
        <div class="text-sm font-bold text-gray-900 font-nums">
           {formatVal(serverData?.myStats?.avg5 ?? localAvg5)} <span class="text-gray-400 font-normal">avg</span>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap gap-2 mt-4 pt-2">
      {#each ratingTabs as tab}
        <Button
          variant="roundSmall"
          color={activeTab === tab.id ? "black" : "gray"}
          className={activeTab === tab.id ? "shadow-md" : "opacity-70 hover:opacity-100"}
          onClick={() => (activeTab = tab.id)}
        >
          {$t(tab.i18nKey)}
        </Button>
      {/each}
    </div>
  </div>
</div>