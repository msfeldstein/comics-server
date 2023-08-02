import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs/promises'


export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
) {
    const root = "/Users/michaelfeldstein/Ubooquity/Comics"
    let contents = JSON.parse(await fs.readFile(root + "/db.json"))
    res.status(200).json(contents)
}
