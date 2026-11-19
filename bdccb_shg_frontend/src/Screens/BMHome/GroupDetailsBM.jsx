import React, { useState, useEffect } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import axios from "axios"
import moment from "moment"
import { Message } from "../../Components/Message"
import { url_bdccb } from "../../Address/BaseUrl"
import { getLocalStoreTokenDts } from "../../Components/getLocalforageTokenDts"
import { Spin, Tag, Modal, Tooltip } from "antd"
import {
	LoadingOutlined,
	ArrowLeftOutlined,
	TeamOutlined,
	BankOutlined,
	DollarOutlined,
	UserOutlined,
	SafetyCertificateOutlined,
	PhoneOutlined,
	EnvironmentOutlined,
	CalendarOutlined,
	CheckCircleOutlined,
	CloseCircleOutlined,
	WalletOutlined,
	EyeOutlined,
	HomeOutlined,
	SearchOutlined,
	IdcardOutlined,
	CreditCardOutlined,
	InfoCircleOutlined,
	FileTextOutlined,
} from "@ant-design/icons"

function formatCurrency(val) {
	const n = Number(val) || 0
	return "₹ " + new Intl.NumberFormat("en-IN").format(Math.round(n))
}

function formatDate(dt) {
	if (!dt) return "-"
	return moment(dt).isValid() ? moment(dt).format("DD/MM/YYYY") : String(dt)
}

function formatGender(val) {
	if (!val) return "Female"
	const g = String(val).trim().toUpperCase()
	if (g === "F" || g === "FEMALE") return "Female"
	if (g === "M" || g === "MALE") return "Male"
	if (g === "O" || g === "OTHER") return "Other"
	return val
}

