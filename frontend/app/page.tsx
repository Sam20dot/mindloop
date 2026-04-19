import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex flex-col">
      <nav className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto w-full">
        <h1 className="text-2xl font-bold text-indigo-700">MindLoop</h1>
        <div className="flex gap-3">
          <Link href="/auth/login" className="text-sm font-medium text-gray-600 hover:text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors">
            Sign In
          </Link>
          <Link href="/auth/register" className="text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors">
            Get Started
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
        <div className="max-w-3xl">
          <h2 className="text-5xl font-extrabold text-gray-900 leading-tight mb-6">
            Learn. Build Skills.<br />
            <span className="text-indigo-600">Land Opportunities.</span>
          </h2>
          <p className="text-xl text-gray-500 mb-10 max-w-xl mx-auto">
            MindLoop uses AI to turn your study sessions into a career-ready portfolio, personalized roadmap, and matched opportunities.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/auth/register" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors">
              Start for Free
            </Link>
            <Link href="/auth/login" className="border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-semibold px-8 py-4 rounded-xl text-lg transition-colors">
              Sign In
            </Link>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
          {[
            { icon: '🧠', title: 'AI Questions', desc: 'Claude generates personalized questions from your study material' },
            { icon: '📈', title: 'Skill Tracking', desc: 'Every session builds your verified skill portfolio automatically' },
            { icon: '💼', title: 'Opportunities', desc: 'Get matched to jobs and freelance gigs based on your real skills' },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-left">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center text-xs text-gray-400 py-6">
        © 2026 MindLoop. Built for students everywhere.
      </footer>
    </div>
  );
}
