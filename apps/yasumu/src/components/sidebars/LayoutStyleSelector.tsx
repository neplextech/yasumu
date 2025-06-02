'use client';
import {
  DropdownMenuCheckboxItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '../ui/dropdown-menu';
import { setAppLayout, useLayout } from '@/stores/AppLayout';
import {
  YasumuLayout,
  YasumuLayoutIcons,
  YasumuLayoutList,
} from '@/lib/constants/layout';
import { VscLayout } from 'react-icons/vsc';

export default function SidebarLayoutStyleSelector() {
  const layout = useLayout();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="gap-2">
        <VscLayout className="size-4" />
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
