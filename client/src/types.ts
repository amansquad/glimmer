export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  lastViewedAt: string;
  brightness: number;
}

export interface GraphNode {
  id: string;
  title: string;
  brightness: number;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
