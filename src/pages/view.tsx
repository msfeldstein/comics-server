import Head from 'next/head'
import styles from '@/styles/View.module.css'
import { useEffect, useState } from 'react'
import { useRef } from 'react'
import { useSpring, animated } from '@react-spring/web'
import { useDrag, useGesture } from '@use-gesture/react'

function clamp(num: number, min: number, max: number) {
    return num <= min ? min : num >= max ? max : num
}

function Page({ file, index, x, label }: { file: string, index: number, x: number, label: string }) {
    return <div className={styles.carouselItem} style={{ left: x }} key={index}>
        <img className={styles.carouselItemImage} src={`/api/page?file=${file}&page=${index}`} />
        <div className={styles.carouselItemOverlay}> {label} {index}</div>
    </div>
}

function currentPageKey(file: string) {
    return `currentPage:${file}`
}

function Carousel({ file, numPages }: { file: string, numPages: number }) {
    const savedPage = localStorage.getItem(currentPageKey(file))
    const [index, setIndex] = useState(savedPage ? parseInt(savedPage) : 0)
    useEffect(() => {
        localStorage.setItem(currentPageKey(file), index.toString())
    }, [index])
    const swipeIndex = useRef(0)
    const resetOnNextRender = useRef(false)
    const isAnimating = useRef(false)
    const width = window.innerWidth

    const [props, api] = useSpring(() => ({
        x: 0,
        config: {
            tension: 210,
            bounce: 0,
            friction: 20,
            clamp: true,
            immediate: true,
        },
        onRest: () => {
            isAnimating.current = false
        }
    }))

    const bind = useGesture({

        onDrag: ({ active, movement: [mx], direction: [xDir], cancel }) => {
            isAnimating.current = true
            if (active && Math.abs(mx) > width / 5) {
                // swipeIndex.current = clamp(swipeIndex.current + (xDir > 0 ? -1 : 1), -1, 1)
                // In order to allow rapid paging, set the index here and offset the animation to animate back to center
                // rather than waiting for the animation to finish before setting up the next page
                if (xDir > 0) {
                    api.start((value) => { return { from: { x: value - width }, to: { x: 0 } } })
                    setIndex((index) => Math.max(index - 1, 0))
                } else {
                    api.start((value) => { return { from: { x: value + width }, to: { x: 0 } } })
                    setIndex((index) => Math.min(index + 1, numPages - 1))
                }
                cancel()
            } else {
                api.start(i => {
                    const x = (i - swipeIndex.current) * width + (active ? mx : 0)
                    const scale = active ? 1 - Math.abs(mx) / width / 2 : 1
                    return { x, scale, display: 'block' }
                })
            }
        },
        onClick: ({ event }) => {
            if (isAnimating.current) return
            if (event.screenX < width / 2) {
                setIndex((index) => Math.max(index - 1, 0))
            } else if (event.screenX > width / 2) {
                setIndex((index) => Math.min(index + 1, numPages - 1))
            }
        }
    }, {
        drag: {
            preventScroll: true,
            threshold: 10,
            pointer: {
                touch: true
            },
        }
    })

    const left = index > 0 ? Page({ file, index: index - 1, x: -width, label: "LEFT" }) : null
    const center = Page({ file, index, x: 0, label: "CENTER" })
    const right = index < numPages - 1 ? Page({ file, index: index + 1, x: width, label: "RIGHT" }) : null

    return (
        <animated.div className={styles.carousel} {...bind()} style={props} onDragStart={e => e.preventDefault()}>
            {[left, center, right]}
        </animated.div>
    )
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
            <main className={styles.main}>
                <Carousel file={file} numPages={metadata.numPages} />
            </main>
        </>
    )
}
