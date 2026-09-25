// ─────────────────────────────────────────────────────────────────────────────
// EduEye — Prerequisite Knowledge Graph (DAG)
// Directed acyclic graph of Math/CS concepts for root-cause deficit detection.
// Traversal: when a leaf node fails, recursively surface unmastered prerequisites.
// ─────────────────────────────────────────────────────────────────────────────

import type { KnowledgeNode } from '@/types/schedule';

/**
 * Canonical concept DAG.
 * Edge: prerequisite → dependent (must master prerequisite first).
 *
 * Linear Algebra chain:
 *   Arithmetic → Matrix Multiplication → Determinants → Vector Spaces
 *   → Eigenvalues → SVD
 *
 * CS chains:
 *   Arrays → Linked Lists → Trees → Graphs → DP
 *   Binary → Subnetting → Routing Protocols
 */
export const KNOWLEDGE_GRAPH: Record<string, KnowledgeNode> = {
  // ── Linear Algebra ──────────────────────────────────────────────────────────
  arithmetic: {
    id: 'arithmetic',
    label: 'Arithmetic & Algebra Basics',
    subjectId: 'sub_la',
    prerequisites: [],
    difficulty: 1,
  },
  matrix_ops: {
    id: 'matrix_ops',
    label: 'Matrix Operations',
    subjectId: 'sub_la',
    prerequisites: ['arithmetic'],
    difficulty: 2,
  },
  determinants: {
    id: 'determinants',
    label: 'Determinants',
    subjectId: 'sub_la',
    prerequisites: ['matrix_ops'],
    difficulty: 2,
  },
  vector_spaces: {
    id: 'vector_spaces',
    label: 'Vector Spaces & Subspaces',
    subjectId: 'sub_la',
    prerequisites: ['matrix_ops', 'determinants'],
    difficulty: 3,
  },
  null_column_space: {
    id: 'null_column_space',
    label: 'Null Space & Column Space',
    subjectId: 'sub_la',
    prerequisites: ['vector_spaces'],
    difficulty: 3,
  },
  eigenvalues: {
    id: 'eigenvalues',
    label: 'Eigenvalues & Eigenvectors',
    subjectId: 'sub_la',
    prerequisites: ['determinants', 'vector_spaces'],
    difficulty: 4,
  },
  orthogonality: {
    id: 'orthogonality',
    label: 'Orthogonality & Projections',
    subjectId: 'sub_la',
    prerequisites: ['vector_spaces'],
    difficulty: 4,
  },
  svd: {
    id: 'svd',
    label: 'Singular Value Decomposition (SVD)',
    subjectId: 'sub_la',
    prerequisites: ['eigenvalues', 'orthogonality'],
    difficulty: 5,
  },

  // ── Data Structures ─────────────────────────────────────────────────────────
  arrays: {
    id: 'arrays',
    label: 'Arrays & Basic Structures',
    subjectId: 'sub_ds',
    prerequisites: [],
    difficulty: 1,
  },
  linked_lists: {
    id: 'linked_lists',
    label: 'Linked Lists',
    subjectId: 'sub_ds',
    prerequisites: ['arrays'],
    difficulty: 2,
  },
  trees: {
    id: 'trees',
    label: 'Binary Trees & BST',
    subjectId: 'sub_ds',
    prerequisites: ['linked_lists'],
    difficulty: 3,
  },
  avl_trees: {
    id: 'avl_trees',
    label: 'AVL Tree Rotations',
    subjectId: 'sub_ds',
    prerequisites: ['trees'],
    difficulty: 4,
  },
  graphs: {
    id: 'graphs',
    label: 'Graph Representations',
    subjectId: 'sub_ds',
    prerequisites: ['trees'],
    difficulty: 3,
  },
  graph_traversal: {
    id: 'graph_traversal',
    label: 'DFS & BFS Traversal',
    subjectId: 'sub_ds',
    prerequisites: ['graphs'],
    difficulty: 4,
  },
  dynamic_programming: {
    id: 'dynamic_programming',
    label: 'Dynamic Programming',
    subjectId: 'sub_ds',
    prerequisites: ['graph_traversal'],
    difficulty: 5,
  },

  // ── Computer Networks ───────────────────────────────────────────────────────
  binary_math: {
    id: 'binary_math',
    label: 'Binary & Hexadecimal Arithmetic',
    subjectId: 'sub_cn',
    prerequisites: [],
    difficulty: 1,
  },
  ip_addressing: {
    id: 'ip_addressing',
    label: 'IP Addressing Basics',
    subjectId: 'sub_cn',
    prerequisites: ['binary_math'],
    difficulty: 2,
  },
  subnetting: {
    id: 'subnetting',
    label: 'Subnetting & CIDR',
    subjectId: 'sub_cn',
    prerequisites: ['ip_addressing'],
    difficulty: 3,
  },
  routing_basics: {
    id: 'routing_basics',
    label: 'Routing Concepts',
    subjectId: 'sub_cn',
    prerequisites: ['subnetting'],
    difficulty: 3,
  },
  ospf_bgp: {
    id: 'ospf_bgp',
    label: 'OSPF & BGP Protocols',
    subjectId: 'sub_cn',
    prerequisites: ['routing_basics'],
    difficulty: 4,
  },
};

/**
 * Given a set of failed concept IDs, recursively walk the DAG backwards to
 * return all unmastered prerequisite nodes in topological order (roots first).
 * This surfaces the true root-cause of a deficit rather than the symptom.
 */
export function getRootCauseChain(failedConceptIds: string[]): KnowledgeNode[] {
  const visited = new Set<string>();
  const result: KnowledgeNode[] = [];

  function dfs(id: string): void {
    if (visited.has(id)) return;
    visited.add(id);
    const node = KNOWLEDGE_GRAPH[id];
    if (!node) return;
    for (const prereq of node.prerequisites) {
      dfs(prereq);
    }
    result.push(node);
  }

  for (const id of failedConceptIds) {
    dfs(id);
  }

  return result;
}

/**
 * Map concept weakness strings (from student_database.json) to graph node IDs.
 */
const WEAKNESS_TO_NODE_ID: Record<string, string> = {
  'Eigenvalue decomposition': 'eigenvalues',
  'Null space & column space': 'null_column_space',
  'Orthogonality': 'orthogonality',
  'Graph traversal (DFS/BFS)': 'graph_traversal',
  'AVL tree rotations': 'avl_trees',
  'Subnetting': 'subnetting',
  'Routing protocols (OSPF, BGP)': 'ospf_bgp',
};

export function weaknessesToNodeIds(weaknesses: string[]): string[] {
  return weaknesses
    .map((w) => WEAKNESS_TO_NODE_ID[w])
    .filter((id): id is string => !!id);
}
