export interface Menu {
  id?: number;
  title: string;
  icon: string;
  route: string;
  parentId?: number | null;
  order: number;
  active: boolean;
  createdAt?: string;
  parent?: { id: number; name: string };
  children?: Menu[];
}
