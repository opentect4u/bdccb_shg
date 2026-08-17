import React, { useState, useEffect, useMemo } from "react"
import Sidebar from "../../../Components/Sidebar"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import moment from "moment"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"
import { Message } from "../../../Components/Message"
import { url, url_bdccb } from "../../../Address/BaseUrl"
import { getLocalStoreTokenDts } from "../../../Components/getLocalforageTokenDts"
import { Spin, Tag, Modal } from "antd"
import {
	LoadingOutlined,
	UserOutlined,
	SearchOutlined,
	FileExcelOutlined,
	PrinterOutlined,
	TeamOutlined,
	BankOutlined,
	WalletOutlined,
	CheckCircleOutlined,
	CloseCircleOutlined,
	EyeOutlined,
	HistoryOutlined,
} from "@ant-design/icons"
import Radiobtn from "../../../Components/Radiobtn"
import TDInputTemplateBr from "../../../Components/TDInputTemplateBr"

const searchModeOptions = [
	{ label: "CCB", value: "CCB" },
	{ label: "SOCIETY", value: "SOCIETY" },
]

const targetTypeOptions = [
	{ label: "GROUP", value: "GROUP" },
	{ label: "MEMBERS", value: "MEMBERS" },
]

function ShgSavingsBalanceReport() {
	const navigate = useNavigate()
	const rawUser = JSON.parse(localStorage.getItem("user_details"))
	const userDetails = Array.isArray(rawUser) ? rawUser[0] || {} : rawUser || {}

	// Form & Filter States
	const [searchMode, setSearchMode] = useState("CCB") // CCB vs SOCIETY
	const [reportType, setReportType] = useState("GROUP") // GROUP vs MEMBERS

	const [branches, setBranches] = useState([])
	const [selectedBranch, setSelectedBranch] = useState("")

	const [pacsList, setPacsList] = useState([])
	const [selectedPacs, setSelectedPacs] = useState("")
	const [loadingPacs, setLoadingPacs] = useState(false)

	const [shgData, setShgData] = useState([])
	const [loading, setLoading] = useState(false)

	// Live Instant Search Filter Text & Metadata
	const [searchTerm, setSearchTerm] = useState("")
	const [metadataDtls, setMetadataDtls] = useState(null)

	// Pagination States
	const [currentPage, setCurrentPage] = useState(1)
	const [itemsPerPage, setItemsPerPage] = useState(10)

	// Transaction Modal States (Eye Button Per Row)
	const [transModalVisible, setTransModalVisible] = useState(false)
	const [transLoading, setTransLoading] = useState(false)
	const [selectedGroupDtls, setSelectedGroupDtls] = useState(null)
	const [groupTransactions, setGroupTransactions] = useState([])

	// Fetch Branch List on Load
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

	// Fetch PACS / Society list for chosen Branch
	const handleFetchPacsList = async (brCode) => {
		if (!brCode) {
			setPacsList([])
			setSelectedPacs("")
			return
		}

		setLoadingPacs(true)
		setPacsList([])
		setSelectedPacs("")
		const tokenValue = await getLocalStoreTokenDts(navigate)
		const creds = {
			loan_to: "P",
			branch_code: brCode,
			branch_shg_id: "",
			tenant_id: userDetails?.tenant_id || 1,
		}

		try {
			const res = await axios.post(`${url_bdccb}/loan/fetch_pacs_shg_details`, creds, {
				headers: {
					Authorization: `${tokenValue?.token}`,
					"Content-Type": "application/json",
				},
			})

			if (res?.data?.success && Array.isArray(res?.data?.data)) {
				setPacsList(
					res.data.data.map((item) => {
						const pCode = String(item?.branch_id || item?.pacs_id || item?.code || "")
						const pName = item?.branch_name || item?.pacs_name || item?.name || ""
						return {
							code: pCode,
							name: pCode ? `${pName} (${pCode})` : pName,
						}
					})
				)
			}
		} catch (err) {
			console.error("Fetch PACS list error:", err)
		}
		setLoadingPacs(false)
	}

	useEffect(() => {
		handleFetchBranchList()
	}, [])

	const branchOptions = useMemo(() => {
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
			...list,
		]
	}, [branches])

	const handleSearchModeChange = (val) => {
		setSearchMode(val)
		setSelectedBranch("")
		setSelectedPacs("")
		setPacsList([])
		setShgData([])
		setMetadataDtls(null)
		setCurrentPage(1)
		setSearchTerm("")
	}

	const handleReportTypeChange = (val) => {
		setReportType(val)
		setShgData([])
		setMetadataDtls(null)
		setCurrentPage(1)
		setSearchTerm("")
	}

	const handleBranchChange = (e) => {
		const value = e?.target?.value !== undefined ? e.target.value : e
		if (!value || value === "") {
			setSelectedBranch("")
			setPacsList([])
			setSelectedPacs("")
			setShgData([])
			setMetadataDtls(null)
			return
		}

		const selected = branches.find((b) => String(b.code || b.branch_code || b.branch_id || b.branch_assign_id) === String(value))
		const brCode = selected ? (selected.code || selected.branch_code || selected.branch_id || selected.branch_assign_id) : value
		const brName = selected ? (selected.name || selected.branch_name || "") : ""

		setSelectedBranch(`${brCode},${brName}`)
		setSelectedPacs("")
		setShgData([])
		setMetadataDtls(null)

		if (searchMode === "SOCIETY") {
			handleFetchPacsList(brCode)
		}
	}

	const handlePacsChange = (e) => {
		const value = e?.target?.value !== undefined ? e.target.value : e
		setSelectedPacs(value || "")
		setShgData([])
		setMetadataDtls(null)
	}

	// Validation for Fetch button
	const isFetchEnabled = useMemo(() => {
		const hasBranch = Boolean(selectedBranch && selectedBranch.trim() !== "" && selectedBranch.split(",")[0] !== "")
		if (searchMode === "CCB") {
			return hasBranch
		} else if (searchMode === "SOCIETY") {
			const hasPacs = Boolean(selectedPacs && selectedPacs.trim() !== "")
			return hasBranch && hasPacs
		}
		return false
	}, [searchMode, selectedBranch, selectedPacs])

	// Main Fetch Savings Balance API Call
	const handleSearchSavingsBalance = async () => {
		if (!isFetchEnabled) return

		setLoading(true)
		setShgData([])
		setMetadataDtls(null)
		setCurrentPage(1)
		setSearchTerm("")

		const selectedBrnCode = selectedBranch ? selectedBranch.split(",")[0] : ""
		const selectedBrnName = selectedBranch ? selectedBranch.split(",")[1] : ""
		const selectedPacsObj = pacsList.find((p) => String(p.code) === String(selectedPacs))
		const selectedPacsName = selectedPacsObj ? selectedPacsObj.name : ""

		const selectedPacsCode = searchMode === "CCB" ? "111" : selectedPacs

		const creds = {
			search_mode: searchMode,
			branch_code: selectedBrnCode,
			pacs_id: selectedPacsCode,
			group_name_code: searchTerm || "",
			report_type: reportType,
			tenant_id: userDetails?.tenant_id || 1,
		}

		const tokenValue = await getLocalStoreTokenDts(navigate)

		try {
			const res = await axios.post(`${url_bdccb}/memberreport/get_shg_savings_balance_list`, creds, {
				headers: {
					Authorization: `${tokenValue?.token}`,
					"Content-Type": "application/json",
				},
			})

			if (res?.data?.success && Array.isArray(res?.data?.data) && res.data.data.length > 0) {
				const rawList = res.data.data
				let list = rawList.map((item, idx) => ({
					sl_no: idx + 1,
					group_code: item?.group_code || item?.shg_id || "N/A",
					group_name: item?.group_name || "N/A",
					member_code: item?.member_code || "N/A",
					member_name: item?.member_name || "N/A",
					branch_code: item?.branch_code || item?.branch_id || selectedBrnCode,
					branch_name: selectedBrnName,
					pacs_id: item?.pacs_id || selectedPacs,
					pacs_name: selectedPacsName,
					phone1: item?.phone1 || "N/A",
					acc_no: item?.acc_no || item?.member_account_no || item?.shg_acc_no || "N/A",
					ifsc: item?.ifsc || "N/A",
					acc_opening_dt: item?.acc_opening_dt || (item?.created_at ? moment(item.created_at).format("DD/MM/YYYY") : "N/A"),
					balance: Number(item?.balance || 0),
					status: item?.acc_status_flag || item?.group_status || item?.status || "A",
				}))

				setShgData(list)
				setMetadataDtls({
					search_mode: searchMode,
					report_type: reportType,
					branch_code: selectedBrnCode,
					branch_name: selectedBrnName,
					pacs_name: selectedPacsName,
					total_records: list.length,
				})
			} else {
				Message("error", res?.data?.msg || `No ${reportType.toLowerCase()} savings balance data found for selection`)
				setShgData([])
			}
		} catch (err) {
			console.error("Fetch Savings Balance Error:", err)
			Message("error", "Error fetching savings balance report details")
			setShgData([])
		}
		setLoading(false)
	}

	// Fetch Transactions Handler for Eye Button Click per row
	const handleViewGroupTransactions = async (groupItem) => {
		setSelectedGroupDtls(groupItem)
		setTransModalVisible(true)
		setTransLoading(true)
		setGroupTransactions([])

		const tokenValue = await getLocalStoreTokenDts(navigate)
		const creds = {
			shg_id: reportType === "MEMBERS" ? "" : (groupItem?.group_code || ""),
			member_id: reportType === "MEMBERS" ? (groupItem?.member_code || "") : "",
			acc_no: groupItem?.acc_no && groupItem?.acc_no !== "N/A" ? groupItem?.acc_no : "",
		}

		try {
			const res = await axios.post(`${url_bdccb}/memberreport/get_shg_deposit_transactions`, creds, {
				headers: {
					Authorization: `${tokenValue?.token}`,
					"Content-Type": "application/json",
				},
			})

			const respData = res?.data
			const rawList = Array.isArray(respData?.data) ? respData.data : Array.isArray(respData?.msg) ? respData.msg : []

			if (rawList.length > 0) {
				const sortedList = [...rawList].sort((a, b) => {
					const isOpA = String(a.remarks || "").toUpperCase().includes("OPENING")
					const isOpB = String(b.remarks || "").toUpperCase().includes("OPENING")
					if (isOpA && !isOpB) return -1
					if (!isOpA && isOpB) return 1
					return 0
				})
				setGroupTransactions(sortedList)
			} else {
				setGroupTransactions([])
			}
		} catch (err) {
			console.error("Fetch deposit transactions error:", err)
			setGroupTransactions([])
		}
		setTransLoading(false)
	}

	// Filter data by live search text
	const filteredShgData = useMemo(() => {
		if (!searchTerm || !searchTerm.trim()) return shgData
		const q = searchTerm.toLowerCase().trim()
		return shgData.filter((item) => {
			const gCode = String(item?.group_code || "").toLowerCase()
			const gName = String(item?.group_name || "").toLowerCase()
			const mCode = String(item?.member_code || "").toLowerCase()
			const mName = String(item?.member_name || "").toLowerCase()
			const accNo = String(item?.acc_no || "").toLowerCase()
			const bName = String(item?.branch_name || "").toLowerCase()
			const pName = String(item?.pacs_name || "").toLowerCase()

			return (
				gCode.includes(q) ||
				gName.includes(q) ||
				mCode.includes(q) ||
				mName.includes(q) ||
				accNo.includes(q) ||
				bName.includes(q) ||
				pName.includes(q)
			)
		})
	}, [shgData, searchTerm])

	// Pagination calculations
	const totalRecords = filteredShgData.length
	const totalPages = Math.ceil(totalRecords / itemsPerPage) || 1
	const indexOfLastItem = currentPage * itemsPerPage
	const indexOfFirstItem = indexOfLastItem - itemsPerPage
	const currentData = filteredShgData.slice(indexOfFirstItem, indexOfLastItem)

	// Summary Statistics
	const stats = useMemo(() => {
		const total = filteredShgData.length
		const totalBalance = filteredShgData.reduce((sum, item) => sum + (item.balance || 0), 0)
		const pageTotalBalance = currentData.reduce((sum, item) => sum + (item.balance || 0), 0)
		const activeCount = filteredShgData.filter((item) => item.status === "A" || item.status === "1" || item.status === "ACTIVE" || item.status === "O").length
		const inactiveCount = Math.max(0, total - activeCount)

		return { total, totalBalance, pageTotalBalance, activeCount, inactiveCount }
	}, [filteredShgData, currentData])

	// Modal Transaction Totals
	const modalTransTotals = useMemo(() => {
		if (!groupTransactions || groupTransactions.length === 0) {
			return { totalDr: 0, totalCr: 0, latestBalance: 0 }
		}
		const totalDr = groupTransactions.reduce((sum, item) => sum + Number(item.dr_amt || 0), 0)
		const totalCr = groupTransactions.reduce((sum, item) => sum + Number(item.cr_amt || 0), 0)
		const latestBalance = Number(groupTransactions[groupTransactions.length - 1]?.balance || selectedGroupDtls?.balance || 0)
		return { totalDr, totalCr, latestBalance }
	}, [groupTransactions, selectedGroupDtls])

	// Styled Excel Export Handler (Main Table)
	const handleExcelExport = async () => {
		if (!filteredShgData || filteredShgData.length === 0) return

		const isMembers = reportType === "MEMBERS"
		const maxColLetter = isMembers ? "H" : "F"
		const lastColIdx = isMembers ? 8 : 6

		const workbook = new ExcelJS.Workbook()
		const worksheet = workbook.addWorksheet("Savings Balance Report")

		// Main Title Row
		worksheet.mergeCells(`A1:${maxColLetter}1`)
		const titleCell = worksheet.getCell("A1")
		titleCell.value = `BDCCB - ${reportType} SAVINGS BALANCE REPORT`
		titleCell.font = { name: "Calibri", size: 14, bold: true, color: { argb: "FFFFFFFF" } }
		titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } }
		titleCell.alignment = { horizontal: "center", vertical: "middle" }

		// Metadata Subtitle Row
		worksheet.mergeCells(`A2:${maxColLetter}2`)
		const metaCell = worksheet.getCell("A2")
		metaCell.value = `Mode: ${searchMode}   |   Type: ${reportType}   |   Branch: ${metadataDtls?.branch_name || "N/A"}   |   PACS/Society: ${metadataDtls?.pacs_name || "N/A"}   |   Total: ${filteredShgData.length}   |   Date: ${moment().format("DD/MM/YYYY HH:mm")}`
		metaCell.font = { name: "Calibri", size: 10, italic: true, color: { argb: "FF334155" } }
		metaCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } }
		metaCell.alignment = { horizontal: "center", vertical: "middle" }

		worksheet.addRow([])

		// Table Headers
		const headers = isMembers
			? ["Sl. No.", "Member Code", "Member Name", "Group Code", "Group Name", "Member Savings A/C", "IFSC Code", "Savings Balance (₹)"]
			: ["Sl. No.", "Group Code", "Group Name", "Savings A/C No.", "Opening Date", "Savings Balance (₹)"]

		const headerRow = worksheet.addRow(headers)
		headerRow.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } }
		headerRow.eachCell((cell) => {
			cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } }
			cell.alignment = { horizontal: "center", vertical: "middle" }
		})

		// Data Rows
		filteredShgData.forEach((item, index) => {
			if (isMembers) {
				const rowData = [
					index + 1,
					String(item?.member_code || "N/A"),
					String(item?.member_name || "N/A"),
					String(item?.group_code || "N/A"),
					String(item?.group_name || "N/A"),
					String(item?.acc_no || "N/A"),
					String(item?.ifsc || "N/A"),
					Number(item?.balance || 0),
				]
				const addedRow = worksheet.addRow(rowData)
				addedRow.getCell(1).alignment = { horizontal: "center" }
				addedRow.getCell(2).alignment = { horizontal: "center" }
				addedRow.getCell(4).alignment = { horizontal: "center" }
				addedRow.getCell(6).alignment = { horizontal: "center" }
				addedRow.getCell(7).alignment = { horizontal: "center" }
				addedRow.getCell(8).alignment = { horizontal: "center" }
				addedRow.getCell(8).numFmt = "₹#,##0.00"
			} else {
				const rowData = [
					index + 1,
					String(item?.group_code || "N/A"),
					String(item?.group_name || "N/A"),
					String(item?.acc_no || "N/A"),
					String(item?.acc_opening_dt || "N/A"),
					Number(item?.balance || 0),
				]
				const addedRow = worksheet.addRow(rowData)
				addedRow.getCell(1).alignment = { horizontal: "center" }
				addedRow.getCell(2).alignment = { horizontal: "center" }
				addedRow.getCell(4).alignment = { horizontal: "center" }
				addedRow.getCell(5).alignment = { horizontal: "center" }
				addedRow.getCell(6).alignment = { horizontal: "center" }
				addedRow.getCell(6).numFmt = "₹#,##0.00"
			}
		})

		// Total Row
		const totalRowArr = isMembers
			? ["Total Savings Balance", "", "", "", "", "", "", Number(stats.totalBalance || 0)]
			: ["Total Savings Balance", "", "", "", "", Number(stats.totalBalance || 0)]

		const totalRow = worksheet.addRow(totalRowArr)
		totalRow.font = { name: "Calibri", size: 11, bold: true }
		totalRow.getCell(lastColIdx).numFmt = "₹#,##0.00"
		totalRow.getCell(lastColIdx).alignment = { horizontal: "center" }

		worksheet.columns.forEach((col) => { col.width = 22 })

		const buffer = await workbook.xlsx.writeBuffer()
		const fileName = `Savings_Balance_Report_${reportType}_${searchMode}_${moment().format("YYYYMMDD_HHmmss")}.xlsx`
		saveAs(new Blob([buffer]), fileName)
	}

	// Print View Handler (Main Table)
	const handlePrintReport = () => {
		if (!filteredShgData || filteredShgData.length === 0) return

		const isMembers = reportType === "MEMBERS"
		const printWindow = window.open("", "_blank")

		const tableHeaderHtml = isMembers
			? `<tr>
				<th>Sl. No.</th>
				<th>Member Code</th>
				<th>Member Name</th>
				<th>Group Code</th>
				<th>Group Name</th>
				<th>Savings A/C No.</th>
				<th>IFSC Code</th>
				<th style="text-align: center;">Savings Balance (₹)</th>
			</tr>`
			: `<tr>
				<th>Sl. No.</th>
				<th>Group Code</th>
				<th>Group Name</th>
				<th>Savings A/C No.</th>
				<th>Opening Date</th>
				<th style="text-align: center;">Savings Balance (₹)</th>
			</tr>`

		const tableRowsHtml = filteredShgData
			.map((item, index) => isMembers
				? `<tr>
					<td style="text-align: center;">${index + 1}</td>
					<td style="font-family: monospace; font-weight: bold; color: #0f766e;">${item?.member_code || "N/A"}</td>
					<td style="font-weight: 600;">${item?.member_name || "N/A"}</td>
					<td style="font-family: monospace; font-weight: bold;">${item?.group_code || "N/A"}</td>
					<td style="font-weight: 600;">${item?.group_name || "N/A"}</td>
					<td style="text-align: center; font-family: monospace;">${item?.acc_no || "N/A"}</td>
					<td style="text-align: center; font-family: monospace;">${item?.ifsc || "N/A"}</td>
					<td style="text-align: center; font-weight: bold; font-family: monospace;">₹${Number(item?.balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
				</tr>`
				: `<tr>
					<td style="text-align: center;">${index + 1}</td>
					<td style="font-family: monospace; font-weight: bold; color: #0f766e;">${item?.group_code || "N/A"}</td>
					<td style="font-weight: 600;">${item?.group_name || "N/A"}</td>
					<td style="text-align: center; font-family: monospace;">${item?.acc_no || "N/A"}</td>
					<td style="text-align: center; font-family: monospace;">${item?.acc_opening_dt || "N/A"}</td>
					<td style="text-align: center; font-weight: bold; font-family: monospace;">₹${Number(item?.balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
				</tr>`
			).join("")

		const htmlContent = `
			<!DOCTYPE html>
			<html>
			<head>
				<title>${reportType} Savings Balance Report - BDCCB</title>
				<style>
					@page { size: landscape; margin: 10mm; }
					body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 15px; color: #1e293b; }
					.header { text-align: center; border-bottom: 2px solid #0f766e; padding-bottom: 12px; margin-bottom: 15px; }
					.header h2 { margin: 0; color: #0f766e; font-size: 22px; text-transform: uppercase; letter-spacing: 0.5px; }
					.header p { margin: 4px 0 0 0; color: #64748b; font-size: 12px; }
					.meta-box { display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 14px; border-radius: 8px; font-size: 11px; margin-bottom: 15px; }
					table { width: 100%; border-collapse: collapse; font-size: 11px; }
					th { background: #1e293b; color: #ffffff; padding: 8px 10px; text-align: left; text-transform: uppercase; font-size: 10px; }
					td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
					tr:nth-child(even) { background-color: #f8fafc; }
					.total-row { font-weight: bold; background: #f1f5f9 !important; border-top: 2px solid #0f766e; }
					.footer { margin-top: 20px; font-size: 10px; color: #94a3b8; text-align: right; }
				</style>
			</head>
			<body>
				<div class="header">
					<h2>BDCCB - ${reportType} Savings Balance Report</h2>
					<p>Co-operative Bank ${reportType} Savings Account Balance Directory</p>
				</div>
				<div class="meta-box">
					<span><strong>Search Mode:</strong> ${searchMode}</span>
					<span><strong>Report Type:</strong> ${reportType}</span>
					<span><strong>Branch:</strong> ${metadataDtls?.branch_name || "N/A"}</span>
					<span><strong>PACS/Society:</strong> ${metadataDtls?.pacs_name || "N/A"}</span>
					<span><strong>Total Records:</strong> ${filteredShgData.length}</span>
					<span><strong>Generated On:</strong> ${moment().format("DD/MM/YYYY HH:mm")}</span>
				</div>
				<table>
					<thead>${tableHeaderHtml}</thead>
					<tbody>
						${tableRowsHtml}
						<tr class="total-row">
							<td colspan="${isMembers ? 7 : 5}" style="text-align: right; text-transform: uppercase;">Total Savings Balance:</td>
							<td style="text-align: center; color: #0f766e; font-family: monospace; font-size: 12px; font-weight: bold;">₹${stats.totalBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
						</tr>
					</tbody>
				</table>
				<div class="footer">Report generated automatically from BDCCB SHG Portal</div>
				<script>
					window.onload = function() {
						window.print();
						setTimeout(function() {
							window.close();
						}, 500);
					};
					window.onafterprint = function() {
						window.close();
					};
				</script>
			</body>
			</html>
		`

		printWindow.document.write(htmlContent)
		printWindow.document.close()
	}

	// Export Modal Group Transactions to Excel
	const handleExportGroupTransactionsExcel = async () => {
		if (!groupTransactions || groupTransactions.length === 0) return

		const workbook = new ExcelJS.Workbook()
		const worksheet = workbook.addWorksheet("Group Transactions")

		worksheet.mergeCells("A1:H1")
		const titleCell = worksheet.getCell("A1")
		titleCell.value = `DEPOSIT TRANSACTIONS - ${selectedGroupDtls?.group_name} (${selectedGroupDtls?.group_code})`
		titleCell.font = { name: "Calibri", size: 13, bold: true, color: { argb: "FFFFFFFF" } }
		titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } }
		titleCell.alignment = { horizontal: "center", vertical: "middle" }

		worksheet.mergeCells("A2:H2")
		const metaCell = worksheet.getCell("A2")
		metaCell.value = `Savings A/C No: ${selectedGroupDtls?.acc_no || "N/A"}   |   Current Balance: ₹${selectedGroupDtls?.balance || 0}   |   Exported On: ${moment().format("DD/MM/YYYY HH:mm")}`
		metaCell.font = { name: "Calibri", size: 10, italic: true }
		metaCell.alignment = { horizontal: "center" }

		worksheet.addRow([])

		const headers = ["Sl. No.", "Trans No.", "Trans Date", "Type", "Debit (DR ₹)", "Credit (CR ₹)", "Balance (₹)", "Remarks"]
		const headerRow = worksheet.addRow(headers)
		headerRow.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } }
		headerRow.eachCell((cell) => {
			cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } }
			cell.alignment = { horizontal: "center" }
		})

		groupTransactions.forEach((item, index) => {
			const isDeposit = String(item.dep_with_flag).toUpperCase() === "D"
			const typeText = isDeposit ? "Deposit" : "Withdrawal"
			const rowData = [
				index + 1,
				item.trans_no || "N/A",
				item.trans_dt || "N/A",
				typeText,
				Number(item.dr_amt || 0),
				Number(item.cr_amt || 0),
				Number(item.balance || 0),
				item.remarks || "N/A",
			]
			const addedRow = worksheet.addRow(rowData)
			addedRow.getCell(1).alignment = { horizontal: "center" }
			addedRow.getCell(2).alignment = { horizontal: "center" }
			addedRow.getCell(3).alignment = { horizontal: "center" }
			addedRow.getCell(4).alignment = { horizontal: "center" }
			addedRow.getCell(5).numFmt = "₹#,##0.00"
			addedRow.getCell(6).numFmt = "₹#,##0.00"
			addedRow.getCell(7).numFmt = "₹#,##0.00"
		})

		// Total Summary Row
		const totalDr = groupTransactions.reduce((sum, item) => sum + Number(item.dr_amt || 0), 0)
		const totalCr = groupTransactions.reduce((sum, item) => sum + Number(item.cr_amt || 0), 0)
		const latestBalance = Number(groupTransactions[groupTransactions.length - 1]?.balance || selectedGroupDtls?.balance || 0)

		const totalRowArr = ["Total Summary", "", "", "", totalDr, totalCr, latestBalance, ""]
		const totalRow = worksheet.addRow(totalRowArr)
		totalRow.font = { name: "Calibri", size: 11, bold: true }
		totalRow.getCell(1).alignment = { horizontal: "left" }
		totalRow.getCell(5).numFmt = "₹#,##0.00"
		totalRow.getCell(5).font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFDC2626" } }
		totalRow.getCell(6).numFmt = "₹#,##0.00"
		totalRow.getCell(6).font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF047857" } }
		totalRow.getCell(7).numFmt = "₹#,##0.00"
		totalRow.getCell(7).font = { name: "Calibri", size: 11, bold: true }

		worksheet.columns.forEach((col) => { col.width = 18 })

		const buffer = await workbook.xlsx.writeBuffer()
		const fileName = `Group_Transactions_${selectedGroupDtls?.group_code}_${moment().format("YYYYMMDD_HHmmss")}.xlsx`
		saveAs(new Blob([buffer]), fileName)
	}

	// Print Modal Group / Member Transactions
	const handlePrintGroupTransactions = () => {
		if (!groupTransactions || groupTransactions.length === 0) return

		const printWindow = window.open("", "_blank")

		const isMembers = reportType === "MEMBERS"
		const totalDr = groupTransactions.reduce((sum, item) => sum + Number(item.dr_amt || 0), 0)
		const totalCr = groupTransactions.reduce((sum, item) => sum + Number(item.cr_amt || 0), 0)
		const latestBalance = Number(groupTransactions[groupTransactions.length - 1]?.balance || selectedGroupDtls?.balance || 0)

		const tableRowsHtml = groupTransactions
			.map((item, index) => {
				const isDeposit = String(item.dep_with_flag).toUpperCase() === "D"
				return `
				<tr>
					<td style="text-align: center; font-weight: 700;">${index + 1}</td>
					<td style="text-align: center; font-family: monospace; font-weight: 700;">${item.trans_no || "N/A"}</td>
					<td style="text-align: center; font-family: monospace;">${item.trans_dt || "N/A"}</td>
					<td style="text-align: center;">
						<span class="${isDeposit ? "badge-deposit" : "badge-withdrawal"}">
							${isDeposit ? "Deposit" : "Withdrawal"}
						</span>
					</td>
					<td style="text-align: right; font-family: monospace; color: #dc2626; font-weight: 700;">₹${Number(item.dr_amt || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
					<td style="text-align: right; font-family: monospace; color: #047857; font-weight: 700;">₹${Number(item.cr_amt || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
					<td style="text-align: right; font-family: monospace; font-weight: 800; color: #0f172a;">₹${Number(item.balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
					<td style="font-size: 10px; color: #334155;">${item.remarks || "N/A"}</td>
				</tr>
			`
			})
			.join("")

		const htmlContent = `
			<!DOCTYPE html>
			<html>
			<head>
				<title>${isMembers ? "Member" : "Group"} Statement - ${isMembers ? selectedGroupDtls?.member_name : selectedGroupDtls?.group_name}</title>
				<style>
					@page { size: A4 portrait; margin: 10mm; }
					body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 15px; font-size: 11px; background: #ffffff; }
					
					.bank-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px double #0f766e; padding-bottom: 10px; margin-bottom: 14px; }
					.bank-name { font-size: 17px; font-weight: 800; color: #0f766e; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
					.bank-sub { font-size: 11px; color: #475569; margin: 2px 0 0 0; font-weight: 600; }
					.statement-badge { background: #0f766e; color: #ffffff; font-weight: 800; font-size: 10px; padding: 6px 12px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.8px; }

					.meta-card-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
					.meta-card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 12px; }
					.meta-card.highlight { background: #ecfdf5; border-color: #a7f3d0; }
					.meta-label { font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 800; display: block; margin-bottom: 2px; }
					.meta-val-primary { font-size: 12px; font-weight: 800; color: #0f172a; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
					.meta-val-sub { font-size: 10px; color: #0f766e; font-weight: 700; display: block; margin-top: 1px; }
					.meta-val-amount { font-size: 14px; font-weight: 900; color: #047857; font-family: monospace; display: block; }

					table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11px; }
					th { background: #1e293b; color: #ffffff; font-weight: 800; text-transform: uppercase; font-size: 10px; padding: 8px 10px; border: 1px solid #1e293b; }
					td { padding: 7px 10px; border: 1px solid #e2e8f0; vertical-align: middle; }
					tr:nth-child(even) { background-color: #f8fafc; }
					.mono { font-family: monospace; }
					.text-center { text-align: center; }
					.text-right { text-align: right; }
					.bold { font-weight: 800; }

					.badge-deposit { display: inline-block; padding: 2px 8px; background: #047857; color: #ffffff; font-weight: 800; font-size: 9px; border-radius: 4px; text-transform: uppercase; }
					.badge-withdrawal { display: inline-block; padding: 2px 8px; background: #b91c1c; color: #ffffff; font-weight: 800; font-size: 9px; border-radius: 4px; text-transform: uppercase; }

					.table-summary-foot tr { background: #f1f5f9; border-top: 2px solid #0f766e; }
					.table-summary-foot td { padding: 8px 10px; font-weight: 800; }

					.print-sign-footer { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 10px; }
					.sign-box { width: 30%; }
					.sign-line { border-bottom: 1px dashed #94a3b8; height: 35px; margin-bottom: 6px; }
					.sign-title { font-size: 10px; font-weight: 800; color: #334155; text-transform: uppercase; margin: 0; }
					.bank-disclaimer { margin-top: 20px; text-align: center; font-size: 9px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
				</style>
			</head>
			<body>
				<div class="bank-header">
					<div>
						<h1 class="bank-name">BANKURA DISTRICT CENTRAL CO-OPERATIVE BANK LTD.</h1>
						<p class="bank-sub">Head Office: Bankura | SHG Savings Account Statement</p>
					</div>
					<div class="statement-badge">${isMembers ? "MEMBER SAVINGS STATEMENT" : "GROUP SAVINGS STATEMENT"}</div>
				</div>

				<div class="meta-card-grid">
					<div class="meta-card">
						<span class="meta-label">${isMembers ? "Member Name & Code" : "Group Name & Code"}</span>
						<span class="meta-val-primary">${isMembers ? selectedGroupDtls?.member_name : selectedGroupDtls?.group_name}</span>
						<span class="meta-val-sub">Code: ${isMembers ? selectedGroupDtls?.member_code : selectedGroupDtls?.group_code}</span>
					</div>
					<div class="meta-card">
						<span class="meta-label">Savings Account No.</span>
						<span class="meta-val-primary mono">${selectedGroupDtls?.acc_no || "N/A"}</span>
						<span class="meta-val-sub">IFSC: ${selectedGroupDtls?.ifsc || "N/A"}</span>
					</div>
					<div class="meta-card">
						<span class="meta-label">Branch & Society</span>
						<span class="meta-val-primary">${metadataDtls?.branch_name || "N/A"}</span>
						<span class="meta-val-sub">${metadataDtls?.pacs_name || "N/A"}</span>
					</div>
					<div class="meta-card highlight">
						<span class="meta-label">Closing Balance</span>
						<span class="meta-val-amount">₹${latestBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
						<span class="meta-val-sub">Total Txns: ${groupTransactions.length}</span>
					</div>
				</div>

				<table>
					<thead>
						<tr>
							<th style="width: 50px; text-align: center;">Sl No</th>
							<th style="width: 90px; text-align: center;">Trans No</th>
							<th style="width: 120px; text-align: center;">Trans Date</th>
							<th style="width: 100px; text-align: center;">Type</th>
							<th style="text-align: right;">Debit (DR ₹)</th>
							<th style="text-align: right;">Credit (CR ₹)</th>
							<th style="text-align: right;">Balance (₹)</th>
							<th>Remarks</th>
						</tr>
					</thead>
					<tbody>
						${tableRowsHtml}
					</tbody>
					<tfoot class="table-summary-foot">
						<tr>
							<td colSpan="4" class="text-right bold">Total Summary:</td>
							<td class="text-right mono" style="color: #dc2626;">₹${totalDr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
							<td class="text-right mono" style="color: #047857;">₹${totalCr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
							<td class="text-right mono" style="color: #0f172a; font-weight: 900;">₹${latestBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
							<td></td>
						</tr>
					</tfoot>
				</table>

				<script>
					window.onload = function() {
						window.print();
						setTimeout(function() {
							window.close();
						}, 500);
					};
					window.onafterprint = function() {
						window.close();
					};
				</script>
			</body>
			</html>
		`

		printWindow.document.write(htmlContent)
		printWindow.document.close()
	}

	return (
		<div>
			<Sidebar mode={2} />
			<Spin indicator={<LoadingOutlined spin />} size="large" spinning={loading}>
				<main className="w-[95%] max-w-[1450px] mx-auto my-6 p-6 md:p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 transition-all duration-300">
					{/* Header Banner */}
					<div className="flex flex-col md:flex-row md:items-center justify-between pb-5 mb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
						<div className="flex items-center gap-4">
							<div className="p-3.5 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl text-white shadow-lg shadow-teal-500/20">
								<WalletOutlined className="text-3xl" />
							</div>
							<div>
								<h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
									SHG Savings Balance Report
								</h1>
								<p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
									View and export SHG Group and Member savings account balance details for CCB & Society networks
								</p>
							</div>
						</div>
					</div>

					{/* Filter Card */}
					<div className="bg-slate-50/90 dark:bg-slate-800/60 p-5 md:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm mb-6">
						<div className="grid grid-cols-1 md:grid-cols-12 items-end gap-5">
							{/* Row 1: Search By Mode (3 Cols) */}
							<div className="w-full md:col-span-3">
								<label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
									Search By Mode <span className="text-red-500">*</span>
								</label>
								<div className="h-[40px] flex items-center justify-center px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs">
									<Radiobtn
										data={searchModeOptions}
										val={searchMode}
										className="!mt-0 !mb-0 !shadow-none !p-0 inline-flex items-center gap-4 justify-center text-xs font-semibold"
										onChangeVal={(val) => handleSearchModeChange(val)}
									/>
								</div>
							</div>

							{/* Row 1: Search By Target/Type (3 Cols) */}
							<div className="w-full md:col-span-3">
								<label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
									Search By Type <span className="text-red-500">*</span>
								</label>
								<div className="h-[40px] flex items-center justify-center px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs">
									<Radiobtn
										data={targetTypeOptions}
										val={reportType}
										className="!mt-0 !mb-0 !shadow-none !p-0 inline-flex items-center gap-4 justify-center text-xs font-semibold"
										onChangeVal={(val) => handleReportTypeChange(val)}
									/>
								</div>
							</div>

							{/* Row 1: Select Branch (6 Cols - Spacious) */}
							<div className="w-full md:col-span-6">
								<label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
									Select Branch <span className="text-red-500">*</span>
								</label>
								<TDInputTemplateBr
									placeholder="Select Branch..."
									type="text"
									label=""
									name="branch"
									formControlName={selectedBranch && selectedBranch !== "undefined" ? selectedBranch.split(",")[0] : ""}
									handleChange={handleBranchChange}
									mode={2}
									data={branchOptions}
								/>
							</div>

							{/* Row 2: Select PACS / Society (Full 12 Cols Width in SOCIETY mode) */}
							{searchMode === "SOCIETY" && (
								<div className="w-full md:col-span-12 mt-1">
									<label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
										Select Society / PACS <span className="text-red-500">*</span>
									</label>
									<Spin spinning={loadingPacs} indicator={<LoadingOutlined style={{ fontSize: 14 }} spin />}>
										<TDInputTemplateBr
											placeholder="Choose Society..."
											type="text"
											label=""
											name="selectedPacs"
											formControlName={selectedPacs}
											handleChange={handlePacsChange}
											mode={2}
											disabled={!selectedBranch}
											data={[{ code: "", name: "Select Society" }, ...pacsList]}
										/>
									</Spin>
								</div>
							)}
						</div>

						{/* Dedicated Centered Row for Fetch Balance Button */}
						<div className="w-full flex items-center justify-center mt-5 pt-4 border-t border-slate-200/70 dark:border-slate-700/60">
							<button
								disabled={!isFetchEnabled}
								className={`h-[40px] px-8 inline-flex items-center justify-center text-xs font-bold text-white rounded-xl transition-all duration-200 shadow-md gap-2 min-w-[200px] ${isFetchEnabled
										? "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 border border-teal-600 cursor-pointer active:scale-95 shadow-teal-500/20"
										: "bg-slate-300 dark:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-400 cursor-not-allowed opacity-60 active:scale-100"
									}`}
								onClick={handleSearchSavingsBalance}
							>
								<SearchOutlined className="text-sm" />
								<span>Fetch Balance</span>
							</button>
						</div>
					</div>

					{/* Summary Statistics Cards */}
					{shgData.length > 0 && (
						<div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
							<div className="p-4 bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800/60 rounded-2xl flex items-center gap-3">
								<div className="p-2.5 bg-teal-600 text-white rounded-xl">
									{reportType === "MEMBERS" ? <UserOutlined className="text-xl" /> : <TeamOutlined className="text-xl" />}
								</div>
								<div>
									<p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Total {reportType}</p>
									<h4 className="text-xl font-extrabold text-teal-700 dark:text-teal-400">{stats.total}</h4>
								</div>
							</div>

							<div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl flex items-center gap-3">
								<div className="p-2.5 bg-emerald-600 text-white rounded-xl">
									<WalletOutlined className="text-xl" />
								</div>
								<div>
									<p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Total Savings Balance</p>
									<h4 className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400">
										₹{stats.totalBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
									</h4>
								</div>
							</div>

							<div className="p-4 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/60 rounded-2xl flex items-center gap-3">
								<div className="p-2.5 bg-purple-600 text-white rounded-xl">
									<CheckCircleOutlined className="text-xl" />
								</div>
								<div>
									<p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Active Accounts</p>
									<h4 className="text-xl font-extrabold text-purple-700 dark:text-purple-400">{stats.activeCount}</h4>
								</div>
							</div>

							<div className="p-4 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/60 rounded-2xl flex items-center gap-3">
								<div className="p-2.5 bg-rose-600 text-white rounded-xl">
									<CloseCircleOutlined className="text-xl" />
								</div>
								<div>
									<p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Inactive Account</p>
									<h4 className="text-xl font-extrabold text-rose-700 dark:text-rose-400">
										{stats.inactiveCount}
									</h4>
								</div>
							</div>
						</div>
					)}

					{/* Results Table Section */}
					{shgData.length !== 0 && (
						<div className="bg-slate-50/50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
								<div>
									<h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
										<span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
										<span>Savings Balance Directory ({searchMode} - {reportType})</span>
									</h3>
									<p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
										{filteredShgData.length} Record(s) Found {metadataDtls?.branch_name ? `for Branch: ${metadataDtls.branch_name}` : ""} {metadataDtls?.pacs_name ? `(${metadataDtls.pacs_name})` : ""}
									</p>
								</div>

								{/* Instant Search Bar */}
								<div className="relative w-full sm:w-80">
									<input
										type="text"
										placeholder="Search by code, name, A/C no..."
										value={searchTerm}
										onChange={(e) => {
											setSearchTerm(e.target.value)
											setCurrentPage(1)
										}}
										className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 shadow-xs text-slate-800 dark:text-slate-200"
									/>
									<SearchOutlined className="absolute left-3 top-3 text-slate-400 text-xs" />
									{searchTerm && (
										<button
											onClick={() => setSearchTerm("")}
											className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold cursor-pointer"
										>
											✕
										</button>
									)}
								</div>
							</div>

							{/* Table Container */}
							<div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm max-h-[580px]">
								<table className="w-full text-sm text-left text-slate-700 dark:text-slate-200">
									<thead className="text-xs uppercase bg-slate-800 text-slate-100 dark:bg-slate-900 sticky top-0 z-10">
										{reportType === "MEMBERS" ? (
											<tr>
												<th scope="col" className="px-4 py-3.5 font-extrabold tracking-wider text-center">Sl. No.</th>
												<th scope="col" className="px-4 py-3.5 font-extrabold tracking-wider">Member Code</th>
												<th scope="col" className="px-4 py-3.5 font-extrabold tracking-wider">Member Name</th>
												<th scope="col" className="px-4 py-3.5 font-black tracking-wider">Group Code</th>
												<th scope="col" className="px-4 py-3.5 font-extrabold tracking-wider">Group Name</th>
												<th scope="col" className="px-4 py-3.5 font-extrabold tracking-wider text-center">Member Savings A/C</th>
												<th scope="col" className="px-4 py-3.5 font-extrabold tracking-wider text-center">IFSC Code</th>
												<th scope="col" className="px-4 py-3.5 font-extrabold tracking-wider text-center">Savings Balance (₹)</th>
												<th scope="col" className="px-4 py-3.5 font-extrabold tracking-wider text-center">Action</th>
											</tr>
										) : (
											<tr>
												<th scope="col" className="px-4 py-3.5 font-extrabold tracking-wider text-center">Sl. No.</th>
												<th scope="col" className="px-4 py-3.5 font-black tracking-wider">Group Code</th>
												<th scope="col" className="px-4 py-3.5 font-extrabold tracking-wider">Group Name</th>
												<th scope="col" className="px-4 py-3.5 font-extrabold tracking-wider text-center">Savings A/C No.</th>
												<th scope="col" className="px-4 py-3.5 font-extrabold tracking-wider text-center">Opening Date</th>
												<th scope="col" className="px-4 py-3.5 font-extrabold tracking-wider text-center">Savings Balance (₹)</th>
												<th scope="col" className="px-4 py-3.5 font-extrabold tracking-wider text-center">Action</th>
											</tr>
										)}
									</thead>
									<tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
										{currentData.map((item, i) => (
											<tr key={i} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
												<td className="px-4 py-3.5 text-center font-bold text-slate-700 dark:text-slate-300">{indexOfFirstItem + i + 1}</td>

												{reportType === "MEMBERS" ? (
													<>
														<td className="px-4 py-3.5 font-mono text-sm font-bold text-teal-600 whitespace-nowrap">{item?.member_code || "N/A"}</td>
														<td className="px-4 py-3.5 font-extrabold text-slate-900 dark:text-slate-100 whitespace-nowrap">{item?.member_name || "N/A"}</td>
														<td className="px-4 py-3.5 font-mono text-sm font-bold text-teal-600 whitespace-nowrap">{item?.group_code || "N/A"}</td>
														<td className="px-4 py-3.5 font-normal text-slate-800 dark:text-slate-200 whitespace-nowrap">{item?.group_name || "N/A"}</td>
														<td className="px-4 py-3.5 text-center font-mono text-sm whitespace-nowrap text-slate-800 dark:text-slate-200 font-bold">{item?.acc_no || "N/A"}</td>
														<td className="px-4 py-3.5 text-center font-mono text-xs whitespace-nowrap text-slate-600 dark:text-slate-400 font-bold">{item?.ifsc || "N/A"}</td>
														<td className="px-4 py-3.5 text-center font-mono text-base font-extrabold text-teal-700 dark:text-teal-400 whitespace-nowrap">
															₹{Number(item?.balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
														</td>
														<td className="px-4 py-3.5 text-center whitespace-nowrap">
															<button
																onClick={() => handleViewGroupTransactions(item)}
																title="View Transactions"
																className="p-2 bg-teal-50 hover:bg-teal-100 text-teal-600 dark:bg-teal-950 dark:hover:bg-teal-900 dark:text-teal-300 rounded-xl transition-colors border border-teal-200 dark:border-teal-800 cursor-pointer shadow-xs"
															>
																<EyeOutlined className="text-lg" />
															</button>
														</td>
													</>
												) : (
													<>
														<td className="px-4 py-3.5 font-mono text-sm font-bold text-teal-600 whitespace-nowrap">{item?.group_code || "N/A"}</td>
														<td className="px-4 py-3.5 font-normal text-slate-800 dark:text-slate-200 whitespace-nowrap">{item?.group_name || "N/A"}</td>
														<td className="px-4 py-3.5 text-center font-mono text-sm whitespace-nowrap text-slate-800 dark:text-slate-200 font-bold">{item?.acc_no || "N/A"}</td>
														<td className="px-4 py-3.5 text-center font-mono text-xs whitespace-nowrap text-slate-600 dark:text-slate-400 font-bold">{item?.acc_opening_dt || "N/A"}</td>
														<td className="px-4 py-3.5 text-center font-mono text-base font-extrabold text-teal-700 dark:text-teal-400 whitespace-nowrap">
															₹{Number(item?.balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
														</td>
														<td className="px-4 py-3.5 text-center whitespace-nowrap">
															<button
																onClick={() => handleViewGroupTransactions(item)}
																title="View Transactions"
																className="p-2 bg-teal-50 hover:bg-teal-100 text-teal-600 dark:bg-teal-950 dark:hover:bg-teal-900 dark:text-teal-300 rounded-xl transition-colors border border-teal-200 dark:border-teal-800 cursor-pointer shadow-xs"
															>
																<EyeOutlined className="text-lg" />
															</button>
														</td>
													</>
												)}
											</tr>
										))}
									</tbody>
									<tfoot className="bg-slate-100 dark:bg-slate-800 font-extrabold text-xs sm:text-sm sticky bottom-0 z-10 border-t-2 border-teal-600 shadow-md divide-y divide-slate-200 dark:divide-slate-700">
										<tr className="bg-teal-50/90 dark:bg-slate-800">
											<td colSpan={reportType === "MEMBERS" ? 7 : 5} className="px-4 py-2.5 text-right font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
												Page Total Savings Balance (Page {currentPage}):
											</td>
											<td className="px-4 py-2.5 text-center font-mono text-sm sm:text-base font-extrabold text-teal-700 dark:text-teal-300 whitespace-nowrap">
												₹{stats.pageTotalBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
											</td>
											<td className="px-4 py-2.5"></td>
										</tr>
										<tr className="bg-emerald-100/80 dark:bg-slate-900">
											<td colSpan={reportType === "MEMBERS" ? 7 : 5} className="px-4 py-2.5 text-right font-extrabold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
												Grand Total Savings Balance (All {filteredShgData.length} Records):
											</td>
											<td className="px-4 py-2.5 text-center font-mono text-sm sm:text-base font-extrabold text-emerald-800 dark:text-emerald-300 whitespace-nowrap">
												₹{stats.totalBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
											</td>
											<td className="px-4 py-2.5"></td>
										</tr>
									</tfoot>
								</table>
							</div>

							{/* Bottom Action Footer Bar: Pagination & Export Buttons */}
							{filteredShgData.length > 0 && (
								<div className="flex flex-col lg:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800 mt-4">
									{/* Page Record Info */}
									<div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
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
												className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none"
											>
												<option value={10}>10</option>
												<option value={25}>25</option>
												<option value={50}>50</option>
												<option value={100}>100</option>
											</select>
										</div>
									</div>

									{/* Export Buttons (Bottom Center) */}
									<div className="flex items-center gap-2">
										<button
											onClick={handleExcelExport}
											className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95 shadow-emerald-600/20"
										>
											<FileExcelOutlined />
											<span>Export Excel</span>
										</button>
										<button
											onClick={handlePrintReport}
											className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95 shadow-slate-700/20"
										>
											<PrinterOutlined />
											<span>Print / PDF</span>
										</button>
									</div>

									<div className="flex items-center gap-1.5">
										<button
											disabled={currentPage === 1}
											onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
											className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${currentPage === 1
													? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed"
													: "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer"
												}`}
										>
											Previous
										</button>
										<span className="text-xs font-bold px-3 py-1 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 rounded-lg border border-teal-200 dark:border-teal-800">
											Page {currentPage} of {totalPages}
										</span>
										<button
											disabled={currentPage === totalPages}
											onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
											className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${currentPage === totalPages
													? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed"
													: "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer"
												}`}
										>
											Next
										</button>
									</div>
								</div>
							)}
						</div>
					)}
				</main>
			</Spin>

			{/* Per-Row Eye Button Transaction History Modal */}
			<Modal
				title={
					<div className="flex items-center gap-2.5 text-teal-700 dark:text-teal-400 border-b border-slate-200 dark:border-slate-800 pb-3">
						<HistoryOutlined className="text-xl" />
						<span className="text-base font-extrabold">{reportType === "MEMBERS" ? "Member Savings Transaction History" : "Group Deposit Transaction History"}</span>
					</div>
				}
				open={transModalVisible}
				onCancel={() => setTransModalVisible(false)}
				footer={null}
				width={900}
				centered
				className="rounded-2xl overflow-hidden"
			>
				<Spin spinning={transLoading} indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}>
					{selectedGroupDtls && (
						<div className="pt-2">
							{/* Group / Member Summary Box */}
							<div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
								<div>
									<span className="text-slate-500 block uppercase font-bold text-[10px]">{reportType === "MEMBERS" ? "Member Name & Code" : "Group Name & Code"}</span>
									<strong className="text-slate-800 dark:text-slate-200 text-sm block">{reportType === "MEMBERS" ? selectedGroupDtls.member_name : selectedGroupDtls.group_name}</strong>
									<span className="text-teal-600 font-mono text-[11px] font-bold">Code: {reportType === "MEMBERS" ? selectedGroupDtls.member_code : selectedGroupDtls.group_code}</span>
								</div>
								<div>
									<span className="text-slate-500 block uppercase font-bold text-[10px]">Savings A/C No.</span>
									<strong className="font-mono text-slate-800 dark:text-slate-200 text-sm">{selectedGroupDtls.acc_no}</strong>
								</div>
								<div>
									<span className="text-slate-500 block uppercase font-bold text-[10px]">Current Balance</span>
									<strong className="text-emerald-600 font-mono text-base font-extrabold">
										₹{Number(selectedGroupDtls.balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
									</strong>
								</div>
							</div>

							{/* Modal Action Bar */}
							<div className="flex items-center justify-between mb-3">
								<span className="text-xs font-bold text-slate-700 dark:text-slate-300">
									Total Transactions: {groupTransactions.length}
								</span>
								<div className="flex items-center gap-2">
									<button
										onClick={handleExportGroupTransactionsExcel}
										className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 inline-flex items-center gap-1"
									>
										<FileExcelOutlined />
										<span>Export Excel</span>
									</button>
									<button
										onClick={handlePrintGroupTransactions}
										className="px-3 py-1 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 inline-flex items-center gap-1"
									>
										<PrinterOutlined />
										<span>Print</span>
									</button>
								</div>
							</div>

							{/* Transactions Table Container */}
							<div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 max-h-[420px]">
								<table className="w-full text-sm text-left text-slate-700 dark:text-slate-200">
									<thead className="text-xs uppercase bg-slate-900 text-white sticky top-0 z-10 font-bold">
										<tr>
											<th className="px-3.5 py-3 text-center font-extrabold">Sl. No.</th>
											<th className="px-3.5 py-3 text-center font-extrabold">Trans No</th>
											<th className="px-3.5 py-3 text-center font-extrabold">Trans Date</th>
											<th className="px-3.5 py-3 text-center font-extrabold">Type</th>
											<th className="px-3.5 py-3 text-right font-extrabold">Debit (DR ₹)</th>
											<th className="px-3.5 py-3 text-right font-extrabold">Credit (CR ₹)</th>
											<th className="px-3.5 py-3 text-right font-extrabold">Balance (₹)</th>
											<th className="px-3.5 py-3 font-extrabold">Remarks</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
										{groupTransactions.length === 0 ? (
											<tr>
												<td colSpan={8} className="text-center py-6 text-slate-400 italic">
													No transaction history found for this account.
												</td>
											</tr>
										) : (
											groupTransactions.map((item, idx) => {
												const isDeposit = String(item.dep_with_flag).toUpperCase() === "D"
												return (
													<tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
														<td className="px-3.5 py-2.5 text-center font-bold">{idx + 1}</td>
														<td className="px-3.5 py-2.5 text-center font-mono text-sm font-bold">{item.trans_no || "N/A"}</td>
														<td className="px-3.5 py-2.5 text-center font-mono text-xs font-bold">{item.trans_dt || "N/A"}</td>
														<td className="px-3.5 py-2.5 text-center font-bold whitespace-nowrap">
															<span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black tracking-wide shadow-xs ${
																isDeposit
																	? "bg-emerald-700 text-white dark:bg-emerald-600"
																	: "bg-rose-700 text-white dark:bg-rose-600"
															}`}>
																{isDeposit ? "Deposit" : "Withdrawal"}
															</span>
														</td>
														<td className="px-3.5 py-2.5 text-right font-mono text-rose-600 font-extrabold text-sm">
															₹{Number(item.dr_amt || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
														</td>
														<td className="px-3.5 py-2.5 text-right font-mono text-emerald-600 font-extrabold text-sm">
															₹{Number(item.cr_amt || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
														</td>
														<td className="px-3.5 py-2.5 text-right font-mono font-extrabold text-base text-slate-900 dark:text-slate-100">
															₹{Number(item.balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
														</td>
														<td className="px-3.5 py-2.5 text-xs font-medium">{item.remarks || "N/A"}</td>
													</tr>
												)
											})
										)}
									</tbody>
									{groupTransactions.length > 0 && (
										<tfoot className="bg-slate-100 dark:bg-slate-800 font-extrabold text-xs sm:text-sm sticky bottom-0 z-10 border-t-2 border-teal-600 shadow-md">
											<tr>
												<td colSpan={4} className="px-3.5 py-2.5 text-right font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
													Total Summary:
												</td>
												<td className="px-3.5 py-2.5 text-right font-mono text-sm font-extrabold text-rose-600 dark:text-rose-400 whitespace-nowrap">
													₹{modalTransTotals.totalDr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
												</td>
												<td className="px-3.5 py-2.5 text-right font-mono text-sm font-extrabold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
													₹{modalTransTotals.totalCr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
												</td>
												<td className="px-3.5 py-2.5 text-right font-mono text-base font-extrabold text-slate-900 dark:text-slate-100 whitespace-nowrap">
													₹{modalTransTotals.latestBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
												</td>
												<td className="px-3.5 py-2.5"></td>
											</tr>
										</tfoot>
									)}
								</table>
							</div>
						</div>
					)}
				</Spin>
			</Modal>
		</div>
	)
}

export default ShgSavingsBalanceReport
