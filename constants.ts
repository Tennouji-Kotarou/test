
import { ShipClass, SlotType, DamageType, ItemRarity, Item, Relic, ShipStats, RelicRarity } from './types';

export const BASE_SHIPS: Record<ShipClass, Partial<ShipStats>> = {
  [ShipClass.FRIGATE]: {
    maxHp: { shield: 150, armor: 100, hull: 100 },
    fitting: { cpu: 180, pg: 45 },
    speed: 3.5,
    slots: { high: 2, mid: 2, low: 2 },
    cap: { current: 100, max: 100, recharge: 2.5 }
  },
  [ShipClass.DESTROYER]: {
    maxHp: { shield: 350, armor: 300, hull: 300 },
    fitting: { cpu: 350, pg: 120 },
    speed: 2.2,
    slots: { high: 5, mid: 3, low: 3 },
    cap: { current: 250, max: 250, recharge: 5.0 }
  },
  [ShipClass.CRUISER]: {
    maxHp: { shield: 1200, armor: 1000, hull: 1000 },
    fitting: { cpu: 700, pg: 600 },
    speed: 1.4,
    slots: { high: 6, mid: 5, low: 5 },
    cap: { current: 600, max: 600, recharge: 10.0 }
  },
};

export const SHIP_UPGRADE_COSTS = {
  [ShipClass.FRIGATE]: { materials: 0, credits: 0 }, 
  [ShipClass.DESTROYER]: { materials: 40, credits: 1000 },
  [ShipClass.CRUISER]: { materials: 150, credits: 4500 },
};

// --- ITEM GENERATION HELPERS ---

export const INITIAL_ITEMS: Item[] = [
  {
    id: 'civ_pulse',
    name: '民用脉冲激光器',
    description: '基础的快速射击能量武器。',
    slot: SlotType.HIGH,
    cpu: 8, pg: 4, icon: '⚡', rarity: ItemRarity.COMMON, price: 50, metaLevel: 0,
    weaponType: '能量武器', damage: 6, damageType: DamageType.EM, rateOfFire: 0.8, range: 300, tracking: 0.9,
  },
  {
    id: 'civ_shield_booster',
    name: '民用护盾回充增量器',
    description: '主动消耗电容修复护盾。',
    slot: SlotType.MID,
    cpu: 15, pg: 10, icon: '🔋', rarity: ItemRarity.COMMON, price: 100, metaLevel: 0,
    repairShield: 15, capCost: 10, activationTime: 3,
  },
  {
    id: 'nano_1',
    name: '纳米纤维结构 I',
    description: '增加舰船速度。',
    slot: SlotType.LOW,
    cpu: 10, pg: 1, icon: '💨', rarity: ItemRarity.COMMON, price: 150, metaLevel: 1,
    speedBonus: 0.4,
  }
];

