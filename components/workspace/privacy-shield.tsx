"use client";

import { Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import type { PrivacyConfig, MaskLevel } from "@/lib/privacy";

interface PrivacyShieldProps {
  config: PrivacyConfig;
  saveConfig: (config: PrivacyConfig) => void;
  togglePrivacy: () => void;
  isMasked: boolean;
  isReady: boolean;
}

const FIELD_LABELS: Record<keyof PrivacyConfig["fields"], string> = {
  customerName: "Tên khách hàng",
  cif: "Mã CIF",
  phone: "Số điện thoại",
  taxId: "Mã số thuế",
  staffName: "Tên nhân viên",
  department: "Chi nhánh / Phòng ban",
};

export function PrivacyShield({ config, saveConfig, togglePrivacy, isMasked, isReady }: PrivacyShieldProps) {
  if (!isReady) return null;

  const handleLevelChange = (level: MaskLevel) => {
    saveConfig({ ...config, level });
  };

  const handleFieldChange = (field: keyof PrivacyConfig["fields"], checked: boolean) => {
    saveConfig({
      ...config,
      fields: {
        ...config.fields,
        [field]: checked,
      },
    });
  };

  const renderIcon = () => {
    if (config.level === "off") return <Shield className="h-5 w-5 text-muted-foreground" />;
    if (config.level === "full") return <ShieldCheck className="h-5 w-5 text-green-500" />;
    return <ShieldAlert className="h-5 w-5 text-yellow-500" />;
  };

  const statusText = config.level === "off"
    ? "Đã tắt"
    : config.level === "full"
      ? "Bảo vệ toàn bộ"
      : "Bảo vệ một phần";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          {renderIcon()}
          <span className="hidden sm:inline-block">{isMasked ? "Đang ẩn" : "Ẩn PII"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="font-medium leading-none">Privacy Shield</h4>
              <p className="text-sm text-muted-foreground">{statusText}</p>
            </div>
            <Button size="sm" variant={isMasked ? "default" : "outline"} onClick={togglePrivacy}>
              {isMasked ? "Đang bật" : "Bật"}
            </Button>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <h5 className="text-sm font-medium">Mức độ che giấu</h5>
            <RadioGroup
              value={config.level}
              onValueChange={(value) => handleLevelChange(value as MaskLevel)}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="off" id="level-off" />
                <Label htmlFor="level-off" className="font-normal cursor-pointer">Tắt — Hiển thị đầy đủ</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="partial" id="level-partial" />
                <Label htmlFor="level-partial" className="font-normal cursor-pointer">Một phần — Hiện ký tự đầu/cuối</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full" id="level-full" />
                <Label htmlFor="level-full" className="font-normal cursor-pointer">Toàn bộ — Thay bằng ••••</Label>
              </div>
            </RadioGroup>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <h5 className="text-sm font-medium">Trường dữ liệu áp dụng</h5>
            <div className="grid grid-cols-1 gap-2">
              {(Object.keys(FIELD_LABELS) as Array<keyof PrivacyConfig["fields"]>).map((field) => (
                <div key={field} className="flex items-center space-x-2">
                  <Checkbox
                    id={`field-${field}`}
                    checked={config.fields[field]}
                    onCheckedChange={(checked) => handleFieldChange(field, checked as boolean)}
                  />
                  <Label htmlFor={`field-${field}`} className="font-normal cursor-pointer">
                    {FIELD_LABELS[field]}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

