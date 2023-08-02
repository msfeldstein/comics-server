// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs/promises'
import fsDirect from 'fs'
import AdmZip from 'adm-zip';
import * as zip from "@zip.js/zip.js";
import * as unrar from 'node-unrar-js'
import { Readable } from 'stream';
type Data = {
  contents: Directory
}

type Directory = {
  name: string
  files: (Directory | string)[]
}

async function recursivelyFetchFiles(path: string, name: string): Promise<Directory> {
  console.log("Recursing to directory", name)
  let files = await fs.readdir(path)
  let directory: Directory = { files: [], name }
  const thumbPath = path + "/" + "__THUMBS__"
  if (!fsDirect.existsSync(thumbPath)) {
    await fs.mkdir(thumbPath)
  }
  for (let file of files) {
    let stat = await fs.stat(path + "/" + file)
    if (stat.isDirectory() && file !== "__THUMBS__") {
      directory.files.push(await recursivelyFetchFiles(path + "/" + file, file))
    } else if (file.endsWith(".cbz") || file.endsWith(".cbr")) {
      console.log("handling file", file)
      directory.files.push(file)
      try {

        const fileContents = await fs.readFile(path + "/" + file)
        const extractor = await unrar.createExtractorFromData({ data: Uint8Array.from(fileContents).buffer })
        const list = extractor.getFileList()
        const first = [...list.fileHeaders][0]
        const extracted = extractor.extract({ files: [first.name] })


        const firstFile = extracted.files.next().value.extraction
        await fs.writeFile(thumbPath + "/" + file + ".jpg", firstFile)
      } catch (e) {

        console.error("Error unzipping", e, file)
      }
    }
  }
  return directory
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  let contents = await recursivelyFetchFiles("/Users/michaelfeldstein/Ubooquity/Comics", "root")

  res.status(200).json({ contents })
}
