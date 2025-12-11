import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AttackPaths from './AttackPaths'
import type { BreakdownData, Capability } from '../types'
import { loadAttackPathsData, loadComprehensiveAnalysisData } from '../utils/dataLoaders'

interface ApplicationBreakdownProps {
    appName: string
}

function ApplicationBreakdown({ appName }: ApplicationBreakdownProps): JSX.Element {
    const [breakdownData, setBreakdownData] = useState<BreakdownData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeSection, setActiveSection] = useState<'attack_paths' | 'app_breakdown'>('attack_paths')
    const [activeBreakdownSection, setActiveBreakdownSection] = useState<'technical' | 'admin' | 'api' | 'automation' | 'core'>('technical')

    useEffect(() => {
        const loadData = async (): Promise<void> => {
            try {
                setLoading(true)
                // Use import.meta.env.BASE_URL for proper path resolution in dev and production
                const baseUrl = import.meta.env.BASE_URL

                // Load breakdown data
                const breakdownResponse = await fetch(`${baseUrl}data/breakdowns/${appName}_app_breakdown.json`)
                if (!breakdownResponse.ok) {
                    throw new Error(`Failed to load breakdown data: ${breakdownResponse.statusText}`)
                }
                const breakdownData = await breakdownResponse.json() as BreakdownData
                setBreakdownData(breakdownData)

                // Only load comprehensive analysis data (required)
                const comprehensiveData = await loadComprehensiveAnalysisData(baseUrl, appName)
                if (!comprehensiveData) {
                    throw new Error(`Comprehensive analysis data not available for ${appName}. Only apps with comprehensive analysis data are supported.`)
                }

                // Transform comprehensive analysis to attack paths format for MITRE View
                // This is done in AttackPaths component, so we don't need to store it here

                setError(null)
            } catch (err) {
                console.error('Error loading application breakdown:', err)
                setError(err instanceof Error ? err.message : 'Unknown error')
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [appName])

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="text-body text-gray-600 dark:text-gray-400">Loading...</div>
                </div>
            </div>
        )
    }

    if (error || !breakdownData) {
        return (
            <div className="w-full h-full flex items-center justify-center">
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

    const getInterfaceChannelBadgeStyle = (channel: string): string => {
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

    const renderCapability = (capability: Capability, index: number): JSX.Element => (
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

    // Only show MITRE View and App Breakdown (attack graphs hidden for now)
    const mainSections = [
        { id: 'attack_paths' as const, label: 'MITRE View' },
        { id: 'app_breakdown' as const, label: 'App Breakdown' },
    ]


    const breakdownSections = [
        { id: 'technical' as const, label: 'Technical Components' },
        { id: 'admin' as const, label: 'Admin & Operations' },
        { id: 'api' as const, label: 'API & Integrations' },
        { id: 'automation' as const, label: 'Background & Automation' },
        { id: 'core' as const, label: 'Core Product Capabilities' },
    ]

    // For attack_paths, use full width layout
    if (activeSection === 'attack_paths') {
        return (
            <div className="w-full h-full flex flex-col">
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
                                    type="button"
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
                <div className="flex-1 overflow-auto -webkit-overflow-scrolling-touch">
                    <AttackPaths appName={appName} />
                </div>
            </div>
        )
    }

    return (
        <div className="w-full h-full flex flex-col">
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
                                type="button"
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
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 lg:px-6 pb-6 -webkit-overflow-scrolling-touch">
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

