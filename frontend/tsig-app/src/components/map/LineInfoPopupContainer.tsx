import { LineaDTO } from '../../services/linea'
import EditLinePopup from './EditLinePopup'

interface LineInfoPopupContainerProps {
    linea: LineaDTO | null
    onClose: () => void
    onModifyRoute?: (linea: LineaDTO) => void // Para modificar el recorrido
    onSave?: (linea: LineaDTO) => void // Para guardar cambios
    onDelete?: (id: number) => void // Para eliminar
    onShowStops?: (lineaId: number, lineaDescripcion: string) => void // Para mostrar paradas
}

export default function LineInfoPopupContainer({ 
    linea, 
    onClose, 
    onModifyRoute, 
    onSave, 
    onDelete,
    onShowStops 
}: LineInfoPopupContainerProps) {
    if (!linea) return null
    return (
        <EditLinePopup
            linea={linea}
            onClose={onClose}
            onSave={onSave ?? (() => { })}
            onModifyRoute={onModifyRoute}
            onDelete={onDelete ?? (() => { })}
            onShowStops={onShowStops}
        />
    )
}
