import { Node, Edge, AlgorithmStep, AlgorithmResult } from "@shared/schema";

type AdjacencyList = Record<string, { nodeId: string, weight: number }[]>;

// Create adjacency list representation from nodes and edges
export function createAdjacencyList(nodes: Node[], edges: Edge[]): AdjacencyList {
  const adjacencyList: AdjacencyList = {};
  
  // Initialize empty lists for all nodes
  nodes.forEach(node => {
    adjacencyList[node.id] = [];
  });
  
  // Add all edges to the adjacency list
  edges.forEach(edge => {
    const weight = edge.weight || 1;
    adjacencyList[edge.source].push({ nodeId: edge.target, weight });
    
    // For undirected graphs, add reverse edge
    adjacencyList[edge.target].push({ nodeId: edge.source, weight });
  });
  
  return adjacencyList;
}

// Create adjacency matrix representation from nodes and edges
export function createAdjacencyMatrix(nodes: Node[], edges: Edge[]): number[][] {
  const nodeIdToIndex: Record<string, number> = {};
  
  // Create mapping from node IDs to matrix indices
  nodes.forEach((node, index) => {
    nodeIdToIndex[node.id] = index;
  });
  
  // Initialize matrix with zeros
  const matrix: number[][] = Array(nodes.length).fill(0).map(() => Array(nodes.length).fill(0));
  
  // Fill matrix with edge weights
  edges.forEach(edge => {
    const sourceIndex = nodeIdToIndex[edge.source];
    const targetIndex = nodeIdToIndex[edge.target];
    const weight = edge.weight || 1;
    
    matrix[sourceIndex][targetIndex] = weight;
    
    // For undirected graphs, add symmetric edge
    matrix[targetIndex][sourceIndex] = weight;
  });
  
  return matrix;
}

// Client-side implementations of graph algorithms

// Breadth-First Search (BFS)
export function executeBFS(
  nodes: Node[],
  edges: Edge[],
  startNodeId: string,
  targetNodeId?: string
): AlgorithmResult {
  const adjacencyList = createAdjacencyList(nodes, edges);
  const visited: Set<string> = new Set();
  const queue: string[] = [startNodeId];
  visited.add(startNodeId);
  
  const steps: AlgorithmStep[] = [];
  let step = 0;
  
  // Add initial step
  steps.push({
    step: step++,
    visited: Array.from(visited),
    current: startNodeId,
    queue: [...queue],
    description: `Starting BFS from node ${startNodeId}`
  });
  
  while (queue.length > 0) {
    const currentNode = queue.shift()!;
    
    // Check if we reached the target
    if (targetNodeId && currentNode === targetNodeId) {
      steps.push({
        step: step++,
        visited: Array.from(visited),
        current: currentNode,
        queue: [...queue],
        description: `Target node ${targetNodeId} reached!`
      });
      break;
    }
    
    // Process neighbors
    for (const { nodeId } of adjacencyList[currentNode]) {
      if (!visited.has(nodeId)) {
        visited.add(nodeId);
        queue.push(nodeId);
        
        steps.push({
          step: step++,
          visited: Array.from(visited),
          current: currentNode,
          queue: [...queue],
          description: `Visiting node ${currentNode}, discovered neighbor ${nodeId}`
        });
      }
    }
    
    if (queue.length > 0) {
      steps.push({
        step: step++,
        visited: Array.from(visited),
        current: queue[0],
        queue: [...queue],
        description: `Moving to next node in queue: ${queue[0]}`
      });
    }
  }
  
  const executionTime = 0; // This would be measured in a real execution
  
  return {
    algorithm: "bfs",
    startNode: startNodeId,
    targetNode: targetNodeId,
    steps,
    executionTime,
    timeComplexity: "O(V + E)",
    spaceComplexity: "O(V)"
  };
}

// Depth-First Search (DFS)
export function executeDFS(
  nodes: Node[],
  edges: Edge[],
  startNodeId: string,
  targetNodeId?: string
): AlgorithmResult {
  const adjacencyList = createAdjacencyList(nodes, edges);
  const visited: Set<string> = new Set();
  const stack: string[] = [startNodeId];
  
  const steps: AlgorithmStep[] = [];
  let step = 0;
  
  // Add initial step
  steps.push({
    step: step++,
    visited: Array.from(visited),
    current: startNodeId,
    stack: [...stack],
    description: `Starting DFS from node ${startNodeId}`
  });
  
  while (stack.length > 0) {
    const currentNode = stack.pop()!;
    
    if (!visited.has(currentNode)) {
      visited.add(currentNode);
      
      steps.push({
        step: step++,
        visited: Array.from(visited),
        current: currentNode,
        stack: [...stack],
        description: `Visiting node ${currentNode}`
      });
      
      // Check if we reached the target
      if (targetNodeId && currentNode === targetNodeId) {
        steps.push({
          step: step++,
          visited: Array.from(visited),
          current: currentNode,
          stack: [...stack],
          description: `Target node ${targetNodeId} reached!`
        });
        break;
      }
      
      // Process neighbors in reverse order to maintain expected DFS order
      const neighbors = [...adjacencyList[currentNode]].reverse();
      for (const { nodeId } of neighbors) {
        if (!visited.has(nodeId)) {
          stack.push(nodeId);
          
          steps.push({
            step: step++,
            visited: Array.from(visited),
            current: currentNode,
            stack: [...stack],
            description: `Adding neighbor ${nodeId} to stack`
          });
        }
      }
    }
  }
  
  const executionTime = 0; // This would be measured in a real execution
  
  return {
    algorithm: "dfs",
    startNode: startNodeId,
    targetNode: targetNodeId,
    steps,
    executionTime,
    timeComplexity: "O(V + E)",
    spaceComplexity: "O(V)"
  };
}

