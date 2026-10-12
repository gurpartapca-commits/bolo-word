# Bolo Punjabi for Microsoft Word

A side panel inside Word. Put your cursor in the document, press the mic, speak Punjabi (or Hindi, Urdu, English) and the words are typed straight into your document in Gurmukhi.

## What's in this folder

| File | What it is |
|---|---|
| `manifest.xml` | The file you give to Word to install the add-in |
| `taskpane.html` | The panel that opens inside Word |
| `commands.html` | Small helper file Word needs for the ribbon button |
| `index.html` | Your original Bolo web page (used as a fallback) |
| `assets/` | Icons for the ribbon button |

## Step 1 — Put the files online (free, about 10 minutes)

Word only loads add-ins from an `https://` web address. GitHub Pages is free:

1. Make a free account at github.com.
2. Click **New repository**, name it `bolo-word`, set it to **Public**, click **Create**.
3. Click **uploading an existing file** and drag in everything from this folder (including the `assets` folder). Click **Commit changes**.
4. Go to **Settings → Pages**. Under *Branch* choose `main` and `/ (root)`, then **Save**.
5. After a minute your files are at `https://gurpartapca-commits.github.io/bolo-word/`. Check that `https://gurpartapca-commits.github.io/bolo-word/taskpane.html` opens.

## Step 2 — Manifest

`manifest.xml` is already set to `https://gurpartapca-commits.github.io/bolo-word/`. Nothing to edit, as long as the repository is named exactly `bolo-word`.

## Step 3 — Add it to Word

**Word for the web (recommended — this is where speech works best)**
1. Open a document at office.com in **Chrome** or **Edge**.
2. **Home → Add-ins → More Add-ins → My Add-ins → Upload My Add-in**.
3. Choose `manifest.xml`. A **Bolo Punjabi** button appears on the Home tab.
4. The first time you press the mic, allow microphone access.

**Word on Windows**
1. Put `manifest.xml` in a folder, right-click the folder → **Properties → Sharing → Share** (share with yourself). Copy the network path, e.g. `\\YOUR-PC\addins`.
2. In Word: **File → Options → Trust Center → Trust Center Settings → Trusted Add-in Catalogs**. Paste the path, tick **Show in Menu**, **OK**, then restart Word.
3. **Home → Add-ins → More Add-ins → Shared Folder** → pick **Bolo Punjabi**.

**Word on Mac**
Copy `manifest.xml` into
`~/Library/Containers/com.microsoft.Word/Data/Documents/wef/` (create the `wef` folder if needed), restart Word, then **Home → Add-ins** → Bolo Punjabi.

## Important: where speech recognition works

The panel uses the browser's built-in speech recognition (the same as the web page).

- **Word for the web in Chrome or Edge:** expected to work.
- **Desktop Word (Windows / Mac):** Word runs add-ins in a built-in browser that often does **not** include speech recognition. If so, the panel says so and offers a button to open the Bolo web page, where you can speak and then paste into Word.

Microsoft's own **Home → Dictate** button in Word is also worth checking for your language.

## Using it

- Click in the document where the text should go, then press the mic (or Ctrl+M while the panel is focused).
- Grey text in the panel is what it's still hearing; finished phrases go into the document.
- Say the punctuation (ਡੰਡੀ → ।, ਕੌਮਾ → , , ਨਵੀਂ ਲਾਈਨ → new line…). The full list is under *Say the punctuation* in the panel.
- Pick a font for new text. **Raavi** and **Nirmala UI** come with Windows; Google fonts like Noto Sans Gurmukhi must be installed on the computer to show in Word.
