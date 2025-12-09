import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AttackPaths from './AttackPaths'

function ApplicationBreakdown({ appName }) {
  const [breakdownData, setBreakdownData] = useState(null)
  const [attackPathsData, setAttackPathsData] = useState(null)
  const [discoveryMap, setDiscoveryMap] = useState(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeSection, setActiveSection] = useState('attack_paths')
  const [activeBreakdownSection, setActiveBreakdownSection] = useState('technical')

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

        // Try to load discovery data (optional - may not exist)
        try {
          const discoveryResponse = await fetch(`${baseUrl}data/discovery/${appName}_discovery_vectors.json`)
          if (discoveryResponse.ok) {
            const discoveryData = await discoveryResponse.json()
            // Create a map from initial access vector technique_name to discovery vectors
            const map = new Map()
            if (Array.isArray(discoveryData)) {
              discoveryData.forEach(entry => {
                if (entry.initial_access_vector && entry.initial_access_vector.technique_name) {
                  map.set(entry.initial_access_vector.technique_name, entry.discovery_vectors || [])
                }
              })
            }
            setDiscoveryMap(map)
          } else {
            // Discovery not available - set to empty map
            setDiscoveryMap(new Map())
          }
        } catch (discoveryErr) {
          // Discovery not available - set to empty map
          console.log('Discovery data not available for this application')
          setDiscoveryMap(new Map())
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
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-body text-gray-600 dark:text-gray-400">Loading...</div>
        </div>
      </div>
    )
  }

  if (error || !breakdownData) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
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

  const mainSections = [
    { id: 'attack_paths', label: 'Attack Paths' },
    { id: 'app_breakdown', label: 'App Breakdown' },
  ]

  const breakdownSections = [
    { id: 'technical', label: 'Technical Components' },
    { id: 'admin', label: 'Admin & Operations' },
    { id: 'api', label: 'API & Integrations' },
    { id: 'automation', label: 'Background & Automation' },
    { id: 'core', label: 'Core Product Capabilities' },
  ]

  // For attack_paths, use full width layout
  if (activeSection === 'attack_paths') {
    return (
      <div className="w-full h-screen flex flex-col">
        {/* Modern Compact Sticky Header */}
        <div className="sticky top-0 z-40 flex-shrink-0 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="px-4 lg:px-6">
            {/* Top Row: Breadcrumb + Title + Metadata */}
            <div className="h-14 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Link
                  to="/"
                  className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors flex-shrink-0"
                  aria-label="Back to home"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
                <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h1 className="text-body-base font-semibold text-gray-900 dark:text-white truncate">
                    {breakdownData.application_name}
                  </h1>
                  {breakdownData.generated_at && (
                    <p className="text-body-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Generated {new Date(breakdownData.generated_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Bottom Row: Tabs */}
            <div className="h-12 flex items-center gap-1 border-t border-gray-100 dark:border-gray-800">
              {mainSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`
                    relative h-full px-4 text-body-sm font-medium transition-all
                    ${activeSection === section.id
                      ? section.id === 'attack_paths'
                        ? 'text-purple-700 dark:text-purple-300'
                        : 'text-accent-primary dark:text-accent-primary'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }
                  `}
                >
                  <span className="relative z-10">{section.label}</span>
                  {activeSection === section.id && (
                    <span 
                      className={`
                        absolute bottom-0 left-0 right-0 h-0.5
                        ${section.id === 'attack_paths'
                          ? 'bg-purple-600 dark:bg-purple-400'
                          : 'bg-accent-primary'
                        }
                      `}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Full width content */}
        <div className="flex-1 overflow-auto">
          <AttackPaths appName={appName} />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Modern Compact Sticky Header */}
      <div className="sticky top-0 z-40 flex-shrink-0 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="px-4 lg:px-6">
          {/* Top Row: Breadcrumb + Title + Metadata */}
          <div className="h-14 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Link
                to="/"
                className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors flex-shrink-0"
                aria-label="Back to home"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-body-base font-semibold text-gray-900 dark:text-white truncate">
                  {breakdownData.application_name}
                </h1>
                {breakdownData.generated_at && (
                  <p className="text-body-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Generated {new Date(breakdownData.generated_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Bottom Row: Main Tabs */}
          <div className="h-12 flex items-center gap-1 border-t border-gray-100 dark:border-gray-800">
            {mainSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`
                  relative h-full px-4 text-body-sm font-medium transition-all
                  ${activeSection === section.id
                    ? section.id === 'attack_paths'
                      ? 'text-purple-700 dark:text-purple-300'
                      : 'text-accent-primary dark:text-accent-primary'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }
                `}
              >
                <span className="relative z-10">{section.label}</span>
                {activeSection === section.id && (
                  <span 
                    className={`
                      absolute bottom-0 left-0 right-0 h-0.5
                      ${section.id === 'attack_paths'
                        ? 'bg-purple-600 dark:bg-purple-400'
                        : 'bg-accent-primary'
                      }
                    `}
                  />
                )}
              </button>
            ))}
          </div>
          
          {/* Sub-tabs Row: Only for App Breakdown */}
          {activeSection === 'app_breakdown' && (
            <div className="h-10 flex items-center gap-1 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
              {breakdownSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveBreakdownSection(section.id)}
                  className={`
                    relative h-full px-3 text-body-xs font-medium transition-all
                    ${activeBreakdownSection === section.id
                      ? 'text-accent-primary dark:text-accent-primary'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }
                  `}
                >
                  <span className="relative z-10">{section.label}</span>
                  {activeBreakdownSection === section.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content - Scrollable area */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-6 pb-6">
        <div className={activeSection === 'app_breakdown' ? 'pt-6' : 'pt-4'}>
          {activeSection === 'app_breakdown' && activeBreakdownSection === 'core' && breakdownData.capability_map?.core_product_capabilities && (
            <div>
              <h3 className="text-h4 font-semibold text-gray-900 dark:text-white mb-4">
                Core Product Capabilities
              </h3>
              {breakdownData.capability_map.core_product_capabilities.map((cap, idx) => renderCapability(cap, idx))}
            </div>
          )}

          {/* Administrative and Operational Capabilities */}
          {activeSection === 'app_breakdown' && activeBreakdownSection === 'admin' && breakdownData.capability_map?.administrative_and_operational_capabilities && (
            <div>
              <h3 className="text-h4 font-semibold text-gray-900 dark:text-white mb-4">
                Administrative and Operational Capabilities
              </h3>
              {breakdownData.capability_map.administrative_and_operational_capabilities.map((cap, idx) => renderCapability(cap, idx))}
            </div>
          )}

          {/* API Surface and Integrations */}
          {activeSection === 'app_breakdown' && activeBreakdownSection === 'api' && breakdownData.capability_map?.api_surface_and_integrations && (
            <div>
              <h3 className="text-h4 font-semibold text-gray-900 dark:text-white mb-4">
                API Surface and Integrations
              </h3>
              {breakdownData.capability_map.api_surface_and_integrations.map((cap, idx) => renderCapability(cap, idx))}
            </div>
          )}

          {/* Background Jobs and Automation */}
          {activeSection === 'app_breakdown' && activeBreakdownSection === 'automation' && breakdownData.capability_map?.background_jobs_and_automation && (
            <div>
              <h3 className="text-h4 font-semibold text-gray-900 dark:text-white mb-4">
                Background Jobs and Automation
              </h3>
              {breakdownData.capability_map.background_jobs_and_automation.map((cap, idx) => renderCapability(cap, idx))}
            </div>
          )}

          {/* Technical Components and Data Flows */}
          {activeSection === 'app_breakdown' && activeBreakdownSection === 'technical' && breakdownData.technical_components_and_data_flows && (
            <div className="space-y-6">
              {breakdownData.technical_components_and_data_flows.services_or_modules && (
                <div>
                  <h3 className="text-h4 font-semibold text-gray-900 dark:text-white mb-4">
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
        </div>
      </div>
    </div>
  )
}

export default ApplicationBreakdown

