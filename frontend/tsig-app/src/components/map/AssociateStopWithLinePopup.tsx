import React, { useEffect, useState } from 'react';
import {
    getAllLines,
    associateStopWithLine,
    getAssociatedLinesForStop,
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
    const [associatedLines, setAssociatedLines] = useState<ParadaLineaDTO[]>([]);
    const [showSchedulePopup, setShowSchedulePopup] = useState(false);
    const [schedulePopupLineId, setSchedulePopupLineId] = useState<number | null>(null);
    const [selectedLine, setSelectedLine] = useState<number | null>(null);

    useEffect(() => {
        getAllLines().then(setLines);
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

    return (
        <div className={styles.popupContainer} onClick={e => e.stopPropagation()}>
            <button onClick={onClose} aria-label="Cerrar" className={styles.closeButton}>×</button>
            <div className={styles.title}>Asociar Parada con Línea</div>
            <div className={styles.inputGroup}>
                <label>Líneas:</label>
                <select
                    onChange={e => setSelectedLine(Number(e.target.value))}
                    className={styles.selectInput}
                    value={selectedLine || ''}
                >
                    <option value="" disabled>Seleccione una línea</option>
                    {lines.map(line => (
                        <option key={line.id} value={line.id}>{line.nombre}</option>
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
                            <li key={linea.idLinea}>
                                {lineaInfo ? lineaInfo.nombre : `Línea ${linea.idLinea}`}
                                <button
                                    className={styles.viewButton}
                                    style={{ marginLeft: 8 }}
                                    onClick={() => handleViewSchedules(linea.idLinea)}
                                >
                                    Ver Horarios
                                </button>
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