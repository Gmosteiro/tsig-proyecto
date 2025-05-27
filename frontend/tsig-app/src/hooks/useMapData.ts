import { useEffect, useState } from 'react'
import { Stop } from '../lib/types/types'
// import { getStops } from '../services/api'

export default function useMapData() {
    const [stops, setStops] = useState<Stop[]>([])

    // useEffect(() => {
    //     getStops().then(setStops).catch(console.error)
    // }, [])

    return { stops }
}