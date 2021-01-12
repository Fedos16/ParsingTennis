import {getData} from '../handlers/parsing_item'

export async function Parsing () {
    try {

        let data = await getData();

        return {status: true, data}
    } catch (e) {
        return {status: false, err: e}
    }
}