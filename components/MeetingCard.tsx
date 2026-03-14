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

const MeetingCard = ({
  icon,
  title,
  date,
  subtitle,
  status,
  isPreviousMeeting,
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

  return (
    <section
      className={cn(
        "relative flex min-h-[220px] w-full flex-col justify-between overflow-hidden rounded-[14px] px-5 py-5 xl:max-w-[568px]",
        isBannerVariant ? "text-white" : "bg-dark-1"
      )}
      style={
        isBannerVariant
          ? {
            background:
              "linear-gradient(135deg, #1e2d40 0%, #243650 55%, #1a3a5c 100%)",
          }
          : undefined
      }
    >
      {isBannerVariant ? (
        <>
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 48px)," +
                "repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 48px)",
            }}
          />
          <div
            className="absolute -right-20 -top-20 h-52 w-52 rounded-full opacity-[0.08]"
            style={{ background: "radial-gradient(circle, #4f8ef7 0%, transparent 70%)" }}
          />
          <div
            className="absolute -bottom-10 left-1/3 h-36 w-36 rounded-full opacity-[0.05]"
            style={{ background: "radial-gradient(circle, #818cf8 0%, transparent 70%)" }}
          />
        </>
      ) : null}

      <article className="relative z-10 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={cn(
                "rounded-lg p-2.5",
                isBannerVariant ? "bg-white/10 ring-1 ring-white/15" : "bg-dark-4"
              )}
            >
              <Image src={icon} alt="upcoming" width={18} height={18} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold">{title}</h1>
              {subtitle ? (
                <p
                  className={cn(
                    "mt-1 text-sm",
                    isBannerVariant ? "text-white/75" : "text-sky-1"
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
                  ? "border-white/25 bg-white/10 text-white"
                  : STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700 border-slate-200"
              )}
            >
              {status}
            </span>
          ) : null}
        </div>

        <div
          className={cn(
            "rounded-lg px-3 py-2",
            isBannerVariant ? "bg-white/10 ring-1 ring-white/15" : "bg-dark-4"
          )}
        >
          <p
            className={cn(
              "text-[11px] uppercase tracking-wide",
              isBannerVariant ? "text-white/60" : "text-slate-400"
            )}
          >
            Scheduled
          </p>
          <p
            className={cn(
              "mt-1 text-sm font-medium",
              isBannerVariant ? "text-white" : "text-slate-100"
            )}
          >
            {date}
          </p>
        </div>
      </article>

      <article
        className={cn(
          "relative z-10 mt-4 border-t pt-4",
          isBannerVariant ? "border-white/15" : "border-dark-4"
        )}
      >
        {!hideActions && (!isPreviousMeeting || secondaryButtonText) && (
          <div className="flex flex-wrap items-center gap-2">
            {buttonText && !primaryDisabled ? (
              <Button onClick={handleClick} className="rounded bg-blue-1 px-4 py-2 text-sm">
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
                  toast.success("Link Copied");
                }}
                className={cn(
                  "px-4 py-2 text-sm",
                  isBannerVariant ? "bg-white/10 text-white hover:bg-white/20" : "bg-dark-4"
                )}
              >
                <Image
                  src="/icons/copy.svg"
                  alt="feature"
                  width={16}
                  height={16}
                />
                {" "}Copy Link
              </Button>
            ) : null}
            {secondaryButtonText && onSecondaryClick ? (
              <Button
                onClick={onSecondaryClick}
                className={cn(
                  "rounded px-4 py-2 text-sm",
                  isBannerVariant ? "bg-blue-1 hover:bg-blue-1/90" : "bg-blue-1"
                )}
              >
                {secondaryButtonText}
              </Button>
            ) : null}
            {primaryDisabled && emptyStateText ? (
              <p
                className={cn(
                  "text-sm font-medium",
                  isBannerVariant ? "text-white/70" : "text-slate-400"
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
