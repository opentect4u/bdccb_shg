import React, { useEffect, useState, useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import axios from "axios"
import moment from "moment"
import {
	BankOutlined,
	SafetyCertificateOutlined,
	TeamOutlined,
	UserOutlined,
	DollarOutlined,
	WalletOutlined,
	BarChartOutlined,
	CalendarOutlined,
	ReloadOutlined,
	SearchOutlined,
	ArrowLeftOutlined,
	LoadingOutlined,
	EyeOutlined,
	ArrowUpOutlined,
	ArrowDownOutlined,
	PhoneOutlined,
	EnvironmentOutlined,
	UserSwitchOutlined,
	CheckCircleOutlined,
	CloseCircleOutlined,
	FilterOutlined,
	InfoCircleOutlined,
	IdcardOutlined
} from "@ant-design/icons"
import { Select, Tag, Spin } from "antd"
import { url_bdccb } from "../../Address/BaseUrl"
import { Message } from "../../Components/Message"
import { getLocalStoreTokenDts } from "../../Components/getLocalforageTokenDts"

const FY_OPTIONS = [
	{ label: "FY 2026-2027", value: "2026-2027" },
	{ label: "FY 2025-2026", value: "2025-2026" },
	{ label: "FY 2024-2025", value: "2024-2025" },
	{ label: "FY 2023-2024", value: "2023-2024" },
]

const MONTH_OPTIONS = [
	{ label: "All Months (Full FY)", value: "ALL" },
	{ label: "April", value: "4" },
	{ label: "May", value: "5" },
	{ label: "June", value: "6" },
	{ label: "July", value: "7" },
	{ label: "August", value: "8" },
	{ label: "September", value: "9" },
	{ label: "October", value: "10" },
	{ label: "November", value: "11" },
	{ label: "December", value: "12" },
	{ label: "January", value: "1" },
	{ label: "February", value: "2" },
	{ label: "March", value: "3" },
]

function SocietyInfoBM() {
	const navigate = useNavigate()
	const [searchParams, setSearchParams] = useSearchParams()

	// 1. Radio Button Filter: 'branch' | 'society' (clean initial state, unbound on refresh)
	const [viewMode, setViewMode] = useState("branch")
	const [selectedBranch, setSelectedBranch] = useState("")
	const [selectedSociety, setSelectedSociety] = useState("")

	// 2. Transaction Period Filters: Dynamic Financial Year, Month, From Date & To Date
	const [financialYear, setFinancialYear] = useState(searchParams.get("fy") || "2026-2027")
	const [selectedMonth, setSelectedMonth] = useState(searchParams.get("month") || "ALL")
	const [fromDate, setFromDate] = useState(searchParams.get("from") || "2026-04-01")
	const [toDate, setToDate] = useState(searchParams.get("to") || "2027-03-31")

	// Master data lists
	const [branches, setBranches] = useState([])
	const [societies, setSocieties] = useState([])
	const [masterLoading, setMasterLoading] = useState(true)

	// Analytics data state
	const [loading, setLoading] = useState(false)
	const [periodLoading, setPeriodLoading] = useState(false)
	const [analyticsData, setAnalyticsData] = useState(null)

	// Group search filter within the groups table
	const [groupSearch, setGroupSearch] = useState("")

	// Sort branches serialwise (numerically by branch_id: 101, 102, 106, 110, ...)
	const sortedBranches = useMemo(() => {
		return [...branches].sort(
			(a, b) => (Number(a.branch_id) || 0) - (Number(b.branch_id) || 0)
		)
	}, [branches])

	// Sort societies serialwise numerically by pacs_id (1, 2, 3, ...) matching the API serial order
	const sortedSocieties = useMemo(() => {
		return [...societies].sort(
			(a, b) => (Number(a.pacs_id) || 0) - (Number(b.pacs_id) || 0)
		)
	}, [societies])

	// Fetch Analytics data (supports dynamic From Date & To Date)
	const fetchAnalytics = async (customParams = {}) => {
		const targetMode = customParams.mode || viewMode
		const targetSociety = customParams.society !== undefined ? customParams.society : selectedSociety
		const targetBranch = customParams.branch !== undefined ? customParams.branch : selectedBranch
		const targetFY = customParams.fy || financialYear
		const targetMonth = customParams.month !== undefined ? customParams.month : selectedMonth
		const targetFromDate = customParams.fromDate !== undefined ? customParams.fromDate : fromDate
		const targetToDate = customParams.toDate !== undefined ? customParams.toDate : toDate
		const isPeriodOnly = !!customParams.isPeriodOnly

		if (targetMode === "society" && !targetSociety) {
			Message("warning", "Please select a Society / PACS")
			return
		}
		if (targetMode === "branch" && !targetBranch) {
			Message("warning", "Please select a Branch")
			return
		}

		try {
			if (isPeriodOnly) {
				setPeriodLoading(true)
			} else {
				setLoading(true)
			}

			const tokenValue = await getLocalStoreTokenDts(navigate)
			const res = await axios.post(
				`${url_bdccb}/societyinfo/get_society_branch_analytics`,
				{
					view_mode: targetMode,
					pacs_id: targetSociety,
					branch_code: targetBranch,
					financial_year: targetFY,
					month: targetMonth,
					from_date: targetFromDate,
					to_date: targetToDate,
				},
				{
					headers: {
						Authorization: `${tokenValue?.token}`,
						"Content-Type": "application/json",
					},
				}
			)

			if (res?.data?.success) {
				setAnalyticsData(res.data)
				if (res.data.period?.from_date && !customParams.fromDate) {
					setFromDate(res.data.period.from_date)
				}
				if (res.data.period?.to_date && !customParams.toDate) {
					setToDate(res.data.period.to_date)
				}
			} else {
				Message("error", res?.data?.msg || "Failed to load analytics data")
			}
		} catch (err) {
			console.error("Error fetching analytics:", err)
			Message("error", "Error connecting to server for society/branch analytics")
		} finally {
			setLoading(false)
			setPeriodLoading(false)
		}
	}

	// Dynamically update From Date & To Date when Financial Year changes
	const handleFYChange = (fy) => {
		setFinancialYear(fy)
		setSelectedMonth("ALL")
		const parts = String(fy).split("-")
		const startYr = parseInt(parts[0], 10) || 2026
		const endYr = parseInt(parts[1], 10) || startYr + 1
		const newFrom = `${startYr}-04-01`
		const newTo = `${endYr}-03-31`
		setFromDate(newFrom)
		setToDate(newTo)
		fetchAnalytics({ fy, month: "ALL", fromDate: newFrom, toDate: newTo, isPeriodOnly: true })
	}

	// Dynamically update From Date & To Date when Month changes
	const handleMonthChange = (m) => {
		setSelectedMonth(m)
		const parts = String(financialYear).split("-")
		const startYr = parseInt(parts[0], 10) || 2026
		const endYr = parseInt(parts[1], 10) || startYr + 1

		let newFrom = `${startYr}-04-01`
		let newTo = `${endYr}-03-31`
		if (m !== "ALL") {
			const mNum = parseInt(m, 10)
			const yr = (mNum >= 1 && mNum <= 3) ? endYr : startYr
			const mm = String(mNum).padStart(2, "0")
			const lastDay = new Date(yr, mNum, 0).getDate()
			newFrom = `${yr}-${mm}-01`
			newTo = `${yr}-${mm}-${String(lastDay).padStart(2, "0")}`
		}
		setFromDate(newFrom)
		setToDate(newTo)
		fetchAnalytics({ month: m, fromDate: newFrom, toDate: newTo, isPeriodOnly: true })
	}

	// Full Refresh / Reset Handler: clears old data, resets selections, and reloads clean master dropdowns
	const handleFullRefresh = async () => {
		try {
			setLoading(true)
			setMasterLoading(true)
			setAnalyticsData(null)
			setSelectedBranch("")
			setSelectedSociety("")
			setFinancialYear("2026-2027")
			setSelectedMonth("ALL")
			setFromDate("2026-04-01")
			setToDate("2027-03-31")
			setSearchParams({}, { replace: true })
			navigate("/homebm/societyinfo", { replace: true })

			const tokenValue = await getLocalStoreTokenDts(navigate)
			const res = await axios.get(
				`${url_bdccb}/societyinfo/get_branches_and_societies?_t=${Date.now()}`,
				{
					headers: {
						Authorization: `${tokenValue?.token}`,
						"Content-Type": "application/json",
						"Cache-Control": "no-cache",
						Pragma: "no-cache",
					},
				}
			)
			if (res?.data?.success) {
				setBranches(res.data.branches || [])
				setSocieties(res.data.societies || [])
			}
			Message("success", "Page completely refreshed and reset")
		} catch (err) {
			console.error("Error performing full refresh:", err)
			Message("error", "Failed to refresh data")
		} finally {
			setLoading(false)
			setMasterLoading(false)
			setPeriodLoading(false)
		}
	}

	// Fetch Branches & Societies master list on initial mount
	useEffect(() => {
		const fetchMasters = async () => {
			try {
				setMasterLoading(true)
				const tokenValue = await getLocalStoreTokenDts(navigate)
				const res = await axios.get(
					`${url_bdccb}/societyinfo/get_branches_and_societies?_t=${Date.now()}`,
					{
						headers: {
							Authorization: `${tokenValue?.token}`,
							"Content-Type": "application/json",
							"Cache-Control": "no-cache",
							Pragma: "no-cache",
						},
					}
				)
				if (res?.data?.success) {
					setBranches(res.data.branches || [])
					setSocieties(res.data.societies || [])
				}
			} catch (err) {
				console.error("Error fetching master lists:", err)
				Message("error", "Failed to load branches and societies")
			} finally {
				setMasterLoading(false)
			}
		}
		fetchMasters()
	}, [])

	// When user clicks Radio button between Branch and Society
	const handleViewModeChange = (mode) => {
		setViewMode(mode)
		setAnalyticsData(null)
		setSelectedBranch("")
		setSelectedSociety("")
	}

	// When user selects a Branch from the serialwise branch dropdown
	const handleBranchChange = (val) => {
		const valStr = String(val || "")
		setSelectedBranch(valStr)
		if (valStr) {
			fetchAnalytics({
				mode: "branch",
				branch: valStr,
				society: "",
			})
		} else {
			setAnalyticsData(null)
		}
	}

	// When user selects a Society from the serialwise society dropdown
	const handleSocietyChange = (val) => {
		const valStr = String(val || "")
		setSelectedSociety(valStr)
		if (valStr) {
			fetchAnalytics({
				mode: "society",
				society: valStr,
				branch: "",
			})
		} else {
			setAnalyticsData(null)
		}
	}

	const groupsList = analyticsData?.groups_list || []
	const filteredGroups = groupsList.filter((g) => {
		if (!groupSearch.trim()) return true
		const q = groupSearch.toLowerCase().trim()
		return (
			String(g.group_name || "").toLowerCase().includes(q) ||
			String(g.group_code || "").toLowerCase().includes(q)
		)
	})

	const profile = analyticsData?.profile || analyticsData?.scope || {}
	const groupsSummary = analyticsData?.groups_summary || {}
	const membersSummary = analyticsData?.members_summary || {}
	const loansSummary = analyticsData?.loans_summary || {}
	const depositsSummary = analyticsData?.deposits_summary || {}
	const transDetails = analyticsData?.transactions_details || analyticsData?.transactions_summary || {}
	const monthlyBreakdown = analyticsData?.monthly_matrix || analyticsData?.monthly_breakdown || []

	const selectedMonthObj = MONTH_OPTIONS.find((m) => m.value === selectedMonth)
	const selectedMonthLabel = selectedMonthObj ? selectedMonthObj.label : "Full Year"

	// Utility to format currency
	const formatCurrency = (val) => {
		const num = Number(val) || 0
		return "₹" + num.toLocaleString("en-IN", { maximumFractionDigits: 2 })
	}

	// Utility to format date
	const formatDate = (val) => {
		if (!val) return "—"
		const d = moment(val)
		return d.isValid() ? d.format("DD/MM/YYYY") : "—"
	}

	return (
		<div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 space-y-6 pb-24 font-sans text-slate-900">
			{/* Top Bar with Navigation & Title */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
				<div className="flex items-center gap-3">
					<button
						onClick={() => navigate("/homebm/")}
						className="inline-flex items-center gap-2 px-3.5 py-2 bg-white text-slate-800 text-xs font-black rounded-xl border border-slate-300 shadow-xs hover:bg-slate-100 hover:text-slate-950 transition-all cursor-pointer"
					>
						<ArrowLeftOutlined />
						Dashboard
					</button>
					<span className="text-slate-300 font-bold">/</span>
					<span className="text-sm font-black text-slate-900 flex items-center gap-2">
						<div className="w-7 h-7 rounded-lg bg-teal-700 text-white flex items-center justify-center text-sm shadow-2xs">
							<AppstoreOutlinedIcon />
						</div>
						Branch & Society Intelligence
					</span>
				</div>
				<div className="flex items-center gap-2 self-start sm:self-auto">
					<button
						onClick={handleFullRefresh}
						disabled={loading || masterLoading}
						className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-800 hover:text-teal-900 text-xs font-black rounded-xl border border-slate-300 shadow-2xs transition-all cursor-pointer"
						title="Perform a full refresh of master lists and live analytics"
					>
						<ReloadOutlined spin={loading || masterLoading} className="text-teal-700" />
						<span>Refresh All</span>
					</button>
					<Tag color="cyan" className="font-black px-3 py-1 text-xs border border-teal-300 rounded-lg">
						HO & Branch Level Analytics
					</Tag>
				</div>
			</div>

			{/* ========================================================================= */}
			{/* MODERN SELECTION CONTROLS: 2 RADIO BUTTONS (BRANCH / SOCIETY) + DROPDOWN  */}
			{/* ========================================================================= */}
			<div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-6 relative overflow-hidden">
				{/* Top subtle decorative gradient bar */}
				<div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-600 via-indigo-600 to-emerald-600" />

				<div>
					<div className="flex items-center justify-between flex-wrap gap-2 mb-3">
						<span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
							Select Filter Category
						</span>
						<span className="text-xs text-slate-600 font-bold">
							Choose whether to analyze by Bank Branch or Cooperative Society
						</span>
					</div>

					{/* 2 Radio Buttons */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
						{/* Radio 1: Branch */}
						<label
							onClick={() => handleViewModeChange("branch")}
							className={`relative flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${viewMode === "branch"
								? "bg-teal-50/90 border-teal-600 shadow-sm ring-2 ring-teal-500/20"
								: "bg-white border-slate-300 hover:border-slate-400 hover:bg-slate-50/70"
								}`}
						>
							<input
								type="radio"
								name="filterCategory"
								value="branch"
								checked={viewMode === "branch"}
								onChange={() => handleViewModeChange("branch")}
								className="w-4 h-4 text-teal-600 border-slate-300 focus:ring-teal-500 cursor-pointer"
							/>
							<div className="flex items-center gap-3">
								<div
									className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold transition-all ${viewMode === "branch"
										? "bg-teal-600 text-white shadow-2xs"
										: "bg-slate-100 text-slate-700"
										}`}
								>
									<BankOutlined />
								</div>
								<div>
									<div
										className={`text-sm font-black uppercase tracking-wide ${viewMode === "branch" ? "text-teal-950" : "text-slate-900"
											}`}
									>
										Branch
									</div>
									<div className="text-xs text-slate-600 font-semibold">
										Select from serialwise branch list
									</div>
								</div>
							</div>
						</label>

						{/* Radio 2: Society */}
						<label
							onClick={() => handleViewModeChange("society")}
							className={`relative flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${viewMode === "society"
								? "bg-indigo-50/90 border-indigo-600 shadow-sm ring-2 ring-indigo-500/20"
								: "bg-white border-slate-300 hover:border-slate-400 hover:bg-slate-50/70"
								}`}
						>
							<input
								type="radio"
								name="filterCategory"
								value="society"
								checked={viewMode === "society"}
								onChange={() => handleViewModeChange("society")}
								className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
							/>
							<div className="flex items-center gap-3">
								<div
									className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold transition-all ${viewMode === "society"
										? "bg-indigo-600 text-white shadow-2xs"
										: "bg-slate-100 text-slate-700"
										}`}
								>
									<SafetyCertificateOutlined />
								</div>
								<div>
									<div
										className={`text-sm font-black uppercase tracking-wide ${viewMode === "society" ? "text-indigo-950" : "text-slate-900"
											}`}
									>
										Society
									</div>
									<div className="text-xs text-slate-600 font-semibold">
										Select from serialwise society list
									</div>
								</div>
							</div>
						</label>
					</div>
				</div>

				{/* Active Dropdown Row */}
				<div className="pt-4 border-t border-slate-200">
					{viewMode === "branch" ? (
						<div className="max-w-2xl">
							<label className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center justify-between mb-2">
								<span className="flex items-center gap-1.5">
									<BankOutlined className="text-teal-700 text-sm" />
									Select Branch (Serialwise List) *
								</span>
								<span className="text-[11px] text-slate-500 font-bold lowercase">
									{sortedBranches.length} branches available
								</span>
							</label>
							<Select
								showSearch
								allowClear
								loading={masterLoading}
								placeholder="Select Branch..."
								value={selectedBranch ? String(selectedBranch) : null}
								onChange={(val) => handleBranchChange(val || "")}
								className="w-full h-12 text-sm font-bold shadow-2xs"
								filterOption={(input, option) =>
									(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
								}
								options={sortedBranches.map((b) => ({
									label: `${b.branch_id} - ${b.branch_name}`,
									value: String(b.branch_id),
								}))}
							/>
						</div>
					) : (
						<div className="max-w-2xl">
							<label className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center justify-between mb-2">
								<span className="flex items-center gap-1.5">
									<SafetyCertificateOutlined className="text-indigo-700 text-sm" />
									Select Society (Serialwise List) *
								</span>
								<span className="text-[11px] text-slate-500 font-bold lowercase">
									{sortedSocieties.length} societies available
								</span>
							</label>
							<Select
								showSearch
								allowClear
								loading={masterLoading}
								placeholder="Select Society / PACS..."
								value={selectedSociety ? String(selectedSociety) : null}
								onChange={(val) => handleSocietyChange(val || "")}
								className="w-full h-12 text-sm font-bold shadow-2xs"
								filterOption={(input, option) =>
									(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
								}
								options={sortedSocieties.map((s) => ({
									label: `${s.pacs_id} - ${s.pacs_name}`,
									value: String(s.pacs_id),
								}))}
							/>
						</div>
					)}
				</div>
			</div>

			{/* ========================================================================= */}
			{/* MAIN ANALYTICS DASHBOARD CONTENT                                          */}
			{/* ========================================================================= */}
			{loading ? (
				<div className="flex flex-col items-center justify-center py-28 bg-white rounded-3xl border border-slate-200 shadow-sm">
					<Spin indicator={<LoadingOutlined style={{ fontSize: 46 }} spin className="text-teal-700" />} />
					<p className="mt-4 text-slate-900 font-black text-sm">
						Loading active groups, members, loans, deposits, and transaction flows...
					</p>
				</div>
			) : !analyticsData ? (
				<div className="bg-white rounded-3xl p-14 text-center border border-slate-200 shadow-sm space-y-4">
					<div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center text-3xl mx-auto shadow-2xs">
						<FilterOutlined />
					</div>
					<h3 className="text-xl font-black text-slate-950">
						{viewMode === "branch" ? "Please Select a Branch" : "Please Select a Society (PACS)"}
					</h3>
					<p className="text-xs text-slate-600 max-w-md mx-auto font-medium">
						Choose {viewMode === "branch" ? "a Bank Branch" : "a Cooperative Society"} from the dropdown above to immediately fetch active groups, member strength, loan books, savings deposits, and period transactions.
					</p>
				</div>
			) : (
				<div className="space-y-8">
					{/* ================================================================= */}
					{/* PROFILE & CONTACT INFORMATION BANNER                              */}
					{/* ================================================================= */}
					<div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
						<div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

						<div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
							<div className="space-y-2">
								<div className="flex flex-wrap items-center gap-2 mb-1.5">
									<span className="px-3 py-1 bg-white/10 text-white font-mono text-xs font-black rounded-lg border border-white/20">
										CODE: {profile.id || "N/A"}
									</span>
									<span className="px-3 py-1 bg-teal-500/20 text-teal-300 text-xs font-black rounded-lg border border-teal-500/30">
										{viewMode === "society" ? "COOPERATIVE SOCIETY (PACS)" : "BANK BRANCH"}
									</span>
									<span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-black rounded-lg border border-emerald-500/30 flex items-center gap-1.5">
										<CheckCircleOutlined />
										Live Status Till Date
									</span>
									<button
										onClick={() => fetchAnalytics({ isPeriodOnly: false, fromDate, toDate })}
										disabled={loading}
										className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg border border-white/20 inline-flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
										title="Reload live database figures for this selection"
									>
										<ReloadOutlined spin={loading} className="text-teal-300 text-xs" />
										<span>Reload Live Data</span>
									</button>
								</div>

								<h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
									{profile.name || "Selected Profile"}
								</h1>

								{/* Branch / Society Contact & Address Details */}
								<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-6 text-xs sm:text-sm text-slate-300 pt-1">
									{profile.parent_branch && (
										<span className="flex items-center gap-2 font-medium">
											<BankOutlined className="text-teal-400 text-sm" />
											<span><b className="text-white">Attached Branch:</b> {profile.parent_branch} {profile.parent_branch_code ? `(${profile.parent_branch_code})` : ""}</span>
										</span>
									)}
									{profile.contact_person && profile.contact_person !== "N/A" && (
										<span className="flex items-center gap-2 font-medium">
											<IdcardOutlined className="text-amber-400 text-sm" />
											<span><b className="text-white">Contact Person:</b> {profile.contact_person}</span>
										</span>
									)}
									{profile.phone && profile.phone !== "N/A" && (
										<span className="flex items-center gap-2 font-medium">
											<PhoneOutlined className="text-indigo-400 text-sm" />
											<span><b className="text-white">Phone:</b> {profile.phone}</span>
										</span>
									)}
									{profile.address && profile.address !== "N/A" && (
										<span className="flex items-center gap-2 font-medium col-span-1 sm:col-span-2">
											<EnvironmentOutlined className="text-sky-400 text-sm" />
											<span><b className="text-white">Address:</b> {profile.address} {profile.pin_no && profile.pin_no !== "N/A" ? `(PIN: ${profile.pin_no})` : ""}</span>
										</span>
									)}
								</div>
							</div>

							{/* Active Groups Highlight Card - Spacious, modern executive glass styling */}
							<div className="bg-slate-900/80 border border-slate-700/80 rounded-3xl p-6 sm:p-7 backdrop-blur-xl shadow-2xl self-start lg:self-auto min-w-[320px] lg:min-w-[340px] space-y-4 hover:border-emerald-500/40 transition-all">
								<div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-700/60">
									<div className="flex items-center gap-2.5">
										<div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm border border-emerald-500/30 shadow-xs">
											<TeamOutlined />
										</div>
										<span className="text-xs font-black uppercase tracking-wider text-slate-300">
											Active Portfolio Groups
										</span>
									</div>
									<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-black border border-emerald-500/30">
										<span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
										Live
									</span>
								</div>

								<div className="py-1 flex items-baseline gap-3">
									<div className="text-4xl sm:text-5xl font-black text-emerald-400 font-mono tracking-tight leading-none">
										{groupsSummary.active_groups || 0}
									</div>
									<span className="text-xs sm:text-sm font-bold text-slate-300">
										Active Groups
									</span>
								</div>

								<div className="pt-3 border-t border-slate-700/60 flex items-center justify-between gap-2 flex-wrap">
									<div className="flex items-center gap-1.5 text-xs text-slate-300">
										<span className="text-slate-400 font-medium">Registered:</span>
										<span className="px-2.5 py-1 rounded-lg bg-slate-800 text-white font-mono font-bold text-xs border border-slate-700">
											{groupsSummary.total_groups || 0}
										</span>
									</div>
									<div className="flex items-center gap-1.5 text-xs">
										<span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-bold text-xs flex items-center gap-1">
											<DollarOutlined className="text-amber-400" />
											{groupsSummary.loanee_groups || 0} Loanee
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* ========================================================================= */}
					{/* SECTION 1: CUMULATIVE POSITION TILL DATE                                  */}
					{/* ========================================================================= */}
					<div className="space-y-5">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b-2 border-slate-200">
							<div>
								<div className="flex items-center gap-2.5">
									<div className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
										1
									</div>
									<h2 className="text-lg sm:text-xl font-black text-slate-950 flex items-center gap-2">
										Current Position (Till Date)
									</h2>
									<Tag color="green" className="font-black text-xs px-2.5 py-0.5 border border-emerald-400 rounded-md">
										Cumulative Till Date
									</Tag>
								</div>
								<p className="text-xs text-slate-600 font-bold mt-1">
									Cumulative status as on date: active groups, member count, direct & indirect loans, and deposit accounts.
								</p>
							</div>
							<div className="text-xs text-slate-500 font-mono font-bold">
								Updated: {moment().format("DD MMM YYYY, hh:mm A")}
							</div>
						</div>

						{/* Top 2 Cards: Groups Active at Present & Members Belonging within Group */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
							{/* 1. No. of Groups Active at Present */}
							<div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4 hover:shadow-md transition-shadow">
								<div className="flex items-center justify-between">
									<div>
										<span className="text-[11px] font-black uppercase tracking-wider text-teal-800">
											Information Till Date
										</span>
										<h3 className="text-base font-black text-slate-950">
											No. of Groups Active at Present
										</h3>
									</div>
									<span className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-900 border border-teal-300 flex items-center justify-center text-xl font-black shadow-2xs">
										<TeamOutlined />
									</span>
								</div>

								<div className="flex items-baseline gap-3">
									<div className="text-4xl font-black text-teal-950 font-mono">
										{groupsSummary.active_groups || 0}
									</div>
									<span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300">
										Active Groups
									</span>
								</div>

								{/* Sub-breakdown: Total, Direct, Indirect, Closed, Loanee */}
								<div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-200 text-xs font-bold">
									<div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
										<div className="text-[10px] text-slate-600 uppercase font-extrabold">Total Groups</div>
										<div className="text-sm font-black text-slate-950 font-mono mt-0.5">
											{groupsSummary.total_groups || 0}
										</div>
									</div>
									<div className="bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-300">
										<div className="text-[10px] text-emerald-800 uppercase font-extrabold">Direct</div>
										<div className="text-sm font-black text-emerald-950 font-mono mt-0.5">
											{groupsSummary.direct_groups || 0}
										</div>
									</div>
									<div className="bg-indigo-50/80 p-2.5 rounded-xl border border-indigo-300">
										<div className="text-[10px] text-indigo-800 uppercase font-extrabold">Indirect (PACS)</div>
										<div className="text-sm font-black text-indigo-950 font-mono mt-0.5">
											{groupsSummary.indirect_groups || 0}
										</div>
									</div>
									<div className="bg-amber-50/80 p-2.5 rounded-xl border border-amber-300">
										<div className="text-[10px] text-amber-800 uppercase font-extrabold">Loanee Groups</div>
										<div className="text-sm font-black text-amber-950 font-mono mt-0.5">
											{groupsSummary.loanee_groups || 0}
										</div>
									</div>
									<div className="bg-rose-50/80 p-2.5 rounded-xl border border-rose-300 col-span-2 sm:col-span-1">
										<div className="text-[10px] text-rose-800 uppercase font-extrabold">Closed Groups</div>
										<div className="text-sm font-black text-rose-950 font-mono mt-0.5">
											{groupsSummary.closed_groups || 0}
										</div>
									</div>
								</div>
							</div>

							{/* 2. No. of Members Belonging within the Group */}
							<div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4 hover:shadow-md transition-shadow">
								<div className="flex items-center justify-between">
									<div>
										<span className="text-[11px] font-black uppercase tracking-wider text-sky-800">
											Information Till Date
										</span>
										<h3 className="text-base font-black text-slate-950">
											No. of Members Belonging within Group
										</h3>
									</div>
									<span className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-900 border border-sky-300 flex items-center justify-center text-xl font-black shadow-2xs">
										<UserOutlined />
									</span>
								</div>

								<div className="flex items-baseline gap-3">
									<div className="text-4xl font-black text-slate-950 font-mono">
										{membersSummary.total_members || 0}
									</div>
									<span className="text-xs font-extrabold text-sky-800 bg-sky-100 px-2.5 py-1 rounded-lg border border-sky-300">
										Total Members Enrolled
									</span>
								</div>

								{/* Member Breakdown */}
								<div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-200 text-xs font-bold">
									<div className="bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-300">
										<div className="text-[10px] text-emerald-800 uppercase font-extrabold">Direct Members</div>
										<div className="text-sm font-black text-emerald-950 font-mono mt-0.5">
											{membersSummary.direct_members || 0}
										</div>
									</div>
									<div className="bg-indigo-50/80 p-2.5 rounded-xl border border-indigo-300">
										<div className="text-[10px] text-indigo-800 uppercase font-extrabold">Indirect Members</div>
										<div className="text-sm font-black text-indigo-950 font-mono mt-0.5">
											{membersSummary.indirect_members || 0}
										</div>
									</div>
									<div className="bg-pink-50/80 p-2.5 rounded-xl border border-pink-300">
										<div className="text-[10px] text-pink-800 uppercase font-extrabold">Female Members</div>
										<div className="text-sm font-black text-pink-950 font-mono mt-0.5">
											{membersSummary.female_members || 0}
										</div>
									</div>
									<div className="bg-sky-50/80 p-2.5 rounded-xl border border-sky-300">
										<div className="text-[10px] text-sky-800 uppercase font-extrabold">Male Members</div>
										<div className="text-sm font-black text-sky-950 font-mono mt-0.5">
											{membersSummary.male_members || 0}
										</div>
									</div>
									<div className="bg-amber-50/80 p-2.5 rounded-xl border border-amber-300 col-span-2 sm:col-span-1">
										<div className="text-[10px] text-amber-800 uppercase font-extrabold">Group Leaders</div>
										<div className="text-sm font-black text-amber-950 font-mono mt-0.5">
											{membersSummary.leaders_count || 0}
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* In-depth Row: Loans (Direct & Indirect) and Deposit Accounts (No. & Amount) */}
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
							{/* 3. No. and Amount of Loans — Direct & Indirect (Till Date) */}
							<div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
								<div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
									<div>
										<span className="text-[11px] font-black uppercase tracking-wider text-amber-800">
											Information Till Date
										</span>
										<h3 className="text-base font-black text-slate-950 flex items-center gap-2">
											<DollarOutlined className="text-amber-700 text-base" />
											Loans Portfolio — Direct & Indirect
										</h3>
									</div>
									<div className="text-left sm:text-right">
										<div className="text-[10px] text-slate-500 font-extrabold uppercase">Total Outstanding</div>
										<div className="text-base font-black text-amber-800 font-mono">
											{formatCurrency(loansSummary.total_outstanding || 0)}
										</div>
									</div>
								</div>

								{/* Direct vs Indirect Comparison Cards */}
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									{/* Direct Loans */}
									<div className="bg-teal-50/80 border-2 border-teal-300 rounded-2xl p-4 space-y-3">
										<div className="flex items-center justify-between">
											<span className="px-2.5 py-1 bg-teal-200 text-teal-950 text-xs font-black rounded-lg border border-teal-400">
												DIRECT LOANS
											</span>
											<span className="text-xs font-mono font-black text-teal-900">
												{loansSummary.direct_active_loan_count || 0} Active / {loansSummary.direct_loan_count || 0} Total
											</span>
										</div>

										<div className="space-y-2 pt-1">
											<div className="bg-white p-3 rounded-xl border border-teal-200 flex justify-between items-center">
												<span className="text-xs font-bold text-slate-700">No. of Loans:</span>
												<span className="text-sm font-black text-teal-950 font-mono">
													{loansSummary.direct_loan_count || 0}
												</span>
											</div>
											<div className="bg-white p-3 rounded-xl border border-teal-200 flex justify-between items-center">
												<span className="text-xs font-bold text-slate-700">Disbursed Amt:</span>
												<span className="text-sm font-black text-slate-950 font-mono">
													{formatCurrency(loansSummary.direct_disb_amt || 0)}
												</span>
											</div>
											<div className="bg-white p-3 rounded-xl border border-teal-200 flex justify-between items-center">
												<span className="text-xs font-bold text-slate-700">Outstanding Amt:</span>
												<span className="text-sm font-black text-teal-950 font-mono">
													{formatCurrency(loansSummary.direct_outstanding || 0)}
												</span>
											</div>
										</div>
									</div>

									{/* Indirect Loans */}
									<div className="bg-indigo-50/80 border-2 border-indigo-300 rounded-2xl p-4 space-y-3">
										<div className="flex items-center justify-between">
											<span className="px-2.5 py-1 bg-indigo-200 text-indigo-950 text-xs font-black rounded-lg border border-indigo-400">
												INDIRECT (PACS) LOANS
											</span>
											<span className="text-xs font-mono font-black text-indigo-900">
												{loansSummary.indirect_active_loan_count || 0} Active / {loansSummary.indirect_loan_count || 0} Total
											</span>
										</div>

										<div className="space-y-2 pt-1">
											<div className="bg-white p-3 rounded-xl border border-indigo-200 flex justify-between items-center">
												<span className="text-xs font-bold text-slate-700">No. of Loans:</span>
												<span className="text-sm font-black text-indigo-950 font-mono">
													{loansSummary.indirect_loan_count || 0}
												</span>
											</div>
											<div className="bg-white p-3 rounded-xl border border-indigo-200 flex justify-between items-center">
												<span className="text-xs font-bold text-slate-700">Disbursed Amt:</span>
												<span className="text-sm font-black text-slate-950 font-mono">
													{formatCurrency(loansSummary.indirect_disb_amt || 0)}
												</span>
											</div>
											<div className="bg-white p-3 rounded-xl border border-indigo-200 flex justify-between items-center">
												<span className="text-xs font-bold text-slate-700">Outstanding Amt:</span>
												<span className="text-sm font-black text-indigo-950 font-mono">
													{formatCurrency(loansSummary.indirect_outstanding || 0)}
												</span>
											</div>
										</div>
									</div>
								</div>

								{/* Additional CCB Loans and Member Loans Information */}
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
									<div className="bg-slate-50 p-3 rounded-2xl border border-slate-300 flex justify-between items-center text-xs">
										<div>
											<span className="text-[10px] uppercase font-black text-slate-600 block">CCB Loans</span>
											<span className="font-mono font-bold text-slate-900">{loansSummary.ccb_loan_count || 0} loans ({loansSummary.ccb_active_count || 0} active)</span>
										</div>
										<div className="text-right">
											<span className="text-[10px] uppercase font-black text-slate-600 block">Disbursed</span>
											<span className="font-mono font-black text-teal-950">{formatCurrency(loansSummary.ccb_disb_amt || 0)}</span>
										</div>
									</div>

									<div className="bg-slate-50 p-3 rounded-2xl border border-slate-300 flex justify-between items-center text-xs">
										<div>
											<span className="text-[10px] uppercase font-black text-slate-600 block">Member Loans</span>
											<span className="font-mono font-bold text-slate-900">{loansSummary.member_loan_count || 0} loans ({loansSummary.member_active_count || 0} active)</span>
										</div>
										<div className="text-right">
											<span className="text-[10px] uppercase font-black text-slate-600 block">Disbursed</span>
											<span className="font-mono font-black text-indigo-950">{formatCurrency(loansSummary.member_disb_amt || 0)}</span>
										</div>
									</div>
								</div>

								{/* Combined Total Bar */}
								<div className="bg-slate-100 p-3.5 rounded-2xl border border-slate-300 flex flex-wrap items-center justify-between gap-3 text-xs font-extrabold text-slate-800">
									<div>
										Combined Total: <b className="text-slate-950 font-mono">{loansSummary.total_loan_count || 0} loans</b> ({loansSummary.active_loan_count || 0} active)
									</div>
									<div className="flex items-center gap-4">
										<span>Disbursed: <b className="text-slate-950 font-mono">{formatCurrency(loansSummary.total_disb_amt || 0)}</b></span>
										<span>Outstanding: <b className="text-amber-800 font-mono">{formatCurrency(loansSummary.total_outstanding || 0)}</b></span>
									</div>
								</div>
							</div>

							{/* 4. Deposit A/Cs (No. and Amount — Till Date) */}
							<div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
								<div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
									<div>
										<span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
											Information Till Date
										</span>
										<h3 className="text-base font-black text-slate-950 flex items-center gap-2">
											<WalletOutlined className="text-emerald-700 text-base" />
											Deposit A/Cs (No. and Amount)
										</h3>
									</div>
									<div className="text-left sm:text-right">
										<div className="text-[10px] text-slate-500 font-extrabold uppercase">Total Savings Balance</div>
										<div className="text-base font-black text-emerald-800 font-mono">
											{formatCurrency(depositsSummary.total_deposit_amount || 0)}
										</div>
									</div>
								</div>

								{/* Group Deposits vs Member SB */}
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									{/* Group Master Deposit Accounts */}
									<div className="bg-teal-50/80 border-2 border-teal-300 rounded-2xl p-4 space-y-3">
										<div className="flex items-center justify-between">
											<span className="px-2.5 py-1 bg-teal-200 text-teal-950 text-xs font-black rounded-lg border border-teal-400">
												GROUP DEPOSIT A/CS
											</span>
											{/* <span className="text-xs font-mono font-black text-teal-900">
												td_deposit
											</span> */}
										</div>

										<div className="space-y-2 pt-1">
											<div className="bg-white p-3 rounded-xl border border-teal-200 flex justify-between items-center">
												<span className="text-xs font-bold text-slate-700">No. of Accounts:</span>
												<span className="text-sm font-black text-teal-950 font-mono">
													{depositsSummary.group_dep_count || 0}
												</span>
											</div>
											<div className="bg-white p-3 rounded-xl border border-teal-200 flex justify-between items-center">
												<span className="text-xs font-bold text-slate-700">Total Balance:</span>
												<span className="text-sm font-black text-emerald-900 font-mono">
													{formatCurrency(depositsSummary.group_dep_amount || 0)}
												</span>
											</div>
										</div>
										<div className="text-[11px] text-teal-800 font-bold">
											SHG master savings accounts maintained
										</div>
									</div>

									{/* Individual Member SB Accounts */}
									<div className="bg-sky-50/80 border-2 border-sky-300 rounded-2xl p-4 space-y-3">
										<div className="flex items-center justify-between">
											<span className="px-2.5 py-1 bg-sky-200 text-sky-950 text-xs font-black rounded-lg border border-sky-400">
												MEMBER SB A/CS
											</span>
											{/* <span className="text-xs font-mono font-black text-sky-900">
												td_sb
											</span> */}
										</div>

										<div className="space-y-2 pt-1">
											<div className="bg-white p-3 rounded-xl border border-sky-200 flex justify-between items-center">
												<span className="text-xs font-bold text-slate-700">No. of Accounts:</span>
												<span className="text-sm font-black text-sky-950 font-mono">
													{depositsSummary.member_sb_count || 0}
												</span>
											</div>
											<div className="bg-white p-3 rounded-xl border border-sky-200 flex justify-between items-center">
												<span className="text-xs font-bold text-slate-700">Total Balance:</span>
												<span className="text-sm font-black text-emerald-900 font-mono">
													{formatCurrency(depositsSummary.member_sb_amount || 0)}
												</span>
											</div>
										</div>
										<div className="text-[11px] text-sky-800 font-bold">
											Individual member savings passbook accounts
										</div>
									</div>
								</div>

								{/* Combined Deposit Summary Bar */}
								<div className="bg-slate-100 p-3.5 rounded-2xl border border-slate-300 flex flex-wrap items-center justify-between gap-3 text-xs font-extrabold text-slate-800">
									<div>
										Total Accounts: <b className="text-slate-950 font-mono">{depositsSummary.total_deposit_accounts || 0} accounts</b>
									</div>
									<div>
										Combined Savings: <b className="text-emerald-800 font-mono text-sm">{formatCurrency(depositsSummary.total_deposit_amount || 0)}</b>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* ========================================================================= */}
					{/* SECTION 2: TRANSACTIONS DETAILS (BY FINANCIAL YEAR / MONTH)               */}
					{/* ========================================================================= */}
					<div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-6">
						{/* Section Header & Period Selector Toolbar */}
						<div className="flex flex-col lg:flex-row lg:items-center justify-between pb-5 border-b border-slate-200 gap-4">
							<div>
								<div className="flex items-center gap-2.5 flex-wrap">
									<div className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
										2
									</div>
									<h2 className="text-lg sm:text-xl font-black text-slate-950 flex items-center gap-2">
										<BarChartOutlined className="text-indigo-700 text-lg" />
										Transactions Details (Financial Year / Month)
									</h2>
									<Tag color="purple" className="font-black text-xs px-2.5 py-0.5 border border-purple-300 rounded-md">
										Period Filtered
									</Tag>
								</div>
								<p className="text-xs text-slate-600 font-bold mt-1">
									Flow of loan disbursements, loan recovery, and member savings transactions during the selected Financial Year and Month.
								</p>
							</div>

							{/* Period Controls Integrated in Section 2 (Dynamic FY, Month, From Date & To Date) */}
							<div className="flex flex-wrap items-end gap-2.5 bg-slate-100/90 p-3 rounded-2xl border border-slate-300">
								<div>
									<span className="text-[10px] font-black uppercase text-slate-600 block mb-1">
										Financial Year
									</span>
									<Select
										value={financialYear}
										onChange={handleFYChange}
										className="w-36 h-9 font-bold text-xs"
										options={FY_OPTIONS}
									/>
								</div>

								<div>
									<span className="text-[10px] font-black uppercase text-slate-600 block mb-1">
										Month
									</span>
									<Select
										value={selectedMonth}
										onChange={handleMonthChange}
										className="w-36 h-9 font-bold text-xs"
										options={MONTH_OPTIONS}
									/>
								</div>

								<div>
									<span className="text-[10px] font-black uppercase text-slate-600 block mb-1">
										From Date *
									</span>
									<input
										type="date"
										value={fromDate}
										onChange={(e) => setFromDate(e.target.value)}
										className="h-9 px-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 shadow-2xs"
									/>
								</div>

								<div>
									<span className="text-[10px] font-black uppercase text-slate-600 block mb-1">
										To Date *
									</span>
									<input
										type="date"
										value={toDate}
										onChange={(e) => setToDate(e.target.value)}
										className="h-9 px-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 shadow-2xs"
									/>
								</div>

								<button
									type="button"
									onClick={() => fetchAnalytics({ isPeriodOnly: false, fromDate, toDate })}
									disabled={loading || periodLoading}
									className="h-9 px-4 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
									title="Click to perform full refresh of all data"
								>
									{loading || periodLoading ? <LoadingOutlined /> : <ReloadOutlined />}
									Full Refresh
								</button>
							</div>
						</div>

						{/* Period Active Badge with Dynamic Date Range and Quick Shortcuts */}
						<div className="flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-700 bg-indigo-50/70 p-3 rounded-xl border border-indigo-200">
							<span className="flex items-center gap-2 flex-wrap">
								<CalendarOutlined className="text-indigo-700 text-sm" />
								<span>Active Dynamic Period:</span>
								<span className="px-2 py-0.5 bg-white text-indigo-950 font-black rounded border border-indigo-300 font-mono text-xs">
									{formatDate(fromDate)}
								</span>
								<span>to</span>
								<span className="px-2 py-0.5 bg-white text-indigo-950 font-black rounded border border-indigo-300 font-mono text-xs">
									{formatDate(toDate)}
								</span>
								<span className="text-slate-400">|</span>
								<span className="text-slate-600">FY: <b>{financialYear}</b> ({selectedMonthLabel})</span>
							</span>
							<div className="flex items-center gap-1.5 text-[11px]">
								<span className="text-slate-500 font-medium">Quick Presets:</span>
								<button
									type="button"
									onClick={() => handleFYChange(financialYear)}
									className="px-2.5 py-0.5 bg-white hover:bg-slate-100 rounded-md text-indigo-800 font-bold border border-slate-300 cursor-pointer shadow-2xs"
								>
									Full FY
								</button>
								<button
									type="button"
									onClick={() => {
										const today = moment().format("YYYY-MM-DD")
										setFromDate(today)
										setToDate(today)
										fetchAnalytics({ fromDate: today, toDate: today, isPeriodOnly: true })
									}}
									className="px-2.5 py-0.5 bg-white hover:bg-slate-100 rounded-md text-indigo-800 font-bold border border-slate-300 cursor-pointer shadow-2xs"
								>
									Today
								</button>
								<button
									type="button"
									onClick={() => {
										const today = moment().format("YYYY-MM-DD")
										const mStart = moment().startOf("month").format("YYYY-MM-DD")
										setFromDate(mStart)
										setToDate(today)
										fetchAnalytics({ fromDate: mStart, toDate: today, isPeriodOnly: true })
									}}
									className="px-2.5 py-0.5 bg-white hover:bg-slate-100 rounded-md text-indigo-800 font-bold border border-slate-300 cursor-pointer shadow-2xs"
								>
									Month to Date
								</button>
							</div>
						</div>

						{/* 3 Metric Cards: Loan Disbursed, Loan Recovery, SB Transactions */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
							{/* Transaction 1: Loan Disbursed */}
							<div className="p-5 bg-blue-50/90 rounded-2xl border-2 border-blue-300 space-y-3">
								<div className="flex items-center justify-between">
									<span className="text-xs font-black uppercase text-blue-900 tracking-wider">
										LOAN DISBURSED
									</span>
									<span className="w-9 h-9 rounded-xl bg-blue-200 text-blue-950 border border-blue-400 flex items-center justify-center font-black text-base">
										<ArrowDownOutlined />
									</span>
								</div>
								<div className="text-3xl font-black text-blue-950 font-mono">
									{formatCurrency(transDetails.total_disb_amt || 0)}
								</div>
								<div className="text-xs text-blue-950 font-bold bg-white/80 p-2.5 rounded-lg border border-blue-200 space-y-1">
									<div className="flex justify-between">
										<span>CCB Disbursed:</span>
										<span className="font-mono font-black">{formatCurrency(transDetails.ccb_trans?.disb_amt || 0)}</span>
									</div>
									<div className="flex justify-between">
										<span>Society Disbursed:</span>
										<span className="font-mono font-black">{formatCurrency(transDetails.society_trans?.disb_amt || 0)}</span>
									</div>
									<div className="flex justify-between">
										<span>Member Disbursed:</span>
										<span className="font-mono font-black">{formatCurrency(transDetails.member_trans?.disb_amt || 0)}</span>
									</div>
									<div className="flex justify-between pt-1 border-t border-blue-200 text-blue-900 text-[11px]">
										<span>Disbursement Count:</span>
										<span className="font-mono font-black">{transDetails.total_disb_count || 0} loans</span>
									</div>
								</div>
							</div>

							{/* Transaction 2: Loan Recovery */}
							<div className="p-5 bg-emerald-50/90 rounded-2xl border-2 border-emerald-300 space-y-3">
								<div className="flex items-center justify-between">
									<span className="text-xs font-black uppercase text-emerald-900 tracking-wider">
										LOAN RECOVERY
									</span>
									<span className="w-9 h-9 rounded-xl bg-emerald-200 text-emerald-950 border border-emerald-400 flex items-center justify-center font-black text-base">
										<ArrowUpOutlined />
									</span>
								</div>
								<div className="text-3xl font-black text-emerald-950 font-mono">
									{formatCurrency(transDetails.total_recov_amt || 0)}
								</div>
								<div className="text-xs text-emerald-950 font-bold bg-white/80 p-2.5 rounded-lg border border-emerald-200 space-y-1">
									<div className="flex justify-between">
										<span>Principal Recovery:</span>
										<span className="font-mono font-black">{formatCurrency(transDetails.total_prn_recov || 0)}</span>
									</div>
									<div className="flex justify-between">
										<span>Interest Recovery:</span>
										<span className="font-mono font-black">{formatCurrency(transDetails.total_intt_recov || 0)}</span>
									</div>
									<div className="flex justify-between text-[11px] text-emerald-800">
										<span>CCB / Soc / Member:</span>
										<span className="font-mono font-bold">
											{formatCurrency(transDetails.ccb_trans?.recov_amt || 0)} / {formatCurrency(transDetails.society_trans?.recov_amt || 0)} / {formatCurrency(transDetails.member_trans?.recov_amt || 0)}
										</span>
									</div>
									<div className="flex justify-between pt-1 border-t border-emerald-200 text-emerald-900 text-[11px]">
										<span>Recovery Transactions:</span>
										<span className="font-mono font-black">{transDetails.total_recov_count || 0}</span>
									</div>
								</div>
							</div>

							{/* Transaction 3: SB Transactions (Deposit / Withdrawal) */}
							<div className="p-5 bg-purple-50/90 rounded-2xl border-2 border-purple-300 space-y-3">
								<div className="flex items-center justify-between">
									<span className="text-xs font-black uppercase text-purple-900 tracking-wider">
										SB TRANSACTIONS (DEP / WITH)
									</span>
									<span className="w-9 h-9 rounded-xl bg-purple-200 text-purple-950 border border-purple-400 flex items-center justify-center font-black text-base">
										<WalletOutlined />
									</span>
								</div>
								<div className="text-xs text-slate-800 space-y-1.5 bg-white/80 p-2.5 rounded-lg border border-purple-200">
									<div className="flex justify-between font-bold">
										<span className="text-emerald-800">Total SB Deposits:</span>
										<span className="font-mono font-black text-emerald-950">
											+{formatCurrency(transDetails.total_sb_dep_amt || 0)} ({transDetails.total_sb_dep_count || 0})
										</span>
									</div>
									<div className="flex justify-between font-bold">
										<span className="text-rose-800">Total SB Withdrawals:</span>
										<span className="font-mono font-black text-rose-950">
											-{formatCurrency(transDetails.total_sb_with_amt || 0)} ({transDetails.total_sb_with_count || 0})
										</span>
									</div>
									<div className="text-[10px] text-purple-800 flex justify-between">
										<span>Grp Dep / Mem SB:</span>
										<span className="font-mono">
											{formatCurrency(transDetails.group_deposit_trans?.dep_amt || 0)} / {formatCurrency(transDetails.member_sb_trans?.dep_amt || 0)}
										</span>
									</div>
								</div>
								<div className="pt-2 border-t-2 border-purple-200 flex justify-between items-center text-xs font-black">
									<span className="text-purple-950">Net SB Inflow / Outflow:</span>
									<span
										className={`font-mono text-sm px-2 py-0.5 rounded-md ${(transDetails.sb_net_flow || 0) >= 0
											? "bg-emerald-100 text-emerald-950 border border-emerald-300"
											: "bg-rose-100 text-rose-950 border border-rose-300"
											}`}
									>
										{(transDetails.sb_net_flow || 0) >= 0 ? "+" : ""}
										{formatCurrency(transDetails.sb_net_flow || 0)}
									</span>
								</div>
							</div>
						</div>

						{/* Month-by-Month Movement Table for Selected FY */}
						{monthlyBreakdown.length > 0 && (
							<div className="pt-2 space-y-3">
								<div className="flex items-center justify-between">
									<h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
										<CalendarOutlined className="text-indigo-700" />
										Month-by-Month FY Movement Matrix ({financialYear})
									</h4>
									<span className="text-[11px] font-bold text-slate-500">
										April to March Financial Timeline
									</span>
								</div>

								<div className="overflow-x-auto rounded-2xl border border-slate-300">
									<table className="w-full text-left text-xs text-slate-800">
										<thead className="bg-slate-200 text-slate-900 font-black border-b border-slate-300 uppercase tracking-wider text-[11px]">
											<tr>
												<th className="py-3 px-4">Accounting Month</th>
												<th className="py-3 px-4 text-right">Loan Disbursed</th>
												<th className="py-3 px-4 text-right">Loan Recovery</th>
												<th className="py-3 px-4 text-right">SB Deposits</th>
												<th className="py-3 px-4 text-right">SB Withdrawals</th>
												<th className="py-3 px-4 text-right">Net SB Flow</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-slate-200 bg-white">
											{monthlyBreakdown.map((m, idx) => {
												const disb = parseFloat(m.loan_disbursed) || 0
												const recov = parseFloat(m.loan_recovery) || 0
												const dep = parseFloat(m.sb_deposit) || 0
												const wit = parseFloat(m.sb_withdrawal) || 0
												const net = dep - wit
												return (
													<tr key={m.month_key || idx} className="hover:bg-slate-100/90 transition-colors">
														<td className="py-3 px-4 font-black text-slate-900">{m.month_name}</td>
														<td className="py-3 px-4 text-right font-mono text-blue-950 font-bold">
															{disb > 0 ? formatCurrency(disb) : "-"}
														</td>
														<td className="py-3 px-4 text-right font-mono text-emerald-950 font-bold">
															{recov > 0 ? formatCurrency(recov) : "-"}
														</td>
														<td className="py-3 px-4 text-right font-mono text-emerald-900 font-bold">
															{dep > 0 ? formatCurrency(dep) : "-"}
														</td>
														<td className="py-3 px-4 text-right font-mono text-rose-900 font-bold">
															{wit > 0 ? formatCurrency(wit) : "-"}
														</td>
														<td
															className={`py-3 px-4 text-right font-mono font-black ${net >= 0 ? "text-emerald-950" : "text-rose-900"
																}`}
														>
															{net !== 0 ? (net > 0 ? "+" : "") + formatCurrency(net) : "-"}
														</td>
													</tr>
												)
											})}
										</tbody>
									</table>
								</div>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	)
}

// Icon helper
function AppstoreOutlinedIcon() {
	return (
		<svg viewBox="64 64 896 896" focusable="false" data-icon="appstore" width="1em" height="1em" fill="currentColor" aria-hidden="true">
			<path d="M464 144H160c-8.8 0-16 7.2-16 16v304c0 8.8 7.2 16 16 16h304c8.8 0 16-7.2 16-16V160c0-8.8-7.2-16-16-16zm-52 268H212V212h200v200zm452-268H560c-8.8 0-16 7.2-16 16v304c0 8.8 7.2 16 16 16h304c8.8 0 16-7.2 16-16V160c0-8.8-7.2-16-16-16zm-52 268H612V212h200v200zM464 544H160c-8.8 0-16 7.2-16 16v304c0 8.8 7.2 16 16 16h304c8.8 0 16-7.2 16-16V560c0-8.8-7.2-16-16-16zm-52 268H212V612h200v200zm452-268H560c-8.8 0-16 7.2-16 16v304c0 8.8 7.2 16 16 16h304c8.8 0 16-7.2 16-16V560c0-8.8-7.2-16-16-16zm-52 268H612V612h200v200z"></path>
		</svg>
	)
}

export default SocietyInfoBM
