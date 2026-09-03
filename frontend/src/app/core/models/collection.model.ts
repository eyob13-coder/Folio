export interface Collection {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  orderIndex: number;
  bookCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  bookCount?: number;
}
