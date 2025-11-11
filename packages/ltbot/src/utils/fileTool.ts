// 解析数组
export function fileDataArrayTransformJson (fileList: Array<any>) {
  console.log(fileList)
  if (fileList && fileList.length > 0) {
    let obj = { length: fileList.length, data: [{name: '', url: ''}]}
    for (let i = 0; i < fileList.length; i++) {
      const element = fileList[i]
      obj.data.push({ name: element.name, url: element.url ? element.url : element.raw.imageURL })
    }
    obj.data.shift()
    return JSON.stringify(obj)
  }
}
export function fileDataJsonTransArray (files: string) {
  let fileList = []
  fileList = JSON.parse(files)
  return fileList
}
