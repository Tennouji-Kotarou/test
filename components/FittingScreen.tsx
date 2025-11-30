
import React, { useState } from 'react';
import { PlayerState, Item, SlotType, ShipClass, Relic, RelicRarity, DamageType } from '../types';
import { BASE_SHIPS } from '../constants';

interface FittingScreenProps {
  player: PlayerState;
  onEquip: (item: Item) => void;
  onUnequip: (item: Item) => void;
  onClose: () => void;
}

export const FittingScreen: React.FC<FittingScreenProps> = ({ player, onEquip, onUnequip, onClose }) => {
  const [previewItem, setPreviewItem] = useState<Item | null>(null);
  const [hoverItem, setHoverItem] = useState<{ item: Item, source: 'INVENTORY' | 'SLOT' } | null>(null);

  // Calculate Fitting Usage
  const cpuUsed = player.modules.reduce((sum, mod) => sum + mod.cpu, 0);
  const pgUsed = player.modules.reduce((sum, mod) => sum + mod.pg, 0);
  
  // Calculate Base + Bonus Fitting
  const baseStats = BASE_SHIPS[player.shipClass] || BASE_SHIPS[ShipClass.FRIGATE];
  let maxCpu = baseStats.fitting?.cpu || 100;
  let maxPg = baseStats.fitting?.pg || 100;
  
  // Apply module bonuses to fitting itself
  player.modules.forEach(m => {
    if (m.cpuBonus) maxCpu += m.cpuBonus;
    if (m.pgBonus) maxPg += m.pgBonus;
  });

  const slots = baseStats.slots || { high: 0, mid: 0, low: 0 };

  const getSlotItems = (type: SlotType) => player.modules.filter(m => m.slot === type);

  const getMetaBadge = (item: Item) => {
      if (item.metaLevel === 0) return null;
      if (item.metaLevel >= 1 && item.metaLevel < 5) return <div className="absolute top-0 right-0 bg-gray-700 text-[9px] text-white px-1 leading-none">M{item.metaLevel}</div>;
      if (item.metaLevel === 5) return <div className="absolute top-0 right-0 bg-orange-600 text-[9px] text-black font-bold px-1 leading-none">T2</div>;
      if (item.metaLevel >= 6) return <div className="absolute top-0 right-0 bg-green-600 text-[9px] text-white font-bold px-1 leading-none">F</div>;
      return null;
  };

  const getItemBorderColor = (item: Item) => {
      if (item.metaLevel === 5) return 'border-orange-500';
      if (item.metaLevel >= 6) return 'border-green-500';
      return 'border-cyan-600';
  };
  
  const getRelicBorder = (rarity: RelicRarity) => {
      switch(rarity) {
          case RelicRarity.COMMON: return 'border-gray-500';
          case RelicRarity.RARE: return 'border-blue-500 bg-blue-900/10';
          case RelicRarity.EPIC: return 'border-purple-500 bg-purple-900/10';
          case RelicRarity.LEGENDARY: return 'border-yellow-500 bg-yellow-900/10';
          default: return 'border-gray-500';
      }
  };

  const getDamageTypeColor = (type?: DamageType) => {
      switch(type) {
          case DamageType.EM: return 'text-blue-400';
          case DamageType.THERMAL: return 'text-orange-400';
          case DamageType.KINETIC: return 'text-gray-400';
          case DamageType.EXPLOSIVE: return 'text-red-500';
          default: return 'text-white';
      }
  };

  const slotTypeCN: Record<SlotType, string> = {
      [SlotType.HIGH]: '高槽',
      [SlotType.MID]: '中槽',
      [SlotType.LOW]: '低槽'
  };

  const renderItemTooltip = (item: Item) => (
      <div className="bg-gray-900 border border-cyan-600 p-4 shadow-2xl z-50 pointer-events-none w-64">
          <div className="flex items-center gap-2 mb-2 border-b border-gray-700 pb-2">
              <span className="text-2xl">{item.icon}</span>
              <div className="overflow-hidden">
                <div className="text-sm font-bold text-white truncate">{item.name}</div>
                <div className="text-[10px] text-cyan-400 uppercase">Meta {item.metaLevel}</div>
              </div>
          </div>
          
          <div className="space-y-1 text-xs text-gray-300">
             {item.weaponType && (
                 <div className="flex justify-between border-b border-gray-800 pb-1 mb-1">
                     <span>类型</span>
                     <span className="text-cyan-200 font-bold">{item.weaponType}</span>
                 </div>
             )}
             
             {item.damage && (
                 <div className="flex justify-between">
                     <span>基础伤害</span> 
                     <span className={`${getDamageTypeColor(item.damageType)} font-bold`}>
                         {item.damage} ({item.damageType})
                     </span>
                 </div>
             )}
             
             {item.range && <div className="flex justify-between"><span>射程</span> <span>{item.range}m</span></div>}
             {item.rateOfFire && <div className="flex justify-between"><span>射速</span> <span>{item.rateOfFire}s</span></div>}
             {item.tracking && <div className="flex justify-between"><span>追踪</span> <span>{item.tracking}</span></div>}
             
             {/* Active Module Stats */}
             {item.repairShield && <div className="flex justify-between"><span>护盾维修</span> <span className="text-blue-400">+{item.repairShield}</span></div>}
             {item.repairArmor && <div className="flex justify-between"><span>装甲维修</span> <span className="text-yellow-400">+{item.repairArmor}</span></div>}
             {item.repairHull && <div className="flex justify-between"><span>结构维修</span> <span className="text-red-400">+{item.repairHull}</span></div>}
             {item.capCost && <div className="flex justify-between"><span>电容消耗</span> <span className="text-yellow-200">-{item.capCost} GJ</span></div>}
             {item.activationTime && <div className="flex justify-between"><span>循环时间</span> <span className="text-white">{item.activationTime}s</span></div>}
             
             {item.shieldBonus && <div className="flex justify-between"><span>护盾加成</span> <span className="text-blue-400">+{item.shieldBonus}</span></div>}
             {item.armorBonus && <div className="flex justify-between"><span>装甲加成</span> <span className="text-yellow-400">+{item.armorBonus}</span></div>}
             {item.hullBonus && <div className="flex justify-between"><span>结构加成</span> <span className="text-red-400">+{item.hullBonus}</span></div>}
             {item.speedBonus && <div className="flex justify-between"><span>速度加成</span> <span className="text-white">+{item.speedBonus}</span></div>}
             {item.ammoCapacity && <div className="flex justify-between"><span>弹药</span> <span className="text-yellow-400">{item.ammoCapacity}</span></div>}
             
             {item.missileDamageBonus && <div className="flex justify-between"><span>导弹伤害</span> <span className="text-green-400">+{Math.round(item.missileDamageBonus * 100)}%</span></div>}
             {item.turretDamageBonus && <div className="flex justify-between"><span>射弹伤害</span> <span className="text-green-400">+{Math.round(item.turretDamageBonus * 100)}%</span></div>}

             <div className="flex justify-between pt-2 border-t border-gray-800 mt-2 text-gray-500">
                 <span>CPU: {item.cpu}</span>
                 <span>PG: {item.pg}</span>
             </div>
          </div>
      </div>
  );

  const renderSlotGroup = (type: SlotType, count: number) => {
    const equipped = getSlotItems(type);
    const slotsArr = Array(count).fill(null);

    return (
      <div className="mb-4">
        <h3 className="text-cyan-400 text-sm font-bold mb-2 uppercase tracking-widest border-b border-cyan-900 pb-1">{slotTypeCN[type]}</h3>
        <div className="flex gap-2">
          {slotsArr.map((_, idx) => {
            const item = equipped[idx];
            return (
              <div 
                key={`${type}-${idx}`}
                className={`w-16 h-16 border-2 flex items-center justify-center relative group transition-colors
                  ${item ? `${getItemBorderColor(item)} bg-cyan-900/20 hover:bg-cyan-800/40 cursor-pointer` : 'border-gray-800 bg-gray-900/50 dashed'}`}
                onClick={() => item && onUnequip(item)}
                onMouseEnter={() => item && setHoverItem({ item, source: 'SLOT' })}
                onMouseLeave={() => setHoverItem(null)}
              >
                {item ? (
                  <>
                    <span className="text-2xl">{item.icon}</span>
                    {getMetaBadge(item)}
                    <div className="absolute bottom-0 right-0 text-[10px] bg-black/80 px-1 text-cyan-200">
                      {item.cpu}tf
                    </div>
                    {/* Info Button */}
                    <button 
                        className="absolute top-0 left-0 text-[10px] bg-gray-800 text-cyan-400 hover:bg-cyan-600 hover:text-white px-1"
                        onClick={(e) => { e.stopPropagation(); setPreviewItem(item); }}
                    >
                        i
                    </button>
                  </>
                ) : (
                   <span className="text-gray-700 text-xs">空闲</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const canEquip = (item: Item) => {
    const currentInSlot = player.modules.filter(m => m.slot === item.slot).length;
    const maxInSlot = item.slot === SlotType.HIGH ? slots.high : item.slot === SlotType.MID ? slots.mid : slots.low;
    
    if (currentInSlot >= maxInSlot) return false;
    if (cpuUsed + item.cpu > maxCpu) return false;
    if (pgUsed + item.pg > maxPg) return false;
    return true;
  };

  return (
    <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-50 p-4">
      <div className="w-full max-w-6xl h-full grid grid-cols-12 gap-4">
        
        {/* Left: Ship Stats & Fitting Bars */}
        <div className="col-span-3 bg-gray-900/50 border border-gray-700 p-4 flex flex-col">
          <h2 className="text-xl font-bold text-white mb-6 uppercase">{player.shipClass} 级</h2>
          
          {/* CPU Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1 text-cyan-300">
              <span>CPU 输出</span>
              <span>{cpuUsed} / {maxCpu} tf</span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded overflow-hidden">
               <div className={`h-full ${cpuUsed > maxCpu ? 'bg-red-500' : 'bg-cyan-500'}`} style={{ width: `${Math.min(100, (cpuUsed/maxCpu)*100)}%` }}></div>
            </div>
          </div>

          {/* PG Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-xs mb-1 text-amber-300">
              <span>能量栅格</span>
              <span>{pgUsed} / {maxPg} MW</span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded overflow-hidden">
               <div className={`h-full ${pgUsed > maxPg ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(100, (pgUsed/maxPg)*100)}%` }}></div>
            </div>
          </div>
          
          <div className="space-y-2 text-sm text-gray-400 mb-8">
             <div className="flex justify-between border-b border-gray-800 pb-1">
               <span>飞行速度</span> <span className="text-white">{Math.round(player.stats.speed * 100)} m/s</span>
             </div>
             <div className="flex justify-between border-b border-gray-800 pb-1">
               <span>护盾容量</span> <span className="text-blue-300">{player.stats.maxHp.shield}</span>
             </div>
             <div className="flex justify-between border-b border-gray-800 pb-1">
               <span>装甲容量</span> <span className="text-yellow-700">{player.stats.maxHp.armor}</span>
             </div>
             <div className="flex justify-between border-b border-gray-800 pb-1">
               <span>结构完整性</span> <span className="text-red-900">{player.stats.maxHp.hull}</span>
             </div>
             <div className="flex justify-between border-b border-gray-800 pb-1">
               <span>电容容量</span> <span className="text-yellow-300">{player.stats.cap.max} GJ</span>
             </div>
          </div>

          {/* RELICS Section */}
          <div className="flex-1">
             <h3 className="text-xs font-bold text-yellow-500 uppercase mb-2">已激活遗物</h3>
             <div className="flex flex-wrap gap-2">
                 {player.relics.length === 0 && <span className="text-gray-600 text-xs italic">无遗物。</span>}
                 {player.relics.map((r, i) => (
                     <div key={i} className={`w-8 h-8 border flex items-center justify-center text-lg cursor-help ${getRelicBorder(r.rarity)}`} title={`${r.name}: ${r.description}`}>
                        {r.icon}
                     </div>
                 ))}
             </div>
          </div>

          <button onClick={onClose} className="mt-4 w-full py-3 bg-cyan-700 hover:bg-cyan-600 text-white font-bold uppercase tracking-wider">
            确认装配
          </button>
        </div>

        {/* Center: Slots */}
        <div className="col-span-5 flex flex-col justify-center items-center relative">
           {/* Ship Silhouette (Abstract) */}
           <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
              <svg viewBox="0 0 100 100" className="w-64 h-64 fill-white">
                 <path d="M50 10 L90 80 L50 70 L10 80 Z" />
              </svg>
           </div>
           
           <div className="z-10 w-full max-w-md">
             {renderSlotGroup(SlotType.HIGH, slots.high)}
             {renderSlotGroup(SlotType.MID, slots.mid)}
             {renderSlotGroup(SlotType.LOW, slots.low)}
           </div>

           {/* SLOT TOOLTIP CONTAINER */}
           {hoverItem && hoverItem.source === 'SLOT' && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
                   {renderItemTooltip(hoverItem.item)}
              </div>
           )}
        </div>

        {/* Right: Cargo/Inventory */}
        <div className="col-span-4 bg-gray-900/50 border border-gray-700 p-4 overflow-y-auto relative">
          <h2 className="text-lg font-bold text-gray-300 mb-4 uppercase">货舱</h2>
          <div className="grid grid-cols-4 gap-2">
            {player.inventory.map((item, idx) => {
              const equipable = canEquip(item);
              const borderColor = getItemBorderColor(item);
              return (
                <div 
                  key={idx}
                  className={`aspect-square border bg-black flex flex-col items-center justify-center p-1 cursor-pointer hover:border-white transition-colors relative group
                     ${borderColor}
                     ${!equipable ? 'opacity-50' : ''}`}
                  onClick={() => equipable && onEquip(item)}
                  onMouseEnter={() => setHoverItem({ item, source: 'INVENTORY' })}
                  onMouseLeave={() => setHoverItem(null)}
                >
                  <span className="text-2xl">{item.icon}</span>
                  {getMetaBadge(item)}
                  <span className="text-[10px] text-gray-500 text-center leading-none mt-1 truncate w-full">{item.name}</span>
                  
                   {/* Info Button */}
                    <button 
                        className="absolute top-0 left-0 text-[10px] bg-gray-800 text-cyan-400 hover:bg-cyan-600 hover:text-white px-1"
                        onClick={(e) => { e.stopPropagation(); setPreviewItem(item); }}
                    >
                        i
                    </button>
                </div>
              );
            })}
          </div>
          {player.inventory.length === 0 && (
             <div className="text-gray-600 text-center mt-10 italic">货舱为空。</div>
          )}

          {/* INVENTORY TOOLTIP */}
          {hoverItem && hoverItem.source === 'INVENTORY' && (
              <div className="absolute top-16 left-4 right-4">
                  {renderItemTooltip(hoverItem.item)}
              </div>
          )}
        </div>
      </div>

       {/* ITEM DETAIL MODAL (Click version) */}
       {previewItem && (
          <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setPreviewItem(null)}>
              <div 
                className="bg-gray-900 border border-cyan-500 p-8 max-w-lg w-full shadow-2xl relative"
                onClick={(e) => e.stopPropagation()}
              >
                  <button onClick={() => setPreviewItem(null)} className="absolute top-2 right-2 text-gray-500 hover:text-white">✕</button>
                  
                  <div className="flex items-center gap-4 mb-6 border-b border-gray-700 pb-4">
                      <div className="text-5xl">{previewItem.icon}</div>
                      <div>
                          <div className="text-2xl font-bold text-white">{previewItem.name}</div>
                          <div className="text-cyan-400 text-sm uppercase tracking-wider">{previewItem.rarity} - Meta {previewItem.metaLevel}</div>
                      </div>
                  </div>

                  <p className="text-gray-300 italic mb-6">{previewItem.description}</p>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-6 bg-black/40 p-4 rounded">
                        {/* New Type Info in Modal */}
                        {previewItem.weaponType && <div className="flex justify-between col-span-2 border-b border-gray-700 pb-2"><span>武器类型</span> <span className="text-cyan-300">{previewItem.weaponType}</span></div>}

                        {previewItem.damage && <div className="flex justify-between"><span>伤害</span> <span className={`${getDamageTypeColor(previewItem.damageType)} font-bold`}>{previewItem.damage} {previewItem.damageType}</span></div>}
                        {previewItem.rateOfFire && <div className="flex justify-between"><span>射击速度</span> <span className="text-white">{previewItem.rateOfFire}s</span></div>}
                        {previewItem.range && <div className="flex justify-between"><span>最佳射程</span> <span className="text-white">{previewItem.range}m</span></div>}
                        {previewItem.tracking && <div className="flex justify-between"><span>追踪速度</span> <span className="text-white">{previewItem.tracking}</span></div>}
                        {previewItem.ammoCapacity && <div className="flex justify-between"><span>弹药容量</span> <span className="text-yellow-400">{previewItem.ammoCapacity}</span></div>}
                        {previewItem.reloadTime && <div className="flex justify-between"><span>装填时间</span> <span className="text-white">{previewItem.reloadTime}s</span></div>}
                        
                        {/* Active Stats */}
                        {previewItem.repairShield && <div className="flex justify-between"><span>护盾维修</span> <span className="text-blue-400">+{previewItem.repairShield}</span></div>}
                        {previewItem.repairArmor && <div className="flex justify-between"><span>装甲维修</span> <span className="text-yellow-400">+{previewItem.repairArmor}</span></div>}
                        {previewItem.capCost && <div className="flex justify-between"><span>电容消耗</span> <span className="text-yellow-200">-{previewItem.capCost}</span></div>}
                        {previewItem.activationTime && <div className="flex justify-between"><span>循环时间</span> <span className="text-white">{previewItem.activationTime}s</span></div>}

                        {/* Bonuses */}
                        {previewItem.shieldBonus && <div className="flex justify-between"><span>护盾容量</span> <span className="text-blue-400">+{previewItem.shieldBonus}</span></div>}
                        {previewItem.armorBonus && <div className="flex justify-between"><span>装甲容量</span> <span className="text-yellow-600">+{previewItem.armorBonus}</span></div>}
                        {previewItem.hullBonus && <div className="flex justify-between"><span>结构容量</span> <span className="text-red-600">+{previewItem.hullBonus}</span></div>}
                        {previewItem.speedBonus && <div className="flex justify-between"><span>速度加成</span> <span className="text-white">{previewItem.speedBonus}</span></div>}
                        {previewItem.cpuBonus && <div className="flex justify-between"><span>CPU 输出</span> <span className="text-cyan-400">+{previewItem.cpuBonus}</span></div>}
                        {previewItem.pgBonus && <div className="flex justify-between"><span>栅格输出</span> <span className="text-amber-400">+{previewItem.pgBonus}</span></div>}
                  </div>

                  <div className="flex flex-col text-xs text-gray-500 border-t border-gray-700 pt-4">
                      <span>装配 CPU需求: <span className={previewItem.cpu > 0 ? "text-cyan-500" : "text-gray-600"}>{previewItem.cpu}</span></span>
                      <span>装配 栅格需求: <span className={previewItem.pg > 0 ? "text-amber-500" : "text-gray-600"}>{previewItem.pg}</span></span>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
