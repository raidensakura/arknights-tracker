<script>
    import Images from "$lib/components/Images.svelte";
    import Icons from "$lib/components/Icons.svelte";

    export let text;
    export let iconId; // only if iconVariant === "building-icon"
    export let buildingModeName; // only if iconVariant === "buildingMode"
    export let iconVariant; // "building-icon" | "manualCraft" | "hubCraft" | "buildingMode"

    $: svgIconName =
        iconVariant === "manualCraft" ? "recepies"
        : iconVariant === "hubCraft" ? "pba"
        : buildingModeName === "normal" ? "boxes"
        : buildingModeName === "liquid" ? "liquid"
        : "";

</script>

<div class="flex flex-row min-h-10 pl-2 gap-2 w-full items-center rounded-[6px] bg-[#1f1f1f] dark:bg-[#1f1f1f]">

    {#if (iconId && iconVariant)}
        <div class="flex justify-center items-center h-8 w-8">
            <Images id={iconId} variant={iconVariant}/>
        </div>
    {/if}

    {#if (iconVariant && svgIconName)}
        <div class="flex justify-center items-center h-8 w-8">
            <Icons
                name={svgIconName}
                class="text-[#FDFDFD] dark:text-[#FDFDFD]"
            />
        </div>
    {/if}

    <div class="flex items-center w-full">
        <span class="font-sdk text-lg text-[#FDFDFD] dark:text-[#FDFDFD]">
            {text}
        </span>
    </div>

</div>