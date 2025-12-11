import { useMemo, useCallback, useEffect } from 'react'
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    MarkerType,
    ReactFlowProvider,
    Node,
    Edge,
    NodeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

interface AttackFlowStep {
    step_name: string
    step_description: string
    step_mitre_tactic: string
    step_mitre_technique: string
}

interface Technique {
    stix_id?: string
    name: string
    rationale?: string
    tactic?: string
}

interface AdversarialMethod {
    tactic_name: string
    selected_techniques?: Technique[]
}

interface Hypothesis {
    attack_flow_hypothesis?: AttackFlowStep[]
    starting_tactic?: string
    objective_tactic?: string
    attack_target?: string
    preconditions?: string
    scenario_name?: string
}

interface Finding {
    scenario_name?: string
    hypothesis?: Hypothesis
    adversarial_methods?: AdversarialMethod[]
    method?: AdversarialMethod
}

interface TechniqueInfo {
    tactic: string
    techniqueKey: string
    technique: Technique
}

interface PathVisualizationProps {
    finding: Finding | null
    onBack: () => void
    onTechniqueClick?: (technique: TechniqueInfo) => void
    techniquesByTactic?: Map<string, Map<string, Technique>>
    backLabel?: string
}

function PathVisualization({ finding, onBack, onTechniqueClick, techniquesByTactic, backLabel = 'Back to Technique' }: PathVisualizationProps): JSX.Element {
    const attackFlow = finding?.hypothesis?.attack_flow_hypothesis || []

    // Helper to find technique from an attack flow step
    const findTechniqueFromStep = useCallback((step: AttackFlowStep): TechniqueInfo | null => {
        if (!finding?.adversarial_methods || !techniquesByTactic) return null

        // Find method that matches the step's tactic
        const matchingMethod = finding.adversarial_methods.find(
            method => method.tactic_name === step.step_mitre_tactic
        )

        if (!matchingMethod) return null

        // Extract MITRE technique IDs from step (e.g., "T1566", "T1199")
        const stepTechniqueIdsMatch = (step.step_mitre_technique || '').match(/T\d{4}(\.\d{3})?/g)
        const stepTechniqueIds: string[] = stepTechniqueIdsMatch || []
        const stepTechniqueStr = (step.step_mitre_technique || '').toLowerCase()
        const tacticName = step.step_mitre_tactic

        // Case 1: Method has selected_techniques (Slack/Box format)
        if (matchingMethod.selected_techniques && Array.isArray(matchingMethod.selected_techniques)) {
            // Find technique that matches
            for (const technique of matchingMethod.selected_techniques) {
                // Match by STIX ID pattern (extract T number if present)
                if (technique.stix_id) {
                    const stixMatch = technique.stix_id.match(/T\d{4}(\.\d{3})?/)
                    if (stixMatch && stixMatch[0] && stepTechniqueIds.some(id => id.toUpperCase() === stixMatch[0].toUpperCase())) {
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
                if (technique) {
                    return {
                        tactic: matchingMethod.tactic_name,
                        techniqueKey: technique.stix_id || technique.name,
                        technique: technique,
                    }
                }
            }
        }

        // Case 2: Method doesn't have selected_techniques (Miro/1Password format)
        // Look up techniques in techniquesByTactic by matching technique IDs from the step
        const tacticTechniques = techniquesByTactic.get(tacticName)
        if (tacticTechniques && stepTechniqueIds.length > 0) {
            // Try to find a technique that matches any of the step's technique IDs
            for (const [techniqueKey, technique] of tacticTechniques.entries()) {
                // Extract technique ID from STIX ID or name
                const techniqueIdMatch = (technique.stix_id || technique.name || '').match(/T\d{4}(\.\d{3})?/i)
                if (techniqueIdMatch) {
                    const techniqueId = techniqueIdMatch[0].toUpperCase()
                    // Check if this technique ID matches any of the step's technique IDs
                    if (stepTechniqueIds.some(stepId => {
                        const stepIdUpper = stepId.toUpperCase()
                        // Handle sub-techniques: T1098.003 matches T1098
                        const stepBase = stepIdUpper.split('.')[0]
                        const techBase = techniqueId.split('.')[0]
                        return stepIdUpper === techniqueId || stepBase === techBase
                    })) {
                        return {
                            tactic: tacticName,
                            techniqueKey: techniqueKey,
                            technique: technique,
                        }
                    }
                }
            }

            // Fallback: if we can't match by ID, try matching by name
            for (const [techniqueKey, technique] of tacticTechniques.entries()) {
                const techniqueName = (technique.name || '').toLowerCase()
                if (techniqueName && stepTechniqueStr.includes(techniqueName)) {
                    return {
                        tactic: tacticName,
                        techniqueKey: techniqueKey,
                        technique: technique,
                    }
                }
            }

            // Last resort: return first technique in this tactic if we have one
            const firstTechnique = Array.from(tacticTechniques.entries())[0]
            if (firstTechnique) {
                return {
                    tactic: tacticName,
                    techniqueKey: firstTechnique[0],
                    technique: firstTechnique[1],
                }
            }
        }

        return null
    }, [finding, techniquesByTactic])

    // Handle node click
    const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
        if (node.data?.stepData && onTechniqueClick) {
            const technique = findTechniqueFromStep(node.data.stepData as AttackFlowStep)
            if (technique) {
                onTechniqueClick(technique)
            }
        }
    }, [onTechniqueClick, findTechniqueFromStep])

    // Create nodes and edges for React Flow
    const initialNodes = useMemo((): Node[] => {
        const nodes: Node[] = []
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

    const initialEdges = useMemo((): Edge[] => {
        const edges: Edge[] = []

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

    // Sync nodes and edges when initialNodes/initialEdges change
    useEffect(() => {
        setNodes(initialNodes)
    }, [initialNodes, setNodes])

    useEffect(() => {
        setEdges(initialEdges)
    }, [initialEdges, setEdges])

    return (
        <div className="w-full h-full flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-950">
            <div className="flex-shrink-0 px-6 lg:px-8 py-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                    <div>
                        <button
                            onClick={onBack}
                            className="inline-flex items-center text-body-sm text-gray-600 dark:text-gray-400 hover:text-accent-primary transition-colors mb-3"
                        >
                            ← {backLabel}
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

