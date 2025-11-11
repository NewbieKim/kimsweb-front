
import mergeImages from 'merge-images';
import { saveAs } from "file-saver";
// export function saveAs(url: string, filename: string) {
//   const a = document.createElement('a')
//   a.download = filename
//   // 如何是同源文件下的url 直接 a.download a.click即可下载
//   let blob = new Blob([url], {
//     type: 'image/png'
//   })
//   let blobUrl = window.URL.createObjectURL(blob)
//   a.href = blobUrl
//   console.log('blob', blobUrl)
//   a.click()
//   window.URL.revokeObjectURL(a.href)
// }

export async function mergeImage(images: any) {
  let url = await mergeImages(images)
  return url
}

// base64 buffer -> blob
export function dataUrlToBlob(base64, mimeType) {
  let bytes = window.atob(base64.split(",")[1]);
  let ab = new ArrayBuffer(bytes.length);
  let ia = new Uint8Array(ab);
  for (let i = 0; i < bytes.length; i++) {
    ia[i] = bytes.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeType });
}

// showSaveFilePicker API下载
export async function saveFile(blob: any, filename: string) {
  try {
    // 调用window.showSaveFilePicker方法来读取目录
    const handle = await window.showSaveFilePicker({
      suggestedName: filename,
      types: [
        {
          description: "PNG file",
          accept: {
            "image/png": [".png"],
          },
        },
        {
          description: "Jpeg file",
          accept: {
            "image/jpeg": [".jpeg"],
          },
         },
      ],
     });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return handle;
  } catch (err) {
     console.error(err.name, err.message);
  }
}

// FileSaver
// FileSaver saveAs(
//   Blob/File/Url,
//   optional DOMString filename,
//   optional Object { autoBom }
// )
