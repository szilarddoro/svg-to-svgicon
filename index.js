const fs = require('fs')
const htmlParser = require('node-html-parser')

const capitalizeWord = word =>
    `${word.charAt(0).toUpperCase()}${word.toLowerCase().slice(1)}`

const generateFile = (componentName, pathData) => `
import { SvgIcon, SvgIconProps } from '@material-ui/core';
import React from 'react';

export const ${componentName} = (props: SvgIconProps) => (
    <SvgIcon {...props}>
        <path d="${pathData}" />
    </SvgIcon>
)

export default ${componentName};
`

const outDir = process.argv[2]
const fileDirectory = process.argv[3] || outDir

fs.readdir(fileDirectory, (readdirError, files) => {
    if (!readdirError) {
        const svgFiles = files.filter(file => file.endsWith('.svg'))

        svgFiles.forEach(file => {
            fs.readFile(`${fileDirectory}/${file}`, (readFileError, data) => {
                const componentName = file
                    .split(/[, \-!?:]+/)
                    .map(namePart =>
                        capitalizeWord(namePart.replace('.svg', ''))
                    )
                    .join('')

                if (!readFileError) {
                    const svgData = htmlParser.parse(data.toString())

                    // Get only the very first path
                    const { rawAttrs } = svgData.childNodes.reduce(
                        (accumulator, data) =>
                            !accumulator
                                ? data.childNodes.find(
                                      node => node.tagName === 'path'
                                  )
                                : accumulator,
                        null
                    )

                    const pathData = rawAttrs
                        .split('" ')
                        .filter(attr => attr.startsWith('d="'))
                        .map(data => data.replace('d="', ''))[0]

                    fs.mkdir(`${outDir}/${componentName}`, mkdirError => {
                        if (!mkdirError) {
                            fs.writeFile(
                                `${outDir}/${componentName}/index.tsx`,
                                Buffer.from(
                                    generateFile(componentName, pathData)
                                ),
                                writeFileError => {
                                    if (!writeFileError) {
                                        console.log(
                                            `Successfully generated <${componentName} /> component.`
                                        )
                                    } else {
                                        console.error(writeFileError.message)
                                    }
                                }
                            )
                        } else {
                            console.error(mkdirError.message)
                        }
                    })
                } else {
                    console.error(readFileError.message)
                }
            })
        })
    } else {
        console.error(readdirError.message)
    }
})
