import { Fragment } from 'react';
import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  capitalize?: boolean;
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex gap-2 text-sm text-gray-400 mb-6 flex-wrap">
      {items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && <span>/</span>}
          {item.href ? (
            <Link href={item.href} className={`hover:text-chess-gold${item.capitalize ? ' capitalize' : ''}`}>
              {item.label}
            </Link>
          ) : (
            <span className={`text-gray-600${item.capitalize ? ' capitalize' : ''}`}>{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
