import React, { useEffect, useState } from 'react';
import { getSchedulesForLineAndStop, addScheduleToLineStop, getAssociatedLinesForStop } from '../../services/api';
import { HorarioDTO } from '../../services/linea';
import styles from '../../styles/SchedulePopup.module.css';

interface SchedulePopupProps {
    paradaId: number;
    lineaId: number;
    onClose: () => void;
}

const SchedulePopup: React.FC<SchedulePopupProps> = ({ paradaId, lineaId, onClose }) => {
    const [horarios, setHorarios] = useState<HorarioDTO[]>([]);
    const [nuevoHorario, setNuevoHorario] = useState('');
    const [paradaLineaId, setParadaLineaId] = useState<number | null>(null);

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
            setHorarios([...horarios, { hora: nuevoHorario }]);
            setNuevoHorario('');
        } catch {
            alert('Error al agregar el horario');
        }
    };

    return (
        <div className={styles.popupContainer} onClick={e => e.stopPropagation()}>
            <button onClick={onClose} className={styles.closeButton}>×</button>
            <h3>Horarios para la línea {lineaId}</h3>
            <ul>
                {horarios.length === 0 ? (
                    <li>No hay horarios</li>
                ) : (
                    horarios.map((h, i) => <li key={i}>{h.hora}</li>)
                )}
            </ul>
            <div>
                <input
                    type="time"
                    value={nuevoHorario}
                    onChange={e => setNuevoHorario(e.target.value)}
                />
                <button onClick={handleAgregar}>Agregar</button>
            </div>
        </div>
    );
};

export default SchedulePopup;