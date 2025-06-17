import React, { useState, useEffect } from 'react';
import { updateStop, ParadaDTO } from '../../services/api';
import styles from '../../styles/EditStopPopup.module.css';

interface EditStopPopupProps {
    parada: ParadaDTO;
    onSave: (parada: ParadaDTO) => void;
    onClose: () => void;
}

const EditStopPopup: React.FC<EditStopPopupProps> = ({ parada, onClose, onSave }) => {
    if (!parada) return null;

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

    return (
        <div
            className={styles.popupContainer}
            onClick={e => e.stopPropagation()}
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
                <div className={styles.inputGroup}>
                    <label>
                        Refugio:
                        <input
                            type="checkbox"
                            name="refugio"
                            checked={form.refugio}
                            onChange={handleChange}
                            className={styles.checkboxInput}
                        />
                    </label>
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
                            <option value="HABILITADA">Habilitada</option>
                            <option value="DESHABILITADA">Deshabilitada</option>
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
                </div>
            </form>
        </div>
    );
};

export default EditStopPopup;