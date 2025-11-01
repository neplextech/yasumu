import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@yasumu/ui/components/select';

interface ServiceMethodSelectorProps {
  services: string[];
  methods: string[];
  selectedService?: string;
  selectedMethod?: string;
  onServiceChange: (service: string) => void;
  onMethodChange: (method: string) => void;
}

export default function ServiceMethodSelector({
  services,
  methods,
  selectedService,
  selectedMethod,
  onServiceChange,
  onMethodChange,
}: ServiceMethodSelectorProps) {
  return (
    <div className="flex gap-4">
      <Select value={selectedService} onValueChange={onServiceChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select service" />
        </SelectTrigger>
        <SelectContent>
          {services.map((service) => (
            <SelectItem key={service} value={service}>
              {service}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={selectedMethod} onValueChange={onMethodChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select method" />
        </SelectTrigger>
        <SelectContent>
          {methods.map((method) => (
            <SelectItem key={method} value={method}>
              {method}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