// Dijkstra's Algorithm
export function executeDijkstra(
  nodes: Node[],
  edges: Edge[],
  startNodeId: string,
  targetNodeId?: string
): AlgorithmResult {
  const adjacencyList = createAdjacencyList(nodes, edges);
  
  // Initialize distances and previous nodes
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const unvisited: Set<string> = new Set();
  
  // Set initial distances to Infinity
  nodes.forEach(node => {
    distances[node.id] = Infinity;
    previous[node.id] = null;
    unvisited.add(node.id);
  });
  
  // Distance to start node is 0
  distances[startNodeId] = 0;
  
  const steps: AlgorithmStep[] = [];
  let step = 0;
  
  // Add initial step
  steps.push({
    step: step++,
    visited: [],
    current: startNodeId,
    distances: { ...distances },
    description: `Starting Dijkstra's algorithm from node ${startNodeId}`
  });
  
  // Main loop
  while (unvisited.size > 0) {
    // Find node with smallest distance
    let currentNode: string | null = null;
    let shortestDistance = Infinity;
    
    for (const nodeId of unvisited) {
      if (distances[nodeId] < shortestDistance) {
        shortestDistance = distances[nodeId];
        currentNode = nodeId;
      }
    }
    
    // If we can't find a node or all remaining nodes are unreachable
    if (!currentNode || shortestDistance === Infinity) break;
    
    // If we found the target, we're done
    if (targetNodeId && currentNode === targetNodeId) {
      unvisited.delete(currentNode);
      
      // Construct path
      const path: string[] = [];
      let current: string | null = currentNode;
      while (current !== null) {
        path.unshift(current);
        current = previous[current];
      }
      
      steps.push({
        step: step++,
        visited: nodes.map(n => n.id).filter(id => !unvisited.has(id)),
        current: currentNode,
        distances: { ...distances },
        path,
        description: `Target node ${targetNodeId} reached with shortest distance ${distances[currentNode]}`
      });
      
      break;
    }
    
    // Remove from unvisited
    unvisited.delete(currentNode);
    
    // Update distances to neighbors
    for (const { nodeId, weight } of adjacencyList[currentNode]) {
      if (unvisited.has(nodeId)) {
        const newDistance = distances[currentNode] + weight;
        
        if (newDistance < distances[nodeId]) {
          distances[nodeId] = newDistance;
          previous[nodeId] = currentNode;
          
          steps.push({
            step: step++,
            visited: nodes.map(n => n.id).filter(id => !unvisited.has(id)),
            current: currentNode,
            distances: { ...distances },
            description: `Updated distance to node ${nodeId} to ${newDistance}`
          });
        }
      }
    }
    
    // Find next node to process
    let nextNode: string | null = null;
    shortestDistance = Infinity;
    
    for (const nodeId of unvisited) {
      if (distances[nodeId] < shortestDistance) {
        shortestDistance = distances[nodeId];
        nextNode = nodeId;
      }
    }
    
    if (nextNode) {
      steps.push({
        step: step++,
        visited: nodes.map(n => n.id).filter(id => !unvisited.has(id)),
        current: nextNode,
        distances: { ...distances },
        description: `Moving to node ${nextNode} with current distance ${distances[nextNode]}`
      });
    }
  }
  
  // Construct final step with path if target was specified
  if (targetNodeId && previous[targetNodeId] !== undefined) {
    const path: string[] = [];
    let current: string | null = targetNodeId;
    
    while (current !== null) {
      path.unshift(current);
      current = previous[current];
    }
    
    if (steps[steps.length - 1].path === undefined) {
      steps.push({
        step: step++,
        visited: nodes.map(n => n.id).filter(id => !unvisited.has(id)),
        current: targetNodeId,
        distances: { ...distances },
        path,
        description: `Final shortest path to ${targetNodeId}: ${path.join(' -> ')}`
      });
    }
  }
  
  const executionTime = 0; // This would be measured in a real execution
  
  return {
    algorithm: "dijkstra",
    startNode: startNodeId,
    targetNode: targetNodeId,
    steps,
    executionTime,
    timeComplexity: "O(V² + E)",
    spaceComplexity: "O(V)"
  };
}

