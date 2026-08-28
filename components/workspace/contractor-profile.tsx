"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BriefcaseBusiness,
  Search,
  SearchCheck,
  TrendingUp,
  UsersRound,
  Building2,
  MapPin,
  LoaderCircle,
  KeyRound,
} from "lucide-react";
import { JsonRecord } from "@/lib/constants";
import { pick, asText } from "@/lib/task-mapper";
import { formatCount, formatRate, summarizeComplex } from "@/lib/formatters";

export interface ContractorProfileProps {
  contractorTaxId: string;
  setContractorTaxId: (val: string) => void;
  lookupContractor: () => void;
  contractorBusy: boolean;
  connected: boolean;
  contractor: JsonRecord | null;
  bidOverview: JsonRecord | null;
  contractorPackages: JsonRecord[];
  privacyMode: boolean;
  mask?: (value: string, field: "customerName" | "cif" | "phone" | "taxId") => string;
}

export function ContractorProfile({
  contractorTaxId,
  setContractorTaxId,
  lookupContractor,
  contractorBusy,
  connected,
  contractor,
  bidOverview,
  contractorPackages,
  privacyMode,
  mask,
}: ContractorProfileProps) {
  const displayTaxId = (taxId: string) =>
    privacyMode && taxId && mask ? mask(taxId, "taxId") : taxId;
  const displayName = (name: string) =>
    privacyMode && name && mask ? mask(name, "customerName") : name;

  return (
    <div className="contractor-view">
      <section className="task-panel contractor-search-panel">
        <div className="contractor-search-copy">
          <span className="contractor-icon">
            <BriefcaseBusiness size={22} />
          </span>
          <div>
            <h2>Tra cứu hồ sơ đấu thầu</h2>
            <p>
              Nhập mã số thuế doanh nghiệp để đọc dữ liệu Lead đấu thầu thật.
            </p>
          </div>
        </div>
        <div className="contractor-search-form">
          <div className="search-wrap contractor-search-input">
            <Search size={16} />
            <Input
              value={contractorTaxId}
              onChange={(event) => setContractorTaxId(event.target.value)}
              onKeyDown={(event) =>
                event.key === "Enter" && void lookupContractor()
              }
              placeholder="Ví dụ: 3900324838"
            />
          </div>
          <Button
            className="vp-primary"
            onClick={lookupContractor}
            disabled={contractorBusy}
          >
            {contractorBusy ? (
              <LoaderCircle className="animate-spin" size={16} />
            ) : (
              <Search size={16} />
            )}
            {contractorBusy ? "Đang tra cứu..." : "Tra cứu"}
          </Button>
        </div>
      </section>

      {!connected && (
        <section className="task-panel audit-panel">
          <div className="audit-empty compact-empty">
            <KeyRound size={28} />
            <h2>Cần kết nối SME Connect</h2>
            <p>Tính năng tra cứu nhà thầu chỉ hoạt động khi có token kết nối thật.</p>
          </div>
        </section>
      )}

      {contractor && (
        <section className="task-panel contractor-profile-panel">
          <div className="contractor-card-header">
            <div>
              <span className="contractor-chip">Hồ sơ nhà thầu</span>
              <h2>{displayName(asText(pick(contractor, "name", "contractorName"), "Doanh nghiệp"))}</h2>
              <p>
                MST: {displayTaxId(contractorTaxId)} &middot;{" "}
                {asText(pick(contractor, "address", "location", "province"), "Tây Ninh")}
              </p>
            </div>
            <div className="contractor-quick-badges">
              <Badge variant="outline">
                <Building2 size={13} />{" "}
                {asText(pick(contractor, "contractorType", "type"), "Nhà thầu")}
              </Badge>
              <Badge variant="outline">
                <MapPin size={13} />{" "}
                {asText(pick(contractor, "province", "city"), "Toàn quốc")}
              </Badge>
            </div>
          </div>

          <div className="contractor-stat-grid">
            <div>
              <span>Gói thầu đã tham gia</span>
              <strong>{formatCount(pick(contractor, "totalBid", "bidCount", "participatedCount"))}</strong>
            </div>
            <div>
              <span>Gói thầu trúng</span>
              <strong>{formatCount(pick(contractor, "winCount", "totalWin"))}</strong>
            </div>
            <div>
              <span>Tỷ lệ trúng thầu</span>
              <strong>{formatRate(pick(contractor, "winRate", "rate"))}</strong>
            </div>
            <div>
              <span>Giá trị trúng thầu</span>
              <strong>{asText(pick(contractor, "totalWinAmount", "winValue"), "—")}</strong>
            </div>
          </div>

          {bidOverview && (
            <div className="bid-overview-summary">
              <div className="panel-topline">
                <div>
                  <h3>Tổng quan Pool đấu thầu SME</h3>
                  <p>Dữ liệu tổng thể trên toàn hệ thống SME Connect.</p>
                </div>
                <SearchCheck size={18} />
              </div>
              <div className="catalog-metrics">
                <div>
                  <span>Tổng nhà thầu</span>
                  <strong>{formatCount(pick(bidOverview, "totalContractor", "contractorCount"))}</strong>
                </div>
                <div>
                  <span>Gói thầu mở</span>
                  <strong>{formatCount(pick(bidOverview, "totalOpeningPackage", "openingCount"))}</strong>
                </div>
                <div>
                  <span>Gói thầu tiềm năng</span>
                  <strong>{formatCount(pick(bidOverview, "totalPotentialPackage", "potentialCount"))}</strong>
                </div>
              </div>
            </div>
          )}

          {contractorPackages.length > 0 && (
            <div className="contractor-packages-section">
              <h3>Gói thầu tiêu biểu gần đây</h3>
              <div className="package-list">
                {contractorPackages.map((pkg, idx) => (
                  <div key={idx} className="package-item">
                    <strong>{asText(pick(pkg, "packageName", "name", "title"), `Gói thầu #${idx + 1}`)}</strong>
                    <div className="package-meta">
                      <span>Bên mời thầu: {displayName(asText(pick(pkg, "procuringEntityName", "bidOwner"), "—"))}</span>
                      <span>Giá dự thầu: {asText(pick(pkg, "bidPrice", "price"), "—")}</span>
                      <span>Trạng thái: {asText(pick(pkg, "statusName", "status"), "—")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
