import { Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from './ui/primitives';

const SEGMENT_LABELS: Record<string, string> = {
  player: 'Player', dashboard: 'Dashboard', playbooks: 'Playbook',
  performance: 'Performa', wellness: 'Wellness', schedule: 'Jadwal',
  profile: 'Profil', matches: 'Scrim & Match', roster: 'Roster',
  analytics: 'Analitik', contracts: 'Kontrak', recruitment: 'Rekrutmen',
  audit: 'Audit Log', opponents: 'Scouting',
};

/** Template breadcrumb structure, with React Router links. */
export function Breadcrumbs() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);
  if (!segments.length) return null;

  const items = segments.map((segment, i) => ({
    title: SEGMENT_LABELS[segment] || (segment.startsWith('pb-') ? 'Detail Taktik' : segment),
    link: '/' + segments.slice(0, i + 1).join('/'),
    last: i === segments.length - 1,
  }));

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {items.map((item) => (
          <Fragment key={item.link}>
            {!item.last && (
              <BreadcrumbItem className="hidden md:inline-flex">
                <Link to={item.link} className="truncate text-muted-foreground transition-colors hover:text-foreground">
                  {item.title}
                </Link>
              </BreadcrumbItem>
            )}
            {!item.last && (
              <BreadcrumbSeparator className="hidden md:inline-flex"><ChevronRight size={12} /></BreadcrumbSeparator>
            )}
            {item.last && (
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage className="truncate">{item.title}</BreadcrumbPage>
              </BreadcrumbItem>
            )}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
