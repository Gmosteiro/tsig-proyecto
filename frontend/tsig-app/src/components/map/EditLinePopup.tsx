import React, { useState, useEffect } from 'react';
import { updateLine, deleteLine, LineaDTO, changeLineStatus } from '../../services/linea';
import { getEmpresas } from '../../services/api';
import styles from '../../styles/EditStopPopup.module.css'; // Reutilizamos los estilos

interface EditLinePopupProps {
    linea: LineaDTO;
    onSave: (linea: LineaDTO) => void;
    onClose: () => void;
    onModifyRoute?: (linea: LineaDTO) => void;
    onDelete?: (id: number) => void;
    onShowStops?: (lineaId: number, lineaDescripcion: string) => void;
}

const EditLinePopup: React.FC<EditLinePopupProps> = ({ 
    linea, 
    onClose, 
    onSave, 
    onModifyRoute, 
    onDelete,
    onShowStops
}) => {
    if (!linea) return null;

    const [form, setForm] = useState({
        descripcion: linea.descripcion || '',
        empresa: linea.empresa || '',
        observacion: linea.observacion || '',
        estaHabilitada: linea.estaHabilitada,
    });

    const [empresas, setEmpresas] = useState<{ id: number, nombre: string }[]>([]);

    useEffect(() => {
        const fetchEmpresas = async () => {
            try {
                const empresasData = await getEmpresas();
                setEmpresas(empresasData);
            } catch (err) {
                console.error('Error al cargar empresas:', err);
            }
        };
        fetchEmpresas();
    }, []);

    useEffect(() => {
        if (linea) {
            setForm({
                descripcion: linea.descripcion || '',
                empresa: linea.empresa || '',
                observacion: linea.observacion || '',
                estaHabilitada: linea.estaHabilitada,
            });
        }
    }, [linea]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSave = async () => {
        try {
            const updatedLinea = { ...linea, ...form };
            
            // Si cambió el estado de la línea, usar el endpoint específico
            if (linea.estaHabilitada !== form.estaHabilitada) {
                await changeLineStatus(linea.id!, form.estaHabilitada);
            }
            
            // Actualizar otros campos
            await updateLine(updatedLinea);
            
            if (onSave) onSave(updatedLinea);
            if (onClose) onClose();
        } catch (err: any) {
            const mensaje = err.response?.data || "Error al guardar los cambios de la línea";
            alert(mensaje);
        }
    };

    const handleDelete = async () => {
        if (window.confirm(`¿Seguro que quieres eliminar la línea "${linea.descripcion}"?`)) {
            try {
                await deleteLine(linea.id!);
                if (onDelete) onDelete(linea.id!);
                if (onClose) onClose();
                alert('Línea eliminada correctamente.');
            } catch (err) {
                alert("Error al eliminar la línea");
            }
        }
    };

    const handleModifyRoute = () => {
        if (onModifyRoute) {
            onModifyRoute(linea);
        }
        if (onClose) onClose();
    };

    const handleShowStops = () => {
        if (onShowStops) {
            onShowStops(linea.id!, linea.descripcion);
        }
        if (onClose) onClose();
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
                Editar línea
            </div>
            <form
                onSubmit={e => {
                    e.preventDefault();
                    handleSave();
                }}
            >
                <div className={styles.inputGroup}>
                    <label>
                        Descripción:<br />
                        <input
                            type="text"
                            name="descripcion"
                            value={form.descripcion}
                            onChange={handleChange}
                            className={styles.textInput}
                        />
                    </label>
                </div>
                <div className={styles.inputGroup}>
                    <label>
                        Empresa:<br />
                        <select
                            name="empresa"
                            value={form.empresa}
                            onChange={handleChange}
                            className={styles.textInput}
                        >
                            <option value="">Seleccionar empresa...</option>
                            {empresas.map(empresa => (
                                <option key={empresa.id} value={empresa.nombre}>
                                    {empresa.nombre}
                                </option>
                            ))}
                        </select>
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
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                            type="checkbox"
                            name="estaHabilitada"
                            checked={form.estaHabilitada}
                            onChange={handleChange}
                        />
                        Línea habilitada
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
                        onClick={handleModifyRoute}
                    >
                        Modificar Recorrido
                    </button>
                    <button
                        type="button"
                        className={styles.deleteButton}
                        onClick={handleDelete}
                    >
                        Eliminar
                    </button>
                    <button
                        type="button"
                        className={styles.showStopsButton}
                        onClick={handleShowStops}
                    >
                        Ver Paradas
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditLinePopup;
