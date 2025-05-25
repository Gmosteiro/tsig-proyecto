// import axios from 'axios'
import { Stop } from '../lib/types/types'
// import { API_URL } from '../lib/contants'

export async function getStops(): Promise<Stop[]> {
    // const res = await axios.get(`${API_URL}/stops`)

    let promise = Promise.resolve({
        data: []
    })
    const result = await promise
    return result.data
}