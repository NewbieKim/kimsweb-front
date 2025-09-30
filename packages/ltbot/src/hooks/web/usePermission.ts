
import type { App, Directive, DirectiveBinding } from 'vue';
// @ts-ignore
import { RoleEnum } from '@/enums/roleEnum';

export function usePermission() {
  function hasPermission(value?: RoleEnum | RoleEnum[] | string | string[], def = true): boolean {
    // Visible by default
    if (!value) {
      return def;
    }
    console.log('value', value);
    console.log('def', def);
    // 通过查询当前角色 判断权限
    // const permMode = projectSetting.permissionMode;
    // if ([PermissionModeEnum.ROUTE_MAPPING, PermissionModeEnum.ROLE].includes(permMode)) {
    //   if (!isArray(value)) {
    //     return userStore.getRoleList?.includes(value as RoleEnum);
    //   }
    //   return (intersection(value, userStore.getRoleList) as RoleEnum[]).length > 0;
    // }
    // if (PermissionModeEnum.BACK === permMode) {
    //   const allCodeList = permissionStore.getPermCodeList as string[];
    //   if (!isArray(value)) {
    //     return allCodeList.includes(value);
    //   }
    //   return (intersection(value, allCodeList) as string[]).length > 0;
    // }
    return true;
  }
  return { hasPermission };
}
