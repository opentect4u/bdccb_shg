import React, { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import moment from "moment"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"
import { Message } from "../../Components/Message"
import { url_bdccb } from "../../Address/BaseUrl"
import { getLocalStoreTokenDts } from "../../Components/getLocalforageTokenDts"
import { Spin, Select, Tag, Modal, Pagination, Tabs } from "antd"
import {
	LoadingOutlined,
	SearchOutlined,
	FileExcelOutlined,
	TeamOutlined,
	BankOutlined,
	EyeOutlined,
	AuditOutlined,
	CheckCircleOutlined,
	CheckCircleFilled,
	CloseCircleOutlined,
	DollarOutlined,
	SafetyCertificateOutlined,
	CalendarOutlined,
	ClearOutlined,
	ArrowRightOutlined,
	ArrowLeftOutlined,
	ExclamationCircleOutlined,
	FilterOutlined,
	UserOutlined,
	HistoryOutlined,
	DownloadOutlined,
	WalletOutlined,
} from "@ant-design/icons"

function formatCurrency(val) {
	const n = Number(val) || 0
	return "₹ " + new Intl.NumberFormat("en-IN").format(Math.round(n))
}

function formatCount(val) {
	const n = Number(val) || 0
	return new Intl.NumberFormat("en-IN").format(n)
}

function formatDate(dt) {
	if (!dt) return "-"
	return moment(dt).isValid() ? moment(dt).format("DD/MM/YYYY") : String(dt)
}

function LoanTrackingBM() {
	const navigate = useNavigate()

	// Strict Access Control: Head Office (Branch 112 / user_type 'H') ONLY
	const rawUser = JSON.parse(localStorage.getItem("user_details")) || {}
	const userObj = Array.isArray(rawUser) ? rawUser[0] || {} : rawUser || {}
	const isHO =
		userObj.user_type === "H" ||
		userObj.branch_type === "H" ||
		userObj.brn_code == 112 ||
		userObj.branch_id == 112 ||
		String(userObj.branch_name || "").toLowerCase().includes("head office") ||
		String(userObj.brn_name || "").toLowerCase().includes("head office")

	useEffect(() => {
		if (!isHO) {
			Message("error", "Access Denied: Loan Tracking is restricted to Head Office (Branch 112) only.")
			navigate("/homebm/", { replace: true })
		}
	}, [isHO, navigate])

	// Search Mode: 'group' | 'branch' | 'society'
	const [searchMode, setSearchMode] = useState("group")

	// Filter state
	const [groupQuery, setGroupQuery] = useState("")
	const [selectedBranch, setSelectedBranch] = useState(null)
	const [selectedSociety, setSelectedSociety] = useState(null)
	const [statusFilter, setStatusFilter] = useState("all") // 'all' | 'active_loans' | 'no_loans'

	// Dropdown Lists
	const [branchesList, setBranchesList] = useState([])
	const [societiesList, setSocietiesList] = useState([])
	const [dropdownLoading, setDropdownLoading] = useState(true)

	// Results Data States
	const [loading, setLoading] = useState(false)
	const [groupList, setGroupList] = useState([])
	const [summary, setSummary] = useState(null)
	const [hasSearched, setHasSearched] = useState(false)

	// In-results search
	const [inResultSearch, setInResultSearch] = useState("")

	// Loan Hierarchy Tracking Modal
	const [selectedGroupModal, setSelectedGroupModal] = useState(null)
	const [hierarchyData, setHierarchyData] = useState(null)
	const [selectedLoanAcc, setSelectedLoanAcc] = useState("")
	const [selectedFundType, setSelectedFundType] = useState("")
	const [selectedPortfolioId, setSelectedPortfolioId] = useState("")
	const [modalLoading, setModalLoading] = useState(false)
	const [activeStatementTab, setActiveStatementTab] = useState("ccb")

	// Individual Member Statement Modal
	const [selectedMemberStatement, setSelectedMemberStatement] = useState(null)
	const [memberStatementList, setMemberStatementList] = useState([])
	const [memberStatementLoading, setMemberStatementLoading] = useState(false)

	// Pagination
	const [currentPage, setCurrentPage] = useState(1)
	const pageSize = 15

	// 1. Fetch Branches and Societies on Mount
	useEffect(() => {
		const fetchDropdowns = async () => {
			try {
				setDropdownLoading(true)
				const tokenValue = await getLocalStoreTokenDts(navigate)
				const res = await axios
					.post(
						`${url_bdccb}/loantracking/get_branches_and_societies`,
						{},
						{
							headers: {
								Authorization: `${tokenValue?.token}`,
								"Content-Type": "application/json",
							},
						}
					)
					.catch(() => null)

				const dataRes = res?.data
				if (dataRes?.success) {
					setBranchesList(dataRes.branches || [])
					setSocietiesList(dataRes.societies || [])
				}
			} catch (err) {
				console.warn("Could not load branches / societies for loan tracking:", err)
			} finally {
				setDropdownLoading(false)
			}
		}

		fetchDropdowns()
	}, [navigate])

	// Branch lookup map
	const branchMap = useMemo(() => {
		const map = {}
		branchesList.forEach((b) => {
			map[String(b.branch_id)] = b.branch_name
		})
		return map
	}, [branchesList])

	// Branches sorted branch-code wise (numerically: 101, 102, 106, 110, ...)
	const sortedBranches = useMemo(() => {
		return [...branchesList].sort(
			(a, b) => (Number(a.branch_id) || 0) - (Number(b.branch_id) || 0)
		)
	}, [branchesList])

	// All societies sorted numerically by pacs_id
	const sortedSocieties = useMemo(() => {
		return [...societiesList].sort(
			(a, b) => (Number(a.pacs_id) || 0) - (Number(b.pacs_id) || 0)
		)
	}, [societiesList])

	// Switch Search Mode and reset state
	const handleTabSwitch = (mode) => {
		setSearchMode(mode)
		setGroupQuery("")
		setSelectedBranch(null)
		setSelectedSociety(null)
		setGroupList([])
		setSummary(null)
		setHasSearched(false)
		setCurrentPage(1)
		setInResultSearch("")
	}

	// Reset all inputs
	const handleReset = () => {
		setGroupQuery("")
		setSelectedBranch(null)
		setSelectedSociety(null)
		setGroupList([])
		setSummary(null)
		setHasSearched(false)
		setCurrentPage(1)
		setInResultSearch("")
	}

	// 2. Perform Search
	const handleSearch = async (mode = searchMode) => {
		let payload = { search_type: mode, limit: 1000 }

		if (mode === "group") {
			if (!groupQuery || !groupQuery.trim()) {
				Message("warning", "Please enter a Group Code, Group Name, or Loan Account Number")
				return
			}
			payload.query = groupQuery.trim()
		} else if (mode === "branch") {
			if (!selectedBranch) {
				Message("warning", "Please select a branch from the dropdown")
				return
			}
			payload.branch_code = selectedBranch
		} else if (mode === "society") {
			if (!selectedSociety) {
				Message("warning", "Please select a society / PACS from the dropdown")
				return
			}
			payload.pacs_id = selectedSociety
		}

		try {
			setLoading(true)
			setGroupList([])
			setSummary(null)
			setHasSearched(true)
			setCurrentPage(1)

			const tokenValue = await getLocalStoreTokenDts(navigate)
			const res = await axios.post(`${url_bdccb}/loantracking/search_loan_tracking`, payload, {
				headers: {
					Authorization: `${tokenValue?.token}`,
					"Content-Type": "application/json",
				},
			})

			if (res.data?.success) {
				setGroupList(res.data.groups || [])
				setSummary(res.data.summary || null)
				if ((res.data.groups || []).length === 0) {
					Message("info", "No matching loan tracking records found")
				} else {
					Message("success", `Found ${res.data.groups.length} group records`)
				}
			} else {
				Message("error", res.data?.msg || "Failed to fetch loan tracking records")
			}
		} catch (err) {
			console.error("Search error:", err)
			Message("error", "Error connecting to server for loan tracking")
		} finally {
			setLoading(false)
		}
	}

	// Open Loan Hierarchy Details Modal (Members <- Group <- Society <- CCB)
	const handleOpenLoanModal = async (group, targetAccNo = null, targetFundType = null, targetLoanId = null) => {
		setSelectedGroupModal(group)
		setHierarchyData(null)
		setModalLoading(true)
		try {
			const tokenValue = await getLocalStoreTokenDts(navigate)
			const payload = { group_code: group.group_code }
			if (targetAccNo) payload.loan_acc_no = targetAccNo
			if (targetFundType) payload.fund_type = targetFundType
			if (targetLoanId) payload.loan_id = targetLoanId

			const res = await axios.post(
				`${url_bdccb}/loantracking/get_loan_hierarchy_details`,
				payload,
				{
					headers: {
						Authorization: `${tokenValue?.token}`,
						"Content-Type": "application/json",
					},
				}
			)
			if (res.data?.success) {
				setHierarchyData(res.data)
				setSelectedLoanAcc(res.data.selected_loan_acc_no || "")
				setSelectedFundType(res.data.selected_fund_type || "")
				setSelectedPortfolioId(res.data.selected_portfolio_id || "")
			} else {
				Message("error", res.data?.msg || "Failed to load loan hierarchy details")
			}
		} catch (err) {
			console.error("Hierarchy fetch error:", err)
			Message("error", "Error loading loan hierarchy details")
		} finally {
			setModalLoading(false)
		}
	}

	// Switch Fund Type in Modal (e.g. Bank Fund vs Own Fund)
	const handleSwitchFundType = (fundType) => {
		if (!selectedGroupModal) return
		setSelectedFundType(fundType)
		handleOpenLoanModal(selectedGroupModal, null, fundType, null)
	}

	// Switch Loan Portfolio in Modal (from dropdown)
	const handleSwitchPortfolio = (portfolioId) => {
		if (!selectedGroupModal || !hierarchyData?.loan_accounts) return
		const portfolio = hierarchyData.loan_accounts.find((p) => p.portfolio_id === portfolioId)
		if (portfolio) {
			setSelectedPortfolioId(portfolioId)
			setSelectedLoanAcc(portfolio.loan_acc_no || "")
			setSelectedFundType(portfolio.fund_type || "")
			handleOpenLoanModal(selectedGroupModal, portfolio.loan_acc_no, portfolio.fund_type, portfolio.loan_id)
		}
	}

	// Open Individual Member Statement
	const handleOpenMemberStatement = async (member) => {
		setSelectedMemberStatement(member)
		setMemberStatementList([])
		setMemberStatementLoading(true)
		try {
			const tokenValue = await getLocalStoreTokenDts(navigate)
			const res = await axios.post(
				`${url_bdccb}/loantracking/get_member_statement`,
				{ member_loan_id: member.loan_id },
				{
					headers: {
						Authorization: `${tokenValue?.token}`,
						"Content-Type": "application/json",
					},
				}
			)
			if (res.data?.success) {
				setMemberStatementList(res.data.statement || [])
			} else {
				Message("error", res.data?.msg || "Failed to fetch member statement")
			}
		} catch (err) {
			console.error("Member statement error:", err)
			Message("error", "Error loading member statement")
		} finally {
			setMemberStatementLoading(false)
		}
	}

	// Export Hierarchy Statement to Excel
	const exportHierarchyStatementToExcel = async (levelName, transactions) => {
		if (!transactions || transactions.length === 0) {
			Message("warning", "No transaction records to export")
			return
		}

		try {
			const workbook = new ExcelJS.Workbook()
			const worksheet = workbook.addWorksheet(`${levelName} Statement`)

			worksheet.columns = [
				{ header: "SL", key: "sl", width: 6 },
				{ header: "Date", key: "date", width: 14 },
				{ header: "Trans ID", key: "trans_id", width: 22 },
				{ header: "Type", key: "type", width: 16 },
				{ header: "Debit (Dr ₹)", key: "dr", width: 16 },
				{ header: "Credit (Cr ₹)", key: "cr", width: 16 },
				{ header: "Prn Recovered (₹)", key: "prn_recov", width: 18 },
				{ header: "Intt Recovered (₹)", key: "intt_recov", width: 18 },
				{ header: "Balance Prn (₹)", key: "curr_prn", width: 18 },
				{ header: "Status", key: "status", width: 12 },
			]

			worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } }
			worksheet.getRow(1).fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "FF0F766E" },
			}

			transactions.forEach((t, idx) => {
				const isDisb = t.trans_type === "D"
				const isIntt = t.trans_type === "I"
				const typeLabel = isDisb ? "Disbursement" : isIntt ? "Interest Apply" : "Recovery"

				worksheet.addRow({
					sl: idx + 1,
					date: formatDate(t.trans_dt || t.trans_date),
					trans_id: t.trans_id || "-",
					type: typeLabel,
					dr: Number(t.dr_amt) || 0,
					cr: Number(t.cr_amt) || 0,
					prn_recov: Number(t.curr_prn_recov) || 0,
					intt_recov: Number(t.curr_intt_recov) || 0,
					curr_prn: Number(t.curr_prn) || 0,
					status: t.approval_status === "A" ? "Approved" : t.approval_status || "-",
				})
			})

			const buf = await workbook.xlsx.writeBuffer()
			saveAs(
				new Blob([buf]),
				`${levelName}_Statement_${selectedLoanAcc || "Account"}_${moment().format("YYYYMMDD_HHmm")}.xlsx`
			)
			Message("success", `${levelName} statement exported successfully!`)
		} catch (err) {
			console.error("Export statement error:", err)
			Message("error", "Failed to export statement")
		}
	}

	// In-results filtered list
	const filteredGroupList = useMemo(() => {
		return groupList.filter((g) => {
			// Status Filter
			if (statusFilter === "active_loans" && !g.has_active_loan) return false
			if (statusFilter === "no_loans" && g.has_active_loan) return false

			// Text search
			if (!inResultSearch.trim()) return true
			const term = inResultSearch.toLowerCase()
			return (
				String(g.group_code || "").toLowerCase().includes(term) ||
				String(g.group_name || "").toLowerCase().includes(term) ||
				String(g.branch_name || "").toLowerCase().includes(term) ||
				String(g.pacs_name || "").toLowerCase().includes(term) ||
				String(g.last_loan_acc_no || "").toLowerCase().includes(term)
			)
		})
	}, [groupList, inResultSearch, statusFilter])

	// Paginated rows for Branch / Society tables
	const paginatedRows = useMemo(() => {
		const start = (currentPage - 1) * pageSize
		return filteredGroupList.slice(start, start + pageSize)
	}, [filteredGroupList, currentPage, pageSize])

	// Export to Excel
	const exportToExcel = async () => {
		if (filteredGroupList.length === 0) {
			Message("warning", "No data to export")
			return
		}

		try {
			const workbook = new ExcelJS.Workbook()
			const worksheet = workbook.addWorksheet("Loan Tracking")

			worksheet.columns = [
				{ header: "SL", key: "sl", width: 6 },
				{ header: "Branch Code", key: "branch_code", width: 14 },
				{ header: "Branch Name", key: "branch_name", width: 22 },
				{ header: "Group Code", key: "group_code", width: 14 },
				{ header: "Group Name", key: "group_name", width: 32 },
				{ header: "PACS / Society", key: "pacs_name", width: 24 },
				{ header: "Channel", key: "channel", width: 12 },
				{ header: "Total Members", key: "member_count", width: 14 },
				{ header: "Total Loans", key: "total_loans", width: 12 },
				{ header: "Active Loans", key: "active_loans", width: 12 },
				{ header: "Disbursed (₹)", key: "total_disbursed", width: 18 },
				{ header: "Current Principal (₹)", key: "curr_prn", width: 20 },
				{ header: "Overdue Principal (₹)", key: "ovd_prn", width: 20 },
				{ header: "Current Interest (₹)", key: "curr_intt", width: 20 },
				{ header: "Overdue Interest (₹)", key: "ovd_intt", width: 20 },
				{ header: "Total Outstanding (₹)", key: "total_outstanding", width: 20 },
				{ header: "Last Loan A/C No", key: "last_loan_acc_no", width: 18 },
				{ header: "Last Disbursed Date", key: "last_disb_dt", width: 18 },
				{ header: "Status", key: "status", width: 12 },
			]

			worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } }
			worksheet.getRow(1).fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "FF0F766E" },
			}

			filteredGroupList.forEach((g, idx) => {
				worksheet.addRow({
					sl: idx + 1,
					branch_code: g.branch_code,
					branch_name: g.branch_name,
					group_code: g.group_code,
					group_name: g.group_name,
					pacs_name: g.pacs_name || "Direct",
					channel: g.direct_indirect_flag === "D" ? "Direct" : "Indirect",
					member_count: g.member_count || 0,
					total_loans: g.total_loans || 0,
					active_loans: g.active_loans || 0,
					total_disbursed: g.total_disbursed || 0,
					curr_prn: g.curr_prn || 0,
					ovd_prn: g.ovd_prn || 0,
					curr_intt: g.curr_intt || 0,
					ovd_intt: g.ovd_intt || 0,
					total_outstanding: g.total_outstanding || 0,
					last_loan_acc_no: g.last_loan_acc_no || "-",
					last_disb_dt: formatDate(g.last_disb_dt),
					status: g.has_active_loan ? "Active Loan" : g.is_loanee ? "Closed Loan" : "No Loans",
				})
			})

			const buf = await workbook.xlsx.writeBuffer()
			saveAs(new Blob([buf]), `Loan_Tracking_Export_${moment().format("YYYYMMDD_HHmm")}.xlsx`)
			Message("success", "Exported successfully!")
		} catch (err) {
			console.error("Export error:", err)
			Message("error", "Failed to export Excel file")
		}
	}

	if (!isHO) {
		return null
	}

	return (
		<div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 space-y-6 pb-16 font-sans">
			{/* Top Bar with Navigation & Title (Clean header row, no duplicate card) */}
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
					<div className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
						<div className="w-7 h-7 rounded-lg bg-teal-700 text-white flex items-center justify-center text-xs shadow-2xs">
							<AuditOutlined />
						</div>
						<span className="font-extrabold">Loan Tracking System</span>
					</div>
				</div>

				<div className="flex items-center gap-2 self-start sm:self-auto">
					{/* Export Excel removed as requested */}
					{/* {groupList.length > 0 && (
						<button
							onClick={exportToExcel}
							className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
						>
							<FileExcelOutlined />
							Export Excel ({filteredGroupList.length})
						</button>
					)} */}

					{/* <Tag color="cyan" className="font-black px-3 py-1 text-xs border border-teal-300 rounded-lg">
						Branch 112 Exclusive
					</Tag> */}
				</div>
			</div>

			{/* Search Panel Card */}
			<div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
				{/* 3 Search Mode Tabs (Exact same layout as /homebm/groupinfo) */}
				<div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-2xl max-w-2xl mb-6">
					<button
						type="button"
						onClick={() => handleTabSwitch("group")}
						className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${searchMode === "group"
							? "bg-white text-teal-800 shadow-xs"
							: "text-slate-600 hover:text-slate-900"
							}`}
					>
						<SearchOutlined />
						Search by Group
					</button>

					<button
						type="button"
						onClick={() => handleTabSwitch("branch")}
						className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${searchMode === "branch"
							? "bg-white text-teal-800 shadow-xs"
							: "text-slate-600 hover:text-slate-900"
							}`}
					>
						<BankOutlined />
						Search by Branch
					</button>

					<button
						type="button"
						onClick={() => handleTabSwitch("society")}
						className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${searchMode === "society"
							? "bg-white text-teal-800 shadow-xs"
							: "text-slate-600 hover:text-slate-900"
							}`}
					>
						<SafetyCertificateOutlined />
						Search by Society / PACS
					</button>
				</div>

				{/* Form Controls for Active Search Mode */}
				<div className="space-y-4">
					{/* 1. Search by Group (Code, Name, or Loan Account) */}
					{searchMode === "group" && (
						<div>
							<label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
								Enter Group Code, Group Name, or Loan Account Number
							</label>
							<div className="flex flex-col sm:flex-row items-stretch gap-3">
								<div className="relative flex-1">
									<input
										type="text"
										value={groupQuery}
										onChange={(e) => setGroupQuery(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter") handleSearch("group")
										}}
										placeholder="e.g. 10600007, S.H.G.MAHILAGROUP..."
										className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
									/>
									<SearchOutlined className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none" />
								</div>

								<button
									onClick={() => handleSearch("group")}
									disabled={loading}
									className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
								>
									{loading ? <LoadingOutlined spin /> : <SearchOutlined />}
									Track Loan
								</button>

								{(groupQuery || hasSearched) && (
									<button
										onClick={handleReset}
										className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
									>
										<ClearOutlined /> Clear
									</button>
								)}
							</div>
							<p className="text-xs text-slate-400 mt-2">
								Type the Group Code, Group Name, or Loan Account Number to track that loan portfolio directly.
							</p>

							{/* Loading State Inside Same Card */}
							{loading && (
								<div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-500 text-sm py-4">
									<LoadingOutlined spin className="text-teal-600 text-base" />
									<span>Tracking loan records across branches...</span>
								</div>
							)}

							{/* Search Results for Group Mode */}
							{!loading && hasSearched && (
								<div className="mt-6 pt-5 border-t border-slate-200">
									{groupList.length === 0 ? (
										<div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center text-slate-500 text-sm">
											<CloseCircleOutlined className="text-slate-300 text-xl inline-block mr-2" />
											No group found matching "<span className="font-semibold text-slate-700">{groupQuery}</span>". Please verify the code or name.
										</div>
									) : (
										<div className="space-y-4">
											{groupList.map((g, idx) => (
												<div
													key={idx}
													className="p-5 bg-slate-50 hover:bg-slate-100/90 border border-slate-200/90 rounded-2xl shadow-xs transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
												>
													{/* Left: Group Metadata */}
													<div className="flex-1 min-w-0 space-y-2">
														<div className="flex flex-wrap items-center gap-2">
															<span className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
																{g.group_name}
															</span>
															<span className="px-2.5 py-0.5 bg-slate-200 text-slate-800 font-mono text-xs font-bold rounded-md">
																CODE: {g.group_code}
															</span>
															{g.has_active_loan ? (
																<Tag color="green" className="font-bold rounded-md">
																	Active Loan ({g.active_loans})
																</Tag>
															) : g.is_loanee ? (
																<Tag color="orange" className="font-bold rounded-md">
																	Loan Closed
																</Tag>
															) : (
																<Tag color="default" className="font-bold rounded-md">
																	No Loans
																</Tag>
															)}
															{g.fund_types && (
																<div className="flex items-center gap-1">
																	{g.fund_types.split(",").map((ft) => (
																		<Tag
																			key={ft}
																			color={ft === "B" ? "blue" : "purple"}
																			className="font-black text-[10px] rounded-md tracking-wider uppercase m-0"
																		>
																			{ft === "B" ? "Bank Fund (B)" : ft === "O" ? "Own Fund (O)" : `Fund ${ft}`}
																		</Tag>
																	))}
																</div>
															)}
														</div>

														<div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
															<span className="flex items-center gap-1.5 font-medium">
																<BankOutlined className="text-teal-600" />
																<b>Branch:</b> {g.branch_name} ({g.branch_code})
															</span>
															{g.direct_indirect_flag !== "D" &&
																g.pacs_name &&
																g.pacs_name !== "Direct" &&
																!String(g.pacs_name).toLowerCase().includes("demo") && (
																	<span className="flex items-center gap-1.5 font-medium">
																		<SafetyCertificateOutlined className="text-indigo-600" />
																		<b>PACS:</b> {g.pacs_name}
																	</span>
																)}
															<span className="flex items-center gap-1.5 font-medium">
																<TeamOutlined className="text-sky-600" />
																<b>Members:</b> {g.member_count}
															</span>
															{g.last_loan_acc_no && (
																<span className="flex items-center gap-1.5 font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
																	A/C: {g.last_loan_acc_no}
																</span>
															)}
														</div>
													</div>

													{/* Right: Action */}
													<div className="shrink-0 self-end lg:self-center">
														<button
															onClick={() => handleOpenLoanModal(g)}
															className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
														>
															<EyeOutlined />
															Track Accounts
														</button>
													</div>
												</div>
											))}
										</div>
									)}
								</div>
							)}
						</div>
					)}

					{/* 2. Search by Branch (Branch Code Wise) */}
					{searchMode === "branch" && (
						<div>
							<label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
								Select Branch (Showing Branch Code Wise)
							</label>
							<div className="flex flex-col sm:flex-row items-stretch gap-3">
								<div className="flex-1">
									<Select
										showSearch
										placeholder="Select branch..."
										optionFilterProp="children"
										value={selectedBranch}
										onChange={(val) => setSelectedBranch(val)}
										filterOption={(input, option) =>
											(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
										}
										options={sortedBranches.map((b) => ({
											value: String(b.branch_id),
											label: `${b.branch_id} - ${b.branch_name}`,
										}))}
										className="w-full h-12 text-sm"
										size="large"
										loading={dropdownLoading}
									/>
								</div>

								<button
									onClick={() => handleSearch("branch")}
									disabled={loading || !selectedBranch}
									className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
								>
									{loading ? <LoadingOutlined spin /> : <SearchOutlined />}
									Load Branch Loans
								</button>

								{selectedBranch && (
									<button
										onClick={handleReset}
										className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
									>
										<ClearOutlined /> Clear
									</button>
								)}
							</div>
							{/* <p className="text-xs text-slate-400 mt-2">
								Branches are ordered branch code wise (101, 102, 106, 110...). Select to track all loan portfolios under that branch.
							</p> */}
						</div>
					)}

					{/* 3. Search by Society / PACS */}
					{searchMode === "society" && (
						<div>
							<label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
								Select Society (PACS) to Track All Attached Loans
							</label>
							<div className="flex flex-col sm:flex-row items-stretch gap-3">
								<div className="flex-1">
									<Select
										showSearch
										placeholder="Choose a society / PACS..."
										optionFilterProp="children"
										value={selectedSociety}
										onChange={(val) => setSelectedSociety(val)}
										filterOption={(input, option) =>
											(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
										}
										options={sortedSocieties.map((s) => ({
											value: String(s.pacs_id),
											label: `${s.pacs_id} - ${s.pacs_name}${s.branch_code
												? ` (Branch: ${s.branch_code} - ${branchMap[s.branch_code] || ""})`
												: ""
												}`,
										}))}
										className="w-full h-12 text-sm"
										size="large"
										loading={dropdownLoading}
									/>
								</div>

								<button
									onClick={() => handleSearch("society")}
									disabled={loading || !selectedSociety}
									className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
								>
									{loading ? <LoadingOutlined spin /> : <SearchOutlined />}
									Load Society Loans
								</button>

								{selectedSociety && (
									<button
										onClick={handleReset}
										className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
									>
										<ClearOutlined /> Clear
									</button>
								)}
							</div>
							{/* <p className="text-xs text-slate-400 mt-2">
								Societies are sorted numerically by PACS ID. Select to track all attached SHG groups and loan balances.
							</p> */}
						</div>
					)}
				</div>
			</div>

			{/* ========================================================================= */}
			{/* SUMMARY STATISTICS KPI CARDS                                              */}
			{/* ========================================================================= */}
			{!loading && summary && groupList.length > 0 && searchMode !== "group" && (
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
					<div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
						<span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 block">
							Total Groups
						</span>
						<div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1">
							{formatCount(summary.total_groups)}
						</div>
						<span className="text-[11px] text-slate-400 font-medium">In selected scope</span>
					</div>

					<div className="bg-emerald-50/70 p-4 sm:p-5 rounded-2xl border border-emerald-200 shadow-xs">
						<span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-800 block">
							Loanee Groups
						</span>
						<div className="text-xl sm:text-2xl font-black text-emerald-900 font-mono mt-1">
							{formatCount(summary.loanee_groups)}
						</div>
						<span className="text-[11px] text-emerald-700 font-medium">
							{summary.active_loanee_groups || 0} currently active
						</span>
					</div>

					<div className="bg-teal-50/70 p-4 sm:p-5 rounded-2xl border border-teal-200 shadow-xs">
						<span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-teal-800 block">
							Total Disbursed
						</span>
						<div className="text-xl sm:text-2xl font-black text-teal-950 font-mono mt-1">
							{formatCurrency(summary.total_disbursed_amt)}
						</div>
						<span className="text-[11px] text-teal-700 font-medium">
							{summary.total_loans_count || 0} loan accounts
						</span>
					</div>

					<div className="bg-amber-50/70 p-4 sm:p-5 rounded-2xl border border-amber-200 shadow-xs">
						<span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-800 block">
							Total Outstanding
						</span>
						<div className="text-xl sm:text-2xl font-black text-amber-900 font-mono mt-1">
							{formatCurrency(summary.total_outstanding_amt)}
						</div>
						<span className="text-[11px] text-amber-700 font-medium">
							{summary.active_loans_count || 0} active accounts
						</span>
					</div>

					<div className="bg-sky-50/70 p-4 sm:p-5 rounded-2xl border border-sky-200 shadow-xs">
						<span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-sky-800 block">
							Current Principal
						</span>
						<div className="text-xl sm:text-2xl font-black text-sky-900 font-mono mt-1">
							{formatCurrency(summary.total_curr_prn)}
						</div>
						<span className="text-[11px] text-sky-700 font-medium">Standard book balance</span>
					</div>

					{/* Total Overdue card commented off as requested */}
					{/* <div className="bg-rose-50/70 p-4 sm:p-5 rounded-2xl border border-rose-200 shadow-xs">
						<span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rose-800 block">
							Total Overdue
						</span>
						<div className="text-xl sm:text-2xl font-black text-rose-900 font-mono mt-1">
							{formatCurrency(summary.total_overdue_amt)}
						</div>
						<span className="text-[11px] text-rose-700 font-medium">
							Prn: {formatCurrency(summary.total_ovd_prn)}
						</span>
					</div> */}
				</div>
			)}

			{/* ========================================================================= */}
			{/* RESULTS TABLE (BRANCH / SOCIETY MODES)                                    */}
			{/* ========================================================================= */}
			{searchMode !== "group" && hasSearched && !loading && (
				<div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
					{/* Table Controls Bar */}
					<div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/60">
						{/* Filter Loans section commented off as requested */}
						{/* <div className="flex flex-wrap items-center gap-2">
							<span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mr-1">
								Filter Loans:
							</span>
							<button
								onClick={() => {
									setStatusFilter("all")
									setCurrentPage(1)
								}}
								className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${statusFilter === "all"
									? "bg-teal-700 text-white shadow-2xs"
									: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
									}`}
							>
								All ({groupList.length})
							</button>
							<button
								onClick={() => {
									setStatusFilter("active_loans")
									setCurrentPage(1)
								}}
								className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${statusFilter === "active_loans"
									? "bg-emerald-600 text-white shadow-2xs"
									: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
									}`}
							>
								Active Loans ({groupList.filter((g) => g.has_active_loan).length})
							</button>
							<button
								onClick={() => {
									setStatusFilter("no_loans")
									setCurrentPage(1)
								}}
								className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${statusFilter === "no_loans"
									? "bg-slate-800 text-white shadow-2xs"
									: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
									}`}
							>
								No Active Loan ({groupList.filter((g) => !g.has_active_loan).length})
							</button>
						</div> */}

						{/* Quick In-Table Search Input */}
						<div className="relative w-full sm:w-72 sm:ml-auto">
							<input
								type="text"
								value={inResultSearch}
								onChange={(e) => {
									setInResultSearch(e.target.value)
									setCurrentPage(1)
								}}
								placeholder="Search within results..."
								className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
							/>
							<SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
						</div>
					</div>

					{/* Responsive Data Table */}
					<div className="overflow-x-auto">
						<table className="w-full text-left text-xs text-slate-700">
							<thead className="bg-slate-100/80 text-slate-700 uppercase font-extrabold text-[11px] tracking-wider border-b border-slate-200">
								<tr>
									<th className="py-3.5 px-4 text-center w-12">#</th>
									<th className="py-3.5 px-4">Group Code & Name</th>
									<th className="py-3.5 px-4">{searchMode === "branch" ? "Branch" : "Branch & PACS"}</th>
									<th className="py-3.5 px-3 text-center">Members</th>
									<th className="py-3.5 px-3 text-center">Loan Status</th>
									{/* Disbursed, Current Prn, Overdue, Outstanding commented off as requested */}
									{/* <th className="py-3.5 px-4 text-right">Disbursed (₹)</th>
									<th className="py-3.5 px-4 text-right">Current Prn (₹)</th>
									<th className="py-3.5 px-4 text-right">Overdue (₹)</th>
									<th className="py-3.5 px-4 text-right">Outstanding (₹)</th> */}
									<th className="py-3.5 px-4 text-center">Action</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-200/80">
								{paginatedRows.length === 0 ? (
									<tr>
										<td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
											No group records match the active filters
										</td>
									</tr>
								) : (
									paginatedRows.map((g, idx) => {
										const rowNum = (currentPage - 1) * pageSize + idx + 1
										const overdueTotal = Number(g.ovd_prn) + Number(g.ovd_intt)
										return (
											<tr
												key={g.group_code || idx}
												className="hover:bg-teal-50/40 transition-colors"
											>
												<td className="py-3.5 px-4 text-center font-mono text-slate-400">
													{rowNum}
												</td>
												<td className="py-3.5 px-4">
													<div className="font-extrabold text-slate-900 text-xs">
														{g.group_name}
													</div>
													<div className="font-mono text-[11px] text-teal-800 font-bold mt-0.5">
														{g.group_code}
													</div>
												</td>
												<td className="py-3.5 px-4">
													<div className="font-bold text-slate-800">
														{g.branch_name} ({g.branch_code})
													</div>
													{g.direct_indirect_flag !== "D" &&
														g.pacs_name &&
														g.pacs_name !== "Direct" &&
														!String(g.pacs_name).toLowerCase().includes("demo") && (
															<div className="text-[11px] text-slate-500">
																{g.pacs_name}
															</div>
														)}
												</td>
												<td className="py-3.5 px-3 text-center font-mono font-bold text-slate-800">
													{g.member_count}
												</td>
												<td className="py-3.5 px-3 text-center">
													{g.has_active_loan ? (
														<Tag color="green" className="font-bold rounded-md">
															Active Loan ({g.active_loans})
														</Tag>
													) : g.is_loanee ? (
														<Tag color="orange" className="font-bold rounded-md">
															Closed ({g.total_loans})
														</Tag>
													) : (
														<Tag color="default" className="font-bold rounded-md">
															No Loans
														</Tag>
													)}
													{g.fund_types && (
														<div className="flex flex-wrap items-center justify-center gap-1 mt-1">
															{g.fund_types.split(",").map((ft) => (
																<Tag
																	key={ft}
																	color={ft === "B" ? "blue" : "purple"}
																	className="font-black text-[9px] px-1 py-0 rounded tracking-tight m-0"
																>
																	{ft === "B" ? "Bank" : ft === "O" ? "Own" : ft}
																</Tag>
															))}
														</div>
													)}
												</td>
												{/* Disbursed, Current Prn, Overdue, Outstanding commented off as requested */}
												{/* <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
													{formatCurrency(g.total_disbursed)}
												</td>
												<td className="py-3.5 px-4 text-right font-mono font-bold text-sky-800">
													{formatCurrency(g.curr_prn)}
												</td>
												<td className="py-3.5 px-4 text-right font-mono font-bold">
													{overdueTotal > 0 ? (
														<span className="text-rose-600 font-extrabold">
															{formatCurrency(overdueTotal)}
														</span>
													) : (
														<span className="text-slate-400">₹ 0</span>
													)}
												</td>
												<td className="py-3.5 px-4 text-right font-mono font-black text-amber-700 text-sm">
													{formatCurrency(g.total_outstanding)}
												</td> */}
												<td className="py-3.5 px-4 text-center">
													<button
														onClick={() => handleOpenLoanModal(g)}
														className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
														title="View loan account details"
													>
														<EyeOutlined />
														<span>Track Accounts</span>
													</button>
												</td>
											</tr>
										)
									})
								)}
							</tbody>
						</table>
					</div>

					{/* Pagination Footer */}
					{filteredGroupList.length > pageSize && (
						<div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
							<span className="text-xs text-slate-500 font-medium">
								Showing {(currentPage - 1) * pageSize + 1} to{" "}
								{Math.min(currentPage * pageSize, filteredGroupList.length)} of{" "}
								{filteredGroupList.length} groups
							</span>
							<Pagination
								current={currentPage}
								pageSize={pageSize}
								total={filteredGroupList.length}
								onChange={(page) => setCurrentPage(page)}
								showSizeChanger={false}
								size="small"
							/>
						</div>
					)}
				</div>
			)}

			{/* ========================================================================= */}
			{/* LOAN HIERARCHY TRACKING & AUDIT MODAL (Members <- Group <- Society <- CCB)*/}
			{/* ========================================================================= */}
			<Modal
				title={
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
						<div>
							<div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-700">
								<AuditOutlined />
								<span>Multi-Tier Loan Tracking & Audit</span>
							</div>
							<div className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 mt-0.5">
								<span>{hierarchyData?.group?.group_name || selectedGroupModal?.group_name}</span>
								<span className="text-xs font-mono px-2.5 py-0.5 bg-slate-200 text-slate-800 rounded-md">
									CODE: {hierarchyData?.group?.group_code || selectedGroupModal?.group_code}
								</span>
							</div>
							<div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
								<span>
									<b>Branch:</b> {hierarchyData?.group?.branch_name || selectedGroupModal?.branch_name}
								</span>
								{((hierarchyData?.group?.direct_indirect_flag !== "D" && selectedGroupModal?.direct_indirect_flag !== "D") &&
									(hierarchyData?.group?.pacs_name || selectedGroupModal?.pacs_name) &&
									(hierarchyData?.group?.pacs_name || selectedGroupModal?.pacs_name) !== "Direct" &&
									!String(hierarchyData?.group?.pacs_name || selectedGroupModal?.pacs_name).toLowerCase().includes("demo")) && (
										<>
											<span>•</span>
											<span>
												<b>Society / PACS:</b>{" "}
												{hierarchyData?.group?.pacs_name || selectedGroupModal?.pacs_name}
											</span>
										</>
									)}
								<span>•</span>
								<span>
									<b>Total Members:</b>{" "}
									{hierarchyData?.group?.member_count || selectedGroupModal?.member_count || 0}
								</span>
							</div>
						</div>

						{/* Loan Account Selector Dropdown (when multiple loan accounts exist) */}
						{hierarchyData?.loan_accounts?.length > 0 && (
							<div className="min-w-[240px] self-start sm:self-center bg-slate-50 p-2 rounded-xl border border-slate-200">
								<div className="text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center justify-between">
									<span>Select Loan Account</span>
									<span className="font-bold text-teal-700">
										{(selectedFundType || hierarchyData.selected_fund_type) === "B"
											? "Bank Fund (B)"
											: (selectedFundType || hierarchyData.selected_fund_type) === "O"
												? "Own Fund (O)"
												: ""}
									</span>
								</div>
								<Select
									value={selectedPortfolioId || hierarchyData.selected_portfolio_id}
									onChange={(val) => handleSwitchPortfolio(val)}
									className="w-full text-xs font-mono font-bold"
									size="middle"
									options={hierarchyData.loan_accounts.map((acc) => ({
										value: acc.portfolio_id,
										label: `${acc.loan_acc_no} [${acc.fund_type === "B" ? "Bank" : "Own"}] (₹${new Intl.NumberFormat("en-IN").format(Math.round(acc.disb_amt || 0))})`,
									}))}
								/>
							</div>
						)}
					</div>
				}
				open={!!selectedGroupModal}
				onCancel={() => {
					setSelectedGroupModal(null)
					setHierarchyData(null)
					setSelectedMemberStatement(null)
					setSelectedLoanAcc("")
					setSelectedFundType("")
					setSelectedPortfolioId("")
				}}
				footer={null}
				width={1160}
				destroyOnClose
			>
				{modalLoading ? (
					<div className="py-24 text-center">
						<Spin indicator={<LoadingOutlined style={{ fontSize: 40 }} spin className="text-teal-700" />} />
						<p className="mt-4 text-sm text-slate-600 font-bold">
							Retrieving multi-tier loan records across CCB, Society, Group, and Members...
						</p>
					</div>
				) : !hierarchyData ? (
					<div className="py-16 text-center text-slate-500 text-sm">
						<ExclamationCircleOutlined className="text-amber-500 text-3xl mb-2" />
						<p className="font-bold">No loan tracking records available for this group.</p>
					</div>
				) : (
					<div className="space-y-6 pt-3">
						{/* Multi Fund Type Switcher (if group has loans across different fund sources like Bank Fund and Own Fund) */}
						{hierarchyData?.distinct_funds?.length > 1 && (
							<div className="p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
								<div className="flex items-center gap-2">
									<WalletOutlined className="text-teal-700 text-base" />
									<div>
										<div className="text-xs font-black text-slate-800 uppercase tracking-wider">
											Separate Loan Portfolios By Fund Type
										</div>
										<div className="text-[11px] text-slate-500">
											This group has active loans under different fund sources. Click to track each fund independently.
										</div>
									</div>
								</div>
								<div className="flex items-center gap-2">
									{hierarchyData.distinct_funds.map((f) => {
										const isActive = (selectedFundType || hierarchyData.selected_fund_type) === f.fund_type
										const isBank = f.fund_type === "B"
										return (
											<button
												key={f.fund_type}
												type="button"
												onClick={() => handleSwitchFundType(f.fund_type)}
												className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${isActive
														? isBank
															? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-300"
															: "bg-purple-600 text-white shadow-sm ring-2 ring-purple-300"
														: "bg-white text-slate-700 hover:bg-slate-100 border border-slate-300"
													}`}
											>
												<span>{isBank ? "🏦 Bank Fund (B)" : "💼 Own Fund (O)"}</span>
												{isActive && <CheckCircleFilled className="text-white text-xs" />}
											</button>
										)
									})}
								</div>
							</div>
						)}

						{/* Hierarchy Flow Bar */}
						<div className="p-3.5 bg-gradient-to-r from-teal-900 via-indigo-950 to-slate-900 rounded-2xl text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
							<div className="flex items-center gap-2 font-bold uppercase tracking-wider text-teal-300">
								<TeamOutlined className="text-base" />
								<span>Summary Flow: Members ⇦ Society (PACS) ⇦ CCB (Bank)</span>
							</div>
							<div className="flex flex-wrap items-center gap-3 text-slate-300 text-[11px]">
								<span className="flex items-center gap-1.5">
									<span>Fund:</span>
									<Tag
										color={(selectedFundType || hierarchyData.selected_fund_type) === "B" ? "blue" : "purple"}
										className="font-black text-xs px-2.5 py-0.5 rounded-md m-0"
									>
										{(selectedFundType || hierarchyData.selected_fund_type) === "B"
											? "🏦 Bank Fund (B)"
											: "💼 Own Fund (O)"}
									</Tag>
								</span>
								<span>•</span>
								<span>
									A/C:{" "}
									<b className="text-white font-mono">
										{selectedLoanAcc || hierarchyData.selected_loan_acc_no || "-"}
									</b>
								</span>
								<span>•</span>
								<span>
									Channel:{" "}
									<b className="text-white">
										{hierarchyData.group?.pacs_name ? "PACS (Indirect)" : "Direct"}
									</b>
								</span>
							</div>
						</div>

						{/* ========================================================================= */}
						{/* 3 COMPARATIVE SUMMARY CARDS (Members <- Society <- CCB)                   */}
						{/* ========================================================================= */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							{/* 1. CCB Level Card */}
							<div className="bg-indigo-50/60 border-2 border-indigo-200 rounded-2xl p-4 shadow-2xs space-y-3 relative overflow-hidden">
								<div className="flex items-center justify-between">
									<span className="px-2.5 py-0.5 bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider rounded-md">
										CCB (Bank) Level
									</span>
									<Tag
										color={(selectedFundType || hierarchyData.selected_fund_type) === "B" ? "blue" : "purple"}
										className="font-black text-[10px] uppercase rounded-md m-0"
									>
										{(selectedFundType || hierarchyData.selected_fund_type) === "B" ? "Bank Fund (B)" : "Own Fund (O)"}
									</Tag>
								</div>

								<div>
									<div className="text-[10px] uppercase font-bold text-slate-500">
										Disbursement Amount
									</div>
									<div className="text-lg font-black text-indigo-950 font-mono">
										{formatCurrency(hierarchyData.ccb_level?.loan?.disb_amt || 0)}
									</div>
								</div>

								<div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-indigo-100">
									<div>
										<span className="text-[10px] text-slate-500 block">Disb Date</span>
										<b className="text-slate-800">
											{formatDate(hierarchyData.ccb_level?.loan?.disb_dt)}
										</b>
									</div>
									<div>
										<span className="text-[10px] text-slate-500 block">ROI / Period</span>
										<b className="text-slate-800">
											{hierarchyData.ccb_level?.loan?.curr_roi || 0}% |{" "}
											{hierarchyData.ccb_level?.loan?.period || "-"} M
										</b>
									</div>
								</div>

								<div className="pt-2 border-t border-indigo-200/80 bg-white/70 p-2.5 rounded-xl">
									<div className="text-[10px] uppercase font-bold text-slate-600">
										Present Loan Outstanding
									</div>
									<div className="text-base font-black text-indigo-900 font-mono mt-0.5">
										{formatCurrency(hierarchyData.ccb_level?.loan?.present_outstanding || 0)}
									</div>
									<div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
										<span>Prn: {formatCurrency(hierarchyData.ccb_level?.loan?.curr_prn || 0)}</span>
										{/* <span className="text-rose-600 font-bold">
											Ovd: {formatCurrency(hierarchyData.ccb_level?.loan?.total_overdue || 0)}
										</span> */}
									</div>
								</div>
							</div>

							{/* 2. Society Level Card */}
							<div className="bg-emerald-50/60 border-2 border-emerald-200 rounded-2xl p-4 shadow-2xs space-y-3 relative overflow-hidden">
								<div className="flex items-center justify-between">
									<span className="px-2.5 py-0.5 bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider rounded-md">
										Society (PACS) Level
									</span>
									<Tag
										color={(selectedFundType || hierarchyData.selected_fund_type) === "B" ? "blue" : "purple"}
										className="font-black text-[10px] uppercase rounded-md m-0"
									>
										{(selectedFundType || hierarchyData.selected_fund_type) === "B" ? "Bank Fund (B)" : "Own Fund (O)"}
									</Tag>
								</div>

								<div>
									<div className="text-[10px] uppercase font-bold text-slate-500">
										Disbursement Amount
									</div>
									<div className="text-lg font-black text-emerald-950 font-mono">
										{formatCurrency(hierarchyData.society_level?.loan?.disb_amt || 0)}
									</div>
								</div>

								<div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-emerald-100">
									<div>
										<span className="text-[10px] text-slate-500 block">Disb Date</span>
										<b className="text-slate-800">
											{formatDate(hierarchyData.society_level?.loan?.disb_dt)}
										</b>
									</div>
									<div>
										<span className="text-[10px] text-slate-500 block">ROI / Period</span>
										<b className="text-slate-800">
											{hierarchyData.society_level?.loan?.curr_roi || 0}% |{" "}
											{hierarchyData.society_level?.loan?.period || "-"} M
										</b>
									</div>
								</div>

								<div className="pt-2 border-t border-emerald-200/80 bg-white/70 p-2.5 rounded-xl">
									<div className="text-[10px] uppercase font-bold text-slate-600">
										Present Loan Outstanding
									</div>
									<div className="text-base font-black text-emerald-900 font-mono mt-0.5">
										{formatCurrency(hierarchyData.society_level?.loan?.present_outstanding || 0)}
									</div>
									<div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
										<span>Prn: {formatCurrency(hierarchyData.society_level?.loan?.curr_prn || 0)}</span>
										{/* <span className="text-rose-600 font-bold">
											Ovd: {formatCurrency(hierarchyData.society_level?.loan?.total_overdue || 0)}
										</span> */}
									</div>
								</div>
							</div>

							{/* 3. Group Level Card from md_group commented off as requested */}
							{/* <div className="bg-teal-50/60 border-2 border-teal-200 rounded-2xl p-4 shadow-2xs space-y-3 relative overflow-hidden">
								<div className="flex items-center justify-between">
									<span className="px-2.5 py-0.5 bg-teal-700 text-white text-[10px] font-black uppercase tracking-wider rounded-md">
										SHG Group Level
									</span>
									<span className="text-[10px] font-mono text-teal-700 font-bold">
										md_group
									</span>
								</div>

								<div>
									<div className="text-[10px] uppercase font-bold text-slate-500">
										Cumulative Group Disb
									</div>
									<div className="text-lg font-black text-teal-950 font-mono">
										{formatCurrency(
											hierarchyData.society_level?.loan?.disb_amt ||
											hierarchyData.ccb_level?.loan?.disb_amt ||
											0
										)}
									</div>
								</div>

								<div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-teal-100">
									<div>
										<span className="text-[10px] text-slate-500 block">Total Members</span>
										<b className="text-slate-800">
											{hierarchyData.group?.member_count || 0} Members
										</b>
									</div>
									<div>
										<span className="text-[10px] text-slate-500 block">Loanee Members</span>
										<b className="text-slate-800">
											{hierarchyData.member_level?.total_loanee_members || 0} Members
										</b>
									</div>
								</div>

								<div className="pt-2 border-t border-teal-200/80 bg-white/70 p-2.5 rounded-xl">
									<div className="text-[10px] uppercase font-bold text-slate-600">
										Present Loan Outstanding
									</div>
									<div className="text-base font-black text-teal-900 font-mono mt-0.5">
										{formatCurrency(
											hierarchyData.society_level?.loan?.present_outstanding ||
											hierarchyData.ccb_level?.loan?.present_outstanding ||
											0
										)}
									</div>
									<div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
										<span>Branch: {hierarchyData.group?.branch_name}</span>
										<span className="text-teal-700 font-bold">Health: Normal</span>
									</div>
								</div>
							</div> */}

							{/* 4. Members Level Card */}
							<div className="bg-sky-50/60 border-2 border-sky-200 rounded-2xl p-4 shadow-2xs space-y-3 relative overflow-hidden">
								<div className="flex items-center justify-between">
									<span className="px-2.5 py-0.5 bg-sky-700 text-white text-[10px] font-black uppercase tracking-wider rounded-md">
										Members Level
									</span>
									<Tag
										color={(selectedFundType || hierarchyData.selected_fund_type) === "B" ? "blue" : "purple"}
										className="font-black text-[10px] uppercase rounded-md m-0"
									>
										{(selectedFundType || hierarchyData.selected_fund_type) === "B" ? "Bank Fund (B)" : "Own Fund (O)"}
									</Tag>
								</div>

								<div>
									<div className="text-[10px] uppercase font-bold text-slate-500">
										Members Disbursed
									</div>
									<div className="text-lg font-black text-sky-950 font-mono">
										{formatCurrency(hierarchyData.member_level?.total_member_disb || 0)}
									</div>
								</div>

								<div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-sky-100">
									<div>
										<span className="text-[10px] text-slate-500 block">Loanee Count</span>
										<b className="text-slate-800">
											{hierarchyData.member_level?.total_loanee_members || 0}
										</b>
									</div>
									<div>
										<span className="text-[10px] text-slate-500 block">ROI</span>
										<b className="text-slate-800">
											{hierarchyData.member_level?.members?.[0]?.curr_roi ||
												hierarchyData.society_level?.loan?.curr_roi ||
												0}
											%
										</b>
									</div>
								</div>

								<div className="pt-2 border-t border-sky-200/80 bg-white/70 p-2.5 rounded-xl">
									<div className="text-[10px] uppercase font-bold text-slate-600">
										Present Loan Outstanding
									</div>
									<div className="text-base font-black text-sky-900 font-mono mt-0.5">
										{formatCurrency(hierarchyData.member_level?.total_member_outstanding || 0)}
									</div>
									<div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
										<span>Active Accounts: {hierarchyData.member_level?.total_loanee_members || 0}</span>
										{/* <span className="text-rose-600 font-bold">
											Ovd: {formatCurrency(hierarchyData.member_level?.total_member_overdue || 0)}
										</span> */}
									</div>
								</div>
							</div>
						</div>

						{/* ========================================================================= */}
						{/* STATEMENT LEDGERS SECTION AT EACH LEVEL (Tabs)                            */}
						{/* ========================================================================= */}
						<div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
								<div>
									<h4 className="text-base font-black text-slate-900 flex items-center gap-2 m-0">
										<HistoryOutlined className="text-teal-700" />
										<span>Statement Ledger (at Each Level)</span>
									</h4>
									<p className="text-xs text-slate-500 mt-0.5">
										Inspect detailed debit / credit transaction history and recovery ledger across CCB, Society, and individual Member accounts.
									</p>
								</div>

								<div className="flex items-center gap-2">
									{activeStatementTab === "ccb" && (
										<button
											onClick={() =>
												exportHierarchyStatementToExcel("CCB", hierarchyData.ccb_level?.statement)
											}
											className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
										>
											<FileExcelOutlined />
											Export CCB Statement ({hierarchyData.ccb_level?.statement?.length || 0})
										</button>
									)}
									{activeStatementTab === "society" && (
										<button
											onClick={() =>
												exportHierarchyStatementToExcel(
													"Society",
													hierarchyData.society_level?.statement
												)
											}
											className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
										>
											<FileExcelOutlined />
											Export Society Statement ({hierarchyData.society_level?.statement?.length || 0})
										</button>
									)}
								</div>
							</div>

							<Tabs
								activeKey={activeStatementTab}
								onChange={setActiveStatementTab}
								type="card"
								items={[
									{
										key: "ccb",
										label: (
											<span className="flex items-center gap-2 font-bold text-xs sm:text-sm">
												<BankOutlined />
												<span>CCB Bank Statement</span>
												<Tag color="indigo" className="ml-1 text-[10px] font-bold">
													{hierarchyData.ccb_level?.statement?.length || 0} Trns
												</Tag>
											</span>
										),
										children: (
											<div className="space-y-3 pt-1">
												<div className="overflow-x-auto rounded-xl border border-slate-200">
													<table className="w-full text-left text-xs text-slate-700">
														<thead className="bg-indigo-50/70 text-indigo-950 uppercase font-black text-[11px] tracking-wider border-b border-indigo-200">
															<tr>
																<th className="py-3 px-3 text-center w-10">#</th>
																<th className="py-3 px-3">Date</th>
																<th className="py-3 px-3">Trans ID</th>
																<th className="py-3 px-3">Type</th>
																<th className="py-3 px-3 text-right">Debit (Dr ₹)</th>
																<th className="py-3 px-3 text-right">Credit (Cr ₹)</th>
																<th className="py-3 px-3 text-right">Prn Recov (₹)</th>
																<th className="py-3 px-3 text-right">Intt Recov (₹)</th>
																<th className="py-3 px-3 text-right">Current Prn (₹)</th>
																<th className="py-3 px-3 text-center">Status</th>
															</tr>
														</thead>
														<tbody className="divide-y divide-slate-200">
															{hierarchyData.ccb_level?.statement?.length === 0 ? (
																<tr>
																	<td
																		colSpan={10}
																		className="py-8 text-center text-slate-400 font-medium"
																	>
																		No CCB transactions found for this loan account.
																	</td>
																</tr>
															) : (
																hierarchyData.ccb_level?.statement?.map((t, idx) => (
																	<tr
																		key={idx}
																		className="hover:bg-indigo-50/30 transition-colors"
																	>
																		<td className="py-2.5 px-3 text-center font-mono text-slate-400">
																			{idx + 1}
																		</td>
																		<td className="py-2.5 px-3 font-semibold text-slate-800">
																			{formatDate(t.trans_dt)}
																		</td>
																		<td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
																			{t.trans_id || "-"}
																		</td>
																		<td className="py-2.5 px-3 font-bold">
																			{t.trans_type === "D" ? (
																				<span className="text-emerald-700">Disbursement</span>
																			) : t.trans_type === "I" ? (
																				<span className="text-amber-700">Interest Apply</span>
																			) : (
																				<span className="text-sky-700">Recovery</span>
																			)}
																		</td>
																		<td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
																			{Number(t.dr_amt) > 0 ? formatCurrency(t.dr_amt) : "-"}
																		</td>
																		<td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
																			{Number(t.cr_amt) > 0 ? formatCurrency(t.cr_amt) : "-"}
																		</td>
																		<td className="py-2.5 px-3 text-right font-mono text-slate-700">
																			{Number(t.curr_prn_recov) > 0
																				? formatCurrency(t.curr_prn_recov)
																				: "-"}
																		</td>
																		<td className="py-2.5 px-3 text-right font-mono text-slate-700">
																			{Number(t.curr_intt_recov) > 0
																				? formatCurrency(t.curr_intt_recov)
																				: "-"}
																		</td>
																		<td className="py-2.5 px-3 text-right font-mono font-black text-indigo-950">
																			{formatCurrency(t.curr_prn || 0)}
																		</td>
																		<td className="py-2.5 px-3 text-center">
																			<Tag
																				color={t.approval_status === "A" ? "green" : "default"}
																				className="font-bold text-[10px] rounded"
																			>
																				{t.approval_status === "A"
																					? "Approved"
																					: t.approval_status || "-"}
																			</Tag>
																		</td>
																	</tr>
																))
															)}
														</tbody>
													</table>
												</div>
											</div>
										),
									},
									{
										key: "society",
										label: (
											<span className="flex items-center gap-2 font-bold text-xs sm:text-sm">
												<SafetyCertificateOutlined />
												<span>Society (PACS) Statement</span>
												<Tag color="green" className="ml-1 text-[10px] font-bold">
													{hierarchyData.society_level?.statement?.length || 0} Trns
												</Tag>
											</span>
										),
										children: (
											<div className="space-y-3 pt-1">
												<div className="overflow-x-auto rounded-xl border border-slate-200">
													<table className="w-full text-left text-xs text-slate-700">
														<thead className="bg-emerald-50/70 text-emerald-950 uppercase font-black text-[11px] tracking-wider border-b border-emerald-200">
															<tr>
																<th className="py-3 px-3 text-center w-10">#</th>
																<th className="py-3 px-3">Date</th>
																<th className="py-3 px-3">Trans ID</th>
																<th className="py-3 px-3">Type</th>
																<th className="py-3 px-3 text-right">Debit (Dr ₹)</th>
																<th className="py-3 px-3 text-right">Credit (Cr ₹)</th>
																<th className="py-3 px-3 text-right">Prn Recov (₹)</th>
																<th className="py-3 px-3 text-right">Intt Recov (₹)</th>
																<th className="py-3 px-3 text-right">Current Prn (₹)</th>
																<th className="py-3 px-3 text-center">Status</th>
															</tr>
														</thead>
														<tbody className="divide-y divide-slate-200">
															{hierarchyData.society_level?.statement?.length === 0 ? (
																<tr>
																	<td
																		colSpan={10}
																		className="py-8 text-center text-slate-400 font-medium"
																	>
																		No Society transactions found for this loan account.
																	</td>
																</tr>
															) : (
																hierarchyData.society_level?.statement?.map((t, idx) => (
																	<tr
																		key={idx}
																		className="hover:bg-emerald-50/30 transition-colors"
																	>
																		<td className="py-2.5 px-3 text-center font-mono text-slate-400">
																			{idx + 1}
																		</td>
																		<td className="py-2.5 px-3 font-semibold text-slate-800">
																			{formatDate(t.trans_dt)}
																		</td>
																		<td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
																			{t.trans_id || "-"}
																		</td>
																		<td className="py-2.5 px-3 font-bold">
																			{t.trans_type === "D" ? (
																				<span className="text-emerald-700">Disbursement</span>
																			) : t.trans_type === "I" ? (
																				<span className="text-amber-700">Interest Apply</span>
																			) : (
																				<span className="text-sky-700">Recovery</span>
																			)}
																		</td>
																		<td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
																			{Number(t.dr_amt) > 0 ? formatCurrency(t.dr_amt) : "-"}
																		</td>
																		<td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
																			{Number(t.cr_amt) > 0 ? formatCurrency(t.cr_amt) : "-"}
																		</td>
																		<td className="py-2.5 px-3 text-right font-mono text-slate-700">
																			{Number(t.curr_prn_recov) > 0
																				? formatCurrency(t.curr_prn_recov)
																				: "-"}
																		</td>
																		<td className="py-2.5 px-3 text-right font-mono text-slate-700">
																			{Number(t.curr_intt_recov) > 0
																				? formatCurrency(t.curr_intt_recov)
																				: "-"}
																		</td>
																		<td className="py-2.5 px-3 text-right font-mono font-black text-emerald-950">
																			{formatCurrency(t.curr_prn || 0)}
																		</td>
																		<td className="py-2.5 px-3 text-center">
																			<Tag
																				color={t.approval_status === "A" ? "green" : "default"}
																				className="font-bold text-[10px] rounded"
																			>
																				{t.approval_status === "A"
																					? "Approved"
																					: t.approval_status || "-"}
																			</Tag>
																		</td>
																	</tr>
																))
															)}
														</tbody>
													</table>
												</div>
											</div>
										),
									},
									{
										key: "members",
										label: (
											<span className="flex items-center gap-2 font-bold text-xs sm:text-sm">
												<TeamOutlined />
												<span>Members Level Loans & Statements</span>
												<Tag color="cyan" className="ml-1 text-[10px] font-bold">
													{hierarchyData.member_level?.members?.length || 0} Members
												</Tag>
											</span>
										),
										children: (
											<div className="space-y-4 pt-1">
												<div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
													<div>
														Total Loanee Members:{" "}
														<b className="text-slate-900 font-bold">
															{hierarchyData.member_level?.total_loanee_members || 0}
														</b>
													</div>
													<div>
														Total Members Disbursed:{" "}
														<b className="text-slate-900 font-mono font-bold">
															{formatCurrency(hierarchyData.member_level?.total_member_disb || 0)}
														</b>
													</div>
													<div>
														Total Present Outstanding:{" "}
														<b className="text-amber-700 font-mono font-black">
															{formatCurrency(
																hierarchyData.member_level?.total_member_outstanding || 0
															)}
														</b>
													</div>
												</div>

												<div className="overflow-x-auto rounded-xl border border-slate-200">
													<table className="w-full text-left text-xs text-slate-700">
														<thead className="bg-sky-50/70 text-sky-950 uppercase font-black text-[11px] tracking-wider border-b border-sky-200">
															<tr>
																<th className="py-3 px-3 text-center w-10">#</th>
																<th className="py-3 px-3">Member Code</th>
																<th className="py-3 px-3">Member Name</th>
																<th className="py-3 px-3 text-right">Disbursed (₹)</th>
																<th className="py-3 px-3">Disb Date</th>
																<th className="py-3 px-3 text-center">ROI</th>
																<th className="py-3 px-3 text-center">Period</th>
																<th className="py-3 px-3 text-right">Current Prn (₹)</th>
																{/* Overdue column commented off as requested */}
																{/* <th className="py-3 px-3 text-right">Overdue (₹)</th> */}
																<th className="py-3 px-3 text-right">Outstanding (₹)</th>
																<th className="py-3 px-3 text-center">Action</th>
															</tr>
														</thead>
														<tbody className="divide-y divide-slate-200">
															{hierarchyData.member_level?.members?.length === 0 ? (
																<tr>
																	<td
																		colSpan={10}
																		className="py-8 text-center text-slate-400 font-medium"
																	>
																		No individual member loans mapped to this account.
																	</td>
																</tr>
															) : (
																hierarchyData.member_level?.members?.map((m, idx) => (
																	<tr
																		key={idx}
																		className="hover:bg-sky-50/30 transition-colors"
																	>
																		<td className="py-2.5 px-3 text-center font-mono text-slate-400">
																			{idx + 1}
																		</td>
																		<td className="py-2.5 px-3 font-mono font-bold text-teal-800">
																			{m.member_code}
																		</td>
																		<td className="py-2.5 px-3">
																			<div className="font-bold text-slate-900">{m.member_name || "-"}</div>
																			<div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
																				<span>A/C: {m.loan_acc_no}</span>
																				<Tag
																					color={(m.fund_type || "B") === "B" ? "blue" : "purple"}
																					className="text-[9px] font-bold px-1 py-0 rounded m-0 leading-tight"
																				>
																					{(m.fund_type || "B") === "B" ? "Bank Fund" : "Own Fund"}
																				</Tag>
																			</div>
																		</td>
																		<td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
																			{formatCurrency(m.disb_amt)}
																		</td>
																		<td className="py-2.5 px-3 text-slate-600">
																			{formatDate(m.disb_dt)}
																		</td>
																		<td className="py-2.5 px-3 text-center font-bold text-slate-700">
																			{m.curr_roi || 0}%
																		</td>
																		<td className="py-2.5 px-3 text-center font-bold text-slate-700">
																			{m.period || "-"} M
																		</td>
																		<td className="py-2.5 px-3 text-right font-mono font-semibold text-sky-800">
																			{formatCurrency(m.curr_prn || 0)}
																		</td>
																		{/* Overdue column commented off as requested */}
																		{/* <td className="py-2.5 px-3 text-right font-mono font-semibold text-rose-600">
																			{formatCurrency(m.total_overdue || 0)}
																		</td> */}
																		<td className="py-2.5 px-3 text-right font-mono font-black text-amber-700">
																			{formatCurrency(m.present_outstanding || 0)}
																		</td>
																		<td className="py-2.5 px-3 text-center">
																			<button
																				onClick={() => handleOpenMemberStatement(m)}
																				className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
																				title="View Member Transaction Statement"
																			>
																				<EyeOutlined />
																				<span>Statement</span>
																			</button>
																		</td>
																	</tr>
																))
															)}
														</tbody>
													</table>
												</div>
											</div>
										),
									},
								]}
							/>
						</div>
					</div>
				)}
			</Modal>

			{/* ========================================================================= */}
			{/* NESTED INDIVIDUAL MEMBER STATEMENT MODAL                                  */}
			{/* ========================================================================= */}
			<Modal
				title={
					<div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
						<UserOutlined className="text-teal-700" />
						<span>Member Statement: {selectedMemberStatement?.member_name}</span>
						<span className="text-xs font-mono px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
							CODE: {selectedMemberStatement?.member_code}
						</span>
					</div>
				}
				open={!!selectedMemberStatement}
				onCancel={() => setSelectedMemberStatement(null)}
				footer={null}
				width={950}
				destroyOnClose
			>
				{memberStatementLoading ? (
					<div className="py-16 text-center">
						<Spin indicator={<LoadingOutlined style={{ fontSize: 36 }} spin className="text-teal-700" />} />
						<p className="mt-3 text-xs text-slate-500 font-bold">
							Loading member transaction statement...
						</p>
					</div>
				) : (
					<div className="space-y-4 pt-2">
						<div className="p-3 bg-sky-50 rounded-xl border border-sky-200 flex flex-wrap items-center justify-between gap-3 text-xs">
							<div>
								Loan A/C:{" "}
								<b className="font-mono text-slate-900">
									{selectedMemberStatement?.loan_acc_no}
								</b>
							</div>
							<div>
								Disbursed:{" "}
								<b className="font-mono text-slate-900">
									{formatCurrency(selectedMemberStatement?.disb_amt)}
								</b>{" "}
								({formatDate(selectedMemberStatement?.disb_dt)})
							</div>
							<div>
								Present Outstanding:{" "}
								<b className="font-mono text-amber-700">
									{formatCurrency(selectedMemberStatement?.present_outstanding)}
								</b>
							</div>
						</div>

						<div className="overflow-x-auto rounded-xl border border-slate-200">
							<table className="w-full text-left text-xs text-slate-700">
								<thead className="bg-slate-100 text-slate-800 uppercase font-black text-[11px] tracking-wider border-b border-slate-200">
									<tr>
										<th className="py-2.5 px-3 text-center w-10">#</th>
										<th className="py-2.5 px-3">Date</th>
										<th className="py-2.5 px-3">Trans ID</th>
										<th className="py-2.5 px-3">Type</th>
										<th className="py-2.5 px-3 text-right">Debit (Dr ₹)</th>
										<th className="py-2.5 px-3 text-right">Credit (Cr ₹)</th>
										<th className="py-2.5 px-3 text-right">Prn Recov (₹)</th>
										<th className="py-2.5 px-3 text-right">Intt Recov (₹)</th>
										<th className="py-2.5 px-3 text-right">Current Prn (₹)</th>
										<th className="py-2.5 px-3 text-center">Status</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-200">
									{memberStatementList.length === 0 ? (
										<tr>
											<td colSpan={10} className="py-8 text-center text-slate-400 font-medium">
												No individual transactions recorded for this member.
											</td>
										</tr>
									) : (
										memberStatementList.map((t, idx) => (
											<tr key={idx} className="hover:bg-slate-50 transition-colors">
												<td className="py-2 px-3 text-center font-mono text-slate-400">
													{idx + 1}
												</td>
												<td className="py-2 px-3 font-semibold text-slate-800">
													{formatDate(t.trans_dt)}
												</td>
												<td className="py-2 px-3 font-mono text-[11px] text-slate-600">
													{t.trans_id || "-"}
												</td>
												<td className="py-2 px-3 font-bold">
													{t.trans_type === "D" ? (
														<span className="text-emerald-700">Disbursement</span>
													) : t.trans_type === "I" ? (
														<span className="text-amber-700">Interest Apply</span>
													) : (
														<span className="text-sky-700">Recovery</span>
													)}
												</td>
												<td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
													{Number(t.dr_amt) > 0 ? formatCurrency(t.dr_amt) : "-"}
												</td>
												<td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
													{Number(t.cr_amt) > 0 ? formatCurrency(t.cr_amt) : "-"}
												</td>
												<td className="py-2 px-3 text-right font-mono text-slate-700">
													{Number(t.curr_prn_recov) > 0
														? formatCurrency(t.curr_prn_recov)
														: "-"}
												</td>
												<td className="py-2 px-3 text-right font-mono text-slate-700">
													{Number(t.curr_intt_recov) > 0
														? formatCurrency(t.curr_intt_recov)
														: "-"}
												</td>
												<td className="py-2 px-3 text-right font-mono font-black text-slate-950">
													{formatCurrency(t.curr_prn || 0)}
												</td>
												<td className="py-2 px-3 text-center">
													<Tag
														color={t.approval_status === "A" ? "green" : "default"}
														className="font-bold text-[10px] rounded"
													>
														{t.approval_status === "A"
															? "Approved"
															: t.approval_status || "-"}
													</Tag>
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					</div>
				)}
			</Modal>
		</div>
	)
}

export default LoanTrackingBM
