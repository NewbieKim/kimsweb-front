// 存储cookies文件
import Cookies from "js-cookie";

// user信息
const tokenKey = 'token'
const userIdKey = 'user_id'
const roleIdKey = 'role_id'

export const getToken = () => { return Cookies.get(tokenKey) }
export const getUserId = () => Cookies.get(userIdKey)
export const getRoleId = () => Cookies.get(roleIdKey)

export const setToken = (token: string) => Cookies.set(tokenKey, token)
export const setUserId = (userId: string) => Cookies.set(userIdKey, userId)
export const setRoleId = (roleId: string) => Cookies.set(roleIdKey, roleId)

export const removeToken = () => Cookies.remove(tokenKey)
export const removeUserId = () => Cookies.remove(userIdKey)
export const removeRoleId = () => Cookies.remove(roleIdKey)

// app
export const setSliderBarStatus = (sliderBarStatus: string) => Cookies.set('sliderBar_status', sliderBarStatus)
export const getSliderBarStatus = () => Cookies.get('sliderBar_status')