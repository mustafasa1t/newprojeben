import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Node } from "@shared/schema";

interface AlgorithmSelectorProps {
  nodes: Node[];
  selectedAlgorithm: string;
  startNode: string | null;
  targetNode: string | null;
  animationSpeed: number;
  onAlgorithmChange: (algorithm: string) => void;
  onStartNodeChange: (nodeId: string) => void;
  onTargetNodeChange: (nodeId: string) => void;
  onAnimationSpeedChange: (speed: number) => void;
  disabled?: boolean;
}

export default function AlgorithmSelector({
  nodes,
  selectedAlgorithm,
  startNode,
  targetNode,
  animationSpeed,
  onAlgorithmChange,
  onStartNodeChange,
  onTargetNodeChange,
  onAnimationSpeedChange,
  disabled = false
}: AlgorithmSelectorProps) {
  const algorithms = [
    { id: "bfs", name: "BFS", needsTarget: false },
    { id: "dfs", name: "DFS", needsTarget: false },
    { id: "dijkstra", name: "Dijkstra", needsTarget: true },
    { id: "astar", name: "A* Search", needsTarget: true }
  ];
  
  const selectedAlgorithmObj = algorithms.find(a => a.id === selectedAlgorithm);
  
  // Get speed label
  const getSpeedLabel = (speed: number) => {
    switch(speed) {
      case 1: return "Very Slow";
      case 2: return "Slow";
      case 3: return "Normal";
      case 4: return "Fast";
      case 5: return "Very Fast";
      default: return "Normal";
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
      <h2 className="font-heading font-semibold text-lg mb-4">Algorithm Selection</h2>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        {algorithms.map(algorithm => (
          <Button
            key={algorithm.id}
            variant={selectedAlgorithm === algorithm.id ? "default" : "outline"}
            onClick={() => onAlgorithmChange(algorithm.id)}
            disabled={disabled}
            className={selectedAlgorithm === algorithm.id ? "" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}
          >
            {algorithm.name}
          </Button>
        ))}
      </div>
      
      {/* Algorithm Parameters */}
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="startNode">Starting Node</Label>
          <Select
            value={startNode || ""}
            onValueChange={onStartNodeChange}
            disabled={disabled || nodes.length === 0}
          >
            <SelectTrigger id="startNode" className="bg-gray-50">
              <SelectValue placeholder="Select starting node" />
            </SelectTrigger>
            <SelectContent>
              {nodes.map(node => (
                <SelectItem key={node.id} value={node.id}>
                  Node {node.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {selectedAlgorithmObj?.needsTarget && (
          <div className="space-y-2">
            <Label htmlFor="targetNode">Target Node (for path finding)</Label>
            <Select
              value={targetNode || ""}
              onValueChange={onTargetNodeChange}
              disabled={disabled || nodes.length === 0}
            >
              <SelectTrigger id="targetNode" className="bg-gray-50">
                <SelectValue placeholder="Select target node" />
              </SelectTrigger>
              <SelectContent>
                {nodes.map(node => (
                  <SelectItem key={node.id} value={node.id}>
                    Node {node.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <div className="space-y-2">
          <Label className="flex justify-between">
            <span>Animation Speed</span>
            <span>{getSpeedLabel(animationSpeed)}</span>
          </Label>
          <Slider
            defaultValue={[animationSpeed]}
            min={1}
            max={5}
            step={1}
            onValueChange={values => onAnimationSpeedChange(values[0])}
            disabled={disabled}
            className="accent-primary"
          />
        </div>
      </div>
    </div>
  );
}
