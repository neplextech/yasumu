'use client';
import {
  DropdownMenuCheckboxItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '../ui/dropdown-menu';
import { useStore } from '@nanostores/react';
import { $appLayout, setAppLayout } from '@/stores/AppLayout';
import { YasumuLayout, YasumuLayoutIcons, YasumuLayoutList } from '@/lib/constants/layout';
import { VscLayout } from 'react-icons/vsc';

export default function SidebarLayoutStyleSelector() {
  const layout = useStore($appLayout);

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <VscLayout />
        Layout
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          {YasumuLayoutList.map((value) => {
            const target = YasumuLayout[value];
            if (!target) return null;

            const Icon = YasumuLayoutIcons[target];

            return (
              <DropdownMenuCheckboxItem
                key={target}
                checked={layout === target}
                onCheckedChange={() => {
                  setAppLayout(target);
                }}
                className="gap-2"
              >
                {Icon && <Icon className="size-4" />}
                {value}
              </DropdownMenuCheckboxItem>
            );
          })}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}
