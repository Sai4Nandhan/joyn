import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Calendar,
  Users,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Award,
  Star,
  ArrowRight,
  Mail,
  Compass,
  X,
  Briefcase,
  BookOpen,
  HelpCircle,
  ShieldAlert,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { discoverActivitiesRequest } from '../services/activityService.js';
import { api } from '../lib/axios.js';

// SVG Logo Component
export function JoynLogo({ className = 'h-7' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 100 100" className="h-8 w-8 flex-shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="joynGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="50%" stopColor="#db2777" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="25" r="14" fill="#ea580c" />
        <path d="M50 48C50 48 24 48 24 64C24 80 44 86 50 86C56 86 76 80 76 64C76 48 50 48 50 48Z" fill="url(#joynGrad)" />
        <path d="M40 60C40 60 46 64 50 64C54 64 60 60 60 60" stroke="white" strokeWidth="6" strokeLinecap="round" />
      </svg>
      <span className="font-display text-xl font-extrabold tracking-wider text-white">
        JOYN
      </span>
    </div>
  );
}

const HERO_SLIDES = [
  {
    image: '/trekking_hero.png',
    title: 'Explore the Great Outdoors',
    tag: 'Trekking & Road Trips'
  },
  {
    image: '/sports_hero.png',
    title: 'Play Sports Matches Together',
    tag: 'Box Cricket & Football'
  },
  {
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&fit=crop',
    title: 'Watch the Latest Movies & Shows',
    tag: 'Cinema & Theater'
  },
  {
    image: '/dinner_hero.png',
    title: 'Meet Over Dinner & Drinks',
    tag: 'Restaurants & Cafes'
  },
  {
    image: '/gaming_hero.png',
    title: 'Host Epic Board Game Nights',
    tag: 'Indoor Gaming'
  }
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [searchVal, setSearchVal] = useState('');
  const [locationVal, setLocationVal] = useState('');
  const [category, setCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeInfoTopic, setActiveInfoTopic] = useState(null);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [applyingJob, setApplyingJob] = useState(null);
  const [jobForm, setJobForm] = useState({ name: '', email: '', resume: '' });
  const [jobSubmitted, setJobSubmitted] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/stats')
      .then((r) => setStats(r.data.data))
      .catch((err) => console.error('Failed to load stats', err));
  }, []);
  const activitiesSectionRef = useRef(null);
  const howItWorksRef = useRef(null);

  // Discover real activities from the DB
  useEffect(() => {
    setIsLoading(true);
    discoverActivitiesRequest({
      category: category !== 'all' ? category : undefined,
      search: searchVal || undefined,
      location: locationVal || undefined,
      page: 1,
      limit: 6,
    })
      .then((data) => setActivities(data || []))
      .catch((err) => console.error('Failed to fetch trending activities', err))
      .finally(() => setIsLoading(false));
  }, [category]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    discoverActivitiesRequest({
      category: category !== 'all' ? category : undefined,
      search: searchVal || undefined,
      location: locationVal || undefined,
      page: 1,
      limit: 6,
    })
      .then((data) => {
        setActivities(data || []);
        // Scroll to trending activities section
        activitiesSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setContactForm({ name: '', email: '', subject: '', message: '' });
      setActiveInfoTopic(null);
    }, 2500);
  };

  const handleJobSubmit = (e) => {
    e.preventDefault();
    setJobSubmitted(true);
    setTimeout(() => {
      setJobSubmitted(false);
      setJobForm({ name: '', email: '', resume: '' });
      setApplyingJob(null);
    }, 2500);
  };

  const renderModalContent = (topic) => {
    switch (topic) {
      case 'about':
        return (
          <div className="space-y-4 text-sm leading-relaxed text-slate-600">
            <p>
              <strong>JOYN</strong> is born out of a simple observation: while we are more connected digitally than ever before, we are also lonelier and more isolated in the real world.
            </p>
            <p>
              Our mission is to bridge this gap. We provide a trusted, secure, and intuitive platform designed to get people off their screens and into active, shared, real-world experiences.
            </p>
            <p>
              Whether it's a spontaneous box cricket match in your neighborhood, a weekend road trip to the beach, a quiet coffee conversation, or a board game night, JOYN brings together people with shared interests.
            </p>
            <h4 className="font-bold text-slate-800 text-base mt-6">Our Core Values</h4>
            <ul className="list-disc list-inside space-y-2">
              <li><strong className="text-slate-800">Authenticity:</strong> Every user is verified to ensure a genuine community.</li>
              <li><strong className="text-slate-800">Reliability:</strong> Our built-in trust score encourages high-quality, responsible interactions.</li>
              <li><strong className="text-slate-800">Safety:</strong> We prioritize safe spaces, verified members, and community moderation.</li>
            </ul>
          </div>
        );
      case 'careers':
        if (applyingJob) {
          return (
            <div className="space-y-4">
              <button type="button" onClick={() => setApplyingJob(null)} className="text-xs font-bold text-pink-600 hover:underline mb-2">← Back to listings</button>
              <h4 className="font-bold text-slate-900 text-base">Applying for {applyingJob.title}</h4>
              {jobSubmitted ? (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-6 text-center space-y-2">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
                  <p className="font-bold text-slate-800 text-sm">Application Submitted Successfully!</p>
                  <p className="text-xs text-slate-500">Thank you for applying. Our talent team will review your application shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleJobSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={jobForm.name}
                      onChange={(e) => setJobForm({ ...jobForm, name: e.target.value })}
                      className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none focus:border-pink-500 text-slate-800 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={jobForm.email}
                      onChange={(e) => setJobForm({ ...jobForm, email: e.target.value })}
                      className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none focus:border-pink-500 text-slate-800 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Tell us about yourself / paste LinkedIn URL</label>
                    <textarea
                      required
                      value={jobForm.resume}
                      onChange={(e) => setJobForm({ ...jobForm, resume: e.target.value })}
                      rows={4}
                      className="w-full border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-pink-500 text-slate-800 bg-white"
                      placeholder="Share a short bio, experience or links..."
                    />
                  </div>
                  <button type="submit" className="w-full h-10 bg-joyn-gradient text-white rounded-xl text-xs font-bold hover:opacity-90">
                    Submit Application
                  </button>
                </form>
              )}
            </div>
          );
        }
        return (
          <div className="space-y-6">
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 text-slate-600">
              <p className="text-xs leading-relaxed">
                We are a remote-first, passionate team of builders, designers, and community organizers dedicated to solving the real-world loneliness epidemic. Join us!
              </p>
            </div>
            <div className="space-y-4">
              {[
                { title: 'Full Stack Engineer (Growth)', type: 'Remote (India)', spec: 'Build clean, high-performance web systems using React, Node, and MongoDB. Optimize virality and signup flows.' },
                { title: 'Lead Product Designer', type: 'Remote / Hybrid (Bangalore)', spec: 'Own the end-to-end design systems of our web apps, interaction flows, and local activity workspaces.' },
                { title: 'Community Operations Specialist', type: 'Full-time (Hyderabad)', spec: 'Moderate reports, verify identity documents, support event hosts, and lead community outreach initiatives.' }
              ].map((job) => (
                <div key={job.title} className="p-4 rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all flex justify-between items-start gap-4 text-left">
                  <div className="space-y-1">
                    <h5 className="font-bold text-slate-800 text-sm">{job.title}</h5>
                    <span className="text-[10px] text-pink-600 font-bold bg-pink-50 px-2 py-0.5 rounded-full">{job.type}</span>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">{job.spec}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setApplyingJob(job)}
                    className="flex-shrink-0 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-xl"
                  >
                    Apply
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      case 'blog':
        return (
          <div className="space-y-6">
            {[
              { title: 'How to Build an Ultra-Trustworthy Profile on JOYN', date: 'August 5, 2026', read: '4 min read', desc: 'Tips on identity verification, keeping a high attendance rate, and receiving 5-star ratings from your activity members.' },
              { title: 'Top 10 Spontaneous Activities to Do in Hyderabad on Weekends', date: 'July 28, 2026', read: '6 min read', desc: 'A curated list of local turfs, road trip trails, board game clubs, and scenic dining spots for weekend group hangouts.' },
              { title: 'Why Offline Interaction is Essential for Mental Well-being', date: 'July 15, 2026', read: '5 min read', desc: 'Exploring the science of micro-connections, shared physical activity, and how digital-only social networks fall short.' }
            ].map((post, idx) => (
              <article key={idx} className="p-4 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-all space-y-2 text-left group">
                <span className="text-[10px] text-slate-400 font-semibold">{post.date} · {post.read}</span>
                <h4 className="font-bold text-slate-900 text-sm group-hover:text-pink-600 transition-colors">{post.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{post.desc}</p>
              </article>
            ))}
          </div>
        );
      case 'press':
        return (
          <div className="space-y-6 text-sm text-slate-600 leading-relaxed text-left">
            <div className="p-4 border-l-4 border-pink-500 bg-pink-50/10 space-y-1.5 rounded-r-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase">August 2026</span>
              <h4 className="font-bold text-slate-900 text-sm">JOYN Raises $5M Seed Round to Expand Real-World Activities</h4>
              <p className="text-xs">
                Hyderabad-based JOYN closed a $5M seed round led by major venture funds to scale the community-verified activity discovery model to 5 new metros across India.
              </p>
            </div>
            <div className="p-4 border-l-4 border-purple-500 bg-purple-50/10 space-y-1.5 rounded-r-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase">June 2026</span>
              <h4 className="font-bold text-slate-900 text-sm">JOYN Crosses 50,000 Active Members milestone</h4>
              <p className="text-xs">
                In just under six months, JOYN has facilitated over 10,000 successfully completed small group gatherings ranging from turf football to highway road trips.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 text-xs">
              <p className="font-semibold text-slate-800">Media & Press Inquiries:</p>
              <p>Email: <a href="mailto:press@joyn.com" className="text-pink-600 hover:underline">press@joyn.com</a></p>
            </div>
          </div>
        );
      case 'help':
        return (
          <div className="space-y-4 text-left">
            {[
              { q: 'How do I request to join an activity?', a: 'Browse the trending activities list or search by category and location. Click the activity card, then click "Request to Join" and submit a brief message. The host will review your request and trust score before approving.' },
              { q: 'How is the Trust Score calculated?', a: 'Your trust score starts at a baseline of 50. It increases with identity verification (+5), hosting activities, and receiving positive member reviews. It decreases if you cancel events inside 24 hours, don\'t show up, or have reports filed against you.' },
              { q: 'Can I split expenses for group activities?', a: 'Yes! Every activity room unlocks a shared "Trip Workspace" panel. From there, you can log expenses (with automatic equal division calculation), build checklists, and create polls for venue/time selection.' },
              { q: 'What happens if a user is a no-show?', a: 'When the host marks an activity completed, they select who attended. Any approved member marked as a no-show receives a penalty on their stats, causing a significant drop in their public trust score.' }
            ].map((faq, idx) => (
              <div key={idx} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-2">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4 text-pink-500 flex-shrink-0" />
                  {faq.q}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed pl-5">{faq.a}</p>
              </div>
            ))}
          </div>
        );
      case 'safety':
        return (
          <div className="space-y-5 text-xs text-slate-600 leading-relaxed text-left">
            <p className="text-sm">We take community safety extremely seriously. Here are our guidelines for safe, comfortable offline meetups:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-800 text-xs block">Verify Identity</span>
                <p>Prioritize joining activities hosted by members with the green "Verified Identity" badge. You can submit your own government ID in settings to build mutual trust.</p>
              </div>
              <div className="p-4 rounded-2xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-800 text-xs block">Meet in Public Spaces</span>
                <p>Never agree to meet for the first time in private locations, isolated areas, or late-night unverified spots. Use public turfs, popular cafes, or designated hubs.</p>
              </div>
              <div className="p-4 rounded-2xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-800 text-xs block">Keep Friends Informed</span>
                <p>Always tell a family member or friend where you are heading, who you are meeting, and when you expect to return. Share a link to the activity details page.</p>
              </div>
              <div className="p-4 rounded-2xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-800 text-xs block">Flag Suspicious Behavior</span>
                <p>If a host or attendee behaves inappropriately, requests private payments, or spam listings, click the "Report" icon immediately. Our moderation queue runs 24/7.</p>
              </div>
            </div>
          </div>
        );
      case 'guidelines':
        return (
          <div className="space-y-4 text-xs text-slate-600 leading-relaxed text-left">
            <h4 className="font-bold text-slate-800 text-sm">JOYN Community Code of Conduct</h4>
            <p>Our goal is to build an active, positive community. All members must adhere to the following principles:</p>
            <ul className="list-decimal list-inside space-y-3 pt-2">
              <li><strong className="text-slate-800">Respect & Inclusivity:</strong> Treat all organizers and participants with respect, regardless of background, gender, or belief. Zero tolerance for harassment or discrimination.</li>
              <li><strong className="text-slate-800">Reliability & Commitment:</strong> If you are approved for an activity, show up! No-shows ruin events. If you must cancel, do so at least 24 hours in advance.</li>
              <li><strong className="text-slate-800">Safety & Compliance:</strong> Do not post illegal, commercial, or unsafe events. All organizers must list accurate meeting locations and details.</li>
              <li><strong className="text-slate-800">No Self-Promotion:</strong> JOYN is for genuine offline meetups. Do not spam chatrooms with business advertisements or promotional campaigns.</li>
            </ul>
          </div>
        );
      case 'contact':
        return (
          <div className="space-y-4 text-left">
            {contactSubmitted ? (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-6 text-center space-y-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
                <p className="font-bold text-slate-800 text-sm">Message Sent Successfully!</p>
                <p className="text-xs text-slate-500">Thank you for writing. A customer support agent will reply to your email within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none focus:border-pink-500 text-slate-800 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none focus:border-pink-500 text-slate-800 bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none focus:border-pink-500 text-slate-800 bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Your Message</label>
                  <textarea
                    required
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    rows={4}
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-pink-500 text-slate-800 bg-white"
                    placeholder="Describe how we can help you..."
                  />
                </div>
                <button type="submit" className="w-full h-10 bg-joyn-gradient text-white rounded-xl text-xs font-bold hover:opacity-90 flex items-center justify-center gap-1.5">
                  <Send className="h-3.5 w-3.5" /> Send Message
                </button>
              </form>
            )}
          </div>
        );
      case 'terms':
        return (
          <div className="space-y-4 text-xs text-slate-500 leading-relaxed max-h-[40vh] overflow-y-auto pr-2 text-left">
            <h4 className="font-bold text-slate-800 text-sm">1. Terms of Service Acceptance</h4>
            <p>By accessing or using the JOYN application, you agree to comply with and be bound by these Terms of Service. If you do not agree, you must not use our platform.</p>
            <h4 className="font-bold text-slate-800 text-sm">2. Verification & Safety Responsibility</h4>
            <p>While JOYN facilitates identity checks, members join offline activities at their own risk. JOYN is not responsible for real-life interactions, damages, or injuries during meetups.</p>
            <h4 className="font-bold text-slate-800 text-sm">3. No-Show & Reliability Policy</h4>
            <p>Our algorithms calculate trust based on attendance. Excessive last-minute cancellations or no-shows may lead to permanent suspension of profile privileges.</p>
            <h4 className="font-bold text-slate-800 text-sm">4. Account Moderation</h4>
            <p>We reserve the right to suspend or terminate accounts that violate community rules, harassment clauses, or run fake activities.</p>
          </div>
        );
      case 'privacy':
        return (
          <div className="space-y-4 text-xs text-slate-500 leading-relaxed max-h-[40vh] overflow-y-auto pr-2 text-left">
            <h4 className="font-bold text-slate-800 text-sm">1. Personal Information Collection</h4>
            <p>We collect registration data (name, email) and location information to display nearby activities. Location coordinates are generalized for search privacy.</p>
            <h4 className="font-bold text-slate-800 text-sm">2. Identity Verification Files</h4>
            <p>When you submit government ID for verification, the files are processed securely by our trust team and permanently deleted immediately after checks resolve.</p>
            <h4 className="font-bold text-slate-800 text-sm">3. Third-party Sharing</h4>
            <p>We do not sell your personal data. Chat logs and meeting RSVPs are visible only to the hosts and approved group members of those respective activities.</p>
          </div>
        );
      case 'cookies':
        return (
          <div className="space-y-4 text-xs text-slate-500 leading-relaxed max-h-[40vh] overflow-y-auto pr-2 text-left">
            <h4 className="font-bold text-slate-800 text-sm">1. Use of Cookies</h4>
            <p>We use essential cookies to maintain login sessions and security tokens. We use analytic cookies to measure platform load and speed.</p>
            <h4 className="font-bold text-slate-800 text-sm">2. Session Persistence</h4>
            <p>Our refresh token system persists sessions securely in httpOnly cookies, protecting your account from XSS token theft.</p>
          </div>
        );
      case 'rating':
        return (
          <div className="space-y-4 text-xs text-slate-500 leading-relaxed text-left">
            <h4 className="font-bold text-slate-800 text-sm">98% Community Satisfaction Rating</h4>
            <p>We hold our community members to high behavioral and reliability standards. 98% of all completed activities on JOYN are rated 4 or 5 stars by their attendees.</p>
            <p>Our trust system automatically flags inactive or low-rated hosts, keeping our community active and premium.</p>
          </div>
        );
      case 'verified':
        return (
          <div className="space-y-4 text-xs text-slate-500 leading-relaxed text-left">
            <h4 className="font-bold text-slate-800 text-sm">Verified Profile System</h4>
            <p>Identity verification is a voluntary but highly recommended step. Members submit an official government-issued ID card which is manually verified by our safety team.</p>
            <p>Once verified, the document is permanently deleted from our servers, and the member receives a green checkmark badge next to their name. This helps eliminate catfish accounts, spam, and offline safety concerns.</p>
          </div>
        );
      case 'trust':
        return (
          <div className="space-y-4 text-xs text-slate-500 leading-relaxed text-left">
            <h4 className="font-bold text-slate-800 text-sm">JOYN Trust Scores</h4>
            <p>Every member starts with a baseline trust score of 50/100. The score fluctuates dynamically based on community signals:</p>
            <ul className="list-disc list-inside space-y-1 pt-1">
              <li>Identity Verification (+5)</li>
              <li>Successfully hosting/attending activities (+1 to +2 per event)</li>
              <li>Receiving 5-star feedback from other participants (+1)</li>
              <li>Last-minute cancellations (-10 if cancelled within 24 hours)</li>
              <li>Unexcused no-shows (-20 trust score penalty)</li>
            </ul>
          </div>
        );
      case 'noshow':
        return (
          <div className="space-y-4 text-xs text-slate-500 leading-relaxed text-left">
            <h4 className="font-bold text-slate-800 text-sm">No-Show & Attendance Protection</h4>
            <p>To respect everyone's time, hosts log attendance when marking an activity complete. Any approved participant who fails to attend without communicating gets marked as a no-show.</p>
            <p>A no-show registers a severe -20 deduction in their public Trust Score. Consistently unreliable participants are restricted from requesting to join future activities.</p>
          </div>
        );
      case 'reviews':
        return (
          <div className="space-y-4 text-xs text-slate-500 leading-relaxed text-left">
            <h4 className="font-bold text-slate-800 text-sm">Activity Review Guidelines</h4>
            <p>After a real-life meetup concludes, participants and hosts rate each other from 1 to 5 stars and can leave optional constructive feedback.</p>
            <p>These ratings are completely private and are aggregated to build the public Trust Score. Consistent positive ratings increase visibility, while poor reviews generate moderation flags.</p>
          </div>
        );
      case 'step1':
        return (
          <div className="space-y-4 text-xs text-slate-500 leading-relaxed text-left">
            <h4 className="font-bold text-slate-800 text-sm">Step 1: Create an Activity</h4>
            <p>Choose an exciting category (sports, trips, dining, study, gaming) and write a clear, descriptive title. Set dates, times, participant limits, and specify the exact meeting details.</p>
            <p>Hosts can also specify preferences, such as age ranges, group limits, or verification requirements.</p>
          </div>
        );
      case 'step2':
        return (
          <div className="space-y-4 text-xs text-slate-500 leading-relaxed text-left">
            <h4 className="font-bold text-slate-800 text-sm">Step 2: People Discover Nearby</h4>
            <p>Your activity is published to the public feed. Users matching your city filter can search by category and approximate location. Only generalized geolocations are shown to protect host privacy before approval.</p>
          </div>
        );
      case 'step3':
        return (
          <div className="space-y-4 text-xs text-slate-500 leading-relaxed text-left">
            <h4 className="font-bold text-slate-800 text-sm">Step 3: Host Approval Queue</h4>
            <p>Interested members click "Request to Join" and submit a brief message explaining why they want to participate. As the host, you review their public profile, trust score, and message before approving or rejecting.</p>
          </div>
        );
      case 'step4':
        return (
          <div className="space-y-4 text-xs text-slate-500 leading-relaxed text-left">
            <h4 className="font-bold text-slate-800 text-sm">Step 4: Meet & Enjoy in Real Life</h4>
            <p>Once approved, members gain access to the private activity room. Here, they can chat, coordinate through collaborative checklists, split costs automatically, and gather safely at the designated location.</p>
          </div>
        );
      case 'step5':
        return (
          <div className="space-y-4 text-xs text-slate-500 leading-relaxed text-left">
            <h4 className="font-bold text-slate-800 text-sm">Step 5: Rate & Grow Together</h4>
            <p>Once the event concludes, hosts mark it complete and log attendance. All participants review each other, reinforcing reliability, safety, and community trust scores.</p>
          </div>
        );
      case 'testimonial_ananya':
        return (
          <div className="space-y-4 text-xs text-slate-500 leading-relaxed text-left">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
              <img src="https://api.dicebear.com/9.x/avataaars/svg?seed=Ananya" alt="Ananya" className="h-12 w-12 rounded-full bg-slate-100" />
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  Ananya P.
                  <span className="inline-flex items-center rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">Verified</span>
                </h4>
                <p className="text-[10px] text-slate-400">Hyderabad, India</p>
              </div>
            </div>
            <p><strong>Trust Score:</strong> 98/100 (Exceptional)</p>
            <p><strong>Member Spotlight:</strong> Ananya regularly organizes weekend trekking trips and coffee socials in Hyderabad. She has hosted 16 activities with zero cancellations and a perfect 4.9-star average participant rating.</p>
          </div>
        );
      case 'testimonial_rahul':
        return (
          <div className="space-y-4 text-xs text-slate-500 leading-relaxed text-left">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
              <img src="https://api.dicebear.com/9.x/avataaars/svg?seed=Rahul" alt="Rahul" className="h-12 w-12 rounded-full bg-slate-100" />
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  Rahul M.
                  <span className="inline-flex items-center rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">Verified</span>
                </h4>
                <p className="text-[10px] text-slate-400">Vizag, India</p>
              </div>
            </div>
            <p><strong>Trust Score:</strong> 95/100 (Highly Reliable)</p>
            <p><strong>Member Spotlight:</strong> Rahul is a frequent participant in sports matches and carpool road trips around Vizag. He has completed 9 activities and is recognized as a supportive and punctual attendee.</p>
          </div>
        );
      case 'testimonial_sneha':
        return (
          <div className="space-y-4 text-xs text-slate-500 leading-relaxed text-left">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
              <img src="https://api.dicebear.com/9.x/avataaars/svg?seed=Sneha" alt="Sneha" className="h-12 w-12 rounded-full bg-slate-100" />
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  Sneha K.
                  <span className="inline-flex items-center rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">Verified</span>
                </h4>
                <p className="text-[10px] text-slate-400">Bangalore, India</p>
              </div>
            </div>
            <p><strong>Trust Score:</strong> 99/100 (Top Member)</p>
            <p><strong>Member Spotlight:</strong> Sneha hosts popular board game nights and book discussion groups in Bangalore. She has completed 22 activities and has a flawless 5.0-star hosting rating.</p>
          </div>
        );
      default:
        return null;
    }
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  const categories = [
    { value: 'trips', label: 'Trips', count: '234 activities', icon: '⛺' },
    { value: 'sports', label: 'Sports', count: '132 activities', icon: '⚽' },
    { value: 'social', label: 'Social', count: '321 activities', icon: '👋' },
    { value: 'travel', label: 'Travel', count: '421 activities', icon: '🚗' },
    { value: 'trekking', label: 'Trekking', count: '186 activities', icon: '🥾' },
    { value: 'photography', label: 'Photography', count: '287 activities', icon: '📷' },
    { value: 'gaming', label: 'Gaming', count: '196 activities', icon: '🎮' },
    { value: 'study', label: 'Study Groups', count: '203 activities', icon: '📚' },
  ];

  const benefits = [
    { title: 'Verified Profiles', desc: 'Real people. Verified by us.', icon: ShieldCheck, topic: 'verified' },
    { title: 'Trust Score', desc: 'Build your reputation with every activity.', icon: Star, topic: 'trust' },
    { title: 'Safe Community', desc: 'We prioritize your safety always.', icon: ShieldCheck, topic: 'safety' },
    { title: 'Activity Reviews', desc: 'Honest reviews from real participants.', icon: Award, topic: 'reviews' },
    { title: 'No-show Protection', desc: 'Reliable members. No time waste.', icon: ShieldCheck, topic: 'noshow' },
    { title: 'Community Reputation', desc: 'Better community. Better experiences.', icon: Award, topic: 'guidelines' },
  ];

  const steps = [
    { id: 1, title: 'Create Activity', desc: 'Host an activity and set your preferences' },
    { id: 2, title: 'People Discover', desc: 'People find and request to join' },
    { id: 3, title: 'Host Approval', desc: 'You review and approve members' },
    { id: 4, title: 'Meet & Enjoy', desc: 'Connect in real life and have fun' },
    { id: 5, title: 'Rate & Grow', desc: 'Share feedback and build trust' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-pink-500 selection:text-white">
      {/* Dynamic Hero Gradient Block */}
      <div className="bg-joyn-hero-gradient relative overflow-hidden pb-20 pt-6 text-white lg:pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(124,58,237,0.1),transparent_40%)]" />

        {/* Brand Header */}
        <header className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="flex h-20 items-center justify-between">
            <Link to="/">
              <JoynLogo />
            </Link>

            {/* Navigation Menu Links */}
            <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-300 md:flex">
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-white hover:text-pink-500 transition-colors">Home</button>
              <button onClick={() => activitiesSectionRef.current?.scrollIntoView({ behavior: 'smooth' })} className="text-slate-300 hover:text-pink-500 transition-colors">Explore</button>
              <button onClick={() => activitiesSectionRef.current?.scrollIntoView({ behavior: 'smooth' })} className="text-slate-300 hover:text-pink-500 transition-colors">Activities</button>
              <button onClick={() => howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' })} className="text-slate-300 hover:text-pink-500 transition-colors">How it works</button>
              <button onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })} className="text-slate-300 hover:text-pink-500 transition-colors">About us</button>
            </nav>

            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm font-bold text-white hover:text-pink-500 transition-colors">
                Login
              </Link>
              <Link to="/register" className="bg-joyn-gradient rounded-full px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.03] active:scale-[0.98]">
                Sign Up
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section Body */}
        <div className="relative z-10 mx-auto mt-12 max-w-7xl px-6 lg:mt-20">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div className="space-y-8 text-center lg:text-left">
              <div className="space-y-4">
                <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                  Find Your People. <br />
                  <span className="bg-joyn-gradient bg-clip-text text-transparent">Do More Together.</span>
                </h1>
                <p className="mx-auto max-w-lg text-base text-slate-300 sm:text-lg lg:mx-0">
                  Discover real-world activities with people you can trust. Build your reputation and meet verified community members safely.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 lg:justify-start">
                <button
                  onClick={() => activitiesSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-joyn-gradient flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold shadow-lg transition-transform hover:scale-[1.03] active:scale-[0.98]"
                >
                  Explore Activities <ArrowRight className="h-4 w-4" />
                </button>
                <Link
                  to="/activities/new"
                  className="bg-slate-800 hover:bg-slate-700 flex items-center gap-2 rounded-full border border-slate-700 px-7 py-3.5 text-sm font-bold transition-colors"
                >
                  Create Activity <span className="text-xs">➕</span>
                </Link>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-6 pt-8 text-left sm:grid-cols-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveInfoTopic('help')}
                  className="group flex flex-col text-left hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  <p className="text-3xl font-extrabold bg-joyn-gradient bg-clip-text text-transparent">12K+</p>
                  <p className="text-xs text-slate-400 font-semibold mt-1 group-hover:text-white transition-colors">Activities Completed</p>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInfoTopic('verified')}
                  className="group flex flex-col text-left hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  <p className="text-3xl font-extrabold bg-joyn-gradient bg-clip-text text-transparent">45K+</p>
                  <p className="text-xs text-slate-400 font-semibold mt-1 group-hover:text-white transition-colors">Verified Users</p>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInfoTopic('help')}
                  className="group flex flex-col text-left hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  <p className="text-3xl font-extrabold bg-joyn-gradient bg-clip-text text-transparent">120+</p>
                  <p className="text-xs text-slate-400 font-semibold mt-1 group-hover:text-white transition-colors">Cities</p>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInfoTopic('rating')}
                  className="group flex flex-col text-left hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  <p className="text-3xl font-extrabold bg-joyn-gradient bg-clip-text text-transparent">98%</p>
                  <p className="text-xs text-slate-400 font-semibold mt-1 group-hover:text-white transition-colors">Community Rating</p>
                </button>
              </div>
            </div>

            {/* Hero Right Visual Banner with Auto-scroll */}
            <div className="relative lg:block h-[450px] w-full select-none">
              <div className="bg-joyn-gradient absolute -inset-2 rounded-[2.5rem] opacity-35 blur-xl" />
              
              <div className="relative z-10 w-full h-full rounded-[2rem] overflow-hidden border border-slate-800 shadow-2xl bg-slate-900">
                {HERO_SLIDES.map((slide, index) => {
                  const isActive = index === currentSlide;
                  return (
                    <div
                      key={index}
                      className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                        isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
                      }`}
                    >
                      <img
                        src={slide.image}
                        alt={slide.title}
                        className="w-full h-full object-cover"
                      />
                      {/* Dark overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      
                      {/* Text info badge */}
                      <div className="absolute bottom-8 left-8 right-8 text-left space-y-2">
                        <span className="inline-block bg-joyn-gradient rounded-full px-3 py-1 text-[10px] font-bold tracking-wider uppercase text-white shadow-md">
                          {slide.tag}
                        </span>
                        <h3 className="text-xl font-extrabold text-white tracking-tight drop-shadow-sm">
                          {slide.title}
                        </h3>
                      </div>
                    </div>
                  );
                })}

                {/* Progress Indicators */}
                <div className="absolute bottom-4 right-8 z-20 flex gap-1.5">
                  {HERO_SLIDES.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className="h-1.5 rounded-full transition-all focus:outline-none"
                      style={{
                        width: index === currentSlide ? '24px' : '6px',
                        backgroundColor: index === currentSlide ? '#db2777' : 'rgba(255,255,255,0.4)',
                      }}
                      title={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Search Widget */}
        <div className="relative z-20 mx-auto -bottom-24 max-w-4xl px-4">
          <form
            onSubmit={handleSearchSubmit}
            className="rounded-3xl bg-[#0D1026]/90 backdrop-blur-xl border border-purple-500/20 p-3 sm:p-4 shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col md:flex-row items-center gap-3 transition-all duration-300 hover:border-purple-500/40"
          >
            {/* What are you looking for */}
            <div className="flex-1 w-full text-left px-3 py-1.5 rounded-2xl transition-colors hover:bg-white/5 focus-within:bg-white/5">
              <label className="block text-[10px] uppercase font-bold tracking-widest text-pink-400 mb-1">
                What are you looking for?
              </label>
              <div className="relative flex items-center gap-2.5">
                <Search className="h-4 w-4 text-purple-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search activities, people or places..."
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  className="w-full bg-transparent text-sm text-white placeholder-slate-400/80 outline-none focus:outline-none focus:ring-0 border-none focus:border-none ring-0 shadow-none"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="h-8 w-px bg-purple-900/30 hidden md:block" />

            {/* Location */}
            <div className="w-full md:w-56 text-left px-3 py-1.5 rounded-2xl transition-colors hover:bg-white/5 focus-within:bg-white/5">
              <label className="block text-[10px] uppercase font-bold tracking-widest text-pink-400 mb-1">
                Location
              </label>
              <div className="relative flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-purple-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Near me +"
                  value={locationVal}
                  onChange={(e) => setLocationVal(e.target.value)}
                  className="w-full bg-transparent text-sm text-white placeholder-slate-400/80 outline-none focus:outline-none focus:ring-0 border-none focus:border-none ring-0 shadow-none"
                />
              </div>
            </div>

            {/* Search Button */}
            <button
              type="submit"
              className="h-11 w-11 rounded-2xl bg-gradient-to-r from-[#7c3aed] via-[#db2777] to-[#ea580c] flex items-center justify-center text-white shadow-lg shadow-purple-900/40 transition-all hover:scale-105 active:scale-95 shrink-0"
              title="Search activities"
            >
              <Search className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>

      {/* Trending Activities Section */}
      <section ref={activitiesSectionRef} className="max-w-7xl mx-auto px-6 pt-44 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Trending Activities</h2>
            <p className="text-sm text-slate-500 mt-1">See what's happening around you</p>
          </div>
          <button onClick={() => setCategory('all')} className="text-sm font-bold text-pink-600 hover:text-pink-500 transition-colors flex items-center gap-1">
            View all <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-80 bg-white rounded-3xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200/80 rounded-[2.5rem] shadow-sm max-w-xl mx-auto px-6">
            <div className="h-16 w-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6 text-pink-500 shadow-inner">
              <Compass className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No activities in this area yet</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Why not break the ice? Host a cricket game, plan a weekend trip, or gather for coffee. It takes less than a minute!
            </p>
            <Link to="/register" className="bg-joyn-gradient text-white rounded-full px-6 py-2.5 text-xs font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-transform inline-flex items-center gap-1.5 mt-6">
              Create an Activity <span className="text-xs">➕</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((a) => (
              <Link
                key={a.id}
                to={`/activities/${a.id}`}
                className="group bg-white rounded-[2rem] border border-slate-200/80 p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative w-full rounded-[1.5rem] overflow-hidden aspect-[4/3] bg-slate-100 mb-4">
                    <img
                      src={a.coverImageUrl || 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=500'}
                      alt={a.title}
                      className="w-full h-full object-cover transition-transform duration-350 group-hover:scale-[1.03]"
                    />
                    <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                      {a.category}
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900 line-clamp-1 group-hover:text-pink-600 transition-colors">
                    {a.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {a.description}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <img
                      src={a.host?.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(a.host?.name || 'host')}`}
                      alt={a.host?.name}
                      className="h-6 w-6 rounded-full border border-slate-200"
                    />
                    <span className="font-medium text-slate-700 truncate max-w-[100px]">{a.host?.name}</span>
                    <span className="text-[10px] text-pink-600 font-bold bg-pink-50 px-1.5 py-0.5 rounded">
                      ★{a.host?.trustScore || 50}
                    </span>
                  </div>
                  <span className="font-semibold text-slate-800">
                    {a.participantsCount || 1} joined
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* How JOYN Works Section */}
      <section ref={howItWorksRef} className="bg-slate-950 text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.06),transparent_60%)]" />
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center space-y-16">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">How <span className="bg-joyn-gradient bg-clip-text text-transparent">JOYN</span> Works</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto">Simple steps to unforgettable experiences</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {steps.map((step) => (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveInfoTopic(`step${step.id}`)}
                className="space-y-4 flex flex-col items-center hover:opacity-90 active:scale-[0.98] transition-all text-center w-full select-none group"
              >
                <div className="h-12 w-12 rounded-full border border-pink-500/30 flex items-center justify-center text-sm font-bold bg-slate-900 text-pink-500 shadow-lg shadow-pink-500/10 group-hover:scale-105 transition-transform">
                  {step.id}
                </div>
                <h3 className="font-bold text-base text-white group-hover:text-pink-500 transition-colors">{step.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-[180px]">{step.desc}</p>
              </button>
            ))}
          </div>

          <Link to="/register" className="bg-joyn-gradient inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold shadow-lg shadow-pink-500/20 hover:scale-[1.02] active:scale-[0.98] transition-transform">
            Learn More <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Explore by Categories */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="space-y-4 mb-12">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Explore by Categories</h2>
          <p className="text-sm text-slate-500">Find activities that match your vibe</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map((c) => (
            <button
              key={c.value}
              onClick={() => {
                setCategory(c.value);
                activitiesSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`rounded-2xl border p-5 flex flex-col items-center justify-between text-center transition-all ${
                category === c.value
                  ? 'border-pink-500 bg-pink-50/20'
                  : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <span className="text-3xl mb-3">{c.icon}</span>
              <div>
                <p className="text-xs font-bold text-slate-900">{c.label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{c.count}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Why JOYN is Different */}
      <section className="bg-white border-y border-slate-200/80 py-24">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-16">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Why <span className="bg-joyn-gradient bg-clip-text text-transparent">JOYN</span> is Different</h2>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">A trusted community for real connections</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((b, i) => {
              const { icon: Icon } = b;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveInfoTopic(b.topic)}
                  className="flex flex-col items-center text-center p-5 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:shadow-card hover:border-slate-200 active:scale-[0.98] transition-all w-full select-none group"
                >
                  <div className="h-10 w-10 rounded-full bg-pink-50 flex items-center justify-center text-pink-600 mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-pink-600 transition-colors">{b.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mt-2 max-w-[200px]">{b.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center space-y-14">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Loved by People Like You</h2>
          <p className="text-sm text-slate-500">Real stories from real people</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <button
            type="button"
            onClick={() => setActiveInfoTopic('testimonial_ananya')}
            className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-sm transition-all text-left active:scale-[0.98] w-full select-none"
          >
            <p className="text-xs text-slate-600 leading-relaxed">
              "JOYN helped me find amazing people to travel with. The community is super friendly and trustworthy."
            </p>
            <div className="mt-6 flex items-center gap-3">
              <img src="https://api.dicebear.com/9.x/avataaars/svg?seed=Ananya" alt="Ananya" className="h-9 w-9 rounded-full bg-slate-100" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Ananya P.</h4>
                <p className="text-[10px] text-slate-400">Hyderabad, India</p>
              </div>
              <div className="ml-auto text-amber-500 text-xs">★★★★★ 5.0</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveInfoTopic('testimonial_rahul')}
            className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-sm transition-all text-left active:scale-[0.98] w-full select-none"
          >
            <p className="text-xs text-slate-600 leading-relaxed">
              "From football games to weekend trips, I've met some of my best friends on JOYN!"
            </p>
            <div className="mt-6 flex items-center gap-3">
              <img src="https://api.dicebear.com/9.x/avataaars/svg?seed=Rahul" alt="Rahul" className="h-9 w-9 rounded-full bg-slate-100" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Rahul M.</h4>
                <p className="text-[10px] text-slate-400">Vizag, India</p>
              </div>
              <div className="ml-auto text-amber-500 text-xs">★★★★★ 4.9</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveInfoTopic('testimonial_sneha')}
            className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-sm transition-all text-left active:scale-[0.98] w-full select-none"
          >
            <p className="text-xs text-slate-600 leading-relaxed">
              "The verified profile system makes it so safe and comfortable to join new activities."
            </p>
            <div className="mt-6 flex items-center gap-3">
              <img src="https://api.dicebear.com/9.x/avataaars/svg?seed=Sneha" alt="Sneha" className="h-9 w-9 rounded-full bg-slate-100" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Sneha K.</h4>
                <p className="text-[10px] text-slate-400">Bangalore, India</p>
              </div>
              <div className="ml-auto text-amber-500 text-xs">★★★★★ 5.0</div>
            </div>
          </button>
        </div>
      </section>

      {/* Ready to Meet banner */}
      <section className="bg-slate-950 py-16 text-white text-center">
        <div className="max-w-4xl mx-auto px-6 bg-joyn-gradient rounded-[2.5rem] p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="text-left space-y-2">
            <h2 className="text-2xl font-extrabold">Ready to Meet, Move & Repeat?</h2>
            <p className="text-xs text-white/95 max-w-sm">Join thousands of people creating unforgettable memories together.</p>
          </div>
          <Link to="/register" className="bg-slate-950 text-white rounded-full px-7 py-3.5 text-xs font-bold hover:bg-slate-900 transition-colors flex-shrink-0">
            Get Started Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10 border-b border-slate-900 pb-12 mb-8">
          <div className="space-y-4">
            <JoynLogo />
            <p className="text-xs leading-relaxed max-w-xs">
              JOYN is a platform to discover, create and join real-world activities with verified people near you.
            </p>
          </div>

          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-2 text-xs">
              <li><button type="button" onClick={() => setActiveInfoTopic('about')} className="hover:text-white transition-colors text-left">About Us</button></li>
              <li><button type="button" onClick={() => setActiveInfoTopic('careers')} className="hover:text-white transition-colors text-left">Careers</button></li>
              <li><button type="button" onClick={() => setActiveInfoTopic('blog')} className="hover:text-white transition-colors text-left">Blog</button></li>
              <li><button type="button" onClick={() => setActiveInfoTopic('press')} className="hover:text-white transition-colors text-left">Press</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4">Support</h4>
            <ul className="space-y-2 text-xs">
              <li><button type="button" onClick={() => setActiveInfoTopic('help')} className="hover:text-white transition-colors text-left">Help Center</button></li>
              <li><button type="button" onClick={() => setActiveInfoTopic('safety')} className="hover:text-white transition-colors text-left">Safety</button></li>
              <li><button type="button" onClick={() => setActiveInfoTopic('guidelines')} className="hover:text-white transition-colors text-left">Community Guidelines</button></li>
              <li><button type="button" onClick={() => setActiveInfoTopic('contact')} className="hover:text-white transition-colors text-left">Contact Us</button></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">Subscribe to our newsletter</h4>
            <p className="text-xs">Get the latest updates and exciting activities near you.</p>
            {subscribed ? (
              <p className="text-xs text-pink-500 font-bold">✓ Subscribed successfully!</p>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-900 rounded-lg px-3 py-2 text-xs text-white border border-slate-800 outline-none w-full focus:border-pink-500"
                />
                <button type="submit" className="bg-joyn-gradient rounded-lg px-3 flex items-center justify-center text-white">
                  →
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <p>© 2026 JOYN. All rights reserved.</p>
          <div className="flex gap-4">
            <button type="button" onClick={() => setActiveInfoTopic('terms')} className="hover:text-white transition-colors">Terms of Service</button>
            <span>·</span>
            <button type="button" onClick={() => setActiveInfoTopic('privacy')} className="hover:text-white transition-colors">Privacy Policy</button>
            <span>·</span>
            <button type="button" onClick={() => setActiveInfoTopic('cookies')} className="hover:text-white transition-colors">Cookie Policy</button>
          </div>
        </div>
      </footer>

      {/* Informational Modal */}
      {activeInfoTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div
            className="relative w-full max-w-2xl max-h-[85vh] rounded-[2rem] bg-white border border-slate-200/80 shadow-2xl flex flex-col overflow-hidden text-slate-800"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-8 py-5">
              <h3 className="text-lg font-extrabold text-slate-900 capitalize flex items-center gap-2">
                {activeInfoTopic === 'about' && 'About JOYN'}
                {activeInfoTopic === 'careers' && 'Careers at JOYN'}
                {activeInfoTopic === 'blog' && 'JOYN Blog'}
                {activeInfoTopic === 'press' && 'Press Room'}
                {activeInfoTopic === 'help' && 'Help Center & FAQ'}
                {activeInfoTopic === 'safety' && 'Safety Guidelines'}
                {activeInfoTopic === 'guidelines' && 'Community Guidelines'}
                {activeInfoTopic === 'contact' && 'Contact Support'}
                {activeInfoTopic === 'terms' && 'Terms of Service'}
                {activeInfoTopic === 'privacy' && 'Privacy Policy'}
                {activeInfoTopic === 'cookies' && 'Cookie Policy'}
                {activeInfoTopic === 'rating' && 'Community Rating Details'}
                {activeInfoTopic === 'verified' && 'Verified Profile System'}
                {activeInfoTopic === 'trust' && 'Trust Score System'}
                {activeInfoTopic === 'noshow' && 'No-Show Protection Policy'}
                {activeInfoTopic === 'reviews' && 'Activity Reviews Policy'}
                {activeInfoTopic === 'step1' && 'How it works: Create Activity'}
                {activeInfoTopic === 'step2' && 'How it works: People Discover'}
                {activeInfoTopic === 'step3' && 'How it works: Host Approval'}
                {activeInfoTopic === 'step4' && 'How it works: Meet & Enjoy'}
                {activeInfoTopic === 'step5' && 'How it works: Rate & Grow'}
                {activeInfoTopic === 'testimonial_ananya' && 'Member Spotlight: Ananya P.'}
                {activeInfoTopic === 'testimonial_rahul' && 'Member Spotlight: Rahul M.'}
                {activeInfoTopic === 'testimonial_sneha' && 'Member Spotlight: Sneha K.'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setActiveInfoTopic(null);
                  setApplyingJob(null);
                }}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-all focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content body */}
            <div className="p-8 overflow-y-auto flex-1">
              {renderModalContent(activeInfoTopic)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
