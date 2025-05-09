import { Node, Edge, Graph } from "@shared/schema";
import { v4 as uuidv4 } from "uuid";

// Generate a unique ID for new nodes/edges
export function generateId(): string {
  return uuidv4();
}

// Create a new node with default values
export function createNode(label: string, x?: number, y?: number): Node {
  return {
    id: generateId(),
    label,
    x: x ?? Math.random() * 800,
    y: y ?? Math.random() * 600,
    color: "#3B82F6" // Default color (primary blue)
  };
}

// Create a new edge between two nodes
export function createEdge(sourceId: string, targetId: string, weight: number = 1): Edge {
  return {
    id: generateId(),
    source: sourceId,
    target: targetId,
    weight,
    label: weight !== 1 ? weight.toString() : undefined
  };
}

// Create a new empty graph
export function createEmptyGraph(name: string, description?: string): Graph {
  return {
    id: generateId(),
    name,
    description,
    nodes: [],
    edges: [],
    representation: "adjacencyList"
  };
}

// Convert adjacency list to adjacency matrix
export function adjacencyListToMatrix(graph: Graph): number[][] {
  const { nodes, edges } = graph;
  const matrix: number[][] = [];
  
  // Initialize matrix with zeros
  for (let i = 0; i < nodes.length; i++) {
    matrix[i] = new Array(nodes.length).fill(0);
  }
  
  // Create a mapping from node IDs to matrix indices
  const nodeIndexMap: Record<string, number> = {};
  nodes.forEach((node, index) => {
    nodeIndexMap[node.id] = index;
  });
  
  // Fill in the matrix based on edges
  edges.forEach(edge => {
    const sourceIndex = nodeIndexMap[edge.source];
    const targetIndex = nodeIndexMap[edge.target];
    const weight = edge.weight || 1;
    
    matrix[sourceIndex][targetIndex] = weight;
    // For undirected graphs, set both directions
    matrix[targetIndex][sourceIndex] = weight;
  });
  
  return matrix;
}

// Convert adjacency matrix to adjacency list representation
export function matrixToAdjacencyList(matrix: number[][], nodes: Node[]): Edge[] {
  const edges: Edge[] = [];
  
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      // If there's an edge (weight > 0) and we haven't already added the reverse edge
      if (matrix[i][j] > 0 && i < j) {
        edges.push(createEdge(nodes[i].id, nodes[j].id, matrix[i][j]));
      }
    }
  }
  
  return edges;
}

// Get node by ID
export function getNodeById(graph: Graph, nodeId: string): Node | undefined {
  return graph.nodes.find(node => node.id === nodeId);
}

// Get edge by source and target
export function getEdge(graph: Graph, sourceId: string, targetId: string): Edge | undefined {
  return graph.edges.find(edge => 
    (edge.source === sourceId && edge.target === targetId) || 
    (edge.source === targetId && edge.target === sourceId)
  );
}

// Check if edge exists between two nodes
export function hasEdge(graph: Graph, sourceId: string, targetId: string): boolean {
  return graph.edges.some(edge => 
    (edge.source === sourceId && edge.target === targetId) || 
    (edge.source === targetId && edge.target === sourceId)
  );
}

// Add node to graph
export function addNode(graph: Graph, node: Node): Graph {
  return {
    ...graph,
    nodes: [...graph.nodes, node]
  };
}

// Add edge to graph
export function addEdge(graph: Graph, edge: Edge): Graph {
  // Check if edge already exists
  if (hasEdge(graph, edge.source, edge.target)) {
    return graph;
  }
  
  return {
    ...graph,
    edges: [...graph.edges, edge]
  };
}

// Remove node from graph (and all connected edges)
export function removeNode(graph: Graph, nodeId: string): Graph {
  const filteredNodes = graph.nodes.filter(node => node.id !== nodeId);
  const filteredEdges = graph.edges.filter(edge => 
    edge.source !== nodeId && edge.target !== nodeId
  );
  
  return {
    ...graph,
    nodes: filteredNodes,
    edges: filteredEdges
  };
}

// Remove edge from graph
export function removeEdge(graph: Graph, edgeId: string): Graph {
  return {
    ...graph,
    edges: graph.edges.filter(edge => edge.id !== edgeId)
  };
}

// Update node properties
export function updateNode(graph: Graph, nodeId: string, updates: Partial<Node>): Graph {
  return {
    ...graph,
    nodes: graph.nodes.map(node =>
      node.id === nodeId ? { ...node, ...updates } : node
    )
  };
}

// Update edge properties
export function updateEdge(graph: Graph, edgeId: string, updates: Partial<Edge>): Graph {
  return {
    ...graph,
    edges: graph.edges.map(edge =>
      edge.id === edgeId ? { ...edge, ...updates } : edge
    )
  };
}

// Get neighbors of a node
export function getNeighbors(graph: Graph, nodeId: string): Node[] {
  const neighborIds = new Set<string>();
  
  graph.edges.forEach(edge => {
    if (edge.source === nodeId) {
      neighborIds.add(edge.target);
    } else if (edge.target === nodeId) {
      neighborIds.add(edge.source);
    }
  });
  
  return graph.nodes.filter(node => neighborIds.has(node.id));
}

// Get all edges connected to a node
export function getConnectedEdges(graph: Graph, nodeId: string): Edge[] {
  return graph.edges.filter(edge => 
    edge.source === nodeId || edge.target === nodeId
  );
}

// Create a sample graph for testing
export function createSampleGraph(): Graph {
  const nodes = [
    createNode("A", 150, 100),
    createNode("B", 250, 200),
    createNode("C", 350, 100),
    createNode("D", 350, 300),
    createNode("E", 150, 300)
  ];
  
  const edges = [
    createEdge(nodes[0].id, nodes[1].id),
    createEdge(nodes[1].id, nodes[2].id),
    createEdge(nodes[1].id, nodes[3].id),
    createEdge(nodes[3].id, nodes[4].id),
    createEdge(nodes[4].id, nodes[0].id)
  ];
  
  return {
    id: generateId(),
    name: "Sample Graph",
    description: "A simple undirected graph with 5 nodes",
    nodes,
    edges,
    representation: "adjacencyList"
  };
}
