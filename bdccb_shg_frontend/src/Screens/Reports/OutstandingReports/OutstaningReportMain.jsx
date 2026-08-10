import React, { useCallback, useEffect, useState } from "react"
import Sidebar from "../../../Components/Sidebar"
import axios from "axios"
import { url } from "../../../Address/BaseUrl"
import { Spin, Tooltip } from "antd"
import {
	LoadingOutlined,
	SearchOutlined,
	FileSearchOutlined,
} from "@ant-design/icons"
import Radiobtn from "../../../Components/Radiobtn"
import TDInputTemplateBr from "../../../Components/TDInputTemplateBr"
import { formatDateToYYYYMMDD } from "../../../Utils/formateDate"
import moment from "moment"

import { saveAs } from "file-saver"
import ExcelJS from "exceljs"
import { MultiSelect } from "primereact/multiselect"
import { Message } from "../../../Components/Message"
import { getLocalStoreTokenDts } from "../../../Components/getLocalforageTokenDts"
import { routePaths } from "../../../Assets/Data/Routes"
import { useNavigate } from "react-router"

// 2 Report Options: Groupwise & Memberwise
const reportTypeOptions = [
	{
		label: "Groupwise",
		value: "G",
	},
	{
		label: "Memberwise",
		value: "M",
	},
]

const groupwiseHeaderMap = {
	loan_id: "Loan ID",
	group_code: "Group Code",
	group_name: "Group Name",
	branch_name: "Branch Name",
	period: "Period",
	curr_roi: "Current ROI (%)",
	penal_roi: "Penal ROI (%)",
	disb_date: "Disbursement Date",
	disb_amt: "Disbursement Amount",
	period_mode: "Period Mode",
	start_date: "Start Date",
	end_date: "End Date",
	group_outstanding: "Group Outstanding",
}

const memberwiseHeaderMap = {
	loan_id: "Loan ID",
	ccb_loan_id: "CCB Loan ID",
	member_code: "Member Code",
	member_name: "Member Name",
	group_code: "Group Code",
	group_name: "Group Name",
	branch_name: "Branch Name",
	period: "Period",
	curr_roi: "Current ROI (%)",
	penal_roi: "Penal ROI (%)",
	disb_date: "Disbursement Date",
	disb_amt: "Disbursement Amount",
	period_mode: "Period Mode",
	start_date: "Start Date",
	end_date: "End Date",
	member_outstanding: "Member Outstanding",
}

