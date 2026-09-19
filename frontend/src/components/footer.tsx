import Link from "next/link";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full bg-[#3b4b64] text-white/90 text-sm font-sans mt-auto">
            {/* Main Links Area */}
            <div className="w-full px-6 py-12 md:py-16">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">

                    {/* Column 1: Company Description */}
                    <div className="space-y-4">
                        <h2 className="text-base font-bold uppercase tracking-wider text-white">
                            FleetGuard
                        </h2>
                        <p className="leading-relaxed text-neutral-300">
                            Advanced Fleet Maintenance & Service Operations Manager. Optimize logistics runtime, manage assets, and streamline operational compliance effortlessly.
                        </p>
                    </div>

                    {/* Column 2: Products / Features */}
                    <div className="space-y-4">
                        <h2 className="text-base font-bold uppercase tracking-wider text-white">
                            Features
                        </h2>
                        <ul className="space-y-2.5">
                            <li>
                                <Link href="/telematics" className="text-neutral-300 hover:text-white transition-colors">
                                    Live Telematics
                                </Link>
                            </li>
                            <li>
                                <Link href="/maintenance" className="text-neutral-300 hover:text-white transition-colors">
                                    Predictive Service
                                </Link>
                            </li>
                            <li>
                                <Link href="/fuel-tracking" className="text-neutral-300 hover:text-white transition-colors">
                                    Fuel Optimization
                                </Link>
                            </li>
                            <li>
                                <Link href="/compliance" className="text-neutral-300 hover:text-white transition-colors">
                                    ELD Compliance
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 3: Useful Links */}
                    <div className="space-y-4">
                        <h2 className="text-base font-bold uppercase tracking-wider text-white">
                            Useful Links
                        </h2>
                        <ul className="space-y-2.5">
                            <li>
                                <Link href="/dashboard" className="text-neutral-300 hover:text-white transition-colors">
                                    Operator Control
                                </Link>
                            </li>
                            <li>
                                <Link href="/partners" className="text-neutral-300 hover:text-white transition-colors">
                                    Affiliate Networks
                                </Link>
                            </li>
                            <li>
                                <Link href="/pricing" className="text-neutral-300 hover:text-white transition-colors">
                                    Enterprise Rates
                                </Link>
                            </li>
                            <li>
                                <Link href="/help" className="text-neutral-300 hover:text-white transition-colors">
                                    Operations Help
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 4: Contact Details */}
                    <div className="space-y-4">
                        <h2 className="text-base font-bold uppercase tracking-wider text-white">
                            Contact
                        </h2>
                        <ul className="space-y-3 text-neutral-300">
                            <li className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5 select-none">home</span>
                                <span>New York, NY 10012, US</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[20px] shrink-0 select-none">mail</span>
                                <a href="mailto:support@fleetguard.com" className="hover:text-white transition-colors">
                                    support@fleetguard.com
                                </a>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[20px] shrink-0 select-none">call</span>
                                <span>+ 01 234 567 88</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[20px] shrink-0 select-none">print</span>
                                <span>+ 01 234 567 89</span>
                            </li>
                        </ul>
                    </div>

                </div>
            </div>

            {/* Bottom Sub-Footer Bar */}
            <div className="w-full bg-[#323f54] py-6">
                <div className="w-full px-6 flex flex-col md:flex-row items-center justify-between gap-4">

                    {/* Copyright text */}
                    <div className="text-neutral-400 text-xs sm:text-sm text-center md:text-left">
                        © {currentYear} Copyright:{" "}
                        <Link href="/" className="font-semibold text-neutral-300 hover:text-white transition-colors">
                            FleetGuard Logistics Enterprise
                        </Link>
                    </div>

                    {/* Social Network Icon Anchors */}
                    <div className="flex items-center gap-3">
                        <a href="#" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all" aria-label="Facebook">
                            <i className="inline-block font-sans font-bold not-italic text-sm">f</i>
                        </a>
                        <a href="#" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all" aria-label="Twitter">
                            <i className="inline-block font-sans font-bold not-italic text-sm">t</i>
                        </a>
                        <a href="#" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all" aria-label="Google">
                            <i className="inline-block font-sans font-bold not-italic text-xs">G+</i>
                        </a>
                        <a href="#" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all" aria-label="LinkedIn">
                            <i className="inline-block font-sans font-bold not-italic text-xs">in</i>
                        </a>
                    </div>

                </div>
            </div>
        </footer>
    );
}