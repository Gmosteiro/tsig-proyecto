import React, { useState, useEffect } from 'react';
import { ParadaDTO, getAssociatedLinesForStop, ParadaLineaDTO, getAllLines, LineaDTO } from '../../services/api';
import styles from '../../styles/EditStopPopup.module.css';

interface StopInfoReadOnlyPopupProps {
    parada: ParadaDTO;
    onClose: () => void;
    onViewRoute?: (lineaId: number) => void;
}

const StopInfoReadOnlyPopup: React.FC<StopInfoReadOnlyPopupProps> = ({ parada, onClose, onViewRoute }) => {
    const [associatedLines, setAssociatedLines] = useState<ParadaLineaDTO[]>([]);
    const [allLines, setAllLines] = useState<LineaDTO[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [associations, lines] = await Promise.all([
                    getAssociatedLinesForStop(Number(parada.id)),
                    getAllLines()
                ]);
                
                // Solo mostrar asociaciones habilitadas
                const enabledAssociations = associations.filter(assoc => assoc.estaHabilitada);
                setAssociatedLines(enabledAssociations);
                setAllLines(lines);
            } catch (error) {
                console.error('Error al cargar datos:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [parada.id]);

    const getLineInfo = (idLinea: number) => {
        return allLines.find(line => line.id === idLinea);
    };

    const handleViewRoute = (lineaId: number) => {
        if (onViewRoute) {
            onViewRoute(lineaId);
        } else {
            console.log('Ver recorrido de línea:', lineaId);
        }
    };

    if (!parada) return null;

    return (
        <div className={styles.popupContainerSafe} onClick={e => e.stopPropagation()}>
            <button onClick={onClose} aria-label="Cerrar" className={styles.closeButton}>×</button>
            <div className={styles.title}>Información de Parada</div>
            
            <div className={styles.inputGroup}>
                <label>Nombre:</label>
                <div className={styles.readOnlyField}>{parada.nombre}</div>
            </div>
            
            <div className={styles.inputGroup}>
                <label>Estado:</label>
                <div className={styles.readOnlyField}>
                    <span style={{ 
                        padding: '2px 8px', 
                        borderRadius: '4px',
                        backgroundColor: parada.habilitada ? '#d4edda' : '#f8d7da',
                        color: parada.habilitada ? '#155724' : '#721c24'
                    }}>
                        {parada.habilitada ? 'Habilitada' : 'Deshabilitada'}
                    </span>
                </div>
            </div>
            
            <div className={styles.inputGroup}>
                <label>Refugio:</label>
                <div className={styles.readOnlyField}>
                    {parada.refugio ? 'Sí' : 'No'}
                </div>
            </div>
            
            {parada.observacion && (
                <div className={styles.inputGroup}>
                    <label>Observación:</label>
                    <div className={styles.readOnlyField}>{parada.observacion}</div>
                </div>
            )}
            
            <div className={styles.inputGroup}>
                <label>Líneas disponibles:</label>
                {loading ? (
                    <div className={styles.readOnlyField}>Cargando...</div>
                ) : associatedLines.length > 0 ? (
                    <div className={styles.associatedLines}>
                        {associatedLines.map(association => {
                            const lineInfo = getLineInfo(association.idLinea);
                            return (
                                <div key={association.idLinea} className={styles.lineCard}>
                                    <div className={styles.lineHeader}>
                                        <strong>{lineInfo?.descripcion || `Línea ${association.idLinea}`}</strong>
                                        <button
                                            className={styles.viewButton}
                                            onClick={() => handleViewRoute(association.idLinea)}
                                            style={{ fontSize: '0.8em', padding: '4px 8px' }}
                                        >
                                            Ver Recorrido
                                        </button>
                                    </div>
                                    {lineInfo?.empresa && (
                                        <div className={styles.lineDetail}>
                                            <span>Empresa: {lineInfo.empresa}</span>
                                        </div>
                                    )}
                                    {association.horarios && association.horarios.length > 0 && (
                                        <div className={styles.lineDetail}>
                                            <span>Horarios: </span>
                                            <div className={styles.schedules}>
                                                {association.horarios.map((horario, index) => (
                                                    <span key={index} className={styles.schedule}>
                                                        {horario.hora}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className={styles.readOnlyField}>No hay líneas disponibles en esta parada</div>
                )}
            </div>
        </div>
    );
};

export default StopInfoReadOnlyPopup;
