<script>
    import { page } from "$app/stores";
    import { Miner } from "$lib/classes/buildings/Miner.js";
    import { Pump } from "$lib/classes/buildings/Pump.js";
    import { HubCraft } from "$lib/classes/crafts/HubCraft.js";
    import { MachineCraft } from "$lib/classes/crafts/MachineCraft.js";
    import { ManualCraft } from "$lib/classes/crafts/ManualCraft.js";
    import BottomSheet from "$lib/components/BottomSheet.svelte";
    import Button from "$lib/components/Button.svelte";
    import FormulaSidebar from "$lib/components/recipes/FormulaSidebar.svelte";
    import FormulaTreePlate from "$lib/components/recipes/FormulaTreePlate.svelte";

    $: startItemId = $page.url.searchParams.get("itemId");
    $: startFormulaType = $page.url.searchParams.get("type");
    $: startFromulaId = $page.url.searchParams.get("formulaId");
    $: startFormulaBuildingId = $page.url.searchParams.get("buildingId");

    let startFormula;

    $: if (startFormulaType === "machineCraft" && startFromulaId) {
        startFormula = MachineCraft.getMachineCraft(startFromulaId);

    } else if (startFormulaType === "manualCraft" && startFromulaId) {
        startFormula = ManualCraft.getManualCraft(startFromulaId);

    } else if (startFormulaType === "hubCraft" && startFromulaId) {
        startFormula = HubCraft.getHubCraft(startFromulaId);

    } else if (startFormulaType === "miningFormula" && startFormulaBuildingId) {
        startFormula = Miner.getMiner(startFormulaBuildingId)?.getMiningFormula(startItemId);

    } else if (startFormulaType === "pumpingFormula" && startFormulaBuildingId) {
        startFormula = Pump.getPump(startFormulaBuildingId)?.getPumpingFormula(startItemId);

    } else {
        startFormula = null;
    }

    let isBottomSheetOpen = false;
    let sidebarMode = "tree";

    let selectedItemNode;

    let currentItemId;
    let currentFormulas = [];
    let isHeadItem = false;

    $: if (selectedItemNode) {
        currentItemId = selectedItemNode.itemId;

        currentFormulas = [];

        let formula = selectedItemNode.formula;
        if (formula) {
            currentFormulas.push(formula);
        }

        let parentFormula = selectedItemNode.parentNode?.formula;
        if (parentFormula) {
            currentFormulas.push(parentFormula);
        }

        isHeadItem = !selectedItemNode.parentNode;
    } else {
        currentItemId = null;
        currentFormulas = [];
        isHeadItem = false;
    }

</script>

<div class="max-w-[100%] flex flex-col xl:flex-row">

    <div class="w-full xl:w-[calc(100%-max(470px,30%))] mr-6">

        <div class="flex flex-row gap-6 items-center mb-8 h-12">

            <Button variant="roundSmall" color="white" onClick={() => history.back()}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 18l-6-6 6-6" />
                </svg>
            </Button>

            <div class="flex items-baseline flex-wrap gap-2 md:gap-3 font-sdk">
                <h2 class="text-3xl md:text-5xl tracking-wide text-[#21272C] dark:text-[#FDFDFD]">
                    Recipe tree
                </h2>
            </div>

        </div>

        <div class="w-full h-[calc(100vh-144px)]">

            <FormulaTreePlate
                startItemId={startItemId}
                startFormula={startFormula}
                bind:isBottomSheetOpen={isBottomSheetOpen}
                bind:selectedItemNode={selectedItemNode}
            />

        </div>

    </div>

    <BottomSheet bind:isOpen={isBottomSheetOpen}>
        <div class="w-full min-h-[50vh] h-full xl:h-[calc(100vh-64px)] sticky top-8">

            <FormulaSidebar
                currentItemId={currentItemId}
                mode="{sidebarMode}"
                currentFormulas={currentFormulas}
                isHeadItem={isHeadItem}
            />

        </div>
    </BottomSheet>

</div>