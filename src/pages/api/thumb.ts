import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs/promises'
import { Directory } from '@/_types'

type Data = {
    contents: Directory
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Buffer>
) {
    const root = "/Users/michaelfeldstein/Ubooquity/Comics"

    let contents = await fs.readFile(root + "/" + req.query.path)
    res.setHeader('Content-Type', 'image/jpg')
    res.status(200).send(contents)
}
