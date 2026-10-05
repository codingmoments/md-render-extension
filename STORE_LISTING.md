# Chrome Web Store listing — draft texts

Copy each section into the matching field of the Developer Dashboard.

## Single purpose

Markdown Renderer opens a local markdown (.md) file and displays it as formatted, readable text, with code highlighting and a heading outline.

## Permission justification — `file:///*` (host permission)

The extension's only job is to display markdown files stored on the user's own computer. When the user types a file path, the extension reads that one file through its file:// URL, and also reads any images the file references by a relative path (for example `images/diagram.png` next to the .md file). It reads only the files the user asks for, only when the user clicks Render, and never modifies or uploads them. Reading file:// URLs requires this host permission, and the user must still turn on "Allow access to file URLs" for the extension.

## Privacy practices — data usage

- Collected data: **none** (leave every data-type checkbox unticked).
- Certify all three statements:
  - I do not sell or transfer user data to third parties, outside of the approved use cases.
  - I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
  - I do not use or transfer user data to determine creditworthiness or for lending purposes.

## Privacy policy

Markdown Renderer does not collect, store, or transmit any personal or usage data.

- Files are read only when you choose them, only on your device, and only to display them in the extension's tab. Their contents are never saved, logged, or sent anywhere.
- The extension stores no settings or history, uses no analytics or tracking, and has no server.
- If a markdown file contains images with a web address (for example `https://example.com/logo.png`), your browser loads those images from that website, as it would for any web page. The extension sends nothing else to that website.

Questions: nileshwaani@gmail.com