function OutstaningReportMain() {
	const navigate = useNavigate()
	const rawUser = JSON.parse(localStorage.getItem("user_details"))
	const userDetails = Array.isArray(rawUser) ? rawUser[0] || {} : rawUser || {}

	const userBrnCode = userDetails?.brn_code || userDetails?.[0]?.brn_code
	const userBrnName = userDetails?.branch_name || userDetails?.[0]?.branch_name || ""

	const [branches, setBranches] = useState([])
	const [branch, setBranch] = useState(() => "")

	// Report Option: 'G' = Groupwise, 'M' = Memberwise
	const [reportType, setReportType] = useState(() => "G")

	// As on Date (default to today)
	const [asOnDate, setAsOnDate] = useState(() => formatDateToYYYYMMDD(new Date()))

	const [loading, setLoading] = useState(false)
	const [reportData, setReportData] = useState([])
	const [metadataDtls, setMetadataDtls] = useState(null)
	const [selectedColumns, setSelectedColumns] = useState(null)
	const [md_columns, setColumns] = useState([])

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
					tenant_id: userDetails?.tenant_id || 1,
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

	const populateColumns = (main_dt, headerExport) => {
		if (!main_dt || main_dt.length === 0) {
			setColumns([])
			setSelectedColumns(null)
			return
		}
		const columnToBeShown = Object.keys(main_dt[0])
			.filter((key) => headerExport[key])
			.map((key, index) => ({ header: headerExport[key], index }))
		setColumns(columnToBeShown)
		setSelectedColumns(columnToBeShown.map((el) => el.index))
	}

	// Main Search Handler
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
			branch_shg_id: "111",
			option_type: reportType,
			as_on_date: asOnDate ? formatDateToYYYYMMDD(asOnDate) : formatDateToYYYYMMDD(new Date()),
			tenant_id: userDetails?.tenant_id || 1,
		}

		const tokenValue = await getLocalStoreTokenDts(navigate)
		const apiEndpoint = `${url}/fetch_direct_groupwise_outstanding_report`

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
					report_type: reportType === "G" ? "Groupwise" : "Memberwise",
				})
				populateColumns(data, reportType === "G" ? groupwiseHeaderMap : memberwiseHeaderMap)
			} else {
				Message("error", res?.data?.msg || "No loan outstanding records found for selected branch")
				setReportData([])
			}
		} catch (err) {
			console.error("Search outstanding report error:", err)
			Message("error", "Error fetching loan outstanding report")
			setReportData([])
		}
		setLoading(false)
	}

	useEffect(() => {
		setReportData([])
		setMetadataDtls(null)
		setCurrentPage(1)
	}, [reportType, branch])

	// Slicing logic for pagination
	const totalRecords = reportData.length
	const totalPages = Math.ceil(totalRecords / itemsPerPage) || 1
	const indexOfLastItem = currentPage * itemsPerPage
	const indexOfFirstItem = indexOfLastItem - itemsPerPage
	const currentData = reportData.slice(indexOfFirstItem, indexOfLastItem)

	// Excel Export
	const handleExcelExport = async () => {
		if (!reportData || reportData.length === 0) return

		const isGroupwise = reportType === "G"
		const titleText = "BURDWAN CENTRAL CO-OPERATIVE BANK LTD."
		const subtitleText = isGroupwise
			? "BRANCH GROUPWISE LOAN OUTSTANDING REPORT"
			: "BRANCH MEMBERWISE LOAN OUTSTANDING REPORT"
		const formattedAsOnDt = asOnDate ? moment(asOnDate).format("DD/MM/YYYY") : moment().format("DD/MM/YYYY")

		const totalDisb = reportData.reduce((acc, curr) => acc + (parseFloat(curr.disb_amt) || 0), 0)
		const totalOutstanding = reportData.reduce((acc, curr) => acc + (parseFloat(curr.group_outstanding ?? curr.member_outstanding) || 0), 0)

		const workbook = new ExcelJS.Workbook()
		const worksheetName = isGroupwise ? "Groupwise Outstanding" : "Memberwise Outstanding"
		const worksheet = workbook.addWorksheet(worksheetName)

		if (isGroupwise) {
			worksheet.columns = [
				{ width: 8 }, { width: 16 }, { width: 16 }, { width: 28 }, { width: 20 },
				{ width: 10 }, { width: 14 }, { width: 14 }, { width: 16 }, { width: 20 },
				{ width: 14 }, { width: 16 }, { width: 16 }, { width: 24 },
			]
		} else {
			worksheet.columns = [
				{ width: 8 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 26 },
				{ width: 26 }, { width: 20 }, { width: 10 }, { width: 14 }, { width: 14 },
				{ width: 16 }, { width: 20 }, { width: 14 }, { width: 16 }, { width: 16 },
				{ width: 24 },
			]
		}

		const bankRow = worksheet.addRow([subtitleText])
		worksheet.mergeCells(isGroupwise ? "A1:N1" : "A1:P1")
		bankRow.font = { name: "Segoe UI", size: 15, bold: true, color: { argb: "FFFFFFFF" } }
		bankRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } }
		bankRow.alignment = { horizontal: "center", vertical: "middle" }
		bankRow.height = 32

		worksheet.addRow([])

		const brnNameCode = `${metadataDtls?.branch_name || "N/A"}${metadataDtls?.branch_code ? ` (${metadataDtls.branch_code})` : ""}`
		const metaRows = [
			["Branch Name:", brnNameCode, "", "", "", "", "Report Type:", isGroupwise ? "Groupwise Outstanding" : "Memberwise Outstanding"],
			["As On Date:", formattedAsOnDt, "", "", "", "", "Total Records:", reportData.length],
		]

		metaRows.forEach((r) => {
			const row = worksheet.addRow([r[0], r[1], "", "", "", "", r[6], r[7]])
			row.font = { name: "Segoe UI", size: 10 }
			row.getCell(1).font = { bold: true, color: { argb: "FF475569" } }
			row.getCell(2).font = { bold: true, color: { argb: "FF0F172A" } }
			row.getCell(7).font = { bold: true, color: { argb: "FF475569" } }
			row.getCell(8).font = { bold: true, color: { argb: "FF0F172A" } }
			row.height = 20
		})

		worksheet.addRow([])

		const headers = isGroupwise ? [
			"Sl. No.",
			"Loan ID",
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
			"Group Outstanding (₹)"
		] : [
			"Sl. No.",
			"Loan ID",
			"CCB Loan ID",
			"Member Code",
			"Member Name",
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
			"Member Outstanding (₹)"
		]

		const headerRow = worksheet.addRow(headers)
		headerRow.height = 26
		headerRow.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } }
		headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } }

		headerRow.eachCell((cell, colNumber) => {
			cell.alignment = {
				vertical: "middle",
				horizontal: isGroupwise
					? ([6, 7, 8, 10, 14].includes(colNumber) ? "right" : [1, 9, 11, 12, 13].includes(colNumber) ? "center" : "left")
					: ([8, 9, 10, 12, 16].includes(colNumber) ? "right" : [1, 11, 13, 14, 15].includes(colNumber) ? "center" : "left")
			}
			cell.border = {
				top: { style: "thin", color: { argb: "FFCBD5E1" } },
				left: { style: "thin", color: { argb: "FFCBD5E1" } },
				bottom: { style: "medium", color: { argb: "FF0F766E" } },
				right: { style: "thin", color: { argb: "FFCBD5E1" } },
			}
		})

		reportData.forEach((item, idx) => {
			const pModeStr = item.period_mode === "M" ? "Monthly" : (item.period_mode === "Y" ? "Yearly" : (item.period_mode || "N/A"))
			const rowValues = isGroupwise ? [
				idx + 1,
				item.loan_id || "",
				item.group_code || "",
				item.group_name || "N/A",
				item.branch_name || "N/A",
				item.period || 0,
				parseFloat(item.curr_roi || 0),
				parseFloat(item.penal_roi || 0),
				item.disb_date ? moment(item.disb_date).format("DD/MM/YYYY") : "N/A",
				parseFloat(item.disb_amt || 0),
				pModeStr,
				item.start_date ? moment(item.start_date).format("DD/MM/YYYY") : "N/A",
				item.end_date ? moment(item.end_date).format("DD/MM/YYYY") : "N/A",
				parseFloat(item.group_outstanding || 0)
			] : [
				idx + 1,
				item.loan_id || "",
				item.ccb_loan_id || "N/A",
				item.member_code || "",
				item.member_name || "N/A",
				item.group_name || "N/A",
				item.branch_name || "N/A",
				item.period || 0,
				parseFloat(item.curr_roi || 0),
				parseFloat(item.penal_roi || 0),
				item.disb_date ? moment(item.disb_date).format("DD/MM/YYYY") : "N/A",
				parseFloat(item.disb_amt || 0),
				pModeStr,
				item.start_date ? moment(item.start_date).format("DD/MM/YYYY") : "N/A",
				item.end_date ? moment(item.end_date).format("DD/MM/YYYY") : "N/A",
				parseFloat(item.member_outstanding || 0)
			]

			const dataRow = worksheet.addRow(rowValues)
			dataRow.height = 22
			dataRow.font = { name: "Segoe UI", size: 10 }
			if (idx % 2 === 1) dataRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } }

			const disbColIndex = isGroupwise ? 10 : 12
			const outstColIndex = isGroupwise ? 14 : 16

			dataRow.getCell(disbColIndex).numberFormat = "#,##0.00"
			dataRow.getCell(outstColIndex).numberFormat = "#,##0.00"
			dataRow.getCell(outstColIndex).font = { color: { argb: "FF0F766E" }, bold: true }

			dataRow.eachCell((cell, colNumber) => {
				cell.alignment = {
					vertical: "middle",
					horizontal: isGroupwise
						? ([6, 7, 8, 10, 14].includes(colNumber) ? "right" : [1, 9, 11, 12, 13].includes(colNumber) ? "center" : "left")
						: ([8, 9, 10, 12, 16].includes(colNumber) ? "right" : [1, 11, 13, 14, 15].includes(colNumber) ? "center" : "left")
				}
				cell.border = {
					top: { style: "thin", color: { argb: "FFE2E8F0" } },
					left: { style: "thin", color: { argb: "FFE2E8F0" } },
					bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
					right: { style: "thin", color: { argb: "FFE2E8F0" } },
				}
			})
		})

		worksheet.addRow([])

		const summaryRowValues = isGroupwise
			? ["TOTAL SUMMARY:", "", "", "", "", "", "", "", "", totalDisb, "", "", "", totalOutstanding]
			: ["TOTAL SUMMARY:", "", "", "", "", "", "", "", "", "", "", totalDisb, "", "", "", totalOutstanding]

		const summaryRow = worksheet.addRow(summaryRowValues)
		if (isGroupwise) {
			worksheet.mergeCells(`A${summaryRow.number}:I${summaryRow.number}`)
		} else {
			worksheet.mergeCells(`A${summaryRow.number}:K${summaryRow.number}`)
		}
		summaryRow.height = 26
		summaryRow.font = { name: "Segoe UI", size: 11, bold: true }

		const titleCell = summaryRow.getCell(1)
		titleCell.alignment = { horizontal: "right", vertical: "middle" }
		titleCell.font = { bold: true, color: { argb: "FF0F172A" } }

		const disbColIdx = isGroupwise ? 10 : 12
		const outstColIdx = isGroupwise ? 14 : 16

		const disbCell = summaryRow.getCell(disbColIdx)
		disbCell.numberFormat = "#,##0.00"
		disbCell.font = { bold: true, color: { argb: "FF16A34A" } }
		disbCell.alignment = { horizontal: "right", vertical: "middle" }

		const outstCell = summaryRow.getCell(outstColIdx)
		outstCell.numberFormat = "#,##0.00"
		outstCell.font = { bold: true, color: { argb: "FF0F766E" } }
		outstCell.alignment = { horizontal: "right", vertical: "middle" }

		summaryRow.eachCell((cell) => {
			cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } }
			cell.border = {
				top: { style: "medium", color: { argb: "FF0F766E" } },
				bottom: { style: "double", color: { argb: "FF0F766E" } },
			}
		})

		const filePrefix = isGroupwise ? "Branch_Groupwise_Outstanding_Report" : "Branch_Memberwise_Outstanding_Report"
		const buffer = await workbook.xlsx.writeBuffer()
		const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
		saveAs(blob, `${filePrefix}_${moment().format("DDMMYYYY")}.xlsx`)
	}

	// Print Report
	const handlePrintReport = () => {
		if (!reportData || reportData.length === 0) return

		const isGroupwise = reportType === "G"
		const printWindow = window.open("", "_blank")
		const totalDisb = reportData.reduce((acc, curr) => acc + (parseFloat(curr.disb_amt) || 0), 0)
		const totalOutstanding = reportData.reduce((acc, curr) => acc + (parseFloat(curr.group_outstanding ?? curr.member_outstanding) || 0), 0)
		const formattedAsOnDt = asOnDate ? moment(asOnDate).format("DD/MM/YYYY") : moment().format("DD/MM/YYYY")
		const brnNameCode = `${metadataDtls?.branch_name || "N/A"}${metadataDtls?.branch_code ? ` (${metadataDtls.branch_code})` : ""}`
		const reportTitle = isGroupwise ? "BRANCH GROUPWISE LOAN OUTSTANDING REPORT" : "BRANCH MEMBERWISE LOAN OUTSTANDING REPORT"

		const htmlContent = `
			<!DOCTYPE html>
			<html>
			<head>
				<title>${reportTitle}</title>
				<style>
					@page { size: A4 landscape; margin: 10mm; }
					body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 9.5pt; color: #1e293b; margin: 0; padding: 10px; }
					.header-banner { text-align: center; background: #0f766e; color: #ffffff; padding: 10px; border-radius: 6px; margin-bottom: 10px; }
					.header-banner h1 { margin: 0; font-size: 16pt; font-weight: 800; letter-spacing: 0.5px; }
					.meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px 16px; margin-bottom: 12px; background: #f8fafc; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 9pt; }
					.meta-item { display: flex; justify-content: space-between; }
					.meta-label { font-weight: 700; color: #475569; }
					.meta-val { font-weight: 700; color: #0f172a; }
					table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 8.5pt; }
					th, td { border: 1px solid #cbd5e1; padding: 5px 6px; text-align: left; }
					th { background-color: #0f766e; color: #ffffff; font-weight: 700; text-transform: uppercase; font-size: 8pt; }
					tr:nth-child(even) { background-color: #f8fafc; }
					.text-right { text-align: right; }
					.text-center { text-align: center; }
					.font-bold { font-weight: 700; }
					.total-row { background-color: #f1f5f9; font-weight: 700; font-size: 9pt; border-top: 2px solid #0f766e; border-bottom: 2px double #0f766e; }
				</style>
			</head>
			<body>
				<div class="header-banner">
					<h1>${reportTitle}</h1>
				</div>

				<div class="meta-grid">
					<div class="meta-item"><span class="meta-label">Branch Name:</span> <span class="meta-val">${brnNameCode}</span></div>
					<div class="meta-item"><span class="meta-label">As On Date:</span> <span class="meta-val">${formattedAsOnDt}</span></div>
					<div class="meta-item"><span class="meta-label">Total Records:</span> <span class="meta-val">${reportData.length}</span></div>
				</div>

				<table>
					<thead>
						<tr>
							<th class="text-center">Sl.</th>
							<th>Loan ID</th>
							${!isGroupwise ? '<th>CCB Loan ID</th>' : ''}
							<th>${isGroupwise ? 'Group Code' : 'Member Code'}</th>
							<th>${isGroupwise ? 'Group Name' : 'Member Name'}</th>
							${!isGroupwise ? '<th>Group Name</th>' : ''}
							<th>Branch Name</th>
							<th class="text-center">Period</th>
							<th class="text-right">Curr ROI (%)</th>
							<th class="text-right">Penal ROI (%)</th>
							<th class="text-center">Disb Date</th>
							<th class="text-right">Disb Amount (₹)</th>
							<th class="text-center">Period Mode</th>
							<th class="text-center">Start Date</th>
							<th class="text-center">End Date</th>
							<th class="text-right">${isGroupwise ? 'Group Outstanding (₹)' : 'Member Outstanding (₹)'}</th>
						</tr>
					</thead>
					<tbody>
						${reportData.map((item, idx) => `
							<tr>
								<td class="text-center">${idx + 1}</td>
								<td>${item?.loan_id || ""}</td>
								${!isGroupwise ? `<td>${item?.ccb_loan_id || "N/A"}</td>` : ''}
								<td>${item?.group_code || item?.member_code || ""}</td>
								<td class="font-bold">${item?.group_name || item?.member_name || "N/A"}</td>
								${!isGroupwise ? `<td>${item?.group_name || "N/A"}</td>` : ''}
								<td>${item?.branch_name || "N/A"}</td>
								<td class="text-center">${item?.period || 0}</td>
								<td class="text-right">${Number(item?.curr_roi || 0).toFixed(2)}</td>
								<td class="text-right">${Number(item?.penal_roi || 0).toFixed(2)}</td>
								<td class="text-center">${item?.disb_date ? moment(item.disb_date).format("DD/MM/YYYY") : "N/A"}</td>
								<td class="text-right">${Number(item?.disb_amt || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
								<td class="text-center">${item?.period_mode === "M" ? "Monthly" : (item?.period_mode === "Y" ? "Yearly" : (item?.period_mode || "N/A"))}</td>
								<td class="text-center">${item?.start_date ? moment(item.start_date).format("DD/MM/YYYY") : "N/A"}</td>
								<td class="text-center">${item?.end_date ? moment(item.end_date).format("DD/MM/YYYY") : "N/A"}</td>
								<td class="text-right font-bold" style="color:#0f766e;">${Number(item?.group_outstanding ?? item?.member_outstanding ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
							</tr>
						`).join("")}
					</tbody>
					<tfoot>
						<tr class="total-row">
							<td colSpan="${isGroupwise ? 9 : 11}" class="text-right font-bold">TOTAL SUMMARY:</td>
							<td class="text-right font-bold">${totalDisb.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
							<td colSpan="3"></td>
							<td class="text-right font-bold" style="color:#0f766e;">${totalOutstanding.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
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
									Loan Outstanding Report (Direct)
								</h1>
								<p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
									View groupwise and memberwise direct loan outstanding details for selected branch as on date
								</p>
							</div>
						</div>
					</div>

					{/* Control / Filter Card (Sequence: Select Branch -> Options (Groupwise/Memberwise) -> As on Date -> Search) */}
					<div className="bg-slate-50/90 dark:bg-slate-800/60 p-5 md:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm mb-6">
						<div className="grid grid-cols-1 md:grid-cols-12 items-end gap-4">
							{/* Select Branch (Big section - 5 cols) */}
							<div className="w-full md:col-span-5">
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

							{/* Options (Groupwise / Memberwise - 3 cols) */}
							<div className="w-full md:col-span-3">
								<label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
									Select Option <span className="text-red-500">*</span>
								</label>
								<div className="bg-white dark:bg-slate-800 h-[38px] px-3 py-1 rounded-xl border border-slate-200/60 dark:border-slate-700 shadow-sm flex items-center justify-center">
									<Radiobtn
										data={reportTypeOptions}
										val={reportType}
										className="!mt-0 !mb-0 !shadow-none !p-0 inline-flex items-center gap-4 justify-center"
										onChangeVal={(value) => {
											setReportType(value)
										}}
									/>
								</div>
							</div>

							{/* As on Date (2 cols) */}
							<div className="w-full md:col-span-2">
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

					{/* Column Selector */}
					{reportData.length > 0 && md_columns.length > 0 && (
						<div className="my-4">
							<MultiSelect
								value={selectedColumns}
								onChange={(e) => setSelectedColumns(e.value)}
								options={md_columns}
								optionValue="index"
								optionLabel="header"
								filter
								placeholder="Choose Columns to Display"
								maxSelectedLabels={4}
								className="w-full md:w-80 rounded-xl text-xs"
							/>
						</div>
					)}

					{/* Report Data Table */}
					{reportData.length > 0 && (
						<div className="mt-6 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
							<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
								<div>
									<h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
										<span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
										<span>
											{reportType === "G" ? "Branch Groupwise Loan Outstanding Details" : "Branch Memberwise Loan Outstanding Details"}
										</span>
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
											{reportType === "M" && (
												<th scope="col" className="px-4 py-3 font-bold tracking-wider">CCB Loan ID</th>
											)}
											<th scope="col" className="px-4 py-3 font-bold tracking-wider">
												{reportType === "G" ? "Group Code" : "Member Code"}
											</th>
											<th scope="col" className="px-4 py-3 font-bold tracking-wider">
												{reportType === "G" ? "Group Name" : "Member Name"}
											</th>
											{reportType === "M" && (
												<th scope="col" className="px-4 py-3 font-bold tracking-wider">Group Name</th>
											)}
											<th scope="col" className="px-4 py-3 font-bold tracking-wider text-center">Period</th>
											<th scope="col" className="px-4 py-3 font-bold tracking-wider text-right">Curr ROI (%)</th>
											<th scope="col" className="px-4 py-3 font-bold tracking-wider text-right">Penal ROI (%)</th>
											<th scope="col" className="px-4 py-3 font-bold tracking-wider">Disb Date</th>
											<th scope="col" className="px-4 py-3 font-bold tracking-wider text-right">Disb Amount (₹)</th>
											<th scope="col" className="px-4 py-3 font-bold tracking-wider text-center">Period Mode</th>
											<th scope="col" className="px-4 py-3 font-bold tracking-wider">Start Date</th>
											<th scope="col" className="px-4 py-3 font-bold tracking-wider">End Date</th>
											<th scope="col" className="px-4 py-3 font-bold tracking-wider text-right">
												{reportType === "G" ? "Group Outstanding (₹)" : "Member Outstanding (₹)"}
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-200 dark:divide-slate-800">
										{currentData.map((item, i) => (
											<tr key={i} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
												<td className="px-4 py-3 text-center font-medium text-slate-700 dark:text-slate-300">{indexOfFirstItem + i + 1}</td>
												<td className="px-4 py-3 font-mono text-teal-600 font-medium">{item?.loan_id}</td>
												{reportType === "M" && (
													<td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">{item?.ccb_loan_id || "N/A"}</td>
												)}
												<td className="px-4 py-3 font-mono text-slate-800 dark:text-slate-200">
													{reportType === "G" ? item?.group_code : item?.member_code}
												</td>
												<td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
													{reportType === "G" ? item?.group_name : item?.member_name || "N/A"}
												</td>
												{reportType === "M" && (
													<td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{item?.group_name || "N/A"}</td>
												)}
												<td className="px-4 py-3 text-center">{item?.period || 0}</td>
												<td className="px-4 py-3 text-right">{Number(item?.curr_roi || 0).toFixed(2)}</td>
												<td className="px-4 py-3 text-right">{Number(item?.penal_roi || 0).toFixed(2)}</td>
												<td className="px-4 py-3">{item?.disb_date ? moment(item.disb_date).format("DD/MM/YYYY") : "N/A"}</td>
												<td className="px-4 py-3 text-right font-medium">{Number(item?.disb_amt || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
												<td className="px-4 py-3 text-center">{item?.period_mode === "M" ? "Monthly" : (item?.period_mode === "Y" ? "Yearly" : (item?.period_mode || "N/A"))}</td>
												<td className="px-4 py-3">{item?.start_date ? moment(item.start_date).format("DD/MM/YYYY") : "N/A"}</td>
												<td className="px-4 py-3">{item?.end_date ? moment(item.end_date).format("DD/MM/YYYY") : "N/A"}</td>
												<td className="px-4 py-3 text-right font-bold text-teal-600 dark:text-teal-400">
													{Number(item?.group_outstanding ?? item?.member_outstanding ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
												</td>
											</tr>
										))}
									</tbody>
									<tfoot className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-slate-100 border-t-2 border-slate-300 dark:border-slate-700">
										<tr>
											<td colSpan={reportType === "G" ? 8 : 10} className="px-4 py-3 text-right uppercase tracking-wider">Total Summary:</td>
											<td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">
												{reportData.reduce((sum, item) => sum + Number(item?.disb_amt || 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
											</td>
											<td colSpan={3}></td>
											<td className="px-4 py-3 text-right text-teal-600 dark:text-teal-400">
												{reportData.reduce((sum, item) => sum + Number(item?.group_outstanding ?? item?.member_outstanding ?? 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
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

export default OutstaningReportMain
