'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Search, 
  Bell, 
  Mail, 
  User, 
  Settings,
  MoreHorizontal,
  Dumbbell,
  Trophy,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// MusclePal SVGロゴ
const MusclePalLogo = () => (
  <svg 
    width="32" 
    height="32" 
    viewBox="0 0 32 32" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className="text-blue-600"
  >
    <rect width="32" height="32" rx="8" fill="currentColor"/>
    <path 
      d="M8 12h4v8H8v-8zm12 0h4v8h-4v-8zm-8-2h8v2H12v-2zm0 10h8v2H12v-2z" 
      fill="white"
    />
  </svg>
);

const navigationItems = [
  {
    name: 'ホーム',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: '投稿',
    href: '/posts',
    icon: Dumbbell,
  },
  {
    name: '検索',
    href: '/search',
    icon: Search,
  },
  {
    name: 'チャレンジ',
    href: '/challenges',
    icon: Trophy,
  },
  {
    name: 'コミュニティ',
    href: '/community',
    icon: Users,
  },
  {
    name: '通知',
    href: '/notifications',
    icon: Bell,
  },
  {
    name: 'メッセージ',
    href: '/messages',
    icon: Mail,
  },
  {
    name: 'プロフィール',
    href: '/profile',
    icon: User,
  },
  {
    name: '設定',
    href: '/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-screen w-64 border-r bg-white sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b">
        <MusclePalLogo />
        <span className="text-xl font-bold text-gray-900">MusclePal</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-full text-xl transition-colors hover:bg-gray-100",
                  isActive 
                    ? "font-bold text-gray-900" 
                    : "text-gray-700 hover:text-gray-900"
                )}
              >
                <Icon className="w-6 h-6" />
                <span className="hidden lg:inline">{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Tweet Button */}
        <div className="mt-8">
          <Link href="/posts/new">
            <Button 
              className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-full text-lg"
              size="lg"
            >
              <span className="hidden lg:inline">投稿する</span>
              <span className="lg:hidden">
                <Dumbbell className="w-6 h-6" />
              </span>
            </Button>
          </Link>
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t">
        <Button 
          variant="ghost" 
          className="w-full justify-between p-3 h-auto"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="hidden lg:block text-left">
              <div className="font-semibold text-sm">ユーザー名</div>
              <div className="text-gray-500 text-sm">@username</div>
            </div>
          </div>
          <MoreHorizontal className="w-5 h-5 hidden lg:block" />
        </Button>
      </div>
    </div>
  );
}