import { get } from "svelte/store";
import { t } from "$lib/i18n.js";

export function parseRichText(text) {
    if (!text) return "";
    const styles = {
        "ba.natur": "text-[#ade131] font-bold", // Природный
        "ba.fire": "text-[#f45511] font-bold", // Огненный
        "ba.cryst": "text-[#08edfb] font-bold", // Кристаллический
        "ba.pulse": "text-[#ffcc00] font-bold", // Электрический
        "ba.phy": "text-[#7d582d] font-bold", // Физический
        "ba.poise": "text-[#ffd399] font-bold", // Ошеломление
        "ba.vup": "text-[#22BBFF] font-bold", // Повышение
        "ba.key": "text-[#00a8ff] font-bold", // Ключевые термины
        "ba.conduct": "text-[#ffcc00] font-bold", // Электризация
        "ba.spelldmg": "text-[#E3BC55] font-bold", // Урон от искусств
        "ba.info": "text-gray-500 dark:text-[#A0A0A0] italic font-normal text-[13px]",
        "ba.heal": "text-[#ade131] font-bold",
        "ba.consume": "text-[#E3BC55] font-bold",
        "ba.noguard": "text-[#e8ceb0] font-bold",
        "ba.crush": "text-[#e8ceb0] font-bold",
        "ba.fracture": "text-[#e8ceb0] font-bold",
        "ba.pd": "text-[#7d582d] font-bold",
        "ba.physicalvul": "text-[#F87171] font-bold",
        "ba.originium": "text-[#ff7100] font-bold",
        "ba.return": "text-[#38BDF8] font-bold",
    };

    let html = text.replace(/<([@#])([^>]+)>/g, (match, type, tag) => {
        if (tag === "profile.key") return "<span>";
        let styleClass = styles[tag] || "text-[#E3BC55] font-bold";
        if (type === "#") {
            styleClass +=
                " underline decoration-dashed decoration-current underline-offset-4";
        }
        
        const showIconPlaceholder = tag !== "ba.info" && tag !== "profile.key";
        let iconPlaceholder = '';
        if (showIconPlaceholder) {
            const imgName = `icon_term_${tag.replace(/\./g, '_')}.png`;
            const imgSrc = `/images/textIcons/${imgName}`;
            iconPlaceholder = `<img src="${imgSrc}" class="w-5 h-5 inline-block align-text-bottom shrink-0 transition-transform duration-200 hover:scale-110" style="display: none;" onload="this.style.display='inline-block'" />`;
        }
        
        return `<span class="rich-term ${styleClass}" data-term-id="${tag}">${iconPlaceholder}`;
    });
    
    html = html.replace(/<\/>/g, "</span>");
    html = html.replace(/\n/g, "<br>");
    return html;
}

export function hyperlinkAction(node) {
    let tooltipEl = null;
    let hoverListeners = [];

    function cleanup() {
        cleanupTooltip();

        hoverListeners.forEach(cleanupListener => cleanupListener());
        hoverListeners = [];
    }

    function cleanupTooltip() {
        if (tooltipEl) {
            tooltipEl.remove();
            tooltipEl = null;
        }
        window.removeEventListener('scroll', cleanupTooltip);
        window.removeEventListener('resize', cleanupTooltip);
    }

    function init() {
        cleanup();

        const terms = node.querySelectorAll('.rich-term');
        const tFunc = get(t);

        terms.forEach(term => {
            const termId = term.getAttribute('data-term-id');
            if (!termId) return;

            const tooltipTitle = tFunc(`hyperlink.${termId}.name`);
            const tooltipDesc = tFunc(`hyperlink.${termId}.desc`);
            const hasTooltip = tooltipDesc && tooltipDesc !== `hyperlink.${termId}.desc`;

            if (hasTooltip) {
                term.classList.add('cursor-default');

                const showTooltip = () => {
                    cleanupTooltip();

                    tooltipEl = document.createElement('div');
                    tooltipEl.className = "fixed px-3 py-2 bg-gray-900/95 dark:bg-[#1E1E1E]/95 text-white text-xs rounded-xl shadow-2xl pointer-events-none z-[999999] max-w-[280px] whitespace-normal leading-normal border border-white/10 backdrop-blur-sm transition-all duration-150 animate-fadeIn";

                    const titleImgName = `icon_term_${termId.replace(/\./g, '_')}.png`;
                    const titleImgSrc = `/images/textIcons/${titleImgName}`;
                    const titleHtml = `<div class="font-bold border-b border-white/20 pb-1 mb-1 text-[13px] tracking-wide text-yellow-400 flex items-center gap-1.5"><img src="${titleImgSrc}" class="w-4 h-4 inline-block align-text-bottom shrink-0" style="display: none;" onload="this.style.display='inline-block'" />${tooltipTitle}</div>`;
                    
                    const parsedDesc = parseRichText(tooltipDesc);
                    const descHtml = `<div class="text-[11px] text-gray-200">${parsedDesc}</div>`;
                    tooltipEl.innerHTML = titleHtml + descHtml;

                    document.body.appendChild(tooltipEl);

                    window.addEventListener('scroll', cleanupTooltip, { passive: true });
                    window.addEventListener('resize', cleanupTooltip, { passive: true });

                    updatePosition();
                };

                const hideTooltip = () => {
                    cleanupTooltip();
                };

                const updatePosition = () => {
                    if (!tooltipEl) return;
                    const termRect = term.getBoundingClientRect();
                    const tooltipRect = tooltipEl.getBoundingClientRect();

                    let left = termRect.left + (termRect.width - tooltipRect.width) / 2;
                    if (left < 10) {
                        left = 10;
                    } else if (left + tooltipRect.width > window.innerWidth - 10) {
                        left = window.innerWidth - tooltipRect.width - 10;
                    }

                    let top = termRect.top - tooltipRect.height - 8;
                    if (top < 10) {
                        top = termRect.bottom + 8;
                    }

                    tooltipEl.style.top = `${top}px`;
                    tooltipEl.style.left = `${left}px`;
                };

                term.addEventListener('mouseenter', showTooltip);
                term.addEventListener('mouseleave', hideTooltip);

                hoverListeners.push(() => {
                    term.removeEventListener('mouseenter', showTooltip);
                    term.removeEventListener('mouseleave', hideTooltip);
                });
            }
        });
    }

    init();

    return {
        update() {
            setTimeout(init, 0);
        },
        destroy() {
            cleanup();
        }
    };
}
