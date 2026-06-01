<script>
    export let isOpen = false;
    export let className = "";

    let isDragging = false;
    let startY = 0;
    let startHeight = 50;
    let heightPercent = 50;

    function handleDragStart(e) {
        if (e.cancelable) e.preventDefault();
        
        isDragging = true;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        startY = clientY;
        startHeight = heightPercent;
    }

    function handleTouchMove(e) {
        if (!isDragging) return;
        const clientY = e.touches[0].clientY;
        updateHeight(clientY);
    }

    function handleMouseMove(e) {
        if (!isDragging) return;
        const clientY = e.clientY;
        updateHeight(clientY);
    }

    function updateHeight(clientY) {
        const windowHeight = window.innerHeight;
        const deltaY = startY - clientY;
        const deltaPercent = (deltaY / windowHeight) * 100;
        heightPercent = Math.max(15, Math.min(92, startHeight + deltaPercent));
    }

    function handleDragEnd() {
        if (!isDragging) return;
        isDragging = false;
        
        if (heightPercent < 22) {
            isOpen = false;
            setTimeout(() => {
                heightPercent = 50;
            }, 300);
        } else if (heightPercent >= 22 && heightPercent < 45) {
            heightPercent = 35;
        } else if (heightPercent >= 45 && heightPercent < 75) {
            heightPercent = 60;
        } else {
            heightPercent = 88;
        }
    }
</script>

<svelte:window
    on:touchmove={handleTouchMove}
    on:touchend={handleDragEnd}
    on:mousemove={handleMouseMove}
    on:mouseup={handleDragEnd}
/>

<div 
    class="fixed bottom-0 left-0 md:left-[var(--sb-w,0px)] right-0 md:w-auto z-50 flex flex-col overflow-hidden xl:bg-transparent xl:dark:bg-transparent bg-white/90 dark:bg-[#1A1A1A]/90 backdrop-blur-xl backdrop-saturate-[1.8] border-t border-gray-200/50 dark:border-white/10 rounded-t-3xl shadow-2xl h-[var(--sheet-height,50vh)] xl:static xl:bg-transparent xl:backdrop-blur-none xl:border-none xl:rounded-none xl:shadow-none xl:h-auto xl:overflow-visible xl:flex xl:flex-col xl:transition-none xl:flex-1 {className}"
    class:translate-y-full={!isOpen}
    class:translate-y-0={isOpen}
    class:xl:translate-y-0={true}
    style="--sheet-height: {heightPercent}vh; {isDragging ? 'transition: none !important;' : 'transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), height 0.3s cubic-bezier(0.16, 1, 0.3, 1);'}"
>
    <div 
        class="flex flex-col items-center pt-2.5 pb-2 px-5 cursor-grab active:cursor-grabbing select-none touch-none shrink-0 xl:hidden"
        role="button"
        tabindex="-1"
        aria-label="Resize sheet"
        on:mousedown={handleDragStart}
        on:touchstart={handleDragStart}
        on:keydown={() => {}}
    >
        <div class="w-14 h-1 bg-gray-400/50 rounded-full"></div>
    </div>

    <div class="flex-1 overflow-y-auto px-4 pt-1.5 pb-8 xl:p-0 xl:overflow-visible xl:flex xl:flex-col xl:flex-1 xl:w-full">
        <slot />
    </div>
</div>
