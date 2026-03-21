import { Writable } from "node:stream";
import { createRequire } from "node:module";
import formidable from "formidable";

const require = createRequire(import.meta.url);
const ILovePDFApi = require("@ilovepdf/ilovepdf-nodejs");
const ILovePDFFile = require("@ilovepdf/ilovepdf-nodejs/ILovePDFFile");

export const config = {
  api: {
    bodyParser: false,
  },
};

function parseMultipartForm(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const form = formidable({
      allowEmptyFiles: false,
      maxFiles: 1,
      multiples: false,
      fileWriteStreamHandler: () =>
        new Writable({
          write(chunk, _encoding, callback) {
            chunks.push(Buffer.from(chunk));
            callback();
          },
        }),
    });

    form.parse(req, (error, _fields, files) => {
      if (error) {
        reject(error);
        return;
      }

      const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;

      resolve({
        buffer: Buffer.concat(chunks),
        file: uploadedFile,
      });
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { buffer, file } = await parseMultipartForm(req);

    if (!file || !buffer.length) {
      res.status(400).json({ error: "Missing PDF file" });
      return;
    }

    const fileName = file.originalFilename ?? "document.pdf";
    const mimeType = file.mimetype ?? "application/octet-stream";

    if (mimeType !== "application/pdf" && !fileName.toLowerCase().endsWith(".pdf")) {
      res.status(400).json({ error: "Only PDF files are allowed" });
      return;
    }

    const publicKey = process.env.ILOVEPDF_PUBLIC_KEY;
    const secretKey = process.env.ILOVEPDF_SECRET_KEY;

    if (!publicKey || !secretKey) {
      throw new Error("Missing iLovePDF credentials");
    }

    const client = new ILovePDFApi(publicKey, secretKey);
    const task = client.newTask("compress");

    await task.start();
    await task.addFile(ILovePDFFile.fromArray(buffer, fileName));
    await task.process({
      compression_level: "extreme",
    });

    const compressedFile = await task.download();
    const outputBuffer = Buffer.isBuffer(compressedFile)
      ? compressedFile
      : Buffer.from(compressedFile);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.status(200).send(outputBuffer);
  } catch (error) {
    console.error("compress-pdf failed", error);
    res.status(500).json({ error: "No pudimos comprimir el PDF." });
  }
}
