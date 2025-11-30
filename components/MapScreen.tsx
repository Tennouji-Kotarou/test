
import React from 'react';
import { NodeType } from '../types';

interface MapNodeData {
  id: string;
  type: NodeType;
  row: number;
  col: number;
  completed: boolean;
  active: boolean; // Can be selected
  parents: string[];
}

interface MapScreenProps {
  currentTier: number;
  mapData: MapNodeData[][]; // Organized by rows (tiers)
  onNodeSelect: (node: MapNodeData) => void;
}

export const MapScreen: React.FC<MapScreenProps> = ({ currentTier, mapData, onNodeSelect }) => {
  
  const getIcon = (type: NodeType) => {
    switch(type) {
      case NodeType.COMBAT: return '⚔️';
      case NodeType.ELITE: return '☠️';
      case NodeType.EVENT: return '?';
      case NodeType.SHOP: return '💰';
      case NodeType.REST: return '🔥';
      case NodeType.BOSS: return '👹';
      case NodeType.START: return '🚀';
      default: return 'O';
    }
  };

  const getColor = (type: NodeType, active: boolean, completed: boolean) => {
    if (completed) return 'bg-gray-800 text-gray-600 border-gray-800 cursor-default';
    if (!active) return 'bg-gray-900 text-gray-800 border-gray-900 opacity-30 cursor-not-allowed';
    
    // Active colors
    switch(type) {
      case NodeType.COMBAT: return 'bg-red-900/40 text-red-200 border-red-500 hover:bg-red-800 hover:shadow-[0_0_15px_rgba(239,68,68,0.6)]';
      case NodeType.ELITE: return 'bg-purple-900/40 text-purple-200 border-purple-500 hover:bg-purple-800 hover:shadow-[0_0_15px_rgba(168,85,247,0.6)]';
      case NodeType.EVENT: return 'bg-blue-900/40 text-blue-200 border-blue-500 hover:bg-blue-800 hover:shadow-[0_0_15px_rgba(59,130,246,0.6)]';
      case NodeType.SHOP: return 'bg-yellow-900/40 text-yellow-200 border-yellow-500 hover:bg-yellow-800 hover:shadow-[0_0_15px_rgba(234,179,8,0.6)]';
      case NodeType.REST: return 'bg-green-900/40 text-green-200 border-green-500 hover:bg-green-800 hover:shadow-[0_0_15px_rgba(34,197,94,0.6)]';
      case NodeType.BOSS: return 'bg-red-950 text-red-500 border-red-600 scale-125 hover:shadow-[0_0_25px_rgba(220,38,38,0.8)]';
      case NodeType.START: return 'bg-cyan-900/40 text-cyan-200 border-cyan-500 hover:bg-cyan-800';
      default: return 'bg-gray-800';
    }
  };

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      
      <h1 className="text-3xl font-bold text-gray-300 mb-8 z-20 uppercase tracking-widest drop-shadow-lg">星域航图 (Sector Map)</h1>
      
      <div className="flex flex-col-reverse gap-8 z-10 max-h-screen overflow-y-auto p-10 items-center">
        {mapData.map((row, rowIdx) => (
          <div key={rowIdx} className="flex justify-center gap-12 relative">
             {/* Tier label for context */}
             <div className="absolute -left-20 top-1/2 -translate-y-1/2 text-xs text-gray-700 font-mono">
                层级 (TIER) {rowIdx + 1}
             </div>

             {row.map((node) => {
               return (
                 <button
                    key={node.id}
                    disabled={!node.active}
                    onClick={() => onNodeSelect(node)}
                    className={`w-16 h-16 rounded-full border-2 flex items-center justify-center text-2xl shadow-lg transition-all transform duration-200 relative
                      ${getColor(node.type, node.active, node.completed)}
                      ${node.active ? 'cursor-pointer hover:scale-110 z-10' : ''}
                    `}
                 >
                   {getIcon(node.type)}
                   {node.active && !node.completed && (
                     <span className="absolute -bottom-1 w-2 h-2 bg-white rounded-full animate-ping"></span>
                   )}
                 </button>
               )
             })}
          </div>
        ))}
      </div>
      
      <div className="absolute bottom-4 text-gray-500 text-sm z-20">
        当前扇区: {currentTier + 1}
      </div>
    </div>
  );
};
