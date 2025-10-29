import { redirect, RedirectType } from 'next/navigation';

export default async function Page() {
  redirect('/en/workspaces/default/rest', RedirectType.replace);
}
