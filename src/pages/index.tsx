import Head from 'next/head'
import Image from 'next/image'
import { Inter } from 'next/font/google'
import styles from '@/styles/Home.module.css'
import { Comic, Directory } from '@/_types'
import { useEffect, useState } from 'react'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  const [db, setDb] = useState<Directory | null>(null)
  const [path, setPath] = useState<string[]>([])
  useEffect(function fetchDirectory() {
    fetch('/api/list')
      .then((res) => res.json())
      .then((data) => setDb(data))
      .catch((err) => console.error(err))
  })

  if (!db) {
    return <div>"Loading"</div>
  }

  function nav(file: Directory | Comic) {
    const newPath = [...path, file.name]
    if (file.type === 'comic') {
      window.location.href = `/view?file=${newPath.join('/')}`
    } else {
      setPath(newPath)
      window.history.pushState(null, '', `${window.location.pathname}#${newPath.join('/')}`)
    }
  }

  function up() {
    const newPath = [...path.slice(0, path.length - 1)]
    setPath(newPath)
    window.history.pushState(null, '', `${window.location.pathname}#${newPath.join('/')} `)
  }
  // find the object in db that matches the path
  let dir = db
  for (const p of path) {
    dir = dir.files.find((f) => f.name === p) as Directory
  }

  const upButton = path.length > 0 ? <span onClick={up}> .. </span> : null
  return (
    <>
      <Head>
        <title>Comic Books</title>
        <meta name="description" content="Comic book browser" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <h1 className={styles.title}>{upButton}{dir.name} </h1>
        <div className={styles.CardGrid}>
          {dir.files.map((file) => {
            let img = null
            if (file.type === 'comic') {
              img = <img width="200" src={`/api/thumb?dir=${[...path].join("/")}&file=${file.name}`} />
            }
            return (<div className={styles.Card} onClick={e => nav(file)}>{img}{file.name}</div>)
          })}
        </div>
      </main>
    </>
  )
}