// FULL ITEM POOL
export const ITEM_POOL: Item[] = [
  ...INITIAL_ITEMS,
  
  // --- HIGH SLOTS (WEAPONS) ---
  
  // PULSE LASERS (EM - Fast, Short Range)
  {
    id: 'pulse_1', name: '小型脉冲激光器 I', description: '标准电磁武器。',
    slot: SlotType.HIGH, cpu: 14, pg: 8, icon: '⚡', rarity: ItemRarity.COMMON, price: 500, metaLevel: 1,
    weaponType: '能量武器', damage: 12, damageType: DamageType.EM, rateOfFire: 0.75, range: 320,
  },
  {
    id: 'pulse_2', name: '小型脉冲激光器 II', description: 'T2科技：高伤害，高CPU需求。',
    slot: SlotType.HIGH, cpu: 22, pg: 12, icon: '⚡', rarity: ItemRarity.RARE, price: 2500, metaLevel: 5,
    weaponType: '能量武器', damage: 18, damageType: DamageType.EM, rateOfFire: 0.65, range: 350,
  },
  {
    id: 'pulse_faction', name: '共和舰队脉冲激光器', description: '势力装备：卓越的性能。',
    slot: SlotType.HIGH, cpu: 16, pg: 9, icon: '⚡', rarity: ItemRarity.FACTION, price: 15000, metaLevel: 8,
    weaponType: '能量武器', damage: 22, damageType: DamageType.EM, rateOfFire: 0.6, range: 400,
  },

  // AUTOCANNONS (Kinetic - Very Fast, Very Short Range)
  {
    id: 'ac_1', name: '150mm 自动加农炮 I', description: '动能撕裂者。',
    slot: SlotType.HIGH, cpu: 8, pg: 4, icon: '🔫', rarity: ItemRarity.COMMON, price: 450, metaLevel: 1,
    weaponType: '射弹武器', damage: 8, damageType: DamageType.KINETIC, rateOfFire: 0.25, range: 200,
  },
  {
    id: 'ac_2', name: '150mm 自动加农炮 II', description: 'T2 自动加农炮。',
    slot: SlotType.HIGH, cpu: 12, pg: 6, icon: '🔫', rarity: ItemRarity.RARE, price: 2200, metaLevel: 5,
    weaponType: '射弹武器', damage: 12, damageType: DamageType.KINETIC, rateOfFire: 0.2, range: 220,
  },
  
  // MISSILES (Explosive - Long Range, Ammo based)
  {
    id: 'missile_1', name: '轻型导弹发射器 I', description: '发射追踪导弹。',
    slot: SlotType.HIGH, cpu: 30, pg: 25, icon: '🚀', rarity: ItemRarity.UNCOMMON, price: 800, metaLevel: 1,
    weaponType: '导弹发射器', damage: 40, damageType: DamageType.EXPLOSIVE, rateOfFire: 3.5, range: 800, ammoCapacity: 12, reloadTime: 4,
  },
  {
    id: 'missile_2', name: '轻型导弹发射器 II', description: 'T2 发射器，射速更快。',
    slot: SlotType.HIGH, cpu: 40, pg: 35, icon: '🚀', rarity: ItemRarity.RARE, price: 3000, metaLevel: 5,
    weaponType: '导弹发射器', damage: 55, damageType: DamageType.EXPLOSIVE, rateOfFire: 2.8, range: 900, ammoCapacity: 16, reloadTime: 3,
  },
  {
    id: 'missile_faction', name: '加达里海军轻型导弹发射器', description: '势力发射器。',
    slot: SlotType.HIGH, cpu: 32, pg: 28, icon: '🚀', rarity: ItemRarity.FACTION, price: 20000, metaLevel: 8,
    weaponType: '导弹发射器', damage: 70, damageType: DamageType.EXPLOSIVE, rateOfFire: 2.5, range: 1000, ammoCapacity: 24, reloadTime: 2,
  },

  // --- MID SLOTS (SHIELD, EWAR, PROP) ---
  
  // Shield Boosters (Active)
  {
    id: 'msb_1', name: '中型护盾回充增量器 I', description: '消耗电容，快速回复护盾。',
    slot: SlotType.MID, cpu: 50, pg: 12, icon: '🔋', rarity: ItemRarity.UNCOMMON, price: 1500, metaLevel: 1,
    repairShield: 60, capCost: 40, activationTime: 4,
  },
  {
    id: 'ssb_2', name: '小型护盾回充增量器 II', description: 'T2 高效护盾回充。',
    slot: SlotType.MID, cpu: 25, pg: 8, icon: '🔋', rarity: ItemRarity.RARE, price: 2800, metaLevel: 5,
    repairShield: 35, capCost: 18, activationTime: 3,
  },

  // Shield Extenders (Passive)
  {
    id: 'mse_2', name: '中型护盾扩展装置 I', description: '大幅增加护盾容量。',
    slot: SlotType.MID, cpu: 45, pg: 70, icon: '🛡️', rarity: ItemRarity.UNCOMMON, price: 1200, metaLevel: 1,
    shieldBonus: 400,
  },
  
  // Tracking Computers
  {
    id: 'tc_1', name: '索敌计算机 I', description: '增加射程和追踪速度。',
    slot: SlotType.MID, cpu: 30, pg: 10, icon: '📡', rarity: ItemRarity.UNCOMMON, price: 1100, metaLevel: 1,
    rangeBonus: 0.15, trackingBonus: 0.15
  },

  // --- LOW SLOTS (ARMOR, HULL, DMG MODS) ---

  // Armor Repairers (Active)
  {
    id: 'sar_1', name: '小型装甲维修器 I', description: '消耗电容，维修装甲。',
    slot: SlotType.LOW, cpu: 20, pg: 5, icon: '🔧', rarity: ItemRarity.COMMON, price: 600, metaLevel: 1,
    repairArmor: 45, capCost: 25, activationTime: 5,
  },
  {
    id: 'mar_2', name: '中型装甲维修器 II', description: 'T2 强力装甲维修。',
    slot: SlotType.LOW, cpu: 45, pg: 15, icon: '🔧', rarity: ItemRarity.RARE, price: 3200, metaLevel: 5,
    repairArmor: 120, capCost: 60, activationTime: 8,
  },
  
  // Hull Repairers
  {
    id: 'shr_1', name: '小型结构维修器 I', description: '维修舰体结构。效率较低。',
    slot: SlotType.LOW, cpu: 25, pg: 5, icon: '🏗️', rarity: ItemRarity.UNCOMMON, price: 800, metaLevel: 1,
    repairHull: 30, capCost: 30, activationTime: 10,
  },

  // Damage Mods
  {
    id: 'bcs_1', name: '弹道控制系统 I', description: '增加导弹伤害。',
    slot: SlotType.LOW, cpu: 35, pg: 0, icon: '🎯', rarity: ItemRarity.UNCOMMON, price: 1500, metaLevel: 1,
    missileDamageBonus: 0.10,
  },
  {
    id: 'gyro_1', name: '陀螺稳定器 I', description: '增加射弹武器伤害。',
    slot: SlotType.LOW, cpu: 30, pg: 0, icon: '🎯', rarity: ItemRarity.UNCOMMON, price: 1400, metaLevel: 1,
    turretDamageBonus: 0.10,
  },
  {
    id: 'hs_1', name: '散热槽 I', description: '增加能量武器射速。',
    slot: SlotType.LOW, cpu: 25, pg: 0, icon: '🔥', rarity: ItemRarity.UNCOMMON, price: 1400, metaLevel: 1,
    turretDamageBonus: 0.05,
  },

  // Fitting / Speed
  {
    id: 'plate_1', name: '200mm 钢板 I', description: '增加装甲HP。',
    slot: SlotType.LOW, cpu: 20, pg: 30, icon: '🧱', rarity: ItemRarity.COMMON, price: 400, metaLevel: 1,
    armorBonus: 300, speedBonus: -0.3,
  },
  {
    id: 'co_proc_1', name: '协处理器 I', description: '增加舰船CPU输出。',
    slot: SlotType.LOW, cpu: 0, pg: 0, icon: '💾', rarity: ItemRarity.UNCOMMON, price: 1000, metaLevel: 1,
    cpuBonus: 60,
  },
];

