// backend/banners.js

// Хелпер: Превращает строку в UTC Timestamp (миллисекунды)
// Мы заменяем пробел на 'T' и добавляем 'Z' в конец, чтобы сервер понял, что это UTC+0
const toTimestamp = (dateStr) => {
    if (!dateStr) return null;
    // Если формат "2026-01-22 03:00:00", делаем "2026-01-22T03:00:00Z"
    const isoStr = dateStr.replace(' ', 'T') + 'Z'; 
    return new Date(isoStr).getTime();
};

const RAW_BANNERS = [
  {
    id: "standard_01",
    // Должен совпадать с тем, что возвращает mapPoolTypeToShort (p.poolId)
    // Если mapPoolTypeToShort возвращает 'standard', то тут тоже 'standard'
    type: "standard", 
    startTime: "2026-01-22 03:00:00",
    endTime: null,
  },
  {
    id: "new_player_01",
    type: "beginner", // ВАЖНО: Проверь, как ты назвал это в mapPoolTypeToShort (beginner или new-player)
    startTime: "2026-01-22 03:00:00",
    endTime: null,
  },
  {
    id: "special_banner_01", 
    name: "Scars Of The Forge",
    type: "special",
    startTime: "2026-01-22 03:00:00",
    endTime: "2026-02-07 11:59:59",
  },
  {
    id: "special_banner_02",
    name: "The Floaty Messenger",
    type: "special",
    startTime: "2026-02-07 12:00:00",
    endTime: "2026-02-24 11:59:59",
  },
  {
    id: "special_banner_03",
    name: "Hues Of Passion",
    type: "special",
    startTime: "2026-02-24 12:00:00",
    endTime: "2026-03-16 11:59:59",
  },
  {
    id: "weapon_banner_01",
    name: "Smelting Forge Issue",
    type: "weapon", // Убедись, что твоя логика обрабатывает weapon (в POOL_TYPES их может не быть)
    startTime: "2026-01-22 03:00:00",
    endTime: "2026-03-16 11:59:59",
  }
];

// Экспортируем уже обработанные данные с числами вместо строк
const BANNERS = RAW_BANNERS.map(b => ({
    id: b.id,
    type: b.type,
    startTime: toTimestamp(b.startTime),
    endTime: b.endTime ? toTimestamp(b.endTime) : 4102444800000, // Если null, ставим далекое будущее
}));

module.exports = { BANNERS };