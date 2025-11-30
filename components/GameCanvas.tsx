
import React, { useRef, useEffect } from 'react';
import { PlayerState, SlotType, DamageType, LootType, NodeType, Item } from '../types';

interface GameCanvasProps {
  playerState: PlayerState;
  nodeType: NodeType;
  onComplete: (
      loot: { credits: number; materials: number; xp: number }, 
      finalState: { hp: { shield: number; armor: number; hull: number }, cap: number }
  ) => void;
  onDeath: () => void;
  onLevelUp: (currentXp: number) => void; 
  gameActive: boolean;
}

interface Entity {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
}

interface Player extends Entity {
  vx: number;
  vy: number;
  hp: { shield: number; armor: number; hull: number };
  maxHp: { shield: number; armor: number; hull: number };
  cap: { current: number; max: number; recharge: number };
  rotation: number;
}

enum EnemyType {
  CHASER = 'CHASER',
  SHOOTER = 'SHOOTER',
  BOSS = 'BOSS'
}

interface Enemy extends Entity {
  type: EnemyType;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  // Shooting logic
  reloadTimer?: number;
  attackRange?: number;
  projectileColor?: string;
}

interface Projectile extends Entity {
  vx: number;
  vy: number;
  damage: number;
  duration: number; // frames
  homing?: boolean;
  targetId?: number; // for homing
  owner: 'PLAYER' | 'ENEMY';
}

interface Particle extends Entity {
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  radius: number;
  color: string;
}

interface LootEntity extends Entity {
  type: LootType;
  value: number;
  vx: number;
  vy: number;
  magnetized: boolean;
}

interface WeaponState {
  currentAmmo: number;
  reloadTimer: number; // in frames
}

interface ActiveModuleState {
    cooldownTimer: number; // in frames
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ playerState, nodeType, onComplete, onDeath, onLevelUp, gameActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // --- Refs for Props/State (Prevents re-initialization reset) ---
  const playerStateRef = useRef(playerState);
  const gameActiveRef = useRef(gameActive);
  const onCompleteRef = useRef(onComplete);
  const onDeathRef = useRef(onDeath);
  const onLevelUpRef = useRef(onLevelUp);
  const nodeTypeRef = useRef(nodeType);
  
  const weaponStatesRef = useRef<WeaponState[]>([]);
  const activeModuleStatesRef = useRef<ActiveModuleState[]>([]);

  // We need to keep Derived Stats logic consistent with App.tsx, 
  // but for the game loop we calculate it fresh to ensure physics are correct.
  const getDerivedStats = (state: PlayerState) => {
    let speed = state.stats.speed; // Base speed from ship class
    
    // Recalculate Max HP based on modules (similar to App.tsx but local for loop)
    // Note: In a real app we'd share this function.
    // Here we trust state.stats.maxHp IS correct from App.tsx, but we apply bonuses again just in case?
    // actually, let's rely on passed maxHp if possible, BUT modules like shield extenders need to work.
    // The previous implementation calculated totals from base. Let's stick to that for safety in the loop.
    // However, App.tsx now handles MaxHP calculation. 
    // To be safe, let's use the maxHp passed in props as the baseline, OR re-run logic.
    // Let's re-run logic to be 100% sure we have modifiers applied (like Relics which App might not calc fully for physics)
    
    let maxShield = state.stats.maxHp.shield;
    let maxArmor = state.stats.maxHp.armor;
    let maxHull = state.stats.maxHp.hull;
    let maxCap = state.stats.cap.max;
    let capRecharge = state.stats.cap.recharge;
    
    let magnetMult = 1;
    let dmgMult = 1;
    let shieldRegenMult = 0;
    let fireRateMult = 0;

    // Relics
    state.relics.forEach(relic => {
        if (relic.speedMult) speed *= (1 + relic.speedMult);
        if (relic.lootMagnetMult) magnetMult += relic.lootMagnetMult;
        if (relic.damageMult) dmgMult += relic.damageMult;
        if (relic.shieldRegenMult) shieldRegenMult += relic.shieldRegenMult;
        if (relic.fireRateMult) fireRateMult += relic.fireRateMult;
        if (relic.capRechargeMult) capRecharge *= (1 + relic.capRechargeMult);
    });

    // Modules (Speed is handled in App.tsx usually, but we do it here for physics)
    // We assume state.stats.maxHp ALREADY includes module bonuses if App.tsx did its job.
    // BUT App.tsx might just set base. Let's assume passed maxHp is the "stat sheet" value.
    
    const totalHp = { shield: maxShield, armor: maxArmor, hull: maxHull };
    const weapons = state.modules.filter(m => m.slot === SlotType.HIGH && m.damage);
    const activeModules = state.modules.filter(m => m.activationTime && m.capCost); // Boosters/Reps

    return { 
        speed, totalHp, totalCap: maxCap, capRecharge,
        weapons, activeModules, 
        magnetMult, dmgMult, shieldRegenMult, fireRateMult 
    };
  };

