import React, { useState, useEffect } from "react"
import Sidebar from "../../../Components/Sidebar"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import moment from "moment"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"
import { Message } from "../../../Components/Message"
import { url } from "../../../Address/BaseUrl"
import { getLocalStoreTokenDts } from "../../../Components/getLocalforageTokenDts"
import { formatDateToYYYYMMDD } from "../../../Utils/formateDate"
import { Spin } from "antd"
import { LoadingOutlined, FileSearchOutlined, SearchOutlined } from "@ant-design/icons"
import TDInputTemplateBr from "../../../Components/TDInputTemplateBr"

function OutstandingReportSocietyMain() {
	const navigate = useNavigate()
	const rawUser = JSON.parse(localStorage.getItem("user_details"))
	const userDetails = Array.isArray(rawUser) ? rawUser[0] || {} : rawUser || {}

	const userBrnCode = userDetails?.brn_code || userDetails?.[0]?.brn_code
	const userBrnName = userDetails?.branch_name || userDetails?.[0]?.branch_name || ""

	const [branches, setBranches] = useState([])
	const [branch, setBranch] = useState(() => "")

	// As on Date (default to today)
	const [asOnDate, setAsOnDate] = useState(() => formatDateToYYYYMMDD(new Date()))

	const [loading, setLoading] = useState(false)
	const [reportData, setReportData] = useState([])
	const [metadataDtls, setMetadataDtls] = useState(null)

	// Pagination state
	const [currentPage, setCurrentPage] = useState(1)
	const [itemsPerPage, setItemsPerPage] = useState(10)

	// Fetch Branch List
	const handleFetchBranchList = async () => {
		const tokenValue = await getLocalStoreTokenDts(navigate)
		try {
			const res = await axios.post(
				`${url}/fetch_branch_society_list`,
				{
					branch_type: "B",
					tenant_id: String(userDetails?.tenant_id || 1),
				},
				{
					headers: {
						Authorization: `${tokenValue?.token}`,
						"Content-Type": "application/json",
					},
				}
			)

			if (res?.data?.suc === 1) {
				setBranches(res?.data?.msg || [])
			} else {
				setBranches([])
			}
		} catch (err) {
			console.error("Fetch branch list error:", err)
			setBranches([])
		}
	}

	useEffect(() => {
		handleFetchBranchList()
	}, [])

	const branchOptions = React.useMemo(() => {
		const sorted = [...branches].sort((a, b) => {
			const codeA = parseInt(a.code || a.branch_code || a.branch_id || a.branch_assign_id || 0, 10)
			const codeB = parseInt(b.code || b.branch_code || b.branch_id || b.branch_assign_id || 0, 10)
			if (!isNaN(codeA) && !isNaN(codeB) && codeA !== codeB) {
				return codeA - codeB
			}
			return String(a.name || a.branch_name || "").localeCompare(String(b.name || b.branch_name || ""))
		})

		const list = sorted.map((item) => {
			const bCode = item.code || item.branch_code || item.branch_id || item.branch_assign_id
			const bName = item.name || item.branch_name
			return {
				code: String(bCode),
				name: bCode ? `${bCode} - ${bName}` : bName,
			}
		})

		return [
			{ code: "", name: "Select Branch" },
			{ code: "0", name: "All Branch" },
			...list,
		]
	}, [branches])

	const handleBranchChange = (e) => {
		const value = e?.target?.value !== undefined ? e.target.value : e
		if (!value || value === "") {
			setBranch("")
			setReportData([])
			setMetadataDtls(null)
			return
		}
		if (value === "0") {
			setBranch("0,All Branch")
			setReportData([])
			setMetadataDtls(null)
			return
		}
		const selected = branches.find((b) => (b.code || b.branch_code || b.branch_id || b.branch_assign_id) == value)
		if (selected) {
			setBranch(`${selected.code || selected.branch_code || selected.branch_id || selected.branch_assign_id},${selected.name || selected.branch_name || ""}`)
		} else {
			setBranch(value || "")
		}
		setReportData([])
		setMetadataDtls(null)
	}

	// Search Handler for Society Outstanding Report
	const handleSearchReport = async () => {
		if (!branch || branch.trim() === "" || branch.split(",")[0] === "") {
			Message("warning", "Please select a Branch or All Branch")
			setReportData([])
			setMetadataDtls(null)
			return
		}

		setLoading(true)
		setReportData([])
		setMetadataDtls(null)
		setCurrentPage(1)

		const selectedBrnCode = branch.split(",")[0]
		const selectedBrnName = selectedBrnCode === "0" ? "All Branch" : (branch.split(",")[1] || userBrnName)

		const payload = {
			branch_code: selectedBrnCode,
			as_on_date: asOnDate ? formatDateToYYYYMMDD(asOnDate) : formatDateToYYYYMMDD(new Date()),
			tenant_id: String(userDetails?.tenant_id || 1),
		}

		const tokenValue = await getLocalStoreTokenDts(navigate)
		const apiEndpoint = `${url}/fetch_society_loan_outstanding_report`

		try {
			const res = await axios.post(apiEndpoint, payload, {
				headers: {
					Authorization: `${tokenValue?.token}`,
					"Content-Type": "application/json",
				},
			})

			if (res?.data?.suc === 1 && res?.data?.msg && res.data.msg.length > 0) {
				const data = res.data.msg || []
				setReportData(data)
				setMetadataDtls({
					branch_code: selectedBrnCode,
					branch_name: selectedBrnName || data[0]?.branch_name || "N/A",
					as_on_date: asOnDate ? moment(asOnDate).format("DD/MM/YYYY") : moment().format("DD/MM/YYYY"),
					report_type: "Society Loan Outstanding",
				})
			} else {
				Message("error", res?.data?.msg || "No society loan outstanding records found for selected branch")
				setReportData([])
			}
		} catch (err) {
			console.error("Search society outstanding report error:", err)
			Message("error", "Error fetching society loan outstanding report")
			setReportData([])
		}
		setLoading(false)
	}

	useEffect(() => {
		setReportData([])
		setMetadataDtls(null)
		setCurrentPage(1)
	}, [branch])

	// Slicing logic for pagination
	const totalRecords = reportData.length
	const totalPages = Math.ceil(totalRecords / itemsPerPage) || 1
	const indexOfLastItem = currentPage * itemsPerPage
	const indexOfFirstItem = indexOfLastItem - itemsPerPage
	const currentData = reportData.slice(indexOfFirstItem, indexOfLastItem)

	// Excel Export Handler
	const handleExcelExport = async () => {
		if (!reportData || reportData.length === 0) return

		const workbook = new ExcelJS.Workbook()
		const worksheet = workbook.addWorksheet("Society Loan Outstanding")

		// Title rows
		worksheet.mergeCells("A1:O1")
		const subTitleCell = worksheet.getCell("A1")
		subTitleCell.value = "LOAN OUTSTANDING REPORT (SOCIETY)"
		subTitleCell.font = { name: "Calibri", size: 12, bold: true, color: { argb: "FFFFFFFF" } }
		subTitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF115E59" } }
		subTitleCell.alignment = { horizontal: "center", vertical: "middle" }

		worksheet.mergeCells("A2:O2")
		const metaCell = worksheet.getCell("A2")
		metaCell.value = `Branch: ${metadataDtls?.branch_name || "N/A"}   |   As on Date: ${metadataDtls?.as_on_date || ""}   |   Total Records: ${reportData.length}`
		metaCell.font = { name: "Calibri", size: 10, italic: true, color: { argb: "FF334155" } }
		metaCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } }
		metaCell.alignment = { horizontal: "center", vertical: "middle" }

		worksheet.addRow([])

		// Table Headers
		const headers = [
			"Sl. No.",
			"Loan ID",
			"Society Name",
			"Group Code",
			"Group Name",
			"Branch Name",
			"Period",
			"Curr ROI (%)",
			"Penal ROI (%)",
			"Disb Date",
			"Disb Amount (₹)",
			"Period Mode",
			"Start Date",
			"End Date",
			"Group Outstanding (₹)",
		]

		const headerRow = worksheet.addRow(headers)
		headerRow.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } }
		headerRow.eachCell((cell) => {
			cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } }
			cell.alignment = { horizontal: "center", vertical: "middle" }
		})

		// Data Rows
		reportData.forEach((item, index) => {
			const disbAmtVal = Number(item?.disb_amt || 0)
			const outstandingVal = Number(item?.group_outstanding || item?.society_outstanding || 0)
			const socCodeTag = (item?.society_code || item?.branch_shg_id) ? ` (${item?.society_code || item?.branch_shg_id})` : ""
			const socDisplayName = `${item?.branch_shg_id_name || item?.society_name || "N/A"}${socCodeTag}`

			const rowData = [
				index + 1,
				item?.loan_id || "",
				socDisplayName,
				item?.group_code || "",
				item?.group_name || "N/A",
				item?.branch_name || "N/A",
				Number(item?.period || 0),
				Number(item?.curr_roi || 0),
				Number(item?.penal_roi || 0),
				item?.disb_date ? moment(item.disb_date).format("DD/MM/YYYY") : "",
				disbAmtVal,
				item?.period_mode === "M" ? "Monthly" : (item?.period_mode === "Y" ? "Yearly" : (item?.period_mode || "")),
				item?.start_date ? moment(item.start_date).format("DD/MM/YYYY") : "",
				item?.end_date ? moment(item.end_date).format("DD/MM/YYYY") : "",
				outstandingVal,
			]

			const addedRow = worksheet.addRow(rowData)

			// Formatting
			addedRow.getCell(11).numFmt = "#,##0.00"
			addedRow.getCell(15).numFmt = "#,##0.00"

			addedRow.getCell(1).alignment = { horizontal: "center" }
			addedRow.getCell(7).alignment = { horizontal: "center" }
			addedRow.getCell(8).alignment = { horizontal: "right" }
			addedRow.getCell(9).alignment = { horizontal: "right" }
			addedRow.getCell(10).alignment = { horizontal: "center" }
			addedRow.getCell(11).alignment = { horizontal: "right" }
			addedRow.getCell(12).alignment = { horizontal: "center" }
			addedRow.getCell(13).alignment = { horizontal: "center" }
			addedRow.getCell(14).alignment = { horizontal: "center" }
			addedRow.getCell(15).alignment = { horizontal: "right" }
		})

		// Total Row
		const totalDisbAmt = reportData.reduce((sum, item) => sum + Number(item?.disb_amt || 0), 0)
		const totalOutstanding = reportData.reduce((sum, item) => sum + Number(item?.group_outstanding || item?.society_outstanding || 0), 0)

		const totalRowData = ["TOTAL SUMMARY", "", "", "", "", "", "", "", "", "", totalDisbAmt, "", "", "", totalOutstanding]

		const totalRow = worksheet.addRow(totalRowData)
		totalRow.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF0F172A" } }

		totalRow.eachCell((cell) => {
			cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F1F5F9" } }
		})

		totalRow.getCell(11).numFmt = "#,##0.00"
		totalRow.getCell(15).numFmt = "#,##0.00"

		// Auto fit column widths
		worksheet.columns.forEach((col) => {
			col.width = 18
		})

		const buffer = await workbook.xlsx.writeBuffer()
		const fileName = `Loan_Outstanding_Report_Society_${moment().format("YYYYMMDD_HHmmss")}.xlsx`
		saveAs(new Blob([buffer]), fileName)
	}

	// Print View Handler
	const handlePrintReport = () => {
		if (!reportData || reportData.length === 0) return

		const printWindow = window.open("", "_blank")

		const totalDisbAmt = reportData.reduce((sum, item) => sum + Number(item?.disb_amt || 0), 0)
		const totalOutstanding = reportData.reduce((sum, item) => sum + Number(item?.group_outstanding || item?.society_outstanding || 0), 0)

		const tableHeaderHtml = `
			<tr>
				<th>Sl. No.</th>
				<th>Loan ID</th>
				<th>Society Name</th>
				<th>Group Code</th>
				<th>Group Name</th>
				<th>Branch Name</th>
				<th>Period</th>
				<th>Curr ROI (%)</th>
				<th>Penal ROI (%)</th>
				<th>Disb Date</th>
				<th style="text-align: right;">Disb Amount (₹)</th>
				<th>Period Mode</th>
				<th>Start Date</th>
				<th>End Date</th>
				<th style="text-align: right;">Group Outstanding (₹)</th>
			</tr>
		`

		const tableRowsHtml = reportData.map((item, index) => {
			const disbAmtVal = Number(item?.disb_amt || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })
			const outstandingVal = Number(item?.group_outstanding || item?.society_outstanding || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })

			return `
				<tr>
					<td style="text-align: center;">${index + 1}</td>
					<td style="font-family: monospace;">${item?.loan_id || ""}</td>
					<td style="font-weight: 600;">${item?.branch_shg_id_name || item?.society_name || "N/A"}${(item?.society_code || item?.branch_shg_id) ? ` (${item?.society_code || item?.branch_shg_id})` : ''}</td>
					<td style="font-family: monospace;">${item?.group_code || ""}</td>
					<td style="font-weight: 600;">${item?.group_name || "N/A"}</td>
					<td>${item?.branch_name || "N/A"}</td>
					<td style="text-align: center;">${item?.period || 0}</td>
					<td style="text-align: right;">${Number(item?.curr_roi || 0).toFixed(2)}</td>
					<td style="text-align: right;">${Number(item?.penal_roi || 0).toFixed(2)}</td>
					<td style="text-align: center;">${item?.disb_date ? moment(item.disb_date).format("DD/MM/YYYY") : "N/A"}</td>
					<td style="text-align: right;">${disbAmtVal}</td>
					<td style="text-align: center;">${item?.period_mode === "M" ? "Monthly" : (item?.period_mode === "Y" ? "Yearly" : (item?.period_mode || "N/A"))}</td>
					<td style="text-align: center;">${item?.start_date ? moment(item.start_date).format("DD/MM/YYYY") : "N/A"}</td>
					<td style="text-align: center;">${item?.end_date ? moment(item.end_date).format("DD/MM/YYYY") : "N/A"}</td>
					<td style="text-align: right; font-weight: bold; color: #0f766e;">${outstandingVal}</td>
				</tr>
			`
		}).join("")

		const htmlContent = `
			<!DOCTYPE html>
			<html>
			<head>
				<title>Loan Outstanding Report (Society)</title>
				<style>
					@page { size: landscape; margin: 10mm; }
					body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 15px; color: #1e293b; font-size: 11px; }
					.header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #0f766e; padding-bottom: 10px; }
					.header h2 { margin: 0; color: #0f766e; font-size: 18px; text-transform: uppercase; }
					.header h3 { margin: 4px 0 0 0; color: #334155; font-size: 13px; font-weight: 600; }
					.meta-info { display: flex; justify-content: space-between; font-size: 10px; font-weight: bold; margin-bottom: 10px; color: #475569; }
					table { width: 100%; border-collapse: collapse; margin-top: 5px; }
					th, td { border: 1px solid #cbd5e1; padding: 5px 7px; }
					th { background-color: #1e293b; color: #ffffff; font-size: 10px; text-transform: uppercase; text-align: left; }
					tr:nth-child(even) { background-color: #f8fafc; }
					tfoot tr { background-color: #e2e8f0; font-weight: bold; }
					@media print {
						body { padding: 0; }
						button { display: none; }
					}
				</style>
			</head>
			<body>
				<div class="header">
					<h3>LOAN OUTSTANDING REPORT (SOCIETY)</h3>
				</div>
				<div class="meta-info">
					<span>Branch: ${metadataDtls?.branch_name || "N/A"}</span>
					<span>As on Date: ${metadataDtls?.as_on_date || ""}</span>
					<span>Total Records: ${reportData.length}</span>
				</div>
				<table>
					<thead>${tableHeaderHtml}</thead>
					<tbody>${tableRowsHtml}</tbody>
					<tfoot>
						<tr>
							<td colSpan="10" style="text-align: right; text-transform: uppercase;">Total Summary:</td>
							<td style="text-align: right; color: #059669;">${totalDisbAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
							<td colSpan="3"></td>
							<td style="text-align: right; color: #0f766e;">${totalOutstanding.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
						</tr>
					</tfoot>
				</table>
				<script>
					window.onload = function() {
						window.print();
						window.onafterprint = function() { window.close(); };
						setTimeout(function() { window.close(); }, 1500);
					};
				</script>
			</body>
			</html>
		`

		printWindow.document.write(htmlContent)
		printWindow.document.close()
	}

	const isBranchSelected = Boolean(branch && branch.trim() && branch.split(",")[0] !== "")
	const canSubmit = isBranchSelected && Boolean(asOnDate)

	return (
		<div>
			<Sidebar mode={2} />
			<Spin
				indicator={<LoadingOutlined spin />}
				size="large"
				className="text-slate-800 dark:text-gray-400"
				spinning={loading}
			>
				<main className="w-[95%] max-w-[1400px] mx-auto my-6 p-6 md:p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 transition-all duration-300">
					{/* Header Section */}
					<div className="flex flex-col md:flex-row md:items-center justify-between pb-5 mb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
						<div className="flex items-center gap-4">
							<div className="p-3 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl text-white shadow-md shadow-teal-500/20">
								<FileSearchOutlined className="text-2xl" />
							</div>
							<div>
								<h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
									Loan Outstanding Report (Society)
								</h1>
								<p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
									View society groupwise loan outstanding details for selected branch as on date
								</p>
							</div>
						</div>
					</div>

					{/* Control / Filter Card (Sequence: Select Branch -> As on Date -> Search) */}
					<div className="bg-slate-50/90 dark:bg-slate-800/60 p-5 md:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm mb-6">
						<div className="grid grid-cols-1 md:grid-cols-12 items-end gap-4">
							{/* Select Branch (Big section - 7 cols) */}
							<div className="w-full md:col-span-7">
								<label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
									Select Branch <span className="text-red-500">*</span>
								</label>
								<TDInputTemplateBr
									placeholder="Select Branch..."
									type="text"
									label=""
									name="branch"
									formControlName={branch && branch !== "undefined" && branch.split(",")[0] !== "undefined" ? branch.split(",")[0] : ""}
									handleChange={handleBranchChange}
									mode={2}
									data={branchOptions}
								/>
							</div>

							{/* As on Date (3 cols) */}
							<div className="w-full md:col-span-3">
								<TDInputTemplateBr
									placeholder="As on Date"
									type="date"
									label="As on Date"
									name="asOnDate"
									formControlName={asOnDate}
									handleChange={(e) => {
										const val = e.target.value
										const todayStr = formatDateToYYYYMMDD(new Date())
										if (val > todayStr) {
											Message("warning", "Future date is not allowed for As on Date")
											setAsOnDate(todayStr)
										} else {
											setAsOnDate(val)
										}
									}}
									max={formatDateToYYYYMMDD(new Date())}
									mode={1}
								/>
							</div>

							{/* Search Button (Small button - 2 cols) */}
							<div className="w-full md:col-span-2 pb-[1px]">
								<button
									disabled={!canSubmit}
									className={`h-[38px] inline-flex items-center justify-center px-4 w-full text-xs font-bold text-white rounded-xl transition-all duration-200 shadow-md gap-1.5 ${canSubmit
											? "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 border border-teal-600 cursor-pointer active:scale-95 shadow-teal-500/20"
											: "bg-slate-300 dark:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-400 cursor-not-allowed opacity-60 active:scale-100"
										}`}
									onClick={handleSearchReport}
								>
									<SearchOutlined className="text-xs" />
									<span>Search</span>
								</button>
							</div>
						</div>
					</div>

					{/* Results Card */}
					{reportData.length !== 0 && (
						<div className="bg-slate-50/50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
								<div>
									<h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
										<span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
										<span>Society Loan Outstanding Details</span>
									</h3>
									<p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
										{reportData.length} Record(s) Found {metadataDtls?.branch_name ? `for ${metadataDtls.branch_name}` : ""} as on {metadataDtls?.as_on_date}
									</p>
								</div>
							</div>

							<div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm max-h-[500px]">
								<table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
									<thead className="text-xs uppercase bg-slate-800 text-slate-100 dark:bg-slate-900 sticky top-0 z-10">
										<tr>
											<th scope="col" className="px-4 py-3 font-bold tracking-wider text-center">Sl. No.</th>
											<th scope="col" className="px-4 py-3 font-bold tracking-wider">Loan ID</th>
											<th scope="col" className="px-4 py-3 font-bold tracking-wider">Society Name</th>
											<th scope="col" className="px-4 py-3 font-bold tracking-wider">Group Code</th>
											<th scope="col" className="px-4 py-3 font-bold tracking-wider">Group Name</th>
											<th scope="col" className="px-4 py-3 font-bold tracking-wider text-center">Period</th>
											<th scope="col" className="px-4 py-3 font-bold tracking-wider text-right">Curr ROI (%)</th>
											<th scope="col" className="px-4 py-3 font-bold tracking-wider text-right">Penal ROI (%)</th>
											<th scope="col" className="px-4 py-3 font-bold tracking-wider">Disb Date</th>
											<th scope="col" className="px-4 py-3 font-bold tracking-wider text-right">Disb Amount (₹)</th>
											<th scope="col" className="px-4 py-3 font-bold tracking-wider text-center">Period Mode</th>
											<th scope="col" className="px-4 py-3 font-bold tracking-wider">Start Date</th>
											<th scope="col" className="px-4 py-3 font-bold tracking-wider">End Date</th>
											<th scope="col" className="px-4 py-3 font-bold tracking-wider text-right">Group Outstanding (₹)</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-200 dark:divide-slate-800">
										{currentData.map((item, i) => (
											<tr key={i} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
												<td className="px-4 py-3 text-center font-medium text-slate-700 dark:text-slate-300">{indexOfFirstItem + i + 1}</td>
												<td className="px-4 py-3 font-mono text-teal-600 font-medium">{item?.loan_id}</td>
												<td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
													{item?.branch_shg_id_name || item?.society_name || "N/A"}
													{(item?.society_code || item?.branch_shg_id) ? ` (${item?.society_code || item?.branch_shg_id})` : ""}
												</td>
												<td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">{item?.group_code || "N/A"}</td>
												<td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{item?.group_name || "N/A"}</td>
												<td className="px-4 py-3 text-center">{item?.period || 0}</td>
												<td className="px-4 py-3 text-right">{Number(item?.curr_roi || 0).toFixed(2)}</td>
												<td className="px-4 py-3 text-right">{Number(item?.penal_roi || 0).toFixed(2)}</td>
												<td className="px-4 py-3">{item?.disb_date ? moment(item.disb_date).format("DD/MM/YYYY") : "N/A"}</td>
												<td className="px-4 py-3 text-right font-medium">{Number(item?.disb_amt || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
												<td className="px-4 py-3 text-center">{item?.period_mode === "M" ? "Monthly" : (item?.period_mode === "Y" ? "Yearly" : (item?.period_mode || "N/A"))}</td>
												<td className="px-4 py-3">{item?.start_date ? moment(item.start_date).format("DD/MM/YYYY") : "N/A"}</td>
												<td className="px-4 py-3">{item?.end_date ? moment(item.end_date).format("DD/MM/YYYY") : "N/A"}</td>
												<td className="px-4 py-3 text-right font-bold text-teal-600 dark:text-teal-400">
													{Number(item?.group_outstanding || item?.society_outstanding || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
												</td>
											</tr>
										))}
									</tbody>
									<tfoot className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-slate-100 border-t-2 border-slate-300 dark:border-slate-700">
										<tr>
											<td colSpan={9} className="px-4 py-3 text-right uppercase tracking-wider">Total Summary:</td>
											<td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">
												{reportData.reduce((sum, item) => sum + Number(item?.disb_amt || 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
											</td>
											<td colSpan={3}></td>
											<td className="px-4 py-3 text-right text-teal-600 dark:text-teal-400">
												{reportData.reduce((sum, item) => sum + Number(item?.group_outstanding || item?.society_outstanding || 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
											</td>
										</tr>
									</tfoot>
								</table>
							</div>

							{/* Pagination Bar */}
							{reportData.length > 0 && (
								<div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
									<div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
										<span>
											Showing <strong className="font-semibold text-slate-900 dark:text-slate-100">{indexOfFirstItem + 1}</strong> to{" "}
											<strong className="font-semibold text-slate-900 dark:text-slate-100">{Math.min(indexOfLastItem, totalRecords)}</strong> of{" "}
											<strong className="font-semibold text-slate-900 dark:text-slate-100">{totalRecords}</strong> entries
										</span>
										<div className="flex items-center gap-1.5 ml-2">
											<span className="text-slate-500">Per page:</span>
											<select
												value={itemsPerPage}
												onChange={(e) => {
													setItemsPerPage(Number(e.target.value))
													setCurrentPage(1)
												}}
												className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500"
											>
												<option value={10}>10</option>
												<option value={25}>25</option>
												<option value={50}>50</option>
												<option value={100}>100</option>
											</select>
										</div>
									</div>

									<div className="flex items-center gap-1.5">
										<button
											disabled={currentPage === 1}
											onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
											className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
										>
											Prev
										</button>

										{Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
											let pageNum = currentPage
											if (totalPages <= 5) {
												pageNum = index + 1
											} else if (currentPage <= 3) {
												pageNum = index + 1
											} else if (currentPage >= totalPages - 2) {
												pageNum = totalPages - 4 + index
											} else {
												pageNum = currentPage - 2 + index
											}

											return (
												<button
													key={pageNum}
													onClick={() => setCurrentPage(pageNum)}
													className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
														currentPage === pageNum
															? "bg-teal-600 border-teal-600 text-white shadow-sm"
															: "border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
													}`}
												>
													{pageNum}
												</button>
											)
										})}

										<button
											disabled={currentPage === totalPages}
											onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
											className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
										>
											Next
										</button>
									</div>
								</div>
							)}
						</div>
					)}

					{/* Action Buttons: Excel Export & Print */}
					{reportData.length !== 0 && (
						<div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
							<button
								onClick={handleExcelExport}
								className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-400 dark:border-emerald-800 rounded-xl shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
							>
								<span>Download Excel</span>
							</button>

							<button
								onClick={handlePrintReport}
								className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-300 dark:bg-teal-950/40 dark:hover:bg-teal-900/60 dark:text-teal-400 dark:border-teal-800 rounded-xl shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
							>
								<span>Print</span>
							</button>
						</div>
					)}
				</main>
			</Spin>
		</div>
	)
}

export default OutstandingReportSocietyMain
