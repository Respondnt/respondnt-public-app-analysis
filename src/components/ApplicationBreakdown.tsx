import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AttackPaths from './AttackPaths'
import type { BreakdownData, Capability, CloudInfrastructureAnalysis } from '../types'
import { loadAttackPathsData, loadComprehensiveAnalysisData, loadInfrastructureAnalysisData } from '../utils/dataLoaders'

interface ApplicationBreakdownProps {
    appName: string
}

function ApplicationBreakdown({ appName }: ApplicationBreakdownProps): JSX.Element {
    const [breakdownData, setBreakdownData] = useState<BreakdownData | null>(null)
    const [infrastructureData, setInfrastructureData] = useState<CloudInfrastructureAnalysis | null>(null)
    const [hasComprehensiveData, setHasComprehensiveData] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeSection, setActiveSection] = useState<'attack_paths' | 'app_breakdown' | 'infra_breakdown'>('app_breakdown')
    const [activeBreakdownSection, setActiveBreakdownSection] = useState<'technical' | 'admin' | 'api' | 'automation' | 'core'>('technical')
    const [activeInfraSection, setActiveInfraSection] = useState<'iam' | 'network' | 'public' | 'trust' | 'secrets' | 'services'>('iam')

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

                // Load infrastructure data (optional, for 1st Party apps)
                const infraData = await loadInfrastructureAnalysisData(baseUrl, appName)
                if (infraData) {
                    setInfrastructureData(infraData)
                }

                // Load comprehensive analysis data if available (works for both SaaS and 1st Party apps)
                const comprehensiveData = await loadComprehensiveAnalysisData(baseUrl, appName)
                if (comprehensiveData) {
                    setHasComprehensiveData(true)
                    // If comprehensive data exists, default to MITRE View
                    setActiveSection('attack_paths')
                } else {
                    setHasComprehensiveData(false)
                    // If no comprehensive data, default to App Breakdown
                    setActiveSection('app_breakdown')
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

    // Main sections - include MITRE View only if comprehensive data exists, include Infra Breakdown if infrastructure data is available
    const mainSections = [
        ...(hasComprehensiveData ? [{ id: 'attack_paths' as const, label: 'MITRE View' }] : []),
        { id: 'app_breakdown' as const, label: 'App Breakdown' },
        ...(infrastructureData ? [{ id: 'infra_breakdown' as const, label: 'Infra Breakdown' }] : []),
    ]


    const breakdownSections = [
        { id: 'technical' as const, label: 'Technical Components' },
        { id: 'admin' as const, label: 'Admin & Operations' },
        { id: 'api' as const, label: 'API & Integrations' },
        { id: 'automation' as const, label: 'Background & Automation' },
        { id: 'core' as const, label: 'Core Product Capabilities' },
    ]

    const infraSections = [
        { id: 'iam' as const, label: 'IAM Roles' },
        { id: 'network' as const, label: 'Network Security' },
        { id: 'public' as const, label: 'Public Resources' },
        { id: 'trust' as const, label: 'Trust Relationships' },
        { id: 'secrets' as const, label: 'Secrets & Credentials' },
        { id: 'services' as const, label: 'Service Configurations' },
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
                                            ? 'text-accent-primary dark:text-accent-primary'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                        }
                  `}
                                >
                                    <span className="relative z-10">{section.label}</span>
                                    {activeSection === section.id && (
                                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary" />
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
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary"
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

                    {/* Sub-tabs Row: Only for Infrastructure Breakdown */}
                    {activeSection === 'infra_breakdown' && (
                        <div className="h-10 flex items-center gap-1 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                            {infraSections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveInfraSection(section.id)}
                                    className={`
                    relative h-full px-3 text-body-xs font-medium transition-all
                    ${activeInfraSection === section.id
                                            ? 'text-accent-primary dark:text-accent-primary'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                        }
                  `}
                                >
                                    <span className="relative z-10">{section.label}</span>
                                    {activeInfraSection === section.id && (
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

                    {/* Infrastructure Breakdown */}
                    {activeSection === 'infra_breakdown' && infrastructureData && (
                        <div className="space-y-6">
                            {/* Header Info */}
                            <div className="mb-6">
                                <h3 className="text-h3 font-semibold text-gray-900 dark:text-white mb-2">
                                    {infrastructureData.infrastructure_name || 'Infrastructure Analysis'}
                                </h3>
                                {infrastructureData.cloud_provider && (
                                    <p className="text-body text-gray-600 dark:text-gray-400">
                                        Cloud Provider: <span className="font-medium">{infrastructureData.cloud_provider.toUpperCase()}</span>
                                    </p>
                                )}
                                {infrastructureData.generated_at && (
                                    <p className="text-body-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Generated {new Date(infrastructureData.generated_at).toLocaleDateString()}
                                    </p>
                                )}
                            </div>

                            {/* IAM Roles */}
                            {activeInfraSection === 'iam' && infrastructureData.iam_roles && infrastructureData.iam_roles.length > 0 && (
                                <div>
                                    <h3 className="text-h4 font-semibold text-gray-900 dark:text-white mb-4">
                                        IAM Roles
                                    </h3>
                                    <div className="space-y-4">
                                        {infrastructureData.iam_roles.map((role, idx) => (
                                            <div key={idx} className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <h4 className="text-body font-semibold text-gray-900 dark:text-white">
                                                            {role.name}
                                                        </h4>
                                                        {role.arn && (
                                                            <p className="text-body-sm text-gray-600 dark:text-gray-400 mt-1">
                                                                {role.arn}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {role.security_risk_level && (
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-body-xs font-medium ${role.security_risk_level === 'high'
                                                            ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300'
                                                            : role.security_risk_level === 'medium'
                                                                ? 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-300'
                                                                : 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300'
                                                            }`}>
                                                            {role.security_risk_level.toUpperCase()} RISK
                                                        </span>
                                                    )}
                                                </div>

                                                {role.permissions && role.permissions.length > 0 && (
                                                    <div className="mb-3">
                                                        <h5 className="text-body-sm font-semibold text-gray-900 dark:text-white mb-2">
                                                            Permissions
                                                        </h5>
                                                        <div className="flex flex-wrap gap-2">
                                                            {role.permissions.map((perm, pIdx) => (
                                                                <span
                                                                    key={pIdx}
                                                                    className="inline-flex items-center px-2 py-0.5 rounded text-body-xs bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300"
                                                                >
                                                                    {perm}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {role.trusted_entities && role.trusted_entities.length > 0 && (
                                                    <div className="mb-3">
                                                        <h5 className="text-body-sm font-semibold text-gray-900 dark:text-white mb-2">
                                                            Trusted Entities
                                                        </h5>
                                                        <ul className="list-disc list-inside space-y-1">
                                                            {role.trusted_entities.map((entity, eIdx) => (
                                                                <li key={eIdx} className="text-body-sm text-gray-700 dark:text-gray-300">
                                                                    {entity}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {role.used_by_services && role.used_by_services.length > 0 && (
                                                    <div className="mb-3">
                                                        <h5 className="text-body-sm font-semibold text-gray-900 dark:text-white mb-2">
                                                            Used By Services
                                                        </h5>
                                                        <div className="flex flex-wrap gap-2">
                                                            {role.used_by_services.map((service, sIdx) => (
                                                                <span
                                                                    key={sIdx}
                                                                    className="inline-flex items-center px-2 py-0.5 rounded text-body-xs bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300"
                                                                >
                                                                    {service}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {role.notes && (
                                                    <div className="mb-3">
                                                        <p className="text-body-sm text-gray-600 dark:text-gray-400 italic">
                                                            {role.notes}
                                                        </p>
                                                    </div>
                                                )}

                                                {role.evidence && role.evidence.length > 0 && (
                                                    <div>
                                                        <h5 className="text-body-sm font-semibold text-gray-900 dark:text-white mb-2">
                                                            Evidence
                                                        </h5>
                                                        <div className="space-y-1">
                                                            {role.evidence.map((ev, evIdx) => (
                                                                <div key={evIdx} className="text-body-sm text-gray-600 dark:text-gray-400">
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
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Network Security Boundaries */}
                            {activeInfraSection === 'network' && infrastructureData.network_security_boundaries && infrastructureData.network_security_boundaries.length > 0 && (
                                <div>
                                    <h3 className="text-h4 font-semibold text-gray-900 dark:text-white mb-4">
                                        Network Security Boundaries
                                    </h3>
                                    <div className="space-y-4">
                                        {infrastructureData.network_security_boundaries.map((boundary, idx) => (
                                            <div key={idx} className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <h4 className="text-body font-semibold text-gray-900 dark:text-white">
                                                            {boundary.name}
                                                        </h4>
                                                        <p className="text-body-sm text-gray-600 dark:text-gray-400 mt-1">
                                                            Type: {boundary.type}
                                                        </p>
                                                    </div>
                                                    {boundary.public_facing && (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-body-xs font-medium bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300">
                                                            PUBLIC FACING
                                                        </span>
                                                    )}
                                                </div>

                                                {boundary.ingress_rules && boundary.ingress_rules.length > 0 && (
                                                    <div className="mb-3">
                                                        <h5 className="text-body-sm font-semibold text-gray-900 dark:text-white mb-2">
                                                            Ingress Rules
                                                        </h5>
                                                        <ul className="list-disc list-inside space-y-1">
                                                            {boundary.ingress_rules.map((rule, rIdx) => (
                                                                <li key={rIdx} className="text-body-sm text-gray-700 dark:text-gray-300">
                                                                    {rule}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {boundary.egress_rules && boundary.egress_rules.length > 0 && (
                                                    <div className="mb-3">
                                                        <h5 className="text-body-sm font-semibold text-gray-900 dark:text-white mb-2">
                                                            Egress Rules
                                                        </h5>
                                                        <ul className="list-disc list-inside space-y-1">
                                                            {boundary.egress_rules.map((rule, rIdx) => (
                                                                <li key={rIdx} className="text-body-sm text-gray-700 dark:text-gray-300">
                                                                    {rule}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {boundary.security_concerns && boundary.security_concerns.length > 0 && (
                                                    <div className="mb-3">
                                                        <h5 className="text-body-sm font-semibold text-red-700 dark:text-red-300 mb-2">
                                                            Security Concerns
                                                        </h5>
                                                        <ul className="list-disc list-inside space-y-1">
                                                            {boundary.security_concerns.map((concern, cIdx) => (
                                                                <li key={cIdx} className="text-body-sm text-red-600 dark:text-red-400">
                                                                    {concern}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {boundary.evidence && boundary.evidence.length > 0 && (
                                                    <div>
                                                        <h5 className="text-body-sm font-semibold text-gray-900 dark:text-white mb-2">
                                                            Evidence
                                                        </h5>
                                                        <div className="space-y-1">
                                                            {boundary.evidence.map((ev, evIdx) => (
                                                                <div key={evIdx} className="text-body-sm text-gray-600 dark:text-gray-400">
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
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Public Resources */}
                            {activeInfraSection === 'public' && infrastructureData.public_resources && infrastructureData.public_resources.length > 0 && (
                                <div>
                                    <h3 className="text-h4 font-semibold text-gray-900 dark:text-white mb-4">
                                        Public Resources
                                    </h3>
                                    <div className="space-y-4">
                                        {infrastructureData.public_resources.map((resource, idx) => (
                                            <div key={idx} className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <h4 className="text-body font-semibold text-gray-900 dark:text-white">
                                                            {resource.name}
                                                        </h4>
                                                        <p className="text-body-sm text-gray-600 dark:text-gray-400 mt-1">
                                                            Type: {resource.resource_type}
                                                        </p>
                                                    </div>
                                                    {resource.authentication_required ? (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-body-xs font-medium bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300">
                                                            AUTH REQUIRED
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-body-xs font-medium bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300">
                                                            NO AUTH
                                                        </span>
                                                    )}
                                                </div>

                                                {resource.public_access_methods && resource.public_access_methods.length > 0 && (
                                                    <div className="mb-3">
                                                        <h5 className="text-body-sm font-semibold text-gray-900 dark:text-white mb-2">
                                                            Public Access Methods
                                                        </h5>
                                                        <ul className="list-disc list-inside space-y-1">
                                                            {resource.public_access_methods.map((method, mIdx) => (
                                                                <li key={mIdx} className="text-body-sm text-gray-700 dark:text-gray-300">
                                                                    {method}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {resource.security_controls && resource.security_controls.length > 0 && (
                                                    <div className="mb-3">
                                                        <h5 className="text-body-sm font-semibold text-gray-900 dark:text-white mb-2">
                                                            Security Controls
                                                        </h5>
                                                        <div className="flex flex-wrap gap-2">
                                                            {resource.security_controls.map((control, cIdx) => (
                                                                <span
                                                                    key={cIdx}
                                                                    className="inline-flex items-center px-2 py-0.5 rounded text-body-xs bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300"
                                                                >
                                                                    {control}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {resource.evidence && resource.evidence.length > 0 && (
                                                    <div>
                                                        <h5 className="text-body-sm font-semibold text-gray-900 dark:text-white mb-2">
                                                            Evidence
                                                        </h5>
                                                        <div className="space-y-1">
                                                            {resource.evidence.map((ev, evIdx) => (
                                                                <div key={evIdx} className="text-body-sm text-gray-600 dark:text-gray-400">
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
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Trust Relationships */}
                            {activeInfraSection === 'trust' && infrastructureData.trust_relationships && infrastructureData.trust_relationships.length > 0 && (
                                <div>
                                    <h3 className="text-h4 font-semibold text-gray-900 dark:text-white mb-4">
                                        Trust Relationships
                                    </h3>
                                    <div className="space-y-4">
                                        {infrastructureData.trust_relationships.map((relationship, idx) => (
                                            <div key={idx} className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                                                <h4 className="text-body font-semibold text-gray-900 dark:text-white mb-3">
                                                    {relationship.source} → {relationship.target}
                                                </h4>
                                                <p className="text-body-sm text-gray-600 dark:text-gray-400 mb-3">
                                                    Type: {relationship.relationship_type}
                                                </p>

                                                {relationship.permissions_granted && relationship.permissions_granted.length > 0 && (
                                                    <div className="mb-3">
                                                        <h5 className="text-body-sm font-semibold text-gray-900 dark:text-white mb-2">
                                                            Permissions Granted
                                                        </h5>
                                                        <div className="flex flex-wrap gap-2">
                                                            {relationship.permissions_granted.map((perm, pIdx) => (
                                                                <span
                                                                    key={pIdx}
                                                                    className="inline-flex items-center px-2 py-0.5 rounded text-body-xs bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300"
                                                                >
                                                                    {perm}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {relationship.security_implications && relationship.security_implications.length > 0 && (
                                                    <div className="mb-3">
                                                        <h5 className="text-body-sm font-semibold text-orange-700 dark:text-orange-300 mb-2">
                                                            Security Implications
                                                        </h5>
                                                        <ul className="list-disc list-inside space-y-1">
                                                            {relationship.security_implications.map((impl, iIdx) => (
                                                                <li key={iIdx} className="text-body-sm text-orange-600 dark:text-orange-400">
                                                                    {impl}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {relationship.evidence && relationship.evidence.length > 0 && (
                                                    <div>
                                                        <h5 className="text-body-sm font-semibold text-gray-900 dark:text-white mb-2">
                                                            Evidence
                                                        </h5>
                                                        <div className="space-y-1">
                                                            {relationship.evidence.map((ev, evIdx) => (
                                                                <div key={evIdx} className="text-body-sm text-gray-600 dark:text-gray-400">
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
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Secrets and Credentials */}
                            {activeInfraSection === 'secrets' && infrastructureData.secrets_and_credentials && (
                                <div>
                                    <h3 className="text-h4 font-semibold text-gray-900 dark:text-white mb-4">
                                        Secrets and Credentials
                                    </h3>
                                    <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                                        {infrastructureData.secrets_and_credentials.secret_stores && infrastructureData.secrets_and_credentials.secret_stores.length > 0 && (
                                            <div className="mb-4">
                                                <h5 className="text-body-sm font-semibold text-gray-900 dark:text-white mb-2">
                                                    Secret Stores
                                                </h5>
                                                <div className="space-y-2">
                                                    {infrastructureData.secrets_and_credentials.secret_stores.map((store, sIdx) => (
                                                        <div key={sIdx} className="text-body-sm text-gray-700 dark:text-gray-300">
                                                            <span className="font-medium">{store.name}</span>
                                                            {store.description && <span className="ml-2">- {store.description}</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {infrastructureData.secrets_and_credentials.security_concerns && infrastructureData.secrets_and_credentials.security_concerns.length > 0 && (
                                            <div className="mb-4">
                                                <h5 className="text-body-sm font-semibold text-red-700 dark:text-red-300 mb-2">
                                                    Security Concerns
                                                </h5>
                                                <ul className="list-disc list-inside space-y-1">
                                                    {infrastructureData.secrets_and_credentials.security_concerns.map((concern, cIdx) => (
                                                        <li key={cIdx} className="text-body-sm text-red-600 dark:text-red-400">
                                                            {concern}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {infrastructureData.secrets_and_credentials.evidence && infrastructureData.secrets_and_credentials.evidence.length > 0 && (
                                            <div>
                                                <h5 className="text-body-sm font-semibold text-gray-900 dark:text-white mb-2">
                                                    Evidence
                                                </h5>
                                                <div className="space-y-1">
                                                    {infrastructureData.secrets_and_credentials.evidence.map((ev, evIdx) => (
                                                        <div key={evIdx} className="text-body-sm text-gray-600 dark:text-gray-400">
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
                                </div>
                            )}

                            {/* Cloud Service Configurations */}
                            {activeInfraSection === 'services' && infrastructureData.cloud_service_configurations && infrastructureData.cloud_service_configurations.length > 0 && (
                                <div>
                                    <h3 className="text-h4 font-semibold text-gray-900 dark:text-white mb-4">
                                        Cloud Service Configurations
                                    </h3>
                                    <div className="space-y-4">
                                        {infrastructureData.cloud_service_configurations.map((config, idx) => (
                                            <div key={idx} className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                                                <h4 className="text-body font-semibold text-gray-900 dark:text-white mb-2">
                                                    {config.service_name}
                                                </h4>
                                                <p className="text-body-sm text-gray-600 dark:text-gray-400 mb-3">
                                                    Type: {config.service_type}
                                                </p>

                                                {config.security_settings && config.security_settings.length > 0 && (
                                                    <div className="mb-3">
                                                        <h5 className="text-body-sm font-semibold text-gray-900 dark:text-white mb-2">
                                                            Security Settings
                                                        </h5>
                                                        <div className="flex flex-wrap gap-2">
                                                            {config.security_settings.map((setting, sIdx) => (
                                                                <span
                                                                    key={sIdx}
                                                                    className="inline-flex items-center px-2 py-0.5 rounded text-body-xs bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300"
                                                                >
                                                                    {setting}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {config.misconfigurations && config.misconfigurations.length > 0 && (
                                                    <div className="mb-3">
                                                        <h5 className="text-body-sm font-semibold text-red-700 dark:text-red-300 mb-2">
                                                            Misconfigurations
                                                        </h5>
                                                        <ul className="list-disc list-inside space-y-1">
                                                            {config.misconfigurations.map((misconfig, mIdx) => (
                                                                <li key={mIdx} className="text-body-sm text-red-600 dark:text-red-400">
                                                                    {misconfig}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {config.evidence && config.evidence.length > 0 && (
                                                    <div>
                                                        <h5 className="text-body-sm font-semibold text-gray-900 dark:text-white mb-2">
                                                            Evidence
                                                        </h5>
                                                        <div className="space-y-1">
                                                            {config.evidence.map((ev, evIdx) => (
                                                                <div key={evIdx} className="text-body-sm text-gray-600 dark:text-gray-400">
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

