// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs/promises'
import fsDirect from 'fs'
import * as unrar from 'node-unrar-js'
import { Directory } from '@/_types'

type Data = {
  contents: Directory
}

async function recursivelyFetchFiles(path: string, name: string): Promise<Directory> {
  console.log("Recursing to directory", name)
  let files = await fs.readdir(path)
  let directory: Directory = { name, type: "directory", files: [] }
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
      let valid = true
      try {

        const fileContents = await fs.readFile(path + "/" + file)
        const extractor = await unrar.createExtractorFromData({ data: Uint8Array.from(fileContents).buffer })
        const list = extractor.getFileList()
        let names = []
        for (let fileHeader of list.fileHeaders) {
          if (fileHeader.flags.directory) continue
          names.push(fileHeader.name)
        }
        names = names.sort()
        const first = names[0]
        const extracted = extractor.extract({ files: [first] })


        const firstFile = extracted.files.next().value.extraction
        await fs.writeFile(thumbPath + "/" + file + ".jpg", firstFile)
      } catch (e) {
        valid = false
        console.error("Error unzipping", file)
      }
      directory.files.push({ type: "comic", name: file, valid })
    }
  }
  return directory
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const root = "/Users/michaelfeldstein/Ubooquity/Comics"
  let contents = await recursivelyFetchFiles(root, "~")
  await fs.writeFile(root + "/db.json", JSON.stringify(contents, null, 2))
  res.status(200).json({ contents })
}