function GroupDetailsBM() {
	const navigate = useNavigate()
	const { group_code: paramCode } = useParams()
	const [searchParams] = useSearchParams()
	const groupCode = paramCode || searchParams.get("code")

	const [loading, setLoading] = useState(true)
	const [groupData, setGroupData] = useState(null)
	const [members, setMembers] = useState([])
	const [loans, setLoans] = useState([])
	const [summary, setSummary] = useState(null)
	const [memberSearch, setMemberSearch] = useState("")

	// Modal States
	const [selectedMember, setSelectedMember] = useState(null)
	const [isMemberModalOpen, setIsMemberModalOpen] = useState(false)

	const [sbModalMember, setSbModalMember] = useState(null)
	const [isSbModalOpen, setIsSbModalOpen] = useState(false)
	const [sbLoading, setSbLoading] = useState(false)
	const [sbTransactions, setSbTransactions] = useState([])

	const [loanModalMember, setLoanModalMember] = useState(null)
	const [isLoanModalOpen, setIsLoanModalOpen] = useState(false)
	const [loanLoading, setLoanLoading] = useState(false)
	const [loanTransactions, setLoanTransactions] = useState([])

	useEffect(() => {
		if (!groupCode) {
			Message("warning", "No group code provided")
			navigate("/homebm/groupinfo")
			return
		}

		const fetchDetails = async () => {
			try {
				setLoading(true)
				const tokenValue = await getLocalStoreTokenDts(navigate)
				const res = await axios.post(
					`${url_bdccb}/groupinfo/get_group_complete_details`,
					{ group_code: groupCode },
					{
						headers: {
							Authorization: `${tokenValue?.token}`,
							"Content-Type": "application/json",
						},
					}
				)

				if (res?.data?.success && res.data.group) {
					setGroupData(res.data.group)
					setMembers(res.data.members || [])
					setLoans(res.data.loans || [])
					setSummary(res.data.summary || {})
				} else {
					Message("error", res?.data?.msg || "Failed to load group details")
				}
			} catch (err) {
				console.error("Error fetching group details:", err)
				Message("error", "Error connecting to server")
			} finally {
				setLoading(false)
			}
		}

		fetchDetails()
	}, [groupCode, navigate])

	// Fetch savings transactions for a member
	const handleOpenSavingsModal = async (member) => {
		setSbModalMember(member)
		setIsSbModalOpen(true)
		setSbLoading(true)
		setSbTransactions([])
		try {
			const tokenValue = await getLocalStoreTokenDts(navigate)
			const res = await axios.post(
				`${url_bdccb}/groupinfo/get_member_sb_transactions`,
				{
					group_code: groupCode,
					member_code: member.member_code,
				},
				{
					headers: {
						Authorization: `${tokenValue?.token}`,
						"Content-Type": "application/json",
					},
				}
			)

			if (res?.data?.success) {
				setSbTransactions(res.data.data || [])
			} else {
				Message("error", res?.data?.msg || "Failed to load savings transactions")
			}
		} catch (err) {
			console.error("Error fetching member savings transactions:", err)
			Message("error", "Error fetching savings transactions")
		} finally {
			setSbLoading(false)
		}
	}

	// Fetch loan transactions for a member
	const handleOpenLoanModal = async (member) => {
		setLoanModalMember(member)
		setIsLoanModalOpen(true)
		setLoanLoading(true)
		setLoanTransactions([])
		try {
			const tokenValue = await getLocalStoreTokenDts(navigate)
			const res = await axios.post(
				`${url_bdccb}/groupinfo/get_member_loan_transactions`,
				{
					group_code: groupCode,
					member_code: member.member_code,
					loan_id: member.member_loan_id,
				},
				{
					headers: {
						Authorization: `${tokenValue?.token}`,
						"Content-Type": "application/json",
					},
				}
			)

			if (res?.data?.success) {
				setLoanTransactions(res.data.data || [])
			} else {
				Message("error", res?.data?.msg || "Failed to load loan transactions")
			}
		} catch (err) {
			console.error("Error fetching member loan transactions:", err)
			Message("error", "Error fetching loan transactions")
		} finally {
			setLoanLoading(false)
		}
	}

	const filteredMembers = members.filter((m) => {
		if (!memberSearch.trim()) return true
		const q = memberSearch.toLowerCase().trim()
		return (
			String(m.member_name || "").toLowerCase().includes(q) ||
			String(m.member_code || "").toLowerCase().includes(q) ||
			String(m.phone_no || "").toLowerCase().includes(q) ||
			String(m.gurdian_name || "").toLowerCase().includes(q)
		)
	})

	return (
		<div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 space-y-6 pb-16 font-sans">
			{/* Back Navigation Bar */}
			<div className="flex items-center justify-between mb-4">
				<button
					onClick={() => navigate("/homebm/groupinfo")}
					className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 text-sm font-semibold rounded-xl border border-slate-200 shadow-xs hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer"
				>
					<ArrowLeftOutlined className="text-sm" />
					Back to Group Search
				</button>
			</div>

			{loading ? (
				<div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200 shadow-sm">
					<Spin indicator={<LoadingOutlined style={{ fontSize: 44 }} spin />} />
					<p className="mt-4 text-slate-500 font-medium">Fetching comprehensive group information...</p>
				</div>
			) : !groupData ? (
				<div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
					<CloseCircleOutlined className="text-rose-500 text-5xl mb-4" />
					<h3 className="text-xl font-bold text-slate-800">Group Not Found</h3>
					<p className="text-slate-500 mt-2">Could not find any group matching code: <b>{groupCode}</b></p>
					<button
						onClick={() => navigate("/homebm/groupinfo")}
						className="mt-6 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-xs"
					>
						Return to Search
					</button>
				</div>
			) : (
				<div className="space-y-6">
					{/* 1. Group Header Card (1st Image) */}
					<div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
						<div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

						<div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
							<div>
								<div className="flex flex-wrap items-center gap-2.5 mb-2">
									<span className="px-3 py-1 bg-white/10 text-white/90 text-xs font-mono font-bold rounded-lg border border-white/20">
										CODE: {groupData.group_code}
									</span>
									{groupData.direct_indirect_flag === "D" ? (
										<span className="px-3 py-1 bg-teal-500/20 text-teal-300 text-xs font-bold rounded-lg border border-teal-500/30">
											DIRECT SHG
										</span>
									) : (
										<span className="px-3 py-1 bg-sky-500/20 text-sky-300 text-xs font-bold rounded-lg border border-sky-500/30">
											INDIRECT (PACS)
										</span>
									)}
									{groupData.open_close_flag === "O" ? (
										<span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-lg border border-emerald-500/30 inline-flex items-center gap-1">
											<CheckCircleOutlined /> ACTIVE
										</span>
									) : (
										<span className="px-3 py-1 bg-rose-500/20 text-rose-300 text-xs font-bold rounded-lg border border-rose-500/30 inline-flex items-center gap-1">
											<CloseCircleOutlined /> CLOSED
										</span>
									)}
								</div>
								<h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
									{groupData.group_name}
								</h1>
								<div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs sm:text-sm text-slate-200">
									<span className="flex items-center gap-1.5 font-medium">
										<BankOutlined className="text-teal-300" />
										<b className="text-white">Branch:</b> {groupData.branch_name}
									</span>
									{groupData.pacs_name && groupData.pacs_name !== "Direct" && (
										<span className="flex items-center gap-1.5 font-medium">
											<SafetyCertificateOutlined className="text-sky-300" />
											<b className="text-white">Society / PACS:</b> {groupData.pacs_name}
										</span>
									)}
									<span className="flex items-center gap-1.5 font-medium">
										<CalendarOutlined className="text-indigo-300" />
										<b className="text-white">Opened:</b> {formatDate(groupData.grp_open_dt)}
									</span>
								</div>
							</div>

							{/* Right Box: Sahayika Name & Phone, and Group Phone */}
							<div className="bg-slate-900/70 border-2 border-white/20 rounded-2xl p-4 sm:p-5 backdrop-blur-sm min-w-[220px] self-start md:self-auto shadow-md">
								<p className="text-[11px] uppercase tracking-wider text-slate-300 font-black mb-1">
									SAHAYIKA / CONTACT
								</p>
								<p className="text-base sm:text-lg font-black text-white tracking-wide">
									{groupData.sahayika_name || "N/A"}
								</p>
								{groupData.sahayika_phone && groupData.sahayika_phone !== "0" ? (
									<p className="text-xs text-teal-300 font-mono flex items-center gap-1.5 mt-1.5 font-bold">
										<PhoneOutlined /> {groupData.sahayika_phone}
									</p>
								) : (
									<p className="text-xs text-slate-400 mt-1 italic font-medium">No phone recorded</p>
								)}

								{/* Group Phone Number below Sahayika Phone */}
								<div className="border-t border-white/15 pt-2 mt-2">
									<p className="text-[10px] uppercase tracking-wider text-slate-300 font-black">
										GROUP PHONE NO
									</p>
									{groupData.phone1 && groupData.phone1 !== "0" ? (
										<p className="text-xs text-sky-300 font-mono flex items-center gap-1.5 mt-0.5 font-bold">
											<PhoneOutlined /> {groupData.phone1}
										</p>
									) : (
										<p className="text-xs text-slate-400 mt-0.5 italic font-medium">Not recorded</p>
									)}
								</div>
							</div>
						</div>
					</div>

					{/* 2. Quick KPI Stat Cards (2nd Image) */}
					<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
						<div className="bg-white p-5 rounded-2xl border-2 border-slate-300 shadow-sm hover:shadow-md transition-shadow">
							<div className="flex items-center justify-between mb-2">
								<span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">TOTAL MEMBERS</span>
								<span className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center text-lg font-bold">
									<TeamOutlined />
								</span>
							</div>
							<div className="text-2xl font-black text-slate-900">
								{summary?.total_members || members.length}
							</div>
							<div className="mt-1 text-xs text-slate-600 font-medium flex items-center gap-2">
								<span className="text-teal-700 font-bold">{summary?.leaders_count || 0} Leaders</span>
								<span>•</span>
								<span className="font-semibold">{summary?.female_members || 0} Female</span>
							</div>
						</div>

						<div className="bg-white p-5 rounded-2xl border-2 border-slate-300 shadow-sm hover:shadow-md transition-shadow">
							<div className="flex items-center justify-between mb-2">
								<span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">TOTAL OUTSTANDING</span>
								<span className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-lg font-bold">
									<DollarOutlined />
								</span>
							</div>
							<div className="text-2xl font-black text-slate-900">
								{formatCurrency(summary?.total_outstanding || 0)}
							</div>
							<div className="mt-1 text-xs text-slate-600 font-semibold">
								{summary?.active_loans || 0} active loan accounts
							</div>
						</div>

						<div className="bg-white p-5 rounded-2xl border-2 border-slate-300 shadow-sm hover:shadow-md transition-shadow">
							<div className="flex items-center justify-between mb-2">
								<span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">TOTAL DISBURSED</span>
								<span className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center text-lg font-bold">
									<BankOutlined />
								</span>
							</div>
							<div className="text-2xl font-black text-slate-900">
								{formatCurrency(summary?.total_disbursed || 0)}
							</div>
							<div className="mt-1 text-xs text-slate-600 font-semibold">
								Lifetime sanction disbursement
							</div>
						</div>

						<div className="bg-white p-5 rounded-2xl border-2 border-slate-300 shadow-sm hover:shadow-md transition-shadow">
							<div className="flex items-center justify-between mb-2">
								<span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">CHANNEL TYPE</span>
								<span className="w-9 h-9 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center text-lg font-bold">
									<SafetyCertificateOutlined />
								</span>
							</div>
							<div className="text-xl font-black text-slate-900">
								{groupData.direct_indirect_flag === "D" ? "Direct SHG" : "PACS Indirect"}
							</div>
							<div className="mt-1 text-xs text-slate-600 font-semibold truncate">
								{groupData.pacs_name || "Direct with Bank"}
							</div>
						</div>
					</div>

					{/* 3. Group Information Section (Address, Dist, Block, PS, PO, GP, Village, Pin, Group Savings & Loan Balance) */}
					<div className="bg-white rounded-2xl border-2 border-slate-300 shadow-sm p-6 space-y-5">
						<div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b-2 border-slate-200 gap-4">
							<div>
								<h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
									<HomeOutlined className="text-teal-700" />
									Group Information & Location Profile
								</h3>
								<p className="text-xs text-slate-600 font-medium mt-0.5">
									Comprehensive administrative address, jurisdiction, group savings, and loan balances
								</p>
							</div>

							{/* Group Savings & Group Loan Balance Cards */}
							<div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
								{/* Group Savings Balance Card */}
								<div className="inline-flex items-center gap-3.5 px-4 py-2.5 bg-emerald-100/90 rounded-2xl border-2 border-emerald-400 shadow-xs">
									<div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center text-xl font-bold shadow-xs">
										<WalletOutlined />
									</div>
									<div>
										<div className="text-[11px] uppercase font-extrabold text-emerald-900 tracking-wider">
											Group Savings Balance
										</div>
										<div className="text-lg sm:text-xl font-black text-emerald-950 font-mono">
											{formatCurrency(groupData.group_savings_balance || 0)}
										</div>
										<div className="text-[11px] text-emerald-800 font-mono font-bold">
											A/C: {groupData.sb_ac_no || groupData.group_savings_acc_no || "N/A"}
										</div>
									</div>
								</div>

								{/* Group Loan Balance Card */}
								<div className="inline-flex items-center gap-3.5 px-4 py-2.5 bg-amber-100/90 rounded-2xl border-2 border-amber-400 shadow-xs">
									<div className="w-10 h-10 rounded-xl bg-amber-700 text-white flex items-center justify-center text-xl font-bold shadow-xs">
										<DollarOutlined />
									</div>
									<div>
										<div className="text-[11px] uppercase font-extrabold text-amber-900 tracking-wider">
											Group Loan Balance
										</div>
										<div className="text-lg sm:text-xl font-black text-amber-950 font-mono">
											{formatCurrency(summary?.total_outstanding || 0)}
										</div>
										<div className="text-[11px] text-amber-900 font-bold">
											{summary?.active_loans || 0} active loan accounts
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Address & Jurisdiction Grid */}
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
							<div className="p-3.5 bg-slate-100/90 rounded-xl border border-slate-300 sm:col-span-2">
								<span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
									Group Address
								</span>
								<span className="font-bold text-slate-950 text-sm block mt-1">
									{groupData.group_addr || "-"}
								</span>
							</div>

							<div className="p-3.5 bg-slate-100/90 rounded-xl border border-slate-300">
								<span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
									District
								</span>
								<span className="font-bold text-slate-950 text-sm block mt-1">
									{groupData.dist_name || "-"}
								</span>
							</div>

							<div className="p-3.5 bg-slate-100/90 rounded-xl border border-slate-300">
								<span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
									Block
								</span>
								<span className="font-bold text-slate-950 text-sm block mt-1">
									{groupData.block_name || "-"}
								</span>
							</div>

							<div className="p-3.5 bg-slate-100/90 rounded-xl border border-slate-300">
								<span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
									Police Station (PS)
								</span>
								<span className="font-bold text-slate-950 text-sm block mt-1">
									{groupData.ps_name || "-"}
								</span>
							</div>

							<div className="p-3.5 bg-slate-100/90 rounded-xl border border-slate-300">
								<span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
									Post Office (PO)
								</span>
								<span className="font-bold text-slate-950 text-sm block mt-1">
									{groupData.po_name || "-"}
								</span>
							</div>

							<div className="p-3.5 bg-slate-100/90 rounded-xl border border-slate-300">
								<span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
									Gram Panchayat (GP)
								</span>
								<span className="font-bold text-slate-950 text-sm block mt-1">
									{groupData.gp_name || "-"}
								</span>
							</div>

							<div className="p-3.5 bg-slate-100/90 rounded-xl border border-slate-300">
								<span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
									Village
								</span>
								<span className="font-bold text-slate-950 text-sm block mt-1">
									{groupData.village_name || "-"}
								</span>
							</div>

							<div className="p-3.5 bg-slate-100/90 rounded-xl border border-slate-300">
								<span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
									PIN Code
								</span>
								<span className="font-mono font-bold text-slate-950 text-sm block mt-1">
									{groupData.pin_no || "-"}
								</span>
							</div>
						</div>
					</div>

					{/* 4. Group Sanctioned Loans Section (placed directly below Group Information) */}
					<div className="bg-white rounded-2xl border-2 border-slate-300 shadow-sm p-6 space-y-4">
						<div className="flex items-center justify-between pb-3 border-b-2 border-slate-200">
							<div>
								<h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
									<DollarOutlined className="text-amber-700" />
									Group Sanctioned Loans ({loans.length})
								</h3>
								<p className="text-xs text-slate-600 font-medium mt-0.5">
									Group master loans sanctioned by the bank with interest rates and repayment progress
								</p>
							</div>
							<div className="text-right">
								<span className="text-xs text-slate-600 font-bold mr-2">Total Outstanding:</span>
								<span className="text-base font-black text-amber-700">
									{formatCurrency(summary?.total_outstanding || 0)}
								</span>
							</div>
						</div>

						{loans.length === 0 ? (
							<div className="py-10 text-center text-slate-500 font-medium bg-slate-100 rounded-xl border border-slate-300">
								No loan accounts recorded for this group.
							</div>
						) : (
							<div className="overflow-x-auto rounded-xl border-2 border-slate-300">
								<table className="w-full text-left text-xs sm:text-sm text-slate-800">
									<thead className="bg-slate-200 text-slate-800 font-extrabold border-b-2 border-slate-300 uppercase tracking-wider text-[11px]">
										<tr>
											<th className="py-3 px-4">Loan ID / A/C</th>
											<th className="py-3 px-4">Disbursed Date</th>
											<th className="py-3 px-4">Disbursed Amt</th>
											<th className="py-3 px-4">ROI (%)</th>
											<th className="py-3 px-4">Period</th>
											<th className="py-3 px-4">Repayment Window</th>
											<th className="py-3 px-4">Principal O/S</th>
											<th className="py-3 px-4">Total O/S</th>
											<th className="py-3 px-4">Status</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-200">
										{loans.map((l, idx) => (
											<tr key={l.loan_id || idx} className="hover:bg-slate-100/90 transition-colors">
												<td className="py-3.5 px-4">
													<div className="font-mono font-bold text-slate-950">
														{l.loan_acc_no || l.loan_id}
													</div>
													<div className="text-[11px] text-slate-500 font-mono font-semibold">
														ID: {l.loan_id}
													</div>
												</td>
												<td className="py-3.5 px-4 font-mono text-slate-700 font-semibold">
													{formatDate(l.disb_dt)}
												</td>
												<td className="py-3.5 px-4 font-bold text-slate-950">
													{formatCurrency(l.disb_amt)}
												</td>
												<td className="py-3.5 px-4 font-mono text-slate-700 font-semibold">
													{l.curr_roi ? `${l.curr_roi}%` : "-"}
												</td>
												<td className="py-3.5 px-4 text-slate-800 font-medium">
													{l.period ? `${l.period} Mos (${l.pay_mode || "Monthly"})` : "-"}
												</td>
												<td className="py-3.5 px-4 text-slate-800 text-xs font-medium">
													<div>{formatDate(l.rep_start_dt)}</div>
													<div className="text-slate-500 font-semibold">to {formatDate(l.rep_end_dt)}</div>
												</td>
												<td className="py-3.5 px-4 font-mono font-bold text-slate-800">
													{formatCurrency(l.outstanding_prn || l.curr_prn)}
												</td>
												<td className="py-3.5 px-4 font-mono font-black text-amber-700">
													{formatCurrency(l.total_outstanding)}
												</td>
												<td className="py-3.5 px-4">
													{l.acc_status === "O" ? (
														<span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-bold rounded-md">
															ACTIVE
														</span>
													) : (
														<span className="px-2.5 py-1 bg-slate-200 text-slate-700 border border-slate-300 text-[11px] font-bold rounded-md">
															CLOSED
														</span>
													)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>

					{/* 5. Group Members & Balances Section (placed below Group Sanctioned Loans) */}
					<div className="bg-white rounded-2xl border-2 border-slate-300 shadow-sm p-6 space-y-4">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-slate-200">
							<div>
								<div className="flex items-center gap-2">
									<h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
										<TeamOutlined className="text-teal-700" />
										Group Members & Balances
									</h3>
									<span className="px-2.5 py-0.5 bg-teal-100 text-teal-900 text-xs font-extrabold rounded-full border border-teal-300">
										{members.length} Members
									</span>
								</div>
								<p className="text-xs text-slate-600 font-medium mt-0.5">
									Click member name/code to view full profile. Click balance buttons to view transaction statements.
								</p>
							</div>

							{/* Quick filter input */}
							<div className="relative w-full sm:w-64">
								<SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
								<input
									type="text"
									placeholder="Search member or code..."
									value={memberSearch}
									onChange={(e) => setMemberSearch(e.target.value)}
									className="w-full pl-8 pr-3 py-1.5 bg-slate-100 border-2 border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all placeholder:text-slate-500"
								/>
							</div>
						</div>

						{filteredMembers.length === 0 ? (
							<div className="py-12 text-center text-slate-500 font-medium bg-slate-100 rounded-xl border border-slate-300">
								No members match your criteria.
							</div>
						) : (
							<div className="overflow-x-auto rounded-xl border-2 border-slate-300">
								<table className="w-full text-left text-xs sm:text-sm text-slate-800">
									<thead className="bg-slate-200 text-slate-800 font-extrabold border-b-2 border-slate-300 uppercase tracking-wider text-[11px]">
										<tr>
											<th className="py-3 px-4 w-12 text-center">#</th>
											<th className="py-3 px-4">Member Name & Code (Click for Profile)</th>
											<th className="py-3 px-4">Guardian / Role</th>
											<th className="py-3 px-4">Gender / Phone</th>
											<th className="py-3 px-4 text-center">Savings Balance</th>
											<th className="py-3 px-4 text-center">Loan Balance</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-200">
										{filteredMembers.map((m, idx) => (
											<tr key={m.member_code || idx} className="hover:bg-slate-100/90 transition-colors">
												<td className="py-3.5 px-4 font-mono text-slate-600 font-bold text-center">{idx + 1}</td>

												{/* Member Name with Code as Clickable Button */}
												<td className="py-3.5 px-4">
													<button
														type="button"
														onClick={() => {
															setSelectedMember(m)
															setIsMemberModalOpen(true)
														}}
														className="group inline-flex items-center gap-3 px-3.5 py-2 bg-slate-100 hover:bg-teal-50 text-slate-900 hover:text-teal-950 border-2 border-slate-300 hover:border-teal-600 rounded-xl transition-all shadow-xs text-left cursor-pointer"
														title="Click to view full member profile"
													>
														<div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-xs group-hover:bg-teal-800 transition-colors shrink-0">
															<UserOutlined />
														</div>
														<div>
															<div className="font-extrabold text-sm text-slate-950 group-hover:text-teal-900 flex items-center gap-1.5 flex-wrap">
																<span>{m.member_name}</span>
																{m.gp_leader_flag === "Y" && (
																	<span className="px-1.5 py-0.5 bg-amber-200 text-amber-950 text-[10px] font-black rounded border border-amber-400">
																		★ LEADER
																	</span>
																)}
																{m.asst_gp_leader_flag === "Y" && (
																	<span className="px-1.5 py-0.5 bg-sky-200 text-sky-950 text-[10px] font-bold rounded border border-sky-400">
																		ASST. LEADER
																	</span>
																)}
															</div>
															<div className="text-[11px] font-mono text-slate-600 font-semibold mt-0.5">
																Code: <span className="font-extrabold text-slate-900">{m.member_code}</span>
															</div>
														</div>
													</button>
												</td>

												{/* Guardian & Role */}
												<td className="py-3.5 px-4">
													<div className="text-slate-950 font-bold">{m.gurdian_name || "-"}</div>
													<div className="text-[11px] text-slate-600 font-medium">
														{m.caste ? `Caste: ${m.caste}` : "General"}
													</div>
												</td>

												{/* Gender & Phone */}
												<td className="py-3.5 px-4">
													<div className="text-slate-950 font-bold">{formatGender(m.gender)}</div>
													<div className="text-[11px] font-mono text-slate-700 font-semibold">
														{m.phone_no ? `📞 ${m.phone_no}` : "-"}
													</div>
												</td>

												{/* View Savings Balance Button */}
												<td className="py-3.5 px-4 text-center">
													<button
														type="button"
														onClick={() => handleOpenSavingsModal(m)}
														className="inline-flex items-center justify-between gap-2 px-3.5 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border-2 border-emerald-400 hover:border-emerald-500 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer min-w-[155px]"
														title="Click to view savings transaction details"
													>
														<div className="flex items-center gap-1.5">
															<WalletOutlined className="text-emerald-700 text-sm" />
															<div className="text-left">
																<div className="text-[10px] text-emerald-800 font-extrabold uppercase">Savings</div>
																<div className="font-mono font-black text-emerald-950 text-xs">
																	{formatCurrency(m.savings_balance || 0)}
																</div>
															</div>
														</div>
														<EyeOutlined className="text-emerald-700 text-xs ml-1" />
													</button>
												</td>

												{/* View Loan Balance Button */}
												<td className="py-3.5 px-4 text-center">
													<button
														type="button"
														onClick={() => handleOpenLoanModal(m)}
														className="inline-flex items-center justify-between gap-2 px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 border-2 border-amber-400 hover:border-amber-500 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer min-w-[155px]"
														title="Click to view loan transaction details"
													>
														<div className="flex items-center gap-1.5">
															<DollarOutlined className="text-amber-700 text-sm" />
															<div className="text-left">
																<div className="text-[10px] text-amber-800 font-extrabold uppercase">Loan</div>
																<div className="font-mono font-black text-amber-950 text-xs">
																	{formatCurrency(m.loan_balance || 0)}
																</div>
															</div>
														</div>
														<EyeOutlined className="text-amber-700 text-xs ml-1" />
													</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</div>
			)}

			{/* =========================================================================
			    MODAL 1: Member Full Profile Details (Triggered by Member Name/Code Button)
			    ========================================================================= */}
			<Modal
				open={isMemberModalOpen}
				onCancel={() => setIsMemberModalOpen(false)}
				footer={null}
				width={740}
				centered
				title={
					<div className="flex items-center gap-3 pb-3 border-b-2 border-slate-200">
						<div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold text-base shadow-xs">
							<UserOutlined />
						</div>
						<div>
							<div className="text-lg font-black text-slate-950">
								{selectedMember?.member_name}
							</div>
							<div className="text-xs text-slate-600 font-mono font-bold">
								Member Code: <span className="text-slate-900 font-extrabold">{selectedMember?.member_code}</span>
							</div>
						</div>
					</div>
				}
			>
				{selectedMember && (
					<div className="py-3 space-y-5">
						{/* Section A: Personal & Demographic Info */}
						<div>
							<h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2.5 flex items-center gap-1.5">
								<IdcardOutlined className="text-teal-700 text-sm" /> Personal & Demographic Information
							</h4>
							<div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs bg-slate-100/90 p-4 rounded-xl border border-slate-300">
								<div>
									<span className="text-slate-600 block font-bold uppercase text-[10px]">Guardian Name</span>
									<span className="font-extrabold text-slate-950 text-sm block mt-0.5">{selectedMember.gurdian_name || "-"}</span>
								</div>
								<div>
									<span className="text-slate-600 block font-bold uppercase text-[10px]">Gender</span>
									<span className="font-extrabold text-slate-950 text-sm block mt-0.5">{formatGender(selectedMember.gender)}</span>
								</div>
								<div>
									<span className="text-slate-600 block font-bold uppercase text-[10px]">Date of Birth</span>
									<span className="font-extrabold text-slate-950 font-mono text-sm block mt-0.5">{formatDate(selectedMember.dob)}</span>
								</div>
								<div>
									<span className="text-slate-600 block font-bold uppercase text-[10px]">Phone Number</span>
									<span className="font-extrabold text-slate-950 font-mono text-sm block mt-0.5">{selectedMember.phone_no || "-"}</span>
								</div>
								<div>
									<span className="text-slate-600 block font-bold uppercase text-[10px]">Caste</span>
									<span className="font-extrabold text-slate-950 text-sm block mt-0.5">{selectedMember.caste || "-"}</span>
								</div>
								<div>
									<span className="text-slate-600 block font-bold uppercase text-[10px]">Religion</span>
									<span className="font-extrabold text-slate-950 text-sm block mt-0.5">{selectedMember.religion || "-"}</span>
								</div>
								<div>
									<span className="text-slate-600 block font-bold uppercase text-[10px]">Education</span>
									<span className="font-extrabold text-slate-950 text-sm block mt-0.5">{selectedMember.education || "-"}</span>
								</div>
								<div>
									<span className="text-slate-600 block font-bold uppercase text-[10px]">Occupation</span>
									<span className="font-extrabold text-slate-950 text-sm block mt-0.5">{selectedMember.occupation || "-"}</span>
								</div>
								<div>
									<span className="text-slate-600 block font-bold uppercase text-[10px]">Group Designation</span>
									<span className="font-extrabold text-slate-950 text-sm block mt-0.5">
										{selectedMember.gp_leader_flag === "Y"
											? "GP Leader"
											: selectedMember.asst_gp_leader_flag === "Y"
												? "Assistant Leader"
												: "Member"}
									</span>
								</div>
							</div>
						</div>

						{/* Section B: KYC & Banking Identification */}
						<div>
							<h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2.5 flex items-center gap-1.5">
								<CreditCardOutlined className="text-indigo-700 text-sm" /> Identification & Bank Accounts
							</h4>
							<div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs bg-slate-100/90 p-4 rounded-xl border border-slate-300">
								<div>
									<span className="text-slate-600 block font-bold uppercase text-[10px]">Aadhaar Number</span>
									<span className="font-mono font-extrabold text-slate-950 text-sm block mt-0.5">{selectedMember.aadhar_no || "-"}</span>
								</div>
								<div>
									<span className="text-slate-600 block font-bold uppercase text-[10px]">PAN Number</span>
									<span className="font-mono font-extrabold text-slate-950 text-sm block mt-0.5">{selectedMember.pan_no || "-"}</span>
								</div>
								<div>
									<span className="text-slate-600 block font-bold uppercase text-[10px]">Voter ID</span>
									<span className="font-mono font-extrabold text-slate-950 text-sm block mt-0.5">{selectedMember.voter_id || "-"}</span>
								</div>
								<div>
									<span className="text-slate-600 block font-bold uppercase text-[10px]">Member Bank A/C</span>
									<span className="font-mono font-black text-teal-800 text-sm block mt-0.5">{selectedMember.member_account_no || "-"}</span>
								</div>
								<div>
									<span className="text-slate-600 block font-bold uppercase text-[10px]">IFSC Code</span>
									<span className="font-mono font-extrabold text-slate-950 text-sm block mt-0.5">{selectedMember.ifsc || "-"}</span>
								</div>
								<div>
									<span className="text-slate-600 block font-bold uppercase text-[10px]">Weaker Section</span>
									<span className="font-extrabold text-slate-950 text-sm block mt-0.5">
										{selectedMember.weaker_section === "Y" ? "Yes" : "No"}
									</span>
								</div>
							</div>
						</div>

						{/* Section C: Address Details */}
						<div>
							<h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2.5 flex items-center gap-1.5">
								<EnvironmentOutlined className="text-teal-700 text-sm" /> Member Address
							</h4>
							<div className="p-4 bg-slate-100/90 rounded-xl border border-slate-300 text-xs flex justify-between items-center">
								<div>
									<span className="text-slate-600 block font-bold uppercase text-[10px]">Residential Address</span>
									<span className="font-extrabold text-slate-950 text-sm block mt-0.5">{selectedMember.address || "-"}</span>
								</div>
								<div className="text-right">
									<span className="text-slate-600 block font-bold uppercase text-[10px]">PIN Code</span>
									<span className="font-mono font-extrabold text-slate-950 text-sm block mt-0.5">{selectedMember.pin_no || "-"}</span>
								</div>
							</div>
						</div>
					</div>
				)}
			</Modal>

			{/* =========================================================================
			    MODAL 2: Member Savings Transactions (Triggered by View Savings Balance Button)
			    ========================================================================= */}
			<Modal
				open={isSbModalOpen}
				onCancel={() => setIsSbModalOpen(false)}
				footer={null}
				width={860}
				centered
				title={
					<div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b-2 border-slate-200 gap-2 pr-6">
						<div className="flex items-center gap-3">
							<div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-base shadow-xs">
								<WalletOutlined />
							</div>
							<div>
								<div className="text-base font-extrabold text-slate-950">
									Savings Transaction Statement
								</div>
								<div className="text-xs text-slate-600 font-medium">
									Member: <b className="text-slate-950">{sbModalMember?.member_name}</b> (Code: {sbModalMember?.member_code})
								</div>
							</div>
						</div>
						<div className="text-right">
							<span className="text-xs text-slate-600 font-bold mr-2">Current Balance:</span>
							<span className="font-mono font-black text-emerald-800 text-base">
								{formatCurrency(sbModalMember?.savings_balance || 0)}
							</span>
						</div>
					</div>
				}
			>
				<div className="py-3">
					{sbLoading ? (
						<div className="py-16 text-center">
							<Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} />
							<p className="mt-3 text-slate-600 font-medium text-xs">Loading savings transactions...</p>
						</div>
					) : sbTransactions.length === 0 ? (
						<div className="py-12 text-center text-slate-500 font-medium bg-slate-100 rounded-xl border border-slate-300">
							No savings transaction records found for this member.
						</div>
					) : (
						<div className="overflow-x-auto rounded-xl border-2 border-slate-300">
							<table className="w-full text-left text-xs text-slate-800">
								<thead className="bg-slate-200 text-slate-800 font-extrabold border-b-2 border-slate-300 uppercase tracking-wider text-[10px]">
									<tr>
										<th className="py-2.5 px-3">Date</th>
										<th className="py-2.5 px-3">Txn No</th>
										<th className="py-2.5 px-3">A/C No</th>
										<th className="py-2.5 px-3">Type</th>
										<th className="py-2.5 px-3 text-right">Debit (Dr)</th>
										<th className="py-2.5 px-3 text-right">Credit (Cr)</th>
										<th className="py-2.5 px-3 text-right">Balance</th>
										<th className="py-2.5 px-3">Remarks</th>
										<th className="py-2.5 px-3 text-center">Status</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-200">
									{sbTransactions.map((t, idx) => (
										<tr key={t.trans_no || idx} className="hover:bg-slate-100/90 transition-colors">
											<td className="py-2.5 px-3 font-mono font-semibold">{formatDate(t.trans_dt)}</td>
											<td className="py-2.5 px-3 font-mono text-slate-600 font-semibold">{t.trans_no}</td>
											<td className="py-2.5 px-3 font-mono text-slate-800 font-bold">{t.acc_no || "-"}</td>
											<td className="py-2.5 px-3">
												{t.dep_with_flag === "D" ? (
													<span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold rounded">
														Deposit
													</span>
												) : (
													<span className="px-2 py-0.5 bg-rose-100 text-rose-900 border border-rose-300 text-[10px] font-bold rounded">
														Withdrawal
													</span>
												)}
											</td>
											<td className="py-2.5 px-3 text-right font-mono text-rose-700 font-extrabold">
												{Number(t.dr_amt) > 0 ? formatCurrency(t.dr_amt) : "-"}
											</td>
											<td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-extrabold">
												{Number(t.cr_amt) > 0 ? formatCurrency(t.cr_amt) : "-"}
											</td>
											<td className="py-2.5 px-3 text-right font-mono font-black text-slate-950">
												{formatCurrency(t.balance)}
											</td>
											<td className="py-2.5 px-3 text-slate-700 font-medium text-[11px] max-w-[140px] truncate">
												{t.remarks || "-"}
											</td>
											<td className="py-2.5 px-3 text-center">
												{t.approval_flag === "A" ? (
													<Tag color="cyan">Approved</Tag>
												) : (
													<Tag>{t.approval_flag || "Pending"}</Tag>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</Modal>

			{/* =========================================================================
			    MODAL 3: Member Loan Transactions (Triggered by View Loan Balance Button)
			    ========================================================================= */}
			<Modal
				open={isLoanModalOpen}
				onCancel={() => setIsLoanModalOpen(false)}
				footer={null}
				width={920}
				centered
				title={
					<div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b-2 border-slate-200 gap-2 pr-6">
						<div className="flex items-center gap-3">
							<div className="w-9 h-9 rounded-xl bg-amber-700 text-white flex items-center justify-center font-bold text-base shadow-xs">
								<DollarOutlined />
							</div>
							<div>
								<div className="text-base font-extrabold text-slate-950">
									Loan Transaction Statement
								</div>
								<div className="text-xs text-slate-600 font-medium">
									Member: <b className="text-slate-950">{loanModalMember?.member_name}</b> (Code: {loanModalMember?.member_code})
								</div>
							</div>
						</div>
						<div className="text-right">
							<span className="text-xs text-slate-600 font-bold mr-2">Loan Balance:</span>
							<span className="font-mono font-black text-amber-800 text-base">
								{formatCurrency(loanModalMember?.loan_balance || 0)}
							</span>
						</div>
					</div>
				}
			>
				<div className="py-3">
					{loanLoading ? (
						<div className="py-16 text-center">
							<Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} />
							<p className="mt-3 text-slate-600 font-medium text-xs">Loading loan transactions...</p>
						</div>
					) : loanTransactions.length === 0 ? (
						<div className="py-12 text-center text-slate-500 font-medium bg-slate-100 rounded-xl border border-slate-300">
							No loan transaction records found for this member.
						</div>
					) : (
						<div className="overflow-x-auto rounded-xl border-2 border-slate-300">
							<table className="w-full text-left text-xs text-slate-800">
								<thead className="bg-slate-200 text-slate-800 font-extrabold border-b-2 border-slate-300 uppercase tracking-wider text-[10px]">
									<tr>
										<th className="py-2.5 px-3">Date</th>
										<th className="py-2.5 px-3">Txn ID</th>
										<th className="py-2.5 px-3">Loan A/C</th>
										<th className="py-2.5 px-3">Type</th>
										<th className="py-2.5 px-3 text-right">Debit (Disbursed)</th>
										<th className="py-2.5 px-3 text-right">Credit (Paid)</th>
										<th className="py-2.5 px-3 text-right">Principal Recov</th>
										<th className="py-2.5 px-3 text-right">Interest Recov</th>
										<th className="py-2.5 px-3 text-right">Current Principal</th>
										<th className="py-2.5 px-3 text-center">Status</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-200">
									{loanTransactions.map((t, idx) => (
										<tr key={t.trans_id || idx} className="hover:bg-slate-100/90 transition-colors">
											<td className="py-2.5 px-3 font-mono font-semibold">{formatDate(t.trans_date)}</td>
											<td className="py-2.5 px-3 font-mono text-slate-600 font-semibold">{t.trans_id}</td>
											<td className="py-2.5 px-3 font-mono text-slate-800 font-bold">{t.loan_acc_no || "-"}</td>
											<td className="py-2.5 px-3">
												{t.trans_type === "D" ? (
													<span className="px-2 py-0.5 bg-blue-100 text-blue-900 border border-blue-300 text-[10px] font-bold rounded">
														Disbursement
													</span>
												) : (
													<span className="px-2 py-0.5 bg-purple-100 text-purple-900 border border-purple-300 text-[10px] font-bold rounded">
														Recovery
													</span>
												)}
											</td>
											<td className="py-2.5 px-3 text-right font-mono text-blue-800 font-extrabold">
												{Number(t.dr_amt) > 0 ? formatCurrency(t.dr_amt) : "-"}
											</td>
											<td className="py-2.5 px-3 text-right font-mono text-emerald-800 font-extrabold">
												{Number(t.cr_amt) > 0 ? formatCurrency(t.cr_amt) : "-"}
											</td>
											<td className="py-2.5 px-3 text-right font-mono text-slate-800 font-bold">
												{Number(t.curr_prn_recov) > 0 ? formatCurrency(t.curr_prn_recov) : "-"}
											</td>
											<td className="py-2.5 px-3 text-right font-mono text-slate-800 font-bold">
												{Number(t.curr_intt_recov) > 0 ? formatCurrency(t.curr_intt_recov) : "-"}
											</td>
											<td className="py-2.5 px-3 text-right font-mono font-black text-slate-950">
												{formatCurrency(t.curr_prn)}
											</td>
											<td className="py-2.5 px-3 text-center">
												{t.approval_status === "A" ? (
													<Tag color="cyan">Approved</Tag>
												) : (
													<Tag>{t.approval_status || "Pending"}</Tag>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</Modal>
		</div>
	)
}

export default GroupDetailsBM
