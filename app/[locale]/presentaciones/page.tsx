import { setRequestLocale } from 'next-intl/server';
import { DeckStudio } from '@/components/deck/DeckStudio';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DeckStudio />;
}
