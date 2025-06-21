import React, { useEffect, useState } from 'react';
import { getSchedulesForLineAndStop, addScheduleToLineStop, getAssociatedLinesForStop, ParadaLineaDTO } from '../../services/api';
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
    const [paradaLineaId, setParadaLineaId] = useState<number>(0);

    useEffect(() => {
        const fetchHorarios = async () => {
            try {
                const data = await getSchedulesForLineAndStop(lineaId, paradaId);
                setHorarios(data);
                // Buscar el idParadaLinea correcto
                const asociaciones = await getAssociatedLinesForStop(paradaId);
                const asociacion = asociaciones.find(pl => pl.idLinea === lineaId);
                setParadaLineaId(asociacion ? asociacion.idParadaLinea : 0);
            } catch {
                alert('Error al cargar los horarios');
            }
        };
        fetchHorarios();
    }, [lineaId, paradaId]);

    const handleAgregar = async () => {
        if (!nuevoHorario) return;
        try {
            console.log({
                idParadaLinea: paradaLineaId,
                idParada: paradaId,
                idLinea: lineaId,
                horarios: [{ hora: nuevoHorario }]
            });
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
                {horarios.map((h, i) => (
                    <li key={i}>{h.hora}</li>
                ))}
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