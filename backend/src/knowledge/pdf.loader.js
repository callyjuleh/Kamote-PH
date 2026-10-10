'use strict';

const fs = require('fs');
const { pathToFileURL } = require('url');

const MIN_TEXT_CHARS = 40;

let pdfjsPromise;

function loadPdfJs() {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const mod = await import(
        pathToFileURL(require.resolve('pdfjs-dist/legacy/build/pdf.mjs')).href
      );
      mod.GlobalWorkerOptions.workerSrc = pathToFileURL(
        require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')
      ).href;
      return mod;
    })();
  }
  return pdfjsPromise;
}

async function extractPdf(filePath) {
  const pdfjs = await loadPdfJs();
  const data = new Uint8Array(fs.readFileSync(filePath));
  const task = pdfjs.getDocument({ data });
  const doc = await task.promise;

  try {
    const pages = [];
    let textLayerChars = 0;

    for (let i = 1; i <= doc.numPages; i += 1) {
      const page = await doc.getPage(i);
      const textContent = await page.getTextContent();
      const text = textContent.items
        .map((item) => item.str || '')
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      let imageCount = 0;
      try {
        const ops = await page.getOperatorList();
        imageCount = ops.fnArray.filter(
          (f) => f === pdfjs.OPS.paintImageXObject
        ).length;
      } catch {
        imageCount = -1;
      }

      textLayerChars += text.length;
      pages.push({
        number: i,
        text,
        charCount: text.length,
        imageCount,
      });
    }

    const pagesNeedingOcr = pages
      .filter((p) => p.charCount < MIN_TEXT_CHARS)
      .map((p) => p.number);

    return {
      numPages: doc.numPages,
      textLayerChars,
      hasTextLayer: textLayerChars > 0,
      pagesNeedingOcr,
      pages,
    };
  } finally {
    try {
      await task.destroy();
    } catch {
      // no-op
    }
  }
}

module.exports = { extractPdf, MIN_TEXT_CHARS };