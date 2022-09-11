const fs = require('fs');
const htmlParser = require('node-html-parser');

const capitalizeWord = (word) =>
  `${word.charAt(0).toUpperCase()}${word.toLowerCase().slice(1)}`;

const generateFile = (
  componentName,
  pathData,
) => `import { SvgIcon, SvgIconProps } from '@material-ui/core';
import React from 'react';

export const ${componentName} = (props: SvgIconProps) => (
    <SvgIcon {...props}>
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="${pathData}"
        />
    </SvgIcon>
);

export default ${componentName};
`;

let exportStatements = [];

const outDir = process.argv[2];
const fileDirectory = process.argv[3] || outDir;

fs.readdir(fileDirectory, async (readdirError, files) => {
  if (!readdirError) {
    const svgFiles = files.filter((file) => file.endsWith('.svg'));

    svgFiles.forEach((file, index, array) => {
      fs.readFile(`${fileDirectory}/${file}`, (readFileError, data) => {
        const componentName = file
          .split(/[, \-!?:]+/)
          .map((namePart) => capitalizeWord(namePart.replace('.svg', '')))
          .concat('Icon')
          .join('');

        if (!readFileError) {
          const svgData = htmlParser.parse(data.toString());

          // Get only the very first path
          const { rawAttrs } = svgData.childNodes.reduce(
            (accumulator, mainNode) =>
              accumulator ||
              mainNode.childNodes.find((node) => node.tagName === 'path'),
            null,
          );

          const pathData = rawAttrs
            .split('" ')
            .filter((attr) => attr.startsWith('d="'))
            .map((data) => data.replace('d="', ''))[0];

          fs.mkdir(`${outDir}/${componentName}`, (mkdirError) => {
            if (!mkdirError) {
              fs.writeFile(
                `${outDir}/${componentName}/index.tsx`,
                Buffer.from(generateFile(componentName, pathData)),
                (writeFileError) => {
                  if (!writeFileError) {
                    console.log(
                      `Successfully generated <${componentName} /> component.`,
                    );

                    exportStatements = exportStatements.concat(
                      `export * from './${componentName}'`,
                    );

                    if (index === array.length - 1) {
                      const exportFileContent = exportStatements
                        .sort()
                        .join('\r\n');

                      if (exportFileContent) {
                        fs.writeFile(
                          `${outDir}/index.ts`,
                          Buffer.from(exportFileContent),
                          (writeExportsError) => {
                            if (!writeExportsError) {
                              console.log(
                                'Successfully generated file with export statements.',
                              );
                            } else {
                              console.error(writeExportsError.message);
                            }
                          },
                        );
                      }
                    }
                  } else {
                    console.error(writeFileError.message);
                  }
                },
              );
            } else {
              console.error(mkdirError.message);
            }
          });
        } else {
          console.error(readFileError.message);
        }
      });
    });
  } else {
    console.error(readdirError.message);
  }
});