export const RELIC_POOL: Relic[] = [
  // COMMON
  { id: 'flux_coil', name: '通量线圈', description: '护盾回充速度 +25%。', icon: '🌀', rarity: RelicRarity.COMMON, shieldRegenMult: 0.25 },
  { id: 'overdrive', name: '超速注入器', description: '飞行速度 +15%。', icon: '⏩', rarity: RelicRarity.COMMON, speedMult: 0.15 },
  
  // RARE
  { id: 'gyrostabilizer', name: '高级陀螺稳定器', description: '武器伤害 +20%。', icon: '🎯', rarity: RelicRarity.RARE, damageMult: 0.20 },
  { id: 'heat_sink', name: '高级散热槽', description: '射击速度 +15%。', icon: '🔥', rarity: RelicRarity.RARE, fireRateMult: 0.15 },
  { id: 'cap_relay', name: '电容能源继电器', description: '电容回充速度 +30%。', icon: '⚡', rarity: RelicRarity.RARE, capRechargeMult: 0.3 },

  // EPIC (Build Enablers)
  { id: 'scavenger', name: '拾荒者网络', description: '击杀敌人时，补充所有武器 1 发弹药。', icon: '♻️', rarity: RelicRarity.EPIC, ammoRefillOnKill: 1 },
  { id: 'vampire', name: '能量吸血鬼', description: '击杀敌人时，回复 10 点电容。', icon: '🧛', rarity: RelicRarity.EPIC, capRefillOnKill: 10 },
  { id: 'nanobot', name: '纳米机器人群', description: '击杀敌人时，修复 2 点结构。', icon: '🦠', rarity: RelicRarity.EPIC, healOnKill: 2 },
  
  // LEGENDARY
  { id: 'officer_mod', name: '官员级火控', description: '伤害 +40%，射速 +30%。', icon: '👑', rarity: RelicRarity.LEGENDARY, damageMult: 0.4, fireRateMult: 0.3 },
];

export const LEVEL_UP_XP_BASE = 150;
export const XP_SCALING = 1.3;
