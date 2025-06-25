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
    console.log('EditStopPopup parada:', parada);

    const [isAssociating, setIsAssociating] = useState(false);
    const [form, setForm] = useState({
        nombre: parada.nombre,
        observacion: parada.observacion,
        refugio: parada.refugio,
        estado: parada.estado,
    });

    useEffect(() => {
        if (parada) {
            setForm({
                nombre: parada.nombre,
                observacion: parada.observacion,
                refugio: parada.refugio,
                estado: parada.estado,
            });
        }
    }, [parada]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        let newValue: string | boolean = value;
        if (type === 'checkbox' && e.target instanceof HTMLInputElement) {
            newValue = e.target.checked;
        }
        setForm(prev => ({
            ...prev,
            [name]: newValue,
        }));
    };

    const handleSave = async () => {
        try {
            await updateStop({ ...parada, ...form });
            if (onSave) onSave({ ...parada, ...form });
            if (onClose) onClose();
        } catch (err) {
            alert("Error al guardar los cambios");
        }
    };

    const handleDelete = async () => {
        if (window.confirm(`¿Seguro que quieres eliminar la parada "${parada.nombre}"?`)) {
            try {
                console.log('Parada eliminada:', parada.id);
                await deleteStop(parada.id);
                if (onDelete) onDelete(parada.id);
                if (onClose) onClose();
                alert('Parada eliminada correctamente.');
            } catch (err) {
                alert("Error al eliminar la parada");
            }
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
                                name="estado"
                                value={form.estado}
                                onChange={handleChange}
                                className={styles.selectInput}
                            >
                                <option value="0">Habilitada</option>
                                <option value="1">Deshabilitada</option>
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
                                if (onMove) onMove({ ...parada, ...form });
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