import MeetingTypeList from '@/components/MeetingTypeList';

const Home = () => {
  const now = new Date();
  const time = now.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
  const date = new Intl.DateTimeFormat('ro-RO', { dateStyle: 'full' }).format(now);

  return (
    <section
      className="-mx-6 -mt-10 flex min-h-[calc(100vh-57px)] flex-col overflow-hidden px-4 py-5 sm:-mx-14 sm:px-8 lg:px-10"
      style={{
        background:
          'radial-gradient(circle at 0% 12%, #f3a9c2 0 76px, transparent 77px),' +
          'radial-gradient(circle at 100% 42%, #ffe48c 0 150px, transparent 151px),' +
          'radial-gradient(circle at 4% 92%, #9697f3 0 120px, transparent 121px),' +
          '#fbf6f1',
        color: '#17141f',
      }}
    >
      <div
        className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 overflow-hidden rounded-[28px] bg-white px-6 py-5 shadow-[0_26px_80px_rgba(58,36,72,0.14)] sm:px-9 lg:px-10"
        style={{ minHeight: 'auto' }}
      >
        <span className="absolute -left-12 top-20 h-28 w-28 rounded-full bg-[#f3a9c2]/70" />
        <span className="absolute -right-16 top-40 h-40 w-40 rounded-full bg-[#ffe48c]/80" />
        <span className="absolute bottom-16 left-8 h-20 w-20 rounded-full bg-[#9697f3]/75" />
        <span className="absolute right-20 top-24 h-5 w-5 rounded-full bg-[#eaa0bd]" />
        <span className="absolute right-56 top-32 h-3 w-3 rounded-full bg-[#9697f3]" />
        <span className="absolute right-80 top-36 h-4 w-4 rounded-full bg-[#ffe17e]" />

        

        <div className="relative z-10 flex min-h-[260px] items-start justify-center pt-2">
          <svg className="absolute left-4 top-4 h-14 w-14 text-[#9697f3]" viewBox="0 0 80 80" fill="none">
            <path d="M18 40c14-30 31-30 44-4" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeDasharray="2 12" />
            <path d="M24 21l-5 18 17-6" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          <svg className="absolute right-12 top-5 h-10 w-10 text-[#f3a9c2]" viewBox="0 0 64 64" fill="none">
            <path d="M30 52C12 39 12 20 25 18c5-1 8 2 10 6 2-5 6-8 12-6 12 5 4 23-17 34Z" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          <svg className="absolute bottom-8 right-28 h-10 w-10 text-[#f6a43a]" viewBox="0 0 64 64" fill="none">
            <path d="M32 7l7 16 17 2-13 11 4 17-15-9-15 9 4-17L8 25l17-2 7-16Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
          </svg>

          <span className="absolute left-12 top-28 h-12 w-12 rounded-full bg-[#f3a9c2]" />
          <span className="absolute bottom-12 left-28 h-10 w-10 rounded-full bg-[#9697f3]" />
          <span className="absolute right-8 top-36 h-10 w-10 rounded-full bg-[#ffe48c]" />
          <span className="absolute bottom-16 left-44 h-2 w-20 rotate-6 rounded-full bg-[#f6a43a]" />
          <span className="absolute right-44 top-24 h-2 w-16 -rotate-3 rounded-full bg-[#df6f98]" />

          <div className="relative w-full max-w-[600px] rounded-[30px] bg-[#fbf6f1] px-6 py-7 text-center shadow-[0_20px_48px_rgba(58,36,72,0.1)] sm:px-10 sm:py-8">
            <span className="absolute -left-4 top-9 h-12 w-12 rounded-full bg-[#f3a9c2]" />
            <span className="absolute -right-5 bottom-9 h-16 w-16 rounded-full bg-[#ffe48c]" />
            <span className="absolute right-14 top-7 h-3.5 w-3.5 rounded-full bg-[#9697f3]" />
            <span className="absolute bottom-8 left-14 h-3 w-3 rounded-full bg-[#f6a43a]" />
            <span className="absolute left-1/2 top-5 h-2 w-16 -translate-x-1/2 rotate-[-4deg] rounded-full bg-[#df6f98]" />

            <p className="relative text-[58px] font-black leading-none text-[#17141f] tabular-nums sm:text-[78px] lg:text-[88px]">
              {time}
            </p>
            <p className="relative mt-3 text-xs font-bold capitalize text-[#75697c] sm:text-sm">
              {date}
            </p>
            <div className="relative mx-auto mt-4 h-2.5 w-40 rounded-full bg-[#ffe48c]" />
          </div>
        </div>

        <div id="actiuni-rapide" className="relative z-10 rounded-[24px] bg-[#fbf6f1] p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#df6f98]">
                Acțiuni rapide
              </p>
              <h2 className="mt-1.5 text-2xl font-black text-[#17141f]"></h2>
            </div>
            <p className="max-w-xs text-sm font-medium leading-6 text-[#7c7081]">
            </p>
          </div>
          <MeetingTypeList />
        </div>
      </div>
    </section>
  );
};

export default Home;
