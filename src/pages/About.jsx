import { Link } from 'react-router-dom';
import { ArrowRight, Search, Radio, ShieldCheck } from 'lucide-react';

export default function About() {
  return (
    <article className="about-page page-content">
      <p className="eyebrow text-primary mb-4">About SpaceGuard</p>
      <h1>
        Space is complex.
        <br />
        Understanding it shouldn’t be.
      </h1>
      <p className="about-lead muted">
        SpaceGuard helps students and space enthusiasts connect a satellite’s purpose with the
        signals that describe a mission’s health.
      </p>
      <div className="grid gap-5 md:grid-cols-3 mt-10">
        {[
          {
            icon: Search,
            title: 'Find a mission',
            text: 'Search 32 curated profiles by satellite name, mission, agency, or category.',
          },
          {
            icon: Radio,
            title: 'Read the signals',
            text: 'Explore a local telemetry simulation with changing readings, pause, and recovery.',
          },
          {
            icon: ShieldCheck,
            title: 'Understand health',
            text: 'See five simple, equally weighted rules turn readings into an explainable score.',
          },
        ].map(({ icon: Icon, title, text }) => (
          <section key={title} className="panel p-6">
            <Icon className="text-primary mb-5" size={25} />
            <h2 className="mb-3">{title}</h2>
            <p className="muted">{text}</p>
          </section>
        ))}
      </div>
      <section className="about-notes panel mt-8">
        <h2>What this demo demonstrates</h2>
        <p>
          Responsive React interfaces, accessible search, route-based navigation, a REST API
          backed by Express and MongoDB, cookie-based authentication, request recovery, and
          transparent data visualization.
        </p>
        <h2>What the data means</h2>
        <p>
          Mission descriptions are curated from public agency references. “Active” labels mean
          enabled in this demonstration; SpaceGuard does not verify current operational status.
          Connections are curated by purpose and category, not physical proximity.
        </p>
        <p>
          Telemetry is simulated by the SpaceGuard server and stored in MongoDB. All profiles use a fictional teaching model.
          Archive entries can also run a simulation; those readings are not historical measurements.
          SpaceGuard is not affiliated with NASA, ISRO, or another space agency.
        </p>
        <h2>Your account and your browser</h2>
        <p>
          Your account is stored in MongoDB with a hashed password, and your session uses an
          HTTP-only cookie. Your theme, last selected mission, search, category, and a catalogue
          fallback stay in localStorage on this device. No passwords or tokens are kept there.
        </p>
      </section>
      <Link to="/" className="btn btn-primary mt-8">
        Explore missions <ArrowRight size={17} />
      </Link>
    </article>
  );
}
