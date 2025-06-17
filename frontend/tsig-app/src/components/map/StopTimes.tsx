import React, { useState } from 'react';
import { HorarioDTO } from '../../services/api';

interface StopTimesProps {
    id?: number; // Optional id of ParadaLineaDTO
}

const StopTimes: React.FC<StopTimesProps> = ({ id }) => {
    const [horarios, setHorarios] = useState<HorarioDTO[]>([]);

    const addHorario = () => {
        const newHorario: HorarioDTO = { hora: new Date().toLocaleTimeString() }; // Default to current time
        setHorarios([...horarios, newHorario]);
    };

    const handleHorarioChange = (index: number, updatedHorario: HorarioDTO) => {
        const updatedHorarios = [...horarios];
        updatedHorarios[index] = updatedHorario;
        setHorarios(updatedHorarios);
    };

    return (
        <div>
            <h3>Horarios</h3>
            <ul>
                {horarios.map((horario, index) => (
                    <li key={index}>
                        <input
                            type="time"
                            value={horario.hora.toString().substring(0, 5)} // Format to HH:mm
                            onChange={(e) => handleHorarioChange(index, { hora: e.target.value })}
                        />
                    </li>
                ))}
            </ul>
            <button onClick={addHorario}>Agregar Horario</button>
        </div>
    );
};

export default StopTimes;