import { useRef, useEffect, useState } from "react";
import { Node, Edge, Graph as GraphType } from "@shared/schema";
import ForceGraph2D from "react-force-graph-2d";
import { ZoomInIcon, ZoomOutIcon, RefreshCwIcon, PlusCircleIcon, LinkIcon, Trash2Icon } from "lucide-react";
import { createNode, createEdge, removeNode, removeEdge, addNode, addEdge } from "@/lib/graphUtils";
import { Tooltip } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

interface GraphCanvasProps {
  graph: GraphType;
  onGraphChange: (graph: GraphType) => void;
  currentNodeId?: string;
  visitedNodes?: string[];
  pathNodes?: string[];
  isExecuting?: boolean;
  representation: "adjacencyList" | "adjacencyMatrix";
  onRepresentationChange: (representation: "adjacencyList" | "adjacencyMatrix") => void;
}

export default function GraphCanvas({
  graph,
  onGraphChange,
  currentNodeId,
  visitedNodes = [],
  pathNodes = [],
  isExecuting = false,
  representation,
  onRepresentationChange
}: GraphCanvasProps) {
  const graphRef = useRef<any>(null);
  const [mode, setMode] = useState<"select" | "addNode" | "addEdge" | "delete">("select");
  const [sourceNode, setSourceNode] = useState<Node | null>(null);
  const [edgeWeight, setEdgeWeight] = useState<number>(1);
  const { toast } = useToast();
  
  // Convert graph data for force-graph library
  const graphData = {
    nodes: graph.nodes.map(node => ({
      ...node,
      color: getNodeColor(node.id),
      val: 1 // Node size
    })),
    links: graph.edges.map(edge => ({
      ...edge,
      source: edge.source,
      target: edge.target,
      color: "#8B5CF6" // Edge color
    }))
  };
  
  // Get node color based on state
  function getNodeColor(nodeId: string): string {
    if (currentNodeId === nodeId) return "#10B981"; // Current node (green)
    if (pathNodes.includes(nodeId)) return "#F59E0B"; // Path node (amber)
    if (visitedNodes.includes(nodeId)) return "#60A5FA"; // Visited node (light blue)
    return "#3B82F6"; // Default node (blue)
  }
  
  // Handle node click based on current mode
  const handleNodeClick = (node: any) => {
    if (isExecuting) return; // Disable interactions during algorithm execution
    
    switch (mode) {
      case "select":
        // Select node
        break;
      case "addNode":
        // Add node near clicked node
        const newNode = createNode(
          `Node ${graph.nodes.length + 1}`,
          node.x + Math.random() * 50 - 25,
          node.y + Math.random() * 50 - 25
        );
        onGraphChange(addNode(graph, newNode));
        toast({
          title: "Node Added",
          description: `New node "${newNode.label}" created`,
        });
        break;
      case "addEdge":
        if (sourceNode === null) {
          // First node selected as source
          setSourceNode(node);
        } else if (sourceNode.id !== node.id) {
          // Second node selected as target, create edge
          if (!graph.edges.some(e => 
            (e.source === sourceNode.id && e.target === node.id) || 
            (e.source === node.id && e.target === sourceNode.id)
          )) {
            const newEdge = createEdge(sourceNode.id, node.id, edgeWeight);
            onGraphChange(addEdge(graph, newEdge));
            toast({
              title: "Edge Added",
              description: `Edge created between ${sourceNode.label} and ${node.label}`,
            });
          } else {
            toast({
              title: "Edge already exists",
              description: "These nodes are already connected",
              variant: "destructive"
            });
          }
          // Reset source node
          setSourceNode(null);
        }
        break;
      case "delete":
        // Delete node and connected edges
        onGraphChange(removeNode(graph, node.id));
        toast({
          title: "Node Deleted",
          description: `Node "${node.label}" and connected edges removed`,
        });
        break;
    }
  };
  
  // Handle link (edge) click
  const handleLinkClick = (link: any) => {
    if (isExecuting || mode !== "delete") return;
    
    // Delete edge
    const edgeToDelete = graph.edges.find(e => 
      (e.source === link.source.id && e.target === link.target.id) ||
      (e.source === link.target.id && e.target === link.source.id)
    );
    
    if (edgeToDelete) {
      onGraphChange(removeEdge(graph, edgeToDelete.id));
      toast({
        title: "Edge Deleted",
        description: "Edge removed from graph",
      });
    }
  };
  
  // Reset graph view
  const resetView = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400);
    }
  };
  
  // Zoom in
  const zoomIn = () => {
    if (graphRef.current) {
      graphRef.current.zoom(graphRef.current.zoom() * 1.2);
    }
  };
  
  // Zoom out
  const zoomOut = () => {
    if (graphRef.current) {
      graphRef.current.zoom(graphRef.current.zoom() * 0.8);
    }
  };
  
  // Add a node in the center of the canvas
  const addNewNode = () => {
    if (isExecuting) return;
    
    const centerX = 400;
    const centerY = 300;
    
    // If there are existing nodes, place the new one near a random existing node
    if (graph.nodes.length > 0) {
      const randomNode = graph.nodes[Math.floor(Math.random() * graph.nodes.length)];
      const newNode = createNode(
        `Node ${graph.nodes.length + 1}`,
        randomNode.x && randomNode.y 
          ? randomNode.x + Math.random() * 100 - 50
          : centerX,
        randomNode.x && randomNode.y 
          ? randomNode.y + Math.random() * 100 - 50
          : centerY
      );
      onGraphChange(addNode(graph, newNode));
    } else {
      // First node in the center
      const newNode = createNode(`Node 1`, centerX, centerY);
      onGraphChange(addNode(graph, newNode));
    }
    
    toast({
      title: "Node Added",
      description: `New node created`,
    });
  };
  
  // Clear the entire graph
  const clearGraph = () => {
    if (isExecuting) return;
    
    if (confirm("Are you sure you want to clear the entire graph?")) {
      onGraphChange({
        ...graph,
        nodes: [],
        edges: []
      });
      
      toast({
        title: "Graph Cleared",
        description: "All nodes and edges have been removed",
      });
    }
  };
  
  // Auto-center and zoom when the graph changes
  useEffect(() => {
    if (graphRef.current && graph.nodes.length > 0) {
      setTimeout(() => {
        resetView();
      }, 100);
    }
  }, [graph.nodes.length === 0]);
  
  return (
    <div className="bg-white rounded-xl shadow-md flex-grow p-4 md:p-6 flex flex-col h-[500px] md:h-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-heading font-semibold text-lg">Graph Visualization</h2>
        <div className="flex space-x-2">
          <Tooltip content="Zoom In">
            <button 
              className="text-gray-600 hover:text-primary p-1 rounded" 
              onClick={zoomIn}
              aria-label="Zoom In"
            >
              <ZoomInIcon size={18} />
            </button>
          </Tooltip>
          <Tooltip content="Zoom Out">
            <button 
              className="text-gray-600 hover:text-primary p-1 rounded" 
              onClick={zoomOut}
              aria-label="Zoom Out"
            >
              <ZoomOutIcon size={18} />
            </button>
          </Tooltip>
          <Tooltip content="Reset View">
            <button 
              className="text-gray-600 hover:text-primary p-1 rounded" 
              onClick={resetView}
              aria-label="Reset View"
            >
              <RefreshCwIcon size={18} />
            </button>
          </Tooltip>
        </div>
      </div>
      
      <div className="relative flex-grow bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
        {/* Graph Canvas */}
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          nodeLabel={node => `${(node as any).label}`}
          linkLabel={link => `Weight: ${(link as any).weight || 1}`}
          nodeRelSize={8}
          onNodeClick={handleNodeClick}
          onLinkClick={handleLinkClick}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = (node as any).label;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Inter`;
            
            // Draw node circle
            ctx.beginPath();
            ctx.arc(node.x || 0, node.y || 0, 8, 0, 2 * Math.PI);
            ctx.fillStyle = (node as any).color;
            ctx.fill();
            
            // Draw node border
            if (currentNodeId === (node as any).id) {
              ctx.strokeStyle = "#10B981";
              ctx.lineWidth = 2 / globalScale;
              ctx.stroke();
            }
            
            // Draw node label
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "white";
            ctx.fillText(label, node.x || 0, node.y || 0);
          }}
          linkCanvasObject={(link, ctx, globalScale) => {
            const start = link.source;
            const end = link.target;
            
            if (!start || !end || typeof start === 'string' || typeof end === 'string') return;
            
            // Draw link line
            ctx.beginPath();
            ctx.moveTo(start.x || 0, start.y || 0);
            ctx.lineTo(end.x || 0, end.y || 0);
            ctx.strokeStyle = (link as any).color;
            ctx.lineWidth = 2 / globalScale;
            ctx.stroke();
            
            // Draw weight label if applicable
            const weight = (link as any).weight;
            if (weight && weight !== 1) {
              const fontSize = 10 / globalScale;
              ctx.font = `${fontSize}px Inter`;
              
              // Position at middle of the link
              const textPos = {
                x: start.x + (end.x - start.x) / 2,
                y: start.y + (end.y - start.y) / 2
              };
              
              // Draw text background
              const textWidth = ctx.measureText(weight.toString()).width;
              ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
              ctx.fillRect(
                textPos.x - textWidth / 2 - 2,
                textPos.y - fontSize / 2 - 2,
                textWidth + 4,
                fontSize + 4
              );
              
              // Draw text
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillStyle = "#4B5563";
              ctx.fillText(weight.toString(), textPos.x, textPos.y);
            }
          }}
          cooldownTicks={100}
          linkDirectionalArrowLength={0}
        />
        
        {/* Toolbar */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-lg py-2 px-4 flex space-x-4">
          <Tooltip content="Add Node">
            <button 
              className={`text-gray-700 hover:text-primary p-2 rounded-full ${mode === 'addNode' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
              onClick={() => setMode(mode === 'addNode' ? 'select' : 'addNode')}
              aria-label="Add Node"
            >
              <PlusCircleIcon size={20} />
            </button>
          </Tooltip>
          <Tooltip content="Add Edge">
            <button 
              className={`text-gray-700 hover:text-primary p-2 rounded-full ${mode === 'addEdge' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
              onClick={() => {
                if (mode === 'addEdge') {
                  setMode('select');
                  setSourceNode(null);
                } else {
                  setMode('addEdge');
                  setSourceNode(null);
                }
              }}
              aria-label="Add Edge"
            >
              <LinkIcon size={20} />
            </button>
          </Tooltip>
          <Tooltip content="Delete Selected">
            <button 
              className={`text-gray-700 hover:text-status-error p-2 rounded-full ${mode === 'delete' ? 'bg-status-error text-white' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
              onClick={() => setMode(mode === 'delete' ? 'select' : 'delete')}
              aria-label="Delete Selected"
            >
              <Trash2Icon size={20} />
            </button>
          </Tooltip>
          <Tooltip content="Clear All">
            <button 
              className="text-gray-700 hover:text-primary p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              onClick={clearGraph}
              aria-label="Clear All"
            >
              <RefreshCwIcon size={20} />
            </button>
          </Tooltip>
        </div>
        
        {/* Source node selection indicator */}
        {mode === 'addEdge' && sourceNode && (
          <div className="absolute top-4 left-4 bg-white p-2 rounded-md shadow-md">
            <p className="text-sm">Select target node for edge from <span className="font-bold">{sourceNode.label}</span></p>
            <button 
              className="text-xs text-primary hover:text-blue-700 mt-1"
              onClick={() => setSourceNode(null)}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
      
      {/* Graph representation type toggle */}
      <div className="mt-4 flex justify-end">
        <div className="bg-gray-100 rounded-lg p-1 inline-flex">
          <button 
            className={`px-3 py-1 rounded-md text-sm font-medium ${representation === 'adjacencyList' ? 'bg-white shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
            onClick={() => onRepresentationChange('adjacencyList')}
          >
            Adjacency List
          </button>
          <button 
            className={`px-3 py-1 rounded-md text-sm font-medium ${representation === 'adjacencyMatrix' ? 'bg-white shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
            onClick={() => onRepresentationChange('adjacencyMatrix')}
          >
            Adjacency Matrix
          </button>
        </div>
      </div>
    </div>
  );
}
