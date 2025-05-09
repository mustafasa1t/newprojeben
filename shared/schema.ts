import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define Node type
export const nodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  x: z.number().optional(),
  y: z.number().optional(),
  color: z.string().optional(),
});

export type Node = z.infer<typeof nodeSchema>;

// Define Edge type
export const edgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  weight: z.number().optional(),
  label: z.string().optional(),
});

export type Edge = z.infer<typeof edgeSchema>;

// Define Graph structure with nodes and edges
export const graphSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
  representation: z.enum(["adjacencyList", "adjacencyMatrix"]),
});

export type Graph = z.infer<typeof graphSchema>;

// Define algorithm execution step
export const algorithmStepSchema = z.object({
  step: z.number(),
  visited: z.array(z.string()),
  current: z.string().optional(),
  queue: z.array(z.string()).optional(),
  stack: z.array(z.string()).optional(),
  distances: z.record(z.string(), z.number()).optional(),
  path: z.array(z.string()).optional(),
  description: z.string(),
});

export type AlgorithmStep = z.infer<typeof algorithmStepSchema>;

// Define algorithm execution result
export const algorithmResultSchema = z.object({
  algorithm: z.enum(["bfs", "dfs", "dijkstra", "astar"]),
  startNode: z.string(),
  targetNode: z.string().optional(),
  steps: z.array(algorithmStepSchema),
  executionTime: z.number(),
  timeComplexity: z.string(),
  spaceComplexity: z.string(),
});

export type AlgorithmResult = z.infer<typeof algorithmResultSchema>;

// Database Tables
export const graphs = pgTable("graphs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  data: jsonb("data").notNull(),
  userId: text("user_id"),
  createdAt: text("created_at").notNull(),
});

export const insertGraphSchema = createInsertSchema(graphs).omit({
  id: true,
});

export type InsertGraph = z.infer<typeof insertGraphSchema>;
export type GraphRecord = typeof graphs.$inferSelect;

// Define types for the users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
