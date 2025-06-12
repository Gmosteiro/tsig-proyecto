import React from 'react'

interface PointControlsProps {
    adding: boolean
    setAdding: React.Dispatch<React.SetStateAction<boolean>>
    selectedIdx: number | null
    handleDeleteSelected: () => void
    handleSubmit: () => void
    pointsLength: number
}

const PointControls: React.FC<PointControlsProps> = ({
    adding,
    setAdding,
    selectedIdx,
    handleDeleteSelected,
    handleSubmit,
    pointsLength
}) => (
    <div className="flex justify-center gap-2 p-2">
        <button
            className={`px-3 py-1 rounded ${adding ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setAdding(a => !a)}
        >
            {adding ? 'Agregando: Clickea el mapa para agregar puntos a la ruta' : 'Crear Ruta'}
        </button>

        {selectedIdx !== null && (
            <button
                className="px-3 py-1 rounded bg-red-400 text-white"
                onClick={handleDeleteSelected}
            >
                Eliminar Punto Seleccionado
            </button>
        )}

        {pointsLength > 1 && (
            <button
                className="px-3 py-1 rounded bg-green-500 text-white"
                onClick={handleSubmit}
                disabled={pointsLength === 0}
            >
                Visualizar Ruta
            </button>
        )}
    </div>
)

export default PointControls