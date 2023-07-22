import dotenv from 'dotenv';
import express from "express";
import admin from 'firebase-admin';
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();

const sanitize = (str) => {
  if (!str) {
    return str;
  }
  return str
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

const baseMeta =
  '<meta name="description" content="Captain of Industry blueprints directory and other tools." data-rh="true"/>' +
  '<meta name="twitter:description" content="Captain of Industry blueprints directory and other tools." data-rh="true"/>' +
  '<meta property="og:description" content="Captain of Industry blueprints directory and other tools." data-rh="true"/>';

const defaultMeta = baseMeta +
  '<meta name="twitter:title" content="Captain of Industry blueprints directory and other tools." data-rh="true"/>' +
  '<meta property="og:title" content="Captain of Industry blueprints directory and other tools." data-rh="true"/>' +
  '<title data-rh="true">The CoI Pond | Captain of Industry blueprints</title>';

admin.initializeApp({
  projectId: process.env.PROJECT_ID
});

app.use(express.static(path.join(__dirname, 'public')));

// here we serve the index.html page
app.get("/*", async (req, res) => {
  const pathSplit = req.path.split('/');
  let meta;
  if (pathSplit.length !== 3 || pathSplit[1] !== 'blueprints') {
    meta = defaultMeta;
  } else {
    try {
      const doc = await admin.firestore().collection('blueprints').doc(pathSplit[2]).get();
      if (doc.exists) {
        const data = doc.data();
        const title = `The CoI Pond | ${sanitize(data.name)}`;
        meta = baseMeta +
          `<meta name="twitter:title" content="${title}" data-rh="true"/>` +
          `<meta property="og:title" content="${title}" data-rh="true"/>` +
          `<title data-rh="true">${title}</title>` +
          `<meta name="twitter:card" content="${data.screenshotUrl ? "summary_large_image" : "summary"}" data-rh="true"/>`;

        if (data.screenshotUrl) {
          meta +=
            `<meta name="twitter:image" content="${data.screenshotUrl}" data-rh="true"/>` +
            '<meta name="twitter:image:alt" content="Blueprint screenshot" data-rh="true"/>' +
            `<meta property="og:image" content="${data.screenshotUrl}" data-rh="true"/>`;
        }
      } else {
        console.warn(`no blueprint found matching ID: ${pathSplit[2]}`)
        meta = defaultMeta;
      }
    } catch (e) {
      console.error(e);
      // let the SPA handle the not found error
      meta = defaultMeta;
    }
  }
  fs.readFile("./index.html", "utf8", (err, htmlData) => {
    if (err) {
      console.error("Error during file reading", err);
      return res.status(404).end();
    }

    // inject meta tags
    htmlData = htmlData.replace("__META_TAGS__", meta);
    return res.send(htmlData);
  });
});

app.listen(process.env.PORT || 8080, '0.0.0.0', () => {
  console.log('using project ' + process.env.PROJECT_ID);
  console.log('started server');
});