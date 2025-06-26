import React, { useEffect, useState } from 'react';
import {
    getAllLines,
    associateStopWithLine,
    getAssociatedLinesForStop,
    removeStopLineAssociation,
    getLineasCercanasAParada,
    changeStopLineAssociationStatus,
    ParadaDTO,
    LineaDTO,
    ParadaLineaDTO
} from '../../services/api';
import styles from '../../styles/EditStopPopup.module.css';
import SchedulePopup from './SchedulePopup';

interface AssociateStopWithLinePopupProps {
    parada: ParadaDTO;
    onClose: () => void;
}

const AssociateStopWithLinePopup: React.FC<AssociateStopWithLinePopupProps> = ({ parada, onClose }) => {
    const [lines, setLines] = useState<LineaDTO[]>([]);
    const [filteredLines, setFilteredLines] = useState<LineaDTO[]>([]);
    const [associatedLines, setAssociatedLines] = useState<ParadaLineaDTO[]>([]);
    const [showSchedulePopup, setShowSchedulePopup] = useState(false);
    const [schedulePopupLineId, setSchedulePopupLineId] = useState<number | null>(null);
    const [selectedLine, setSelectedLine] = useState<number | null>(null);

    useEffect(() => {
        const loadLines = async () => {
            try {
                const allLines = await getAllLines();
                setLines(allLines);
                
                // Obtener líneas que estén a menos de 100m de la parada desde el backend
                const nearby = await getLineasCercanasAParada(Number(parada.id), 100);
                setFilteredLines(nearby);
            } catch (error) {
                console.error('Error al cargar lineas:', error);
            }
        };
        
        loadLines();
        fetchAssociatedLines();
        // eslint-disable-next-line
    }, []);

    const fetchAssociatedLines = async () => {
        try {
            const data = await getAssociatedLinesForStop(Number(parada.id));
            setAssociatedLines(data);
        } catch {
            alert('Error al cargar líneas asociadas');
        }
    };

    const handleAssociate = async () => {
        if (selectedLine) {
            try {
                const paradaLinea: ParadaLineaDTO = {
                    idParadaLinea: 0,
                    idParada: Number(parada.id),
                    idLinea: selectedLine,
                    estaHabilitada: true,
                    horarios: []
                };
                await associateStopWithLine(paradaLinea);
                alert('Parada asociada correctamente.');
                fetchAssociatedLines();
            } catch {
                alert('Error al asociar la parada con la línea.');
            }
        } else {
            alert('Por favor, seleccione una línea.');
        }
    };

    const handleViewSchedules = (lineaId: number) => {
        setSchedulePopupLineId(lineaId);
        setShowSchedulePopup(true);
    };

    const handleRemoveAssociation = async (idParadaLinea: number) => {
        if (window.confirm('¿Está seguro de que desea eliminar esta asociación? Esto también eliminará todos los horarios asociados.')) {
            try {
                await removeStopLineAssociation(idParadaLinea);
                alert('Asociación eliminada correctamente.');
                fetchAssociatedLines(); // Recargar la lista
            } catch {
                alert('Error al eliminar la asociación.');
            }
        }
    };

    const handleChangeStatus = async (idParadaLinea: number, currentStatus: boolean) => {
        try {
            const newStatus = !currentStatus;
            await changeStopLineAssociationStatus(idParadaLinea, newStatus);
            alert(`Parada ${newStatus ? 'habilitada' : 'deshabilitada'} correctamente.`);
            fetchAssociatedLines(); // Recargar la lista
        } catch (error) {
            console.error('Error al cambiar estado:', error);
            alert('Error al cambiar el estado de la parada. Recuerda que para habilitar una parada, debe estar a menos de 100 metros de la línea.');
        }
    };

    return (
        <div className={styles.popupContainerSafe} onClick={e => e.stopPropagation()}>
            <button onClick={onClose} aria-label="Cerrar" className={styles.closeButton}>×</button>
            <div className={styles.title}>Asociar Parada con Línea</div>
            <div className={styles.inputGroup}>
                <label>Líneas cercanas (dentro de 100m):</label>
                {filteredLines.length === 0 && (
                    <div style={{ color: '#666', fontSize: '0.9em', marginBottom: '8px' }}>
                        No hay líneas disponibles cerca de esta parada
                    </div>
                )}
                <select
                    onChange={e => setSelectedLine(Number(e.target.value))}
                    className={styles.selectInput}
                    value={selectedLine || ''}
                    disabled={filteredLines.length === 0}
                >
                    <option value="" disabled>Seleccione una línea</option>
                    {filteredLines.map(line => (
                        <option key={line.id} value={line.id}>{line.descripcion}</option>
                    ))}
                </select>
            </div>
            <div className={styles.buttonGroup}>
                <button onClick={handleAssociate} className={styles.saveButton}>Asociar</button>
            </div>
            <div className={styles.associatedLines}>
                <h3>Líneas Asociadas:</h3>
                <ul>
                    {associatedLines.map(linea => {
                        const lineaInfo = lines.find(l => l.id === linea.idLinea);
                        return (
                            <li key={linea.idLinea} style={{ marginBottom: '8px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <strong>{lineaInfo ? lineaInfo.descripcion : `Línea ${linea.idLinea}`}</strong>
                                        <span style={{ 
                                            marginLeft: 8, 
                                            padding: '2px 6px', 
                                            borderRadius: '4px',
                                            backgroundColor: linea.estaHabilitada ? '#d4edda' : '#f8d7da',
                                            color: linea.estaHabilitada ? '#155724' : '#721c24',
                                            fontSize: '0.8em'
                                        }}>
                                            {linea.estaHabilitada ? 'Habilitada' : 'Deshabilitada'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button
                                            className={styles.viewButton}
                                            onClick={() => handleViewSchedules(linea.idLinea)}
                                            style={{ fontSize: '0.8em', padding: '4px 8px' }}
                                        >
                                            Ver Horarios
                                        </button>
                                        <button
                                            className={styles.deleteButton}
                                            onClick={() => handleRemoveAssociation(linea.idParadaLinea)}
                                            style={{ fontSize: '0.8em', padding: '4px 8px' }}
                                        >
                                            Eliminar
                                        </button>
                                        <button
                                            className={styles.statusButton}
                                            onClick={() => handleChangeStatus(linea.idParadaLinea, linea.estaHabilitada)}
                                            style={{ 
                                                fontSize: '0.8em', 
                                                padding: '4px 8px', 
                                                backgroundColor: linea.estaHabilitada ? '#f8d7da' : '#d4edda', 
                                                color: linea.estaHabilitada ? '#721c24' : '#155724' 
                                            }}
                                        >
                                            {linea.estaHabilitada ? 'Deshabilitar' : 'Habilitar'}
                                        </button>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
            {showSchedulePopup && schedulePopupLineId !== null && (
                <SchedulePopup
                    paradaId={Number(parada.id)}
                    lineaId={schedulePopupLineId}
                    onClose={() => setShowSchedulePopup(false)}
                />
            )}
        </div>
    );
};

export default AssociateStopWithLinePopup;