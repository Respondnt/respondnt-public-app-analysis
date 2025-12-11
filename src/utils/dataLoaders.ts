import type { AttackPathsData, Finding, AdversarialMethod, Technique, Hypothesis, AttackFlowStep, ComprehensiveAnalysisResults, TacticExplorerOutput, TacticVector } from '../types'


/**
 * Loads comprehensive analysis results data
 * Data comes from data/comprehensive/{appName}_comprehensive_analysis.json
 * 
 * @param baseUrl - Base URL for fetching data (typically import.meta.env.BASE_URL)
 * @param appName - Application name (e.g., 'github', 'slack')
 * @returns Promise resolving to ComprehensiveAnalysisResults or null if not found
 */
export async function loadComprehensiveAnalysisData(
  baseUrl: string,
  appName: string
): Promise<ComprehensiveAnalysisResults | null> {
  try {
    const response = await fetch(`${baseUrl}data/comprehensive/${appName}_comprehensive_analysis.json`)
    if (!response.ok) {
      return null
    }
    
    const rawData = await response.json()
    
    // Validate the structure matches ComprehensiveAnalysisResults
    if (
      rawData &&
      typeof rawData === 'object' &&
      rawData.application_name &&
      rawData.initial_access &&
      rawData.discovery &&
      rawData.execution &&
      rawData.persistence &&
      rawData.privilege_escalation &&
      rawData.defense_evasion &&
      rawData.credential_access &&
      rawData.lateral_movement &&
      rawData.collection &&
      rawData.command_and_control &&
      rawData.exfiltration &&
      rawData.impact
    ) {
      return rawData as ComprehensiveAnalysisResults
    }
    
    return null
  } catch (error) {
    console.warn(`Failed to load comprehensive analysis data for ${appName}:`, error)
    return null
  }
}

/**
 * Transforms ComprehensiveAnalysisResults into AttackPathsData format
 * Converts vectors from all tactics into Findings with AdversarialMethods
 * 
 * @param comprehensiveData - The comprehensive analysis data to transform
 * @returns AttackPathsData with attack_paths array containing all vectors from all tactics
 */
function transformComprehensiveAnalysisToAttackPaths(
  comprehensiveData: ComprehensiveAnalysisResults
): AttackPathsData {
  const findings: Finding[] = []
  
  // Map of tactic names to their explorer outputs
  const tacticMap: Record<string, TacticExplorerOutput> = {
    'Initial Access': comprehensiveData.initial_access,
    'Discovery': comprehensiveData.discovery,
    'Execution': comprehensiveData.execution,
    'Persistence': comprehensiveData.persistence,
    'Privilege Escalation': comprehensiveData.privilege_escalation,
    'Defense Evasion': comprehensiveData.defense_evasion,
    'Credential Access': comprehensiveData.credential_access,
    'Lateral Movement': comprehensiveData.lateral_movement,
    'Collection': comprehensiveData.collection,
    'Command and Control': comprehensiveData.command_and_control,
    'Exfiltration': comprehensiveData.exfiltration,
    'Impact': comprehensiveData.impact,
  }
  
  // Process each tactic
  Object.entries(tacticMap).forEach(([tacticName, explorerOutput]) => {
    if (!explorerOutput || !explorerOutput.vectors || !Array.isArray(explorerOutput.vectors)) {
      return
    }
    
    // Convert each vector in this tactic to a Finding
    // Only process achievable vectors
    explorerOutput.vectors
      .filter((vector: TacticVector) => vector.can_achieve === true)
      .forEach((vector: TacticVector) => {
      // Create a Technique from the vector's technique information
      const technique: Technique = {
        stix_id: vector.technique_stix_id,
        name: vector.technique_name,
        tactic: tacticName,
      }
      
      // Convert method_steps to attack_flow_hypothesis format for PathVisualization
      const attackFlowSteps: AttackFlowStep[] = (vector.method_steps || []).map((step, idx) => {
        // Format step name - use step_id if available, otherwise use index
        const stepName = step.step_id 
          ? `Step ${step.step_id}` 
          : `Step ${idx + 1}`
        
        // Format technique display - include both ID and name if available
        const techniqueDisplay = vector.technique_stix_id && vector.technique_name
          ? `${vector.technique_stix_id} – ${vector.technique_name}`
          : (vector.technique_stix_id || vector.technique_name || '')
        
        return {
          step_name: stepName,
          step_description: step.description || '',
          step_mitre_tactic: tacticName,
          step_mitre_technique: techniqueDisplay,
        }
      })
      
      // Create a Hypothesis with the attack flow steps
      const hypothesis: Hypothesis = {
        starting_tactic: tacticName,
        objective_tactic: tacticName,
        attack_flow_hypothesis: attackFlowSteps,
      }
      
      // Create an AdversarialMethod with the technique and method steps
      const adversarialMethod: AdversarialMethod = {
        tactic_name: tacticName,
        selected_techniques: [technique],
        method_steps: vector.method_steps,
        can_achieve: vector.can_achieve,
        capabilities_used: vector.capabilities_used,
        interfaces_used: vector.interfaces_used,
        data_accessed: vector.data_accessed,
        preconditions_required: vector.preconditions_required,
        constraints_encountered: vector.constraints_encountered,
        evasion_considerations: vector.evasion_considerations,
        resulting_access: vector.resulting_access,
        comments: vector.comments,
      }
      
      // Create a Finding from the vector
      const finding: Finding = {
        scenario_name: vector.technique_name,
        hypothesis: hypothesis,
        adversarial_methods: [adversarialMethod],
        method: adversarialMethod,
      }
      
      findings.push(finding)
    })
  })
  
  return {
    attack_paths: findings,
    application_name: comprehensiveData.application_name,
  }
}

/**
 * Loads attack paths data from comprehensive analysis results
 * Only supports comprehensive analysis format from data/comprehensive/{appName}_comprehensive_analysis.json
 * 
 * @param baseUrl - Base URL for fetching data (typically import.meta.env.BASE_URL)
 * @param appName - Application name (e.g., 'github')
 * @returns Promise resolving to AttackPathsData transformed from comprehensive analysis
 * @throws Error if comprehensive analysis data is not found
 */
export async function loadAttackPathsData(
  baseUrl: string,
  appName: string
): Promise<AttackPathsData> {
  const comprehensiveData = await loadComprehensiveAnalysisData(baseUrl, appName)
  if (!comprehensiveData) {
    throw new Error(
      `Comprehensive analysis data not found for ${appName}. ` +
      `Expected file: data/comprehensive/${appName}_comprehensive_analysis.json`
    )
  }
  
  return transformComprehensiveAnalysisToAttackPaths(comprehensiveData)
}


