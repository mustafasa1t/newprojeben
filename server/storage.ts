import { 
  User, 
  InsertUser, 
  users, 
  GraphRecord, 
  InsertGraph, 
  graphs, 
  Graph, 
  Node, 
  Edge,
  AlgorithmResult
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// Storage interface for CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Graph operations
  getAllGraphs(): Promise<GraphRecord[]>;
  getGraph(id: number): Promise<GraphRecord | undefined>;
  createGraph(graph: InsertGraph): Promise<GraphRecord>;
  updateGraph(id: number, graph: Partial<InsertGraph>): Promise<GraphRecord | undefined>;
  deleteGraph(id: number): Promise<boolean>;
  
  // Algorithm execution
  executeAlgorithm(
    graphId: number, 
    algorithm: string, 
    startNodeId: string, 
    targetNodeId?: string
  ): Promise<AlgorithmResult>;
}

// In-memory storage implementation (for reference)
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private graphs: Map<number, GraphRecord>;
  private userIdCounter: number;
  private graphIdCounter: number;

  constructor() {
    this.users = new Map();
    this.graphs = new Map();
    this.userIdCounter = 1;
    this.graphIdCounter = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Graph operations
  async getAllGraphs(): Promise<GraphRecord[]> {
    return Array.from(this.graphs.values());
  }

  async getGraph(id: number): Promise<GraphRecord | undefined> {
    return this.graphs.get(id);
  }

  async createGraph(insertGraph: InsertGraph): Promise<GraphRecord> {
    const id = this.graphIdCounter++;
    const createdAt = new Date().toISOString();
    const graph: GraphRecord = { 
      ...insertGraph, 
      id, 
      createdAt,
      description: insertGraph.description ?? null,
      userId: insertGraph.userId ?? null 
    };
    this.graphs.set(id, graph);
    return graph;
  }

  async updateGraph(id: number, updateData: Partial<InsertGraph>): Promise<GraphRecord | undefined> {
    const graph = this.graphs.get(id);
    if (!graph) return undefined;
    
    const updatedGraph = { ...graph, ...updateData };
    this.graphs.set(id, updatedGraph);
    return updatedGraph;
  }

  async deleteGraph(id: number): Promise<boolean> {
    return this.graphs.delete(id);
  }

  // Algorithm execution methods
  async executeAlgorithm(
    graphId: number,
    algorithm: string,
    startNodeId: string,
    targetNodeId?: string
  ): Promise<AlgorithmResult> {
    const graphRecord = await this.getGraph(graphId);
    if (!graphRecord) {
      throw new Error("Graph not found");
    }

    const graphData = graphRecord.data as unknown as Graph;
    const { nodes, edges } = graphData;

    // Create adjacency list
    const adjacencyList = this.createAdjacencyList(nodes, edges);
    
    // Execute selected algorithm
    const startTime = performance.now();
    let result: AlgorithmResult;
    
    switch (algorithm) {
      case "bfs":
        result = this.executeBFS(adjacencyList, nodes, startNodeId, targetNodeId);
        break;
      case "dfs":
        result = this.executeDFS(adjacencyList, nodes, startNodeId, targetNodeId);
        break;
      case "dijkstra":
        result = this.executeDijkstra(adjacencyList, nodes, edges, startNodeId, targetNodeId);
        break;
      case "astar":
        result = this.executeAStar(adjacencyList, nodes, edges, startNodeId, targetNodeId);
        break;
      default:
        throw new Error(`Unsupported algorithm: ${algorithm}`);
    }
    
    const endTime = performance.now();
    result.executionTime = endTime - startTime;
    
    return result;
  }

  // Helper method to create adjacency list from nodes and edges
  private createAdjacencyList(nodes: Node[], edges: Edge[]): Record<string, { nodeId: string, weight: number }[]> {
    const adjacencyList: Record<string, { nodeId: string, weight: number }[]> = {};
    
    // Initialize empty adjacency lists for all nodes
    nodes.forEach(node => {
      adjacencyList[node.id] = [];
    });
    
    // Add edges to adjacency list
    edges.forEach(edge => {
      const weight = edge.weight || 1;
      adjacencyList[edge.source].push({ nodeId: edge.target, weight });
      
      // For undirected graphs, add reverse edge as well
      adjacencyList[edge.target].push({ nodeId: edge.source, weight });
    });
    
    return adjacencyList;
  }

  // BFS implementation
  private executeBFS(
    adjacencyList: Record<string, { nodeId: string, weight: number }[]>,
    nodes: Node[],
    startNodeId: string,
    targetNodeId?: string
  ): AlgorithmResult {
    const visited: Set<string> = new Set();
    const queue: string[] = [startNodeId];
    visited.add(startNodeId);
    
    const steps = [];
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
    
    return {
      algorithm: "bfs",
      startNode: startNodeId,
      targetNode: targetNodeId,
      steps,
      executionTime: 0, // Will be set later
      timeComplexity: "O(V + E)",
      spaceComplexity: "O(V)"
    };
  }

  // DFS implementation
  private executeDFS(
    adjacencyList: Record<string, { nodeId: string, weight: number }[]>,
    nodes: Node[],
    startNodeId: string,
    targetNodeId?: string
  ): AlgorithmResult {
    const visited: Set<string> = new Set();
    const stack: string[] = [startNodeId];
    
    const steps = [];
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
    
    return {
      algorithm: "dfs",
      startNode: startNodeId,
      targetNode: targetNodeId,
      steps,
      executionTime: 0, // Will be set later
      timeComplexity: "O(V + E)",
      spaceComplexity: "O(V)"
    };
  }

  // Dijkstra implementation
  private executeDijkstra(
    adjacencyList: Record<string, { nodeId: string, weight: number }[]>,
    nodes: Node[],
    edges: Edge[],
    startNodeId: string,
    targetNodeId?: string
  ): AlgorithmResult {
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
    
    const steps = [];
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
    
    return {
      algorithm: "dijkstra",
      startNode: startNodeId,
      targetNode: targetNodeId,
      steps,
      executionTime: 0, // Will be set later
      timeComplexity: "O(V² + E)",
      spaceComplexity: "O(V)"
    };
  }

  // A* implementation
  private executeAStar(
    adjacencyList: Record<string, { nodeId: string, weight: number }[]>,
    nodes: Node[],
    edges: Edge[],
    startNodeId: string,
    targetNodeId?: string
  ): AlgorithmResult {
    if (!targetNodeId) {
      throw new Error("A* search requires a target node");
    }
    
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
    
    const steps = [];
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
    
    return {
      algorithm: "astar",
      startNode: startNodeId,
      targetNode: targetNodeId,
      steps,
      executionTime: 0, // Will be set later
      timeComplexity: "O(E log V)",
      spaceComplexity: "O(V)"
    };
  }
}

