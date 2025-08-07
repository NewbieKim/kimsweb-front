import { reactive, watchEffect } from "vue";
export default function createMenuTree(menuData: any, parentPath?: string ) {
  let data = menuData
  if (data.length) {
    for (let i = 0; i < data.length; i++ ) {
      if (data[i].children && data[i].children.length !==0) {
        let path = parentPath
        if (data[i].path.includes('/')) {
          console.log(data[i].path.substr(1))
          path = (path + data[i].path.substr(1) + '/')
        } else {
          path = (path + data[i].path + '/')
        }
        createMenuTree(data[i].children, path)
      } else {
        data[i].path = parentPath + data[i].path
      }
    }
  }
  console.log('da', data);
  return data
}