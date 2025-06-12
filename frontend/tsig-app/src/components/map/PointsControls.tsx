import React from 'react'

interface PointControlsProps {
    adding: boolean
    setAdding: React.Dispatch<React.SetStateAction<boolean>>
    setPoints: React.Dispatch<React.SetStateAction<[number, number][]>>
    selectedIdx: number | null
    handleDeleteSelected: () => void
    handleSubmit: () => void
    pointsLength: number
}

const PointControls: React.FC<PointControlsProps> = ({
    adding,
    setAdding,
    setPoints,
    selectedIdx,
    handleDeleteSelected,
    handleSubmit,
    pointsLength
}) => (
    <div className="flex justify-center gap-2 p-2">
        <button
            className={`min-h-[50px] min-w-[200px] px-3 py-1 rounded-lg font-semibold shadow-md transition-colors duration-150 ${adding
                    ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-400'
                    : 'bg-gradient-to-r from-cyan-400 via-blue-300 to-blue-500 text-white hover:from-cyan-500 hover:to-blue-600 focus:ring-2 focus:ring-blue-300'
                }`}
            onClick={() => {
                if (!adding) setPoints([])
                setAdding(a => !a)
            }}
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