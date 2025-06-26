import React, { useState, useEffect } from 'react';
import { updateStop, deleteStop, ParadaDTO } from '../../services/api';
import styles from '../../styles/EditStopPopup.module.css';
import AssociateStopWithLinePopup from './AssociateStopWithLinePopup';

interface EditStopPopupProps {
    parada: ParadaDTO;
    onSave: (parada: ParadaDTO) => void;
    onClose: () => void;
    onMove?: (parada: ParadaDTO) => void;
    onDelete?: (id: number) => void;
}

const EditStopPopup: React.FC<EditStopPopupProps> = ({ parada, onClose, onSave, onMove, onDelete }) => {
    if (!parada) return null;

    const [isAssociating, setIsAssociating] = useState(false);
    const [form, setForm] = useState({
        nombre: parada.nombre,
        observacion: parada.observacion,
        refugio: parada.refugio,
        habilitada: parada.habilitada,
    });

    useEffect(() => {
        if (parada) {
            setForm({
                nombre: parada.nombre,
                observacion: parada.observacion,
                refugio: parada.refugio,
                habilitada: parada.habilitada,
            });
        }
    }, [parada]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        let newValue: string | boolean | number = value;
        if (type === 'checkbox' && e.target instanceof HTMLInputElement) {
            newValue = e.target.checked;
        } else if (name === 'habilitada') {
            newValue = value === 'true';
        }
        setForm(prev => ({
            ...prev,
            [name]: newValue,
        }));
    };

    const handleSave = async () => {
        try {
            // Validar campos requeridos
            if (!form.nombre.trim()) {
                alert("El nombre de la parada es obligatorio");
                return;
            }

            // Confirmación antes de guardar
            const confirmMessage = `¿Confirma que desea guardar los cambios en la parada "${form.nombre}"?`;
            
            if (!window.confirm(confirmMessage)) {
                return; // El usuario canceló
            }

            await updateStop({ ...parada, ...form });
            
            // Alerta de éxito
            alert(`Parada "${form.nombre}" modificada correctamente`);
            
            if (onSave) onSave({ ...parada, ...form });
            if (onClose) onClose();
        } catch (err: any) {
            // Manejo detallado de errores
            console.error('Error al guardar parada:', err);
            
            let errorMessage = "Error al guardar los cambios de la parada";
            
            if (err.response?.data) {
                errorMessage = `Error: ${err.response.data}`;
            } else if (err.message) {
                errorMessage = `Error: ${err.message}`;
            }
            
            alert(errorMessage);
        }
    };

    const handleDelete = async () => {
        // Confirmación antes de eliminar
        const confirmMessage = `¿Está seguro que desea eliminar la parada "${parada.nombre}"?\n\nEsta acción no se puede deshacer.`;
        
        if (!window.confirm(confirmMessage)) {
            return; // El usuario canceló
        }

        try {
            console.log('Eliminando parada:', parada.id);
            await deleteStop(parada.id);
            
            // Alerta de éxito
            alert(`Parada "${parada.nombre}" eliminada correctamente`);
            
            if (onDelete) onDelete(parada.id);
            if (onClose) onClose();
        } catch (err: any) {
            // Manejo detallado de errores
            console.error('Error al eliminar parada:', err);
            
            let errorMessage = "Error al eliminar la parada";
            
            if (err.response?.data) {
                errorMessage = `Error: ${err.response.data}`;
            } else if (err.message) {
                errorMessage = `Error: ${err.message}`;
            }
            
            alert(errorMessage);
        }
    };

    return (
        <>
            {isAssociating && (
                <AssociateStopWithLinePopup
                    parada={parada}
                    onClose={() => setIsAssociating(false)}
                />
            )}
            <div
                className={styles.popupContainer}
                onClick={e => e.stopPropagation()}
                style={{ display: isAssociating ? 'none' : 'block' }}
            >
                {onClose && (
                    <button
                        onClick={onClose}
                        aria-label="Cerrar"
                        className={styles.closeButton}
                    >
                        ×
                    </button>
                )}
                <div className={styles.title}>
                    Editar parada
                </div>
                <form
                    onSubmit={e => {
                        e.preventDefault();
                        handleSave();
                    }}
                >
                    <div className={styles.inputGroup}>
                        <label>
                            Nombre:<br />
                            <input
                                type="text"
                                name="nombre"
                                value={form.nombre}
                                onChange={handleChange}
                                className={styles.textInput}
                            />
                        </label>
                    </div>
                    <div className={styles.inputGroup}>
                        <label>
                            Observación:<br />
                            <textarea
                                name="observacion"
                                value={form.observacion}
                                onChange={handleChange}
                                className={styles.textAreaInput}
                            />
                        </label>
                    </div>
                    <div className={`${styles.inputGroup} ${styles.checkboxGroup}`}>
                        <label htmlFor="refugio" className={styles.checkboxLabel}>
                            Refugio:
                        </label>
                        <input
                            id="refugio"
                            type="checkbox"
                            name="refugio"
                            checked={form.refugio}
                            onChange={handleChange}
                            className={styles.checkboxInput}
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>
                            Estado:
                            <select
                                name="habilitada"
                                value={form.habilitada.toString()}
                                onChange={handleChange}
                                className={styles.selectInput}
                            >
                                <option value="true">Habilitada</option>
                                <option value="false">Deshabilitada</option>
                            </select>
                        </label>
                    </div>
                    <div className={styles.buttonGroup}>
                        <button
                            type="submit"
                            className={styles.saveButton}
                        >
                            Guardar
                        </button>
                        <button
                            type="button"
                            className={styles.moveButton}
                            onClick={() => {
                                // Confirmación antes de mover
                                const confirmMessage = `¿Desea cambiar la ubicación de la parada "${form.nombre}"?\n\nPodrá hacer clic en el mapa para seleccionar la nueva ubicación.`;
                                
                                if (window.confirm(confirmMessage)) {
                                    if (onMove) onMove({ ...parada, ...form });
                                }
                            }}
                        >
                            Mover
                        </button>
                        <button
                            type="button"
                            className={styles.deleteButton}
                            style={{ marginLeft: 8, background: '#d32f2f', color: 'white' }}
                            onClick={handleDelete}
                        >
                            Eliminar
                        </button>
                        <button
                            type="button"
                            className={styles.associateButton}
                            style={{ marginLeft: 8, background: '#1976d2', color: 'white' }}
                            onClick={() => setIsAssociating(true)}
                        >
                            Asociar con Línea
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default EditStopPopup;