export type Comic = {
    name: string
    type: "comic"
    valid: boolean
}

export type Directory = {
    name: string
    type: "directory"
    files: (Directory | Comic)[]
}
