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
import { Spin, Tag, Popover, Tooltip } from "antd"
import {
	LoadingOutlined,
	UserOutlined,
	SearchOutlined,
	FileExcelOutlined,
	PrinterOutlined,
	TeamOutlined,
	BankOutlined,
	IdcardOutlined,
	CrownOutlined,
	SafetyCertificateOutlined,
} from "@ant-design/icons"
import Radiobtn from "../../../Components/Radiobtn"
import TDInputTemplateBr from "../../../Components/TDInputTemplateBr"

const searchModeOptions = [
	{ label: "CCB", value: "CCB" },
	{ label: "SOCIETY", value: "SOCIETY" },
]

const formatGenderLabel = (g) => {
	if (!g) return "N/A"
	const val = String(g).toUpperCase().trim()
	if (val === "F" || val === "FEMALE") return "Female"
	if (val === "M" || val === "MALE") return "Male"
	if (val === "O" || val === "OTHER" || val === "OTHERS") return "Other"
	return g
}

const getGenderTagColor = (gLabel) => {
	if (gLabel === "Female") return "magenta"
	if (gLabel === "Male") return "blue"
	if (gLabel === "Other") return "purple"
	return "cyan"
}

const parseDob = (rawVal) => {
	if (!rawVal || rawVal === "N/A" || rawVal === "Invalid date") return "N/A"
	const rawStr = String(rawVal).trim()
	if (!rawStr) return "N/A"

	// If already in DD/MM/YYYY format
	if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawStr)) return rawStr

	// Try moment parsing
	const m = moment(rawStr)
	if (m.isValid()) {
		return m.format("DD/MM/YYYY")
	}

	// Try splitting YYYY-MM-DD
	if (rawStr.includes("-")) {
		const parts = rawStr.split("T")[0].split("-")
		if (parts.length === 3 && parts[0].length === 4) {
			return `${parts[2]}/${parts[1]}/${parts[0]}`
		}
	}

	return rawStr
}

const formatEconomicActivity = (val) => {
	if (!val) return "No"
	const str = String(val).trim().toUpperCase()
	if (str === "Y" || str === "YES" || str === "1") return "Yes"
	return "No"
}

