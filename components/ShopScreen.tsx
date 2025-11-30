
import React, { useState } from 'react';
import { PlayerState, Item, ShipClass, DamageType } from '../types';
import { ITEM_POOL, SHIP_UPGRADE_COSTS } from '../constants';

interface ShopScreenProps {
  player: PlayerState;
  onPurchase: (item: Item) => void;
  onUpgradeShip: (newClass: ShipClass, costMaterials: number, costCredits: number) => void;
  onLeave: () => void;
}

export const ShopScreen: React.FC<ShopScreenProps> = ({ player, onPurchase, onUpgradeShip, onLeave }) => {
  const [tab, setTab] = useState<'MARKET' | 'SHIPYARD'>('MARKET');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [hoverItem, setHoverItem] = useState<Item | null>(null);
  
  const shopItems = ITEM_POOL;

  const handleUpgrade = (targetClass: ShipClass) => {
    const cost = SHIP_UPGRADE_COSTS[targetClass];
    if (player.credits >= cost.credits && player.materials >= cost.materials) {
      onUpgradeShip(targetClass, cost.materials, cost.credits);
    } else {
      alert("资金或材料不足！");
    }
  };

  const getNextClass = (current: ShipClass): ShipClass | null => {
    if (current === ShipClass.FRIGATE) return ShipClass.DESTROYER;
    if (current === ShipClass.DESTROYER) return ShipClass.CRUISER;
    return null;
  };

  const getMetaBadge = (item: Item) => {
      if (item.metaLevel === 0) return null;
      if (item.metaLevel >= 1 && item.metaLevel < 5) return <div className="absolute top-2 right-2 bg-gray-700 text-[10px] text-white px-1 leading-none rounded-sm">M{item.metaLevel}</div>;
      if (item.metaLevel === 5) return <div className="absolute top-2 right-2 bg-orange-600 text-[10px] text-black font-bold px-1 leading-none rounded-sm">T2</div>;
      if (item.metaLevel >= 6) return <div className="absolute top-2 right-2 bg-green-600 text-[10px] text-white font-bold px-1 leading-none rounded-sm">F</div>;
      return null;
  };

  const getItemBorder = (item: Item) => {
      if (item.metaLevel === 5) return 'border-orange-500 hover:border-orange-300';
      if (item.metaLevel >= 6) return 'border-green-600 hover:border-green-400';
      return 'border-gray-700 hover:border-yellow-500';
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

  const renderItemTooltip = (item: Item) => (
      <div className="fixed bottom-20 right-8 bg-gray-900 border border-yellow-600 p-4 shadow-2xl z-50 pointer-events-none w-72 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 mb-2 border-b border-gray-700 pb-2">
              <span className="text-3xl">{item.icon}</span>
              <div className="overflow-hidden">
                <div className="text-sm font-bold text-white truncate">{item.name}</div>
                <div className="text-[10px] text-yellow-400 uppercase">Meta {item.metaLevel} - {item.rarity}</div>
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
             
             {/* Active Stats */}
             {item.repairShield && <div className="flex justify-between"><span>护盾维修</span> <span className="text-blue-400">+{item.repairShield}</span></div>}
             {item.repairArmor && <div className="flex justify-between"><span>装甲维修</span> <span className="text-yellow-400">+{item.repairArmor}</span></div>}
             {item.capCost && <div className="flex justify-between"><span>电容消耗</span> <span className="text-yellow-200">-{item.capCost}</span></div>}
             
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

  const nextClass = getNextClass(player.shipClass);
  const upgradeCost = nextClass ? SHIP_UPGRADE_COSTS[nextClass] : null;

  return (
    <div className="w-full h-full bg-slate-950 text-gray-200 flex flex-col items-center p-8 relative">
      <div className="max-w-6xl w-full h-full border border-yellow-700 bg-black/80 flex flex-col relative shadow-2xl">
        
        {/* Header */}
        <div className="h-20 border-b border-yellow-700 bg-yellow-900/20 flex items-center justify-between px-8">
           <h1 className="text-3xl font-bold text-yellow-500 tracking-widest uppercase">星际贸易中心</h1>
           <div className="flex gap-6 font-mono text-sm">
             <div className="text-yellow-400">信用点: {player.credits}</div>
             <div className="text-gray-400">材料: {player.materials}</div>
           </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
           <button 
             onClick={() => setTab('MARKET')} 
             className={`flex-1 py-4 font-bold uppercase tracking-wider hover:bg-yellow-900/10 transition-colors ${tab === 'MARKET' ? 'bg-yellow-900/30 text-yellow-200' : 'text-gray-500'}`}
           >
             市场
           </button>
           <button 
             onClick={() => setTab('SHIPYARD')}
             className={`flex-1 py-4 font-bold uppercase tracking-wider hover:bg-yellow-900/10 transition-colors ${tab === 'SHIPYARD' ? 'bg-yellow-900/30 text-yellow-200' : 'text-gray-500'}`}
           >
             船坞
           </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
           {tab === 'MARKET' && (
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {shopItems.map((item, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setSelectedItem(item)}
                    onMouseEnter={() => setHoverItem(item)}
                    onMouseLeave={() => setHoverItem(null)}
                    className={`border bg-gray-900 p-4 flex flex-col group transition-colors relative cursor-pointer ${getItemBorder(item)}`}
                  >
                     {getMetaBadge(item)}
                     <div className="text-4xl mb-2 text-center transform group-hover:scale-110 transition-transform">{item.icon}</div>
                     <div className="font-bold text-white text-center mb-1">{item.name}</div>
                     <div className="text-xs text-gray-400 text-center mb-4 h-8 overflow-hidden">{item.description}</div>
                     
                     <div className="mt-auto pt-4 border-t border-gray-800 flex justify-between items-center">
                        <span className="text-yellow-500 font-mono">{item.price} Cr</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (player.credits >= item.price) onPurchase(item);
                            else alert("信用点不足");
                          }}
                          className="px-3 py-1 bg-gray-800 hover:bg-yellow-600 text-xs uppercase font-bold rounded"
                        >
                          购买
                        </button>
                     </div>
                  </div>
                ))}
             </div>
           )}

           {tab === 'SHIPYARD' && (
             <div className="flex flex-col items-center justify-center h-full">
                <div className="flex items-center gap-8 mb-12">
                   <div className="text-center">
                      <div className="text-6xl mb-4 text-gray-500">🚀</div>
                      <div className="text-xl font-bold text-gray-400">{player.shipClass}</div>
                      <div className="text-sm text-gray-600">当前船体</div>
                   </div>
                   
                   <div className="text-4xl text-gray-600">→</div>
                   
                   <div className="text-center relative">
                      {nextClass ? (
                        <>
                          <div className="text-6xl mb-4 text-cyan-500 animate-pulse">🛸</div>
                          <div className="text-xl font-bold text-cyan-400">{nextClass}</div>
                          <div className="text-sm text-gray-400">下一代舰船</div>
                        </>
                      ) : (
                        <div className="text-gray-500 italic">已达最高级别</div>
                      )}
                   </div>
                </div>

                {nextClass && upgradeCost && (
                  <div className="bg-gray-900 border border-gray-700 p-8 rounded-lg flex flex-col items-center">
                     <h3 className="text-lg font-bold text-white mb-6 uppercase">改装需求</h3>
                     <div className="grid grid-cols-2 gap-8 w-full mb-8">
                        <div className="flex flex-col items-center">
                           <span className="text-sm text-gray-500 uppercase">材料</span>
                           <span className={`text-2xl font-mono ${player.materials >= upgradeCost.materials ? 'text-green-400' : 'text-red-500'}`}>
                             {player.materials} / {upgradeCost.materials}
                           </span>
                        </div>
                        <div className="flex flex-col items-center">
                           <span className="text-sm text-gray-500 uppercase">信用点</span>
                           <span className={`text-2xl font-mono ${player.credits >= upgradeCost.credits ? 'text-green-400' : 'text-red-500'}`}>
                             {player.credits} / {upgradeCost.credits}
                           </span>
                        </div>
                     </div>
                     <button 
                       onClick={() => handleUpgrade(nextClass)}
                       className="w-full py-4 bg-cyan-700 hover:bg-cyan-600 text-white font-bold uppercase tracking-widest rounded shadow-lg transition-transform active:scale-95"
                     >
                       开始改装升级
                     </button>
                  </div>
                )}
             </div>
           )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 flex justify-end">
           <button onClick={onLeave} className="px-6 py-2 bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-800 rounded uppercase font-bold text-sm">
             离港
           </button>
        </div>

        {/* HOVER TOOLTIP */}
        {hoverItem && renderItemTooltip(hoverItem)}

      </div>

      {/* ITEM DETAIL MODAL */}
      {selectedItem && (
          <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setSelectedItem(null)}>
              <div 
                className="bg-gray-900 border border-cyan-500 p-8 max-w-lg w-full shadow-2xl relative"
                onClick={(e) => e.stopPropagation()}
              >
                  <button onClick={() => setSelectedItem(null)} className="absolute top-2 right-2 text-gray-500 hover:text-white">✕</button>
                  
                  <div className="flex items-center gap-4 mb-6 border-b border-gray-700 pb-4">
                      <div className="text-5xl">{selectedItem.icon}</div>
                      <div>
                          <div className="text-2xl font-bold text-white">{selectedItem.name}</div>
                          <div className="text-cyan-400 text-sm uppercase tracking-wider">{selectedItem.rarity} - Meta {selectedItem.metaLevel}</div>
                      </div>
                  </div>

                  <p className="text-gray-300 italic mb-6">{selectedItem.description}</p>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-6 bg-black/40 p-4 rounded">
                        {/* New Type Info in Modal */}
                        {selectedItem.weaponType && <div className="flex justify-between col-span-2 border-b border-gray-700 pb-2"><span>武器类型</span> <span className="text-cyan-300">{selectedItem.weaponType}</span></div>}

                        {selectedItem.damage && <div className="flex justify-between"><span>伤害</span> <span className={`${getDamageTypeColor(selectedItem.damageType)} font-bold`}>{selectedItem.damage} {selectedItem.damageType}</span></div>}
                        {selectedItem.rateOfFire && <div className="flex justify-between"><span>射击速度</span> <span className="text-white">{selectedItem.rateOfFire}s</span></div>}
                        {selectedItem.range && <div className="flex justify-between"><span>最佳射程</span> <span className="text-white">{selectedItem.range}m</span></div>}
                        {selectedItem.tracking && <div className="flex justify-between"><span>追踪速度</span> <span className="text-white">{selectedItem.tracking}</span></div>}
                        {selectedItem.ammoCapacity && <div className="flex justify-between"><span>弹药容量</span> <span className="text-yellow-400">{selectedItem.ammoCapacity}</span></div>}
                        {selectedItem.reloadTime && <div className="flex justify-between"><span>装填时间</span> <span className="text-white">{selectedItem.reloadTime}s</span></div>}
                        
                        {/* Active Stats */}
                        {selectedItem.repairShield && <div className="flex justify-between"><span>护盾维修</span> <span className="text-blue-400">+{selectedItem.repairShield}</span></div>}
                        {selectedItem.repairArmor && <div className="flex justify-between"><span>装甲维修</span> <span className="text-yellow-400">+{selectedItem.repairArmor}</span></div>}
                        {selectedItem.capCost && <div className="flex justify-between"><span>电容消耗</span> <span className="text-yellow-200">-{selectedItem.capCost}</span></div>}

                        {/* Bonuses */}
                        {selectedItem.shieldBonus && <div className="flex justify-between"><span>护盾容量</span> <span className="text-blue-400">+{selectedItem.shieldBonus}</span></div>}
                        {selectedItem.armorBonus && <div className="flex justify-between"><span>装甲容量</span> <span className="text-yellow-600">+{selectedItem.armorBonus}</span></div>}
                        {selectedItem.hullBonus && <div className="flex justify-between"><span>结构容量</span> <span className="text-red-600">+{selectedItem.hullBonus}</span></div>}
                        {selectedItem.speedBonus && <div className="flex justify-between"><span>速度加成</span> <span className="text-white">{selectedItem.speedBonus}</span></div>}
                        {selectedItem.cpuBonus && <div className="flex justify-between"><span>CPU 输出</span> <span className="text-cyan-400">+{selectedItem.cpuBonus}</span></div>}
                        {selectedItem.pgBonus && <div className="flex justify-between"><span>栅格输出</span> <span className="text-amber-400">+{selectedItem.pgBonus}</span></div>}
                  </div>

                  <div className="flex justify-between items-center border-t border-gray-700 pt-4">
                      <div className="flex flex-col text-xs text-gray-500">
                          <span>装配 CPU: <span className={selectedItem.cpu > 0 ? "text-cyan-500" : "text-gray-600"}>{selectedItem.cpu}</span></span>
                          <span>装配 栅格: <span className={selectedItem.pg > 0 ? "text-amber-500" : "text-gray-600"}>{selectedItem.pg}</span></span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xl text-yellow-500 font-bold">{selectedItem.price} Cr</span>
                        <button 
                            onClick={() => {
                                if (player.credits >= selectedItem.price) {
                                    onPurchase(selectedItem);
                                    setSelectedItem(null);
                                }
                                else alert("信用点不足");
                            }}
                            className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-black font-bold uppercase rounded shadow-lg"
                        >
                            购买
                        </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
