import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function ApplicationBreakdown({ appName }) {
  const [breakdownData, setBreakdownData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeSection, setActiveSection] = useState('technical')

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        // Use import.meta.env.BASE_URL for proper path resolution in dev and production
        const baseUrl = import.meta.env.BASE_URL
        const response = await fetch(`${baseUrl}data/${appName}_app_breakdown.json`)
        if (!response.ok) {
          throw new Error(`Failed to load data: ${response.statusText}`)
        }
        const data = await response.json()
        setBreakdownData(data)
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
                  ? 'bg-accent-primary text-white'
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
        </div>
      </div>
    </div>
  )
}

export default ApplicationBreakdown

