import React, { useEffect, useState } from 'react';
import { addScheduleToLineStop, getAssociatedLinesForStop, removeSchedule, HorarioDTO } from '../../services/api';
import { useAuth } from '../../context/authContext';
import styles from '../../styles/SchedulePopup.module.css';

interface SchedulePopupProps {
    paradaId: number;
    lineaId: number;
    lineaDescripcion?: string;
    onClose: () => void;
}

const SchedulePopup: React.FC<SchedulePopupProps> = ({ paradaId, lineaId, lineaDescripcion, onClose }) => {
    const [horarios, setHorarios] = useState<HorarioDTO[]>([]);
    const [nuevoHorario, setNuevoHorario] = useState('');
    const [paradaLineaId, setParadaLineaId] = useState<number | null>(null);
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            // 1. Cargar asociaciones
            const asociaciones = await getAssociatedLinesForStop(paradaId);

            // Busca la asociación para la línea y parada deseada
            const paradaLinea = asociaciones.find(
                pl => Number(pl.idLinea) === Number(lineaId) && Number(pl.idParada) === Number(paradaId)
            );
            const horariosData = paradaLinea ? paradaLinea.horarios : [];
            setHorarios(horariosData);

            // 2. Buscar el idParadaLinea correcto
            const asociacion = asociaciones.find(pl => Number(pl.idLinea) === Number(lineaId));
            setParadaLineaId(asociacion ? asociacion.idParadaLinea : null);
        };
        fetchData();
    }, [lineaId, paradaId]);

    const handleAgregar = async () => {
        if (!nuevoHorario || paradaLineaId == null) return;
        try {
            await addScheduleToLineStop(lineaId, paradaId, { hora: nuevoHorario }, paradaLineaId);
            setNuevoHorario('');
            
            // Recargar los horarios desde el servidor para obtener los IDs
            const asociaciones = await getAssociatedLinesForStop(paradaId);
            const paradaLinea = asociaciones.find(
                pl => Number(pl.idLinea) === Number(lineaId) && Number(pl.idParada) === Number(paradaId)
            );
            const horariosActualizados = paradaLinea ? paradaLinea.horarios : [];
            setHorarios(horariosActualizados);
        } catch {
            alert('Error al agregar el horario');
        }
    };

    const handleEliminar = async (idHorario: number) => {
        if (window.confirm('¿Está seguro de que desea eliminar este horario?')) {
            try {
                await removeSchedule(idHorario);
                setHorarios(horarios.filter(h => h.id !== idHorario));
                alert('Horario eliminado correctamente.');
            } catch {
                alert('Error al eliminar el horario.');
            }
        }
    };

    return (
        <div className={styles.popupContainer} onClick={e => e.stopPropagation()}>
            <button onClick={onClose} className={styles.closeButton}>×</button>
            <h3>Horarios para {lineaDescripcion || `línea ${lineaId}`}</h3>
            <ul className={styles.scheduleList}>
                {horarios.length === 0 ? (
                    <li>No hay horarios</li>
                ) : (
                    horarios.map((h, i) => (
                        <li key={h.id || i} className={styles.scheduleItem}>
                            <span>{h.hora}</span>
                            {isAuthenticated && h.id && (
                                <button 
                                    onClick={() => handleEliminar(h.id!)}
                                    className={styles.deleteButton}
                                    title="Eliminar horario"
                                >
                                    ×
                                </button>
                            )}
                        </li>
                    ))
                )}
            </ul>
            {isAuthenticated && (
                <div className={styles.addScheduleContainer}>
                    <input
                        type="time"
                        value={nuevoHorario}
                        onChange={e => setNuevoHorario(e.target.value)}
                        className={styles.timeInput}
                    />
                    <button onClick={handleAgregar} className={styles.addButton}>Agregar</button>
                </div>
            )}
        </div>
    );
};

export default SchedulePopup;