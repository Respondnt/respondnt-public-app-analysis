// Method Step types
export interface MethodStep {
  step_id?: number | string
  description: string
  related_capabilities?: string[]
  related_interfaces?: string[]
  related_data?: string[]
  notes?: string
}

// Attack Flow Step for visualization
export interface AttackFlowStep {
  step_name: string
  step_description: string
  step_mitre_tactic: string
  step_mitre_technique: string
}

// Technique type
export interface Technique {
  stix_id?: string
  name: string
  rationale?: string
  tactic?: string
}

// Adversarial Method
export interface AdversarialMethod {
  tactic_name: string
  selected_techniques?: Technique[]
  method_steps?: MethodStep[]
  can_achieve?: boolean
  capabilities_used?: string[]
  interfaces_used?: string[]
  data_accessed?: string[]
  preconditions_required?: string[]
  constraints_encountered?: string[]
  evasion_considerations?: string[]
  resulting_access?: string
  comments?: string
}

// Hypothesis
export interface Hypothesis {
  attack_flow_hypothesis?: AttackFlowStep[]
  starting_tactic?: string
  objective_tactic?: string
  attack_target?: string
  preconditions?: string
  scenario_name?: string
}

// Finding (attack path)
export interface Finding {
  scenario_name?: string
  hypothesis?: Hypothesis
  adversarial_methods?: AdversarialMethod[]
  method?: AdversarialMethod
}

// Attack Paths Data
export interface AttackPathsData {
  attack_paths: Finding[]
  application_name?: string
}

// Initial Access Vector
export interface InitialAccessVector {
  can_achieve?: boolean
  technique_name: string
  technique_stix_id?: string
  method_steps?: MethodStep[]
  capabilities_used?: string[]
  interfaces_used?: string[]
  data_accessed?: string[]
  preconditions_required?: string[]
  constraints_encountered?: string[]
  evasion_considerations?: string[]
  resulting_access?: string
  comments?: string
}

// Initial Access Data
export interface InitialAccessData {
  application_name: string
  initial_access_vectors: InitialAccessVector[]
}

// Tactic Explorer Output (base structure for all tactics)
export interface TacticExplorerOutput {
  vectors: TacticVector[]
}

// Tactic Vector (common structure for vectors across all tactics)
export interface TacticVector {
  can_achieve?: boolean
  technique_name: string
  technique_stix_id?: string
  method_steps?: MethodStep[]
  capabilities_used?: string[]
  interfaces_used?: string[]
  data_accessed?: string[]
  preconditions_required?: string[]
  constraints_encountered?: string[]
  evasion_considerations?: string[]
  resulting_access?: string
  comments?: string
}

// Comprehensive Analysis Results
export interface ComprehensiveAnalysisResults {
  application_name: string
  initial_access: TacticExplorerOutput
  discovery: TacticExplorerOutput
  execution: TacticExplorerOutput
  persistence: TacticExplorerOutput
  privilege_escalation: TacticExplorerOutput
  defense_evasion: TacticExplorerOutput
  credential_access: TacticExplorerOutput
  lateral_movement: TacticExplorerOutput
  collection: TacticExplorerOutput
  command_and_control: TacticExplorerOutput
  exfiltration: TacticExplorerOutput
  impact: TacticExplorerOutput
}

// Technique Info for component state
export interface TechniqueInfo {
  tactic: string
  techniqueKey: string
  technique: Technique
}

// Technique Specific Info
export interface TechniqueSpecificInfo {
  method: AdversarialMethod
  technique: Technique
  rationale?: string
  methodSteps: AttackFlowStep[]
  allMethodSteps?: MethodStep[]
}

// Breakdown Data types
export interface Capability {
  name: string
  description?: string
  category?: string
  evidence?: Array<{
    title: string
    url?: string
    summary?: string
  }>
  interfaces?: Array<{
    name: string
    channel?: string
    url?: string
  }>
}

export interface BreakdownData {
  application_name: string
  generated_at?: string
  capabilities?: Capability[]
}
