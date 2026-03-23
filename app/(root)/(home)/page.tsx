import MeetingTypeList from '@/components/MeetingTypeList';

const Home = () => {
  const now = new Date();
  const time = now.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
  const date = new Intl.DateTimeFormat('ro-RO', { dateStyle: 'full' }).format(now);

  return (
    <section className="flex size-full flex-col gap-7" style={{ color: '#1e293b' }}>

      {/* ── Hero banner ── */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, #1e2d40 0%, #243650 55%, #1a3a5c 100%)',
          minHeight: '200px',
        }}
      >
        {/* subtle grid texture */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 48px),' +
              'repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 48px)',
          }}
        />
        {/* glow */}
        <div
          className="absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-[0.08]"
          style={{ background: 'radial-gradient(circle, #4f8ef7 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)' }}
        />

        <div className="relative flex h-full flex-col justify-between px-8 py-8 lg:px-12 lg:py-10">
          {/* pill */}
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#10b981' }} />
              <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Platforma Hello English
              </span>
            </div>
          </div>

          {/* clock */}
          <div className="mt-6">
            <p
              className="font-bold leading-none tabular-nums"
              style={{ fontSize: '56px', color: '#ffffff', letterSpacing: '-2px' }}
            >
              {time}
            </p>
            <p
              className="mt-2 text-sm capitalize"
              style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.03em' }}
            >
              {date}
            </p>
          </div>
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div>
        <p className="mb-4 text-[11px] font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>
          Acțiuni rapide
        </p>
        <MeetingTypeList />
      </div>

    </section>
  );
};

export default Home;
