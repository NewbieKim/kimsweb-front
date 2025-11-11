// 自定义v-auth指令
// example: v-auth="RoleEnum.TEST"
import type { App, Directive, DirectiveBinding } from 'vue';
// @ts-ignore
import { RoleEnum } from '@/enums/roleEnum';

function usePermission(value?: RoleEnum | RoleEnum[] | string | string[], def = true): boolean {
  // Visible by default
  if (!value) {
    return def;
  }
  console.log('value', value);
  console.log('def', def);
  // if (!isArray(value)) {
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

function isAuth(el: Element, binding: any) {
  // @ts-ignore
  const { hasPermission } = usePermission();
  const value = binding.value;
  if (!value) return;
  if (!hasPermission(value)) {
    el.parentNode?.removeChild(el);
  }
}

const mounted = (el: Element, binding: DirectiveBinding<any>) => {
  isAuth(el, binding);
}

const authDirective: Directive = { mounted };

export function setupPermissionDirective(app: App) {
  app.directive('auth', authDirective);
}

export default authDirective;