import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs/promises'
import path from 'path'
import { Directory } from '@/_types'
import { META_PATH } from '@/_paths'

type Data = {
    contents: Directory
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Buffer>
) {
    const root = process.env.ROOT!

    let contents = await fs.readFile(path.join(META_PATH, req.query.dir as string, req.query.file as string, "thumb.png"))
    res.setHeader('Content-Type', 'image/jpg')
    res.status(200).send(contents)
}
