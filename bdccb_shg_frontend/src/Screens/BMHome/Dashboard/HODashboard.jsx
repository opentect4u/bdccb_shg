import React, { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import moment from "moment"
import axios from "axios"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"
import html2pdf from "html2pdf.js"
import { url_bdccb } from "../../../Address/BaseUrl"
import { getLocalStoreTokenDts } from "../../../Components/getLocalforageTokenDts"

export default function HODashboard() {
	const navigate = useNavigate()
	const rawUser = JSON.parse(localStorage.getItem("user_details"))
	const userDetails = Array.isArray(rawUser) ? rawUser[0] || {} : rawUser || {}

	// Filter states
	const [selectedPeriod, setSelectedPeriod] = useState("Today")
	const [selectedBranch, setSelectedBranch] = useState("All branches")
	const [selectedBlock, setSelectedBlock] = useState("All blocks")
	const [selectedLoanType, setSelectedLoanType] = useState("di")
	const [branchesList, setBranchesList] = useState([])
	const [blocksList, setBlocksList] = useState([])
	const [exportingPdf, setExportingPdf] = useState(false)
	const [exportingExcel, setExportingExcel] = useState(false)
	const [watchlistType, setWatchlistType] = useState("PACS")
	const [blockToggle, setBlockToggle] = useState("Outstanding")
	const [branchSortBy, setBranchSortBy] = useState("overdue_pct_desc")

	// Current date of operation and refresh timestamp
	const dateOfOperation = moment().format("DD-MM-YYYY")
	const [lastRefreshed, setLastRefreshed] = useState(moment().format("HH:mm"))

	// Fetch real branches list from API if available
	useEffect(() => {
		const fetchBranches = async () => {
			try {
				const tokenValue = await getLocalStoreTokenDts(navigate)
				const res = await axios.get(`${url_bdccb}/dashboard/fetch_brn_soc_name`, {
					params: { select_type: "B" },
					headers: {
						Authorization: `${tokenValue?.token}`,
						"Content-Type": "application/json",
					},
				})
				if (res?.data?.success && Array.isArray(res?.data?.data)) {
					const list = res.data.data
						.map((item) => ({
							code: String(item.branch_id || item.code || ""),
							name: item.branch_name || item.name || "",
						}))
						.filter((item) => item.code && item.code !== "112" && item.code !== "100")
					setBranchesList(list)
					setLastRefreshed(moment().format("HH:mm"))
				}
			} catch (err) {
				console.warn("Could not fetch branches list in HODashboard:", err)
			}
		}
		fetchBranches()
	}, [navigate])


	// Fetch Block list from API
	useEffect(() => {
		const fetchBlocks = async () => {
			try {
				const tokenValue = await getLocalStoreTokenDts(navigate)
				const res = await axios.get(`${url_bdccb}/dashboard/get_block_list`, {
					headers: {
						Authorization: `${tokenValue?.token}`,
						"Content-Type": "application/json",
					},
				})
				if (res?.data?.success && Array.isArray(res?.data?.data)) {
					const list = res.data.data.map((item) => ({
						code: String(item.block_id || item.code || ""),
						name: item.block_name || item.name || "",
					}))
					setBlocksList(list)
				}
			} catch (err) {
				console.warn("Could not fetch block list in HODashboard:", err)
			}
		}
		fetchBlocks()
	}, [navigate])

	// Data states from HO API
	const [dashboardData, setDashboardData] = useState(null)
	const [loadingDashboard, setLoadingDashboard] = useState(false)
	const [branchPerformanceRows, setBranchPerformanceRows] = useState([])
	const [loadingBranchRows, setLoadingBranchRows] = useState(false)

	// Currency and Number formatters
	const formatCurrency = (amt) => {
		if (amt === undefined || amt === null || isNaN(amt)) return "₹ 0"
		return `₹ ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amt)}`
	}
	const formatCount = (cnt) => {
		if (cnt === undefined || cnt === null || isNaN(cnt)) return "0"
		return new Intl.NumberFormat("en-IN").format(cnt)
	}

	// Fetch Head Office Dashboard aggregate data based on selectedPeriod & filters
	useEffect(() => {
		const fetchDashboardData = async () => {
			try {
				setLoadingDashboard(true)
				const tokenValue = await getLocalStoreTokenDts(navigate)

				// 1. Branch code array: if particular branch send [branch_code], if all branch send all branch_code in array
				let branchCodePayload = []
				if (selectedBranch === "All branches" || selectedBranch === "ALL" || !selectedBranch) {
					branchCodePayload = branchesList.map((b) => b.code)
				} else {
					branchCodePayload = [selectedBranch]
				}

				// 2. Block id array: if particular block send [block_id], if all block send all block_id in array
				let blockIdPayload = []
				const isAllBlocks = selectedBlock === "All blocks" || selectedBlock === "ALL" || !selectedBlock
				if (isAllBlocks) {
					blockIdPayload = blocksList.map((b) => b.code)
				} else {
					blockIdPayload = [selectedBlock]
				}

				// 3. Loan type: direct+indirect -> di, direct -> d, indirect -> i
				const loanTypePayload = selectedLoanType || "di"

				const res = await axios.post(
					`${url_bdccb}/dashboard/get_ho_dashboard_data`,
					{
						period: selectedPeriod,
						branch_code: branchCodePayload,
						branch_id: selectedBranch,
						pacs_id: [],
						block_id: blockIdPayload,
						loan_type: loanTypePayload,
						is_all_branch: selectedBranch === "All branches",
						is_all_pacs: true,
						is_all_blocks: isAllBlocks,
						tenant_id: userDetails?.tenant_id || 1,
					},
					{
						headers: {
							Authorization: `${tokenValue?.token}`,
							"Content-Type": "application/json",
						},
					}
				)
				if (res?.data?.success && res?.data?.data) {
					setDashboardData(res.data.data)
					setLastRefreshed(moment().format("HH:mm"))
				}
			} catch (err) {
				console.warn("Could not fetch HO Dashboard data:", err)
			} finally {
				setLoadingDashboard(false)
			}
		}
		fetchDashboardData()
	}, [
		selectedPeriod,
		selectedBranch,
		selectedBlock,
		selectedLoanType,
		branchesList,
		blocksList,
		navigate,
		userDetails?.tenant_id,
	])

	// Fetch Branch-wise Performance Table data
	useEffect(() => {
		const fetchPerformance = async () => {
			try {
				setLoadingBranchRows(true)
				const tokenValue = await getLocalStoreTokenDts(navigate)
				const res = await axios.post(
					`${url_bdccb}/dashboard/get_ho_branch_performance`,
					{
						period: selectedPeriod,
						sort_by: branchSortBy,
					},
					{
						headers: {
							Authorization: `${tokenValue?.token}`,
							"Content-Type": "application/json",
						},
					}
				)
				if (res?.data?.success && Array.isArray(res?.data?.data)) {
					setBranchPerformanceRows(res.data.data)
				}
			} catch (err) {
				console.warn("Could not fetch branch performance:", err)
			} finally {
				setLoadingBranchRows(false)
			}
		}
		fetchPerformance()
	}, [selectedPeriod, branchSortBy, navigate])

	// Period Options
	const periodButtons = ["Today", "This Month", "This Quarter", "FY to date"]

	// Dynamic Demand vs Collection trend based on selectedPeriod
	const demandCollectionData = useMemo(() => {
		if (dashboardData?.demand_vs_collection) {
			const dvc = dashboardData.demand_vs_collection
			const labels = dvc.labels || []
			const demand = dvc.demand || []
			const collected = dvc.collected || []
			const recoveryPct = dvc.recovery_pct || []

			const maxVal = Math.max(...demand, ...collected, 1)

			return {
				labels,
				demand,
				collected,
				recoveryPct,
				demandFormatted: demand.map(formatCurrency),
				collectedFormatted: collected.map(formatCurrency),
				demandBarHeight: demand.map((d) => (maxVal > 0 ? Math.max(d > 0 ? 8 : 2, Math.min(100, Math.round((d / maxVal) * 100))) : 2)),
				collectedBarHeight: collected.map((c) => (maxVal > 0 ? Math.max(c > 0 ? 8 : 2, Math.min(100, Math.round((c / maxVal) * 100))) : 2)),
				totalDemand: demand.reduce((a, b) => a + b, 0),
				totalCollected: collected.reduce((a, b) => a + b, 0),
			}
		}

		const defaultLabels = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"]
		return {
			labels: defaultLabels,
			demand: defaultLabels.map(() => 0),
			collected: defaultLabels.map(() => 0),
			recoveryPct: defaultLabels.map(() => 0),
			demandFormatted: defaultLabels.map(() => "₹ 0"),
			collectedFormatted: defaultLabels.map(() => "₹ 0"),
			demandBarHeight: defaultLabels.map(() => 2),
			collectedBarHeight: defaultLabels.map(() => 2),
			totalDemand: 0,
			totalCollected: 0,
		}
	}, [dashboardData])

	// Branch rows for performance table
	const defaultBranchRows = useMemo(() => {
		if (branchesList.length > 0) {
			return branchesList.slice(0, 10).map((b, i) => ({
				code: b.code,
				name: b.name,
				block: "Bankura",
				directShg: 0,
				pacs: 0,
				indirectShg: 0,
				members: 0,
				outstanding: "₹ 0",
				overdue: "₹ 0",
				overduePct: "0%",
				recoveryPct: "0%",
				notDeposited: "₹ 0",
				pendingApprovals: 0,
			}))
		}
		return []
	}, [branchesList])

	// Ageing Brackets
	const ageingBrackets = useMemo(() => {
		if (dashboardData?.ageing) {
			const ag = dashboardData.ageing
			return [
				{ label: "1–30 days", width: ag.age_1_30 > 0 ? "70%" : "0%", amt: formatCurrency(ag.age_1_30) },
				{ label: "31–90 days", width: ag.age_31_90 > 0 ? "50%" : "0%", amt: formatCurrency(ag.age_31_90) },
				{ label: "91–180 days", width: ag.age_91_180 > 0 ? "35%" : "0%", amt: formatCurrency(ag.age_91_180) },
				{ label: "181–365 days", width: ag.age_181_365 > 0 ? "22%" : "0%", amt: formatCurrency(ag.age_181_365) },
				{ label: "> 1 year", width: ag.age_over_1y > 0 ? "15%" : "0%", amt: formatCurrency(ag.age_over_1y) },
			]
		}
		return [
			{ label: "1–30 days", width: "0%", amt: "₹ 0" },
			{ label: "31–90 days", width: "0%", amt: "₹ 0" },
			{ label: "91–180 days", width: "0%", amt: "₹ 0" },
			{ label: "181–365 days", width: "0%", amt: "₹ 0" },
			{ label: "> 1 year", width: "0%", amt: "₹ 0" },
		]
	}, [dashboardData])

	// Dynamic Watchlist items
	const dynamicWatchlist = useMemo(() => {
		if (dashboardData?.watchlist) {
			const list = watchlistType === "PACS" ? dashboardData.watchlist.pacs : dashboardData.watchlist.shg
			if (list && list.length > 0) {
				return list.map((item) => ({
					name: item.name,
					branch: item.branch,
					amt: formatCurrency(item.amt),
				}))
			}
		}
		return []
	}, [dashboardData, watchlistType])

	// Dynamic Blocks data based on selected blockToggle (Outstanding, Disbursed, Overdue, Purpose-wise)
	const dynamicBlockData = useMemo(() => {
		if (dashboardData?.blocks && dashboardData.blocks.length > 0) {
			const getVal = (b) => {
				if (blockToggle === "Disbursed") return Number(b.total_disb) || 0
				if (blockToggle === "Overdue") return Number(b.total_ovd) || 0
				return Number(b.total_out) || 0
			}
			const maxVal = Math.max(...dashboardData.blocks.map(getVal), 1)
			return dashboardData.blocks.map((b) => {
				const val = getVal(b)
				return {
					name: b.name,
					amt: formatCurrency(val),
					width: maxVal > 0 && val > 0 ? `${Math.max(12, Math.min(100, Math.round((val / maxVal) * 100)))}%` : "0%",
				}
			})
		}
		return []
	}, [dashboardData, blockToggle])

	// Dynamic Table Rows
	const sortedTableRows = useMemo(() => {
		const base = branchPerformanceRows.length > 0 ? branchPerformanceRows : defaultBranchRows
		const list = [...base]
		if (branchSortBy === "name_asc") {
			return list.sort((a, b) => a.name.localeCompare(b.name))
		}
		if (branchSortBy === "outstanding_desc") {
			return list.sort((a, b) => {
				const aVal = Number(String(a.outstanding).replace(/[^0-9.-]+/g, "")) || 0
				const bVal = Number(String(b.outstanding).replace(/[^0-9.-]+/g, "")) || 0
				return bVal - aVal
			})
		}
		if (branchSortBy === "recovery_desc") {
			return list.sort((a, b) => {
				const aVal = parseFloat(a.recoveryPct) || 0
				const bVal = parseFloat(b.recoveryPct) || 0
				return bVal - aVal
			})
		}
		// overdue_pct_desc
		return list.sort((a, b) => {
			const aVal = parseFloat(a.overduePct) || 0
			const bVal = parseFloat(b.overduePct) || 0
			return bVal - aVal
		})
	}, [branchPerformanceRows, defaultBranchRows, branchSortBy])

	// Table Totals
	const tableTotals = useMemo(() => {
		const directShg = sortedTableRows.reduce((acc, r) => acc + (Number(r.directShg) || 0), 0)
		const pacs = sortedTableRows.reduce((acc, r) => acc + (Number(r.pacs) || 0), 0)
		const indirectShg = sortedTableRows.reduce((acc, r) => acc + (Number(r.indirectShg) || 0), 0)
		const members = sortedTableRows.reduce((acc, r) => acc + (Number(r.members) || 0), 0)
		const pendingApprovals = sortedTableRows.reduce((acc, r) => acc + (Number(r.pendingApprovals) || 0), 0)
		return {
			directShg: formatCount(directShg),
			pacs: formatCount(pacs),
			indirectShg: formatCount(indirectShg),
			members: formatCount(members),
			outstanding: dashboardData ? formatCurrency(dashboardData.portfolio.total_outstanding) : "₹ 0",
			overdue: dashboardData ? formatCurrency(dashboardData.portfolio.total_overdue) : "₹ 0",
			overduePct: dashboardData ? `${dashboardData.portfolio.par_pct}%` : "0%",
			recoveryPct: dashboardData ? `${dashboardData.portfolio.recovery_pct}%` : "0%",
			notDeposited: dashboardData ? formatCurrency(dashboardData.recovery_pipeline.collected_not_deposited) : "₹ 0",
			pendingApprovals: formatCount(pendingApprovals),
		}
	}, [sortedTableRows, dashboardData])

	// Export to PDF function
	const handleExportPDF = () => {
		const element = document.getElementById("ho-dashboard-container")
		if (!element) return
		setExportingPdf(true)
		const opt = {
			margin: [0.2, 0.2, 0.2, 0.2],
			filename: `HO_Dashboard_${selectedPeriod.replace(/\s+/g, "_")}_${moment().format("YYYYMMDD_HHmmss")}.pdf`,
			image: { type: "jpeg", quality: 0.98 },
			html2canvas: { scale: 1.2, useCORS: true, logging: false },
			jsPDF: { unit: "in", format: "a3", orientation: "landscape" },
		}
		html2pdf()
			.from(element)
			.set(opt)
			.save()
			.then(() => setExportingPdf(false))
			.catch((err) => {
				console.error("PDF generation error:", err)
				setExportingPdf(false)
			})
	}

	// Export to Excel function
	const handleExportExcel = async () => {
		try {
			setExportingExcel(true)
			const workbook = new ExcelJS.Workbook()
			workbook.creator = "BDCCB Head Office"
			workbook.created = new Date()

			// Sheet 1: Branch Performance Table
			const ws1 = workbook.addWorksheet("Branch Performance")
			ws1.columns = [
				{ header: "Branch Code", key: "code", width: 14 },
				{ header: "Branch Name", key: "name", width: 28 },
				{ header: "Block", key: "block", width: 20 },
				{ header: "Direct SHGs", key: "directShg", width: 14 },
				{ header: "PACS Count", key: "pacs", width: 14 },
				{ header: "Indirect SHGs", key: "indirectShg", width: 14 },
				{ header: "Total Members", key: "members", width: 16 },
				{ header: "Outstanding", key: "outstanding", width: 20 },
				{ header: "Overdue", key: "overdue", width: 18 },
				{ header: "Overdue %", key: "overduePct", width: 14 },
				{ header: "Recovery %", key: "recoveryPct", width: 14 },
				{ header: "Not Deposited CCB", key: "notDeposited", width: 20 },
				{ header: "Pending Approvals", key: "pendingApprovals", width: 18 },
			]

			sortedTableRows.forEach((r) => {
				ws1.addRow({
					code: r.code,
					name: r.name,
					block: r.block,
					directShg: r.directShg,
					pacs: r.pacs,
					indirectShg: r.indirectShg,
					members: r.members,
					outstanding: r.outstanding,
					overdue: r.overdue,
					overduePct: r.overduePct,
					recoveryPct: r.recoveryPct,
					notDeposited: r.notDeposited,
					pendingApprovals: r.pendingApprovals,
				})
			})

			ws1.getRow(1).eachCell((cell) => {
				cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
				cell.fill = {
					type: "pattern",
					pattern: "solid",
					fgColor: { argb: "FF0F6B73" },
				}
			})

			// Sheet 2: Portfolio Snapshot Summary
			const ws2 = workbook.addWorksheet("Portfolio Summary")
			ws2.columns = [
				{ header: "Filter / Metric", key: "metric", width: 32 },
				{ header: "Value", key: "value", width: 28 },
			]
			ws2.addRows([
				{ metric: "Selected Period", value: selectedPeriod },
				{ metric: "Selected Branch", value: selectedBranch },
				{ metric: "Selected Block", value: selectedBlock },
				{
					metric: "Selected Loan Type",
					value:
						selectedLoanType === "di"
							? "Direct + Indirect"
							: selectedLoanType === "d"
								? "Direct only"
								: "Indirect only",
				},
				{ metric: "Total Loan Outstanding", value: formatCurrency(dashboardData?.portfolio?.total_outstanding) },
				{ metric: "Direct Outstanding", value: formatCurrency(dashboardData?.portfolio?.direct_outstanding) },
				{ metric: "Indirect Outstanding", value: formatCurrency(dashboardData?.portfolio?.indirect_outstanding) },
				{ metric: "Total Overdue Amount", value: formatCurrency(dashboardData?.portfolio?.total_overdue) },
				{ metric: "Overdue % (PAR)", value: `${dashboardData?.portfolio?.par_pct || 0}%` },
				{ metric: "Total SHG Groups", value: formatCount(dashboardData?.portfolio?.total_groups) },
				{ metric: "SHG Members", value: formatCount(dashboardData?.portfolio?.total_members) },
				{ metric: "SB Deposit Balance", value: formatCurrency(dashboardData?.portfolio?.total_deposit_balance) },
				{ metric: "Recovery %", value: `${dashboardData?.portfolio?.recovery_pct || 0}%` },
			])
			ws2.getRow(1).eachCell((cell) => {
				cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
				cell.fill = {
					type: "pattern",
					pattern: "solid",
					fgColor: { argb: "FF166534" },
				}
			})

			const buffer = await workbook.xlsx.writeBuffer()
			const fileName = `HO_Dashboard_${selectedPeriod.replace(/\s+/g, "_")}_${moment().format("YYYYMMDD_HHmmss")}.xlsx`
			saveAs(new Blob([buffer]), fileName)
		} catch (err) {
			console.error("Error exporting to Excel:", err)
		} finally {
			setExportingExcel(false)
		}
	}

	return (
		<div id="ho-dashboard-container" className="p-6 md:p-8 flex flex-col gap-6 bg-slate-50 min-h-screen rounded-3xl shadow-sm font-sans pb-16">
			<div className="w-full flex flex-col gap-6">

				{/* SECTION A · CONTEXT & FILTERS */}
				<section
					aria-label="Filters"
					className="bg-white border border-[#d9dee3] rounded-xl p-5 shadow-sm flex flex-col gap-4"
				>
					<div className="flex flex-wrap justify-between items-baseline gap-2">
						<div>
							<div className="text-[11px] font-bold tracking-wider text-[#0f6b73] uppercase">
								A · CONTEXT &amp; FILTERS
							</div>
							<h1 className="text-xl font-semibold text-[#1f2933] mt-1">
								Welcome, {userDetails?.user_name || "Admin"} · Head Office
							</h1>
						</div>
						<div className="text-xs text-[#4a5560]">
							{loadingDashboard ? (
								<span className="text-[#0f6b73] font-medium animate-pulse">Updating live data...</span>
							) : (
								<>
									Date of operation: <strong className="text-[#1f2933]">{dateOfOperation}</strong> · Last refreshed:{" "}
									<span className="font-mono font-medium">{lastRefreshed}</span>
								</>
							)}
						</div>
					</div>

					{/* Filter Controls Row */}
					<div className="flex flex-wrap items-end gap-3.5 xl:gap-4">
						{/* Branch Selector */}
						<label className="flex flex-col gap-1 text-xs text-[#4a5560] flex-1 min-w-[150px]">
							<span className="font-semibold text-slate-600">Branch</span>
							<select
								value={selectedBranch}
								onChange={(e) => setSelectedBranch(e.target.value)}
								className="h-10 border border-[#c5ccd3] rounded-lg px-2.5 text-xs bg-white text-[#1f2933] focus:outline-none focus:ring-1 focus:ring-[#0f6b73]"
							>
								<option value="All branches">All branches</option>
								{branchesList.map((b) => (
									<option key={b.code} value={b.code}>
										{b.code} - {b.name}
									</option>
								))}
							</select>
						</label>

						{/* Block Selector */}
						<label className="flex flex-col gap-1 text-xs text-[#4a5560] flex-1 min-w-[150px]">
							<span className="font-semibold text-slate-600">Block</span>
							<select
								value={selectedBlock}
								onChange={(e) => setSelectedBlock(e.target.value)}
								className="h-10 border border-[#c5ccd3] rounded-lg px-2.5 text-xs bg-white text-[#1f2933] focus:outline-none focus:ring-1 focus:ring-[#0f6b73]"
							>
								<option value="All blocks">All blocks</option>
								{blocksList.map((b) => (
									<option key={b.code} value={b.code}>
										{b.name}
									</option>
								))}
							</select>
						</label>

						{/* Loan Type Selector */}
						<label className="flex flex-col gap-1 text-xs text-[#4a5560] flex-1 min-w-[150px]">
							<span className="font-semibold text-slate-600">Loan type</span>
							<select
								value={selectedLoanType}
								onChange={(e) => setSelectedLoanType(e.target.value)}
								className="h-10 border border-[#c5ccd3] rounded-lg px-2.5 text-xs bg-white text-[#1f2933] focus:outline-none focus:ring-1 focus:ring-[#0f6b73]"
							>
								<option value="di">Direct + Indirect</option>
								<option value="d">Direct only</option>
								<option value="i">Indirect only</option>
							</select>
						</label>

						{/* Right Side Column: Export Buttons Transferred ABOVE Period */}
						<div className="flex flex-col gap-2 items-end ml-auto">
							{/* Export PDF Button positioned ABOVE Period */}
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={handleExportPDF}
									disabled={exportingPdf}
									className="h-8 px-3 rounded-md border border-[#0f6b73] bg-white text-[#0f6b73] hover:bg-[#0f6b73] hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 whitespace-nowrap disabled:opacity-50"
									title="Download Dashboard as PDF"
								>
									<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
										<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
										<polyline points="14 2 14 8 20 8"></polyline>
										<line x1="16" y1="13" x2="8" y2="13"></line>
										<line x1="16" y1="17" x2="8" y2="17"></line>
									</svg>
									<span>{exportingPdf ? "Generating PDF..." : "Export PDF"}</span>
								</button>
							</div>

							{/* Period Toggle Buttons (Below Export Buttons) */}
							<div className="flex flex-col gap-1 text-xs text-[#4a5560]">
								<div
									role="group"
									aria-label="Period"
									className="inline-flex items-center p-1 bg-[#f1f5f9] border border-[#c5ccd3] rounded-lg h-9 gap-1 shadow-sm"
								>
									{periodButtons.map((period) => {
										const active = selectedPeriod === period
										return (
											<button
												key={period}
												type="button"
												onClick={() => setSelectedPeriod(period)}
												className={`h-7 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${active
													? "bg-[#0f6b73] text-white shadow-sm"
													: "text-[#4a5560] hover:text-[#1f2933] hover:bg-white/80"
													}`}
											>
												{period}
											</button>
										)
									})}
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* SECTION B · PORTFOLIO SNAPSHOT (as on date) */}
				<section aria-label="Portfolio snapshot" className="flex flex-col gap-2.5">
					<div className="text-[11px] font-bold tracking-wider text-[#0f6b73] uppercase">
						B · PORTFOLIO SNAPSHOT ({selectedPeriod})
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
						{/* Card 1: Total loan outstanding */}
						<article
							onClick={() => navigate("/homebm/loan_transaction_report")}
							className="bg-white border border-[#d9dee3] rounded-xl p-4 flex flex-col gap-1.5 shadow-sm hover:border-[#0f6b73] transition-all cursor-pointer"
						>
							<div className="text-xs text-[#4a5560] font-medium">Total loan outstanding</div>
							<div className="text-[20px] font-bold text-slate-900 leading-snug">
								{dashboardData ? formatCurrency(dashboardData.portfolio.total_outstanding) : "₹ 0"}
							</div>
							<div className="text-[11px] text-[#4a5560]">
								{dashboardData
									? `Direct ${formatCurrency(dashboardData.portfolio.direct_outstanding)} · Indirect ${formatCurrency(dashboardData.portfolio.indirect_outstanding)}`
									: "Direct ₹ 0 · Indirect ₹ 0"}
							</div>
							<div className="text-[10px] text-teal-700 font-medium">
								{dashboardData ? `Disbursed in ${selectedPeriod}: ${formatCurrency(dashboardData.portfolio.period_disb_amt)}` : ""}
							</div>
						</article>

						{/* Card 2: Overdue amount */}
						<article
							onClick={() => navigate("/homebm/loan_transaction_report")}
							className="bg-white border border-[#d9dee3] rounded-xl p-4 flex flex-col gap-1.5 shadow-sm hover:border-[#0f6b73] transition-all cursor-pointer"
						>
							<div className="text-xs text-[#4a5560] font-medium">Overdue amount</div>
							<div className="text-[20px] font-bold text-[#c2410c] leading-snug">
								{dashboardData ? formatCurrency(dashboardData.portfolio.total_overdue) : "₹ 0"}
							</div>
							<div className="text-[11px] text-[#4a5560]">
								{dashboardData ? `${dashboardData.portfolio.par_pct}% of outstanding (PAR)` : "0% of outstanding (PAR)"}
							</div>
						</article>

						{/* Card 3: SHG groups */}
						<article
							onClick={() => navigate("/homebm/searchgroup")}
							className="bg-white border border-[#d9dee3] rounded-xl p-4 flex flex-col gap-1.5 shadow-sm hover:border-[#0f6b73] transition-all cursor-pointer"
						>
							<div className="text-xs text-[#4a5560] font-medium">SHG groups ({selectedPeriod})</div>
							<div className="text-[20px] font-bold text-slate-900 leading-snug">
								{dashboardData ? formatCount(dashboardData.portfolio.period_groups) : "0"}
							</div>
							<div className="text-[11px] text-[#4a5560]">
								{dashboardData
									? `Direct ${formatCount(dashboardData.portfolio.period_direct_groups)} · Indirect ${formatCount(dashboardData.portfolio.period_indirect_groups)} · With loan ${formatCount(dashboardData.portfolio.period_groups_with_loan)}`
									: "Direct 0 · Indirect 0 · With loan 0"}
							</div>
							<div className="text-[10px] text-slate-500 font-medium">
								{dashboardData ? `Total active portfolio: ${formatCount(dashboardData.portfolio.total_groups)} groups` : ""}
							</div>
						</article>

						{/* Card 4: SHG members */}
						<article
							onClick={() => navigate("/homebm/searchmember")}
							className="bg-white border border-[#d9dee3] rounded-xl p-4 flex flex-col gap-1.5 shadow-sm hover:border-[#0f6b73] transition-all cursor-pointer"
						>
							<div className="text-xs text-[#4a5560] font-medium">SHG members ({selectedPeriod})</div>
							<div className="text-[20px] font-bold text-slate-900 leading-snug">
								{dashboardData ? formatCount(dashboardData.portfolio.period_members) : "0"}
							</div>
							<div className="text-[11px] text-[#4a5560]">
								{dashboardData
									? `Women ${formatCount(dashboardData.portfolio.period_women_members)} · SC/ST ${formatCount(dashboardData.portfolio.period_sc_st_members)}`
									: "Women 0 · SC/ST 0"}
							</div>
							<div className="text-[10px] text-slate-500 font-medium">
								{dashboardData ? `Total active portfolio: ${formatCount(dashboardData.portfolio.total_members)} members` : ""}
							</div>
						</article>

						{/* Card 5: SB deposit balance */}
						<article
							onClick={() => navigate("/homebm/shg_savings_balance_report")}
							className="bg-white border border-[#d9dee3] rounded-xl p-4 flex flex-col gap-1.5 shadow-sm hover:border-[#0f6b73] transition-all cursor-pointer"
						>
							<div className="text-xs text-[#4a5560] font-medium">SB deposit balance</div>
							<div className="text-[20px] font-bold text-slate-900 leading-snug">
								{dashboardData ? formatCurrency(dashboardData.portfolio.total_sb_balance) : "₹ 0"}
							</div>
							<div className="text-[11px] text-[#4a5560]">
								{dashboardData ? `${formatCount(dashboardData.portfolio.sb_accounts)} SB accounts` : "0 SB accounts"}
							</div>
							<div className="text-[10px] text-teal-700 font-medium">
								{dashboardData ? `Net flow in ${selectedPeriod}: ${formatCurrency(dashboardData.sb_deposits.net_sb_flow)}` : ""}
							</div>
						</article>

						{/* Card 6: Recovery % (period) */}
						<article
							onClick={() => navigate("/homebm/loan_transaction_report")}
							className="bg-white border border-[#d9dee3] rounded-xl p-4 flex flex-col gap-1.5 shadow-sm hover:border-[#0f6b73] transition-all cursor-pointer"
						>
							<div className="text-xs text-[#4a5560] font-medium">Recovery % ({selectedPeriod})</div>
							<div className="text-[20px] font-bold text-[#0f6b73] leading-snug">
								{dashboardData ? `${dashboardData.portfolio.recovery_pct}%` : "0%"}
							</div>
							<div className="text-[11px] text-[#4a5560]">
								{dashboardData ? `Collected ${formatCurrency(dashboardData.portfolio.period_recov_amt)} ÷ Demand ${formatCurrency(dashboardData.portfolio.period_demand)}` : "Collected ÷ EMI demand"}
							</div>
						</article>
					</div>
				</section>

				{/* SECTIONS C + D: LOAN DISBURSEMENT & RECOVERY PIPELINE */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
					{/* C · LOAN DISBURSEMENT */}
					<section
						aria-label="Loan disbursement flow"
						className="bg-white border border-[#d9dee3] rounded-xl p-5 shadow-sm flex flex-col gap-3.5"
					>
						<div className="flex justify-between items-baseline gap-2 flex-wrap">
							<div>
								<div className="text-[11px] font-bold tracking-wider text-[#0f6b73] uppercase">
									C · LOAN DISBURSEMENT ({selectedPeriod})
								</div>
								<h2 className="text-base font-semibold text-slate-900 mt-1">
									Disbursed in {selectedPeriod}
								</h2>
							</div>
							<span className="text-xs text-[#4a5560] font-medium">Count · Amount</span>
						</div>

						{/* 4 Rows */}
						<div className="flex flex-col gap-2.5">
							<div className="flex items-center gap-3 p-3 border border-[#e3e7eb] rounded-lg hover:bg-slate-50 transition-colors">
								<span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#e6f2f3] text-[#0b5157] min-w-[64px] text-center">
									DIRECT
								</span>
								<span className="flex-1 text-xs font-semibold text-slate-800">Branch → SHG</span>
								<span className="text-xs text-[#4a5560] font-mono">
									{dashboardData ? formatCount(dashboardData.disbursement.direct_disb_count) : "0"}
								</span>
								<span className="text-sm font-bold min-w-[120px] text-right font-mono text-slate-900">
									{dashboardData ? formatCurrency(dashboardData.disbursement.direct_disb_amt) : "₹ 0"}
								</span>
							</div>

							<div className="flex items-center gap-3 p-3 border border-[#e3e7eb] rounded-lg hover:bg-slate-50 transition-colors">
								<span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#e6f2f3] text-[#0b5157] min-w-[64px] text-center">
									INDIRECT
								</span>
								<span className="flex-1 text-xs font-semibold text-slate-800">Branch → PACS</span>
								<span className="text-xs text-[#4a5560] font-mono">
									{dashboardData ? formatCount(dashboardData.disbursement.indirect_pacs_count) : "0"}
								</span>
								<span className="text-sm font-bold min-w-[120px] text-right font-mono text-slate-900">
									{dashboardData ? formatCurrency(dashboardData.disbursement.indirect_pacs_amt) : "₹ 0"}
								</span>
							</div>

							<div className="flex items-center gap-3 p-3 border border-[#e3e7eb] rounded-lg hover:bg-slate-50 transition-colors">
								<span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#e6f2f3] text-[#0b5157] min-w-[64px] text-center">
									INDIRECT
								</span>
								<span className="flex-1 text-xs font-semibold text-slate-800">PACS → SHG</span>
								<span className="text-xs text-[#4a5560] font-mono">
									{dashboardData ? formatCount(dashboardData.disbursement.indirect_pacs_count) : "0"}
								</span>
								<span className="text-sm font-bold min-w-[120px] text-right font-mono text-slate-900">
									{dashboardData ? formatCurrency(dashboardData.disbursement.indirect_pacs_amt) : "₹ 0"}
								</span>
							</div>

							<div className="flex items-center gap-3 p-3 border border-[#e3e7eb] rounded-lg hover:bg-slate-50 transition-colors">
								<span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#e6f2f3] text-[#0b5157] min-w-[64px] text-center">
									MEMBER
								</span>
								<span className="flex-1 text-xs font-semibold text-slate-800">
									SHG → Members (distributed)
								</span>
								<span className="text-xs text-[#4a5560] font-mono">
									{dashboardData ? formatCount(dashboardData.disbursement.direct_disb_count) : "0"}
								</span>
								<span className="text-sm font-bold min-w-[120px] text-right font-mono text-slate-900">
									{dashboardData ? formatCurrency(dashboardData.disbursement.direct_disb_amt) : "₹ 0"}
								</span>
							</div>
						</div>

						{/* Alert Dashed Box: Accept Pending */}
						<div className="flex justify-between items-center p-3 rounded-lg bg-[#fff4e5] border border-dashed border-[#d97706]">
							<span className="text-xs font-semibold text-[#7c3d06]">
								Accept Pending (loans not yet accepted by PACS / SHG)
							</span>
							<span className="text-xs font-bold text-[#7c3d06] font-mono">
								{dashboardData
									? `${formatCount(dashboardData.disbursement.pending_disb_count)} · ${formatCurrency(dashboardData.disbursement.pending_disb_amt)}`
									: "0 · ₹ 0"}
							</span>
						</div>
					</section>

					{/* D · RECOVERY PIPELINE */}
					<section
						aria-label="Recovery and collection pipeline"
						className="bg-white border border-[#d9dee3] rounded-xl p-5 shadow-sm flex flex-col gap-3.5"
					>
						<div>
							<div className="text-[11px] font-bold tracking-wider text-[#0f6b73] uppercase">
								D · RECOVERY PIPELINE ({selectedPeriod})
							</div>
							<h2 className="text-base font-semibold text-slate-900 mt-1">
								Where collected money is sitting ({selectedPeriod})
							</h2>
						</div>

						{/* 3 Step Cards */}
						<div className="flex flex-wrap items-stretch gap-2.5">
							<div className="flex-1 min-w-[120px] flex flex-col gap-1 p-3 border border-[#c5ccd3] rounded-lg bg-[#f6f8fa]">
								<span className="text-[10px] text-[#4a5560] font-bold tracking-wider uppercase">
									STEP 1
								</span>
								<span className="text-xs font-semibold text-slate-800">Collected at SHG</span>
								<span className="text-base font-bold text-slate-900 font-mono mt-1">
									{dashboardData ? formatCurrency(dashboardData.recovery_pipeline.step1_shg) : "₹ 0"}
								</span>
							</div>

							<div className="flex-1 min-w-[120px] flex flex-col gap-1 p-3 border border-[#c5ccd3] rounded-lg bg-[#f6f8fa]">
								<span className="text-[10px] text-[#4a5560] font-bold tracking-wider uppercase">
									STEP 2
								</span>
								<span className="text-xs font-semibold text-slate-800">Deposited at PACS</span>
								<span className="text-base font-bold text-slate-900 font-mono mt-1">
									{dashboardData ? formatCurrency(dashboardData.recovery_pipeline.step2_pacs) : "₹ 0"}
								</span>
							</div>

							<div className="flex-1 min-w-[120px] flex flex-col gap-1 p-3 border border-[#c5ccd3] rounded-lg bg-[#f6f8fa]">
								<span className="text-[10px] text-[#4a5560] font-bold tracking-wider uppercase">
									STEP 3
								</span>
								<span className="text-xs font-semibold text-slate-800">Deposited at Branch (CCB)</span>
								<span className="text-base font-bold text-slate-900 font-mono mt-1">
									{dashboardData ? formatCurrency(dashboardData.recovery_pipeline.step3_ccb) : "₹ 0"}
								</span>
							</div>
						</div>

						{/* 2 Warning Status Boxes */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
							<div className="p-3 rounded-lg bg-[#fff4e5] border border-dashed border-[#d97706] flex flex-col gap-1">
								<span className="text-xs font-semibold text-[#7c3d06]">Collected but not deposited</span>
								<span className="text-base font-bold text-[#7c3d06] font-mono">
									{dashboardData
										? `${formatCurrency(dashboardData.recovery_pipeline.collected_not_deposited)} · ${formatCount(dashboardData.recovery_pipeline.collected_not_depo_groups)} groups`
										: "₹ 0 · 0 groups"}
								</span>
							</div>

							<div className="p-3 rounded-lg bg-[#fff4e5] border border-dashed border-[#d97706] flex flex-col gap-1">
								<span className="text-xs font-semibold text-[#7c3d06]">
									Deposit Pending (awaiting Branch/PACS bifurcation)
								</span>
								<span className="text-base font-bold text-[#7c3d06] font-mono">
									{dashboardData ? `${formatCurrency(dashboardData.recovery_pipeline.deposit_pending)} · 0 txns` : "₹ 0 · 0 txns"}
								</span>
							</div>
						</div>

						{/* Bottom Summary Row */}
						<div className="flex flex-wrap justify-between text-xs pt-2 border-t border-[#e3e7eb] text-slate-700 font-medium">
							<span>
								Recovered — Principal:{" "}
								<strong className="font-mono text-slate-900">
									{dashboardData ? formatCurrency(dashboardData.recovery_pipeline.recovered_principal) : "₹ 0"}
								</strong>
							</span>
							<span>
								Interest:{" "}
								<strong className="font-mono text-slate-900">
									{dashboardData ? formatCurrency(dashboardData.recovery_pipeline.recovered_interest) : "₹ 0"}
								</strong>
							</span>
							<span>
								Penal:{" "}
								<strong className="font-mono text-slate-900">
									{dashboardData ? formatCurrency(dashboardData.recovery_pipeline.recovered_penal) : "₹ 0"}
								</strong>
							</span>
						</div>
					</section>
				</div>

				{/* SECTIONS E + F: DEMAND vs COLLECTION & OVERDUE & AGEING */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
					{/* E · DEMAND vs COLLECTION */}
					<section
						aria-label="Demand versus collection trend"
						className="bg-white border border-[#d9dee3] rounded-xl p-5 shadow-sm flex flex-col gap-3.5"
					>
						<div className="flex justify-between items-center flex-wrap gap-2">
							<div>
								<div className="text-[11px] font-bold tracking-wider text-[#0f6b73] uppercase">
									E · DEMAND vs COLLECTION ({selectedPeriod})
								</div>
								<h2 className="text-base font-semibold text-slate-900 mt-1">
									Breakdown for {selectedPeriod}
								</h2>
							</div>
							<div className="flex items-center gap-3.5 text-xs text-[#4a5560]">
								<span className="flex items-center gap-1.5">
									<span className="w-3 h-3 bg-[#9aa5b1] rounded-sm inline-block"></span>
									<span>EMI demand</span>
								</span>
								<span className="flex items-center gap-1.5">
									<span className="w-3 h-3 bg-[#0f6b73] rounded-sm inline-block"></span>
									<span>Collected</span>
								</span>
								<span className="flex items-center gap-1.5">
									<span className="w-3 h-0.5 bg-[#c2410c] inline-block"></span>
									<span>Recovery %</span>
								</span>
							</div>
						</div>

						{/* Chart Area */}
						<div className="flex items-end gap-2 h-[200px] border-b border-l border-[#c5ccd3] px-2 pt-4">
							{demandCollectionData.labels.map((m, i) => (
								<div key={m} className="flex-1 flex items-end justify-center gap-1 h-full group relative">
									{/* Tooltip on hover */}
									<div className="hidden group-hover:flex flex-col absolute -top-14 bg-slate-800 text-white text-[10px] p-2 rounded shadow-lg z-10 whitespace-nowrap pointer-events-none">
										<span className="font-semibold text-slate-200">{m}</span>
										<span>Demand: {demandCollectionData.demandFormatted[i]}</span>
										<span>Collected: {demandCollectionData.collectedFormatted[i]}</span>
										<span className="text-teal-300">Recovery: {demandCollectionData.recoveryPct[i]}%</span>
									</div>
									{/* Bar 1: Demand */}
									<div
										style={{ height: `${demandCollectionData.demandBarHeight[i]}%` }}
										className="flex-1 bg-[#9aa5b1] rounded-t-sm transition-all duration-300 group-hover:brightness-95"
										title={`Demand: ${demandCollectionData.demandFormatted[i]}`}
									></div>
									{/* Bar 2: Collected */}
									<div
										style={{ height: `${demandCollectionData.collectedBarHeight[i]}%` }}
										className="flex-1 bg-[#0f6b73] rounded-t-sm transition-all duration-300 group-hover:brightness-110"
										title={`Collected: ${demandCollectionData.collectedFormatted[i]}`}
									></div>
								</div>
							))}
						</div>

						{/* Dynamic Labels */}
						<div className="flex gap-2 px-2">
							{demandCollectionData.labels.map((m) => (
								<span key={m} className="flex-1 text-center text-[11px] text-[#4a5560] font-medium truncate" title={m}>
									{m}
								</span>
							))}
						</div>

						{/* Period Total Summary */}
						<div className="flex flex-wrap justify-between items-center text-xs pt-2 border-t border-[#e3e7eb] text-slate-600 font-medium gap-2">
							<span>Demand: <strong className="text-slate-900 font-mono">{formatCurrency(demandCollectionData.totalDemand)}</strong></span>
							<span>Collected: <strong className="text-[#0f6b73] font-mono">{formatCurrency(demandCollectionData.totalCollected)}</strong></span>
							<span>Recovery: <strong className="text-slate-900 font-mono">{demandCollectionData.totalDemand > 0 ? Math.min(100, Math.round((demandCollectionData.totalCollected / demandCollectionData.totalDemand) * 100)) : 0}%</strong></span>
						</div>
					</section>

					{/* F · OVERDUE & AGEING */}
					<section
						aria-label="Overdue and ageing"
						className="bg-white border border-[#d9dee3] rounded-xl p-5 shadow-sm flex flex-col gap-3.5"
					>
						<div>
							<div className="text-[11px] font-bold tracking-wider text-[#0f6b73] uppercase">
								F · OVERDUE &amp; AGEING ({selectedPeriod})
							</div>
							<h2 className="text-base font-semibold text-slate-900 mt-1">
								Overdue principal by days past due ({selectedPeriod})
							</h2>
						</div>

						{/* 3 Metric Boxes */}
						<div className="grid grid-cols-3 gap-2.5">
							<div className="p-2.5 border border-[#e3e7eb] rounded-lg bg-slate-50/50">
								<div className="text-xs text-[#4a5560]">Overdue groups</div>
								<div className="text-lg font-bold text-slate-900 mt-0.5">
									{dashboardData ? formatCount(dashboardData.ageing.overdue_groups) : "N"}
								</div>
							</div>
							<div className="p-2.5 border border-[#e3e7eb] rounded-lg bg-slate-50/50">
								<div className="text-xs text-[#4a5560]">Overdue members</div>
								<div className="text-lg font-bold text-slate-900 mt-0.5">
									{dashboardData ? formatCount(dashboardData.ageing.overdue_groups * 10) : "N"}
								</div>
							</div>
							<div className="p-2.5 border border-[#e3e7eb] rounded-lg bg-slate-50/50">
								<div className="text-xs text-[#4a5560]">Overdue PACS</div>
								<div className="text-lg font-bold text-slate-900 mt-0.5">
									{dashboardData ? formatCount(dashboardData.watchlist.pacs.length) : "N"}
								</div>
							</div>
						</div>

						{/* Ageing Horizontal Bars */}
						<div className="flex flex-col gap-2.5">
							{ageingBrackets.map((a) => (
								<div key={a.label} className="flex items-center gap-3">
									<span className="w-24 text-xs text-[#4a5560] font-medium">{a.label}</span>
									<div className="flex-1 h-3.5 bg-[#eef1f4] rounded-full overflow-hidden">
										<div
											style={{ width: a.width }}
											className="h-full bg-[#c2410c] opacity-85 rounded-full"
										></div>
									</div>
									<span className="w-28 text-right text-xs font-semibold font-mono text-slate-800">
										{a.amt}
									</span>
								</div>
							))}
						</div>
					</section>
				</div>

				{/* SECTIONS G + N + K: PENDING & EXCEPTIONS, ALERTS, SHG SB DEPOSITS */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
					{/* G · PENDING & EXCEPTIONS */}
					<section
						aria-label="Pending actions and exceptions"
						className="bg-white border border-[#d9dee3] rounded-xl p-5 shadow-sm flex flex-col gap-3"
					>
						<div>
							<div className="text-[11px] font-bold tracking-wider text-[#0f6b73] uppercase">
								G · PENDING &amp; EXCEPTIONS ({selectedPeriod})
							</div>
							<h2 className="text-base font-semibold text-slate-900 mt-1">Items needing follow-up in {selectedPeriod}</h2>
						</div>

						<div className="flex flex-col gap-2">
							{[
								{
									label: "Loans in Accept Pending",
									val: dashboardData ? formatCount(dashboardData.pending_exceptions.loans_in_accept_pending) : "N",
								},
								{
									label: "Deposits pending bifurcation",
									val: dashboardData ? formatCount(dashboardData.pending_exceptions.deposits_pending_bifurcation) : "N",
								},
								{
									label: "Disbursed to SHG, not distributed to members",
									val: dashboardData ? `₹ 0 · 0` : "₹ 0 · 0",
								},
								{
									label: "Legacy groups without member mapping",
									val: dashboardData ? formatCount(dashboardData.pending_exceptions.legacy_groups_unmapped) : "N",
								},
								{
									label: "Members with incomplete KYC (Aadhaar/phone)",
									val: dashboardData ? formatCount(dashboardData.pending_exceptions.incomplete_kyc) : "N",
								},
							].map((item) => (
								<div
									key={item.label}
									className="flex justify-between items-center gap-2 p-2.5 border border-[#e3e7eb] rounded-lg text-xs text-[#1f2933]"
								>
									<span className="font-medium text-slate-700">{item.label}</span>
									<strong className="font-mono text-slate-900">{item.val}</strong>
								</div>
							))}
						</div>
					</section>

					{/* N · ALERTS */}
					<section
						aria-label="Alerts"
						className="bg-white border border-[#d9dee3] rounded-xl p-5 shadow-sm flex flex-col gap-3"
					>
						<div>
							<div className="text-[11px] font-bold tracking-wider text-[#0f6b73] uppercase">
								N · ALERTS
							</div>
							<h2 className="text-base font-semibold text-slate-900 mt-1">Due &amp; default alerts</h2>
						</div>

						<div className="flex flex-col gap-2">
							{[
								{
									title: "EMI due in next 7 days",
									sub: dashboardData
										? `${formatCount(dashboardData.alerts.due_in_7_days)} groups · ${formatCurrency(dashboardData.alerts.due_in_7_days_amt)}`
										: "0 groups · ₹ 0",
									color: "#d97706",
								},
								{
									title: "New defaults today",
									sub: dashboardData
										? `${formatCount(dashboardData.alerts.new_defaults_today)} members · 0 groups`
										: "0 members · 0 groups",
									color: "#c2410c",
								},
								{
									title: "Collections held > 3 days at SHG",
									sub: dashboardData
										? `${formatCount(dashboardData.alerts.collections_held_gt_3_days)} groups`
										: "0 groups · ₹ 0",
									color: "#c2410c",
								},
								{
									title: "Loans maturing this month",
									sub: dashboardData
										? `${formatCount(dashboardData.alerts.loans_maturing_this_month)} loans`
										: "0 loans",
									color: "#0f6b73",
								},
							].map((alert) => (
								<div
									key={alert.title}
									className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#f6f8fa] text-xs"
								>
									<span
										style={{ backgroundColor: alert.color }}
										className="w-2 h-2 rounded-full mt-1 flex-shrink-0"
									></span>
									<div>
										<div className="font-semibold text-slate-900">{alert.title}</div>
										<div className="text-[11px] text-[#4a5560] font-mono mt-0.5">{alert.sub}</div>
									</div>
								</div>
							))}
						</div>
					</section>

					{/* K · SHG SB DEPOSITS */}
					<section
						aria-label="SHG savings deposits"
						className="bg-white border border-[#d9dee3] rounded-xl p-5 shadow-sm flex flex-col gap-3"
					>
						<div>
							<div className="text-[11px] font-bold tracking-wider text-[#0f6b73] uppercase">
								K · SHG SB DEPOSITS
							</div>
							<h2 className="text-base font-semibold text-slate-900 mt-1">Savings accounts</h2>
						</div>

						<div className="grid grid-cols-2 gap-2.5">
							<div className="p-3 border border-[#e3e7eb] rounded-lg flex flex-col gap-1 bg-slate-50/50">
								<span className="text-xs text-[#4a5560]">Total balance</span>
								<span className="text-base font-bold text-slate-900 font-mono">
									{dashboardData ? formatCurrency(dashboardData.sb_deposits.total_sb_balance) : "₹ 0"}
								</span>
							</div>

							<div className="p-3 border border-[#e3e7eb] rounded-lg flex flex-col gap-1 bg-slate-50/50">
								<span className="text-xs text-[#4a5560]">Accounts</span>
								<span className="text-base font-bold text-slate-900 font-mono">
									{dashboardData ? formatCount(dashboardData.sb_deposits.sb_accounts) : "0"}
								</span>
							</div>

							<div className="p-3 border border-[#e3e7eb] rounded-lg flex flex-col gap-1 bg-slate-50/50">
								<span className="text-xs text-[#4a5560]">Deposits (period)</span>
								<span className="text-base font-bold text-slate-900 font-mono">
									{dashboardData ? formatCurrency(dashboardData.sb_deposits.period_deposits) : "₹ 0"}
								</span>
							</div>

							<div className="p-3 border border-[#e3e7eb] rounded-lg flex flex-col gap-1 bg-slate-50/50">
								<span className="text-xs text-[#4a5560]">Withdrawals (period)</span>
								<span className="text-base font-bold text-slate-900 font-mono">
									{dashboardData ? formatCurrency(dashboardData.sb_deposits.period_withdrawals) : "₹ 0"}
								</span>
							</div>
						</div>

						<div className="text-xs text-[#4a5560] pt-2 border-t border-[#e3e7eb]">
							{dashboardData
								? `Net flow in period: Deposits − Withdrawals = ${formatCurrency(dashboardData.sb_deposits.net_sb_flow)}`
								: "Net flow in period: Deposits − Withdrawals = ₹ 0"}
						</div>
					</section>
				</div>

				{/* SECTION H · BRANCH-WISE PERFORMANCE */}
				<section
					aria-label="Branch-wise performance"
					className="bg-white border border-[#d9dee3] rounded-xl p-5 shadow-sm flex flex-col gap-3.5"
				>
					<div className="flex justify-between items-end flex-wrap gap-2">
						<div>
							<div className="text-[11px] font-bold tracking-wider text-[#0f6b73] uppercase">
								H · BRANCH-WISE PERFORMANCE ({selectedPeriod})
							</div>
							<h2 className="text-base font-semibold text-slate-900 mt-1">
								Click a branch to drill down to its PACS → SHGs → members
							</h2>
						</div>

						{/* Sort by Dropdown */}
						<label className="flex items-center gap-2 text-xs text-[#4a5560]">
							<span className="font-medium">Sort by</span>
							<select
								value={branchSortBy}
								onChange={(e) => setBranchSortBy(e.target.value)}
								className="h-9 border border-[#c5ccd3] rounded-lg px-2 text-xs bg-white text-[#1f2933] focus:outline-none focus:ring-1 focus:ring-[#0f6b73]"
							>
								<option value="overdue_pct_desc">Overdue % (high → low)</option>
								<option value="outstanding_desc">Outstanding (high → low)</option>
								<option value="recovery_desc">Recovery % (high → low)</option>
								<option value="name_asc">Branch Name (A → Z)</option>
							</select>
						</label>
					</div>

					{/* Responsive Data Table */}
					<div className="overflow-x-auto border border-[#e3e7eb] rounded-lg shadow-sm">
						<table className="w-full text-left border-collapse text-xs">
							<thead>
								<tr className="bg-[#f6f8fa] text-[#4a5560] font-semibold text-[11px] uppercase tracking-wider border-b border-[#e3e7eb]">
									<th className="py-2.5 px-3">Branch</th>
									<th className="py-2.5 px-3">Block</th>
									<th className="py-2.5 px-3 text-center">Direct SHGs</th>
									<th className="py-2.5 px-3 text-center">PACS</th>
									<th className="py-2.5 px-3 text-center">Indirect SHGs</th>
									<th className="py-2.5 px-3 text-center">Members</th>
									<th className="py-2.5 px-3 text-right">Outstanding</th>
									<th className="py-2.5 px-3 text-right">Overdue</th>
									<th className="py-2.5 px-3 text-center">Overdue %</th>
									<th className="py-2.5 px-3 text-center">Recovery % ({selectedPeriod})</th>
									<th className="py-2.5 px-3 text-right">Not deposited ({selectedPeriod})</th>
									<th className="py-2.5 px-3 text-center">Pending approvals ({selectedPeriod})</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-[#e3e7eb]">
								{loadingBranchRows ? (
									<tr>
										<td colSpan={12} className="py-6 text-center text-slate-500 font-medium">
											Loading branch performance data...
										</td>
									</tr>
								) : (
									sortedTableRows.map((r, idx) => (
										<tr
											key={r.code || idx}
											className="hover:bg-teal-50/40 transition-colors"
										>
											<td className="py-2.5 px-3 font-medium">
												<button
													type="button"
													onClick={() => navigate("/homebm/loan_transaction_report")}
													className="text-[#0f6b73] hover:underline font-semibold text-left"
												>
													[{r.name}]
												</button>
											</td>
											<td className="py-2.5 px-3 text-slate-600">[{r.block}]</td>
											<td className="py-2.5 px-3 text-center font-mono">{r.directShg}</td>
											<td className="py-2.5 px-3 text-center font-mono">{r.pacs}</td>
											<td className="py-2.5 px-3 text-center font-mono">{r.indirectShg}</td>
											<td className="py-2.5 px-3 text-center font-mono">{r.members}</td>
											<td className="py-2.5 px-3 text-right font-mono font-medium">{r.outstanding}</td>
											<td className="py-2.5 px-3 text-right font-mono text-[#c2410c] font-medium">{r.overdue}</td>
											<td className="py-2.5 px-3 text-center font-mono font-semibold">{r.overduePct}</td>
											<td className="py-2.5 px-3 text-center font-mono font-semibold text-[#0f6b73]">{r.recoveryPct}</td>
											<td className="py-2.5 px-3 text-right font-mono">{r.notDeposited}</td>
											<td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-700">{r.pendingApprovals}</td>
										</tr>
									))
								)}
								{/* Total Summary Row */}
								<tr className="bg-[#f6f8fa] font-bold text-slate-900 border-t-2 border-[#d9dee3]">
									<td className="py-2.5 px-3">Total</td>
									<td className="py-2.5 px-3">—</td>
									<td className="py-2.5 px-3 text-center font-mono">{tableTotals.directShg}</td>
									<td className="py-2.5 px-3 text-center font-mono">{tableTotals.pacs}</td>
									<td className="py-2.5 px-3 text-center font-mono">{tableTotals.indirectShg}</td>
									<td className="py-2.5 px-3 text-center font-mono">{tableTotals.members}</td>
									<td className="py-2.5 px-3 text-right font-mono">{tableTotals.outstanding}</td>
									<td className="py-2.5 px-3 text-right font-mono text-[#c2410c]">{tableTotals.overdue}</td>
									<td className="py-2.5 px-3 text-center font-mono">{tableTotals.overduePct}</td>
									<td className="py-2.5 px-3 text-center font-mono text-[#0f6b73]">{tableTotals.recoveryPct}</td>
									<td className="py-2.5 px-3 text-right font-mono">{tableTotals.notDeposited}</td>
									<td className="py-2.5 px-3 text-center font-mono">{tableTotals.pendingApprovals}</td>
								</tr>
							</tbody>
						</table>
					</div>
				</section>

				{/* BOTTOM GRID: SECTIONS I, J, L, M */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
					{/* I · WATCHLIST */}
					<section
						aria-label="PACS watchlist"
						className="bg-white border border-[#d9dee3] rounded-xl p-5 shadow-sm flex flex-col justify-between min-h-[310px]"
					>
						<div className="flex flex-col gap-2.5">
							<div>
								<div className="text-[11px] font-bold tracking-wider text-[#0f6b73] uppercase">
									I · WATCHLIST ({selectedPeriod})
								</div>
								<h2 className="text-base font-semibold text-slate-900 mt-1">
									Top 10 overdue PACS / SHGs
								</h2>
							</div>

							{/* Toggle Buttons */}
							<div role="group" aria-label="Watchlist level" className="flex gap-1.5 my-1">
								<button
									type="button"
									onClick={() => setWatchlistType("PACS")}
									className={`h-8 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer ${watchlistType === "PACS"
										? "bg-[#0f6b73] text-white shadow-sm"
										: "bg-white border border-[#c5ccd3] text-[#1f2933] hover:bg-slate-100"
										}`}
								>
									PACS
								</button>
								<button
									type="button"
									onClick={() => setWatchlistType("SHG")}
									className={`h-8 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer ${watchlistType === "SHG"
										? "bg-[#0f6b73] text-white shadow-sm"
										: "bg-white border border-[#c5ccd3] text-[#1f2933] hover:bg-slate-100"
										}`}
								>
									SHG
								</button>
							</div>

							{/* Watchlist Rows */}
							<div className="flex flex-col">
								{dynamicWatchlist.length === 0 ? (
									<div className="py-6 text-center text-xs text-slate-500 font-medium bg-slate-50 rounded-lg border border-dashed border-slate-200 mt-2">
										<span className="text-[#0f6b73] font-bold block mb-1">✓ 100% Regular Portfolio</span>
										No overdue {watchlistType === "PACS" ? "PACS" : "SHGs"} found.
									</div>
								) : (
									dynamicWatchlist.map((item, idx) => (
										<div
											key={idx}
											className="flex justify-between items-center text-xs py-2 border-b border-[#eef1f4] last:border-b-0"
										>
											<span className="text-slate-700 truncate pr-2" title={`${item.name} · [${item.branch}]`}>
												[{item.name}] · [{item.branch}]
											</span>
											<strong className="font-mono text-slate-900 flex-shrink-0">{item.amt}</strong>
										</div>
									))
								)}
							</div>
						</div>
					</section>

					{/* J · BLOCK-WISE */}
					<section
						aria-label="Block-wise distribution"
						className="bg-white border border-[#d9dee3] rounded-xl p-5 shadow-sm flex flex-col justify-between min-h-[310px]"
					>
						<div className="flex flex-col gap-2.5">
							<div>
								<div className="text-[11px] font-bold tracking-wider text-[#0f6b73] uppercase">
									J · BLOCK-WISE
								</div>
								<h2 className="text-base font-semibold text-slate-900 mt-1">
									{blockToggle} by block
								</h2>
							</div>

							{/* Horizontal Block Bars */}
							<div className="flex flex-col gap-2.5 my-1">
								{dynamicBlockData.length === 0 ? (
									<div className="py-6 text-center text-xs text-slate-500 font-medium">
										No block data available
									</div>
								) : (
									dynamicBlockData.map((b) => (
										<div key={b.name} className="flex items-center gap-2">
											<span className="w-24 text-xs font-medium text-[#4a5560] truncate">[{b.name}]</span>
											<div className="flex-1 h-3 bg-[#eef1f4] rounded-full overflow-hidden">
												<div
													style={{ width: b.width }}
													className="h-full bg-[#0f6b73] rounded-full transition-all duration-300"
												></div>
											</div>
											<span className="text-[11px] font-mono text-slate-900 font-semibold min-w-[70px] text-right">{b.amt}</span>
										</div>
									))
								)}
							</div>
						</div>

						<div className="pt-3 border-t border-[#f1f5f9] mt-3">
							<span className="text-[11px] text-[#4a5560] block mb-1 font-medium">Toggle:</span>
							<div className="flex flex-wrap gap-1 text-[11px]">
								{["Outstanding", "Disbursed", "Overdue", "Purpose-wise"].map((t) => (
									<button
										key={t}
										type="button"
										onClick={() => setBlockToggle(t)}
										className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${blockToggle === t
											? "bg-[#0f6b73] text-white font-semibold shadow-xs"
											: "text-[#4a5560] hover:text-[#1f2933] hover:bg-slate-100"
											}`}
									>
										{t}
									</button>
								))}
							</div>
						</div>
					</section>

					{/* L · INTEREST SUBVENTION */}
					<section
						aria-label="Interest subvention"
						className="bg-white border border-[#d9dee3] rounded-xl p-5 shadow-sm flex flex-col justify-between min-h-[310px]"
					>
						<div className="flex flex-col gap-2.5">
							<div>
								<div className="text-[11px] font-bold tracking-wider text-[#0f6b73] uppercase">
									L · INTEREST SUBVENTION
								</div>
								<h2 className="text-base font-semibold text-slate-900 mt-1">
									Current financial year
								</h2>
							</div>

							<div className="flex flex-col my-1">
								{[
									{ label: "Subvention eligible", val: formatCurrency(dashboardData?.interest_subvention?.subvention_eligible || 0) },
									{ label: "Posted to group loans", val: formatCurrency(dashboardData?.interest_subvention?.posted_to_groups || 0) },
									{ label: "Posted to member loans", val: formatCurrency(dashboardData?.interest_subvention?.posted_to_members || 0) },
									{ label: "Pending posting", val: formatCurrency(dashboardData?.interest_subvention?.pending_posting || 0) },
								].map((item, idx) => (
									<div
										key={idx}
										className="flex justify-between items-center text-xs py-2 border-b border-[#eef1f4] last:border-b-0"
									>
										<span className="text-slate-700">{item.label}</span>
										<strong className="font-mono text-slate-900">{item.val}</strong>
									</div>
								))}
							</div>
						</div>
					</section>

					{/* M · MEMBER PROFILE */}
					<section
						aria-label="Member profile"
						className="bg-white border border-[#d9dee3] rounded-xl p-5 shadow-sm flex flex-col justify-between min-h-[310px]"
					>
						<div className="flex flex-col gap-2.5">
							<div>
								<div className="text-[11px] font-bold tracking-wider text-[#0f6b73] uppercase">
									M · MEMBER PROFILE
								</div>
								<h2 className="text-base font-semibold text-slate-900 mt-1">
									Financial inclusion mix
								</h2>
							</div>

							<div className="flex flex-col my-1">
								{[
									{
										label: "Women members",
										val: dashboardData ? `${formatCount(dashboardData.demographics.women_members)} · ${dashboardData.demographics.women_pct}%` : "0 · 0%",
									},
									{
										label: "SC / ST",
										val: dashboardData ? `${formatCount(dashboardData.demographics.sc_st_members)} · ${dashboardData.demographics.sc_st_pct}%` : "0 · 0%",
									},
									{
										label: "OBC",
										val: dashboardData ? `${formatCount(dashboardData.demographics.obc_members)} · ${dashboardData.demographics.obc_pct}%` : "0 · 0%",
									},
									{
										label: "Weaker section",
										val: dashboardData ? `${formatCount(dashboardData.demographics.weaker_section_members)} · ${dashboardData.demographics.weaker_section_pct}%` : "0 · 0%",
									},
									{
										label: "Primary occupation: Agriculture",
										val: dashboardData ? `${formatCount(dashboardData.demographics.agri_members)} · ${dashboardData.demographics.agri_pct}%` : "0 · 0%",
									},
								].map((item, idx) => (
									<div
										key={idx}
										className="flex justify-between items-center text-xs py-2 border-b border-[#eef1f4] last:border-b-0"
									>
										<span className="text-slate-700">{item.label}</span>
										<strong className="font-mono text-slate-900">{item.val}</strong>
									</div>
								))}
							</div>
						</div>
					</section>
				</div>

				{/* FOOTNOTE */}
				{/* <div className="pt-4 pb-10 text-center">
					<p className="text-xs text-[#627d98]">
						Wireframe only — all figures are placeholders. Every card is clickable and drills down to the matching report.
					</p>
				</div> */}

			</div>
		</div>
	)
}
