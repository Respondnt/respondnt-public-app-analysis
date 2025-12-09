import { useState, useEffect } from 'react'
import PathVisualization from './PathVisualization'
import type { AttackPathsData, Finding, Technique } from '../types'
import { loadAttackPathsData } from '../utils/dataLoaders'

interface AttackGraphsProps {
  appName: string
}

function AttackGraphs({ appName }: AttackGraphsProps): JSX.Element {
  const [attackPathsData, setAttackPathsData] = useState<AttackPathsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null)
  const [techniquesByTactic, setTechniquesByTactic] = useState<Map<string, Map<string, Technique>>>(new Map())

  useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        setLoading(true)
        const baseUrl = import.meta.env.BASE_URL

        // Load attack paths data
        const data = await loadAttackPathsData(baseUrl, appName)
        setAttackPathsData(data)

        // Build techniques map for PathVisualization
        const techniquesMap = new Map<string, Map<string, Technique>>()
        if (data.attack_paths && Array.isArray(data.attack_paths)) {
          data.attack_paths.forEach((attackPath) => {
            if (attackPath.adversarial_methods && Array.isArray(attackPath.adversarial_methods)) {
              attackPath.adversarial_methods.forEach((method) => {
                const tacticName = method.tactic_name
                if (!tacticName) return

                if (!techniquesMap.has(tacticName)) {
                  techniquesMap.set(tacticName, new Map())
                }

                const tacticMap = techniquesMap.get(tacticName)
                if (!tacticMap) return

                if (method.selected_techniques && Array.isArray(method.selected_techniques)) {
                  method.selected_techniques.forEach((technique) => {
                    const techniqueKey = technique.stix_id || technique.name
                    if (!tacticMap.has(techniqueKey)) {
                      tacticMap.set(techniqueKey, {
                        ...technique,
                        tactic: tacticName,
                      })
                    }
                  })
                }
              })
            }
          })
        }

        setTechniquesByTactic(techniquesMap)
        setError(null)
      } catch (err) {
        console.error('Error loading attack paths:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [appName])

  const handleBack = (): void => {
    setSelectedFinding(null)
  }

  const handleFindingClick = (finding: Finding): void => {
    setSelectedFinding(finding)
  }

  // If a finding is selected, show the graph view
  if (selectedFinding) {
    return (
      <PathVisualization
        finding={selectedFinding}
        onBack={handleBack}
        techniquesByTactic={techniquesByTactic}
        backLabel="Back to Attack Graphs"
      />
    )
  }

  if (loading) {
    return (
      <div className="w-full px-6 py-16">
        <div className="text-center">
          <div className="text-body text-gray-600 dark:text-gray-400">Loading attack graphs...</div>
        </div>
      </div>
    )
  }

  if (error || !attackPathsData) {
    return (
      <div className="w-full px-6 py-16">
        <div className="text-center">
          <div className="text-body text-red-600 dark:text-red-400 mb-4">
            {error || 'No attack paths data available'}
          </div>
        </div>
      </div>
    )
  }

  const attackPaths = attackPathsData.attack_paths || []

  if (attackPaths.length === 0) {
    return (
      <div className="w-full px-6 py-16">
        <div className="text-center">
          <div className="text-body text-gray-600 dark:text-gray-400">
            No attack paths available
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-950">
      <div className="flex-shrink-0 px-6 lg:px-8 py-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-display-md font-bold text-gray-900 dark:text-white mb-2">
          Attack Graphs
        </h2>
        <p className="text-body-sm text-gray-600 dark:text-gray-400">
          Click on an attack path to view its visualization
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-body-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Scenario Name
                </th>
                <th className="px-6 py-3 text-left text-body-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Starting Tactic
                </th>
                <th className="px-6 py-3 text-left text-body-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Objective Tactic
                </th>
                <th className="px-6 py-3 text-left text-body-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Steps
                </th>
                <th className="px-6 py-3 text-left text-body-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Techniques
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {attackPaths.map((finding, idx) => {
                const attackFlow = finding.hypothesis?.attack_flow_hypothesis || []
                const stepCount = attackFlow.length
                
                // Count unique techniques
                const techniqueSet = new Set<string>()
                attackFlow.forEach((step) => {
                  const techniqueMatch = step.step_mitre_technique?.match(/T\d{4}(\.\d{3})?/g)
                  if (techniqueMatch) {
                    techniqueMatch.forEach(t => techniqueSet.add(t))
                  }
                })
                const techniqueCount = techniqueSet.size

                return (
                  <tr
                    key={idx}
                    onClick={() => handleFindingClick(finding)}
                    className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/10 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-body-sm font-medium text-gray-900 dark:text-white">
                        {finding.scenario_name || `Attack Path ${idx + 1}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {finding.hypothesis?.starting_tactic ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-body-xs font-medium bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300">
                          {finding.hypothesis.starting_tactic}
                        </span>
                      ) : (
                        <span className="text-body-sm text-gray-500 dark:text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {finding.hypothesis?.objective_tactic ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-body-xs font-medium bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300">
                          {finding.hypothesis.objective_tactic}
                        </span>
                      ) : (
                        <span className="text-body-sm text-gray-500 dark:text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-body-sm text-gray-900 dark:text-white">
                        {stepCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-body-sm text-gray-900 dark:text-white">
                        {techniqueCount}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AttackGraphs

