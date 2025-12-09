import type { AttackPathsData, InitialAccessData, Finding, AdversarialMethod, Technique, Hypothesis, AttackFlowStep } from '../types'

/**
 * Attempts to load and parse attack paths data in Slack format
 * Slack format has selected_techniques array in adversarial_methods
 */
async function loadSlackFormatAttackPaths(
  baseUrl: string,
  appName: string
): Promise<AttackPathsData | null> {
  try {
    const response = await fetch(`${baseUrl}data/attack_paths/${appName}_attack_paths.json`)
    if (!response.ok) {
      return null
    }
    
    const rawData = await response.json()
    
    // Validate it's Slack format (has selected_techniques in adversarial_methods)
    if (rawData && typeof rawData === 'object' && rawData.attack_paths && Array.isArray(rawData.attack_paths)) {
      // Check if it has the Slack format structure (with selected_techniques)
      const hasSlackFormat = rawData.attack_paths.some((path: any) => {
        return path.adversarial_methods?.some((method: any) => 
          method.selected_techniques && Array.isArray(method.selected_techniques)
        )
      })
      
      if (hasSlackFormat) {
        return rawData as AttackPathsData
      }
    }
    
    return null
  } catch (error) {
    console.warn('Failed to parse Slack format attack paths:', error)
    return null
  }
}

/**
 * Attempts to load and parse attack paths data in Miro/1Password format
 * Miro/1Password format has method_steps as strings (not objects) and additional fields
 * like capabilities_used, interfaces_used, data_accessed, etc.
 */
async function loadMiro1PasswordFormatAttackPaths(
  baseUrl: string,
  appName: string
): Promise<AttackPathsData | null> {
  try {
    const response = await fetch(`${baseUrl}data/attack_paths/${appName}_attack_paths.json`)
    if (!response.ok) {
      return null
    }
    
    const rawData = await response.json()
    
    // Validate it's Miro/1Password format
    if (rawData && typeof rawData === 'object' && rawData.attack_paths && Array.isArray(rawData.attack_paths)) {
      // Check if it has the Miro/1Password format structure
      // (method_steps as strings, capabilities_used, interfaces_used, etc., and NO selected_techniques)
      const hasMiro1PasswordFormat = rawData.attack_paths.some((path: any) => {
        return path.adversarial_methods?.some((method: any) => {
          // Has method_steps as array (could be strings or objects)
          const hasMethodSteps = method.method_steps && Array.isArray(method.method_steps)
          // Has additional fields like capabilities_used
          const hasAdditionalFields = method.capabilities_used || method.interfaces_used || method.data_accessed
          // Does NOT have selected_techniques (or it's empty/undefined)
          const noSelectedTechniques = !method.selected_techniques || !Array.isArray(method.selected_techniques) || method.selected_techniques.length === 0
          
          return hasMethodSteps && hasAdditionalFields && noSelectedTechniques
        })
      })
      
      if (hasMiro1PasswordFormat) {
        return rawData as AttackPathsData
      }
    }
    
    return null
  } catch (error) {
    console.warn('Failed to parse Miro/1Password format attack paths:', error)
    return null
  }
}


/**
 * Main data loader with fallback logic
 * Tries different attack paths data formats in order:
 * 1. For Box and Klaviyo: Load initial access data and transform to attack paths format
 * 2. Slack format (has selected_techniques in adversarial_methods) - for slack app
 * 3. Miro/1Password format (method_steps as strings, capabilities_used, etc., no selected_techniques) - for miro and 1password apps
 * 
 * For Box/Klaviyo: data comes from data/initial_access/{appName}_initial_access_vectors.json
 * For others: data comes from data/attack_paths/{appName}_attack_paths.json
 * Each format parser is tried sequentially. If parsing fails (wrong format), the next method is attempted.
 */
