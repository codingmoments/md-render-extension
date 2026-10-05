const pathInput = document.getElementById("path");
const output = document.getElementById("output");
const error = document.getElementById("error");

// Turn "D:\docs\a.md" or "/home/me/a.md" into a file:/// URL.
function toFileUrl(path) {
  if (path.startsWith("file://")) return path;
  const normalized = path.replace(/\\/g, "/").replace(/^\/+/, "");
  return "file:///" + normalized.split("/").map(encodeURIComponent).join("/").replace(/^([A-Za-z])%3A/, "$1:");
}

// fetch() does not support file:// URLs; XHR does when file access is allowed.
function readFile(url, responseType = "text") {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.responseType = responseType;
    const fail = () => reject(new Error(
      "Cannot read the file. Check the path, and enable 'Allow access to file URLs' for this extension in chrome://extensions."
    ));
    // file:// reports status 0 on success; anything >= 400 is a failure.
    xhr.onload = () => (xhr.status >= 400 ? fail() : resolve(xhr.response));
    xhr.onerror = fail;
    xhr.send();
  });
}

// A picked file's full path is hidden, so keep its handle instead. Unlike an
// <input type="file"> File (a snapshot that fails once the file changes),
// handle.getFile() returns the current contents on every call.
let pickedHandle = null;

let imageUrls = [];

// Relative image paths would resolve against the extension, not the markdown
// file. Resolve them against the file's own URL and load them as blobs.
// Without a baseUrl (a picked file), the folder is unknown, so they stay broken.
function loadRelativeImages(fragment, baseUrl) {
  imageUrls.forEach(URL.revokeObjectURL);
  imageUrls = [];
  fragment.querySelectorAll("img[src]").forEach((img) => {
    const src = img.getAttribute("src");
    if (!baseUrl || /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(src)) return; // absolute URL
    img.removeAttribute("src");
    readFile(new URL(src, baseUrl).href, "blob").then((blob) => {
      const url = URL.createObjectURL(blob);
      imageUrls.push(url);
      img.src = url;
    }, () => { img.alt = `[image not found: ${src}]`; });
  });
}

// DOMPurify's defaults already drop scripts, event handlers and iframes. Also drop
// forms and styles; <input> stays allowed for GFM task-list checkboxes.
const PURIFY_OPTIONS = { FORBID_TAGS: ["form", "button", "textarea", "select", "style"] };

async function show(name, loadText, baseUrl) {
  error.hidden = true;
  try {
    // Parse into a template first so images don't start loading from wrong URLs.
    // Raw HTML in the markdown passes through marked untouched, so sanitize it.
    const template = document.createElement("template");
    template.innerHTML = DOMPurify.sanitize(marked.parse(await loadText()), PURIFY_OPTIONS);
    loadRelativeImages(template.content, baseUrl);
    output.replaceChildren(template.content);
    // Untagged blocks get their language auto-detected.
    output.querySelectorAll("pre code").forEach((el) => hljs.highlightElement(el));
    buildToc();
    document.title = name;
  } catch (e) {
    output.innerHTML = "";
    buildToc();
    error.textContent = e.message;
    error.hidden = false;
  }
}

function render() {
  const path = pathInput.value.trim().replace(/^"|"$/g, "");
  if (!path) return;
  if (pickedHandle && path === pickedHandle.name) {
    return show(pickedHandle.name, async () => (await pickedHandle.getFile()).text());
  }
  pickedHandle = null;
  const url = toFileUrl(path);
  return show(path.split(/[\\/]/).pop(), () => readFile(url), url);
}

const menu = document.getElementById("menu");
const toc = document.getElementById("toc");

function setTocOpen(open) {
  toc.hidden = !open;
  menu.setAttribute("aria-expanded", String(open));
}

// Build a nested outline from the rendered headings. marked adds no heading
// ids, so give each one a unique id to scroll to.
function buildToc() {
  const headings = output.querySelectorAll("h1, h2, h3, h4, h5, h6");
  const root = document.createElement("ul");
  const stack = [{ level: 0, list: root }];
  const used = new Set();

  headings.forEach((h) => {
    const base = h.textContent.trim().toLowerCase().replace(/[^\w]+/g, "-").replace(/^-|-$/g, "") || "section";
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    h.id = id;

    const level = Number(h.tagName[1]);
    while (stack.length > 1 && stack[stack.length - 1].level >= level) stack.pop();
    // A skipped level (h1 -> h3) simply nests under the nearest shallower heading.
    const parent = stack[stack.length - 1];

    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = `#${id}`;
    link.textContent = h.textContent;
    link.dataset.target = id;
    item.appendChild(link);
    parent.list.appendChild(item);

    const children = document.createElement("ul");
    item.appendChild(children);
    stack.push({ level, list: children });
  });

  root.querySelectorAll("ul:empty").forEach((ul) => ul.remove());
  toc.replaceChildren(headings.length ? root : "");
  menu.disabled = !headings.length;
  setTocOpen(false);
}

menu.addEventListener("click", (e) => {
  e.stopPropagation();
  setTocOpen(toc.hidden);
});
toc.addEventListener("click", (e) => {
  const link = e.target.closest("a[data-target]");
  if (!link) return;
  e.preventDefault();
  document.getElementById(link.dataset.target).scrollIntoView({ behavior: "smooth", block: "start" });
  setTocOpen(false);
});
document.addEventListener("click", (e) => {
  if (!toc.hidden && !toc.contains(e.target)) setTocOpen(false);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") setTocOpen(false);
});

document.getElementById("browse").addEventListener("click", async () => {
  try {
    [pickedHandle] = await window.showOpenFilePicker({
      types: [{ description: "Markdown", accept: { "text/markdown": [".md", ".markdown", ".mdown", ".txt"] } }],
    });
  } catch (e) {
    if (e.name === "AbortError") return; // dialog cancelled
    throw e;
  }
  pathInput.value = pickedHandle.name;
  render();
});

document.getElementById("render").addEventListener("click", render);
pathInput.addEventListener("keydown", (e) => { if (e.key === "Enter") render(); });
