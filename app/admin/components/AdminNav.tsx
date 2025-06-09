import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Box,
  Settings,
  TrendingUp,
  MessageSquare,
  BarChart,
  CreditCard
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Products', href: '/admin/products', icon: Box },
  { name: 'Payments', href: '/admin/payments', icon: CreditCard },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart },
  { name: 'Marketing', href: '/admin/marketing', icon: TrendingUp },
  { name: 'Support', href: '/admin/support', icon: MessageSquare },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {navigation.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`
              flex items-center px-4 py-2 text-sm font-medium rounded-md
              ${isActive
                ? 'bg-primary-red text-white'
                : 'text-gray-600 hover:bg-gray-50'}
            `}
          >
            <item.icon
              className={`mr-3 h-6 w-6 ${isActive ? 'text-white' : 'text-gray-400'}`}
              aria-hidden="true"
            />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