export async function loadAttackPathsData(
  baseUrl: string,
  appName: string
): Promise<AttackPathsData> {
  // For Box and Klaviyo, use initial access data instead of attack paths
  if (appName === 'box' || appName === 'klaviyo') {
    const initialAccessData = await loadInitialAccessData(baseUrl, appName)
    if (initialAccessData) {
      return transformInitialAccessToAttackPaths(initialAccessData)
    }
    // If initial access data not found, fall through to try attack paths as fallback
  }
  
  // Try Slack format first (for slack app)
  if (appName === 'slack') {
    const slackData = await loadSlackFormatAttackPaths(baseUrl, appName)
    if (slackData) {
      return slackData
    }
  }
  
  // Try Miro/1Password format (for miro and 1password apps)
  if (appName === 'miro' || appName === '1password') {
    const miro1PasswordData = await loadMiro1PasswordFormatAttackPaths(baseUrl, appName)
    if (miro1PasswordData) {
      return miro1PasswordData
    }
  }
  
  // For other apps or if format detection fails, try both formats
  const slackData = await loadSlackFormatAttackPaths(baseUrl, appName)
  if (slackData) {
    return slackData
  }
  
  const miro1PasswordData = await loadMiro1PasswordFormatAttackPaths(baseUrl, appName)
  if (miro1PasswordData) {
    return miro1PasswordData
  }
  
  // If all fail, throw error with details about what was tried
  throw new Error(
    `Failed to load attack paths data for ${appName}. ` +
    (appName === 'box' || appName === 'klaviyo'
      ? `Tried: (1) Initial access data from data/initial_access/${appName}_initial_access_vectors.json, (2) Attack paths from data/attack_paths/${appName}_attack_paths.json. `
      : `Tried: (1) Slack format (with selected_techniques), (2) Miro/1Password format (with method_steps as strings). `) +
    `None of the formats could be parsed successfully.`
  )
}

/**
 * Loads initial access vectors data for Box and Klaviyo applications
 * Data comes from data/initial_access/{appName}_initial_access_vectors.json
 * 
 * @param baseUrl - Base URL for fetching data (typically import.meta.env.BASE_URL)
 * @param appName - Application name (e.g., 'box', 'klaviyo')
 * @returns Promise resolving to InitialAccessData or null if not found
 */
export async function loadInitialAccessData(
  baseUrl: string,
  appName: string
): Promise<InitialAccessData | null> {
  try {
    const response = await fetch(`${baseUrl}data/initial_access/${appName}_initial_access_vectors.json`)
    if (!response.ok) {
      return null
    }
    
    const rawData = await response.json()
    
    // Validate the structure matches InitialAccessData
    if (
      rawData &&
      typeof rawData === 'object' &&
      rawData.application_name &&
      Array.isArray(rawData.initial_access_vectors)
    ) {
      return rawData as InitialAccessData
    }
    
    return null
  } catch (error) {
    console.warn(`Failed to load initial access data for ${appName}:`, error)
    return null
  }
}

/**
 * Transforms InitialAccessData into AttackPathsData format
 * Converts each initial access vector into a Finding with an AdversarialMethod
 * 
 * @param initialAccessData - The initial access data to transform
 * @returns AttackPathsData with attack_paths array
 */
function transformInitialAccessToAttackPaths(
  initialAccessData: InitialAccessData
): AttackPathsData {
  const findings: Finding[] = initialAccessData.initial_access_vectors.map((vector) => {
    // Create a Technique from the vector's technique information
    const technique: Technique = {
      stix_id: vector.technique_stix_id,
      name: vector.technique_name,
      tactic: 'Initial Access',
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
        step_mitre_tactic: 'Initial Access',
        step_mitre_technique: techniqueDisplay,
      }
    })

    // Create a Hypothesis with the attack flow steps
    const hypothesis: Hypothesis = {
      starting_tactic: 'Initial Access',
      objective_tactic: 'Initial Access',
      attack_flow_hypothesis: attackFlowSteps,
    }

    // Create an AdversarialMethod with the technique and method steps
    const adversarialMethod: AdversarialMethod = {
      tactic_name: 'Initial Access',
      selected_techniques: [technique],
      method_steps: vector.method_steps,
    }

    // Create a Finding from the vector
    const finding: Finding = {
      scenario_name: vector.technique_name,
      hypothesis: hypothesis, // Add hypothesis for PathVisualization
      adversarial_methods: [adversarialMethod],
      method: adversarialMethod, // Also set method for compatibility
    }

    return finding
  })

  return {
    attack_paths: findings,
  }
}

