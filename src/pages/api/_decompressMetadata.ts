import * as unrar from 'node-unrar-js'
import AdmZip from 'adm-zip'

type ComicMetadata = {
    numPages: number
    firstPage: Uint8Array
}

async function decompressZip(buffer: Uint8Array, type: DecompressType): Promise<ComicMetadata> {
    const zip = new AdmZip(Buffer.from(buffer))
    const zipEntries = zip.getEntries()
    console.log({ zipEntries })
    let names = []
    for (let zipEntry of zipEntries) {
        if (zipEntry.isDirectory) continue
        if (!zipEntry.entryName.toLowerCase().endsWith("jpg")) {
            console.log(zipEntry.entryName, "is not a jpg")
            continue
        }
        names.push(zipEntry.entryName)
    }
    names = names.sort()

    const firstPage = zip.readFile(names[0])
    if (!firstPage) throw new Error("Could not read first page")
    return { firstPage, numPages: names.length }
}

async function decompressRar(buffer: Uint8Array, type: DecompressType): Promise<ComicMetadata> {
    const extractor = await unrar.createExtractorFromData({ data: buffer })
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

    const first = names[0]
    const extracted = extractor.extract({ files: [first] })


    const firstPage = extracted.files.next().value.extraction
    return { firstPage, numPages: names.length }
}

export enum DecompressType {
    FIRST_PAGE = 0,
    ALL_PAGES = 1,
}
export default async function decompress(buffer: Uint8Array, type: DecompressType): Promise<ComicMetadata> {
    const text = new TextDecoder().decode(buffer.slice(0, 2))
    if (text == "PK") {
        return await decompressZip(buffer, type)
    } else {
        return await decompressRar(buffer, type)
    }
}