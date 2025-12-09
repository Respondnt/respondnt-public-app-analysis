// Shared types for the application

export interface Technique {
  stix_id?: string
  name: string
  rationale?: string
  tactic?: string
}

export interface AdversarialMethod {
  tactic_name: string
  selected_techniques?: Technique[]
  method_steps?: MethodStep[]
}

export interface AttackFlowStep {
  step_name: string
  step_description: string
  step_mitre_tactic: string
  step_mitre_technique: string
}

export interface Hypothesis {
  attack_target?: string
  preconditions?: string
  starting_tactic?: string
  objective_tactic?: string
  attack_flow_hypothesis: AttackFlowStep[]
}

export interface Finding {
  scenario_name?: string
  hypothesis?: Hypothesis
  adversarial_methods?: AdversarialMethod[]
  method?: AdversarialMethod
}

export interface TechniqueInfo {
  tactic: string
  techniqueKey: string
  technique: Technique
}

export interface MethodStep {
  step_id?: string | number
  description: string
  related_capabilities?: string[]
  related_interfaces?: string[]
  related_data?: string[]
  notes?: string
}

export interface Interface {
  channel: string
  details: string
  url?: string
}

export interface Evidence {
  title: string
  url?: string
  summary?: string
}

export interface Capability {
  name: string
  description: string
  primary_actors?: string[]
  main_interfaces?: Interface[]
  key_data_involved?: string[]
  security_relevant_traits?: string[]
  notes?: string
  evidence?: Evidence[]
}

export interface TechnicalComponent {
  name: string
  description?: string
}

export interface TechnicalComponents {
  services_or_modules?: TechnicalComponent[]
  storage_and_logs?: TechnicalComponent[]
  external_systems?: TechnicalComponent[]
  data_flows?: TechnicalComponent[]
}

export interface CapabilityMap {
  core_product_capabilities?: Capability[]
  administrative_and_operational_capabilities?: Capability[]
  api_surface_and_integrations?: Capability[]
  background_jobs_and_automation?: Capability[]
}

export interface BreakdownData {
  application_name: string
  generated_at?: string
  capability_map?: CapabilityMap
  technical_components_and_data_flows?: TechnicalComponents
}

export interface AttackPathsData {
  attack_paths?: Finding[]
}

export interface TechniqueSpecificInfo {
  method: AdversarialMethod
  technique: Technique
  rationale?: string | null
  methodSteps: AttackFlowStep[]
  allMethodSteps: MethodStep[]
}

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

export interface InitialAccessData {
  application_name: string
  initial_access_vectors: InitialAccessVector[]
  summary?: string
}

