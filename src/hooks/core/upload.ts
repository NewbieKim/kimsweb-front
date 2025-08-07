import axios from "axios";
const request = axios.create({
  baseUrl: 'http://localhost:3000/thirdService',
  timeout: 5000
})
export function upload({ url, file, fileName = 'file'}) {
  let formData = new FormData()
  formData.set(fileName, file)
  axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
  axios.post(url, formData, {
    // 监听上传进度
    onUploadProgress: (progressEvent: any) => {
      //
    }
  })
}