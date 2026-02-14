<script>
  import { t } from "$lib/i18n";
  import { pullData } from "$lib/stores/pulls";
  import * as XLSX from "xlsx";
  import Icon from "$lib/components/Icons.svelte";
  import Button from "$lib/components/Button.svelte";
  import { banners } from "$lib/data/banners";

  export let isOpen = false;
  export let onClose;

  let fileInputExcel;

  function getDate(d) {
      if (!d) return 0;
      return new Date(d).getTime();
  }

  function exportExcel() {
    let dataToExport;
    const unsubscribe = pullData.subscribe((value) => {
      dataToExport = value;
    });
    unsubscribe();

    const workbook = XLSX.utils.book_new();
    const usedBannersMap = new Map();

    const categories = {
        "special": [],
        "standard": [],
        "weapon": [],
        "new_player": [],
        "other": []
    };

    for (const [storeKey, bannerData] of Object.entries(dataToExport)) {
        if (!bannerData.pulls || bannerData.pulls.length === 0) continue;

        let cat = 'other';
        const keyLower = storeKey.toLowerCase();
        
        if (keyLower.includes('new') || keyLower.includes('beginner')) cat = 'new_player';
        else if (keyLower.includes('weap') || keyLower.includes('wepon') || keyLower.includes('constant')) cat = 'weapon';
        else if (keyLower === 'standard' || keyLower.includes('standard')) cat = 'standard';
        else if (keyLower.includes('special') || keyLower.includes('event')) cat = 'special';
        
        const pulls = [...bannerData.pulls].sort((a, b) => new Date(a.time) - new Date(b.time));

        // --- НОВОЕ: Счетчик круток для каждого конкретного баннера внутри категории ---
        const bannerCounters = {}; 

        pulls.forEach((pull, index) => {
            const pullTime = new Date(pull.time).getTime();
            
            // 1. Поиск по ID (если есть rawPoolId)
            let foundBanner = banners.find(b => b.id === pull.rawPoolId);

            // 2. Поиск по ВРЕМЕНИ
            if (!foundBanner) {
                let searchType = null;
                if (cat === 'special') searchType = 'special';
                if (cat === 'weapon') searchType = 'weapon';
                if (cat === 'new_player') searchType = 'new-player';
                if (cat === 'standard') searchType = 'standard';

                if (searchType) {
                    foundBanner = banners.find(b => {
                        const bType = (b.type || "").toLowerCase();
                        const isMatch = (searchType === 'weapon') 
                            ? (bType === 'weapon' || (b.id && (b.id.includes('weap') || b.id.includes('constant'))))
                            : (bType === searchType || (searchType === 'standard' && (bType === 'constant' || bType === 'standard')));
                        
                        if (!isMatch) return false;

                        const start = getDate(b.startTime);
                        const end = b.endTime ? getDate(b.endTime) : 4102444800000;
                        return pullTime >= (start - 7200000) && pullTime <= (end + 7200000);
                    });
                }
            }

            let bannerNameDisplay = storeKey; 
            // ID для подсчета Roll (чтобы отличать баннеры друг от друга)
            let trackingId = storeKey; 
            
            if (foundBanner) {
                bannerNameDisplay = foundBanner.name || foundBanner.id;
                trackingId = foundBanner.id; // Используем уникальный ID баннера

                if (!usedBannersMap.has(foundBanner.id)) {
                    usedBannersMap.set(foundBanner.id, foundBanner);
                }
            } else {
                const genericId = storeKey;
                if (!usedBannersMap.has(genericId)) {
                    usedBannersMap.set(genericId, { id: genericId, name: genericId, startTime: null, endTime: null });
                }
            }

            // --- ЛОГИКА СЧЕТЧИКА ROLL ---
            if (!bannerCounters[trackingId]) {
                bannerCounters[trackingId] = 0;
            }
            bannerCounters[trackingId]++;
            // ---------------------------

            const row = {
                "Time": pull.time ? new Date(pull.time).toLocaleString("ru-RU") : "",
                "Banner": bannerNameDisplay,
                "Name": pull.name,
                "Rarity": pull.rarity,
                "Pity": pull.pity,
                "Roll": bannerCounters[trackingId] // Используем локальный счетчик баннера
            };
            categories[cat].push(row);
        });
    }

    const catNames = {
        "special": "Special",
        "standard": "Standard",
        "weapon": "Weapon",
        "new_player": "New Player",
        "other": "Other"
    };

    Object.entries(categories).forEach(([key, rows]) => {
        if (rows.length === 0) return;

        const ws = XLSX.utils.json_to_sheet(rows);

        // Настройка ширины колонок (wch - width in characters)
        // Time: 18, Banner: 22, Name: 13, Rarity: 6, Pity: 4
        ws["!cols"] = [
            { wch: 18 }, 
            { wch: 22 }, 
            { wch: 13 }, 
            { wch: 6 },  
            { wch: 4 },  
            { wch: 6 }   // Roll
        ];

        XLSX.utils.book_append_sheet(workbook, ws, catNames[key]);
    });

    const bannersArray = Array.from(usedBannersMap.values())
        .filter(b => {
            if (b.name === b.id && ['special', 'weapon', 'new-player', 'standard'].includes(b.id)) return false; 
            return true;
        })
        .map(b => ({
            "Banner Name": b.name,
            "ID": b.id,
            "Start Time": b.startTime ? new Date(b.startTime).toLocaleString("ru-RU") : "-",
            "End Time": b.endTime ? new Date(b.endTime).toLocaleString("ru-RU") : "-"
    }));
    
    bannersArray.sort((a, b) => {
        if (a["Start Time"] === "-") return 1;
        if (b["Start Time"] === "-") return -1;
        return 0; 
    });

    if (bannersArray.length > 0) {
        const wsBanners = XLSX.utils.json_to_sheet(bannersArray);
        wsBanners["!cols"] = [{ wch: 45 }, { wch: 25 }, { wch: 22 }, { wch: 22 }];
        XLSX.utils.book_append_sheet(workbook, wsBanners, "Banners List");
    }

    const infoData = [
        { "Property": "Site", "Value": "Goyfield.moe" },
        { "Property": "Export Date", "Value": new Date().toLocaleString("ru-RU") },
        { "Property": "Version", "Value": "1.3" },
    ];
    const wsInfo = XLSX.utils.json_to_sheet(infoData);
    wsInfo["!cols"] = [{ wch: 20 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(workbook, wsInfo, "Info");

    XLSX.writeFile(workbook, `Goyfield_Export_${new Date().toISOString().slice(0,10)}.xlsx`);
  }

  function handleKeydown(event) {
    if (event.key === "Escape") onClose();
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div
    class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm transition-opacity"
    on:click={onClose}
    on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && onClose()}
    role="button"
    tabindex="0"
  >
    <div
      class="bg-white rounded-2xl p-8 w-[500px] dark:bg-[#383838] dark:border-[#444444] shadow-2xl transform transition-all scale-100 cursor-default"
      on:click|stopPropagation
      on:keydown|stopPropagation
      role="dialog"
      aria-modal="true"
      tabindex="-1"
    >
      <h2 class="text-2xl font-bold dark:text-[#FDFDFD] mb-6 text-[#21272C] font-sdk">
        {$t("page.recordsSettings.settings")}
      </h2>

      <div class="space-y-6">
        <div>
          <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 font-sdk">
            Excel
          </h3>
          <div class="grid grid-cols-1 gap-3">
            <button
              on:click={exportExcel}
              class="flex flex-col dark:border-[#444444] dark:bg-[#383838] hover:dark:bg-[#373737] items-center justify-center p-4 border border-gray-200 rounded-xl hover:border-[#1D6F42] hover:bg-green-50 transition group bg-white h-24 w-full"
            >
              <div class="mb-2 text-gray-400 group-hover:text-[#1D6F42] dark:text-[#E0E0E0] transition-colors">
                <Icon name="export" class="w-5 h-5" />
              </div>
              <div class="font-bold dark:text-[#E0E0E0] text-[#21272C] text-sm">
                {$t("page.recordsSettings.exportXLSX")}
              </div>
            </button>
            
            </div>
        </div>
      </div>

      <div class="mt-8 flex justify-end">
        <div class="w-auto">
          <Button variant="round" color="white" onClick={onClose}>
            {$t("page.recordsSettings.close")}
          </Button>
        </div>
      </div>
    </div>
  </div>
{/if}