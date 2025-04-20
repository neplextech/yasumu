'use client';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
} from '../ui/sidebar';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { format } from 'date-fns';
import { stripIndents } from 'common-tags';
import { setCurrentMail } from '@/stores/MailStore';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const data = [
  {
    id: 'c971cae1-c594-4c53-8e42-a0f4995444d1',
    name: 'William Smith',
    from: 'williamsmith@example.com',
    to: 'user@yasumu.dev',
    subject: 'Meeting Tomorrow',
    date: new Date(),
    teaser:
      'Hi team, just a reminder about our meeting tomorrow at 10 AM.\nPlease come prepared with your project updates. Looking forward to seeing you all.',
    body: stripIndents`Hi team,
    Just a reminder about our meeting tomorrow at 10 AM. Please come prepared with your project updates.

    Thanks,
    William`,
  },
  {
    id: 'ee5e37d5-659f-4463-973c-4d9f30955ce8',
    name: 'Alice Smith',
    from: 'alicesmith@example.com',
    to: 'user@yasumu.dev',
    subject: 'Re: Project Update',
    date: new Date(),
    teaser:
      "Thanks for the update. The progress looks great so far.\nLet's schedule a call to discuss the next steps. I'll send a calendar invite.",
    body: stripIndents`Hi team,
    Thanks for the update. The progress looks great so far. Let's schedule a call to discuss the next steps. I'll send a calendar invite.

    Best,
    Alice`,
  },
  {
    id: '6c84591e-6ce0-46df-a99f-8ba995c62b2f',
    name: 'Bob Johnson',
    from: 'bobjohnson@example.com',
    to: 'user@yasumu.dev',
    subject: 'Weekend Plans',
    date: new Date(),
    teaser:
      "Hey everyone! I'm thinking of organizing a team outing this weekend.\nWould you be interested in a hiking trip or a beach day? Let me know your preference.",
    body: stripIndents`Hey everyone!
    I'm thinking of organizing a team outing this weekend. Would you be interested in a hiking trip or a beach day? Let me know your preference.

    Cheers,
    Bob`,
  },
  {
    id: 'f6a762e2-66c2-4d9e-825a-a413509db03b',
    name: 'Emily Davis',
    from: 'emilydavis@example.com',
    to: 'user@yasumu.dev',
    subject: 'Re: Question about Budget',
    date: new Date(),
    teaser:
      "I've reviewed the budget numbers you sent over.\nCan we set up a quick call to discuss some potential adjustments? Thanks!",
    body: stripIndents`Hi team,
    I've reviewed the budget numbers you sent over. Can we set up a quick call to discuss some potential adjustments? Thanks!

    Regards,
    Emily`,
  },
  {
    id: 'fe858a20-3eb5-4dde-abf3-2416be21878c',
    name: 'Michael Wilson',
    from: 'michaelwilson@example.com',
    to: 'user@yasumu.dev',
    subject: 'Important Announcement',
    date: new Date(),
    teaser:
      "Please join us for an all-hands meeting this Friday at 3 PM.\nWe have some exciting news to share about the company's future. Don't miss it!",
    body: stripIndents`Hi team,
    Please join us for an all-hands meeting this Friday at 3 PM. We have some exciting news to share about the company's future. Don't miss it!

    Best,
    Michael`,
  },
  {
    id: 'ea577868-623c-4034-aa51-a242d22af0c4',
    name: 'Sarah Brown',
    from: 'sarahbrown@example.com',
    to: 'user@yasumu.dev',
    subject: 'Re: Feedback on Proposal',
    date: new Date(),
    teaser:
      "Thank you for sending over the proposal. I've reviewed it and have some thoughts.\nCould we schedule a meeting to discuss my feedback in detail? Looking forward to it.",
    body: stripIndents`Hi team,
    Thank you for sending over the proposal. I've reviewed it and have some thoughts. Could we schedule a meeting to discuss my feedback in detail? Looking forward to it.

    Best,
    Sarah`,
  },
  {
    id: '5abddea2-1ea8-454d-a790-76ed81202309',
    name: 'David Lee',
    from: 'davidlee@example.com',
    to: 'user@yasumu.dev',
    subject: 'New Project Idea',
    date: new Date(),
    teaser:
      "I've been brainstorming and came up with an interesting project concept.\nDo you have time this week to discuss its potential impact and feasibility? Let me know.",
    body: stripIndents`Hi team,
    I've been brainstorming and came up with an interesting project concept. Do you have time this week to discuss its potential impact and feasibility? Let me know.

    Regards,
    David`,
  },
  {
    id: '9ae353e7-ce1d-41a0-a798-34212194da8f',
    name: 'Olivia Wilson',
    from: 'oliviawilson@example.com',
    to: 'user@yasumu.dev',
    subject: 'Vacation Plans',
    date: new Date(),
    teaser:
      "Just a heads up that I'll be taking a two-week vacation next month.\nI'll make sure all my projects are up to date before I leave. Thanks!",
    body: stripIndents`Hi team,
    Just a heads up that I'll be taking a two-week vacation next month. I'll make sure all my projects are up to date before I leave. Thanks!

    Best,
    Olivia`,
  },
  {
    id: '24b93e2f-5f68-4948-b25d-6bc21ae7b32b',
    name: 'James Martin',
    from: 'jamesmartin@example.com',
    to: 'user@yasumu.dev',
    subject: 'Re: Conference Registration',
    date: new Date(),
    teaser:
      "I've completed the registration for the upcoming tech conference.\nLet me know if you need any additional information from my end. Looking forward to it.",
    body: stripIndents`Hi team,
    I've completed the registration for the upcoming tech conference. Let me know if you need any additional information from my end. Looking forward to it.

    Regards,
    James`,
  },
  {
    id: 'c74ced22-31ab-40f1-92b7-6b93ac0b055a',
    name: 'Sophia White',
    from: 'sophiawhite@example.com',
    to: 'user@yasumu.dev',
    subject: 'Team Dinner',
    date: new Date(),
    teaser:
      "To celebrate our recent project success, I'd like to organize a team dinner.\nAre you available next Friday evening? Please let me know your preferences. Thanks!",
    body: stripIndents`Hi team,
    To celebrate our recent project success, I'd like to organize a team dinner. Are you available next Friday evening? Please let me know your preferences. Thanks!

    Best,
    Sophia`,
  },
];

