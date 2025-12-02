import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function ApplicationBreakdown({ appName }) {
  const [breakdownData, setBreakdownData] = useState(null)
  const [attackPathsData, setAttackPathsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeSection, setActiveSection] = useState('attack_paths')
  const [expandedAttackPaths, setExpandedAttackPaths] = useState(new Set())
  const [expandedMethods, setExpandedMethods] = useState(new Set())

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        // Use import.meta.env.BASE_URL for proper path resolution in dev and production
        const baseUrl = import.meta.env.BASE_URL
        
        // Load breakdown data
        const breakdownResponse = await fetch(`${baseUrl}data/breakdowns/${appName}_app_breakdown.json`)
        if (!breakdownResponse.ok) {
          throw new Error(`Failed to load breakdown data: ${breakdownResponse.statusText}`)
        }
        const breakdownData = await breakdownResponse.json()
        setBreakdownData(breakdownData)
        
        // Try to load attack paths data (optional - may not exist)
        try {
          const attackPathsResponse = await fetch(`${baseUrl}data/attack_paths/${appName}_attack_paths.json`)
          if (attackPathsResponse.ok) {
            const attackPathsData = await attackPathsResponse.json()
            setAttackPathsData(attackPathsData)
          } else {
            // Attack paths not available - set to null to show "not available" message
            setAttackPathsData(null)
          }
        } catch (attackPathsErr) {
          // Attack paths not available - set to null to show "not available" message
          console.log('Attack paths not available for this application')
          setAttackPathsData(null)
        }
        
        setError(null)
      } catch (err) {
        console.error('Error loading application breakdown:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [appName])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="text-body text-gray-600 dark:text-gray-400">Loading...</div>
        </div>
      </div>
    )
  }

  if (error || !breakdownData) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="text-body text-red-600 dark:text-red-400 mb-4">
            {error || 'Failed to load application breakdown'}
          </div>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-accent-primary text-white rounded-lg font-medium transition-all duration-200 hover:shadow-md hover:shadow-accent-primary/30"
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  const getInterfaceChannelBadgeStyle = (channel) => {
    switch (channel) {
      case 'ui':
        return 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300'
      case 'api':
        return 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300'
      case 'cli':
        return 'bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300'
      case 'integration':
        return 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300'
      case 'webhook':
        return 'bg-pink-50 dark:bg-pink-950/20 text-pink-700 dark:text-pink-300'
      default:
        return 'bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300'
    }
  }

  const renderCapability = (capability, index) => (
    <div key={index} className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
      <h4 className="text-h4 font-semibold text-gray-900 dark:text-white mb-3">
        {capability.name}
      </h4>
      <p className="text-body text-gray-700 dark:text-gray-300 mb-4">
        {capability.description}
      </p>

      {/* Primary Actors */}
      {capability.primary_actors && capability.primary_actors.length > 0 && (
        <div className="mb-4">
          <h5 className="text-body-sm font-semibold text-gray-900 dark:text-white mb-2">
            Primary Actors
          </h5>
          <div className="flex flex-wrap gap-2">
            {capability.primary_actors.map((actor, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2.5 py-1 rounded-md text-body-xs font-medium bg-accent-primary/10 text-accent-primary dark:bg-accent-primary/20"
              >
                {actor}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Interfaces */}
      {capability.main_interfaces && capability.main_interfaces.length > 0 && (
        <div className="mb-4">
          <h5 className="text-body-sm font-semibold text-gray-900 dark:text-white mb-2">
            Main Interfaces
          </h5>
          <div className="space-y-2">
            {capability.main_interfaces.map((iface, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-body-xs font-medium ${getInterfaceChannelBadgeStyle(iface.channel)}`}>
                  {iface.channel.toUpperCase()}
                </span>
                <div className="flex-1">
                  <p className="text-body-sm text-gray-700 dark:text-gray-300">
                    {iface.details}
                  </p>
                  {iface.url && (
                    <a
                      href={iface.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-body-xs text-accent-primary hover:underline mt-1 block"
                    >
                      {iface.url}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Data Involved */}
      {capability.key_data_involved && capability.key_data_involved.length > 0 && (
        <div className="mb-4">
          <h5 className="text-body-sm font-semibold text-gray-900 dark:text-white mb-2">
            Key Data Involved
          </h5>
          <ul className="list-disc list-inside space-y-1">
            {capability.key_data_involved.map((data, idx) => (
              <li key={idx} className="text-body-sm text-gray-700 dark:text-gray-300">
                {data}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Security Relevant Traits */}
      {capability.security_relevant_traits && capability.security_relevant_traits.length > 0 && (
        <div className="mb-4">
          <h5 className="text-body-sm font-semibold text-gray-900 dark:text-white mb-2">
            Security Relevant Traits
          </h5>
          <ul className="list-disc list-inside space-y-1">
            {capability.security_relevant_traits.map((trait, idx) => (
              <li key={idx} className="text-body-sm text-gray-700 dark:text-gray-300">
                {trait}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Notes */}
      {capability.notes && (
        <div className="mb-4">
          <h5 className="text-body-sm font-semibold text-gray-900 dark:text-white mb-2">
            Notes
          </h5>
          <p className="text-body-sm text-gray-600 dark:text-gray-400 italic">
            {capability.notes}
          </p>
        </div>
      )}

      {/* Evidence */}
      {capability.evidence && capability.evidence.length > 0 && (
        <div>
          <h5 className="text-body-sm font-semibold text-gray-900 dark:text-white mb-2">
            Evidence
          </h5>
          <div className="space-y-1">
            {capability.evidence.map((ev, idx) => (
              <div key={idx} className="text-body-sm text-gray-600 dark:text-gray-400">
                {ev.url ? (
                  <a
                    href={ev.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-primary hover:underline"
                  >
                    {ev.title}
                  </a>
                ) : (
                  <span>{ev.title}</span>
                )}
                {ev.summary && <span className="ml-2">- {ev.summary}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const sections = [
    { id: 'attack_paths', label: 'Attack Paths' },
    { id: 'technical', label: 'Technical Components' },
    { id: 'admin', label: 'Admin & Operations' },
    { id: 'api', label: 'API & Integrations' },
    { id: 'automation', label: 'Background & Automation' },
    { id: 'security', label: 'Security Behaviours' },
    { id: 'core', label: 'Core Product Capabilities' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
      <div className="mb-8">
        <Link
          to="/"
          className="inline-flex items-center text-body-sm text-gray-600 dark:text-gray-400 hover:text-accent-primary transition-colors mb-4"
        >
          ← Back to Home
        </Link>
        <h1 className="text-display-lg font-bold text-gray-900 dark:text-white mb-2">
          {breakdownData.application_name}
        </h1>
        {breakdownData.generated_at && (
          <p className="text-body-sm text-gray-600 dark:text-gray-400">
            Generated: {new Date(breakdownData.generated_at).toLocaleDateString()}
          </p>
        )}
      </div>

      <div className="space-y-6">
        {/* Section Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-4">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`
                px-4 py-2 rounded-lg text-body-sm font-medium transition-all
                ${activeSection === section.id
                  ? section.id === 'attack_paths'
                    ? 'bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900/50'
                    : 'bg-accent-primary text-white'
                  : section.id === 'attack_paths'
                    ? 'bg-red-50 dark:bg-red-950/10 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/20 border border-red-100 dark:border-red-900/30'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
            >
              {section.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {activeSection === 'core' && breakdownData.capability_map?.core_product_capabilities && (
            <div>
              <h3 className="text-h3 font-semibold text-gray-900 dark:text-white mb-6">
                Core Product Capabilities
              </h3>
              {breakdownData.capability_map.core_product_capabilities.map((cap, idx) => renderCapability(cap, idx))}
            </div>
          )}

          {/* Administrative and Operational Capabilities */}
          {activeSection === 'admin' && breakdownData.capability_map?.administrative_and_operational_capabilities && (
            <div>
              <h3 className="text-h3 font-semibold text-gray-900 dark:text-white mb-6">
                Administrative and Operational Capabilities
              </h3>
              {breakdownData.capability_map.administrative_and_operational_capabilities.map((cap, idx) => renderCapability(cap, idx))}
            </div>
          )}

          {/* API Surface and Integrations */}
          {activeSection === 'api' && breakdownData.capability_map?.api_surface_and_integrations && (
            <div>
              <h3 className="text-h3 font-semibold text-gray-900 dark:text-white mb-6">
                API Surface and Integrations
              </h3>
              {breakdownData.capability_map.api_surface_and_integrations.map((cap, idx) => renderCapability(cap, idx))}
            </div>
          )}

          {/* Background Jobs and Automation */}
          {activeSection === 'automation' && breakdownData.capability_map?.background_jobs_and_automation && (
            <div>
              <h3 className="text-h3 font-semibold text-gray-900 dark:text-white mb-6">
                Background Jobs and Automation
              </h3>
              {breakdownData.capability_map.background_jobs_and_automation.map((cap, idx) => renderCapability(cap, idx))}
            </div>
          )}

          {/* Technical Components and Data Flows */}
          {activeSection === 'technical' && breakdownData.technical_components_and_data_flows && (
            <div className="space-y-6">
              {breakdownData.technical_components_and_data_flows.services_or_modules && (
                <div>
                  <h3 className="text-h3 font-semibold text-gray-900 dark:text-white mb-4">
                    Services or Modules
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {breakdownData.technical_components_and_data_flows.services_or_modules.map((item, idx) => (
                      <div key={idx} className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h4 className="text-body font-semibold text-gray-900 dark:text-white mb-1">
                          {item.name}
                        </h4>
                        {item.description && (
                          <p className="text-body-sm text-gray-700 dark:text-gray-300">
                            {item.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {breakdownData.technical_components_and_data_flows.storage_and_logs && (
                <div>
                  <h3 className="text-h3 font-semibold text-gray-900 dark:text-white mb-4">
                    Storage and Logs
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {breakdownData.technical_components_and_data_flows.storage_and_logs.map((item, idx) => (
                      <div key={idx} className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h4 className="text-body font-semibold text-gray-900 dark:text-white mb-1">
                          {item.name}
                        </h4>
                        {item.description && (
                          <p className="text-body-sm text-gray-700 dark:text-gray-300">
                            {item.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {breakdownData.technical_components_and_data_flows.external_systems && (
                <div>
                  <h3 className="text-h3 font-semibold text-gray-900 dark:text-white mb-4">
                    External Systems
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {breakdownData.technical_components_and_data_flows.external_systems.map((item, idx) => (
                      <div key={idx} className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h4 className="text-body font-semibold text-gray-900 dark:text-white mb-1">
                          {item.name}
                        </h4>
                        {item.description && (
                          <p className="text-body-sm text-gray-700 dark:text-gray-300">
                            {item.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {breakdownData.technical_components_and_data_flows.data_flows && (
                <div>
                  <h3 className="text-h3 font-semibold text-gray-900 dark:text-white mb-4">
                    Data Flows
                  </h3>
                  <div className="space-y-3">
                    {breakdownData.technical_components_and_data_flows.data_flows.map((item, idx) => (
                      <div key={idx} className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h4 className="text-body font-semibold text-gray-900 dark:text-white mb-1">
                          {item.name}
                        </h4>
                        {item.description && (
                          <p className="text-body-sm text-gray-700 dark:text-gray-300">
                            {item.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Security Relevant Behaviours */}
          {activeSection === 'security' && breakdownData.security_relevant_behaviours && (
            <div className="space-y-6">
              {breakdownData.security_relevant_behaviours.privileged_operations && (
                <div>
                  <h3 className="text-h3 font-semibold text-gray-900 dark:text-white mb-4">
                    Privileged Operations
                  </h3>
                  <ul className="list-disc list-inside space-y-2">
                    {breakdownData.security_relevant_behaviours.privileged_operations.map((op, idx) => (
                      <li key={idx} className="text-body text-gray-700 dark:text-gray-300">
                        {op}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {breakdownData.security_relevant_behaviours.user_configurable_logic && (
                <div>
                  <h3 className="text-h3 font-semibold text-gray-900 dark:text-white mb-4">
                    User Configurable Logic
                  </h3>
                  <ul className="list-disc list-inside space-y-2">
                    {breakdownData.security_relevant_behaviours.user_configurable_logic.map((logic, idx) => (
                      <li key={idx} className="text-body text-gray-700 dark:text-gray-300">
                        {logic}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {breakdownData.security_relevant_behaviours.auth_and_identity_behaviours && (
                <div>
                  <h3 className="text-h3 font-semibold text-gray-900 dark:text-white mb-4">
                    Auth and Identity Behaviours
                  </h3>
                  <ul className="list-disc list-inside space-y-2">
                    {breakdownData.security_relevant_behaviours.auth_and_identity_behaviours.map((behaviour, idx) => (
                      <li key={idx} className="text-body text-gray-700 dark:text-gray-300">
                        {behaviour}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {breakdownData.security_relevant_behaviours.logging_and_audit_behaviours && (
                <div>
                  <h3 className="text-h3 font-semibold text-gray-900 dark:text-white mb-4">
                    Logging and Audit Behaviours
                  </h3>
                  <ul className="list-disc list-inside space-y-2">
                    {breakdownData.security_relevant_behaviours.logging_and_audit_behaviours.map((behaviour, idx) => (
                      <li key={idx} className="text-body text-gray-700 dark:text-gray-300">
                        {behaviour}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {breakdownData.security_relevant_behaviours.failure_modes && (
                <div>
                  <h3 className="text-h3 font-semibold text-gray-900 dark:text-white mb-4">
                    Failure Modes
                  </h3>
                  <ul className="list-disc list-inside space-y-2">
                    {breakdownData.security_relevant_behaviours.failure_modes.map((mode, idx) => (
                      <li key={idx} className="text-body text-gray-700 dark:text-gray-300">
                        {mode}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Attack Paths */}
          {activeSection === 'attack_paths' && (
            <div>
              <h3 className="text-h3 font-semibold text-gray-900 dark:text-white mb-6">
                Attack Paths
              </h3>
              {attackPathsData && attackPathsData.attack_paths && attackPathsData.attack_paths.length > 0 ? (
                <div className="space-y-4">
                  {attackPathsData.attack_paths.map((attackPath, idx) => {
                    const isExpanded = expandedAttackPaths.has(idx)
                    return (
                      <div key={idx} className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        {/* Clickable Header */}
                        <button
                          onClick={() => {
                            const newExpanded = new Set(expandedAttackPaths)
                            if (isExpanded) {
                              newExpanded.delete(idx)
                            } else {
                              newExpanded.add(idx)
                            }
                            setExpandedAttackPaths(newExpanded)
                          }}
                          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                        >
                          <h4 className="text-h4 font-semibold text-gray-900 dark:text-white pr-4">
                            {attackPath.scenario_name}
                          </h4>
                          <svg
                            className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'transform rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {/* Collapsible Content */}
                        {isExpanded && (
                          <div className="px-6 pb-6 space-y-4">
                            {/* Attack Target */}
                            {attackPath.hypothesis?.attack_target && (
                              <div className="mb-4">
                                <h5 className="text-body-sm font-semibold text-gray-900 dark:text-white mb-2">
                                  Attack Target
                                </h5>
                                <p className="text-body text-gray-700 dark:text-gray-300">
                                  {attackPath.hypothesis.attack_target}
                                </p>
                              </div>
                            )}

                            {/* Preconditions */}
                            {attackPath.hypothesis?.preconditions && (
                              <div className="mb-4">
                                <h5 className="text-body-sm font-semibold text-gray-900 dark:text-white mb-2">
                                  Preconditions
                                </h5>
                                <p className="text-body-sm text-gray-700 dark:text-gray-300">
                                  {attackPath.hypothesis.preconditions}
                                </p>
                              </div>
                            )}

                            {/* Attack Flow Hypothesis */}
                            {attackPath.hypothesis?.attack_flow_hypothesis && attackPath.hypothesis.attack_flow_hypothesis.length > 0 && (
                              <div className="mb-6">
                                <h5 className="text-body-sm font-semibold text-gray-900 dark:text-white mb-3">
                                  Attack Flow
                                </h5>
                                <div className="space-y-3">
                                  {attackPath.hypothesis.attack_flow_hypothesis.map((step, stepIdx) => (
                                    <div key={stepIdx} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                      <div className="flex items-start justify-between mb-2">
                                        <h6 className="text-body font-medium text-gray-900 dark:text-white">
                                          {step.step_name}
                                        </h6>
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

                            {/* Adversarial Methods */}
                            {attackPath.adversarial_methods && attackPath.adversarial_methods.length > 0 && (
                              <div className="mb-6">
                                <h5 className="text-body-sm font-semibold text-gray-900 dark:text-white mb-4">
                                  Adversarial Methods
                                </h5>
                                <div className="space-y-3">
                                  {attackPath.adversarial_methods.map((method, methodIdx) => {
                                    const methodKey = `${idx}-${methodIdx}`
                                    const isMethodExpanded = expandedMethods.has(methodKey)
                                    const hasSteps = method.method_steps && method.method_steps.length > 0
                                    const stepCount = hasSteps ? method.method_steps.length : 0
                                    
                                    return (
                                      <div key={methodIdx} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                        {/* Method Header - Always Visible */}
                                        <button
                                          onClick={() => {
                                            const newExpanded = new Set(expandedMethods)
                                            if (isMethodExpanded) {
                                              newExpanded.delete(methodKey)
                                            } else {
                                              newExpanded.add(methodKey)
                                            }
                                            setExpandedMethods(newExpanded)
                                          }}
                                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                                        >
                                          <div className="flex-1">
                                            <h6 className="text-body font-semibold text-gray-900 dark:text-white mb-1">
                                              {method.tactic_name}
                                            </h6>
                                            {hasSteps && (
                                              <div className="flex items-center gap-3 text-body-xs text-gray-500 dark:text-gray-400">
                                                <span>{stepCount} step{stepCount !== 1 ? 's' : ''}</span>
                                                {method.capabilities_used && method.capabilities_used.length > 0 && (
                                                  <span>• {method.capabilities_used.length} capabilit{method.capabilities_used.length !== 1 ? 'ies' : 'y'}</span>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                          <svg
                                            className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform flex-shrink-0 ml-2 ${isMethodExpanded ? 'transform rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                          </svg>
                                        </button>

                                        {/* Collapsible Method Details */}
                                        {isMethodExpanded && (
                                          <div className="px-4 pb-4 space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                                            {/* Method Steps - Enhanced with numbered cards */}
                                            {hasSteps && (
                                              <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                  </svg>
                                                  <div className="text-body-sm font-semibold text-gray-900 dark:text-white">
                                                    Method Steps
                                                  </div>
                                                </div>
                                                <div className="space-y-2">
                                                  {method.method_steps.map((step, stepIdx) => (
                                                    <div key={stepIdx} className="flex gap-3 p-3 bg-blue-50/50 dark:bg-blue-950/10 rounded-lg border-l-4 border-blue-500">
                                                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white text-body-xs font-semibold flex items-center justify-center">
                                                        {stepIdx + 1}
                                                      </div>
                                                      <p className="text-body-sm text-gray-700 dark:text-gray-300 flex-1">
                                                        {step}
                                                      </p>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}

                                            {/* Quick Info Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                              {/* Capabilities Used */}
                                              {method.capabilities_used && method.capabilities_used.length > 0 && (
                                                <div>
                                                  <div className="flex items-center gap-2 mb-2">
                                                    <svg className="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <div className="text-body-sm font-semibold text-gray-900 dark:text-white">
                                                      Capabilities Used
                                                    </div>
                                                  </div>
                                                  <div className="flex flex-wrap gap-2">
                                                    {method.capabilities_used.map((capability, capIdx) => (
                                                      <span
                                                        key={capIdx}
                                                        className="inline-flex items-center px-2.5 py-1 rounded-md text-body-xs font-medium bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-900/30"
                                                      >
                                                        {capability}
                                                      </span>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}

                                              {/* Data Accessed */}
                                              {method.data_accessed && method.data_accessed.length > 0 && (
                                                <div>
                                                  <div className="flex items-center gap-2 mb-2">
                                                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                                    </svg>
                                                    <div className="text-body-sm font-semibold text-gray-900 dark:text-white">
                                                      Data Accessed
                                                    </div>
                                                  </div>
                                                  <ul className="space-y-1">
                                                    {method.data_accessed.map((data, dataIdx) => (
                                                      <li key={dataIdx} className="text-body-xs text-gray-700 dark:text-gray-300 flex items-start gap-2">
                                                        <span className="text-green-600 dark:text-green-400 mt-1">•</span>
                                                        <span>{data}</span>
                                                      </li>
                                                    ))}
                                                  </ul>
                                                </div>
                                              )}
                                            </div>

                                            {/* Interfaces Used */}
                                            {method.interfaces_used && method.interfaces_used.length > 0 && (
                                              <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                  <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                  </svg>
                                                  <div className="text-body-sm font-semibold text-gray-900 dark:text-white">
                                                    Interfaces Used
                                                  </div>
                                                </div>
                                                <ul className="space-y-1">
                                                  {method.interfaces_used.map((iface, ifaceIdx) => (
                                                    <li key={ifaceIdx} className="text-body-xs text-gray-700 dark:text-gray-300 flex items-start gap-2 pl-6">
                                                      <span className="text-purple-600 dark:text-purple-400 mt-1">→</span>
                                                      <span className="font-mono">{iface}</span>
                                                    </li>
                                                  ))}
                                                </ul>
                                              </div>
                                            )}

                                            {/* Preconditions Required */}
                                            {method.preconditions_required && method.preconditions_required.length > 0 && (
                                              <div className="bg-amber-50/50 dark:bg-amber-950/10 rounded-lg p-3 border border-amber-200 dark:border-amber-900/30">
                                                <div className="flex items-center gap-2 mb-2">
                                                  <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                  </svg>
                                                  <div className="text-body-sm font-semibold text-gray-900 dark:text-white">
                                                    Preconditions Required
                                                  </div>
                                                </div>
                                                <ul className="space-y-1">
                                                  {method.preconditions_required.map((precondition, precIdx) => (
                                                    <li key={precIdx} className="text-body-xs text-gray-700 dark:text-gray-300 flex items-start gap-2">
                                                      <span className="text-amber-600 dark:text-amber-400 mt-1">✓</span>
                                                      <span>{precondition}</span>
                                                    </li>
                                                  ))}
                                                </ul>
                                              </div>
                                            )}

                                            {/* Constraints & Evasion - Side by Side */}
                                            {(method.constraints_encountered && method.constraints_encountered.length > 0) || 
                                             (method.evasion_considerations && method.evasion_considerations.length > 0) ? (
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Constraints Encountered */}
                                                {method.constraints_encountered && method.constraints_encountered.length > 0 && (
                                                  <div className="bg-yellow-50/50 dark:bg-yellow-950/10 rounded-lg p-3 border border-yellow-200 dark:border-yellow-900/30">
                                                    <div className="flex items-center gap-2 mb-2">
                                                      <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                      </svg>
                                                      <div className="text-body-sm font-semibold text-gray-900 dark:text-white">
                                                        Constraints
                                                      </div>
                                                    </div>
                                                    <ul className="space-y-1">
                                                      {method.constraints_encountered.map((constraint, constIdx) => (
                                                        <li key={constIdx} className="text-body-xs text-yellow-700 dark:text-yellow-300 flex items-start gap-2">
                                                          <span className="mt-1">⚠</span>
                                                          <span>{constraint}</span>
                                                        </li>
                                                      ))}
                                                    </ul>
                                                  </div>
                                                )}

                                                {/* Evasion Considerations */}
                                                {method.evasion_considerations && method.evasion_considerations.length > 0 && (
                                                  <div className="bg-purple-50/50 dark:bg-purple-950/10 rounded-lg p-3 border border-purple-200 dark:border-purple-900/30">
                                                    <div className="flex items-center gap-2 mb-2">
                                                      <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                      </svg>
                                                      <div className="text-body-sm font-semibold text-gray-900 dark:text-white">
                                                        Evasion Considerations
                                                      </div>
                                                    </div>
                                                    <ul className="space-y-1">
                                                      {method.evasion_considerations.map((evasion, evasIdx) => (
                                                        <li key={evasIdx} className="text-body-xs text-purple-700 dark:text-purple-300 flex items-start gap-2">
                                                          <span className="mt-1">🔒</span>
                                                          <span>{evasion}</span>
                                                        </li>
                                                      ))}
                                                    </ul>
                                                  </div>
                                                )}
                                              </div>
                                            ) : null}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Attack Chain Summary Steps */}
                            {attackPath.attack_chain_summary_steps && attackPath.attack_chain_summary_steps.length > 0 && (
                              <div>
                                <h5 className="text-body-sm font-semibold text-gray-900 dark:text-white mb-3">
                                  Attack Chain Summary
                                </h5>
                                <ol className="list-decimal list-inside space-y-2">
                                  {attackPath.attack_chain_summary_steps.map((step, stepIdx) => (
                                    <li key={stepIdx} className="text-body-sm text-gray-700 dark:text-gray-300">
                                      {step}
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
                  <p className="text-body text-gray-600 dark:text-gray-400">
                    Attack paths are not available for this application.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ApplicationBreakdown

