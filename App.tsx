
import React, { useState } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { FittingScreen } from './components/FittingScreen';
import { MapScreen } from './components/MapScreen';
import { ShopScreen } from './components/ShopScreen';
import { generateMysteryEvent } from './services/geminiService';
import { 
  PlayerState, ShipClass, Item, NodeType, 
  GameEvent, Relic, RelicRarity, SlotType
} from './types';
import { INITIAL_ITEMS, ITEM_POOL, RELIC_POOL, LEVEL_UP_XP_BASE, XP_SCALING, BASE_SHIPS } from './constants';

// --- INITIAL STATE ---
const INITIAL_PLAYER: PlayerState = {
  shipName: '漂流者 Mk.I',
  shipClass: ShipClass.FRIGATE,
  stats: {
    hp: { shield: 150, armor: 100, hull: 100 },
    maxHp: { shield: 150, armor: 100, hull: 100 },
    resistances: { 
      shield: { EM: 0, Thermal: 20, Kinetic: 40, Explosive: 50 },
      armor: { EM: 50, Thermal: 35, Kinetic: 25, Explosive: 10 },
      hull: { EM: 33, Thermal: 33, Kinetic: 33, Explosive: 33 }
    },
    cap: { current: 100, max: 100, recharge: 1 },
    fitting: { cpu: 180, pg: 45 },
    speed: 3.5,
    slots: { high: 2, mid: 2, low: 2 }
  },
  modules: [INITIAL_ITEMS[0]], 
  inventory: [INITIAL_ITEMS[1], INITIAL_ITEMS[2]], 
  relics: [],
  credits: 100,
  materials: 0,
  level: 1,
  xp: 0,
  xpToNextLevel: LEVEL_UP_XP_BASE,
};

const generateMap = (depth: number = 10): any[][] => {
  const map = [];
  for (let i = 0; i < depth; i++) {
    const row = [];
    const width = 3 + Math.floor(Math.random() * 2);
    for (let j = 0; j < width; j++) {
      let type = NodeType.COMBAT;
      if (i === 0) type = NodeType.START;
      else if (i === depth - 1) type = NodeType.BOSS;
      else if (i % 3 === 0) type = NodeType.SHOP;
      else {
        const rand = Math.random();
        if (rand < 0.25) type = NodeType.EVENT;
        else if (rand < 0.4) type = NodeType.ELITE;
        else if (rand < 0.5) type = NodeType.REST;
      }
      
      row.push({
        id: `node-${i}-${j}`,
        type,
        row: i,
        col: j,
        completed: false,
        active: i === 0,
        parents: [] 
      });
    }
    map.push(row);
  }
  return map;
};

