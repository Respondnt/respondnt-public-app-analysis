import { useMemo, useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

function PathVisualization({ finding, onBack, onTechniqueClick, techniquesByTactic }) {
  const attackFlow = finding?.hypothesis?.attack_flow_hypothesis || []
  
  // Helper to find technique from an attack flow step
  const findTechniqueFromStep = (step) => {
    if (!finding?.adversarial_methods || !techniquesByTactic) return null
    
    // Find method that matches the step's tactic
    const matchingMethod = finding.adversarial_methods.find(
      method => method.tactic_name === step.step_mitre_tactic
    )
    
    if (!matchingMethod || !matchingMethod.selected_techniques) return null
    
    // Extract MITRE technique IDs from step (e.g., "T1566", "T1199")
    const stepTechniqueIds = (step.step_mitre_technique || '').match(/T\d{4}/g) || []
    const stepTechniqueStr = (step.step_mitre_technique || '').toLowerCase()
    
    // Find technique that matches
    for (const technique of matchingMethod.selected_techniques) {
      // Match by STIX ID pattern (extract T number if present)
      if (technique.stix_id) {
        const stixMatch = technique.stix_id.match(/T\d{4}/)
        if (stixMatch && stepTechniqueIds.includes(stixMatch[0])) {
          return {
            tactic: matchingMethod.tactic_name,
            techniqueKey: technique.stix_id || technique.name,
            technique: technique,
          }
        }
      }
      
      // Match by technique name
      const techniqueName = (technique.name || '').toLowerCase()
      if (techniqueName && stepTechniqueStr.includes(techniqueName)) {
        return {
          tactic: matchingMethod.tactic_name,
          techniqueKey: technique.stix_id || technique.name,
          technique: technique,
        }
      }
    }
    
    // Fallback: return first technique from matching method if we can't match precisely
    if (matchingMethod.selected_techniques.length > 0) {
      const technique = matchingMethod.selected_techniques[0]
      return {
        tactic: matchingMethod.tactic_name,
        techniqueKey: technique.stix_id || technique.name,
        technique: technique,
      }
    }
    
    return null
  }
  
  // Handle node click
  const onNodeClick = useCallback((event, node) => {
    if (node.data.stepData && onTechniqueClick) {
      const technique = findTechniqueFromStep(node.data.stepData)
      if (technique) {
        onTechniqueClick(technique)
      }
    }
  }, [onTechniqueClick, finding])
  
  // Create nodes and edges for React Flow
  const initialNodes = useMemo(() => {
    const nodes = []
    const nodeWidth = 280
    const horizontalSpacing = 350
    
    // Attack flow steps
    attackFlow.forEach((step, index) => {
      const x = 50 + horizontalSpacing * index
      const y = 100
      
      nodes.push({
        id: `step-${index}`,
        type: 'default',
        position: { x, y },
        data: {
          label: (
            <div className="p-2">
              <div className="flex items-center justify-between mb-1">
                <div className="text-body-xs font-bold text-gray-900 dark:text-white">
                  {step.step_name}
                </div>
                <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div className="text-body-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                {step.step_description}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 rounded text-body-xs font-medium bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300">
                  {step.step_mitre_tactic}
                </span>
                <span className="text-body-xs text-gray-500 dark:text-gray-400 truncate">
                  {step.step_mitre_technique}
                </span>
              </div>
            </div>
          ),
          stepData: step, // Store the step data for click handler
        },
        className: 'attack-path-node',
        style: {
          background: '#ffffff',
          border: '2px solid #e5e7eb',
          borderRadius: '12px',
          width: nodeWidth,
          minHeight: 120,
          fontSize: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          cursor: 'pointer',
        },
      })
    })

    return nodes
  }, [finding, attackFlow])

  const initialEdges = useMemo(() => {
    const edges = []
    
    // Edges between steps
    for (let i = 0; i < attackFlow.length - 1; i++) {
      edges.push({
        id: `step-${i}-to-step-${i + 1}`,
        source: `step-${i}`,
        target: `step-${i + 1}`,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#6b7280', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#6b7280',
        },
      })
    }

    return edges
  }, [attackFlow])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-950">
      <div className="flex-shrink-0 px-6 lg:px-8 py-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={onBack}
              className="inline-flex items-center text-body-sm text-gray-600 dark:text-gray-400 hover:text-accent-primary transition-colors mb-3"
            >
              ← Back to Technique
            </button>
            <h2 className="text-display-md font-bold text-gray-900 dark:text-white mb-2">
              Attack Path Visualization
            </h2>
            <p className="text-body-sm text-gray-600 dark:text-gray-400">
              {finding?.scenario_name}
            </p>
          </div>
          <div className="text-right">
            <div className="text-body-xs text-gray-500 dark:text-gray-400 mb-1">
              Starting: <span className="font-semibold text-blue-600 dark:text-blue-400">{finding?.hypothesis?.starting_tactic}</span>
            </div>
            <div className="text-body-xs text-gray-500 dark:text-gray-400">
              Objective: <span className="font-semibold text-red-600 dark:text-red-400">{finding?.hypothesis?.objective_tactic}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        <style>{`
          .attack-path-node:hover {
            border: 2px solid #3b82f6 !important;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
          }
        `}</style>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            className="bg-gray-50 dark:bg-gray-950"
          >
            <Background color="#e5e7eb" gap={16} />
            <Controls className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
            <MiniMap
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              nodeColor="#6b7280"
            />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  )
}

export default PathVisualization

