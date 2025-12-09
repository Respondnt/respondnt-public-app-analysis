import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'

function DiscoveryVectors({ appName, techniqueName }) {
  const [discoveryData, setDiscoveryData] = useState(null)
  const [initialAccessVector, setInitialAccessVector] = useState(null)
  const [discoveryVectors, setDiscoveryVectors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedDiscovery, setExpandedDiscovery] = useState(new Set())

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const baseUrl = import.meta.env.BASE_URL
        
        // Load discovery data
        const discoveryResponse = await fetch(`${baseUrl}data/discovery/${appName}_discovery_vectors.json`)
        if (!discoveryResponse.ok) {
          throw new Error(`Failed to load discovery data: ${discoveryResponse.statusText}`)
        }
        const discoveryData = await discoveryResponse.json()
        setDiscoveryData(discoveryData)
        
        // Find the entry that matches the technique name
        if (Array.isArray(discoveryData)) {
          const entry = discoveryData.find(
            e => e.initial_access_vector && 
            e.initial_access_vector.technique_name === techniqueName
          )
          
          if (entry) {
            setInitialAccessVector(entry.initial_access_vector)
            setDiscoveryVectors(entry.discovery_vectors || [])
          } else {
            throw new Error(`No discovery vectors found for technique: ${techniqueName}`)
          }
        }
        
        setError(null)
      } catch (err) {
        console.error('Error loading discovery vectors:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [appName, techniqueName])

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-body text-gray-600 dark:text-gray-400">Loading...</div>
        </div>
      </div>
    )
  }

  if (error || !discoveryVectors.length) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-body text-red-600 dark:text-red-400 mb-4">
            {error || 'No discovery vectors available'}
          </div>
          <Link
            to={`/app/${appName}`}
            className="inline-block px-6 py-3 bg-accent-primary text-white rounded-lg font-medium transition-all duration-200 hover:shadow-md hover:shadow-accent-primary/30"
          >
            Back to Application Breakdown
          </Link>
        </div>
      </div>
    )
  }

  const renderDiscoveryVector = (discoveryVector, idx) => {
    const isExpanded = expandedDiscovery.has(idx)
    return (
      <div key={idx} className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {/* Clickable Header */}
        <button
          onClick={() => {
            const newExpanded = new Set(expandedDiscovery)
            if (isExpanded) {
              newExpanded.delete(idx)
            } else {
              newExpanded.add(idx)
            }
            setExpandedDiscovery(newExpanded)
          }}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
        >
          <div className="flex items-center gap-3 flex-1">
            <h4 className="text-h4 font-semibold text-gray-900 dark:text-white pr-4">
              {discoveryVector.technique_name}
            </h4>
            {discoveryVector.technique_stix_id && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-body-xs font-medium bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/30">
                {discoveryVector.technique_stix_id}
              </span>
            )}
            {discoveryVector.can_achieve !== undefined && (
              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-body-xs font-medium ${
                discoveryVector.can_achieve 
                  ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-900/30'
                  : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/30'
              }`}>
                {discoveryVector.can_achieve ? 'Achievable' : 'Not Achievable'}
              </span>
            )}
          </div>
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
            {/* Method Steps */}
            {discoveryVector.method_steps && discoveryVector.method_steps.length > 0 && (
              <div className="mb-6">
                <h5 className="text-body-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Method Steps
                </h5>
                <div className="space-y-3">
                  {discoveryVector.method_steps.map((step, stepIdx) => (
                    <div key={stepIdx} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500 text-white text-body-xs font-semibold flex items-center justify-center">
                          {step.step_id || stepIdx + 1}
                        </div>
                        <p className="text-body-sm text-gray-700 dark:text-gray-300 flex-1">
                          {step.description}
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

            {/* Capabilities Used */}
            {discoveryVector.capabilities_used && discoveryVector.capabilities_used.length > 0 && (
              <div className="mb-4">
                <h5 className="text-body-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Capabilities Used
                </h5>
                <div className="flex flex-wrap gap-2">
                  {discoveryVector.capabilities_used.map((capability, capIdx) => (
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

            {/* Interfaces Used */}
            {discoveryVector.interfaces_used && discoveryVector.interfaces_used.length > 0 && (
              <div className="mb-4">
                <h5 className="text-body-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Interfaces Used
                </h5>
                <ul className="space-y-1">
                  {discoveryVector.interfaces_used.map((iface, ifaceIdx) => (
                    <li key={ifaceIdx} className="text-body-sm text-gray-700 dark:text-gray-300">
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

            {/* Data Accessed */}
            {discoveryVector.data_accessed && discoveryVector.data_accessed.length > 0 && (
              <div className="mb-4">
                <h5 className="text-body-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Data Accessed
                </h5>
                <ul className="space-y-1">
                  {discoveryVector.data_accessed.map((data, dataIdx) => (
                    <li key={dataIdx} className="text-body-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                      <span className="text-green-600 dark:text-green-400 mt-1">•</span>
                      <span>{data}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Preconditions Required */}
            {discoveryVector.preconditions_required && discoveryVector.preconditions_required.length > 0 && (
              <div className="mb-4 bg-amber-50/50 dark:bg-amber-950/10 rounded-lg p-3 border border-amber-200 dark:border-amber-900/30">
                <h5 className="text-body-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Preconditions Required
                </h5>
                <ul className="space-y-1">
                  {discoveryVector.preconditions_required.map((precondition, precIdx) => (
                    <li key={precIdx} className="text-body-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                      <span className="text-amber-600 dark:text-amber-400 mt-1">✓</span>
                      <span>{precondition}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Constraints Encountered */}
            {discoveryVector.constraints_encountered && discoveryVector.constraints_encountered.length > 0 && (
              <div className="mb-4 bg-yellow-50/50 dark:bg-yellow-950/10 rounded-lg p-3 border border-yellow-200 dark:border-yellow-900/30">
                <h5 className="text-body-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Constraints Encountered
                </h5>
                <ul className="space-y-1">
                  {discoveryVector.constraints_encountered.map((constraint, constIdx) => (
                    <li key={constIdx} className="text-body-sm text-yellow-700 dark:text-yellow-300 flex items-start gap-2">
                      <span className="mt-1">⚠</span>
                      <span>{constraint}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Evasion Considerations */}
            {discoveryVector.evasion_considerations && discoveryVector.evasion_considerations.length > 0 && (
              <div className="mb-4 bg-purple-50/50 dark:bg-purple-950/10 rounded-lg p-3 border border-purple-200 dark:border-purple-900/30">
                <h5 className="text-body-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Evasion Considerations
                </h5>
                <ul className="space-y-1">
                  {discoveryVector.evasion_considerations.map((evasion, evasIdx) => (
                    <li key={evasIdx} className="text-body-sm text-purple-700 dark:text-purple-300 flex items-start gap-2">
                      <span className="mt-1">🔒</span>
                      <span>{evasion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Resulting Access */}
            {discoveryVector.resulting_access && (
              <div className="mb-4 bg-green-50/50 dark:bg-green-950/10 rounded-lg p-3 border border-green-200 dark:border-green-900/30">
                <h5 className="text-body-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Resulting Access
                </h5>
                <p className="text-body-sm text-green-700 dark:text-green-300">
                  {discoveryVector.resulting_access}
                </p>
              </div>
            )}

            {/* Comments */}
            {discoveryVector.comments && (
              <div className="mb-4">
                <h5 className="text-body-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Comments
                </h5>
                <p className="text-body-sm text-gray-600 dark:text-gray-400 italic">
                  {discoveryVector.comments}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="w-full px-6 lg:px-8 py-8 flex-shrink-0">
        <div className="mb-8">
          <Link
            to={`/app/${appName}`}
            className="inline-flex items-center text-body-sm text-gray-600 dark:text-gray-400 hover:text-accent-primary transition-colors mb-4"
          >
            ← Back to Application Breakdown
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-display-lg font-bold text-gray-900 dark:text-white">
              Discovery Vectors
            </h1>
            <span className="inline-flex items-center px-3 py-1 rounded-md text-body-sm font-medium bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/30">
              {discoveryVectors.length} vector{discoveryVectors.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          {/* Initial Access Vector Context */}
          {initialAccessVector && (
            <div className="bg-blue-50/50 dark:bg-blue-950/10 rounded-lg p-4 border border-blue-200 dark:border-blue-900/30 mb-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-body font-semibold text-gray-900 dark:text-white mb-1">
                    Following Initial Access Vector
                  </h3>
                  <p className="text-body-sm text-gray-700 dark:text-gray-300">
                    {initialAccessVector.technique_name}
                    {initialAccessVector.technique_stix_id && (
                      <span className="ml-2 text-gray-500 dark:text-gray-400">
                        ({initialAccessVector.technique_stix_id})
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 lg:px-8 pb-8">
        <div className="space-y-4">
          {discoveryVectors.map((discoveryVector, idx) => renderDiscoveryVector(discoveryVector, idx))}
        </div>
      </div>
    </div>
  )
}

export default DiscoveryVectors

