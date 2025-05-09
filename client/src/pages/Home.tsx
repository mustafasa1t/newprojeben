import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GraphCanvas from "@/components/GraphCanvas";
import AlgorithmSelector from "@/components/AlgorithmSelector";
import ExecutionControls from "@/components/ExecutionControls";
import AlgorithmMetrics from "@/components/AlgorithmMetrics";
import { Node, Edge, Graph, AlgorithmResult, AlgorithmStep } from "@shared/schema";
import { createSampleGraph } from "@/lib/graphUtils";
import { executeBFS, executeDFS, executeDijkstra, executeAStar } from "@/lib/algorithms";

export default function Home() {
  // Graph state
  const [graph, setGraph] = useState<Graph>(createSampleGraph());
  const [graphName, setGraphName] = useState<string>("Sample Graph");
  const [graphDescription, setGraphDescription] = useState<string>("A sample graph for testing algorithms");
  const [savedGraphId, setSavedGraphId] = useState<number | null>(null);
  const [representation, setRepresentation] = useState<"adjacencyList" | "adjacencyMatrix">("adjacencyList");
  
  // Algorithm state
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>("bfs");
  const [startNodeId, setStartNodeId] = useState<string | null>(null);
  const [targetNodeId, setTargetNodeId] = useState<string | null>(null);
  const [animationSpeed, setAnimationSpeed] = useState<number>(3);
  
  // Execution state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [algorithmResult, setAlgorithmResult] = useState<AlgorithmResult | undefined>(undefined);
  const [currentVisitedNodes, setCurrentVisitedNodes] = useState<string[]>([]);
  const [currentPathNodes, setCurrentPathNodes] = useState<string[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState<string | undefined>(undefined);
  
  const { toast } = useToast();
  
  // Set default start node when graph changes
  useEffect(() => {
    if (graph.nodes.length > 0 && !startNodeId) {
      setStartNodeId(graph.nodes[0].id);
    }
    
    if (graph.nodes.length > 1 && !targetNodeId) {
      setTargetNodeId(graph.nodes[graph.nodes.length - 1].id);
    }
  }, [graph.nodes, startNodeId, targetNodeId]);
  
  // Save graph mutation
  const saveGraphMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest<{id: number}>('/api/graphs', {
        method: 'POST',
        body: JSON.stringify({
          name: graphName,
          description: graphDescription,
          data: graph
        })
      });
    },
    onSuccess: (data) => {
      setSavedGraphId(data.id);
      toast({
        title: "Graph saved",
        description: `Successfully saved graph "${graphName}" to the database.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to save graph",
        description: error instanceof Error ? error.message : "Unknown error occurred while saving the graph.",
        variant: "destructive"
      });
    }
  });

  // Update graph mutation
  const updateGraphMutation = useMutation({
    mutationFn: async () => {
      if (!savedGraphId) throw new Error("No saved graph ID to update");
      return await apiRequest(`/api/graphs/${savedGraphId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: graphName,
          description: graphDescription,
          data: graph
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Graph updated",
        description: `Successfully updated graph "${graphName}".`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update graph",
        description: error instanceof Error ? error.message : "Unknown error occurred while updating the graph.",
        variant: "destructive"
      });
    }
  });

  // Save graph handler
  const handleSaveGraph = useCallback(() => {
    if (savedGraphId) {
      updateGraphMutation.mutate();
    } else {
      saveGraphMutation.mutate();
    }
  }, [savedGraphId, graph, graphName, graphDescription, saveGraphMutation, updateGraphMutation]);

  // Listen for save graph event
  useEffect(() => {
    const saveGraphListener = () => handleSaveGraph();
    document.addEventListener('saveGraph', saveGraphListener);
    return () => {
      document.removeEventListener('saveGraph', saveGraphListener);
    };
  }, [handleSaveGraph]);

  // Algorithm execution mutation
  const executeMutation = useMutation({
    mutationFn: async ({
      algorithm,
      startNode,
      targetNode
    }: {
      algorithm: string;
      startNode: string;
      targetNode?: string;
    }) => {
      // For quick prototyping, we'll execute the algorithm on the client side
      // In a production app, this would be a server request to execute on the backend
      
      let result: AlgorithmResult;
      const startTime = performance.now();
      
      switch (algorithm) {
        case "bfs":
          result = executeBFS(graph.nodes, graph.edges, startNode, targetNode);
          break;
        case "dfs":
          result = executeDFS(graph.nodes, graph.edges, startNode, targetNode);
          break;
        case "dijkstra":
          result = executeDijkstra(graph.nodes, graph.edges, startNode, targetNode);
          break;
        case "astar":
          result = executeAStar(graph.nodes, graph.edges, startNode, targetNode);
          break;
        default:
          throw new Error(`Unknown algorithm: ${algorithm}`);
      }
      
      const endTime = performance.now();
      result.executionTime = endTime - startTime;
      
      return result;
    },
    onSuccess: (data) => {
      setAlgorithmResult(data);
      setCurrentStepIndex(0);
      updateVisualizationForStep(data.steps[0]);
      
      // Automatically start animation if not in step mode
      if (!isPaused) {
        setIsRunning(true);
      }
    },
    onError: (error) => {
      toast({
        title: "Algorithm execution failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
      setIsRunning(false);
      setIsPaused(false);
    }
  });
  
  // Animation interval for algorithm steps
  useEffect(() => {
    if (!isRunning || !algorithmResult || isPaused) return;
    
    const speed = 1000 / animationSpeed;
    const timer = setInterval(() => {
      setCurrentStepIndex(prevIndex => {
        const nextIndex = prevIndex + 1;
        
        if (nextIndex >= algorithmResult.steps.length) {
          setIsRunning(false);
          return prevIndex;
        }
        
        updateVisualizationForStep(algorithmResult.steps[nextIndex]);
        return nextIndex;
      });
    }, speed);
    
    return () => clearInterval(timer);
  }, [isRunning, isPaused, algorithmResult, animationSpeed]);
  
  // Update visualization based on current step
  const updateVisualizationForStep = useCallback((step: AlgorithmStep) => {
    setCurrentVisitedNodes(step.visited || []);
    setCurrentPathNodes(step.path || []);
    setCurrentNodeId(step.current);
  }, []);
  
  // Controls for algorithm execution
  const startExecution = () => {
    if (!startNodeId) {
      toast({
        title: "Missing start node",
        description: "Please select a start node",
        variant: "destructive"
      });
      return;
    }
    
    if ((selectedAlgorithm === "dijkstra" || selectedAlgorithm === "astar") && !targetNodeId) {
      toast({
        title: "Missing target node",
        description: `${selectedAlgorithm === "dijkstra" ? "Dijkstra" : "A*"} requires a target node`,
        variant: "destructive"
      });
      return;
    }
    
    if (isPaused && algorithmResult) {
      // Resume
      setIsPaused(false);
      setIsRunning(true);
    } else {
      // Start new execution
      setIsRunning(true);
      setIsPaused(false);
      executeMutation.mutate({
        algorithm: selectedAlgorithm,
        startNode: startNodeId,
        targetNode: targetNodeId || undefined
      });
    }
  };
  
  const pauseExecution = () => {
    setIsPaused(true);
  };
  
  const stopExecution = () => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentStepIndex(-1);
    setCurrentVisitedNodes([]);
    setCurrentPathNodes([]);
    setCurrentNodeId(undefined);
    setAlgorithmResult(undefined);
  };
  
  const stepBackward = () => {
    if (!algorithmResult || currentStepIndex <= 0) return;
    
    const newIndex = currentStepIndex - 1;
    setCurrentStepIndex(newIndex);
    updateVisualizationForStep(algorithmResult.steps[newIndex]);
  };
  
  const stepForward = () => {
    if (!algorithmResult || currentStepIndex >= algorithmResult.steps.length - 1) return;
    
    const newIndex = currentStepIndex + 1;
    setCurrentStepIndex(newIndex);
    updateVisualizationForStep(algorithmResult.steps[newIndex]);
  };
  
  // Get current step for metrics display
  const currentStep = algorithmResult && currentStepIndex >= 0 
    ? algorithmResult.steps[currentStepIndex] 
    : undefined;
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-6 flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
        {/* Graph Canvas */}
        <GraphCanvas 
          graph={graph}
          onGraphChange={setGraph}
          currentNodeId={currentNodeId}
          visitedNodes={currentVisitedNodes}
          pathNodes={currentPathNodes}
          isExecuting={isRunning || isPaused}
          representation={representation}
          onRepresentationChange={setRepresentation}
        />
        
        {/* Controls Panel */}
        <div className="md:w-96 space-y-6 flex flex-col">
          <AlgorithmSelector 
            nodes={graph.nodes}
            selectedAlgorithm={selectedAlgorithm}
            startNode={startNodeId}
            targetNode={targetNodeId}
            animationSpeed={animationSpeed}
            onAlgorithmChange={setSelectedAlgorithm}
            onStartNodeChange={setStartNodeId}
            onTargetNodeChange={setTargetNodeId}
            onAnimationSpeedChange={setAnimationSpeed}
            disabled={isRunning}
          />
          
          <ExecutionControls 
            isRunning={isRunning}
            isPaused={isPaused}
            canStepBackward={!!algorithmResult && currentStepIndex > 0}
            canStepForward={!!algorithmResult && currentStepIndex < (algorithmResult.steps.length - 1)}
            onStart={startExecution}
            onPause={pauseExecution}
            onStop={stopExecution}
            onStepBackward={stepBackward}
            onStepForward={stepForward}
            disabled={executeMutation.isPending || (graph.nodes.length === 0)}
          />
          
          <AlgorithmMetrics 
            result={algorithmResult}
            currentStep={currentStep}
            currentStepIndex={currentStepIndex}
            totalSteps={algorithmResult?.steps.length || 0}
          />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
