import { redirect, RedirectType } from 'next/navigation';

export default async function Page() {
  redirect('/workspaces/default/rest', RedirectType.replace);
}
