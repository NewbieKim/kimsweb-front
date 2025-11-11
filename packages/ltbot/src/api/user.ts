import { httpPost } from '@/utils/http'

const LOCALURL = 'http://localhost:3000/'
// const LOCALURL = 'http://120.79.113.248:3000/'
export const userApi = {
  login: LOCALURL + 'users/login',
  loginOut: LOCALURL + 'users/loginOut',
  register: LOCALURL + 'users/register',
  getRoleList: LOCALURL + 'role/getRoleList'
}

export const login = (params = {}) => {
  return httpPost({ url: userApi.login, params })
}

// 定义函数、接口、类的时候可以动态指定类型，优点：类型安全、代码复用、灵活性
// 泛型函数
function map<T, U>(arr: T[], fn: (item: T) => U): U[] {
  return arr.map(fn);
}

let numbers = [1, 2, 3];
let doubled = map(numbers, (n) => n * 2); // 输出: [2, 4, 6]

interface Printable {
  print(): void;
}

interface Loggable {
  log(): void;
}

function process<T extends Printable & Loggable>(item: T): void {
  item.print();
  item.log();
}

class Document implements Printable, Loggable {
  print(): void {
    console.log("Printing document...");
  }

  log(): void {
    console.log("Logging document...");
  }
}

let doc = new Document();
process(doc);

export default userApi