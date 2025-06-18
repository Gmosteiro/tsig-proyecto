import { ParadaDTO } from '../../services/api'
import EditStopPopup from './EditStopPopup'

interface StopInfoPopupContainerProps {
    parada: ParadaDTO | null
    onClose: () => void
    onMove?: (parada: ParadaDTO) => void // Agrega esta prop
    onSave?: (parada: ParadaDTO) => void // Opcional, para guardar
}

export default function StopInfoPopupContainer({ parada, onClose, onMove, onSave }: StopInfoPopupContainerProps) {
    if (!parada) return null
    return (
        <EditStopPopup
            parada={parada}
            onClose={onClose}
            onSave={onSave ?? (() => { })}
            onMove={onMove}
        />
    )
}