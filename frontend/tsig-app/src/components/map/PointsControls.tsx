import React from 'react'

interface PointControlsProps {
    adding: boolean
    setAdding: React.Dispatch<React.SetStateAction<boolean>>
    setPoints: React.Dispatch<React.SetStateAction<[number, number][]>>
    selectedIdx: number | null
    handleDeleteSelected: () => void
    handleVerifyRoute: () => void
    handleSaveRoute: () => void
    pointsLength: number
    handleCancelAdd: () => void
    isValidated: boolean
    handleCancelValidation: () => void
}

const PointControls: React.FC<PointControlsProps> = ({
    adding,
    setAdding,
    setPoints,
    selectedIdx,
    handleDeleteSelected,
    handleVerifyRoute,
    handleSaveRoute,
    pointsLength,
    handleCancelAdd,
    isValidated,
    handleCancelValidation
}) => (
    <div className="flex justify-center gap-2 p-2">

        {!adding ? (
            <button
                className="px-3 py-1 rounded bg-gray-200"
                onClick={() => setAdding(true)}
            >
                Crear Ruta
            </button>
        ) : (
            <>
                <span className="px-3 py-1 rounded bg-blue-600 text-white">
                    Agregando: Clickea el mapa para agregar puntos a la ruta
                </span>
                <button
                    className="px-3 py-1 rounded bg-red-600 text-white"
                    onClick={handleCancelAdd}
                >
                    Cancelar
                </button>
            </>
        )}

        {!isValidated && selectedIdx !== null && (
            <button
                className="px-3 py-1 rounded bg-red-400 text-white"
                onClick={handleDeleteSelected}
                disabled={isValidated}
            >
                Eliminar Punto Seleccionado
            </button>
        )}

        {!isValidated && pointsLength > 1 && (
            <button
                className="px-3 py-1 rounded bg-yellow-500 text-white"
                onClick={handleVerifyRoute}
                disabled={pointsLength === 0}
            >
                Verificar Ruta
            </button>
        )}

        {isValidated && (
            <>
                <button
                    className="px-3 py-1 rounded bg-green-500 text-white"
                    onClick={handleSaveRoute}
                >
                    Guardar Ruta
                </button>
                <button
                    className="px-3 py-1 rounded bg-gray-400 text-white"
                    onClick={handleCancelValidation}
                >
                    Cancelar Validación
                </button>
            </>
        )}
    </div>
)

export default PointControls