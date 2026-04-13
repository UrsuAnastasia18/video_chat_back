"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface MeetingCardProps {
  title: string;
  date: string;
  icon: string;
  subtitle?: string;
  status?: string;
  isPreviousMeeting?: boolean;
  buttonIcon1?: string;
  buttonText?: string;
  handleClick: () => void;
  link?: string;
  hideActions?: boolean;
  secondaryButtonText?: string;
  onSecondaryClick?: () => void;
  primaryDisabled?: boolean;
  emptyStateText?: string;
  variant?: "default" | "banner";
}

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: "bg-blue-50 text-blue-700 border-blue-200",
  LIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  COMPLETED: "bg-slate-100 text-slate-700 border-slate-200",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Programată",
  LIVE: "Live",
  COMPLETED: "Finalizată",
  CANCELLED: "Anulată",
  "LIVE NOW": "În desfășurare",
};

const BANNER_STATUS_STYLES: Record<string, string> = {
  SCHEDULED: "border-[#f6d98d] bg-[#fff4c9] text-[#8a6122]",
  LIVE: "border-[#8cd7b2] bg-[#e9fff1] text-[#177245]",
  COMPLETED: "border-[#eadfeb] bg-[#fff] text-[#6f6174]",
  CANCELLED: "border-[#f0b3c7] bg-[#ffe6ef] text-[#a04469]",
  "LIVE NOW": "border-[#8cd7b2] bg-[#e9fff1] text-[#177245]",
};

const MeetingCard = ({
  icon,
  title,
  date,
  subtitle,
  status,
  buttonIcon1,
  handleClick,
  link,
  buttonText,
  hideActions,
  secondaryButtonText,
  onSecondaryClick,
  primaryDisabled,
  emptyStateText,
  variant = "default",
}: MeetingCardProps) => {
  const isBannerVariant = variant === "banner";
  const hasAnyAction =
    (!primaryDisabled && !!buttonText) || !!link || !!(secondaryButtonText && onSecondaryClick) || !!emptyStateText;

  return (
    <section
      className={cn(
        "relative flex min-h-[220px] w-full flex-col justify-between overflow-hidden rounded-[14px] px-5 py-5 xl:max-w-[568px]",
        isBannerVariant ? "text-[#17141f]" : "bg-dark-1"
      )}
      style={
        isBannerVariant
          ? {
            background:
              "linear-gradient(180deg, #ffffff 0%, #fff8f1 100%)",
            border: "1px solid rgba(234,223,235,0.95)",
            boxShadow: "0 18px 42px rgba(58,36,72,0.08)",
          }
          : undefined
      }
    >
      {isBannerVariant ? (
        <>
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg,#df6f98 0,#df6f98 1px,transparent 1px,transparent 48px)," +
                "repeating-linear-gradient(90deg,#f6a43a 0,#f6a43a 1px,transparent 1px,transparent 48px)",
            }}
          />
          <div
            className="absolute -right-20 -top-20 h-52 w-52 rounded-full opacity-[0.08]"
            style={{ background: "radial-gradient(circle, #f3a9c2 0%, transparent 70%)" }}
          />
          <div
            className="absolute -bottom-10 left-1/3 h-36 w-36 rounded-full opacity-[0.05]"
            style={{ background: "radial-gradient(circle, #9697f3 0%, transparent 70%)" }}
          />
          <div
            className="absolute bottom-8 right-10 h-24 w-24 rounded-full opacity-[0.08]"
            style={{ background: "radial-gradient(circle, #ffe48c 0%, transparent 70%)" }}
          />
        </>
      ) : null}

      <article className="relative z-10 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={cn(
                "rounded-lg p-2.5",
                isBannerVariant ? "bg-[#ffe6ef] ring-1 ring-[#f0b3c7]" : "bg-dark-4"
              )}
            >
              <Image src={icon} alt="upcoming" width={18} height={18} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold">{title}</h1>
              {subtitle ? (
                <p
                  className={cn(
                    "mt-1 text-sm",
                    isBannerVariant ? "text-[#75697c]" : "text-sky-1"
                  )}
                >
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>
          {status ? (
            <span
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                isBannerVariant
                  ? BANNER_STATUS_STYLES[status] ?? "border-[#eadfeb] bg-white text-[#6f6174]"
                  : STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700 border-slate-200"
              )}
            >
              {STATUS_LABELS[status] ?? status}
            </span>
          ) : null}
        </div>

        <div
          className={cn(
            "rounded-lg px-3 py-2",
            isBannerVariant ? "bg-white ring-1 ring-[#eadfeb]" : "bg-dark-4"
          )}
        >
          <p
            className={cn(
              "text-sm font-medium",
              isBannerVariant ? "text-[#17141f]" : "text-slate-100"
            )}
          >
            {date}
          </p>
        </div>
      </article>

      <article
        className={cn(
          "relative z-10 mt-4 border-t pt-4",
          isBannerVariant ? "border-[#eadfeb]" : "border-dark-4"
        )}
      >
        {!hideActions && hasAnyAction && (
          <div className="flex flex-wrap items-center gap-2">
            {buttonText && !primaryDisabled ? (
              <Button
                onClick={handleClick}
                className="rounded-full border border-[#d8cff8] bg-[#9697f3] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(150,151,243,0.24)] hover:bg-[#7c7de8]"
              >
                {buttonIcon1 && (
                  <Image src={buttonIcon1} alt="feature" width={16} height={16} />
                )}
                {buttonIcon1 ? " " : null}
                {buttonText}
              </Button>
            ) : null}
            {link ? (
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(link);
                  toast.success("Link copiat");
                }}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold",
                  isBannerVariant
                    ? "border border-[#eadfeb] bg-white text-[#17141f] hover:bg-[#fff8f1]"
                    : "bg-dark-4"
                )}
              >
                <Image
                  src="/icons/copy.svg"
                  alt="feature"
                  width={16}
                  height={16}
                />
                {" "}Copiază linkul
              </Button>
            ) : null}
            {secondaryButtonText && onSecondaryClick ? (
              <Button
                onClick={onSecondaryClick}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold shadow-[0_12px_24px_rgba(223,111,152,0.2)]",
                  isBannerVariant
                    ? "bg-[#df6f98] text-white hover:bg-[#cf5f88]"
                    : "bg-blue-1"
                )}
              >
                {secondaryButtonText}
              </Button>
            ) : null}
            {primaryDisabled && emptyStateText ? (
              <p
                className={cn(
                  "text-sm font-medium",
                  isBannerVariant ? "text-[#8b7c8f]" : "text-slate-400"
                )}
              >
                {emptyStateText}
              </p>
            ) : null}
          </div>
        )}
      </article>
    </section>
  );
};

export default MeetingCard;
