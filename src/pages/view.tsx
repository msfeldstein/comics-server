import Head from 'next/head'
import styles from '@/styles/View.module.css'
import { Comic, Directory } from '@/_types'
import { useEffect, useState } from 'react'

function Carousel({ file, numPages }: { file: string, numPages: number }) {
    return <div>{
        [...Array(numPages)].map((_, i) => {
            return <img width="200" className={styles.page} src={`/api/page?file=${file}&page=${i}`} />
        })
    }</div>
}

export default function View() {
    const [metadata, setMetadata] = useState<{ numPages: number } | null>(null)
    const [path, setPath] = useState<string[]>([])
    useEffect(function fetchDirectory() {
        const file = new URL(document.location.href).searchParams.get('file')
        fetch(`/api/prep?file=${file}`)
            .then((res) => res.json())
            .then((data) => setMetadata(data))
            .catch((err) => console.error(err))
    }, [])

    if (!metadata) {
        return <div>"Loading"</div>
    }

    const file = new URL(document.location.href).searchParams.get('file')
    if (!file)
        return <div>"No file"</div>


    return (
        <>
            <Head>
                <title>Comic Books</title>
                <meta name="description" content="Comic book browser" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <main>

                <Carousel file={file} numPages={metadata.numPages} />
            </main>
        </>
    )
}