// DatabaseStorage implementation
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Graph operations
  async getAllGraphs(): Promise<GraphRecord[]> {
    return await db.select().from(graphs);
  }

  async getGraph(id: number): Promise<GraphRecord | undefined> {
    const [graph] = await db.select().from(graphs).where(eq(graphs.id, id));
    return graph;
  }

  async createGraph(insertGraph: InsertGraph): Promise<GraphRecord> {
    const [graph] = await db
      .insert(graphs)
      .values({
        name: insertGraph.name,
        description: insertGraph.description || null,
        data: insertGraph.data,
        userId: insertGraph.userId || null,
        createdAt: new Date().toISOString()
      })
      .returning();
    return graph;
  }

  async updateGraph(id: number, updateData: Partial<InsertGraph>): Promise<GraphRecord | undefined> {
    const [updatedGraph] = await db
      .update(graphs)
      .set(updateData)
      .where(eq(graphs.id, id))
      .returning();
    return updatedGraph;
  }

  async deleteGraph(id: number): Promise<boolean> {
    const result = await db
      .delete(graphs)
      .where(eq(graphs.id, id));
    return true; // Assuming no error was thrown
  }

  // Helper method to create adjacency list from nodes and edges
  private createAdjacencyList(nodes: Node[], edges: Edge[]): Record<string, { nodeId: string, weight: number }[]> {
    const adjacencyList: Record<string, { nodeId: string, weight: number }[]> = {};
    
    // Initialize empty adjacency lists for all nodes
    nodes.forEach(node => {
      adjacencyList[node.id] = [];
    });
    
    // Add edges to adjacency list
    edges.forEach(edge => {
      const weight = edge.weight || 1;
      adjacencyList[edge.source].push({ nodeId: edge.target, weight });
      
      // For undirected graphs, add reverse edge as well
      adjacencyList[edge.target].push({ nodeId: edge.source, weight });
    });
    
    return adjacencyList;
  }

  // Algorithm execution methods
  async executeAlgorithm(
    graphId: number,
    algorithm: string,
    startNodeId: string,
    targetNodeId?: string
  ): Promise<AlgorithmResult> {
    const graphRecord = await this.getGraph(graphId);
    if (!graphRecord) {
      throw new Error("Graph not found");
    }

    const graphData = graphRecord.data as unknown as Graph;
    const { nodes, edges } = graphData;

    // Create adjacency list
    const adjacencyList = this.createAdjacencyList(nodes, edges);
    
    // Execute selected algorithm
    const startTime = performance.now();
    let result: AlgorithmResult;
    
    switch (algorithm) {
      case "bfs":
        result = this.executeBFS(adjacencyList, nodes, startNodeId, targetNodeId);
        break;
      case "dfs":
        result = this.executeDFS(adjacencyList, nodes, startNodeId, targetNodeId);
        break;
      case "dijkstra":
        result = this.executeDijkstra(adjacencyList, nodes, edges, startNodeId, targetNodeId);
        break;
      case "astar":
        result = this.executeAStar(adjacencyList, nodes, edges, startNodeId, targetNodeId);
        break;
      default:
        throw new Error(`Unsupported algorithm: ${algorithm}`);
    }
    
    const endTime = performance.now();
    result.executionTime = endTime - startTime;
    
    return result;
  }

  // BFS implementation
  private executeBFS(
    adjacencyList: Record<string, { nodeId: string, weight: number }[]>,
    nodes: Node[],
    startNodeId: string,
    targetNodeId?: string
  ): AlgorithmResult {
    const visited: Set<string> = new Set();
    const queue: string[] = [startNodeId];
    visited.add(startNodeId);
    
    const steps = [];
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
    
    return {
      algorithm: "bfs",
      startNode: startNodeId,
      targetNode: targetNodeId,
      steps,
      executionTime: 0, // Will be set later
      timeComplexity: "O(V + E)",
      spaceComplexity: "O(V)"
    };
  }

  // DFS implementation
  private executeDFS(
    adjacencyList: Record<string, { nodeId: string, weight: number }[]>,
    nodes: Node[],
    startNodeId: string,
    targetNodeId?: string
  ): AlgorithmResult {
    const visited: Set<string> = new Set();
    const stack: string[] = [startNodeId];
    
    const steps = [];
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
    
    return {
      algorithm: "dfs",
      startNode: startNodeId,
      targetNode: targetNodeId,
      steps,
      executionTime: 0, // Will be set later
      timeComplexity: "O(V + E)",
      spaceComplexity: "O(V)"
    };
  }

  // Dijkstra implementation
  private executeDijkstra(
    adjacencyList: Record<string, { nodeId: string, weight: number }[]>,
    nodes: Node[],
    edges: Edge[],
    startNodeId: string,
    targetNodeId?: string
  ): AlgorithmResult {
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
    
    const steps = [];
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
      
      // Iterate through unvisited using Array.from to avoid TS error
      Array.from(unvisited).forEach(nodeId => {
        if (distances[nodeId] < shortestDistance) {
          shortestDistance = distances[nodeId];
          currentNode = nodeId;
        }
      });
      
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
      
      // Iterate through unvisited using Array.from to avoid TS error
      Array.from(unvisited).forEach(nodeId => {
        if (distances[nodeId] < shortestDistance) {
          shortestDistance = distances[nodeId];
          nextNode = nodeId;
        }
      });
      
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
    
    return {
      algorithm: "dijkstra",
      startNode: startNodeId,
      targetNode: targetNodeId,
      steps,
      executionTime: 0, // Will be set later
      timeComplexity: "O(V² + E)",
      spaceComplexity: "O(V)"
    };
  }

  // A* implementation
  private executeAStar(
    adjacencyList: Record<string, { nodeId: string, weight: number }[]>,
    nodes: Node[],
    edges: Edge[],
    startNodeId: string,
    targetNodeId?: string
  ): AlgorithmResult {
    if (!targetNodeId) {
      throw new Error("A* search requires a target node");
    }
    
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
      const target = nodeMap[targetNodeId!];
      
      // If coordinates are not available, use a simple count (1)
      if (!node.x || !node.y || !target.x || !target.y) {
        return 1;
      }
      
      // Manhattan distance
      return Math.abs(node.x - target.x) + Math.abs(node.y - target.y);
    };
    
    // Calculate initial f-score for start node
    fScore[startNodeId] = getHeuristic(startNodeId);
    
    const steps = [];
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
      
      // Iterate through openSet using Array.from to avoid TS error
      Array.from(openSet).forEach(nodeId => {
        if (fScore[nodeId] < lowestFScore) {
          lowestFScore = fScore[nodeId];
          currentNode = nodeId;
        }
      });
      
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
      
      // Iterate through openSet using Array.from to avoid TS error
      Array.from(openSet).forEach(nodeId => {
        if (fScore[nodeId] < lowestFScore) {
          lowestFScore = fScore[nodeId];
          nextNode = nodeId;
        }
      });
      
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
        current: undefined, // Changed from null to undefined to match type
        distances: { ...gScore },
        description: `No path found from ${startNodeId} to ${targetNodeId}`
      });
    }
    
    return {
      algorithm: "astar",
      startNode: startNodeId,
      targetNode: targetNodeId,
      steps,
      executionTime: 0, // Will be set later
      timeComplexity: "O(E log V)",
      spaceComplexity: "O(V)"
    };
  }
}

// Use database storage instead of memory storage
export const storage = new DatabaseStorage();
