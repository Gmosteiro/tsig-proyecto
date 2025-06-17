import { ParadaDTO } from '../../services/api'
import EditStopPopup from './EditStopPopup'

interface StopInfoPopupContainerProps {
    parada: ParadaDTO | null
    onClose: () => void
}

export default function StopInfoPopupContainer({ parada, onClose }: StopInfoPopupContainerProps) {
    if (!parada) return null
    return <EditStopPopup parada={parada} onClose={onClose} onSave={() => { }} />
}