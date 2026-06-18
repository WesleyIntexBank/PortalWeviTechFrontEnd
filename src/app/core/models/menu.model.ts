export interface Menu {
  id?: number;
  title: string;
  url: string;
  component?: string;
  icon: string;
  menuId?: number;
  subMenu?: Menu[];
  isSubMenu?: boolean;
}
