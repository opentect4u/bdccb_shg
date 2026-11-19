import React, { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import moment from "moment"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"
import { Message } from "../../Components/Message"
import { url_bdccb } from "../../Address/BaseUrl"
import { getLocalStoreTokenDts } from "../../Components/getLocalforageTokenDts"
import { Spin, Select, Tag } from "antd"
import {
	LoadingOutlined,
	SearchOutlined,
	FileExcelOutlined,
	TeamOutlined,
	BankOutlined,
	EyeOutlined,
	DeploymentUnitOutlined,
	CheckCircleOutlined,
	CloseCircleOutlined,
	DollarOutlined,
	SafetyCertificateOutlined,
	PhoneOutlined,
	CalendarOutlined,
	ClearOutlined,
	ArrowRightOutlined,
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

function GroupInfoBM() {
	const navigate = useNavigate()

	// Search Mode: 'group' | 'branch' | 'society'
	const [searchMode, setSearchMode] = useState("group")

	// Filter state
	const [groupQuery, setGroupQuery] = useState("")
	const [selectedBranch, setSelectedBranch] = useState(null)
	const [selectedSociety, setSelectedSociety] = useState(null)

	// Dropdown Lists
	const [branchesList, setBranchesList] = useState([])
	const [societiesList, setSocietiesList] = useState([])
	const [dropdownLoading, setDropdownLoading] = useState(true)

	// Results Data States
	const [loading, setLoading] = useState(false)
	const [groupList, setGroupList] = useState([])
	const [summary, setSummary] = useState(null)
	const [hasSearched, setHasSearched] = useState(false)

	// Pagination
	const [currentPage, setCurrentPage] = useState(1)
	const pageSize = 15

	// 1. Fetch Branches and Societies on Mount
	useEffect(() => {
		const fetchDropdowns = async () => {
			try {
				setDropdownLoading(true)
				const tokenValue = await getLocalStoreTokenDts(navigate)
				const res = await axios.post(`${url_bdccb}/groupinfo/get_branches_and_societies`, {}, {
					headers: {
						Authorization: `${tokenValue?.token}`,
						"Content-Type": "application/json",
					},
				}).catch(() => null)

				const dataRes = res?.data
				if (dataRes?.success) {
					setBranchesList(dataRes.branches || [])
					setSocietiesList(dataRes.societies || [])
				}
			} catch (err) {
				console.warn("Could not load branches / societies:", err)
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

	// Branches sorted branch-code wise (numerically: 106, 110, 112, 113, ...)
	const sortedBranches = useMemo(() => {
		return [...branchesList].sort(
			(a, b) => (Number(a.branch_id) || 0) - (Number(b.branch_id) || 0)
		)
	}, [branchesList])

	// All societies sorted numerically by pacs_id (independent of selected branch)
	const sortedSocieties = useMemo(() => {
		return [...societiesList].sort((a, b) => {
			return (Number(a.pacs_id) || 0) - (Number(b.pacs_id) || 0)
		})
	}, [societiesList])

	// Switch Search Mode and completely reset filters
	const handleTabSwitch = (mode) => {
		setSearchMode(mode)
		setGroupQuery("")
		setSelectedBranch(null)
		setSelectedSociety(null)
		setGroupList([])
		setSummary(null)
		setHasSearched(false)
		setCurrentPage(1)
	}

	// 2. Perform Group Search
	const handleSearch = async (overrideMode, overrideVal) => {
		const mode = overrideMode || searchMode
		const queryVal = overrideVal !== undefined ? overrideVal : (mode === "group" ? groupQuery : "")
		const branchVal = mode === "branch" ? (overrideVal !== undefined ? overrideVal : selectedBranch) : null
		const pacsVal = mode === "society" ? (overrideVal !== undefined ? overrideVal : selectedSociety) : null

		if (mode === "group" && !String(queryVal).trim()) {
			Message("warning", "Please enter a Group Code or Group Name to search")
			return
		}
		if (mode === "branch" && !branchVal) {
			Message("warning", "Please select a branch to view groups")
			return
		}
		if (mode === "society" && !pacsVal) {
			Message("warning", "Please select a society to view groups")
			return
		}

		try {
			setLoading(true)
			setHasSearched(true)
			setCurrentPage(1)

			const tokenValue = await getLocalStoreTokenDts(navigate)
			const payload = {
				search_type: mode,
				query: mode === "group" ? String(queryVal).trim() : "",
				branch_code: branchVal || "",
				pacs_id: pacsVal || "",
				limit: 1000,
			}

			const res = await axios.post(`${url_bdccb}/groupinfo/search_group_info`, payload, {
				headers: {
					Authorization: `${tokenValue?.token}`,
					"Content-Type": "application/json",
				},
			})

			if (res?.data?.success && Array.isArray(res.data.data)) {
				setGroupList(res.data.data)
				setSummary(res.data.summary || {})
			} else {
				setGroupList([])
				setSummary(null)
				Message("info", res?.data?.msg || "No matching groups found")
			}
		} catch (err) {
			console.error("Search error:", err)
			Message("error", "Error fetching groups. Please try again.")
		} finally {
			setLoading(false)
		}
	}

	// Reset Search Filters
	const handleReset = () => {
		setGroupQuery("")
		setSelectedBranch(null)
		setSelectedSociety(null)
		setGroupList([])
		setSummary(null)
		setHasSearched(false)
		setCurrentPage(1)
	}

	// Pagination slicing
	const paginatedGroups = useMemo(() => {
		const start = (currentPage - 1) * pageSize
		return groupList.slice(start, start + pageSize)
	}, [groupList, currentPage])

	const totalPages = Math.ceil(groupList.length / pageSize) || 1

	// Navigate to details page
	const goToGroupDetails = (code) => {
		if (!code) return
		navigate(`/homebm/groupdetails/${code}`)
	}

	// Export to Excel
	const exportToExcel = async () => {
		if (groupList.length === 0) {
			Message("warning", "No data to export")
			return
		}

		try {
			const workbook = new ExcelJS.Workbook()
			const worksheet = workbook.addWorksheet("Groups Information")

			worksheet.columns = [
				{ header: "SL", key: "sl", width: 6 },
				{ header: "Branch Code", key: "branch_code", width: 14 },
				{ header: "Branch Name", key: "branch_name", width: 22 },
				{ header: "Group Code", key: "group_code", width: 14 },
				{ header: "Group Name", key: "group_name", width: 32 },
				{ header: "Society / PACS", key: "pacs_name", width: 26 },
				{ header: "Channel", key: "channel", width: 14 },
				{ header: "Opening Date", key: "grp_open_dt", width: 14 },
				{ header: "Members", key: "member_count", width: 10 },
				{ header: "Outstanding (₹)", key: "total_outstanding", width: 18 },
				{ header: "Disbursed (₹)", key: "total_disbursed", width: 18 },
				{ header: "SB A/C No", key: "sb_ac_no", width: 18 },
				{ header: "Sahayika", key: "sahayika_name", width: 22 },
				{ header: "Sahayika Phone", key: "sahayika_phone", width: 16 },
				{ header: "Block", key: "block_name", width: 16 },
				{ header: "GP", key: "gp_name", width: 16 },
				{ header: "Village", key: "village_name", width: 16 },
				{ header: "Status", key: "status", width: 10 },
			]

			worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } }
			worksheet.getRow(1).fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "FF0F766E" },
			}

			groupList.forEach((g, idx) => {
				worksheet.addRow({
					sl: idx + 1,
					branch_code: g.branch_code,
					branch_name: g.branch_name,
					group_code: g.group_code,
					group_name: g.group_name,
					pacs_name: g.pacs_name || "Direct",
					channel: g.direct_indirect_flag === "D" ? "Direct" : "Indirect",
					grp_open_dt: formatDate(g.grp_open_dt),
					member_count: g.member_count || 0,
					total_outstanding: g.total_outstanding || 0,
					total_disbursed: g.total_disbursed || 0,
					sb_ac_no: g.sb_ac_no || "",
					sahayika_name: g.sahayika_name || "",
					sahayika_phone: g.sahayika_phone || "",
					block_name: g.block_name || "",
					gp_name: g.gp_name || "",
					village_name: g.village_name || "",
					status: g.open_close_flag === "O" ? "Active" : "Closed",
				})
			})

			const buf = await workbook.xlsx.writeBuffer()
			saveAs(new Blob([buf]), `Group_Info_Export_${moment().format("YYYYMMDD_HHmm")}.xlsx`)
			Message("success", "Exported successfully!")
		} catch (err) {
			console.error("Export error:", err)
			Message("error", "Failed to export Excel file")
		}
	}

	return (
		<div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 space-y-6 pb-16 font-sans">
			{/* Page Heading & Breadcrumb */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
				<div>
					<div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600 mb-1">
						<DeploymentUnitOutlined />
						<span>Head Office Operations Directory</span>
					</div>
					<h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
						Search Group Information
					</h1>
					<p className="text-sm text-slate-500 mt-1">
						Search and inspect comprehensive profiles of Self Help Groups across all branches and societies.
					</p>
				</div>

				{/* {groupList.length > 0 && (
					<button
						onClick={exportToExcel}
						className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-center"
					>
						<FileExcelOutlined />
						Export Excel ({groupList.length})
					</button>
				)} */}
			</div>

			{/* Search Panel Card */}
			<div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
				{/* Search Mode Tabs */}
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
					{/* 1. Search by Group (Code or Name) */}
					{searchMode === "group" && (
						<div>
							<label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
								Enter Group Code or Group Name
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
										placeholder="e.g. 10600007 or S.H.G.MAHILAGROUP..."
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
									Find Group
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
								Type the exact or partial Group Code (e.g. 1060007) or Name to look up that group directly.
							</p>

							{/* Loading State Inside Same Card */}
							{loading && (
								<div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-500 text-sm py-4">
									<LoadingOutlined spin className="text-teal-600 text-base" />
									<span>Searching group records...</span>
								</div>
							)}

							{/* Search Results Inside Same Card */}
							{!loading && hasSearched && (
								<div className="mt-6 pt-5 border-t border-slate-200">
									{groupList.length === 0 ? (
										<div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center text-slate-500 text-sm">
											<CloseCircleOutlined className="text-slate-300 text-xl inline-block mr-2" />
											No group found matching "<span className="font-semibold text-slate-700">{groupQuery}</span>". Please verify the code or name.
										</div>
									) : (
										<div className="space-y-3">
											{groupList.map((g, idx) => (
												<div
													key={idx}
													className="p-4 sm:p-5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 rounded-2xl shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
												>
													{/* Left: Group Name, Branch Name, Society Name, Open Date, Total Members */}
													<div className="flex-1 min-w-0">
														<div className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
															{g.group_name}
														</div>

														<div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 text-xs">
															{/* Branch Name */}
															<div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 shadow-2xs">
																<BankOutlined className="text-teal-600" />
																<span>Branch:</span>
																<strong className="text-slate-800 font-semibold">
																	{g.branch_code ? `${g.branch_code} - ` : ""}{g.branch_name}
																</strong>
															</div>

															{/* Society Name */}
															<div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 shadow-2xs">
																<SafetyCertificateOutlined className="text-indigo-600" />
																<span>Society:</span>
																<strong className="text-slate-800 font-semibold">
																	{g.direct_indirect_flag === "D" || !g.pacs_id || g.pacs_name === "Direct"
																		? "Direct SHG"
																		: `${g.pacs_id ? `${g.pacs_id} - ` : ""}${g.pacs_name}`}
																</strong>
															</div>

															{/* Open Date */}
															<div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 shadow-2xs">
																<CalendarOutlined className="text-slate-400" />
																<span>Open Date:</span>
																<strong className="text-slate-800 font-semibold font-mono">
																	{formatDate(g.grp_open_dt)}
																</strong>
															</div>

															{/* Total Members */}
															<div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 shadow-2xs">
																<TeamOutlined className="text-emerald-600" />
																<span>Total Members:</span>
																<strong className="text-slate-800 font-semibold">
																	{g.member_count || 0}
																</strong>
															</div>
														</div>
													</div>

													{/* Right: Beside it, compact View Details button */}
													<div className="shrink-0 self-end md:self-center">
														<button
															onClick={() => goToGroupDetails(g.group_code)}
															className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer whitespace-nowrap"
														>
															<EyeOutlined className="text-xs" />
															View Details
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
										placeholder="Select branch"
										optionFilterProp="children"
										value={selectedBranch}
										onChange={(val) => {
											setSelectedBranch(val)
										}}
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
									Load Branch Groups
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
							<p className="text-xs text-slate-400 mt-2">
								Branches are ordered branch code wise (106, 110, 112, 113...). Select to view all Self Help Groups under that branch.
							</p>
						</div>
					)}

					{/* 3. Search by Society / PACS */}
					{searchMode === "society" && (
						<div>
							<label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
								Select Society (PACS) to List All Attached Groups
							</label>
							<div className="flex flex-col sm:flex-row items-stretch gap-3">
								<div className="flex-1">
									<Select
										showSearch
										placeholder="Choose a society / PACS..."
										optionFilterProp="children"
										value={selectedSociety}
										onChange={(val) => {
											setSelectedSociety(val)
										}}
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
									Load Society Groups
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
							<p className="text-xs text-slate-400 mt-2">
								Selecting a society lists all indirect SHG groups operating under that Primary Agricultural Credit Society.
							</p>
						</div>
					)}
				</div>
			</div>

			{/* Loading Indicator for Branch / Society Search */}
			{loading && searchMode !== "group" && (
				<div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm">
					<Spin indicator={<LoadingOutlined style={{ fontSize: 36 }} spin />} />
					<p className="mt-4 text-slate-500 font-medium text-sm">Searching group records from database...</p>
				</div>
			)}

			{/* Results Display for Branch / Society Search */}
			{!loading && hasSearched && searchMode !== "group" && (
				<div className="space-y-6">
					{/* Summary Stats Ribbon */}
					{summary && (
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
								<div className="text-xs uppercase tracking-wider font-bold text-slate-500">Total Groups</div>
								<div className="text-2xl font-black text-slate-800 mt-1">
									{formatCount(summary.total_groups || groupList.length)}
								</div>
								<div className="text-xs text-slate-400 mt-1">
									{summary.direct_groups || 0} Direct • {summary.indirect_groups || 0} Indirect
								</div>
							</div>

							<div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
								<div className="text-xs uppercase tracking-wider font-bold text-slate-500">Total Members</div>
								<div className="text-2xl font-black text-teal-600 mt-1">
									{formatCount(summary.total_members || 0)}
								</div>
								<div className="text-xs text-slate-400 mt-1">Across all groups in selection</div>
							</div>

							<div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
								<div className="text-xs uppercase tracking-wider font-bold text-slate-500">Total Outstanding</div>
								<div className="text-2xl font-black text-amber-600 mt-1">
									{formatCurrency(summary.total_outstanding || 0)}
								</div>
								<div className="text-xs text-slate-400 mt-1">Current loan exposure</div>
							</div>

							<div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
								<div className="text-xs uppercase tracking-wider font-bold text-slate-500">Total Disbursed</div>
								<div className="text-2xl font-black text-indigo-600 mt-1">
									{formatCurrency(summary.total_disbursed || 0)}
								</div>
								<div className="text-xs text-slate-400 mt-1">Cumulative sanctioned funds</div>
							</div>
						</div>
					)}

					{/* Directory Table */}
					{groupList.length === 0 ? (
						<div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-xs">
							<CloseCircleOutlined className="text-slate-300 text-4xl mb-2" />
							<h3 className="text-base font-bold text-slate-700">No Groups Found</h3>
							<p className="text-xs text-slate-500 mt-1">No groups found under the selected criteria.</p>
						</div>
					) : (
						<div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
							<div className="p-4 px-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
								<div>
									<h3 className="text-base font-extrabold text-slate-800">
										{searchMode === "branch"
											? `Branch Groups (Branch: ${selectedBranch} - ${branchMap[selectedBranch] || ""})`
											: "Society / PACS Group Directory"}
									</h3>
									<p className="text-xs text-slate-500">
										Showing {groupList.length} groups ordered branch code wise. Click "View Details" to open complete profile.
									</p>
								</div>

								<div className="flex items-center gap-2">
									<span className="text-xs text-slate-500 font-semibold">
										Page {currentPage} of {totalPages}
									</span>
								</div>
							</div>

							<div className="overflow-x-auto">
								<table className="w-full text-left text-xs sm:text-sm text-slate-700">
									<thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
										<tr>
											<th className="py-3 px-4">#</th>
											<th className="py-3 px-4">Branch (Code Wise)</th>
											<th className="py-3 px-4">Group Name & Code</th>
											<th className="py-3 px-4">Society / PACS</th>
											<th className="py-3 px-4">Channel</th>
											<th className="py-3 px-4">Opened Date</th>
											<th className="py-3 px-4 text-center">Action</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-100">
										{paginatedGroups.map((g, idx) => (
											<tr key={idx} className="hover:bg-slate-50/80 transition-colors">
												<td className="py-3 px-4 font-mono text-slate-400">
													{(currentPage - 1) * pageSize + idx + 1}
												</td>

												<td className="py-3 px-4">
													<div className="font-bold text-slate-900 flex items-center gap-1.5">
														<span className="font-mono text-xs px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-md font-extrabold">
															{g.branch_code}
														</span>
														<span>{g.branch_name}</span>
													</div>
												</td>

												<td className="py-3 px-4">
													<div className="font-extrabold text-slate-900">{g.group_name}</div>
													<div className="text-xs font-mono text-slate-500 flex items-center gap-2 mt-0.5">
														<span>CODE: {g.group_code}</span>
														{g.sb_ac_no && (
															<span className="text-slate-400">• A/C: {g.sb_ac_no}</span>
														)}
													</div>
												</td>

												<td className="py-3 px-4">
													{g.pacs_name && g.pacs_name !== "Direct" ? (
														<div className="font-semibold text-slate-800 text-xs">
															<span className="font-mono text-slate-500">[{g.pacs_id}]</span> {g.pacs_name}
														</div>
													) : (
														<span className="text-xs text-slate-400 font-medium">Direct Bank Linkage</span>
													)}
												</td>

												<td className="py-3 px-4">
													{g.direct_indirect_flag === "D" ? (
														<Tag color="cyan" className="font-bold">
															Direct
														</Tag>
													) : (
														<Tag color="blue" className="font-bold">
															PACS
														</Tag>
													)}
												</td>

												<td className="py-3 px-4 font-mono text-slate-600">
													{formatDate(g.grp_open_dt)}
												</td>

												<td className="py-3 px-4 text-center">
													<button
														onClick={() => goToGroupDetails(g.group_code)}
														className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs hover:shadow-sm transition-all cursor-pointer whitespace-nowrap"
													>
														<EyeOutlined className="text-xs" />
														View Details
													</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							{/* Pagination Footer */}
							{totalPages > 1 && (
								<div className="p-3.5 px-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
									<div>
										Showing {(currentPage - 1) * pageSize + 1} to{" "}
										{Math.min(currentPage * pageSize, groupList.length)} of {groupList.length} groups
									</div>
									<div className="flex items-center gap-1">
										<button
											onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
											disabled={currentPage === 1}
											className="px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-100 disabled:opacity-40 cursor-pointer font-semibold"
										>
											Previous
										</button>
										<span className="px-2 py-1 font-bold text-slate-700">
											{currentPage} / {totalPages}
										</span>
										<button
											onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
											disabled={currentPage === totalPages}
											className="px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-100 disabled:opacity-40 cursor-pointer font-semibold"
										>
											Next
										</button>
									</div>
								</div>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	)
}

export default GroupInfoBM
