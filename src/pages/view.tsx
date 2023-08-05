import Head from 'next/head'
import styles from '@/styles/View.module.css'
import { useEffect, useState } from 'react'
import { useRef } from 'react'
import { useSpring, animated } from '@react-spring/web'
import { useDrag, useGesture } from '@use-gesture/react'

function clamp(num: number, min: number, max: number) {
    return num <= min ? min : num >= max ? max : num
}

function Page({ file, index, x }: { file: string, index: number, x: number }) {
    return <div className={styles.carouselItem} style={{ left: x }} key={index}>
        <img className={styles.carouselItemImage} src={`/api/page?file=${file}&page=${index}`} />
        <div className={styles.carouselItemOverlay}>{index}</div>
    </div>
}

function Carousel({ file, numPages }: { file: string, numPages: number }) {
    const [index, setIndex] = useState(1)
    const swipeIndex = useRef(0)
    const isAnimating = useRef(false)
    const width = window.innerWidth

    const [props, api] = useSpring(() => ({
        x: 0,
        config: {
            tension: 500,
            bounce: 0,
            friction: 50,
            clamp: true,
        },
        onStart: () => {
            isAnimating.current = true
        },
        onRest: (result) => {
            isAnimating.current = false
            // We have to post this task so we don't see a flicker by imperatively setting x to 0 before react re-renders
            setTimeout(() => api.set({ x: 0 }), 1)
            swipeIndex.current = 0
            if (result.value.x < 0) {
                setIndex((index) => Math.min(index + 1, numPages - 1))
            }
            if (result.value.x > 0) {
                setIndex((index) => Math.max(index - 1, 0))
            }
        },
    }))
    const bind = useGesture({
        onDrag: ({ event, active, movement: [mx], direction: [xDir], cancel }) => {
            if (active && Math.abs(mx) > width / 2) {
                swipeIndex.current = clamp(swipeIndex.current + (xDir > 0 ? -1 : 1), -1, 1)
                cancel()
            }
            api.start(i => {
                const x = (i - swipeIndex.current) * width + (active ? mx : 0)
                const scale = active ? 1 - Math.abs(mx) / width / 2 : 1
                return { x, scale, display: 'block' }
            })
            event.stopPropagation()
        },
        onClick: ({ event, ...sharedState }) => {
            // if (isAnimating.current) return

            // if (event.screenX < width / 2) {
            //     setIndex((index) => Math.max(index - 1, 0))
            // } else if (event.screenX > width / 2) {
            //     setIndex((index) => Math.min(index + 1, numPages - 1))
            // }
        }
    })

    const left = index > 0 ? Page({ file, index: index - 1, x: -width }) : null
    const center = Page({ file, index, x: 0 })
    const right = index < numPages - 1 ? Page({ file, index: index + 1, x: width }) : null

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
