import React from 'react'

interface FeatureInfo {
    type: 'parada' | 'linea'
    id: string
    displayName: string
    data: any
}

interface MultiFeatureSelectorProps {
    features: FeatureInfo[]
    visible: boolean
    onSelectFeature: (feature: FeatureInfo) => void
    onClose: () => void
    // Props para posicionamiento dinámico
    hasActivePopup: boolean
}

export default function MultiFeatureSelector({
    features,
    visible,
    onSelectFeature,
    onClose,
    hasActivePopup
}: MultiFeatureSelectorProps) {
    if (!visible || features.length <= 1) {
        return null
    }

    const containerStyle: React.CSSProperties = {
        position: 'absolute',
        bottom: '20px',
        left: hasActivePopup ? '320px' : '20px', // Se mueve hacia la derecha si hay popup activo
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        border: '2px solid #3b82f6',
        borderRadius: '8px',
        padding: '12px',
        minWidth: '200px',
        maxWidth: '300px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        transition: 'left 0.3s ease-in-out',
        fontSize: '14px'
    }

    const headerStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
        fontWeight: 'bold',
        color: '#1f2937'
    }

    const listStyle: React.CSSProperties = {
        maxHeight: '200px',
        overflowY: 'auto'
    }

    const itemStyle: React.CSSProperties = {
        padding: '8px 12px',
        margin: '4px 0',
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    }

    const itemHoverStyle: React.CSSProperties = {
        backgroundColor: '#e2e8f0',
        borderColor: '#3b82f6'
    }

    const badgeStyle = (type: string): React.CSSProperties => ({
        backgroundColor: type === 'parada' ? '#10b981' : '#f59e0b',
        color: 'white',
        fontSize: '11px',
        padding: '2px 6px',
        borderRadius: '12px',
        fontWeight: 'bold'
    })

    const buttonStyle: React.CSSProperties = {
        backgroundColor: '#3b82f6',
        color: 'white',
        border: 'none',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        cursor: 'pointer',
        fontWeight: 'bold'
    }

    const closeButtonStyle: React.CSSProperties = {
        backgroundColor: 'transparent',
        border: 'none',
        fontSize: '18px',
        cursor: 'pointer',
        color: '#6b7280',
        padding: '0',
        width: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    }

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <span>Elementos encontrados ({features.length})</span>
                <button 
                    style={closeButtonStyle}
                    onClick={onClose}
                    title="Cerrar"
                >
                    ×
                </button>
            </div>
            <div style={listStyle}>
                {features.map((feature, index) => (
                    <div
                        key={`${feature.type}-${feature.id}-${index}`}
                        style={itemStyle}
                        onMouseEnter={(e) => {
                            Object.assign(e.currentTarget.style, itemHoverStyle)
                        }}
                        onMouseLeave={(e) => {
                            Object.assign(e.currentTarget.style, itemStyle)
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                            <span style={badgeStyle(feature.type)}>
                                {feature.type === 'parada' ? 'P' : 'L'}
                            </span>
                            <span style={{ 
                                fontWeight: '500',
                                color: '#374151',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                {feature.displayName}
                            </span>
                        </div>
                        <button
                            style={buttonStyle}
                            onClick={() => onSelectFeature(feature)}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#2563eb'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#3b82f6'
                            }}
                        >
                            Ver
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
