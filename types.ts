
// Enums
export enum SlotType {
  HIGH = 'HIGH', // Weapons
  MID = 'MID',   // Shields, E-War, Propulsion
  LOW = 'LOW',   // Armor, Hull, Power upgrades
}

export enum ItemRarity {
  COMMON = 'Common',
  UNCOMMON = 'Uncommon',
  RARE = 'Rare',
  FACTION = 'Faction',
}

export enum RelicRarity {
  COMMON = 'Common',
  RARE = 'Rare',
  EPIC = 'Epic',
  LEGENDARY = 'Legendary',
}

export enum ShipClass {
  FRIGATE = 'Frigate',
  DESTROYER = 'Destroyer',
  CRUISER = 'Cruiser',
}

export enum DamageType {
  EM = 'EM',
  THERMAL = 'Thermal',
  KINETIC = 'Kinetic',
  EXPLOSIVE = 'Explosive',
}

export enum NodeType {
  START = 'START',
  COMBAT = 'COMBAT',
  ELITE = 'ELITE',
  EVENT = 'EVENT', // Gemini Powered
  SHOP = 'SHOP',
  REST = 'REST',
  BOSS = 'BOSS',
}

export enum LootType {
  XP = 'XP',
  CREDIT = 'CREDIT',
  MATERIAL = 'MATERIAL',
}

// Interfaces
export interface Item {
  id: string;
  name: string;
  description: string;
  slot: SlotType;
  cpu: number;
  pg: number; // Power Grid
  icon: string;
  rarity: ItemRarity;
  price: number;
  metaLevel: number; // 0=Civ, 1-4=T1 Named, 5=T2, 6+=Faction
  
  // Weapon stats
  weaponType?: string; // e.g. "Energy Weapon", "Projectile", "Missile Launcher"
  damage?: number;
  damageType?: DamageType;
  rateOfFire?: number; // seconds
  range?: number;
  tracking?: number;
  ammoCapacity?: number; // Max shots before reload
  reloadTime?: number; // Reload duration in seconds
  
  // Active Module Stats (Repairs)
  repairShield?: number;
  repairArmor?: number;
  repairHull?: number;
  capCost?: number; // Capacitor usage per cycle
  activationTime?: number; // Cycle duration in seconds
  
  // Passive stats
  shieldBonus?: number;
  armorBonus?: number;
  hullBonus?: number;
  speedBonus?: number;
  cpuBonus?: number;
  pgBonus?: number;
  
  // Damage Mods
  missileDamageBonus?: number; // %
  turretDamageBonus?: number; // %
  trackingBonus?: number; // %
  rangeBonus?: number; // %
}

export interface Relic {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: RelicRarity;
  
  // Passive Multipliers
  shieldRegenMult?: number;
  damageMult?: number;
  fireRateMult?: number;
  speedMult?: number;
  lootMagnetMult?: number;
  capRechargeMult?: number;
  
  // On Kill Effects (Build Enablers)
  ammoRefillOnKill?: number; // Amount of ammo refunded
  capRefillOnKill?: number; // Amount of cap restored
  healOnKill?: number; // Hull HP restored
}

export interface ShipStats {
  hp: {
    shield: number;
    armor: number;
    hull: number;
  };
  maxHp: {
    shield: number;
    armor: number;
    hull: number;
  };
  resistances: {
    shield: Record<DamageType, number>;
    armor: Record<DamageType, number>;
    hull: Record<DamageType, number>;
  };
  cap: {
    current: number;
    max: number;
    recharge: number; // Units per second
  };
  fitting: {
    cpu: number;
    pg: number;
  };
  speed: number;
  slots: {
    high: number;
    mid: number;
    low: number;
  };
}

export interface PlayerState {
  shipName: string;
  shipClass: ShipClass;
  stats: ShipStats;
  modules: Item[]; // Installed items
  inventory: Item[]; // Unequipped items
  relics: Relic[]; // Permanent buffs
  credits: number;
  materials: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
}

export interface MapNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  parents: string[];
  children: string[];
  completed: boolean;
  locked: boolean;
}

export interface GameEvent {
  title: string;
  description: string;
  choices: {
    text: string;
    outcomeDescription?: string;
    reward?: {
      credits?: number;
      materials?: number;
      item?: Item;
      repair?: boolean;
      damage?: number;
    }
  }[];
}
