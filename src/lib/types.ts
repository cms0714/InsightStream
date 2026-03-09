export type Category = 'robotics' | 'ai' | 'cheme' | 'future' | 'cs' | 'math' | 'physics' | 'bio' | 'econ' | 'design';

export interface Profile {
  id: string;
  nickname: string;
  major: string;
}

export interface Reaction {
  oh: number;
  amazing: number;
  useful: number;
}

export interface Comment {
  id: string;
  author: string;
  major: string;
  text: string;
  createdAt: string;
}

export interface Post {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  content: string;
  categories: Category[];
  author: string;
  major: string;
  authorId?: string;
  createdAt: string;
  reactions: Reaction;
  comments: Comment[];
  commentCount: number;
}
