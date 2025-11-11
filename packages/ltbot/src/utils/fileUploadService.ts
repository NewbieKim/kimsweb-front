/*
des: 文件上传请求三方服务/后台服务接口；
*/
import { uploadBySingle } from "@/api/thirdService";
import axios from "axios";
export default async function uploadFile (params: any) {
  // 参数初始化为FormData格式
  let form = new FormData()
  const reqData = Object.assign({
    file: params.file,
    fileName: params.file.name
  })
  // eslint-disable-next-line guard-for-in
  for (let i in reqData ) {
    form.append(i, reqData[i])
  }
  // axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
  // return await axios.post('http://localhost:3000/thirdService/uploadSingle', form, {
  //   headers: {
  //     'Content-Type': 'application/x-www-form-urlencoded'
  //   }
  // })
  // return axios({
  //     url: 'http://localhost:3000/thirdService/uploadSingle',
  //     method: 'post',
  //     headers: {
  //       // 'Content-Type': 'application/x-www-form-urlencoded'
  //     },
  //     // 发送的数据
  //     data: {file: params.file, fileName: params.file.name}
  //   })
  // return await uploadBySingle(form)
  return {result: '1', name: 'food2.jpeg', url: 'https://fuss10.elemecdn.com/3/63/4e7f3a15429bfda99bce42a18cdd1jpeg.jpeg?imageMogr2/thumbnail/360x360/format/webp/quality/100' }
}