  useEffect(() => { 
    playerStateRef.current = playerState;
    // We can update max values dynamically if props change (e.g. equipping mid-game if we allowed it)
    if (playerRef.current) {
         const derived = getDerivedStats(playerState);
         playerRef.current.maxHp = derived.totalHp;
         playerRef.current.cap.max = derived.totalCap;
         playerRef.current.cap.recharge = derived.capRecharge;
         // Note: We do NOT reset current HP/Cap here, only max.
    }
  }, [playerState]);

  useEffect(() => { gameActiveRef.current = gameActive; }, [gameActive]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onDeathRef.current = onDeath; }, [onDeath]);
  useEffect(() => { onLevelUpRef.current = onLevelUp; }, [onLevelUp]);
  useEffect(() => { nodeTypeRef.current = nodeType; }, [nodeType]);

  const playerRef = useRef<Player>({ 
    id: 0, x: 0, y: 0, vx: 0, vy: 0, radius: 15, color: '#0ea5e9', 
    hp: { shield: 100, armor: 100, hull: 100 }, 
    maxHp: { shield: 100, armor: 100, hull: 100 }, 
    cap: { current: 100, max: 100, recharge: 1 },
    rotation: 0 
  });
  const enemiesRef = useRef<Enemy[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const lootEntitiesRef = useRef<LootEntity[]>([]);
  const keysRef = useRef<Record<string, boolean>>({});
  
  const collectedLootRef = useRef({ credits: 0, materials: 0, xp: 0 });
  const frameRef = useRef<number>(0);
  const killCountRef = useRef<number>(0);
  const bossSpawnedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const initialStats = getDerivedStats(playerStateRef.current);
    
    // INITIALIZATION
    playerRef.current = {
      ...playerRef.current,
      x: canvas.width / 2,
      y: canvas.height / 2,
      hp: { ...playerStateRef.current.stats.hp }, // Start with current HP from state
      maxHp: initialStats.totalHp,
      // CRITICAL FIX: Init cap with current, not max.
      cap: { 
          current: playerStateRef.current.stats.cap.current, 
          max: initialStats.totalCap, 
          recharge: initialStats.capRecharge 
      }
    };
    
    // Clamp initial HP/Cap to max (in case max dropped)
    playerRef.current.hp.shield = Math.min(playerRef.current.hp.shield, playerRef.current.maxHp.shield);
    playerRef.current.hp.armor = Math.min(playerRef.current.hp.armor, playerRef.current.maxHp.armor);
    playerRef.current.hp.hull = Math.min(playerRef.current.hp.hull, playerRef.current.maxHp.hull);
    playerRef.current.cap.current = Math.min(playerRef.current.cap.current, playerRef.current.cap.max);

    enemiesRef.current = [];
    projectilesRef.current = [];
    particlesRef.current = [];
    lootEntitiesRef.current = [];
    collectedLootRef.current = { credits: 0, materials: 0, xp: 0 };
    killCountRef.current = 0;
    frameRef.current = 0;
    bossSpawnedRef.current = false;
    
    // Initialize Weapon States
    weaponStatesRef.current = initialStats.weapons.map(w => ({
        currentAmmo: w.ammoCapacity || 9999,
        reloadTimer: 0
    }));

    // Initialize Active Module States
    activeModuleStatesRef.current = initialStats.activeModules.map(() => ({
        cooldownTimer: 0
    }));

    const handleKeyDown = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animationFrameId: number;
    const IS_BOSS_NODE = nodeTypeRef.current === NodeType.BOSS;
    const TARGET_KILLS = IS_BOSS_NODE ? 1 : 15 + playerStateRef.current.level * 3;

    const loop = () => {
      if (!gameActiveRef.current) {
          animationFrameId = requestAnimationFrame(loop);
          return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      frameRef.current++;
      const currentState = playerStateRef.current;
      const derived = getDerivedStats(currentState);
      const p = playerRef.current;

      // --- 1. PLAYER LOGIC ---
      
      // Passive Shield Regen
      if (frameRef.current % 60 === 0 && p.hp.shield < p.maxHp.shield) {
          const regen = (p.maxHp.shield * (0.01 + derived.shieldRegenMult));
          p.hp.shield = Math.min(p.maxHp.shield, p.hp.shield + regen);
      }

      // Capacitor Regen
      if (frameRef.current % 60 === 0 && p.cap.current < p.cap.max) {
          p.cap.current = Math.min(p.cap.max, p.cap.current + p.cap.recharge);
      }

      // Active Modules (Auto-Activate Logic)
      derived.activeModules.forEach((mod, idx) => {
          if (!activeModuleStatesRef.current[idx]) {
               activeModuleStatesRef.current[idx] = { cooldownTimer: 0 };
          }
          const modState = activeModuleStatesRef.current[idx];
          
          if (modState.cooldownTimer > 0) {
              modState.cooldownTimer--;
              return;
          }

          // Trigger Conditions
          let shouldActivate = false;
          if (mod.repairShield && p.hp.shield < p.maxHp.shield * 0.9) shouldActivate = true;
          if (mod.repairArmor && p.hp.armor < p.maxHp.armor * 0.9) shouldActivate = true;
          if (mod.repairHull && p.hp.hull < p.maxHp.hull * 0.9) shouldActivate = true;
          
          if (shouldActivate && p.cap.current >= (mod.capCost || 0)) {
              // Activate
              p.cap.current -= (mod.capCost || 0);
              
              if (mod.repairShield) p.hp.shield = Math.min(p.maxHp.shield, p.hp.shield + mod.repairShield);
              if (mod.repairArmor) p.hp.armor = Math.min(p.maxHp.armor, p.hp.armor + mod.repairArmor);
              if (mod.repairHull) p.hp.hull = Math.min(p.maxHp.hull, p.hp.hull + mod.repairHull);
              
              modState.cooldownTimer = (mod.activationTime || 5) * 60;

              // Visual Effect for Reps
              particlesRef.current.push({
                  id: Math.random(), x: p.x, y: p.y, vx: 0, vy: -1, life: 30, maxLife: 30, radius: 20, 
                  color: mod.repairShield ? 'rgba(59, 130, 246, 0.3)' : (mod.repairArmor ? 'rgba(234, 179, 8, 0.3)' : 'rgba(239, 68, 68, 0.3)')
              });
          }
      });

      // Movement
      const friction = 0.92;
      const accel = 0.15; 
      
      if (keysRef.current['w']) p.vy -= accel;
      if (keysRef.current['s']) p.vy += accel;
      if (keysRef.current['a']) p.vx -= accel;
      if (keysRef.current['d']) p.vx += accel;

      const speedMag = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
      if (speedMag > derived.speed) {
        p.vx = (p.vx / speedMag) * derived.speed;
        p.vy = (p.vy / speedMag) * derived.speed;
      }

      p.x += p.vx;
      p.y += p.vy;
      p.vx *= friction;
      p.vy *= friction;
      
      // Bounds
      p.x = Math.max(0, Math.min(canvas.width, p.x));
      p.y = Math.max(0, Math.min(canvas.height, p.y));

      if (Math.abs(p.vx) > 0.05 || Math.abs(p.vy) > 0.05) {
        p.rotation = Math.atan2(p.vy, p.vx);
      }

      // --- 2. SPAWNING LOGIC ---
      
      if (IS_BOSS_NODE) {
          if (!bossSpawnedRef.current) {
               // SPAWN BOSS
               const angle = Math.random() * Math.PI * 2;
               const dist = 400;
               enemiesRef.current.push({
                   id: 9999,
                   type: EnemyType.BOSS,
                   x: p.x + Math.cos(angle) * dist,
                   y: p.y + Math.sin(angle) * dist,
                   radius: 40,
                   color: '#b91c1c', // Deep Red
                   hp: 1000 + (currentState.level * 200),
                   maxHp: 1000 + (currentState.level * 200),
                   speed: 1.0,
                   damage: 15,
                   attackRange: 500,
                   reloadTimer: 0,
                   projectileColor: '#ef4444'
               });
               bossSpawnedRef.current = true;
          }
      } else {
          // NORMAL SPAWNING
          if (frameRef.current % 60 === 0 && enemiesRef.current.length < 50) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.max(canvas.width, canvas.height) / 2 + 50;
            const levelMult = currentState.level;
            
            // 30% Chance for Shooter
            const isShooter = Math.random() < 0.3;
            
            enemiesRef.current.push({
              id: Math.random(),
              type: isShooter ? EnemyType.SHOOTER : EnemyType.CHASER,
              x: p.x + Math.cos(angle) * dist,
              y: p.y + Math.sin(angle) * dist,
              radius: isShooter ? 12 : 10,
              color: isShooter ? '#d97706' : '#ef4444', // Orange vs Red
              hp: 20 + levelMult * 5,
              maxHp: 20 + levelMult * 5,
              speed: isShooter ? 0.8 : (0.5 + Math.random() * 0.5),
              damage: 5,
              attackRange: isShooter ? 300 : 0,
              reloadTimer: Math.random() * 60, // staggered start
              projectileColor: '#f59e0b'
            });
          }
      }

      // --- 3. ENEMY AI & SHOOTING ---
      
      for (const e of enemiesRef.current) {
          const dx = p.x - e.x;
          const dy = p.y - e.y;
          const dist = Math.sqrt(dx*dx + dy*dy);

          if (e.type === EnemyType.CHASER) {
             // Simple chase
             if (dist > 0) {
                e.x += (dx / dist) * e.speed;
                e.y += (dy / dist) * e.speed;
             }
          } else if (e.type === EnemyType.SHOOTER || e.type === EnemyType.BOSS) {
             const range = e.attackRange || 300;
             // Maintain distance if too close, approach if too far
             if (dist > range + 50) {
                 e.x += (dx / dist) * e.speed;
                 e.y += (dy / dist) * e.speed;
             } else if (dist < range - 50) {
                 // Back away slowly
                 e.x -= (dx / dist) * (e.speed * 0.5);
                 e.y -= (dy / dist) * (e.speed * 0.5);
             }

             // Shooting
             if (e.reloadTimer !== undefined) {
                 if (e.reloadTimer > 0) e.reloadTimer--;
                 else {
                     // Fire!
                     const angle = Math.atan2(dy, dx);
                     const spread = e.type === EnemyType.BOSS ? 0.2 : 0.05; // Boss sprays a bit
                     const actualAngle = angle + (Math.random() - 0.5) * spread;
                     
                     projectilesRef.current.push({
                         id: Math.random(),
                         x: e.x,
                         y: e.y,
                         vx: Math.cos(actualAngle) * 5,
                         vy: Math.sin(actualAngle) * 5,
                         damage: e.type === EnemyType.BOSS ? 10 : 5,
                         duration: 120,
                         radius: e.type === EnemyType.BOSS ? 8 : 4,
                         color: e.projectileColor || '#fff',
                         owner: 'ENEMY'
                     });

                     e.reloadTimer = e.type === EnemyType.BOSS ? 15 : 120; // Boss fires fast, Shooters slow
                 }
             }
          }

          // Player Collision (Body Slam)
          if (dist < p.radius + e.radius) {
             let incDmg = 0.5;
             if (p.hp.shield > 0) p.hp.shield = Math.max(0, p.hp.shield - incDmg);
             else if (p.hp.armor > 0) p.hp.armor = Math.max(0, p.hp.armor - incDmg);
             else p.hp.hull = Math.max(0, p.hp.hull - incDmg);

             e.x -= (dx/dist) * 2;
             e.y -= (dy/dist) * 2;
          }
      }

      // --- 4. PLAYER AUTO-FIRE ---
      derived.weapons.forEach((w, index) => {
        if (!weaponStatesRef.current[index]) {
            weaponStatesRef.current[index] = { currentAmmo: w.ammoCapacity || 9999, reloadTimer: 0 };
        }
        const wState = weaponStatesRef.current[index];

        if (wState.reloadTimer > 0) {
            wState.reloadTimer--;
            return;
        }

        const rof = w.rateOfFire || 1;
        const cooldownFrames = rof * 60 * (1 - derived.fireRateMult); 
        
        if ((frameRef.current + index * 10) % Math.max(5, Math.ceil(cooldownFrames)) === 0) {
           if (w.ammoCapacity && wState.currentAmmo <= 0) {
               wState.reloadTimer = (w.reloadTime || 3) * 60;
               wState.currentAmmo = w.ammoCapacity;
               return;
           }

           // Find Target
           let nearest: Enemy | null = null;
           let minDst = (w.range || 300) * (1 + (w.rangeBonus || 0)); // Apply computer range bonus

           for (const e of enemiesRef.current) {
             const dx = e.x - p.x;
             const dy = e.y - p.y;
             const dst = Math.sqrt(dx*dx + dy*dy);
             if (dst < minDst) {
               minDst = dst;
               nearest = e;
             }
           }

           if (nearest) {
             const angle = Math.atan2(nearest.y - p.y, nearest.x - p.x);
             
             let projColor = '#f97316'; 
             if (w.damageType === DamageType.EM) projColor = '#3b82f6';
             else if (w.damageType === DamageType.THERMAL) projColor = '#eab308';
             else if (w.damageType === DamageType.KINETIC) projColor = '#a8a29e';
             else if (w.damageType === DamageType.EXPLOSIVE) projColor = '#ef4444';

             const isHoming = w.id.includes('missile');
             
             // Bonuses from modules
             let dmg = (w.damage || 10) * derived.dmgMult;
             if (isHoming && w.missileDamageBonus) dmg *= (1 + w.missileDamageBonus);
             if (!isHoming && w.turretDamageBonus) dmg *= (1 + w.turretDamageBonus);
             
             // Add module bonuses from other slots (e.g., BCS)
             currentState.modules.forEach(m => {
                 if (isHoming && m.missileDamageBonus) dmg *= (1 + m.missileDamageBonus);
                 if (!isHoming && m.turretDamageBonus) dmg *= (1 + m.turretDamageBonus);
             });

             projectilesRef.current.push({
               id: Math.random(),
               x: p.x,
               y: p.y,
               vx: Math.cos(angle) * (isHoming ? 6 : 10),
               vy: Math.sin(angle) * (isHoming ? 6 : 10),
               radius: isHoming ? 5 : 3,
               color: projColor,
               damage: dmg,
               duration: 120,
               homing: isHoming,
               targetId: nearest.id,
               owner: 'PLAYER'
             });
             
             if (w.ammoCapacity) {
                 wState.currentAmmo--;
             }
           }
        }
      });

      // --- 5. PROJECTILE UPDATES ---
      for (let i = projectilesRef.current.length - 1; i >= 0; i--) {
        const proj = projectilesRef.current[i];
        
        // Homing Logic (Player Missiles)
        if (proj.owner === 'PLAYER' && proj.homing && proj.targetId) {
            const target = enemiesRef.current.find(e => e.id === proj.targetId);
            if (target) {
                const angle = Math.atan2(target.y - proj.y, target.x - proj.x);
                const turnRate = 0.15;
                const vxTarget = Math.cos(angle) * 6;
                const vyTarget = Math.sin(angle) * 6;
                proj.vx += (vxTarget - proj.vx) * turnRate;
                proj.vy += (vyTarget - proj.vy) * turnRate;
            }
        }

        proj.x += proj.vx;
        proj.y += proj.vy;
        proj.duration--;
        
        // Particles
        if (frameRef.current % 5 === 0) {
             particlesRef.current.push({
                 id: Math.random(), x: proj.x, y: proj.y,
                 vx: 0, vy: 0, life: 10, maxLife: 10, radius: 1, color: proj.color
             });
        }

        let hit = false;
        
        if (proj.owner === 'PLAYER') {
            // Hit Enemies
            for (const e of enemiesRef.current) {
                const dx = proj.x - e.x;
                const dy = proj.y - e.y;
                if (dx*dx + dy*dy < (proj.radius + e.radius)**2) {
                   e.hp -= proj.damage;
                   hit = true;
                   // Spark particles
                   for(let k=0;k<3;k++) {
                     particlesRef.current.push({
                       id: Math.random(), x: proj.x, y: proj.y,
                       vx: (Math.random()-0.5)*3, vy: (Math.random()-0.5)*3,
                       life: 15, maxLife: 15, radius: 1.5, color: '#fff'
                     });
                   }
                   break;
                }
            }
        } else {
            // Hit Player
            const dx = proj.x - p.x;
            const dy = proj.y - p.y;
            if (dx*dx + dy*dy < (proj.radius + p.radius)**2) {
               // Apply Damage
               if (p.hp.shield > 0) p.hp.shield = Math.max(0, p.hp.shield - proj.damage);
               else if (p.hp.armor > 0) p.hp.armor = Math.max(0, p.hp.armor - proj.damage);
               else p.hp.hull = Math.max(0, p.hp.hull - proj.damage);
               
               hit = true;
               // Red Flash particles
               for(let k=0;k<5;k++) {
                   particlesRef.current.push({
                     id: Math.random(), x: p.x, y: p.y,
                     vx: (Math.random()-0.5)*4, vy: (Math.random()-0.5)*4,
                     life: 20, maxLife: 20, radius: 2, color: '#ef4444'
                   });
               }
            }
        }

        if (hit || proj.duration <= 0) {
          projectilesRef.current.splice(i, 1);
        }
      }

      // --- 6. CLEANUP DEAD ENEMIES & RELIC TRIGGERS ---
      for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
        const e = enemiesRef.current[i];
        if (e.hp <= 0) {
          enemiesRef.current.splice(i, 1);
          killCountRef.current++;
          
          // RELIC ON-KILL EFFECTS
          currentState.relics.forEach(relic => {
              if (relic.ammoRefillOnKill) {
                  weaponStatesRef.current.forEach((ws, idx) => {
                      if (derived.weapons[idx].ammoCapacity) {
                          ws.currentAmmo = Math.min(derived.weapons[idx].ammoCapacity!, ws.currentAmmo + relic.ammoRefillOnKill!);
                      }
                  });
              }
              if (relic.capRefillOnKill) {
                  p.cap.current = Math.min(p.cap.max, p.cap.current + relic.capRefillOnKill);
              }
              if (relic.healOnKill) {
                  p.hp.hull = Math.min(p.maxHp.hull, p.hp.hull + relic.healOnKill);
              }
          });

          // Determine loot drops
          const isBoss = e.type === EnemyType.BOSS;
          const dropMult = isBoss ? 10 : 1;
          
          // XP
          for(let k=0; k < (isBoss ? 20 : 1); k++) {
              lootEntitiesRef.current.push({
                id: Math.random(), x: e.x + (Math.random()*20-10), y: e.y + (Math.random()*20-10),
                type: LootType.XP, value: 10,
                vx: (Math.random()-0.5)*4, vy: (Math.random()-0.5)*4,
                radius: 4, color: '#3b82f6', magnetized: false
              });
          }

          // Credits
          if (Math.random() < 0.4 || isBoss) {
             lootEntitiesRef.current.push({
                id: Math.random(), x: e.x, y: e.y,
                type: LootType.CREDIT, value: (Math.floor(Math.random() * 20) + 10) * dropMult,
                vx: (Math.random()-0.5)*3, vy: (Math.random()-0.5)*3,
                radius: 5, color: '#fbbf24', magnetized: false
              });
          }
          
          // Materials
          if (Math.random() < 0.2 || isBoss) { 
            lootEntitiesRef.current.push({
                id: Math.random(), x: e.x, y: e.y,
                type: LootType.MATERIAL, value: (Math.floor(Math.random() * 3) + 1) * dropMult,
                vx: (Math.random()-0.5)*3, vy: (Math.random()-0.5)*3,
                radius: 6, color: '#9ca3af', magnetized: false
              });
          }
        }
      }

      // --- 7. LOOT PHYSICS ---
      const MAGNET_RADIUS = 150 * derived.magnetMult;
      const LOOT_SPEED = 7;
      for (let i = lootEntitiesRef.current.length - 1; i >= 0; i--) {
        const l = lootEntitiesRef.current[i];
        l.x += l.vx;
        l.y += l.vy;
        l.vx *= 0.9;
        l.vy *= 0.9;

        const dx = p.x - l.x;
        const dy = p.y - l.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < MAGNET_RADIUS) {
            l.vx += (dx / dist) * 0.6;
            l.vy += (dy / dist) * 0.6;
            const spd = Math.sqrt(l.vx*l.vx + l.vy*l.vy);
            if (spd > LOOT_SPEED) {
                l.vx = (l.vx/spd) * LOOT_SPEED;
                l.vy = (l.vy/spd) * LOOT_SPEED;
            }
        }

        if (dist < p.radius + l.radius) {
            if (l.type === LootType.XP) collectedLootRef.current.xp += l.value;
            if (l.type === LootType.CREDIT) collectedLootRef.current.credits += l.value;
            if (l.type === LootType.MATERIAL) collectedLootRef.current.materials += l.value;
            lootEntitiesRef.current.splice(i, 1);
        }
      }

      // --- 8. PARTICLE PHYSICS ---
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const part = particlesRef.current[i];
        part.x += part.vx;
        part.y += part.vy;
        part.life--;
        if (part.life <= 0) {
           particlesRef.current.splice(i, 1);
        }
      }

      // --- 9. RENDER ---
      
      // Clear
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const gridSize = 50;
      const offsetX = p.x % gridSize;
      const offsetY = p.y % gridSize;
      for (let x = -gridSize; x < canvas.width + gridSize; x += gridSize) {
        ctx.moveTo(x - offsetX, 0);
        ctx.lineTo(x - offsetX, canvas.height);
      }
      for (let y = -gridSize; y < canvas.height + gridSize; y += gridSize) {
        ctx.moveTo(0, y - offsetY);
        ctx.lineTo(canvas.width, y - offsetY);
      }
      ctx.stroke();

      // Particles
      particlesRef.current.forEach(part => {
        ctx.globalAlpha = Math.max(0, part.life / part.maxLife);
        ctx.fillStyle = part.color;
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.radius, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Loot
      lootEntitiesRef.current.forEach(l => {
          ctx.fillStyle = l.color;
          ctx.beginPath();
          if (l.type === LootType.CREDIT) ctx.rect(l.x - l.radius, l.y - l.radius, l.radius*2, l.radius*2);
          else if (l.type === LootType.MATERIAL) {
             ctx.moveTo(l.x, l.y-l.radius); ctx.lineTo(l.x+l.radius, l.y+l.radius); ctx.lineTo(l.x-l.radius, l.y+l.radius);
          }
          else ctx.arc(l.x, l.y, l.radius, 0, Math.PI*2);
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;
          ctx.stroke();
      });

      // Enemies
      enemiesRef.current.forEach(e => {
        ctx.fillStyle = e.color;
        ctx.beginPath();
        
        if (e.type === EnemyType.BOSS) {
            // Boss Shape (Hexagon)
            const size = e.radius;
            for (let k = 0; k < 6; k++) {
                const ang = (Math.PI/3) * k;
                const vx = e.x + Math.cos(ang) * size;
                const vy = e.y + Math.sin(ang) * size;
                if (k === 0) ctx.moveTo(vx, vy);
                else ctx.lineTo(vx, vy);
            }
            ctx.closePath();
            ctx.fill();
            // Boss Inner Glow
            ctx.shadowColor = e.color;
            ctx.shadowBlur = 20;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.shadowBlur = 0;
        } else if (e.type === EnemyType.SHOOTER) {
            // Triangle
            const size = e.radius;
            ctx.moveTo(e.x, e.y - size);
            ctx.lineTo(e.x + size, e.y + size);
            ctx.lineTo(e.x - size, e.y + size);
            ctx.fill();
        } else {
             // Chaser (Circle with spikes implied)
             ctx.arc(e.x, e.y, e.radius, 0, Math.PI*2);
             ctx.fill();
        }
        
        // HP Bar (Standard enemies)
        if (e.type !== EnemyType.BOSS) {
            const hpPct = e.hp / e.maxHp;
            ctx.fillStyle = '#333';
            ctx.fillRect(e.x - 10, e.y - 20, 20, 4);
            ctx.fillStyle = '#f00';
            ctx.fillRect(e.x - 10, e.y - 20, 20 * hpPct, 4);
        }
      });

      // Projectiles
      projectilesRef.current.forEach(proj => {
        ctx.fillStyle = proj.color;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI*2);
        ctx.fill();
      });

      // Player
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation + Math.PI/2);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(15, 15);
      ctx.lineTo(0, 10);
      ctx.lineTo(-15, 15);
      ctx.closePath();
      ctx.shadowColor = '#0ea5e9';
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();

      // --- UI ---
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const pad = 20;
      const barW = 250;
      const barH = 10;

      // Player Health Bars
      // Shield
      ctx.fillStyle = '#1e3a8a'; ctx.fillRect(pad, pad, barW, barH);
      const sPct = p.hp.shield / p.maxHp.shield;
      ctx.fillStyle = '#3b82f6'; ctx.fillRect(pad, pad, barW * sPct, barH);
      ctx.strokeStyle = '#60a5fa'; ctx.strokeRect(pad, pad, barW, barH);
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText(`护盾 SHIELD ${Math.floor(p.hp.shield)}`, pad + 5, pad + 8);

      // Armor
      ctx.fillStyle = '#422006'; ctx.fillRect(pad, pad + 15, barW, barH);
      const aPct = p.hp.armor / p.maxHp.armor;
      ctx.fillStyle = '#eab308'; ctx.fillRect(pad, pad + 15, barW * aPct, barH);
      ctx.strokeStyle = '#fcd34d'; ctx.strokeRect(pad, pad + 15, barW, barH);
      ctx.fillStyle = '#fff'; ctx.fillText(`装甲 ARMOR  ${Math.floor(p.hp.armor)}`, pad + 5, pad + 23);

      // Hull
      ctx.fillStyle = '#450a0a'; ctx.fillRect(pad, pad + 30, barW, barH);
      const hPct = p.hp.hull / p.maxHp.hull;
      ctx.fillStyle = '#ef4444'; ctx.fillRect(pad, pad + 30, barW * hPct, barH);
      ctx.strokeStyle = '#fca5a5'; ctx.strokeRect(pad, pad + 30, barW, barH);
      ctx.fillStyle = '#fff'; ctx.fillText(`结构 HULL   ${Math.floor(p.hp.hull)}`, pad + 5, pad + 38);

      // Capacitor Bar (New)
      ctx.fillStyle = '#3f3f46'; ctx.fillRect(pad, pad + 45, barW, barH);
      const capPct = p.cap.current / p.cap.max;
      ctx.fillStyle = '#eab308'; ctx.fillRect(pad, pad + 45, barW * capPct, barH); // Yellow for cap
      ctx.strokeStyle = '#fde047'; ctx.strokeRect(pad, pad + 45, barW, barH);
      ctx.fillStyle = '#000'; ctx.fillText(`电容 CAP    ${Math.floor(p.cap.current)}`, pad + 5, pad + 53);

      // Ammo
      let yOff = pad + 70;
      derived.weapons.forEach((w, idx) => {
          if (w.ammoCapacity) {
              const ws = weaponStatesRef.current[idx];
              ctx.fillStyle = ws.reloadTimer > 0 ? '#ef4444' : '#fff';
              ctx.fillText(`${w.name}: ${ws.reloadTimer > 0 ? '装填中...' : `${ws.currentAmmo}/${w.ammoCapacity}`}`, pad, yOff);
              yOff += 15;
          }
      });

      // Boss Health Bar (Top Center)
      const boss = enemiesRef.current.find(e => e.type === EnemyType.BOSS);
      if (boss) {
          const bW = 400;
          const bH = 20;
          const bX = (canvas.width - bW) / 2;
          const bY = 20;
          ctx.fillStyle = '#450a0a'; ctx.fillRect(bX, bY, bW, bH);
          ctx.fillStyle = '#ef4444'; ctx.fillRect(bX, bY, bW * (boss.hp / boss.maxHp), bH);
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(bX, bY, bW, bH);
          ctx.textAlign = 'center';
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 16px monospace';
          ctx.fillText("扇区守卫者", canvas.width / 2, bY - 10);
          ctx.textAlign = 'start'; // Reset
      } else {
          // Objective (Only if not boss)
          if (!IS_BOSS_NODE) {
            ctx.textAlign = 'left';
            ctx.fillStyle = '#f59e0b';
            ctx.font = 'bold 14px monospace';
            ctx.fillText(`击杀数: ${killCountRef.current} / ${TARGET_KILLS}`, pad, pad + 150);
          }
      }

      // Resources
      ctx.textAlign = 'right';
      ctx.font = '12px monospace';
      ctx.fillStyle = '#fcd34d';
      ctx.fillText(`信用点: ${currentState.credits + collectedLootRef.current.credits}`, canvas.width - pad, pad + 15);
      ctx.fillStyle = '#9ca3af'; 
      ctx.fillText(`材料: ${currentState.materials + collectedLootRef.current.materials}`, canvas.width - pad, pad + 35);
      
      // XP BAR (Bottom)
      const currentXp = currentState.xp + collectedLootRef.current.xp;
      const maxXp = currentState.xpToNextLevel;
      const xpRatio = Math.min(1, currentXp / maxXp);
      const barH_XP = 8;
      const yXP = canvas.height - barH_XP;
      
      ctx.fillStyle = '#1e1b4b'; // dark purple
      ctx.fillRect(0, yXP, canvas.width, barH_XP);
      ctx.fillStyle = '#a855f7'; // purple
      ctx.fillRect(0, yXP, canvas.width * xpRatio, barH_XP);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#e9d5ff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`XP ${Math.floor(currentXp)} / ${maxXp}`, canvas.width / 2, yXP - 4);

      // Checks
      if (p.hp.hull <= 0) {
        onDeathRef.current();
        return; 
      }
      
      if (killCountRef.current >= TARGET_KILLS) {
        onCompleteRef.current(
            collectedLootRef.current, 
            { hp: { ...p.hp }, cap: p.cap.current }
        );
        return;
      }
      
      if (collectedLootRef.current.xp + currentState.xp >= currentState.xpToNextLevel) {
          if (gameActiveRef.current) {
             const cost = currentState.xpToNextLevel - currentState.xp;
             collectedLootRef.current.xp = Math.max(0, collectedLootRef.current.xp - cost);
             onLevelUpRef.current(0);
          }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-black">
      <canvas 
        ref={canvasRef} 
        width={window.innerWidth} 
        height={window.innerHeight} 
        className="block"
      />
    </div>
  );
};
