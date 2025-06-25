import { ParadaDTO } from '../../services/api'
import EditStopPopup from './EditStopPopup'

interface StopInfoPopupContainerProps {
    parada: ParadaDTO | null
    onClose: () => void
    onMove?: (parada: ParadaDTO) => void // Agrega esta prop
    onSave?: (parada: ParadaDTO) => void // Opcional, para guardar
    onDelete?: (id: number) => void // Opcional, para eliminar
}

export default function StopInfoPopupContainer({ parada, onClose, onMove, onSave, onDelete }: StopInfoPopupContainerProps) {
    if (!parada) return null
    return (
        <EditStopPopup
            parada={parada}
            onClose={onClose}
            onSave={onSave ?? (() => { })}
            onMove={onMove}
            onDelete={onDelete ?? (() => { })} // Manejo de eliminación opcional
        />
    )
}