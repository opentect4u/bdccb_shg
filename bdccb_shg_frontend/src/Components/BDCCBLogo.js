import React, { useState } from "react"

export const BDCCBEmblem = ({ className = "w-10 h-10" }) => {
	const [imgError, setImgError] = useState(false)

	if (!imgError) {
		return (
			<img
				src="/bdccb_logo_emblem.png"
				onError={() => setImgError(true)}
				alt="BDCCB Emblem Logo"
				className={`object-contain ${className}`}
			/>
		)
	}

	return (
		<svg
			viewBox="0 0 240 240"
			className={className}
			xmlns="http://www.w3.org/2000/svg"
		>
			<circle cx="120" cy="120" r="114" fill="#FFFFFF" stroke="#0F172A" strokeWidth="6" />
			<circle cx="120" cy="120" r="92" fill="none" stroke="#0F172A" strokeWidth="3" />
			<defs>
				<path id="textArcTop" d="M 32,120 A 88,88 0 1,1 208,120" />
				<path id="textArcBottom" d="M 208,120 A 88,88 0 0,1 32,120" />
			</defs>
			<text fontSize="12" fontWeight="bold" fill="#0F172A" letterSpacing="0.6">
				<textPath href="#textArcTop" startOffset="50%" textAnchor="middle">
					BANKURA DISTRICT CENTRAL CO-OPERATIVE BANK LTD.
				</textPath>
			</text>
			<text fontSize="11" fontWeight="700" fill="#0F172A">
				<textPath href="#textArcBottom" startOffset="50%" textAnchor="middle">
					• বাঁকুড়া জেলা কেন্দ্রীয় সমবায় ব্যাঙ্ক লিমিটেড •
				</textPath>
			</text>
			<line x1="120" y1="28" x2="120" y2="120" stroke="#0F172A" strokeWidth="3" />
			<line x1="120" y1="120" x2="32" y2="148" stroke="#0F172A" strokeWidth="3" />
			<line x1="120" y1="120" x2="208" y2="148" stroke="#0F172A" strokeWidth="3" />
			<g transform="translate(48, 40) scale(0.75)" stroke="#0F172A" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
				<path d="M42 65 Q32 45 36 28 Q40 10 52 6 Q60 3 64 12 Q66 22 62 42 Z" fill="#0F172A" fillOpacity="0.08" />
				<path d="M42 65 Q32 45 36 28 Q40 10 52 6 Q60 3 64 12 Q66 22 62 42 Z" />
				<path d="M50 8 L44 -2 M56 6 L56 -4" />
				<circle cx="52" cy="20" r="3.5" fill="#0F172A" />
				<path d="M38 32 L60 36 M39 44 L61 40" />
				<path d="M60 12 Q70 20 66 36" />
			</g>
			<g transform="translate(130, 36) scale(0.7)" stroke="#0F172A" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
				<rect x="10" y="32" width="55" height="50" rx="3" fill="#0F172A" fillOpacity="0.05" />
				<rect x="10" y="32" width="55" height="50" rx="3" />
				<path d="M5 32 Q37 12 70 32" />
				<path d="M22 18 Q37 4 52 18" />
				<circle cx="37" cy="5" r="3.5" fill="#0F172A" />
				<line x1="24" y1="32" x2="24" y2="82" />
				<line x1="37" y1="32" x2="37" y2="82" />
				<line x1="50" y1="32" x2="50" y2="82" />
			</g>
			<g transform="translate(62, 146) scale(0.75)" stroke="#0F172A" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
				<rect x="10" y="24" width="135" height="42" rx="3" fill="#0F172A" fillOpacity="0.05" />
				<rect x="10" y="24" width="135" height="42" rx="3" />
				<path d="M10 24 L77 6 L145 24" />
				<line x1="28" y1="24" x2="28" y2="66" />
				<line x1="48" y1="24" x2="48" y2="66" />
				<line x1="68" y1="24" x2="68" y2="66" />
				<line x1="88" y1="24" x2="88" y2="66" />
				<line x1="108" y1="24" x2="108" y2="66" />
				<line x1="127" y1="24" x2="127" y2="66" />
			</g>
		</svg>
	)
}

export const BDCCBTopLogo = ({ className = "" }) => {
	return (
		<div className={`flex items-center gap-2.5 ${className}`}>
			<BDCCBEmblem className="w-9 h-9 md:w-10 md:h-10 shrink-0" />
			<span className="font-extrabold text-slate-700 text-xl md:text-2xl uppercase tracking-wide">
				BDCCB
			</span>
		</div>
	)
}

export const BDCCBHeader = ({ className = "" }) => {
	return (
		<div className={`flex items-center gap-3 ${className}`}>
			<BDCCBEmblem className="w-12 h-12 md:w-14 md:h-14 shrink-0" />
			<div className="flex flex-col justify-center">
				<h2 className="text-sm md:text-base font-bold text-slate-800 tracking-tight leading-snug">
					Bankura District Central Cooperative Bank Ltd.
				</h2>
				<p className="text-xs font-semibold text-emerald-800 leading-tight">
					বাঁকুড়া জেলা কেন্দ্রীয় সমবায় ব্যাঙ্ক লিমিটেড
				</p>
			</div>
		</div>
	)
}

export default BDCCBHeader