export type IMail = (typeof data)[number];

export function MailSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const [emails, setEmails] = useState<IMail[]>(data);
  const [search, setSearch] = useState('');
  const params = useSearchParams();
  const id = params.get('id');

  useEffect(() => {
    setCurrentMail(data.find((mail) => mail.id === id) ?? null);
  }, [id]);

  useEffect(() => {
    if (!search) return setEmails(data);
    setEmails(
      data.filter(
        (mail) =>
          mail.name.toLowerCase().includes(search.toLowerCase()) ||
          mail.subject.toLowerCase().includes(search.toLowerCase()) ||
          mail.teaser.toLowerCase().includes(search.toLowerCase()),
      ),
    );
  }, [search]);

  return (
    <Sidebar collapsible="none" {...props}>
      <SidebarHeader className="gap-3.5 border-b p-4">
        <div className="flex w-full items-center justify-between">
          <div className="text-base font-medium text-foreground">froms</div>
          <Label className="flex items-center gap-2 text-sm">
            <span>Unreads</span>
            <Switch className="shadow-none" />
          </Label>
        </div>
        <SidebarInput
          placeholder="Type to search..."
          value={search}
          onChange={(v) => setSearch(v.target.value)}
        />
      </SidebarHeader>
      <SidebarContent className="zw-scrollbar">
        <SidebarGroup className="px-0">
          <SidebarGroupContent>
            {emails.map((mail) => (
              <Link
                key={mail.id}
                href={{
                  query: { id: mail.id },
                }}
                className="flex flex-col items-start gap-2 whitespace-nowrap border-b p-4 text-sm leading-tight last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <div className="flex w-full items-center gap-2">
                  <span>{mail.name}</span>{' '}
                  <span className="ml-auto text-xs">
                    {format(mail.date, 'PPpp')}
                  </span>
                </div>
                <span className="font-medium">{mail.subject}</span>
                <span className="line-clamp-2 w-[260px] whitespace-break-spaces text-xs">
                  {mail.teaser}
                </span>
              </Link>
            ))}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
