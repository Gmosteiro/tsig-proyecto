import React from 'react';
import { LineaDTO } from '../../services/linea';
import styles from '../../styles/EditStopPopup.module.css';

interface LineInfoReadOnlyPopupProps {
    linea: LineaDTO;
    onClose: () => void;
    onShowStops?: (lineaId: number, lineaDescripcion: string) => void;
}

const LineInfoReadOnlyPopup: React.FC<LineInfoReadOnlyPopupProps> = ({ linea, onClose, onShowStops }) => {
    if (!linea) return null;

    const handleShowStops = () => {
        if (onShowStops) {
            onShowStops(linea.id!, linea.descripcion);
        }
    };

    return (
        <div className={styles.popupContainer} onClick={e => e.stopPropagation()}>
            <button onClick={onClose} aria-label="Cerrar" className={styles.closeButton}>×</button>
            <div className={styles.title}>Información de Línea</div>
            
            <div className={styles.inputGroup}>
                <label>Descripción:</label>
                <div className={styles.readOnlyField}>{linea.descripcion}</div>
            </div>
            
            <div className={styles.inputGroup}>
                <label>Empresa:</label>
                <div className={styles.readOnlyField}>{linea.empresa}</div>
            </div>
            
            <div className={styles.inputGroup}>
                <label>Origen:</label>
                <div className={styles.readOnlyField}>{linea.origen}</div>
            </div>
            
            <div className={styles.inputGroup}>
                <label>Destino:</label>
                <div className={styles.readOnlyField}>{linea.destino}</div>
            </div>
            
            {linea.observacion && (
                <div className={styles.inputGroup}>
                    <label>Observación:</label>
                    <div className={styles.readOnlyField}>{linea.observacion}</div>
                </div>
            )}

            <div className={styles.inputGroup}>
                <label>Estado:</label>
                <div className={styles.readOnlyField} style={{ 
                    color: linea.estaHabilitada ? '#4caf50' : '#f44336',
                    fontWeight: 'bold'
                }}>
                    {linea.estaHabilitada ? 'Habilitada' : 'Deshabilitada'}
                </div>
            </div>

            <div className={styles.buttonGroup}>
                <button
                    type="button"
                    className={styles.moveButton}
                    onClick={handleShowStops}
                >
                    Ver Paradas
                </button>
            </div>
        </div>
    );
};

export default LineInfoReadOnlyPopup;