const App: React.FC = () => {
  const [view, setView] = useState<'START' | 'MAP' | 'GAME' | 'FITTING' | 'EVENT' | 'SHOP' | 'GAME_OVER'>('START');
  const [player, setPlayer] = useState<PlayerState>(INITIAL_PLAYER);
  const [map, setMap] = useState(generateMap());
  const [currentTier, setCurrentTier] = useState(0);
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
  
  // Event Outcome State
  const [showEventOutcome, setShowEventOutcome] = useState(false);
  const [eventOutcomeData, setEventOutcomeData] = useState<{description?: string, reward?: string}>({});

  const [currentNodeType, setCurrentNodeType] = useState<NodeType>(NodeType.START);
  
  // Level Up / Relic State
  const [levelUpOptions, setLevelUpOptions] = useState<Item[]>([]);
  const [relicOptions, setRelicOptions] = useState<Relic[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showRelicSelect, setShowRelicSelect] = useState(false);
  const [hoverLevelUpItem, setHoverLevelUpItem] = useState<Item | null>(null);
  
  const [eventLoading, setEventLoading] = useState(false);
  const [gamePaused, setGamePaused] = useState(false);

  // --- HELPERS ---

  // Helper to recalculate max stats (HP, Cap, Fitting) based on ship class + modules
  const recalculatePlayerStats = (p: PlayerState): PlayerState => {
      const base = BASE_SHIPS[p.shipClass];
      
      // Defaults
      let maxShield = base.maxHp?.shield || 100;
      let maxArmor = base.maxHp?.armor || 100;
      let maxHull = base.maxHp?.hull || 100;
      let maxCap = base.cap?.max || 100;
      let maxCpu = base.fitting?.cpu || 100;
      let maxPg = base.fitting?.pg || 100;
      let speed = base.speed || 1;

      // Apply Modules
      p.modules.forEach(m => {
          if (m.shieldBonus) maxShield += m.shieldBonus;
          if (m.armorBonus) maxArmor += m.armorBonus;
          if (m.hullBonus) maxHull += m.hullBonus;
          if (m.cpuBonus) maxCpu += m.cpuBonus;
          if (m.pgBonus) maxPg += m.pgBonus;
          if (m.speedBonus) speed += m.speedBonus;
      });

      return {
          ...p,
          stats: {
              ...p.stats,
              maxHp: { shield: maxShield, armor: maxArmor, hull: maxHull },
              cap: { ...p.stats.cap, max: maxCap }, // base cap currently static in constant but logic here allows expansion
              fitting: { cpu: maxCpu, pg: maxPg },
              speed: speed,
              // Update slots based on hull
              slots: base.slots as any
          }
      };
  };

  const advanceTier = (currentMap: any[][], currentT: number, nodeCompleted: boolean) => {
    const newMap = currentMap.map(row => row.map(node => ({ ...node })));
    newMap[currentT].forEach(n => {
        if (n.active && nodeCompleted) n.completed = true;
        n.active = false; 
    });

    let nextT = currentT;
    if (currentT < newMap.length - 1) {
        nextT = currentT + 1;
        newMap[nextT].forEach(n => n.active = true); 
    } else {
        alert("扇区已肃清！跃迁引擎启动中...");
        const resetMap = generateMap();
        setMap(resetMap);
        setCurrentTier(0);
        setView('MAP');
        return;
    }

    setMap(newMap);
    setCurrentTier(nextT);
    setView('MAP');
  };

  const getRelicBorder = (rarity: RelicRarity) => {
      switch(rarity) {
          case RelicRarity.COMMON: return 'border-gray-500 hover:border-white';
          case RelicRarity.RARE: return 'border-blue-500 bg-blue-900/10 hover:border-blue-300';
          case RelicRarity.EPIC: return 'border-purple-500 bg-purple-900/10 hover:border-purple-300';
          case RelicRarity.LEGENDARY: return 'border-yellow-500 bg-yellow-900/10 hover:border-yellow-300';
          default: return 'border-gray-500';
      }
  };

  const renderTooltip = (item: Item) => (
      <div className="absolute top-0 right-0 translate-x-full bg-gray-900 border border-purple-500 p-4 shadow-2xl z-[60] pointer-events-none w-64 ml-4">
          <div className="flex items-center gap-2 mb-2 border-b border-gray-700 pb-2">
              <span className="text-2xl">{item.icon}</span>
              <div className="overflow-hidden">
                <div className="text-sm font-bold text-white truncate">{item.name}</div>
                <div className="text-[10px] text-purple-400 uppercase">Meta {item.metaLevel}</div>
              </div>
          </div>
          
          <div className="space-y-1 text-xs text-gray-300">
             {item.weaponType && <div className="flex justify-between col-span-2 border-b border-gray-700 pb-2"><span>类型</span> <span className="text-cyan-300">{item.weaponType}</span></div>}
             {item.damage && <div className="flex justify-between"><span>伤害</span> <span className="text-red-400">{item.damage} ({item.damageType})</span></div>}
             {item.range && <div className="flex justify-between"><span>射程</span> <span>{item.range}m</span></div>}
             {item.rateOfFire && <div className="flex justify-between"><span>射速</span> <span>{item.rateOfFire}s</span></div>}
             {item.tracking && <div className="flex justify-between"><span>追踪</span> <span>{item.tracking}</span></div>}
             
             {item.repairShield && <div className="flex justify-between"><span>护盾维修</span> <span className="text-blue-400">+{item.repairShield}</span></div>}
             {item.repairArmor && <div className="flex justify-between"><span>装甲维修</span> <span className="text-yellow-400">+{item.repairArmor}</span></div>}
             {item.capCost && <div className="flex justify-between"><span>电容消耗</span> <span className="text-yellow-200">-{item.capCost}</span></div>}

             {item.shieldBonus && <div className="flex justify-between"><span>护盾加成</span> <span className="text-blue-400">+{item.shieldBonus}</span></div>}
             {item.armorBonus && <div className="flex justify-between"><span>装甲加成</span> <span className="text-yellow-400">+{item.armorBonus}</span></div>}
             {item.hullBonus && <div className="flex justify-between"><span>结构加成</span> <span className="text-red-400">+{item.hullBonus}</span></div>}
             {item.speedBonus && <div className="flex justify-between"><span>速度加成</span> <span className="text-white">+{item.speedBonus}</span></div>}
             {item.ammoCapacity && <div className="flex justify-between"><span>弹药</span> <span className="text-yellow-400">{item.ammoCapacity}</span></div>}
             
             <div className="flex justify-between pt-2 border-t border-gray-800 mt-2 text-gray-500">
                 <span>CPU: {item.cpu}</span>
                 <span>PG: {item.pg}</span>
             </div>
          </div>
      </div>
  );

  // --- GAMEPLAY HANDLERS ---

  const handleLevelUp = (currentRunXp: number) => {
    setGamePaused(true);
    const options = [];
    for(let i=0; i<3; i++) {
        options.push(ITEM_POOL[Math.floor(Math.random() * ITEM_POOL.length)]);
    }
    setLevelUpOptions(options);
    setShowLevelUp(true);
  };

  const applyLevelUp = (chosenItem: Item) => {
    setPlayer(prev => ({
      ...prev,
      level: prev.level + 1,
      xp: 0, 
      xpToNextLevel: Math.floor(prev.xpToNextLevel * XP_SCALING),
      inventory: [...prev.inventory, chosenItem]
    }));
    setShowLevelUp(false);
    setHoverLevelUpItem(null);
    setGamePaused(false);
  };

  const applyRelic = (chosenRelic: Relic) => {
      setPlayer(prev => ({
          ...prev,
          relics: [...prev.relics, chosenRelic]
      }));
      setShowRelicSelect(false);
      // Advance after relic chosen (Elite complete)
      advanceTier(map, currentTier, true);
  };

  const handleCombatComplete = (
      loot: { credits: number, materials: number, xp: number }, 
      finalState: { hp: {shield: number, armor: number, hull: number}, cap: number }
  ) => {
    setPlayer(prev => {
        return {
            ...prev,
            credits: prev.credits + loot.credits,
            materials: prev.materials + loot.materials,
            xp: prev.xp + loot.xp, 
            stats: { 
                ...prev.stats, 
                hp: finalState.hp,
                cap: { ...prev.stats.cap, current: finalState.cap }
            }
        };
    });
    
    setGamePaused(false);

    if (currentNodeType === NodeType.ELITE || currentNodeType === NodeType.BOSS) {
        // Boss also drops Relic for now, or maybe game clear?
        const options = [];
        for(let i=0; i<3; i++) {
            options.push(RELIC_POOL[Math.floor(Math.random() * RELIC_POOL.length)]);
        }
        setRelicOptions(options);
        setShowRelicSelect(true);
    } else {
        advanceTier(map, currentTier, true);
    }
  };

  const handleNodeSelect = async (node: any) => {
    if (!node.active) return;
    setCurrentNodeType(node.type);
    
    if (node.type === NodeType.COMBAT || node.type === NodeType.ELITE || node.type === NodeType.BOSS || node.type === NodeType.START) {
      setGamePaused(false);
      setView('GAME');
    } else if (node.type === NodeType.EVENT) {
      setEventLoading(true);
      setShowEventOutcome(false); // Reset outcome state
      setView('EVENT');
      const evt = await generateMysteryEvent(currentTier + 1);
      setCurrentEvent(evt);
      setEventLoading(false);
    } else if (node.type === NodeType.SHOP) {
        setView('SHOP');
    } else if (node.type === NodeType.REST) {
       setPlayer(prev => {
            // Need to make sure maxHp is up to date before healing
            const recalculated = recalculatePlayerStats(prev);
            return {
                ...recalculated,
                stats: { ...recalculated.stats, hp: { ...recalculated.stats.maxHp } }
            };
       });
        alert("船员已休整，系统修复完毕。");
        advanceTier(map, currentTier, true);
    }
  };

  const handleEventChoice = (choice: any) => {
      let rewardText = "";
      if (choice.reward) {
          const parts = [];
          if (choice.reward.credits) {
              setPlayer(p => ({...p, credits: p.credits + choice.reward.credits}));
              parts.push(`${choice.reward.credits} 信用点`);
          }
          if (choice.reward.materials) {
              setPlayer(p => ({...p, materials: p.materials + choice.reward.materials}));
              parts.push(`${choice.reward.materials} 材料`);
          }
          if (choice.reward.repair) {
              setPlayer(p => {
                  const r = recalculatePlayerStats(p);
                  return {...r, stats: {...r.stats, hp: r.stats.maxHp}};
              });
              parts.push("全面修复");
          }
          if (choice.reward.damage) {
              setPlayer(p => ({...p, stats: {...p.stats, hp: {...p.stats.hp, hull: Math.max(1, p.stats.hp.hull - choice.reward.damage)}}}));
              parts.push(`受到 ${choice.reward.damage} 点结构伤害`);
          }
          rewardText = parts.length > 0 ? `获得: ${parts.join(', ')}` : "";
      }
      
      setEventOutcomeData({
          description: choice.outcomeDescription || "事件结束。",
          reward: rewardText
      });
      setShowEventOutcome(true);
  };

  const handleEventLeave = () => {
      setShowEventOutcome(false);
      advanceTier(map, currentTier, true);
  };

  // --- RENDERERS ---

  if (view === 'START') {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center text-white">
        <h1 className="text-6xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">虚空漂流者 (VOID DRIFTER)</h1>
        <p className="text-gray-400 mb-8 max-w-md text-center">
            在0.0星区求生。管理你的电容和装配，在敌群中存活下来。
        </p>
        <button 
          onClick={() => setView('MAP')}
          className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded shadow-[0_0_20px_rgba(8,145,178,0.5)] transition-all cursor-pointer"
        >
          初始化序列
        </button>
      </div>
    );
  }

  if (view === 'SHOP') {
      return (
          <ShopScreen 
            player={player}
            onPurchase={(item) => {
                setPlayer(p => ({ ...p, credits: p.credits - item.price, inventory: [...p.inventory, item] }));
            }}
            onUpgradeShip={(newClass, matCost, creditCost) => {
                setPlayer(p => {
                    const next = { 
                        ...p, 
                        shipClass: newClass, 
                        materials: p.materials - matCost, 
                        credits: p.credits - creditCost 
                    };
                    return recalculatePlayerStats(next);
                });
            }}
            onLeave={() => {
                advanceTier(map, currentTier, true);
            }}
          />
      );
  }

  if (view === 'EVENT') {
      return (
          <div className="w-full h-screen bg-black text-white flex items-center justify-center p-4">
              {eventLoading || !currentEvent ? (
                  <div className="animate-pulse text-cyan-500 font-mono text-xl">正在解码信号...</div>
              ) : (
                  <div className="max-w-2xl w-full bg-gray-900 border border-cyan-800 p-8 shadow-2xl relative">
                      {/* Decorative Header */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500 shadow-[0_0_10px_#06b6d4]"></div>
                      
                      {!showEventOutcome ? (
                          <>
                            <h2 className="text-3xl font-bold text-cyan-400 mb-4">{currentEvent.title}</h2>
                            <p className="text-gray-300 mb-8 leading-relaxed text-lg border-l-4 border-gray-700 pl-4">
                                {currentEvent.description}
                            </p>
                            
                            <div className="space-y-4">
                                {currentEvent.choices.map((choice, idx) => (
                                    <button 
                                      key={idx}
                                      onClick={() => handleEventChoice(choice)}
                                      className="w-full text-left p-4 border border-gray-700 bg-gray-800/50 hover:bg-gray-800 hover:border-cyan-500 transition-all cursor-pointer group"
                                    >
                                        <div className="font-bold text-white mb-1 group-hover:text-cyan-300">► {choice.text}</div>
                                    </button>
                                ))}
                            </div>
                          </>
                      ) : (
                          <div className="animate-in fade-in duration-500">
                              <h2 className="text-2xl font-bold text-green-400 mb-6 tracking-widest uppercase">传输日志</h2>
                              <p className="text-gray-200 text-lg mb-6">{eventOutcomeData.description}</p>
                              {eventOutcomeData.reward && (
                                  <div className="p-4 bg-green-900/20 border border-green-700 text-green-300 font-mono mb-8">
                                      {eventOutcomeData.reward}
                                  </div>
                              )}
                              <button 
                                onClick={handleEventLeave}
                                className="w-full py-3 bg-cyan-700 hover:bg-cyan-600 text-white font-bold uppercase tracking-wider"
                              >
                                  离开扇区
                              </button>
                          </div>
                      )}
                  </div>
              )}
          </div>
      );
  }

  return (
    <div className="w-full h-screen overflow-hidden font-sans relative">
      {/* Persistent Top Bar (Except in Game) */}
      {view !== 'GAME' && (
        <div className="absolute top-0 left-0 w-full h-16 bg-gray-900 border-b border-gray-800 z-40 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
                <div className="text-xl font-bold text-cyan-500">{player.shipName}</div>
                <div className="text-xs text-gray-500 bg-black px-2 py-1 rounded border border-gray-800">{player.shipClass}</div>
            </div>
            <div className="flex gap-6 text-sm font-mono">
                <div className="text-gray-400">材料: {player.materials}</div>
                <div className="text-yellow-500">信用点: {player.credits}</div>
                <div className="text-blue-400">等级: {player.level}</div>
                <button 
                  onClick={() => setView(view === 'FITTING' ? 'MAP' : 'FITTING')}
                  className="px-4 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-white cursor-pointer"
                >
                    {view === 'FITTING' ? '关闭装配' : '装配界面'}
                </button>
            </div>
        </div>
      )}

      {view === 'MAP' && (
          <div className="pt-16 h-full">
              <MapScreen 
                currentTier={currentTier}
                mapData={map}
                onNodeSelect={handleNodeSelect}
              />
          </div>
      )}

      {view === 'FITTING' && (
          <FittingScreen 
            player={player}
            onClose={() => setView('MAP')}
            onEquip={(item) => {
                setPlayer(p => {
                    const next = {
                        ...p,
                        inventory: p.inventory.filter(i => i !== item),
                        modules: [...p.modules, item]
                    };
                    return recalculatePlayerStats(next);
                });
            }}
            onUnequip={(item) => {
                 setPlayer(p => {
                    const next = {
                        ...p,
                        modules: p.modules.filter(m => m !== item),
                        inventory: [...p.inventory, item]
                    };
                    return recalculatePlayerStats(next);
                });
            }}
          />
      )}

      {/* GAME VIEW + OVERLAYS */}
      {view === 'GAME' && (
        <div className="relative w-full h-full">
            <GameCanvas 
               playerState={player} 
               gameActive={!gamePaused && !showRelicSelect}
               nodeType={currentNodeType}
               onComplete={handleCombatComplete}
               onDeath={() => {
                   alert("结构完整性归零。舰船损毁。");
                   setView('START');
                   setPlayer(INITIAL_PLAYER);
                   setMap(generateMap());
                   setCurrentTier(0);
               }}
               onLevelUp={handleLevelUp}
            />

            {/* LEVEL UP OVERLAY */}
            {showLevelUp && (
                <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center">
                    <div className="bg-gray-900 border border-purple-500 p-8 max-w-4xl w-full shadow-[0_0_50px_rgba(168,85,247,0.3)]">
                        <h2 className="text-3xl text-purple-400 font-bold mb-6 text-center tracking-widest">系统升级可用</h2>
                        <div className="grid grid-cols-3 gap-4 relative">
                            {levelUpOptions.map((item, idx) => (
                                <div 
                                  key={idx} 
                                  onClick={() => applyLevelUp(item)}
                                  onMouseEnter={() => setHoverLevelUpItem(item)}
                                  onMouseLeave={() => setHoverLevelUpItem(null)}
                                  className="border border-gray-700 bg-gray-800 p-6 hover:border-purple-400 hover:bg-gray-700 cursor-pointer transition-all group flex flex-col items-center relative"
                                >
                                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{item.icon}</div>
                                    <h3 className="font-bold text-white text-lg mb-2 text-center">{item.name}</h3>
                                    <p className="text-gray-400 text-sm mb-4 text-center leading-relaxed h-16">{item.description}</p>
                                    
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 w-full border-t border-gray-700 pt-3 mt-auto">
                                        <div className="flex justify-between"><span>CPU</span> <span className="text-white">{item.cpu}</span></div>
                                        <div className="flex justify-between"><span>PG</span> <span className="text-white">{item.pg}</span></div>
                                    </div>

                                    {/* Tooltip embedded for level up options */}
                                    {hoverLevelUpItem === item && renderTooltip(item)}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* RELIC OVERLAY (Elite/Boss Rewards) */}
            {showRelicSelect && (
                 <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center">
                    <div className="bg-gray-900 border border-yellow-600 p-8 max-w-4xl w-full shadow-[0_0_50px_rgba(234,179,8,0.3)]">
                        <h2 className="text-3xl text-yellow-500 font-bold mb-2 text-center tracking-widest">
                            {currentNodeType === NodeType.BOSS ? '已压制敌方旗舰' : '异常空间已确保'}
                        </h2>
                        <p className="text-center text-gray-400 mb-8">从残骸中回收了独特的技术。</p>
                        
                        <div className="grid grid-cols-3 gap-4">
                            {relicOptions.map((relic, idx) => (
                                <div 
                                  key={idx} 
                                  onClick={() => applyRelic(relic)}
                                  className={`border bg-gray-800 p-6 cursor-pointer transition-all group flex flex-col items-center ${getRelicBorder(relic.rarity)}`}
                                >
                                    <div className="text-6xl mb-4 group-hover:rotate-12 transition-transform">{relic.icon}</div>
                                    <h3 className="font-bold text-yellow-100 text-lg mb-2 text-center">{relic.name}</h3>
                                    <div className="text-xs uppercase tracking-widest mb-4 opacity-70">{relic.rarity}</div>
                                    <p className="text-gray-400 text-sm mb-4 text-center leading-relaxed">{relic.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
      )}
      
      {view === 'GAME_OVER' && <div>游戏结束</div>}
    </div>
  );
};

export default App;
