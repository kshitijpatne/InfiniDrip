import {readFile,writeFile} from "node:fs/promises";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";
import {chromium} from "playwright";
const {JSDOM}=createRequire(import.meta.url)("jsdom");
const matrix=JSON.parse(await readFile(new URL("./local-y-candidate-rendered/matrix.json",import.meta.url),"utf8"));
const face=matrix.cases.find(x=>x.caseId==="woven-shirt-default").faces.find(x=>x.kind==="BACK_FLAT");
const doc=new JSDOM(face.svg,{contentType:"image/svg+xml"}).window.document;
const svg=doc.documentElement;svg.setAttribute("width","2000px");svg.setAttribute("height","1500px");svg.setAttribute("viewBox","18 0 40 30");
const browser=await chromium.launch({headless:true});try{const page=await browser.newPage({viewport:{width:2000,height:1500},deviceScaleFactor:1});await page.setContent(svg.outerHTML,{waitUntil:"load"});await page.screenshot({path:fileURLToPath(new URL("./local-y-candidate-rendered/png/woven-shirt-default-back_flat-sleeve-band-closeup.png",import.meta.url)),fullPage:true});}finally{await browser.close();}