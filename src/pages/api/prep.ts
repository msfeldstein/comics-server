import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs/promises'
import path from 'path'
import { Directory } from '@/_types'
import { MAIN_PATH, META_PATH } from '@/_paths'
import * as unrar from 'node-unrar-js'
import sharp from 'sharp'
import fsDirect from 'fs'
import { Archive } from './_archive'

type Data = {
    success: boolean
    numPages: number
}

/// Prep a file to be viewed
/// Currently it just extracts all the pages of a comic into the __PAGES__ metadata directory
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
) {
    const file = req.query.file as string

    const comicMetaPath = path.join(META_PATH, file, '__PAGES__')
    if (!fsDirect.existsSync(comicMetaPath)) {
        await fs.mkdir(comicMetaPath)
    } else {
        const existingFiles = await fs.readdir(comicMetaPath)
        res.status(200).send({ success: true, numPages: existingFiles.length })
        return
    }

    console.log("PREPPING", file)
    const absFilePath = path.join(MAIN_PATH, file)
    const fileContents = await fs.readFile(absFilePath)
    const archive = await Archive.init(Uint8Array.from(fileContents))
    let names = archive.getFilenames()
    const extracted = archive.extractFiles(names)

    for (var i = 0; i < extracted.length; i++) {
        const extractedFile = extracted[i]
        await fs.writeFile(path.join(comicMetaPath, `${i}.jpg`), extractedFile)
    }

    res.status(200).send({ success: true, numPages: extracted.length })
}
