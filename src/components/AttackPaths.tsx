import { useState, useEffect } from 'react'
import PathVisualization from './PathVisualization'
import type { AttackPathsData, Technique, TechniqueInfo, Finding, TechniqueSpecificInfo, ComprehensiveAnalysisResults } from '../types'
import { loadAttackPathsData, loadComprehensiveAnalysisData } from '../utils/dataLoaders'

// MITRE ATT&CK Tactics in order
const MITRE_TACTICS = [
  'Initial Access',
  'Execution',
  'Persistence',
  'Privilege Escalation',
  'Defense Evasion',
  'Credential Access',
  'Discovery',
  'Lateral Movement',
  'Collection',
  'Command and Control',
  'Exfiltration',
  'Impact',
] as const

type ViewType = 'matrix' | 'technique' | 'finding' | 'path-visualization'

interface AttackPathsProps {
  appName: string
}

function AttackPaths({ appName }: AttackPathsProps): JSX.Element {
  const [attackPathsData, setAttackPathsData] = useState<AttackPathsData | null>(null)
  const [comprehensiveAnalysisData, setComprehensiveAnalysisData] = useState<ComprehensiveAnalysisResults | null>(null)
  const [techniquesByTactic, setTechniquesByTactic] = useState<Map<string, Map<string, Technique>>>(new Map())
  const [findingsByTechnique, setFindingsByTechnique] = useState<Map<string, Finding[]>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<ViewType>('matrix')
  const [selectedTechnique, setSelectedTechnique] = useState<TechniqueInfo | null>(null)
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null)
  const [selectedTactics, setSelectedTactics] = useState<Set<string>>(new Set())
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [pathVisualizationFinding, setPathVisualizationFinding] = useState<Finding | null>(null)
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null)
  const [selectedFindingForTechnique, setSelectedFindingForTechnique] = useState<Finding | null>(null)

  useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        setLoading(true)
        const baseUrl = import.meta.env.BASE_URL

        // Try to load comprehensive analysis data directly first
        const comprehensiveData = await loadComprehensiveAnalysisData(baseUrl, appName)
        if (comprehensiveData) {
          setComprehensiveAnalysisData(comprehensiveData)
        }

        // Use the loader function which supports multiple formats including comprehensive analysis
        const attackPathsData = await loadAttackPathsData(baseUrl, appName)
        setAttackPathsData(attackPathsData)

        // Extract all techniques and group by tactic, tracking which findings use each
        const techniquesMap = new Map<string, Map<string, Technique>>()
        const findingsMap = new Map<string, Finding[]>()

        // Helper function to extract MITRE technique ID from a string
        const extractTechniqueId = (str: string | null | undefined): string | null => {
          if (!str) return null
          const match = str.match(/T\d{4}(\.\d{3})?/)
          return match ? match[0] : null
        }


        if (attackPathsData.attack_paths && Array.isArray(attackPathsData.attack_paths)) {
          attackPathsData.attack_paths.forEach((attackPath) => {
            if (attackPath.adversarial_methods && Array.isArray(attackPath.adversarial_methods)) {
              attackPath.adversarial_methods.forEach((method) => {
                const tacticName = method.tactic_name
                if (!tacticName) return

                // Only process techniques from achievable methods
                if (method.can_achieve !== true) return

                if (!techniquesMap.has(tacticName)) {
                  techniquesMap.set(tacticName, new Map())
                }

                const tacticMap = techniquesMap.get(tacticName)
                if (!tacticMap) return

                // First, try to use selected_techniques if available
                if (method.selected_techniques && Array.isArray(method.selected_techniques)) {
                  method.selected_techniques.forEach((technique) => {
                    const techniqueKey = technique.stix_id || technique.name
                    const fullKey = `${tacticName}::${techniqueKey}`

                    if (!tacticMap.has(techniqueKey)) {
                      tacticMap.set(techniqueKey, {
                        ...technique,
                        tactic: tacticName,
                      })
                    }

                    // Track findings for this technique
                    if (!findingsMap.has(fullKey)) {
                      findingsMap.set(fullKey, [])
                    }

                    const findings = findingsMap.get(fullKey)
                    if (!findings) return
                    // Add attack path if not already present
                    if (!findings.find(f => f.scenario_name === attackPath.scenario_name)) {
                      findings.push({
                        ...attackPath,
                        method: method, // Store the specific method that uses this technique
                      })
                    }
                  })
                } else {
                  // Fallback: extract techniques from attack flow steps
                  // Get attack flow steps that match this tactic
                  const attackFlow = attackPath.hypothesis?.attack_flow_hypothesis || []
                  const matchingSteps = attackFlow.filter(
                    step => step.step_mitre_tactic === tacticName
                  )

                  // Extract unique techniques from matching steps
                  // Steps can have multiple techniques separated by semicolons
                  const seenTechniqueKeys = new Set<string>()
                  matchingSteps.forEach((step) => {
                    if (!step) return
                    // Split by semicolon to get all techniques in the step
                    const techniqueStrings = (step.step_mitre_technique || '').split(';').map(s => s.trim()).filter(s => s)

                    techniqueStrings.forEach((techniqueStr) => {
                      const techniqueId = extractTechniqueId(techniqueStr)
                      if (!techniqueId) return

                      // Create technique key from ID
                      const techniqueKey = `attack-pattern--${techniqueId.toLowerCase().replace(/\./g, '-')}`

                      // Skip if we've already processed this technique for this attack path
                      if (seenTechniqueKeys.has(techniqueKey)) return
                      seenTechniqueKeys.add(techniqueKey)

                      // Extract technique name from the string (format: "T1078 – Valid Accounts")
                      const nameMatch = techniqueStr.match(/T\d{4}(\.\d{3})?\s*[–-]\s*(.+)/)
                      const techniqueName = nameMatch && nameMatch[2] ? nameMatch[2].trim() : techniqueStr

                      const technique: Technique = {
                        stix_id: techniqueKey,
                        name: techniqueName,
                        rationale: step.step_description || undefined,
                        tactic: tacticName,
                      }

                      const fullKey = `${tacticName}::${techniqueKey}`

                      if (!tacticMap.has(techniqueKey)) {
                        tacticMap.set(techniqueKey, technique)
                      }

                      // Track findings for this technique
                      if (!findingsMap.has(fullKey)) {
                        findingsMap.set(fullKey, [])
                      }

                      const findings = findingsMap.get(fullKey)
                      if (findings) {
                        // Add attack path if not already present
                        if (!findings.find(f => f.scenario_name === attackPath.scenario_name)) {
                          findings.push({
                            ...attackPath,
                            method: method, // Store the specific method that uses this technique
                          })
                        }
                      }
                    })
                  })
                }
              })
            }
          })
        }

        setTechniquesByTactic(techniquesMap)
        setFindingsByTechnique(findingsMap)

        // Initialize selected tactics to all tactics that have techniques
        const tacticsWithTechniques = Array.from(techniquesMap.keys())
        setSelectedTactics(new Set(tacticsWithTechniques))

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

  // Auto-select first finding when entering technique view
  useEffect(() => {
    if (view === 'technique' && selectedTechnique && !selectedFindingForTechnique) {
      const fullKey = `${selectedTechnique.tactic}::${selectedTechnique.techniqueKey}`
      const findings = findingsByTechnique.get(fullKey) || []
      if (findings.length > 0 && findings[0]) {
        setSelectedFindingForTechnique(findings[0])
      }
    }
  }, [view, selectedTechnique, selectedFindingForTechnique, findingsByTechnique])

  const handleTechniqueClick = (tactic: string, techniqueKey: string, technique: Technique): void => {
    setSelectedTechnique({ tactic, techniqueKey, technique })
    setSelectedFindingForTechnique(null) // Reset selected finding when switching techniques
    setView('technique')
  }


  const handleBack = (): void => {
    if (view === 'path-visualization') {
      setView('technique')
      setPathVisualizationFinding(null)
    } else if (view === 'finding') {
      setView('technique')
      setSelectedFinding(null)
    } else if (view === 'technique') {
      setView('matrix')
      setSelectedTechnique(null)
    }
  }

  const handleViewInContext = (finding: Finding): void => {
    setPathVisualizationFinding(finding)
    setView('path-visualization')
  }

  // Helper function to extract MITRE technique ID from a string
  const extractTechniqueIdFromKey = (key: string): string | null => {
    // Try to extract from STIX ID format: "attack-pattern--t1078-..."
    const stixMatch = key.match(/attack-pattern--t(\d{4}(?:\.\d{3})?)/i)
    if (stixMatch) {
      return `T${stixMatch[1]}`
    }
    // Try to extract from name or key directly
    const directMatch = key.match(/T\d{4}(\.\d{3})?/i)
    if (directMatch) {
      return directMatch[0]
    }
    return null
  }

  // Helper function to get technique-specific information from a finding
  const getTechniqueSpecificInfo = (finding: Finding, techniqueKey: string, techniqueName: string | undefined, tacticName: string): TechniqueSpecificInfo | null => {
    if (!finding.adversarial_methods || !Array.isArray(finding.adversarial_methods)) {
      return null
    }

    // Extract MITRE technique ID from the technique key or name
    const techniqueId = extractTechniqueIdFromKey(techniqueKey) || extractTechniqueIdFromKey(techniqueName || '')

    // Find the method that contains this technique
    for (const method of finding.adversarial_methods) {
      // First check if the method's tactic matches (if tacticName is provided)
      if (tacticName && method.tactic_name && method.tactic_name.toLowerCase() !== tacticName.toLowerCase()) {
        continue
      }
      // Case 1: Method has selected_techniques (Slack format)
      if (method.selected_techniques && Array.isArray(method.selected_techniques)) {
        const technique = method.selected_techniques.find(
          (t) => (t.stix_id || t.name) === techniqueKey
        )
        if (technique) {
          // Filter attack flow steps to only those matching this technique
          const attackFlow = finding.hypothesis?.attack_flow_hypothesis || []
          const techniqueSteps = attackFlow.filter((step) => {
            // Check if the step's MITRE technique matches this technique
            const stepTechnique = (step.step_mitre_technique || '').toLowerCase()
            const stepTactic = (step.step_mitre_tactic || '').toLowerCase()
            const methodTactic = (method.tactic_name || '').toLowerCase()

            // Extract MITRE technique IDs from step (e.g., "T1566", "T1199")
            const stepTechniqueIds = stepTechnique.match(/T\d{4}(\.\d{3})?/gi) || []

            // Try to extract technique ID from STIX ID or name
            let stepTechniqueId = null
            const techniqueNameStr = (techniqueName || technique.name || '').toLowerCase()

            // Look for T numbers in the technique name or description
            const nameMatch = techniqueNameStr.match(/T\d{4}(\.\d{3})?/i)
            if (nameMatch) {
              stepTechniqueId = nameMatch[0]
            }

            // Match by MITRE technique ID if found
            if (stepTechniqueId && stepTechniqueIds.some(id => id.toUpperCase() === stepTechniqueId.toUpperCase())) {
              return true
            }

            // Match by technique name - check if step's technique description contains the technique name
            // Remove common words and focus on key terms
            const keyWords = techniqueNameStr
              .split(/\s+/)
              .filter(word => word.length > 3 && !['and', 'the', 'via', 'for', 'with'].includes(word))

            if (keyWords.length > 0) {
              const hasKeyWord = keyWords.some(word => stepTechnique.includes(word))
              if (hasKeyWord && stepTactic === methodTactic) {
                return true
              }
            }

            // As a last resort, if the step is in the same tactic and we can't match by name/ID,
            // only include it if this method is the only one in this tactic for this finding
            // This prevents showing steps from other techniques in the same tactic
            const methodsInSameTactic = finding.adversarial_methods?.filter(
              m => m.tactic_name?.toLowerCase() === methodTactic
            ) || []

            if (stepTactic === methodTactic && methodsInSameTactic.length === 1) {
              // Only one method in this tactic, so steps likely belong to this technique
              return true
            }

            return false
          })

          return {
            method,
            technique,
            rationale: technique.rationale,
            methodSteps: techniqueSteps, // Only show matching attack flow steps
            allMethodSteps: method.method_steps || [], // Keep all for reference if needed
          }
        }
      }

      // Case 2: Method doesn't have selected_techniques (1password/miro format)
      // Match by tactic and extract technique from attack flow steps
      if (techniqueId) {
        const methodTactic = (method.tactic_name || '').toLowerCase()
        const attackFlow = finding.hypothesis?.attack_flow_hypothesis || []

        // Helper to check if technique IDs match (handles sub-techniques)
        // T1098.003 matches T1098, and T1098 matches T1098.003
        const techniqueIdsMatch = (id1: string, id2: string): boolean => {
          const base1 = id1.split('.')[0]
          const base2 = id2.split('.')[0]
          return base1 === base2
        }

        // Find steps that match both the tactic and the technique ID
        const matchingSteps = attackFlow.filter((step) => {
          const stepTactic = (step.step_mitre_tactic || '').toLowerCase()

          // Check if tactic matches
          if (stepTactic !== methodTactic) return false

          // Split by semicolon to handle multiple techniques in one step
          const stepTechniqueStrings = (step.step_mitre_technique || '').split(';').map(s => s.trim()).filter(s => s)

          // Check if any technique in the step matches our technique ID
          return stepTechniqueStrings.some((techniqueStr) => {
            const stepTechniqueIds = techniqueStr.match(/T\d{4}(\.\d{3})?/gi) || []
            return stepTechniqueIds.some(id => techniqueIdsMatch(id.toUpperCase(), techniqueId.toUpperCase()))
          })
        })

        if (matchingSteps.length > 0 && matchingSteps[0]) {
          // Find the specific technique name from the matching steps
          let techniqueNameFromStep = techniqueName
          for (const step of matchingSteps) {
            if (!step) continue
            const stepTechniqueStrings = (step.step_mitre_technique || '').split(';').map(s => s.trim()).filter(s => s)
            for (const techniqueStr of stepTechniqueStrings) {
              const stepTechniqueIds = techniqueStr.match(/T\d{4}(\.\d{3})?/gi) || []
              if (stepTechniqueIds.some(id => techniqueIdsMatch(id.toUpperCase(), techniqueId.toUpperCase()))) {
                // Extract name from this technique string
                const nameMatch = techniqueStr.match(/T\d{4}(\.\d{3})?\s*[–-]\s*(.+)/)
                if (nameMatch && nameMatch[2]) {
                  techniqueNameFromStep = nameMatch[2].trim()
                  break
                }
              }
            }
            if (techniqueNameFromStep !== techniqueName) break
          }

          const firstStep = matchingSteps[0]
          const technique: Technique = {
            stix_id: techniqueKey,
            name: techniqueNameFromStep || techniqueName || 'Unknown',
            rationale: firstStep?.step_description || undefined,
          }

          return {
            method,
            technique,
            rationale: technique.rationale,
            methodSteps: matchingSteps, // Show all matching attack flow steps
            allMethodSteps: method.method_steps || [], // Keep all for reference if needed
          }
        }
      }
    }
    return null
  }

  if (loading) {
    return (
      <div className="w-full px-6 py-16">
        <div className="text-center">
          <div className="text-body text-gray-600 dark:text-gray-400">Loading attack paths...</div>
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

  // Technique Findings View
  if (view === 'technique' && selectedTechnique) {
    const fullKey = `${selectedTechnique.tactic}::${selectedTechnique.techniqueKey}`
    const findings = findingsByTechnique.get(fullKey) || []

    // Get technique info from the selected finding, or first finding if none selected
    const findingToUse = selectedFindingForTechnique || findings[0]
    const techniqueInfo = findingToUse ? getTechniqueSpecificInfo(
      findingToUse,
      selectedTechnique.techniqueKey,
      selectedTechnique.technique.name,
      selectedTechnique.tactic
    ) : null

    return (
      <div className="w-full h-full flex flex-col overflow-hidden">
        <div className="flex-shrink-0 px-6 lg:px-8 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <button
                onClick={handleBack}
                className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors flex-shrink-0"
                aria-label="Back to matrix"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h2 className="text-body-base font-semibold text-gray-900 dark:text-white truncate">
                  {selectedTechnique.technique.name}
                </h2>
                {(() => {
                  // Extract MITRE technique ID from attack flow steps or technique name
                  let mitreTechniqueId: string | null = null
                  if (techniqueInfo && techniqueInfo.methodSteps && techniqueInfo.methodSteps.length > 0) {
                    // Get MITRE technique ID from the first step
                    const firstStep = techniqueInfo.methodSteps[0]
                    if (firstStep && firstStep.step_mitre_technique) {
                      const mitreMatch = firstStep.step_mitre_technique.match(/T\d{4}(\.\d{3})?/g)
                      if (mitreMatch && mitreMatch.length > 0) {
                        mitreTechniqueId = mitreMatch[0]
                      }
                    }
                  }
                  // Fallback: try to extract from technique name
                  if (!mitreTechniqueId && selectedTechnique.technique.name) {
                    const nameMatch = selectedTechnique.technique.name.match(/T\d{4}(\.\d{3})?/)
                    if (nameMatch) {
                      mitreTechniqueId = nameMatch[0]
                    }
                  }

                  return mitreTechniqueId ? (
                    <p className="text-body-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {mitreTechniqueId}
                    </p>
                  ) : selectedTechnique.technique.stix_id ? (
                    <p className="text-body-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {selectedTechnique.technique.stix_id}
                    </p>
                  ) : null
                })()}
              </div>
            </div>
            {/* {findingToUse && (
              <button
                onClick={() => handleViewInContext(findingToUse)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-body-sm font-medium transition-colors shadow-sm hover:shadow-md flex-shrink-0"
              >
                View in Attack Path
              </button>
            )} */}
          </div>
        </div>

        <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-950">
          <div className="h-full flex gap-6 px-6 lg:px-8 py-6">
            {/* Left Side: Technique Information */}
            <div className="flex-1 overflow-y-auto pr-4">
              <div className="space-y-6">
                {techniqueInfo && (
                  <>
                    {/* Rationale */}
                    {techniqueInfo.rationale && (
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
                        <h3 className="text-h4 font-semibold text-gray-900 dark:text-white mb-3">
                          Rationale
                        </h3>
                        <p className="text-body text-gray-700 dark:text-gray-300">
                          {techniqueInfo.rationale}
                        </p>
                      </div>
                    )}

                    {/* Attack Flow Steps */}
                    {techniqueInfo.methodSteps && techniqueInfo.methodSteps.length > 0 && (
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
                        <h3 className="text-h4 font-semibold text-gray-900 dark:text-white mb-4">
                          Attack Flow Steps for this Technique
                        </h3>
                        <div className="space-y-4">
                          {techniqueInfo.methodSteps.map((step, stepIdx) => (
                            <div key={stepIdx} className="space-y-2">
                              <h5 className="text-body font-semibold text-gray-900 dark:text-white">
                                {step.step_name}
                              </h5>
                              <p className="text-body text-gray-700 dark:text-gray-300">
                                {step.step_description}
                              </p>
                              <div className="flex items-center gap-2 pt-2">
                                <span className="px-2 py-1 rounded text-body-xs font-medium bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300">
                                  {step.step_mitre_tactic}
                                </span>
                                <span className="text-body-xs text-gray-600 dark:text-gray-400">
                                  {step.step_mitre_technique}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Capabilities, Preconditions, Constraints from method */}
                    {techniqueInfo.method && (
                      <>
                        {techniqueInfo.method.capabilities_used && techniqueInfo.method.capabilities_used.length > 0 && (
                          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
                            <h3 className="text-h4 font-semibold text-gray-900 dark:text-white mb-4">
                              Capabilities Used
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {techniqueInfo.method.capabilities_used.map((capability, capIdx) => (
                                <span
                                  key={capIdx}
                                  className="inline-flex items-center px-3 py-1.5 rounded-md text-body-sm font-medium bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                >
                                  {capability}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {techniqueInfo.method.preconditions_required && techniqueInfo.method.preconditions_required.length > 0 && (
                          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
                            <h3 className="text-h4 font-semibold text-gray-900 dark:text-white mb-4">
                              Preconditions Required
                            </h3>
                            <ul className="space-y-2">
                              {techniqueInfo.method.preconditions_required.map((precondition, precIdx) => (
                                <li key={precIdx} className="flex items-start gap-2">
                                  <span className="text-green-600 dark:text-green-400 mt-1 flex-shrink-0">•</span>
                                  <span className="text-body text-gray-700 dark:text-gray-300">{precondition}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {techniqueInfo.method.constraints_encountered && techniqueInfo.method.constraints_encountered.length > 0 && (
                          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
                            <h3 className="text-h4 font-semibold text-gray-900 dark:text-white mb-4">
                              Constraints Encountered
                            </h3>
                            <ul className="space-y-2">
                              {techniqueInfo.method.constraints_encountered.map((constraint, constIdx) => (
                                <li key={constIdx} className="flex items-start gap-2">
                                  <span className="text-amber-600 dark:text-amber-400 mt-1 flex-shrink-0">•</span>
                                  <span className="text-body text-gray-700 dark:text-gray-300">{constraint}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                {!techniqueInfo && (
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 text-center">
                    <p className="text-body text-gray-500 dark:text-gray-400">
                      No information available for this technique.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Findings List */}
            <div className="w-80 flex-shrink-0 overflow-y-auto pl-4 border-l border-gray-200 dark:border-gray-700">
              <div className="sticky top-0 bg-gray-50 dark:bg-gray-950 pb-4 z-10">
                <h3 className="text-h4 font-semibold text-gray-900 dark:text-white mb-2">
                  Findings ({findings.length})
                </h3>
                <p className="text-body-xs text-gray-600 dark:text-gray-400">
                  Click on a finding to view its technique details
                </p>
              </div>
              <div className="space-y-3 pt-4">
                {findings.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-body-sm text-gray-500 dark:text-gray-400">
                      No findings for this technique
                    </p>
                  </div>
                ) : (
                  findings.map((finding, idx) => {
                    const isSelected = selectedFindingForTechnique === finding
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedFindingForTechnique(finding)
                        }}
                        className={`w-full text-left bg-white dark:bg-gray-800 border rounded-lg p-4 transition-all ${isSelected
                          ? 'border-blue-500 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-md'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md hover:bg-blue-50/50 dark:hover:bg-blue-950/10'
                          }`}
                      >
                        <div className="text-body-sm font-semibold text-gray-900 dark:text-white line-clamp-2">
                          {finding.scenario_name || `Finding ${idx + 1}`}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Finding Detail View
  if (view === 'finding' && selectedFinding) {
    const method = selectedFinding.method || (selectedFinding.adversarial_methods && selectedFinding.adversarial_methods[0])

    return (
      <div className="w-full h-full flex flex-col overflow-hidden">
        <div className="flex-shrink-0 px-6 lg:px-8 py-8">
          <div className="mb-6">
            <button
              onClick={handleBack}
              className="inline-flex items-center text-body-sm text-gray-600 dark:text-gray-400 hover:text-accent-primary transition-colors mb-4"
            >
              ← Back to Findings
            </button>
            <h2 className="text-display-md font-bold text-gray-900 dark:text-white mb-2">
              {selectedFinding.scenario_name}
            </h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 lg:px-8 pb-8">
          <div className="space-y-6">
            {/* Hypothesis */}
            {selectedFinding.hypothesis && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-h4 font-semibold text-gray-900 dark:text-white mb-4">Hypothesis</h3>

                {selectedFinding.hypothesis.attack_target && (
                  <div className="mb-4">
                    <div className="text-body-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Attack Target
                    </div>
                    <p className="text-body text-gray-600 dark:text-gray-400">
                      {selectedFinding.hypothesis.attack_target}
                    </p>
                  </div>
                )}

                {selectedFinding.hypothesis.preconditions && (
                  <div className="mb-4">
                    <div className="text-body-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Preconditions
                    </div>
                    <p className="text-body text-gray-600 dark:text-gray-400">
                      {selectedFinding.hypothesis.preconditions}
                    </p>
                  </div>
                )}

                {selectedFinding.hypothesis.starting_tactic && selectedFinding.hypothesis.objective_tactic && (
                  <div className="flex gap-4">
                    <div>
                      <div className="text-body-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Starting Tactic
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-md text-body-sm font-medium bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300">
                        {selectedFinding.hypothesis.starting_tactic}
                      </span>
                    </div>
                    <div>
                      <div className="text-body-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Objective Tactic
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-md text-body-sm font-medium bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300">
                        {selectedFinding.hypothesis.objective_tactic}
                      </span>
                    </div>
                  </div>
                )}

                {/* Attack Flow */}
                {selectedFinding.hypothesis.attack_flow_hypothesis && selectedFinding.hypothesis.attack_flow_hypothesis.length > 0 && (
                  <div className="mt-6">
                    <div className="text-body-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Attack Flow
                    </div>
                    <div className="space-y-3">
                      {selectedFinding.hypothesis.attack_flow_hypothesis.map((step, stepIdx) => (
                        <div key={stepIdx} className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-body font-medium text-gray-900 dark:text-white">
                              {step.step_name}
                            </h4>
                            <div className="flex flex-col items-end gap-1">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-body-xs font-medium bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300">
                                {step.step_mitre_tactic}
                              </span>
                              <span className="text-body-xs text-gray-600 dark:text-gray-400">
                                {step.step_mitre_technique}
                              </span>
                            </div>
                          </div>
                          <p className="text-body-sm text-gray-700 dark:text-gray-300">
                            {step.step_description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Method Steps */}
            {method && method.method_steps && method.method_steps.length > 0 && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-h4 font-semibold text-gray-900 dark:text-white mb-4">
                  Method Steps
                </h3>
                <div className="space-y-4">
                  {method.method_steps.map((step, stepIdx) => (
                    <div key={stepIdx} className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500 text-white text-body-xs font-semibold flex items-center justify-center">
                          {step.step_id || stepIdx + 1}
                        </div>
                        <p className="text-body-sm text-gray-700 dark:text-gray-300 flex-1">
                          {typeof step === 'string' ? step : step.description}
                        </p>
                      </div>

                      {step.related_capabilities && step.related_capabilities.length > 0 && (
                        <div className="mt-3">
                          <div className="text-body-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Related Capabilities:</div>
                          <div className="flex flex-wrap gap-2">
                            {step.related_capabilities.map((cap, capIdx) => (
                              <span
                                key={capIdx}
                                className="inline-flex items-center px-2 py-0.5 rounded text-body-xs font-medium bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300"
                              >
                                {cap}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {step.related_interfaces && step.related_interfaces.length > 0 && (
                        <div className="mt-3">
                          <div className="text-body-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Related Interfaces:</div>
                          <ul className="space-y-1">
                            {step.related_interfaces.map((iface, ifaceIdx) => (
                              <li key={ifaceIdx} className="text-body-xs text-gray-700 dark:text-gray-300">
                                {iface.startsWith('http') ? (
                                  <a href={iface} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                    {iface}
                                  </a>
                                ) : (
                                  <span>{iface}</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {step.related_data && step.related_data.length > 0 && (
                        <div className="mt-3">
                          <div className="text-body-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Related Data:</div>
                          <ul className="space-y-1">
                            {step.related_data.map((data, dataIdx) => (
                              <li key={dataIdx} className="text-body-xs text-gray-700 dark:text-gray-300 flex items-start gap-2">
                                <span className="text-green-600 dark:text-green-400 mt-1">•</span>
                                <span>{data}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {step.notes && (
                        <div className="mt-3 p-2 bg-amber-50/50 dark:bg-amber-950/10 rounded border border-amber-200 dark:border-amber-900/30">
                          <p className="text-body-xs text-amber-700 dark:text-amber-300 italic">
                            {step.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Techniques */}
            {method && method.selected_techniques && method.selected_techniques.length > 0 && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-h4 font-semibold text-gray-900 dark:text-white mb-4">
                  Selected Techniques
                </h3>
                <div className="space-y-3">
                  {method.selected_techniques.map((technique, techIdx) => (
                    <div key={techIdx} className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="text-body font-medium text-gray-900 dark:text-white mb-1">
                        {technique.name}
                      </div>
                      {technique.stix_id && (
                        <div className="text-body-xs text-gray-500 dark:text-gray-400 mb-2">
                          {technique.stix_id}
                        </div>
                      )}
                      {technique.rationale && (
                        <p className="text-body-sm text-gray-600 dark:text-gray-400">
                          {technique.rationale}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Capabilities Used */}
            {method && method.capabilities_used && method.capabilities_used.length > 0 && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-h4 font-semibold text-gray-900 dark:text-white mb-4">
                  Capabilities Used
                </h3>
                <div className="flex flex-wrap gap-2">
                  {method.capabilities_used.map((capability, capIdx) => (
                    <span
                      key={capIdx}
                      className="inline-flex items-center px-3 py-1.5 rounded-md text-body-sm font-medium bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                    >
                      {capability}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Preconditions Required */}
            {method && method.preconditions_required && method.preconditions_required.length > 0 && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-h4 font-semibold text-gray-900 dark:text-white mb-4">
                  Preconditions Required
                </h3>
                <ul className="space-y-2">
                  {method.preconditions_required.map((precondition, precIdx) => (
                    <li key={precIdx} className="flex items-start gap-2">
                      <span className="text-green-600 dark:text-green-400 mt-1 flex-shrink-0">•</span>
                      <span className="text-body text-gray-700 dark:text-gray-300">{precondition}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Constraints Encountered */}
            {method && method.constraints_encountered && method.constraints_encountered.length > 0 && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-h4 font-semibold text-gray-900 dark:text-white mb-4">
                  Constraints Encountered
                </h3>
                <ul className="space-y-2">
                  {method.constraints_encountered.map((constraint, constIdx) => (
                    <li key={constIdx} className="flex items-start gap-2">
                      <span className="text-amber-600 dark:text-amber-400 mt-1 flex-shrink-0">•</span>
                      <span className="text-body text-gray-700 dark:text-gray-300">{constraint}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Path Visualization View with React Flow
  if (view === 'path-visualization' && pathVisualizationFinding) {
    return (
      <PathVisualization
        finding={pathVisualizationFinding as Finding}
        onBack={handleBack}
        onTechniqueClick={(technique) => {
          setSelectedTechnique(technique)
          setView('technique')
          setPathVisualizationFinding(null)
        }}
        techniquesByTactic={techniquesByTactic}
      />
    )
  }

  // Get all tactics that have techniques
  const availableTactics = MITRE_TACTICS.filter((tactic) => {
    const techniques = techniquesByTactic.get(tactic)
    const techniqueList = techniques ? Array.from(techniques.values()) : []
    return techniqueList.length > 0
  })

  const handleTacticToggle = (tactic: string): void => {
    setSelectedTactics((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(tactic)) {
        newSet.delete(tactic)
      } else {
        newSet.add(tactic)
      }
      return newSet
    })
  }

  // Calculate total stats
  const totalTechniques = Array.from(techniquesByTactic.values()).reduce(
    (sum, techniques) => sum + (techniques ? Array.from(techniques.values()).length : 0),
    0
  )
  const totalFindings = Array.from(findingsByTechnique.values()).reduce(
    (sum, findings) => sum + findings.length,
    0
  )
  const visibleColumnsCount = Array.from(selectedTactics).length

  // Matrix View (default)
  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Enhanced Header Section */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="px-6 lg:px-8 py-6">
          {/* Stats Bar with Filter Columns */}
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-body-xs text-gray-600 dark:text-gray-400">
                  <span className="font-semibold text-gray-900 dark:text-white">{visibleColumnsCount}</span> columns visible
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span className="text-body-xs text-gray-600 dark:text-gray-400">
                  <span className="font-semibold text-gray-900 dark:text-white">{totalTechniques}</span> techniques
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-body-xs text-gray-600 dark:text-gray-400">
                  <span className="font-semibold text-gray-900 dark:text-white">{totalFindings}</span> findings
                </span>
              </div>
            </div>
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-body-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all shadow-sm hover:shadow"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span>Filter Columns</span>
                <svg
                  className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20 max-h-[500px] overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                      <div className="text-body-sm font-semibold text-gray-900 dark:text-white mb-3">
                        Select Columns to Display
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedTactics(new Set(availableTactics))
                          }}
                          className="px-3 py-1.5 text-body-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 rounded-md hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors"
                        >
                          Select All
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTactics(new Set())
                          }}
                          className="px-3 py-1.5 text-body-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>
                    <div className="overflow-y-auto p-2">
                      {availableTactics.map((tactic) => {
                        const techniques = techniquesByTactic.get(tactic)
                        const techniqueList = techniques ? Array.from(techniques.values()) : []
                        const isSelected = selectedTactics.has(tactic)

                        return (
                          <label
                            key={tactic}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${isSelected
                              ? 'bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                              }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleTacticToggle(tactic)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <span className={`text-body-sm flex-1 font-medium ${isSelected
                              ? 'text-gray-900 dark:text-white'
                              : 'text-gray-700 dark:text-gray-300'
                              }`}>
                              {tactic}
                            </span>
                            <span className={`text-body-xs px-2 py-0.5 rounded-full font-medium ${isSelected
                              ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                              }`}>
                              {techniqueList.length}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Matrix Layout */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 lg:px-8 py-6">
        {visibleColumnsCount === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <h3 className="text-h4 font-semibold text-gray-900 dark:text-white mb-2">
                No columns selected
              </h3>
              <p className="text-body-sm text-gray-600 dark:text-gray-400 mb-4">
                Use the "Filter Columns" button to select which tactic columns you'd like to display.
              </p>
              <button
                onClick={() => {
                  setSelectedTactics(new Set(availableTactics))
                  setDropdownOpen(true)
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-body-sm font-medium transition-colors"
              >
                Select All Columns
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-4 h-full pb-4">
            {availableTactics.filter((tactic) => selectedTactics.has(tactic)).map((tactic) => {
              const techniques = techniquesByTactic.get(tactic)
              const techniqueList = techniques ? Array.from(techniques.values()) : []
              const isHovered = hoveredColumn === tactic
              const hasHoveredColumn = hoveredColumn !== null

              return (
                <div
                  key={tactic}
                  onMouseEnter={() => setHoveredColumn(tactic)}
                  onMouseLeave={() => setHoveredColumn(null)}
                  className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm transition-all duration-300 flex flex-col ${isHovered
                    ? 'flex-[2_2_0%] min-w-[320px] shadow-xl z-10 border-blue-300 dark:border-blue-700'
                    : hasHoveredColumn
                      ? 'flex-[0.5_0.5_0%] min-w-[120px] opacity-60'
                      : 'flex-1 min-w-0'
                    } hover:shadow-md`}
                >
                  {/* Enhanced Tactic Header */}
                  <div className={`bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-700 transition-all ${isHovered ? 'from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800' : ''
                    }`}>
                    <h3 className={`font-bold text-gray-900 dark:text-white text-center mb-1 transition-all ${isHovered ? 'text-body-base' : 'text-body-sm'
                      }`}>
                      {tactic}
                    </h3>
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-body-xs text-gray-600 dark:text-gray-400">
                        {techniqueList.length}
                      </span>
                      <span className="text-body-xs text-gray-500 dark:text-gray-500">
                        technique{techniqueList.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Enhanced Techniques List */}
                  <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-950/50">
                    {techniqueList.length === 0 ? (
                      <div className="p-6 text-center text-body-xs text-gray-500 dark:text-gray-400">
                        No techniques
                      </div>
                    ) : (
                      <div className="p-3 space-y-2.5">
                        {techniqueList.map((technique) => {
                          const techniqueKey = technique.stix_id || technique.name
                          const fullKey = `${tactic}::${techniqueKey}`
                          const findings = findingsByTechnique.get(fullKey) || []
                          const findingCount = findings.length

                          return (
                            <button
                              key={techniqueKey}
                              onClick={() => handleTechniqueClick(tactic, techniqueKey, technique)}
                              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3.5 text-left hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md hover:bg-blue-50/50 dark:hover:bg-blue-950/10 transition-all group"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className={`text-body-xs font-semibold text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors ${isHovered ? '' : 'truncate'
                                    }`}>
                                    {technique.name}
                                  </div>
                                </div>
                                <div className="flex-shrink-0">
                                  <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-body-xs font-bold bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 text-white shadow-sm">
                                    {findingCount}
                                  </span>
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default AttackPaths
