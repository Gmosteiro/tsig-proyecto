import React, { useState, useEffect } from 'react';
import { getAllLines, associateStopWithLine, ParadaDTO, LineaDTO, ParadalineaDTO } from '../../services/api';
import styles from '../../styles/EditStopPopup.module.css';

interface AssociateStopWithLinePopupProps {
    parada: ParadaDTO;
    onClose: () => void;
}

const AssociateStopWithLinePopup: React.FC<AssociateStopWithLinePopupProps> = ({ parada, onClose }) => {
    const [lines, setLines] = useState<LineaDTO[]>([]);
    const [selectedLine, setSelectedLine] = useState<number | null>(null);

    useEffect(() => {
        const fetchLines = async () => {
            try {
                const allLines = await getAllLines();
                setLines(allLines);
            } catch (error) {
                console.error("Error fetching lines:", error);
                alert("Error al cargar las líneas.");
            }
        };
        fetchLines();
    }, []);

    const handleAssociate = async () => {
        if (selectedLine) {
            try {
                const paradaLinea: ParadalineaDTO = {
                    idParadaLinea: 0, // o null si tu backend lo permite
                    idParada: parada.id,
                    idLinea: selectedLine,
                    horarios: []
                };
                await associateStopWithLine(paradaLinea);
                alert('Parada asociada correctamente.');
                onClose();
            } catch (error) {
                console.error("Error associating stop with line:", error);
                alert('Error al asociar la parada con la línea.');
            }
        } else {
            alert('Por favor, seleccione una línea.');
        }
    };

    return (
        <div className={styles.popupContainer} onClick={e => e.stopPropagation()}>
            <button onClick={onClose} aria-label="Cerrar" className={styles.closeButton}>×</button>
            <div className={styles.title}>Asociar Parada con Línea</div>
            <div className={styles.inputGroup}>
                <label>Líneas:</label>
                <select
                    onChange={(e) => setSelectedLine(Number(e.target.value))}
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
        </div>
    );
};

export default AssociateStopWithLinePopup;