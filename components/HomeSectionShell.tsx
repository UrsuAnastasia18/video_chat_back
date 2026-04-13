import type { ReactNode } from "react";

interface HomeSectionShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

const HomeSectionShell = ({
  eyebrow,
  title,
  description,
  children,
}: HomeSectionShellProps) => {
  return (
    <section
      className="-mx-6 -mt-10 flex min-h-[calc(100vh-57px)] flex-col overflow-hidden px-4 py-5 sm:-mx-14 sm:px-8 lg:px-10"
      style={{
        background:
          "radial-gradient(circle at 0% 12%, #f3a9c2 0 76px, transparent 77px)," +
          "radial-gradient(circle at 100% 42%, #ffe48c 0 150px, transparent 151px)," +
          "radial-gradient(circle at 4% 92%, #9697f3 0 120px, transparent 121px)," +
          "#fbf6f1",
        color: "#17141f",
      }}
    >
      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col overflow-hidden rounded-[28px] bg-white px-6 py-6 shadow-[0_26px_80px_rgba(58,36,72,0.14)] sm:px-9 lg:px-10">
        <span className="absolute -left-12 top-20 h-28 w-28 rounded-full bg-[#f3a9c2]/70" />
        <span className="absolute -right-16 top-40 h-40 w-40 rounded-full bg-[#ffe48c]/80" />
        <span className="absolute bottom-16 left-8 h-20 w-20 rounded-full bg-[#9697f3]/75" />
        <span className="absolute right-20 top-24 h-5 w-5 rounded-full bg-[#eaa0bd]" />
        <span className="absolute right-56 top-32 h-3 w-3 rounded-full bg-[#9697f3]" />
        <span className="absolute right-80 top-36 h-4 w-4 rounded-full bg-[#ffe17e]" />

        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#df6f98]">
                {eyebrow}
              </p>
              <h1 className="mt-2 text-2xl font-black text-[#17141f] sm:text-3xl">
                {title}
              </h1>
            </div>
            <p className="max-w-xl text-sm font-medium leading-6 text-[#7c7081]">
              {description}
            </p>
          </div>

          <div className="rounded-[24px] bg-[#fbf6f1] p-4 sm:p-5">{children}</div>
        </div>
      </div>
    </section>
  );
};

export default HomeSectionShell;
