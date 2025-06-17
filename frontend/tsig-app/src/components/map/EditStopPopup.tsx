import React, { useState, useEffect } from 'react';
import { updateStop, ParadaDTO } from '../../services/api';

type EditStopPopupProps = {
    stop: ParadaDTO | null;
    onClose?: () => void;
    onSave?: (updatedStop: any) => void;
};


const EditStopPopup: React.FC<EditStopPopupProps> = ({ stop, onClose, onSave }) => {

    if (!stop) return null;

    const [form, setForm] = useState({
        nombre: stop.nombre,
        observacion: stop.observacion,
        refugio: stop.refugio,
        estado: stop.estado,
    });

    useEffect(() => {
        if (stop) {
            setForm({
                nombre: stop.nombre,
                observacion: stop.observacion,
                refugio: stop.refugio,
                estado: stop.estado,
            });
        }
    }, [stop]);

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
            await updateStop({ ...stop, ...form });
            if (onSave) onSave({ ...stop, ...form });
            if (onClose) onClose();
        } catch (err) {
            alert("Error al guardar los cambios");
        }
    };

    return (
        <div
            className="edit-stop-popup"
            style={{
                position: 'absolute',
                bottom: 20,
                left: 20,
                background: 'white',
                zIndex: 1000,
                maxWidth: 420,
                minWidth: 260,
                border: '1px solid #bbb',
                borderRadius: 8,
                padding: '16px 20px 12px 16px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
                fontFamily: 'system-ui, sans-serif',
                fontSize: 15,
                color: '#222',
                lineHeight: 1.5,
            }}
            onClick={e => e.stopPropagation()}
        >
            {onClose && (
                <button
                    onClick={onClose}
                    aria-label="Cerrar"
                    style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        background: 'transparent',
                        border: 'none',
                        fontSize: 20,
                        cursor: 'pointer',
                        color: '#888',
                        transition: 'color 0.2s',
                    }}
                    onMouseOver={e => (e.currentTarget.style.color = '#d00')}
                    onMouseOut={e => (e.currentTarget.style.color = '#888')}
                >
                    ×
                </button>
            )}
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 16 }}>
                Editar parada
            </div>
            <form
                onSubmit={e => {
                    e.preventDefault();
                    handleSave();
                }}
            >
                <div style={{ marginBottom: 10 }}>
                    <label>
                        Nombre:<br />
                        <input
                            type="text"
                            name="nombre"
                            value={form.nombre}
                            onChange={handleChange}
                            style={{ width: '100%' }}
                        />
                    </label>
                </div>
                <div style={{ marginBottom: 10 }}>
                    <label>
                        Observación:<br />
                        <textarea
                            name="observacion"
                            value={form.observacion}
                            onChange={handleChange}
                            style={{ width: '100%', minHeight: 40 }}
                        />
                    </label>
                </div>
                <div style={{ marginBottom: 10 }}>
                    <label>
                        Refugio:
                        <input
                            type="checkbox"
                            name="refugio"
                            checked={form.refugio}
                            onChange={handleChange}
                            style={{ marginLeft: 8 }}
                        />
                    </label>
                </div>
                <div style={{ marginBottom: 16 }}>
                    <label>
                        Estado:
                        <select
                            name="estado"
                            value={form.estado}
                            onChange={handleChange}
                            style={{ marginLeft: 8 }}
                        >
                            <option value="HABILITADA">Habilitada</option>
                            <option value="DESHABILITADA">Deshabilitada</option>
                        </select>
                    </label>
                </div>
                <button
                    type="submit"
                    style={{
                        background: '#1976d2',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        padding: '8px 18px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: 15,
                    }}
                >
                    Guardar
                </button>
            </form>
        </div>
    );
};

export default EditStopPopup;