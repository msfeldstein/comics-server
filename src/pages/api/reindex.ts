// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs/promises'
import fsDirect from 'fs'
import path from 'path'
import * as unrar from 'node-unrar-js'
import sharp from 'sharp'
import { Directory } from '@/_types'
import { MAIN_PATH, META_PATH } from '@/_paths'

type Data = {
  contents: Directory
}

const mainRoot = MAIN_PATH
const metaRoot = META_PATH

async function recursivelyFetchFiles(curPath: string, name: string): Promise<Directory> {
  const absPath = path.join(mainRoot, curPath)
  console.log("Recursing to directory", absPath)
  let files = await fs.readdir(absPath)
  let directory: Directory = { name, type: "directory", files: [] }
  const thumbsPath = path.join(metaRoot, curPath)
  if (!fsDirect.existsSync(thumbsPath)) {
    await fs.mkdir(thumbsPath)
  }
  for (let file of files) {
    const filePath = path.join(curPath, file)
    const absFilePath = path.join(mainRoot, filePath)
    let stat = await fs.stat(absFilePath)
    if (stat.isDirectory() && !file.startsWith("__")) {
      directory.files.push(await recursivelyFetchFiles(filePath, file))
    } else if (file.toLowerCase().endsWith(".cbz") || file.toLocaleLowerCase().endsWith(".cbr")) {
      console.log("handling file", file)
      let valid = true
      let numPages = 0
      try {

        const fileContents = await fs.readFile(absFilePath)
        const extractor = await unrar.createExtractorFromData({ data: Uint8Array.from(fileContents).buffer })
        const list = extractor.getFileList()
        let names = []
        for (let fileHeader of list.fileHeaders) {
          if (fileHeader.flags.directory) continue
          if (!fileHeader.name.toLowerCase().endsWith("jpg")) {
            console.log(fileHeader.name, "is not a jpg")
            continue
          }
          names.push(fileHeader.name)
        }
        names = names.sort()
        numPages = names.length
        const first = names[0]
        const extracted = extractor.extract({ files: [first] })


        const firstFile = extracted.files.next().value.extraction

        // Write out the full size image and a thumbnail
        const comicMetaPath = path.join(thumbsPath, file)
        if (!fsDirect.existsSync(comicMetaPath)) {
          await fs.mkdir(comicMetaPath)
        }
        await fs.writeFile(path.join(comicMetaPath, "fullsize.jpg"), firstFile)
        await sharp(firstFile).resize(320).toFile(path.join(comicMetaPath, "thumb.png"))

      } catch (e) {
        valid = false
        console.error("Error unzipping", e, file)
      }
      directory.files.push({ type: "comic", name: file, valid, numPages })
    }
  }
  return directory
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  let contents = await recursivelyFetchFiles("", "~")
  await fs.writeFile(process.env.ROOT! + "/db.json", JSON.stringify(contents, null, 2))
  res.status(200).json({ contents })
}
