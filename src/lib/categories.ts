import { Category } from './types';

export interface CategoryItem {
  key: 'all' | 'saved' | Category;
  label: string;
}

export const categories: CategoryItem[] = [
  { key: 'all', label: '전체' },
  { key: 'robotics', label: '로보틱스' },
  { key: 'ai', label: 'AI' },
  { key: 'cheme', label: '화생공' },
  { key: 'future', label: '미래사회' },
  { key: 'cs', label: '컴퓨터과학' },
  { key: 'math', label: '수학' },
  { key: 'physics', label: '물리학' },
  { key: 'bio', label: '생명과학' },
  { key: 'econ', label: '경제학' },
  { key: 'design', label: '디자인' },
];

export const categoryLabels: Record<Category, string> = {
  robotics: '로보틱스',
  ai: 'AI',
  cheme: '화생공',
  future: '미래사회',
  cs: '컴퓨터과학',
  math: '수학',
  physics: '물리학',
  bio: '생명과학',
  econ: '경제학',
  design: '디자인',
};
