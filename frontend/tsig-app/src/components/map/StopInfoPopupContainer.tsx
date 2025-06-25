import React from 'react';
import { ParadaDTO } from '../../services/api';
import EditStopPopup from './EditStopPopup';
import StopInfoReadOnlyPopup from './StopInfoReadOnlyPopup';
import { useAuth } from '../../context/authContext';

interface StopInfoPopupContainerProps {
    parada: ParadaDTO | null;
    onClose: () => void;
    onMove?: (parada: ParadaDTO) => void;
    onSave?: (parada: ParadaDTO) => void;
    onDelete?: (id: number) => void;
}

const StopInfoPopupContainer: React.FC<StopInfoPopupContainerProps> = ({ 
    parada, 
    onClose, 
    onMove, 
    onSave, 
    onDelete 
}) => {
    const { isAuthenticated } = useAuth();
    
    if (!parada) return null;

    if (isAuthenticated) {
        return (
            <EditStopPopup
                parada={parada}
                onClose={onClose}
                onSave={onSave ?? (() => {})}
                onMove={onMove}
                onDelete={onDelete}
            />
        );
    } else {
        return (
            <StopInfoReadOnlyPopup
                parada={parada}
                onClose={onClose}
            />
        );
    }
};

export default StopInfoPopupContainer;