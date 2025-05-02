import { randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "webroot/uploads");
const STATIC_DIR = path.join(process.cwd(), "webroot/static");
const MAX_FILE_SIZE = 300 * 1024 * 1024; // 300 MB
const SERVER_PORT = 3000; // change to your own port
const SITE_URL = "http://127.0.0.1"; // change to your own url
const TLS_KEY = ""; // change to your own tls key
const TLS_CERT = ""; // change to your own tls cert
const HOSTNAME = "127.0.0.1" // change to 0.0.0.0 to serve publicly
await fs.mkdir(UPLOAD_DIR, { recursive: true });

const generateRandomFilename = () => {
  const currentTime = new Date();
  const year = currentTime.getFullYear();
  const month = String(currentTime.getMonth() + 1).padStart(2, '0');
  const day = String(currentTime.getDate()).padStart(2, '0');
  const hour = String(currentTime.getHours()).padStart(2, '0');
  const minute = String(currentTime.getMinutes()).padStart(2, '0');

  const formattedTime = `${year}-${month}-${day}-${hour}-${minute}`;

  return `${formattedTime}-${randomBytes(4).toString("hex")}`;
};

Bun.serve({
	port: SERVER_PORT, // set your own port
	hostname: HOSTNAME,
	maxRequestBodySize: MAX_FILE_SIZE,

  async fetch(req) {
    const url = new URL(req.url);
    if (req.method === "GET" && url.pathname === "/") {
      return new Response(Bun.file("webroot/index.html"), {
        headers: { "Content-Type": "text/html" },
      });
    }
    if (req.method === "POST" && url.pathname === "/u") {
      return handleFileUpload(req);
    }
    if (req.method === "GET" && url.pathname.startsWith("/uploads")) {
      return serveUploadedFile(req);
    }
    if (req.method === "GET" && url.pathname.startsWith("/static")) {
      return serveStaticFile(req);
    }
    return new Response("Not Found", { status: 404 });
  },
});

async function handleFileUpload(req: Request) {
  console.log("Received file upload request");
  const formData = await req.formData();
  console.log("Form data fields:", Array.from(formData.keys()));
  const files = formData.getAll("files");
  console.log("Number of files:", files.length);
  const allowedExtensions = [
    ".jpeg",
    ".jpg",
    ".png",
    ".gif",
    ".mp4",
    ".m4v",
    ".webm",
    ".webp",
    ".mp3",
    ".ogg",
    ".wav",
    ".txt",
    ".pdf",
  ]; // change extensions as you wish

  if (!files.length) {
    console.log("No files found in request");
    return new Response(JSON.stringify({ error: "No files uploaded." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (files.length > 5) {
    console.log("Too many files:", files.length);
    return new Response(JSON.stringify({ error: "Too many files. limit: 5" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const urls = [];

  for (const file of files) {
    if (!(file instanceof File)) {
      console.log("Invalid file object:", file);
      continue;
    }

    console.log("Processing file:", file.name, "Size:", file.size, "bytes");
    if (file.size > MAX_FILE_SIZE) {
      console.log("File too large:", file.name, file.size);
      return new Response(
        JSON.stringify({
          error: `File ${file.name} exceeds the maximum size of 300 MB.`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const extension = path.extname(file.name);
    console.log("File extension:", extension);
    if (!allowedExtensions.includes(extension)) {
      console.log("Invalid extension:", extension);
      return new Response(
        JSON.stringify({ error: "Cannot upload file. Extension not allowed." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const randomFilename = generateRandomFilename() + extension;
    const filePath = path.join(UPLOAD_DIR, randomFilename);
    await Bun.write(filePath, await file.arrayBuffer());

    const fileUrl = `${SITE_URL}:${SERVER_PORT}/uploads/${randomFilename}`; // will be returned by the html form
    urls.push(fileUrl);
  }
  return new Response(JSON.stringify({ urls }), {
    headers: { "Content-Type": "application/json" },
  });
}

async function serveUploadedFile(req: Request) {
  const filePath = path.join(UPLOAD_DIR, req.url.split("/uploads/")[1]);
  try {
    const file = Bun.file(filePath);
    return new Response(file);
  } catch (error) {
    return new Response("File not found.", { status: 404 });
  }
}

async function serveStaticFile(req: Request) {
  const filePath = path.join(STATIC_DIR, req.url.split("/static/")[1]);
  try {
    const file = Bun.file(filePath);
    return new Response(file);
  } catch (error) {
    return new Response("File not found.", { status: 404 });
  }
}