function MemberMasterReport() {
	const navigate = useNavigate()
	const rawUser = JSON.parse(localStorage.getItem("user_details"))
	const userDetails = Array.isArray(rawUser) ? rawUser[0] || {} : rawUser || {}

	const userBrnCode = userDetails?.brn_code || userDetails?.[0]?.brn_code || ""
	const userBrnName = userDetails?.branch_name || userDetails?.[0]?.branch_name || ""
	const userType = userDetails?.user_type || userDetails?.[0]?.user_type || "B"

	// Form & Filter States
	const [searchMode, setSearchMode] = useState("CCB") // CCB vs SOCIETY
	const [branches, setBranches] = useState([])
	const [selectedBranch, setSelectedBranch] = useState("")

	const [pacsList, setPacsList] = useState([])
	const [selectedPacs, setSelectedPacs] = useState("")
	const [loadingPacs, setLoadingPacs] = useState(false)

	const [searchKeywords, setSearchKeywords] = useState("")
	const [searchTerm, setSearchTerm] = useState("")
	const [loading, setLoading] = useState(false)
	const [memberData, setMemberData] = useState([])
	const [metadataDtls, setMetadataDtls] = useState(null)

	// Pagination States
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
		setMemberData([])
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
			setMemberData([])
			setMetadataDtls(null)
			return
		}

		const selected = branches.find((b) => String(b.code || b.branch_code || b.branch_id || b.branch_assign_id) === String(value))
		const brCode = selected ? (selected.code || selected.branch_code || selected.branch_id || selected.branch_assign_id) : value
		const brName = selected ? (selected.name || selected.branch_name || "") : ""

		setSelectedBranch(`${brCode},${brName}`)
		setSelectedPacs("")
		setMemberData([])
		setMetadataDtls(null)

		if (searchMode === "SOCIETY") {
			handleFetchPacsList(brCode)
		}
	}

	const handlePacsChange = (e) => {
		const value = e?.target?.value !== undefined ? e.target.value : e
		setSelectedPacs(value || "")
		setMemberData([])
		setMetadataDtls(null)
	}

	// Dynamic Validation for Fetch Members button:
	// If CCB: Enabled ONLY when Branch is selected
	// If SOCIETY: Enabled ONLY when BOTH Branch and Society are selected
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

	// Main Fetch Members API Call
	const handleSearchMembers = async () => {
		if (!isFetchEnabled) return

		setLoading(true)
		setMemberData([])
		setMetadataDtls(null)
		setCurrentPage(1)
		setSearchTerm("")

		const selectedBrnCode = selectedBranch ? selectedBranch.split(",")[0] : ""
		const selectedBrnName = selectedBranch ? selectedBranch.split(",")[1] : ""
		const selectedPacsObj = pacsList.find((p) => String(p.code) === String(selectedPacs))
		const selectedPacsName = selectedPacsObj ? selectedPacsObj.name : ""

		const targetBranchCode = searchMode === "CCB" ? selectedBrnCode : selectedPacs

		const creds = {
			group_name_code: searchKeywords || "",
			branch_code: targetBranchCode,
			tenant_id: userDetails?.tenant_id || 1,
		}

		const tokenValue = await getLocalStoreTokenDts(navigate)

		try {
			let res
			try {
				res = await axios.post(`${url_bdccb}/memberreport/get_group_memb_list`, creds, {
					headers: {
						Authorization: `${tokenValue?.token}`,
						"Content-Type": "application/json",
					},
				})
			} catch (err) {
				res = await axios.post(`${url_bdccb}/group/get_group_memb_list`, creds, {
					headers: {
						Authorization: `${tokenValue?.token}`,
						"Content-Type": "application/json",
					},
				})
			}

			if (res?.data?.success && Array.isArray(res?.data?.data) && res.data.data.length > 0) {
				const rawList = res.data.data

				// Flatten data from bdccb.md_member & bdccb.md_group tables
				let list = []
				rawList.forEach((grpItem, gIdx) => {
					if (Array.isArray(grpItem?.memberDetails) && grpItem.memberDetails.length > 0) {
						grpItem.memberDetails.forEach((mem, mIdx) => {
							list.push({
								sl_no: list.length + 1,
								member_code: mem?.member_code || mem?.client_id || mem?.member_id || "",
								branch_id: mem?.branch_id || selectedBrnCode,
								group_code: grpItem?.group_code || mem?.group_code || "",
								group_name: grpItem?.group_name || mem?.group_name || "",
								member_name: mem?.member_name || mem?.client_name || mem?.name || "",
								gender: mem?.gender || mem?.sex || "N/A",
								dob: parseDob(mem?.dob || mem?.date_of_birth || mem?.birth_date),
								gurdian_name: mem?.gurdian_name || mem?.father_name || mem?.father_husband_name || "N/A",
								address: mem?.address || grpItem?.group_addr || "N/A",
								phone_no: mem?.phone_no || mem?.mobile_no || mem?.phone1 || "N/A",
								pin_no: mem?.pin_no || mem?.pin || "N/A",
								aadhar_no: mem?.aadhar_no || mem?.aadhaar_no || "N/A",
								pan_no: mem?.pan_no || "N/A",
								voter_id: mem?.voter_id || "N/A",
								religion: mem?.religion || "N/A",
								caste: mem?.caste || "N/A",
								education: mem?.education || "N/A",
								occupation: mem?.occupation || "N/A",
								approval_status: mem?.approval_status || grpItem?.approval_status || "A",
								gp_leader_flag: mem?.gp_leader_flag || "N",
								asst_gp_leader_flag: mem?.asst_gp_leader_flag || "N",
								member_account_no: mem?.member_account_no || mem?.sb_ac_no || mem?.sb_acc_no || "N/A",
								ifsc: mem?.ifsc || "N/A",
								economic_activity: mem?.economic_activity || "N/A",
								branch_name: selectedBrnName,
								pacs_name: selectedPacsName,
							})
						})
					} else {
						list.push({
							sl_no: gIdx + 1,
							member_code: grpItem?.member_code || grpItem?.client_id || grpItem?.member_id || "",
							branch_id: grpItem?.branch_id || selectedBrnCode,
							group_code: grpItem?.group_code || "",
							group_name: grpItem?.group_name || "N/A",
							member_name: grpItem?.member_name || grpItem?.client_name || grpItem?.name || "",
							gender: grpItem?.gender || grpItem?.sex || "N/A",
							dob: parseDob(grpItem?.dob || grpItem?.date_of_birth || grpItem?.birth_date),
							gurdian_name: grpItem?.gurdian_name || grpItem?.father_name || grpItem?.father_husband_name || "N/A",
							address: grpItem?.address || grpItem?.group_addr || "N/A",
							phone_no: grpItem?.phone_no || grpItem?.mobile_no || grpItem?.phone1 || "N/A",
							pin_no: grpItem?.pin_no || grpItem?.pin || "N/A",
							aadhar_no: grpItem?.aadhar_no || grpItem?.aadhaar_no || "N/A",
							pan_no: grpItem?.pan_no || "N/A",
							voter_id: grpItem?.voter_id || "N/A",
							religion: grpItem?.religion || "N/A",
							caste: grpItem?.caste || "N/A",
							education: grpItem?.education || "N/A",
							occupation: grpItem?.occupation || "N/A",
							approval_status: grpItem?.approval_status || "A",
							gp_leader_flag: grpItem?.gp_leader_flag || "N",
							asst_gp_leader_flag: grpItem?.asst_gp_leader_flag || "N",
							member_account_no: grpItem?.member_account_no || grpItem?.sb_ac_no || grpItem?.sb_acc_no || "N/A",
							ifsc: grpItem?.ifsc || "N/A",
							economic_activity: grpItem?.economic_activity || "N/A",
							branch_name: selectedBrnName,
							pacs_name: selectedPacsName,
						})
					}
				})

				setMemberData(list)
				setMetadataDtls({
					search_mode: searchMode,
					branch_code: selectedBrnCode,
					branch_name: selectedBrnName,
					pacs_name: selectedPacsName,
					total_records: list.length,
				})
			} else {
				Message("error", res?.data?.msg || "No member records found for selected branch/society")
				setMemberData([])
			}
		} catch (err) {
			console.error("Fetch member master report error:", err)
			Message("error", "Error fetching member master report details")
			setMemberData([])
		}
		setLoading(false)
	}

	// Filter data by live search text (Member Code, Member Name, Group Code, Group Name, Phone, Account)
	const filteredMemberData = useMemo(() => {
		if (!searchTerm || !searchTerm.trim()) return memberData
		const q = searchTerm.toLowerCase().trim()
		return memberData.filter((item) => {
			const mCode = String(item?.member_code || "").toLowerCase()
			const mName = String(item?.member_name || "").toLowerCase()
			const gCode = String(item?.group_code || "").toLowerCase()
			const gName = String(item?.group_name || "").toLowerCase()
			const phone = String(item?.phone_no || "").toLowerCase()
			const accNo = String(item?.member_account_no || "").toLowerCase()
			const aadhar = String(item?.aadhar_no || "").toLowerCase()
			const guardian = String(item?.gurdian_name || "").toLowerCase()

			return (
				mCode.includes(q) ||
				mName.includes(q) ||
				gCode.includes(q) ||
				gName.includes(q) ||
				phone.includes(q) ||
				accNo.includes(q) ||
				aadhar.includes(q) ||
				guardian.includes(q)
			)
		})
	}, [memberData, searchTerm])

	// Pagination calculations
	const totalRecords = filteredMemberData.length
	const totalPages = Math.ceil(totalRecords / itemsPerPage) || 1
	const indexOfLastItem = currentPage * itemsPerPage
	const indexOfFirstItem = indexOfLastItem - itemsPerPage
	const currentData = filteredMemberData.slice(indexOfFirstItem, indexOfLastItem)

	// Summary Statistics
	const stats = useMemo(() => {
		const total = filteredMemberData.length
		const leaders = filteredMemberData.filter((m) => m?.gp_leader_flag === "Y" || m?.asst_gp_leader_flag === "Y").length
		const uniqueGroups = new Set(filteredMemberData.map((m) => m?.group_code).filter(Boolean)).size
		const withAccount = filteredMemberData.filter((m) => m?.member_account_no && m?.member_account_no !== "N/A").length

		return { total, leaders, uniqueGroups, withAccount }
	}, [filteredMemberData])

	const leaderMembers = useMemo(() => {
		return filteredMemberData.filter((m) => m?.gp_leader_flag === "Y" || m?.asst_gp_leader_flag === "Y")
	}, [filteredMemberData])

	const leaderPopoverContent = (
		<div className="max-w-xs max-h-72 overflow-y-auto p-1.5 text-xs">
			<div className="font-bold text-slate-800 dark:text-slate-100 pb-2 border-b border-slate-200 dark:border-slate-700 mb-2 flex items-center justify-between">
				<span>Group Leaders ({leaderMembers.length})</span>
			</div>
			{leaderMembers.length === 0 ? (
				<p className="text-slate-400 text-center py-2">No leaders in current selection</p>
			) : (
				<div className="space-y-2">
					{leaderMembers.map((lm, idx) => (
						<div key={idx} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700 flex flex-col gap-1">
							<div className="flex items-center justify-between">
								<strong className="text-slate-900 dark:text-slate-100 font-bold">{lm.member_name}</strong>
								{lm.gp_leader_flag === "Y" ? (
									<Tag color="gold" className="!mr-0 font-bold text-[10px]">Leader 👑</Tag>
								) : (
									<Tag color="purple" className="!mr-0 font-bold text-[10px]">Asst. Leader</Tag>
								)}
							</div>
							<div className="text-[11px] text-slate-600 dark:text-slate-400">
								Group: <strong className="text-teal-700 dark:text-teal-400">{lm.group_name}</strong> (<span className="font-mono">{lm.group_code}</span>)
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	)

	// Styled Excel Export Handler
	const handleExcelExport = async () => {
		if (!filteredMemberData || filteredMemberData.length === 0) return

		const workbook = new ExcelJS.Workbook()
		const worksheet = workbook.addWorksheet("Member Master Report")

		// Main Title Row
		worksheet.mergeCells("A1:W1")
		const titleCell = worksheet.getCell("A1")
		titleCell.value = "BDCCB - MEMBER MASTER REPORT"
		titleCell.font = { name: "Calibri", size: 14, bold: true, color: { argb: "FFFFFFFF" } }
		titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } }
		titleCell.alignment = { horizontal: "center", vertical: "middle" }

		// Metadata Subtitle Row
		worksheet.mergeCells("A2:W2")
		const metaCell = worksheet.getCell("A2")
		metaCell.value = `Search Mode: ${searchMode}   |   Branch: ${metadataDtls?.branch_name || "N/A"}   |   PACS/Society: ${metadataDtls?.pacs_name || "N/A"}   |   Total Members: ${filteredMemberData.length}   |   Date: ${moment().format("DD/MM/YYYY HH:mm")}`
		metaCell.font = { name: "Calibri", size: 10, italic: true, color: { argb: "FF334155" } }
		metaCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } }
		metaCell.alignment = { horizontal: "center", vertical: "middle" }

		worksheet.addRow([])

		// Table Headers
		const headers = [
			"Sl. No.",
			"Member Code",
			"Branch ID",
			"Group Code",
			"Group Name",
			"Member Name",
			"Guardian Name",
			"Gender",
			"Mobile No.",
			"Aadhaar No.",
			"Voter ID",
			"PAN No.",
			"Member Savings A/C No.",
			"IFSC Code",
			"Religion",
			"Caste",
			"Education",
			"Occupation",
			"Economic Activity",
			"Role (Leader/Asst)",
			"Address",
			"Pin Code",
		]

		const headerRow = worksheet.addRow(headers)
		headerRow.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } }
		headerRow.eachCell((cell) => {
			cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } }
			cell.alignment = { horizontal: "center", vertical: "middle" }
		})

		// Data Rows
		filteredMemberData.forEach((item, index) => {
			const role = item?.gp_leader_flag === "Y" ? "Group Leader" : (item?.asst_gp_leader_flag === "Y" ? "Asst. Leader" : "Member")

			const rowData = [
				index + 1,
				item?.member_code || "N/A",
				item?.branch_id || "N/A",
				item?.group_code || "N/A",
				item?.group_name || "N/A",
				item?.member_name || "N/A",
				item?.gurdian_name || "N/A",
				formatGenderLabel(item?.gender),
				item?.phone_no || "N/A",
				item?.aadhar_no || "N/A",
				item?.voter_id || "N/A",
				item?.pan_no || "N/A",
				item?.member_account_no || "N/A",
				item?.ifsc || "N/A",
				item?.religion || "N/A",
				item?.caste || "N/A",
				item?.education || "N/A",
				item?.occupation || "N/A",
				formatEconomicActivity(item?.economic_activity),
				role,
				item?.address || "N/A",
				item?.pin_no || "N/A",
			]

			const addedRow = worksheet.addRow(rowData)
			addedRow.getCell(1).alignment = { horizontal: "center" }
			addedRow.getCell(2).alignment = { horizontal: "center" }
			addedRow.getCell(3).alignment = { horizontal: "center" }
			addedRow.getCell(4).alignment = { horizontal: "center" }
			addedRow.getCell(8).alignment = { horizontal: "center" }
			addedRow.getCell(9).alignment = { horizontal: "center" }
			addedRow.getCell(10).alignment = { horizontal: "center" }
			addedRow.getCell(11).alignment = { horizontal: "center" }
			addedRow.getCell(12).alignment = { horizontal: "center" }
			addedRow.getCell(13).alignment = { horizontal: "center" }
			addedRow.getCell(14).alignment = { horizontal: "center" }
			addedRow.getCell(19).alignment = { horizontal: "center" }
			addedRow.getCell(20).alignment = { horizontal: "center" }
			addedRow.getCell(22).alignment = { horizontal: "center" }
		})

		// Auto fit column widths
		worksheet.columns.forEach((col) => {
			col.width = 18
		})

		const buffer = await workbook.xlsx.writeBuffer()
		const fileName = `Member_Master_Report_${searchMode}_${moment().format("YYYYMMDD_HHmmss")}.xlsx`
		saveAs(new Blob([buffer]), fileName)
	}

	// Print View Handler
	const handlePrintReport = () => {
		if (!filteredMemberData || filteredMemberData.length === 0) return

		const printWindow = window.open("", "_blank")

		const tableHeaderHtml = `
			<tr>
				<th>Sl. No.</th>
				<th>Member Code</th>
				<th>Member Name</th>
				<th>Guardian Name</th>
				<th>Group Code & Name</th>
				<th>Gender</th>
				<th>Mobile No.</th>
				<th>Aadhaar No.</th>
				<th>Voter ID</th>
				<th>PAN No.</th>
				<th>Member Savings A/C No.</th>
				<th>IFSC Code</th>
				<th>Religion</th>
				<th>Caste</th>
				<th>Education</th>
				<th>Occupation</th>
				<th>Economic Activity</th>
				<th>Role</th>
				<th>Address</th>
			</tr>
		`

		const tableRowsHtml = filteredMemberData
			.map(
				(item, index) => {
					const role = item?.gp_leader_flag === "Y" ? "Group Leader" : (item?.asst_gp_leader_flag === "Y" ? "Asst. Leader" : "Member")

					return `
					<tr>
						<td style="text-align: center;">${index + 1}</td>
						<td style="font-family: monospace; font-weight: bold; color: #0f766e;">${item?.member_code || "N/A"}</td>
						<td style="font-weight: 600;">${item?.member_name || "N/A"}</td>
						<td>${item?.gurdian_name || "N/A"}</td>
						<td><span style="font-family: monospace; font-size: 10px;">${item?.group_code || ""}</span><br/><strong>${item?.group_name || "N/A"}</strong></td>
						<td style="text-align: center; font-weight: 600;">${formatGenderLabel(item?.gender)}</td>
						<td style="text-align: center; font-family: monospace;">${item?.phone_no || "N/A"}</td>
						<td style="text-align: center; font-family: monospace;">${item?.aadhar_no || "N/A"}</td>
						<td style="text-align: center; font-family: monospace;">${item?.voter_id || "N/A"}</td>
						<td style="text-align: center; font-family: monospace;">${item?.pan_no || "N/A"}</td>
						<td style="text-align: center; font-family: monospace;">${item?.member_account_no || "N/A"}</td>
						<td style="text-align: center; font-family: monospace;">${item?.ifsc || "N/A"}</td>
						<td style="text-align: center;">${item?.religion || "N/A"}</td>
						<td style="text-align: center;">${item?.caste || "N/A"}</td>
						<td style="text-align: center;">${item?.education || "N/A"}</td>
						<td style="text-align: center;">${item?.occupation || "N/A"}</td>
						<td style="text-align: center; font-weight: bold;">${formatEconomicActivity(item?.economic_activity)}</td>
						<td style="text-align: center; font-weight: bold;">${role}</td>
						<td style="font-size: 10px;">${item?.address || "N/A"}</td>
					</tr>
				`
				}
			)
			.join("")

		const htmlContent = `
			<!DOCTYPE html>
			<html>
			<head>
				<title>Member Master Report - BDCCB</title>
				<style>
					@page { size: landscape; margin: 8mm; }
					body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 12px; color: #1e293b; font-size: 11px; }
					.header { text-align: center; margin-bottom: 12px; border-bottom: 2px solid #0f766e; padding-bottom: 8px; }
					.header h2 { margin: 0; color: #0f766e; font-size: 18px; font-weight: 800; text-transform: uppercase; }
					.meta-info { display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; margin-bottom: 10px; color: #475569; background-color: #f1f5f9; padding: 6px 12px; border-radius: 6px; }
					table { width: 100%; border-collapse: collapse; margin-top: 5px; }
					th, td { border: 1px solid #cbd5e1; padding: 5px 7px; text-align: left; }
					th { background-color: #1e293b; color: #ffffff; font-size: 10px; text-transform: uppercase; }
					tr:nth-child(even) { background-color: #f8fafc; }
					@media print {
						body { padding: 0; }
					}
				</style>
			</head>
			<body>
				<div class="header">
					<h2>BDCCB - MEMBER MASTER REPORT</h2>
				</div>
				<div class="meta-info">
					<span>Search Mode: ${searchMode}</span>
					<span>Branch: ${metadataDtls?.branch_name || userBrnName || "N/A"}</span>
					${searchMode === "SOCIETY" ? `<span>PACS/Society: ${metadataDtls?.pacs_name || "N/A"}</span>` : ""}
					<span>Total Members: ${filteredMemberData.length}</span>
					<span>Date: ${moment().format("DD/MM/YYYY")}</span>
				</div>
				<table>
					<thead>${tableHeaderHtml}</thead>
					<tbody>${tableRowsHtml}</tbody>
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

	return (
		<div>
			<Sidebar mode={2} />
			<Spin indicator={<LoadingOutlined spin />} size="large" spinning={loading}>
				<main className="w-[95%] max-w-[1450px] mx-auto my-6 p-6 md:p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 transition-all duration-300">
					{/* Header Banner */}
					<div className="flex flex-col md:flex-row md:items-center justify-between pb-5 mb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
						<div className="flex items-center gap-4">
							<div className="p-3.5 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl text-white shadow-lg shadow-teal-500/20">
								<IdcardOutlined className="text-3xl" />
							</div>
							<div>
								<h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
									Member Master Report
								</h1>
								<p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
									View and export member master details for CCB & Society networks
								</p>
							</div>
						</div>
					</div>

					{/* Filter Card (Search Mode -> Branch -> PACS/Society -> Group Search -> Fetch Members Button) */}
					<div className="bg-slate-50/90 dark:bg-slate-800/60 p-5 md:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm mb-6">
						<div className="grid grid-cols-1 md:grid-cols-12 items-end gap-4">
							{/* Search Mode Radio Buttons (CCB vs SOCIETY) */}
							<div className={`w-full ${searchMode === "SOCIETY" ? "md:col-span-3" : "md:col-span-3"}`}>
								<label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
									Search By Mode <span className="text-red-500">*</span>
								</label>
								<div className="h-[38px] flex items-center justify-center px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs">
									<Radiobtn
										data={searchModeOptions}
										val={searchMode}
										className="!mt-0 !mb-0 !shadow-none !p-0 inline-flex items-center gap-4 justify-center"
										onChangeVal={(val) => handleSearchModeChange(val)}
									/>
								</div>
							</div>

							{/* Select Branch */}
							<div className={`w-full ${searchMode === "SOCIETY" ? "md:col-span-4" : "md:col-span-6"}`}>
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

							{/* Select PACS / Society (Big Section ONLY when searchMode === "SOCIETY") */}
							{searchMode === "SOCIETY" && (
								<div className="w-full md:col-span-5">
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

							{/* Fetch Members Button FOR CCB MODE (Inline beside Branch) */}
							{searchMode === "CCB" && (
								<div className="w-full md:col-span-3 pb-[1px]">
									<button
										disabled={!isFetchEnabled}
										className={`h-[38px] px-6 inline-flex items-center justify-center w-full text-xs font-bold text-white rounded-xl transition-all duration-200 shadow-md gap-2 ${isFetchEnabled
												? "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 border border-teal-600 cursor-pointer active:scale-95 shadow-teal-500/20"
												: "bg-slate-300 dark:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-400 cursor-not-allowed opacity-60 active:scale-100"
											}`}
										onClick={handleSearchMembers}
									>
										<SearchOutlined className="text-sm" />
										<span>Fetch Members</span>
									</button>
								</div>
							)}
						</div>

						{/* Fetch Members Button FOR SOCIETY MODE (Centered on Next Line) */}
						{searchMode === "SOCIETY" && (
							<div className="w-full flex items-center justify-center mt-5 pt-4 border-t border-slate-200/70 dark:border-slate-700/60">
								<button
									disabled={!isFetchEnabled}
									className={`h-[40px] px-8 inline-flex items-center justify-center text-xs font-bold text-white rounded-xl transition-all duration-200 shadow-md gap-2 min-w-[200px] ${isFetchEnabled
											? "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 border border-teal-600 cursor-pointer active:scale-95 shadow-teal-500/20"
											: "bg-slate-300 dark:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-400 cursor-not-allowed opacity-60 active:scale-100"
										}`}
									onClick={handleSearchMembers}
								>
									<SearchOutlined className="text-sm" />
									<span>Fetch Members</span>
								</button>
							</div>
						)}
					</div>

					{/* Summary Statistics Cards */}
					{memberData.length > 0 && (
						<div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
							<div className="p-4 bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800/60 rounded-2xl flex items-center gap-3">
								<div className="p-2.5 bg-teal-600 text-white rounded-xl">
									<UserOutlined className="text-xl" />
								</div>
								<div>
									<p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Total Members</p>
									<h4 className="text-xl font-extrabold text-teal-700 dark:text-teal-400">{stats.total}</h4>
								</div>
							</div>

							<div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl flex items-center gap-3">
								<div className="p-2.5 bg-emerald-600 text-white rounded-xl">
									<TeamOutlined className="text-xl" />
								</div>
								<div>
									<p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Total Groups</p>
									<h4 className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400">{stats.uniqueGroups}</h4>
								</div>
							</div>

							<Popover content={leaderPopoverContent} title={null} placement="bottom">
								<div className="p-4 bg-purple-50 dark:bg-purple-950/40 border-2 border-purple-400/80 dark:border-purple-600 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-purple-100/90 dark:hover:bg-purple-900/40 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/15 transition-all duration-200">
									<div className="p-2.5 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-xl shadow-md shadow-purple-500/30">
										<CrownOutlined className="text-xl" />
									</div>
									<div className="flex-1">
										<p className="text-xs text-purple-900 dark:text-purple-300 font-extrabold uppercase tracking-wide flex items-center justify-between">
											<span>Group Leaders</span>
											<span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" title="Interactive"></span>
										</p>
										<h4 className="text-xl font-black text-purple-700 dark:text-purple-400 mt-0.5">{stats.leaders}</h4>
									</div>
								</div>
							</Popover>

							<div className="p-4 bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200/80 dark:border-cyan-800/60 rounded-2xl flex items-center gap-3">
								<div className="p-2.5 bg-cyan-600 text-white rounded-xl">
									<BankOutlined className="text-xl" />
								</div>
								<div>
									<p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">With Bank A/C</p>
									<h4 className="text-xl font-extrabold text-cyan-700 dark:text-cyan-400">{stats.withAccount}</h4>
								</div>
							</div>
						</div>
					)}

					{/* Results Table Section */}
					{memberData.length !== 0 && (
						<div className="bg-slate-50/50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
								<div>
									<h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
										<span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
										<span>Member Master Directory ({searchMode})</span>
									</h3>
									<p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
										{filteredMemberData.length} Member(s) Found {metadataDtls?.branch_name ? `for Branch: ${metadataDtls.branch_name}` : ""} {metadataDtls?.pacs_name ? `(${metadataDtls.pacs_name})` : ""}
									</p>
								</div>

								{/* Instant Search Bar (Search member_code / member_name / group_code / group_name / phone) */}
								<div className="relative w-full sm:w-80">
									<input
										type="text"
										placeholder="Search member code / name / group / account..."
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
							<div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm max-h-[550px]">
								<table className="w-full text-xs text-left text-slate-600 dark:text-slate-300">
									<thead className="text-[11px] uppercase bg-slate-800 text-slate-100 dark:bg-slate-900 sticky top-0 z-10">
										<tr>
											<th scope="col" className="px-3 py-3 font-bold tracking-wider text-center">Sl. No.</th>
											<th scope="col" className="px-3 py-3 font-bold tracking-wider">Group Code & Name</th>
											<th scope="col" className="px-3 py-3 font-bold tracking-wider">Member Code</th>
											<th scope="col" className="px-3 py-3 font-bold tracking-wider">Member Name</th>
											<th scope="col" className="px-3 py-3 font-bold tracking-wider">Guardian Name</th>
											<th scope="col" className="px-3 py-3 font-bold tracking-wider text-center">Gender</th>
											<th scope="col" className="px-3 py-3 font-bold tracking-wider text-center">Mobile No.</th>
											<th scope="col" className="px-3 py-3 font-bold tracking-wider text-center">Aadhaar No.</th>
											<th scope="col" className="px-3 py-3 font-bold tracking-wider text-center">Voter ID</th>
											<th scope="col" className="px-3 py-3 font-bold tracking-wider text-center">PAN No.</th>
											<th scope="col" className="px-3 py-3 font-bold tracking-wider text-center">Member Savings A/C No.</th>
											<th scope="col" className="px-3 py-3 font-bold tracking-wider text-center">IFSC Code</th>
											<th scope="col" className="px-3 py-3 font-bold tracking-wider text-center">Religion</th>
											<th scope="col" className="px-3 py-3 font-bold tracking-wider text-center">Caste</th>
											<th scope="col" className="px-3 py-3 font-bold tracking-wider text-center">Education</th>
											<th scope="col" className="px-3 py-3 font-bold tracking-wider text-center">Occupation</th>
											<th scope="col" className="px-3 py-3 font-bold tracking-wider text-center">Economic Activity</th>
											<th scope="col" className="px-3 py-3 font-bold tracking-wider text-center">Role</th>
											<th scope="col" className="px-3 py-3 font-bold tracking-wider">Address & Pin</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-200 dark:divide-slate-800">
										{currentData.map((item, i) => {
											const isLeader = item?.gp_leader_flag === "Y"
											const isAsstLeader = item?.asst_gp_leader_flag === "Y"
											const genderText = formatGenderLabel(item?.gender)
											const ecoAct = formatEconomicActivity(item?.economic_activity)

											return (
												<tr key={i} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
													<td className="px-3 py-3 text-center font-medium text-slate-700 dark:text-slate-300">{indexOfFirstItem + i + 1}</td>
													<td className="px-3 py-3 whitespace-nowrap">
														<span className="font-mono text-[11px] text-teal-600 font-bold block">{item?.group_code || ""}</span>
														<strong className="text-slate-800 dark:text-slate-200">{item?.group_name || "N/A"}</strong>
													</td>
													<td className="px-3 py-3 font-mono font-bold text-teal-600 whitespace-nowrap">{item?.member_code || "N/A"}</td>
													<td className="px-3 py-3 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
														{item?.member_name || "N/A"}
													</td>
													<td className="px-3 py-3 whitespace-nowrap">{item?.gurdian_name || "N/A"}</td>
													<td className="px-3 py-3 text-center whitespace-nowrap">
														<Tag color={getGenderTagColor(genderText)} className="font-semibold">
															{genderText}
														</Tag>
													</td>
													<td className="px-3 py-3 text-center font-mono whitespace-nowrap">{item?.phone_no || "N/A"}</td>
													<td className="px-3 py-3 text-center font-mono text-[11px] whitespace-nowrap">{item?.aadhar_no || "N/A"}</td>
													<td className="px-3 py-3 text-center font-mono text-[11px] whitespace-nowrap">{item?.voter_id || "N/A"}</td>
													<td className="px-3 py-3 text-center font-mono text-[11px] whitespace-nowrap">{item?.pan_no || "N/A"}</td>
													<td className="px-3 py-3 text-center font-mono whitespace-nowrap text-slate-800 dark:text-slate-200 font-semibold">
														{item?.member_account_no || "N/A"}
													</td>
													<td className="px-3 py-3 text-center font-mono text-[11px] whitespace-nowrap text-slate-600 dark:text-slate-400">
														{item?.ifsc || "N/A"}
													</td>
													<td className="px-3 py-3 text-center whitespace-nowrap">
														{item?.religion && item?.religion !== "N/A" ? <Tag color="blue">{item.religion}</Tag> : "N/A"}
													</td>
													<td className="px-3 py-3 text-center whitespace-nowrap">
														{item?.caste && item?.caste !== "N/A" ? <Tag color="geekblue">{item.caste}</Tag> : "N/A"}
													</td>
													<td className="px-3 py-3 text-center whitespace-nowrap text-slate-700 dark:text-slate-300">
														{item?.education || "N/A"}
													</td>
													<td className="px-3 py-3 text-center whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
														{item?.occupation || "N/A"}
													</td>
													<td className="px-3 py-3 text-center whitespace-nowrap">
														<Tag color={ecoAct === "Yes" ? "emerald" : "default"} className="font-bold">
															{ecoAct}
														</Tag>
													</td>
													<td className="px-3 py-3 text-center whitespace-nowrap">
														{isLeader && (
															<Tooltip title={`Group Leader of: ${item?.group_name || "N/A"} (Code: ${item?.group_code || "N/A"})`}>
																<Tag color="gold" className="font-bold cursor-pointer hover:scale-105 transition-transform">Leader 👑</Tag>
															</Tooltip>
														)}
														{isAsstLeader && (
															<Tooltip title={`Assistant Leader of: ${item?.group_name || "N/A"} (Code: ${item?.group_code || "N/A"})`}>
																<Tag color="purple" className="font-bold cursor-pointer hover:scale-105 transition-transform">Asst. Leader</Tag>
															</Tooltip>
														)}
														{!isLeader && !isAsstLeader && <Tag color="default">Member</Tag>}
													</td>
													<td className="px-3 py-3 text-[11px]">
														<div>{item?.address || "N/A"}</div>
														{item?.pin_no && item?.pin_no !== "N/A" && (
															<span className="text-[10px] text-slate-400">PIN: {item.pin_no}</span>
														)}
													</td>
												</tr>
											)
										})}
									</tbody>
								</table>
							</div>

							{/* Pagination Bar */}
							{filteredMemberData.length > 0 && (
								<div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800 mt-2">
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

					{/* Export & Print Action Buttons */}
					{memberData.length !== 0 && (
						<div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
							<button
								onClick={handleExcelExport}
								className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-400 dark:border-emerald-800 rounded-xl shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
							>
								<FileExcelOutlined className="text-sm" />
								<span>Download Excel</span>
							</button>

							<button
								onClick={handlePrintReport}
								className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-300 dark:bg-teal-950/40 dark:hover:bg-teal-900/60 dark:text-teal-400 dark:border-teal-800 rounded-xl shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
							>
								<PrinterOutlined className="text-sm" />
								<span>Print Report</span>
							</button>
						</div>
					)}
				</main>
			</Spin>
		</div>
	)
}

export default MemberMasterReport
