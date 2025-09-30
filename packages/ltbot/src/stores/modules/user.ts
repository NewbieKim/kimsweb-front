import { defineStore } from 'pinia'
import { store } from '../../store'
import { LoginRoute } from '../../router/routers';
// import { menu } from '../../router/menu';
import axios from 'axios';
import { userApi, login } from '../../api/user'
import { Md5 } from 'ts-md5';
import { RoleEnum } from '../../enums/roleEnum';
import { router } from '@/router';
import { useTagsStore } from '@/store/modules/tags'
// 引入cookies
import { getToken, getUserId, getRoleId, setToken, setUserId, setRoleId, removeToken, removeUserId, removeRoleId } from '@/utils/cookies'
interface IUserState {
  userInfo: string,
  userId: string,
  token: string,
  roleId: string,
  roleList: RoleEnum[]
}

export const useUserStore = defineStore({
  id: 'app-user',
  state: (): IUserState => (
    {
      userInfo: 'kkk',
      userId: getUserId() || '',
      token: getToken() || '',
      roleId: getRoleId() || '',
      roleList: []
    }
  ),
  getters: {
    SetToken(token: string) {
      this.token = token;
    },
    SetUserId(userId: string) {
      this.userId = userId;
    },
    SetRoleId(roleId: string) {
      this.roleId = roleId;
    },
    getRoleList(): RoleEnum[] {
      return this.roleList.length > 0 ? this.roleList : [];
    },
    getWatchData() {
      return '监听属性'
    }
  },
  actions: {
    setRoleList(roleList: RoleEnum[]) {
      this.roleList = roleList;
      // setAuthCache(ROLES_KEY, roleList);
    },
    async Login(userInfo: {email: string, password: string}) {
      let pwd = Md5.hashStr(Md5.hashStr(userInfo.password) + '12345678');
      // let pd = Md5.
      const params = {
        email: userInfo.email,
        password: pwd
      }
      // 调用接口
      // const data: any = await axios.post(userApi.login, params)
      const data:any = await login(params)
      // 存储用户信息
      if (data.code === 1) {
        // 获取角色
        let userInfo = data.data
        this.GetRoleList({userId: userInfo.user_id})
        // 存储本地
        sessionStorage.setItem('userInfo', JSON.stringify(userInfo));
        // cookies
        // this.SetToken(userInfo.token);
        setToken(userInfo.token);
        // this.SetUserId(userInfo.user_id);
        setUserId(userInfo.user_id);
        // this.SetRoleId(userInfo.role_id);
        setRoleId(userInfo.role_id);
      } else {
        // this.$base.win.msg('登录失败', 'error');
      }
      return data
    },
    async GetRoleList(userInfo: { userId: string }) {
      const params = {
        userId: userInfo.userId,
      }
      // 调用接口
      const data: any = await axios.post(userApi.getRoleList, params)
      // 存储用户信息
      if (data.data.code === 1) {
        // sessionStorage.setItem('userInfo', JSON.stringify(data.data.data));
      } else {
        // this.$base.win.msg('登录失败', 'error');
      }
      return data
    },
    // 重置
    ResetToken() {},
    // 登出
    async LoginOut() {
      // if (this.token === '') {
      //   throw new Error("LoginOut：token is undefined");
      // }
      const useTags = useTagsStore();
      await axios.post(userApi.loginOut);
      removeRoleId();
      removeToken();
      removeUserId();
      sessionStorage.removeItem('userInfo')
      router.push({ path: '/login' })
      // 清空页签
      useTags.openTags = []
      // this.setToken('');
      // this.setUserId('');
      // this.setRoleId('');
    }
  }
})

// 添加到store index中
export function useUserStoreWithOut() {
  return useUserStore(store);
}