// A* Search Algorithm
export function executeAStar(
  nodes: Node[],
  edges: Edge[],
  startNodeId: string,
  targetNodeId?: string
): AlgorithmResult {
  if (!targetNodeId) {
    throw new Error("A* search requires a target node");
  }
  
  const adjacencyList = createAdjacencyList(nodes, edges);
  
  // Get coordinates for heuristic calculation
  const nodeMap: Record<string, Node> = {};
  nodes.forEach(node => {
    nodeMap[node.id] = node;
  });
  
  // Initialize open and closed sets
  const openSet: Set<string> = new Set([startNodeId]);
  const closedSet: Set<string> = new Set();
  
  // Track g-scores (distance from start) and f-scores (g-score + heuristic)
  const gScore: Record<string, number> = {};
  const fScore: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  
  // Initialize all nodes with infinite scores
  nodes.forEach(node => {
    gScore[node.id] = Infinity;
    fScore[node.id] = Infinity;
    previous[node.id] = null;
  });
  
  // Start node has zero distance from itself
  gScore[startNodeId] = 0;
  
  // Estimate distance to target using Manhattan distance heuristic
  const getHeuristic = (nodeId: string) => {
    const node = nodeMap[nodeId];
    const target = nodeMap[targetNodeId];
    
    // If coordinates are not available, use a simple count (1)
    if (!node.x || !node.y || !target.x || !target.y) {
      return 1;
    }
    
    // Manhattan distance
    return Math.abs(node.x - target.x) + Math.abs(node.y - target.y);
  };
  
  // Calculate initial f-score for start node
  fScore[startNodeId] = getHeuristic(startNodeId);
  
  const steps: AlgorithmStep[] = [];
  let step = 0;
  
  // Initial step
  steps.push({
    step: step++,
    visited: Array.from(closedSet),
    current: startNodeId,
    distances: { ...gScore },
    description: `Starting A* search from node ${startNodeId} to target ${targetNodeId}`
  });
  
  // Main loop
  while (openSet.size > 0) {
    // Find node in openSet with lowest f-score
    let currentNode: string | null = null;
    let lowestFScore = Infinity;
    
    for (const nodeId of openSet) {
      if (fScore[nodeId] < lowestFScore) {
        lowestFScore = fScore[nodeId];
        currentNode = nodeId;
      }
    }
    
    if (!currentNode) break;
    
    // If we found the target, reconstruct the path
    if (currentNode === targetNodeId) {
      const path: string[] = [];
      let current: string | null = currentNode;
      
      while (current !== null) {
        path.unshift(current);
        current = previous[current];
      }
      
      steps.push({
        step: step++,
        visited: Array.from(closedSet),
        current: currentNode,
        distances: { ...gScore },
        path,
        description: `Target node ${targetNodeId} reached! Path found with cost ${gScore[currentNode]}`
      });
      
      break;
    }
    
    // Move current node from openSet to closedSet
    openSet.delete(currentNode);
    closedSet.add(currentNode);
    
    // Process neighbors
    for (const { nodeId, weight } of adjacencyList[currentNode]) {
      // Skip if already evaluated
      if (closedSet.has(nodeId)) continue;
      
      // Calculate tentative g-score
      const tentativeGScore = gScore[currentNode] + weight;
      
      // Add to open set if not there
      if (!openSet.has(nodeId)) {
        openSet.add(nodeId);
      } 
      // Skip if not a better path
      else if (tentativeGScore >= gScore[nodeId]) {
        continue;
      }
      
      // This is the best path so far
      previous[nodeId] = currentNode;
      gScore[nodeId] = tentativeGScore;
      fScore[nodeId] = gScore[nodeId] + getHeuristic(nodeId);
      
      steps.push({
        step: step++,
        visited: Array.from(closedSet),
        current: currentNode,
        distances: { ...gScore },
        description: `Updated node ${nodeId} with g-score: ${gScore[nodeId]}, f-score: ${fScore[nodeId]}`
      });
    }
    
    // Find next node to process
    let nextNode: string | null = null;
    lowestFScore = Infinity;
    
    for (const nodeId of openSet) {
      if (fScore[nodeId] < lowestFScore) {
        lowestFScore = fScore[nodeId];
        nextNode = nodeId;
      }
    }
    
    if (nextNode) {
      steps.push({
        step: step++,
        visited: Array.from(closedSet),
        current: nextNode,
        distances: { ...gScore },
        description: `Moving to node ${nextNode} with f-score ${fScore[nextNode]}`
      });
    }
  }
  
  // If we couldn't find a path
  if (!closedSet.has(targetNodeId)) {
    steps.push({
      step: step++,
      visited: Array.from(closedSet),
      current: null,
      distances: { ...gScore },
      description: `No path found from ${startNodeId} to ${targetNodeId}`
    });
  }
  
  const executionTime = 0; // This would be measured in a real execution
  
  return {
    algorithm: "astar",
    startNode: startNodeId,
    targetNode: targetNodeId,
    steps,
    executionTime,
    timeComplexity: "O(E log V)",
    spaceComplexity: "O(V)"
  };
}
