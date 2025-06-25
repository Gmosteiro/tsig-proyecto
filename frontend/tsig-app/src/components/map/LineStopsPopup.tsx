import React, { useState, useEffect } from 'react';
import { getParadasDeLinea } from '../../services/linea';
import { changeStopLineAssociationStatus, ParadaLineaDTO, removeStopLineAssociation } from '../../services/api';
import { useAuth } from '../../context/authContext';
import styles from '../../styles/EditStopPopup.module.css';
import SchedulePopup from './SchedulePopup';

interface LineStopsPopupProps {
    lineaId: number;
    lineaDescripcion: string;
    onClose: () => void;
    onViewStop?: (latitud: number, longitud: number) => void;
    onSelectStop?: (parada: ParadaLineaDTO) => void;
}

const LineStopsPopup: React.FC<LineStopsPopupProps> = ({ 
    lineaId, 
    lineaDescripcion, 
    onClose, 
    onViewStop,
    onSelectStop 
}) => {
    const { isAuthenticated } = useAuth();
    const [stops, setStops] = useState<ParadaLineaDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showScheduleForStop, setShowScheduleForStop] = useState<{ paradaId: number; lineaId: number } | null>(null);

    useEffect(() => {
        const fetchStops = async () => {
            try {
                setLoading(true);
                setError(null);
                const stopsData = await getParadasDeLinea(lineaId);
                
                // Para usuarios no autenticados, filtrar solo paradas habilitadas
                const filteredStops = isAuthenticated ? stopsData : stopsData.filter(stop => stop.estaHabilitada);
                setStops(filteredStops);
                
            } catch (err) {
                console.error('Error al cargar paradas:', err);
                setError('Error al cargar las paradas de la línea');
            } finally {
                setLoading(false);
            }
        };

        fetchStops();
    }, [lineaId, isAuthenticated]);

    const handleToggleStatus = async (paradaLineaId: number) => {
        try {
            // Encontrar la parada actual para determinar el nuevo estado
            const currentStop = stops.find(stop => stop.idParadaLinea === paradaLineaId);
            if (!currentStop) return;
            
            const newStatus = !currentStop.estaHabilitada;
            await changeStopLineAssociationStatus(paradaLineaId, newStatus);
            
            // Actualizar la lista local
            setStops(prevStops => 
                prevStops.map(stop => 
                    stop.idParadaLinea === paradaLineaId 
                        ? { ...stop, estaHabilitada: newStatus }
                        : stop
                )
            );
        } catch (err) {
            console.error('Error al cambiar estado:', err);
            alert('Error al cambiar el estado del par parada-línea. Recuerda que para habilitar una parada, debe estar a menos de 100 metros de la línea.');
        }
    };

    const handleViewStop = (stop: ParadaLineaDTO) => {
        // Centrar el mapa en la parada
        if (onViewStop && stop.latitudParada && stop.longitudParada) {
            console.log('Centrando mapa en:', stop.latitudParada, stop.longitudParada);
            onViewStop(stop.latitudParada, stop.longitudParada);
        } else {
            console.warn('No se puede centrar mapa - datos faltantes:', { 
                onViewStop: !!onViewStop, 
                latitud: stop.latitudParada, 
                longitud: stop.longitudParada 
            });
        }
        
        // Seleccionar la parada para mostrar su popup de información
        if (onSelectStop) {
            onSelectStop(stop);
        }
    };

    const handleRemoveAssociation = async (idParadaLinea: number, nombreParada: string) => {
        if (window.confirm(`¿Está seguro de que desea eliminar la asociación con la parada "${nombreParada}"? Esto también eliminará todos los horarios asociados.`)) {
            try {
                await removeStopLineAssociation(idParadaLinea);
                alert('Asociación eliminada correctamente.');
                // Actualizar la lista local
                setStops(prevStops => prevStops.filter(stop => stop.idParadaLinea !== idParadaLinea));
            } catch (err) {
                console.error('Error al eliminar asociación:', err);
                alert('Error al eliminar la asociación.');
            }
        }
    };

    if (showScheduleForStop) {
        return (
            <SchedulePopup
                paradaId={showScheduleForStop.paradaId}
                lineaId={showScheduleForStop.lineaId}
                lineaDescripcion={lineaDescripcion}
                onClose={() => setShowScheduleForStop(null)}
            />
        );
    }

    return (
        <div className={`${styles.popupContainer} ${styles.cornerPopup}`} onClick={e => e.stopPropagation()}>
            <button onClick={onClose} aria-label="Cerrar" className={styles.closeButton}>×</button>
            <div className={styles.title}>Paradas de {lineaDescripcion}</div>
            
            {loading && (
                <div className={styles.inputGroup}>
                    <div className={styles.readOnlyField}>Cargando paradas...</div>
                </div>
            )}

            {error && (
                <div className={styles.inputGroup}>
                    <div className={styles.readOnlyField} style={{ color: '#f44336' }}>
                        {error}
                    </div>
                </div>
            )}

            {!loading && !error && (
                <div className={styles.stopsContainer}>
                    {stops.length === 0 ? (
                        <div className={styles.inputGroup}>
                            <div className={styles.readOnlyField}>No hay paradas asociadas a esta línea</div>
                        </div>
                    ) : (
                        <div className={styles.stopsList}>
                            {stops.map((stop, index) => (
                                <div key={stop.idParadaLinea} className={styles.stopItem}>
                                    <div className={styles.stopHeader}>
                                        <span className={styles.stopOrder}>{index + 1}.</span>
                                        <span className={styles.stopName}>
                                            {stop.nombreParada || `Parada ${stop.idParada}`}
                                        </span>
                                        {/* Solo mostrar estado para usuarios autenticados */}
                                        {isAuthenticated && (
                                            <span className={`${styles.stopStatus} ${stop.estaHabilitada ? styles.enabled : styles.disabled}`}>
                                                {stop.estaHabilitada ? 'Habilitada' : 'Deshabilitada'}
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* Para usuarios no autenticados, mostrar horarios */}
                                    {!isAuthenticated && (
                                        <div className={styles.schedulesInfo}>
                                            <div className={styles.schedulesLabel}>Horarios:</div>
                                            <div className={styles.schedulesList}>
                                                {stop.horarios?.length > 0 ? (
                                                    stop.horarios.map((horario, idx) => (
                                                        <span key={idx} className={styles.scheduleTime}>
                                                            {horario.hora}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className={styles.noSchedules}>Sin horarios</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className={styles.stopActions}>
                                        <button
                                            className={styles.viewButton}
                                            onClick={() => handleViewStop(stop)}
                                            title="Centrar mapa en esta parada"
                                        >
                                            Ver
                                        </button>
                                        
                                        {isAuthenticated && (
                                            <>
                                                <button
                                                    className={styles.scheduleButton}
                                                    onClick={() => setShowScheduleForStop({ paradaId: stop.idParada, lineaId: lineaId })}
                                                    title="Ver/editar horarios"
                                                >
                                                    Horarios
                                                </button>
                                                
                                                <button
                                                    className={`${styles.toggleButton} ${stop.estaHabilitada ? styles.disableButton : styles.enableButton}`}
                                                    onClick={() => handleToggleStatus(stop.idParadaLinea)}
                                                    title={stop.estaHabilitada ? 'Deshabilitar' : 'Habilitar'}
                                                >
                                                    {stop.estaHabilitada ? 'Deshabilitar' : 'Habilitar'}
                                                </button>

                                                <button
                                                    className={styles.removeButton}
                                                    onClick={() => handleRemoveAssociation(stop.idParadaLinea, stop.nombreParada || '')}
                                                    title="Eliminar asociación"
                                                >
                                                    Eliminar
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LineStopsPopup;
