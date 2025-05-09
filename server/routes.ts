import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { graphSchema, algorithmResultSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for graph operations
  
  // Get all graphs
  app.get("/api/graphs", async (req, res) => {
    try {
      const graphs = await storage.getAllGraphs();
      res.json(graphs);
    } catch (error) {
      console.error("Error getting graphs:", error);
      res.status(500).json({ message: "Failed to get graphs" });
    }
  });

  // Get a specific graph by ID
  app.get("/api/graphs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const graph = await storage.getGraph(id);
      
      if (!graph) {
        return res.status(404).json({ message: "Graph not found" });
      }
      
      res.json(graph);
    } catch (error) {
      console.error("Error getting graph:", error);
      res.status(500).json({ message: "Failed to get graph" });
    }
  });

  // Create a new graph
  app.post("/api/graphs", async (req, res) => {
    try {
      const body = req.body;
      
      // Validate the request body
      const data = graphSchema.parse(body.data);
      
      const graph = await storage.createGraph({
        name: body.name,
        description: body.description || "",
        data: body.data,
        userId: body.userId,
        createdAt: new Date().toISOString()
      });
      
      res.status(201).json(graph);
    } catch (error) {
      console.error("Error creating graph:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid graph data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create graph" });
    }
  });

  // Update an existing graph
  app.patch("/api/graphs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const body = req.body;
      
      const graph = await storage.getGraph(id);
      if (!graph) {
        return res.status(404).json({ message: "Graph not found" });
      }
      
      // Validate the request body if data is provided
      if (body.data) {
        graphSchema.parse(body.data);
      }
      
      const updatedGraph = await storage.updateGraph(id, {
        name: body.name,
        description: body.description,
        data: body.data,
        userId: body.userId
      });
      
      res.json(updatedGraph);
    } catch (error) {
      console.error("Error updating graph:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid graph data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update graph" });
    }
  });

  // Delete a graph
  app.delete("/api/graphs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const graph = await storage.getGraph(id);
      if (!graph) {
        return res.status(404).json({ message: "Graph not found" });
      }
      
      const success = await storage.deleteGraph(id);
      
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete graph" });
      }
    } catch (error) {
      console.error("Error deleting graph:", error);
      res.status(500).json({ message: "Failed to delete graph" });
    }
  });

  // Execute algorithm on a graph
  app.post("/api/graphs/:id/execute", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { algorithm, startNodeId, targetNodeId } = req.body;
      
      if (!algorithm || !startNodeId) {
        return res.status(400).json({ message: "Algorithm and startNodeId are required" });
      }
      
      const graph = await storage.getGraph(id);
      if (!graph) {
        return res.status(404).json({ message: "Graph not found" });
      }
      
      const result = await storage.executeAlgorithm(id, algorithm, startNodeId, targetNodeId);
      
      res.json(result);
    } catch (error) {
      console.error("Error executing algorithm:", error);
      res.status(500).json({ message: `Failed to execute algorithm: ${(error as Error).message}` });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
