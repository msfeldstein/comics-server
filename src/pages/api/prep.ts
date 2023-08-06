import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs/promises'
import path from 'path'
import { Directory } from '@/_types'
import { MAIN_PATH, META_PATH } from '@/_paths'
import * as unrar from 'node-unrar-js'
import sharp from 'sharp'
import fsDirect from 'fs'

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
    console.log("PREPPING", file)
    const absFilePath = path.join(MAIN_PATH, file)
    const fileContents = await fs.readFile(absFilePath)
    const extractor = await unrar.createExtractorFromData({ data: Uint8Array.from(fileContents).buffer })
    const list = extractor.getFileList()
    let names = []
    for (let fileHeader of list.fileHeaders) {
        if (fileHeader.flags.directory) continue
        names.push(fileHeader.name)
    }
    names = names.sort()
    const extracted = extractor.extract({ files: names })
    const comicMetaPath = path.join(META_PATH, file, '__PAGES__')
    if (!fsDirect.existsSync(comicMetaPath)) {
        await fs.mkdir(comicMetaPath)
        // } else {
        //     const existingFiles = await fs.readdir(comicMetaPath)
        //     res.status(200).send({ success: true, numPages: existingFiles.length })
        //     return
    }

    let extractions: any = []
    for (const extractedFile of extracted.files) {
        console.log(extractedFile)
        extractions.push(extractedFile)
    }
    extractions = extractions.sort((a: any, b: any) => {
        return a.fileHeader.name.localeCompare(b.fileHeader.name)
    })

    for (var i = 0; i < extractions.length; i++) {
        const extractedFile = extractions[i]
        await fs.writeFile(path.join(comicMetaPath, `${i}.jpg`), extractedFile.extraction!)
    }

    res.status(200).send({ success: true, numPages: extractions.length })
}
