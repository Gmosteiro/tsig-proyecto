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
    <div className="flex gap-2 p-2">
        <button
            className={`px-3 py-1 rounded ${adding ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setAdding(a => !a)}
        >
            {adding ? 'Adding: Click map' : 'Add Point'}
        </button>
        <button
            className="px-3 py-1 rounded bg-red-400 text-white"
            onClick={handleDeleteSelected}
            disabled={selectedIdx === null}
        >
            Delete Selected Point
        </button>
        <button
            className="px-3 py-1 rounded bg-green-500 text-white"
            onClick={handleSubmit}
            disabled={pointsLength === 0}
        >
            Submit
        </button>
    </div>
)

export default PointControls