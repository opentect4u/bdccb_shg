import React, { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import moment from "moment"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"
import { Message } from "../../Components/Message"
import { url, url_bdccb } from "../../Address/BaseUrl"
import { getLocalStoreTokenDts } from "../../Components/getLocalforageTokenDts"
import { Spin, Modal } from "antd"
import {
	LoadingOutlined,
	SearchOutlined,
	FileExcelOutlined,
	PrinterOutlined,
	SwapOutlined,
	ArrowUpOutlined,
	ArrowDownOutlined,
	AccountBookOutlined,
} from "@ant-design/icons"
import Radiobtn from "../../Components/Radiobtn"
import TDInputTemplateBr from "../../Components/TDInputTemplateBr"
import { Paginator } from "primereact/paginator"

const searchModeDisbOptions = [
	{ label: "CCB", value: "CCB" },
	{ label: "SOCIETY", value: "SOCIETY" },
	{ label: "SHG", value: "SHG" },
]

const searchModeRecovOptions = [
	{ label: "SHG Members", value: "SHG_MEMBER" },
	{ label: "SHG", value: "SHG" },
	{ label: "Society", value: "SOCIETY" },
]

const isHeadOffice = (code, name) => {
	const c = String(code || "").trim()
	const n = String(name || "").toLowerCase().trim()
	return c === "112" || c === "100" || n.includes("head office") || n === "ho"
}

const txnTypeOptions = [
	{ label: "Disbursement", value: "D" },
	{ label: "Recovery", value: "R" },
]


function LoanTransactionReport() {
	const navigate = useNavigate()
	const rawUser = JSON.parse(localStorage.getItem("user_details"))
	const userDetails = Array.isArray(rawUser) ? rawUser[0] || {} : rawUser || {}

	const isBranchUser = (userDetails?.user_type === "B" || userDetails?.branch_type === "B") && !isHeadOffice(userDetails?.brn_code || userDetails?.branch_id, userDetails?.branch_name)
	const userBranchCode = String(userDetails?.brn_code || userDetails?.branch_id || "")
	const userBranchName = userDetails?.branch_name || ""

	// Filter States
	const [searchMode, setSearchMode] = useState("CCB") // CCB vs SOCIETY vs SHG
	const [disburseTo, setDisburseTo] = useState("SOCIETY") // SOCIETY, GROUP, MEMBER (Only for Disbursement)
	const [txnType, setTxnType] = useState("D") // D = Disbursement, R = Recovery
	const [reportType, setReportType] = useState("GROUP") // GROUP vs MEMBER
	const [fromDate, setFromDate] = useState("")
	const [toDate, setToDate] = useState("")

	const [branches, setBranches] = useState([])
	const [selectedBranch, setSelectedBranch] = useState("")

	const [pacsList, setPacsList] = useState([])
	const [selectedPacs, setSelectedPacs] = useState("")
	const [loadingPacs, setLoadingPacs] = useState(false)

	const [transactionData, setTransactionData] = useState([])
	const [loading, setLoading] = useState(false)
	const [hasSearched, setHasSearched] = useState(false)

	// Instant Search Filter Text & Metadata
	const [searchTerm, setSearchTerm] = useState("")
	const [metadataDtls, setMetadataDtls] = useState(null)

	// Pagination States
	const [first, setFirst] = useState(0)
	const [rows, setRows] = useState(10)

	// Modal States for Loan Detail Ledger
	const [modalVisible, setModalVisible] = useState(false)
	const [modalLoading, setModalLoading] = useState(false)
	const [selectedItemDtls, setSelectedItemDtls] = useState(null)
	const [ledgerTransactions, setLedgerTransactions] = useState([])

	// Fetch Branch List on Load
	const handleFetchBranchList = async () => {
		const tokenValue = await getLocalStoreTokenDts(navigate)
		try {
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
					.filter((item) => item.code && !isHeadOffice(item.code, item.name))
				setBranches(list)
				if (isBranchUser && userBranchCode && !selectedBranch && !isHeadOffice(userBranchCode, userBranchName)) {
					const matched = list.find((b) => String(b.code) === String(userBranchCode))
					if (matched) {
						setSelectedBranch(`${matched.code},${matched.name}`)
					}
				}
				return
			}
		} catch (err) {
			console.warn("Could not fetch via dashboard branch endpoint, trying fallback...", err)
		}

		// Fallback to fetch_branch_society_list
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

			if (res?.data?.suc === 1 && Array.isArray(res?.data?.msg)) {
				const list = res.data.msg
					.map((item) => ({
						code: String(item.code || item.branch_code || item.branch_id || ""),
						name: item.name || item.branch_name || "",
					}))
					.filter((item) => item.code && !isHeadOffice(item.code, item.name))
				setBranches(list)
				if (isBranchUser && userBranchCode && !selectedBranch && !isHeadOffice(userBranchCode, userBranchName)) {
					const matched = list.find((b) => String(b.code) === String(userBranchCode))
					if (matched) {
						setSelectedBranch(`${matched.code},${matched.name}`)
					}
				}
			} else if (isBranchUser && userBranchCode && !isHeadOffice(userBranchCode, userBranchName)) {
				setBranches([{ code: userBranchCode, name: userBranchName || `Branch ${userBranchCode}` }])
			}
		} catch (err) {
			console.error("Fetch branch list error:", err)
			if (isBranchUser && userBranchCode && !isHeadOffice(userBranchCode, userBranchName)) {
				setBranches([{ code: userBranchCode, name: userBranchName || `Branch ${userBranchCode}` }])
			}
		}
	}


	// Fetch all Societies / PACS directly when Search Mode is SOCIETY (no branch needed)
	const handleFetchAllSocieties = async () => {
		setLoadingPacs(true)
		setPacsList([])
		setSelectedPacs("")
		const tokenValue = await getLocalStoreTokenDts(navigate)
		try {
			const res = await axios.get(`${url_bdccb}/dashboard/fetch_brn_soc_name`, {
				params: { select_type: "P" },
				headers: {
					Authorization: `${tokenValue?.token}`,
					"Content-Type": "application/json",
				},
			})
			if (res?.data?.success && Array.isArray(res?.data?.data) && res.data.data.length > 0) {
				const list = res.data.data.map((item) => ({
					code: String(item.branch_id || item.code || ""),
					name: String(item.branch_name || item.name || ""),
				}))
				setPacsList(list)
				setLoadingPacs(false)
				return
			}
		} catch (err) {
			console.warn("Could not fetch via dashboard society endpoint, trying fallback...", err)
		}

		try {
			const res = await axios.post(
				`${url}/fetch_branch_society_list`,
				{
					branch_type: "P",
					tenant_id: String(userDetails?.tenant_id || 1),
				},
				{
					headers: {
						Authorization: `${tokenValue?.token}`,
						"Content-Type": "application/json",
					},
				}
			)
			if (res?.data?.suc === 1 && Array.isArray(res?.data?.msg)) {
				const list = res.data.msg.map((item) => ({
					code: String(item.code || item.branch_code || item.branch_id || ""),
					name: String(item.name || item.branch_name || ""),
				}))
				setPacsList(list)
			}
		} catch (err) {
			console.error("Fetch all societies error:", err)
		}
		setLoadingPacs(false)
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

	const currentSearchModeOptions = useMemo(() => {
		return txnType === "R" ? searchModeRecovOptions : searchModeDisbOptions
	}, [txnType])

	// Sub-mode / Target Options: "Disburse To" when txnType === "D", "Recovery To" when txnType === "R"
	const targetOptions = useMemo(() => {
		if (txnType === "R") {
			// Recovery To Options
			if (searchMode === "SHG_MEMBER") {
				return [{ label: "Group", value: "GROUP" }]
			}
			if (searchMode === "SHG") {
				return [
					{ label: "Society", value: "SOCIETY" },
					{ label: "Branch", value: "BRANCH" },
				]
			}
			if (searchMode === "SOCIETY") {
				return [{ label: "Branch", value: "BRANCH" }]
			}
			return []
		}

		// Disbursement Disburse To Options
		if (searchMode === "CCB") {
			return [
				{ label: "Society", value: "SOCIETY" },
				{ label: "Group", value: "GROUP" },
			]
		}
		if (searchMode === "SOCIETY") {
			return [{ label: "Member", value: "MEMBER" }]
		}
		if (searchMode === "SHG") {
			return [{ label: "Member", value: "MEMBER" }]
		}
		return []
	}, [txnType, searchMode])

	const showBranchSelect = useMemo(() => {
		return true
	}, [])

	const showPacsSelect = useMemo(() => {
		return false
	}, [])

	const isCcbToSociety = useMemo(() => {
		return txnType === "D"
	}, [txnType])

	const showSocietyNameCol = useMemo(() => {
		if (txnType === "D") {
			if (searchMode === "CCB") {
				return disburseTo === "SOCIETY"
			}
			return true
		}
		return false
	}, [txnType, searchMode, disburseTo])

	const showMemberNameCol = useMemo(() => {
		return txnType === "D" && (searchMode === "SOCIETY" || searchMode === "SHG") && disburseTo === "MEMBER"
	}, [txnType, searchMode, disburseTo])

	const showCcbLoanIdCol = useMemo(() => {
		return txnType === "D" && (searchMode === "SOCIETY" || searchMode === "SHG") && disburseTo === "MEMBER"
	}, [txnType, searchMode, disburseTo])

	const showRecoverySocietyCol = useMemo(() => {
		if (txnType !== "R") return false
		if (searchMode === "SHG") {
			return disburseTo === "SOCIETY"
		}
		if (searchMode === "SOCIETY") {
			return true
		}
		return false
	}, [txnType, searchMode, disburseTo])

	const disbursementModeLabel = useMemo(() => {
		if (txnType !== "D") return ""
		if (searchMode === "CCB") {
			return disburseTo === "SOCIETY" ? "CCB → Society" : "CCB → SHG"
		}
		if (searchMode === "SOCIETY") {
			return disburseTo === "MEMBER" ? "Society → Member" : "Society"
		}
		if (searchMode === "SHG") {
			return disburseTo === "MEMBER" ? "SHG → Member" : "SHG"
		}
		return `${searchMode} → ${disburseTo}`
	}, [txnType, searchMode, disburseTo])

	const recoveryModeLabel = useMemo(() => {
		if (txnType !== "R") return ""
		if (searchMode === "SHG_MEMBER") {
			return "SHG Member → Group"
		}
		if (searchMode === "SHG") {
			return disburseTo === "BRANCH" ? "SHG → Branch" : "SHG → Society"
		}
		if (searchMode === "SOCIETY") {
			return "Society → Branch"
		}
		return `${searchMode} → ${disburseTo}`
	}, [txnType, searchMode, disburseTo])

	useEffect(() => {
		if (showPacsSelect) {
			handleFetchAllSocieties()
		}
	}, [showPacsSelect])

	const branchOptions = useMemo(() => {
		const filtered = branches.filter((b) => !isHeadOffice(b.code, b.name))
		const sorted = [...filtered].sort((a, b) => {
			const codeA = parseInt(a.code || 0, 10)
			const codeB = parseInt(b.code || 0, 10)
			if (!isNaN(codeA) && !isNaN(codeB) && codeA !== codeB) {
				return codeA - codeB
			}
			return String(a.name || "").localeCompare(String(b.name || ""))
		})

		const list = sorted.map((item) => ({
			code: String(item.code),
			name: item.code ? `${item.code} - ${item.name}` : item.name,
		}))

		return [{ code: "", name: "Select Branch" }, ...list]
	}, [branches])

	const handleSearchModeChange = (val) => {
		setSearchMode(val)
		setSelectedPacs("")
		setPacsList([])
		setTransactionData([])
		setMetadataDtls(null)
		setHasSearched(false)
		setFirst(0)
		setSearchTerm("")

		if (txnType === "R") {
			if (val === "SHG_MEMBER") {
				setDisburseTo("GROUP")
			} else if (val === "SHG") {
				setDisburseTo("SOCIETY")
			} else if (val === "SOCIETY") {
				setDisburseTo("BRANCH")
			}
			if (branches.length === 0) {
				handleFetchBranchList()
			}
		} else {
			if (val === "CCB") {
				setDisburseTo("SOCIETY")
			} else if (val === "SOCIETY") {
				setDisburseTo("MEMBER")
				if (branches.length === 0) {
					handleFetchBranchList()
				}
			} else if (val === "SHG") {
				setDisburseTo("MEMBER")
				if (branches.length === 0) {
					handleFetchBranchList()
				}
			}
		}
	}

	const handleSubModeChange = (val) => {
		setDisburseTo(val)
		setTransactionData([])
		setMetadataDtls(null)
		setHasSearched(false)
		setFirst(0)
		if (branches.length === 0) {
			handleFetchBranchList()
		}
	}

	const handleTxnTypeChange = (val) => {
		setTxnType(val)
		setTransactionData([])
		setMetadataDtls(null)
		setHasSearched(false)
		setFirst(0)

		if (val === "R") {
			// Switch to Recovery: default to SHG_MEMBER -> GROUP
			if (searchMode === "CCB" || !["SHG_MEMBER", "SHG", "SOCIETY"].includes(searchMode)) {
				setSearchMode("SHG_MEMBER")
				setDisburseTo("GROUP")
			} else if (searchMode === "SHG_MEMBER") {
				setDisburseTo("GROUP")
			} else if (searchMode === "SHG") {
				setDisburseTo("SOCIETY")
			} else if (searchMode === "SOCIETY") {
				setDisburseTo("BRANCH")
			}
			if (branches.length === 0) {
				handleFetchBranchList()
			}
		} else {
			// Switch to Disbursement: default to CCB -> SOCIETY
			if (searchMode === "SHG_MEMBER" || !["CCB", "SOCIETY", "SHG"].includes(searchMode)) {
				setSearchMode("CCB")
				setDisburseTo("SOCIETY")
			} else if (searchMode === "CCB") {
				setDisburseTo("SOCIETY")
			} else if (searchMode === "SOCIETY") {
				setDisburseTo("MEMBER")
				if (branches.length === 0) {
					handleFetchBranchList()
				}
			} else if (searchMode === "SHG") {
				setDisburseTo("MEMBER")
			}
		}
	}

	const handleBranchChange = (e) => {
		const value = e?.target?.value !== undefined ? e.target.value : e
		if (!value || value === "") {
			setSelectedBranch("")
			setPacsList([])
			setSelectedPacs("")
			setTransactionData([])
			setMetadataDtls(null)
			setHasSearched(false)
			return
		}

		const selected = branches.find((b) => String(b.code) === String(value))
		const brCode = selected ? selected.code : value
		const brName = selected ? selected.name : ""

		setSelectedBranch(`${brCode},${brName}`)
		setSelectedPacs("")
		setTransactionData([])
		setMetadataDtls(null)
		setHasSearched(false)

		if (searchMode === "SOCIETY") {
			handleFetchPacsList(brCode)
		}
	}

	const handlePacsChange = (e) => {
		const value = e?.target?.value !== undefined ? e.target.value : e
		setSelectedPacs(value || "")
		setTransactionData([])
		setMetadataDtls(null)
		setHasSearched(false)
	}

	const handleFromDateChange = (e) => {
		const val = e?.target?.value !== undefined ? e.target.value : e
		setFromDate(val || "")
	}

	const handleToDateChange = (e) => {
		const val = e?.target?.value !== undefined ? e.target.value : e
		setToDate(val || "")
	}

	// Validation for Fetch button
	const isFetchEnabled = useMemo(() => {
		const hasBranch = Boolean(
			selectedBranch && selectedBranch.trim() !== "" && selectedBranch.split(",")[0] !== ""
		)
		const hasPacs = Boolean(selectedPacs && selectedPacs.trim() !== "")
		const hasDates = Boolean(fromDate && toDate)

		if (showBranchSelect) {
			return hasBranch && hasDates
		}
		if (showPacsSelect) {
			return hasPacs && hasDates
		}
		return hasDates
	}, [showBranchSelect, showPacsSelect, selectedBranch, selectedPacs, fromDate, toDate])

	// Main Fetch Loan Transaction Report API Call
	const handleSearchLoanTransactions = async () => {
		if (!isFetchEnabled) return

		setLoading(true)
		setHasSearched(true)
		setTransactionData([])
		setMetadataDtls(null)
		setFirst(0)
		setSearchTerm("")

		const selectedBrnCode = selectedBranch ? selectedBranch.split(",")[0] : userBranchCode
		const selectedBrnName = selectedBranch ? selectedBranch.split(",")[1] : userBranchName
		const selectedPacsObj = pacsList.find((p) => String(p.code) === String(selectedPacs))
		const selectedPacsName = selectedPacsObj ? selectedPacsObj.name : ""

		const tokenValue = await getLocalStoreTokenDts(navigate)

		try {
			// Query disbursement / recovery / loan transactions according to the selected mode
			let resultsList = []

			if (txnType === "D") {
				if (searchMode === "CCB") {
					if (disburseTo === "SOCIETY") {
						// CCB to Society Disbursement (Fetched from td_loan, td_loan_transactions, td_loan_ccb, and td_loan_ccb_trans)
						try {
							const disbRes = await axios.post(`${url_bdccb}/report/get_ccb_to_society_disburs_dtls`, {
								from_dt: fromDate,
								to_dt: toDate,
								branch_id: selectedBrnCode,
								mode: "CCB",
								disburse_to: "P",
								trans_type: "D",
								tenant_id: userDetails?.tenant_id || 1,
							}, {
								headers: {
									Authorization: `${tokenValue?.token}`,
									"Content-Type": "application/json",
								},
							})
							const responseData = Array.isArray(disbRes?.data?.data)
								? disbRes.data.data
								: (Array.isArray(disbRes?.data?.msg) ? disbRes.data.msg : [])
							if ((disbRes?.data?.success || disbRes?.data?.suc === 1) && responseData.length > 0) {
								const formattedDisb = responseData.map((item, idx) => ({
									id: `D_CCB_SOC_${item.loan_id}_${idx}`,
									loan_id: item.loan_id,
									trans_no: item.trans_id || item.loan_id,
									trans_date: item.trans_date || item.disb_dt,
									disb_dt: item.disb_dt || null,
									trans_type: "D",
									trans_type_text: "Disbursement",
									branch_shg_id: item.branch_shg_id,
									branch_shg_name: item.branch_shg_name || "N/A",
									group_code: item.group_code || "N/A",
									group_name: item.group_name || "N/A",
									member_name: "N/A",
									account_no: item.loan_ac_no || item.loan_id || "N/A",
									period: item.period || 0,
									curr_roi: item.curr_roi || 0,
									penal_roi: item.penal_roi || 0,
									start_date: item.start_date || item.rep_start_dt || null,
									end_date: item.end_date || item.rep_end_dt || null,
									disb_amt: Number(item.disb_amt !== undefined ? item.disb_amt : (item.dr_amt || 0)),
									dr_amt: Number(item.dr_amt !== undefined ? item.dr_amt : (item.disb_amt || 0)),
									debit_amt: Number(item.dr_amt !== undefined ? item.dr_amt : (item.disb_amt || 0)),
									credit_amt: 0,
									current_balance: Number(item.current_balance !== undefined ? item.current_balance : (item.dr_amt || item.disb_amt || 0)),
									outstanding_amt: Number(item.current_balance !== undefined ? item.current_balance : (item.dr_amt || item.disb_amt || 0)),
									branch_code: item.branch_shg_id || selectedBrnCode,
									branch_name: item.branch_shg_name || selectedBrnName,
									pacs_name: item.branch_shg_name || "Society",
								}))
								resultsList = [...resultsList, ...formattedDisb]
							}
						} catch (e) {
							console.warn("CCB to Society disb fetch warning:", e)
						}
					} else {
						// CCB to Group (Direct SHG) loan transactions
						try {
							const disbRes = await axios.post(`${url_bdccb}/report/get_ccb_to_society_disburs_dtls`, {
								from_dt: fromDate,
								to_dt: toDate,
								branch_id: selectedBrnCode,
								mode: "CCB",
								disburse_to: "S",
								trans_type: "D",
								tenant_id: userDetails?.tenant_id || 1,
							}, {
								headers: {
									Authorization: `${tokenValue?.token}`,
									"Content-Type": "application/json",
								},
							})
							const responseData = Array.isArray(disbRes?.data?.data)
								? disbRes.data.data
								: (Array.isArray(disbRes?.data?.msg) ? disbRes.data.msg : [])
							if ((disbRes?.data?.success || disbRes?.data?.suc === 1) && responseData.length > 0) {
								const formattedDisb = responseData.map((item, idx) => ({
									id: `D_CCB_SHG_${item.loan_id}_${idx}`,
									loan_id: item.loan_id,
									trans_no: item.trans_id,
									trans_date: item.trans_date,
									disb_dt: item.disb_dt || null,
									trans_type: "D",
									trans_type_text: "Disbursement",
									branch_shg_id: item.branch_shg_id,
									branch_shg_name: item.branch_shg_name || "N/A",
									group_code: item.group_code || "N/A",
									group_name: item.group_name || "N/A",
									member_name: "N/A",
									account_no: item.loan_ac_no || item.loan_id || "N/A",
									period: item.period || 0,
									curr_roi: item.curr_roi || 0,
									penal_roi: item.penal_roi || 0,
									start_date: item.start_date || item.rep_start_dt || null,
									end_date: item.end_date || item.rep_end_dt || null,
									disb_amt: Number(item.disb_amt !== undefined ? item.disb_amt : (item.dr_amt || 0)),
									dr_amt: Number(item.dr_amt !== undefined ? item.dr_amt : (item.disb_amt || 0)),
									debit_amt: Number(item.dr_amt !== undefined ? item.dr_amt : (item.disb_amt || 0)),
									credit_amt: 0,
									current_balance: Number(item.current_balance !== undefined ? item.current_balance : (item.dr_amt || item.disb_amt || 0)),
									outstanding_amt: Number(item.current_balance !== undefined ? item.current_balance : (item.dr_amt || item.disb_amt || 0)),
									branch_code: item.branch_shg_id || selectedBrnCode,
									branch_name: item.branch_shg_name || selectedBrnName,
									pacs_name: item.branch_shg_name || "Direct CCB",
								}))
								resultsList = [...resultsList, ...formattedDisb]
							}
						} catch (e) {
							console.warn("Direct CCB to SHG disb fetch warning:", e)
						}
					}
				} else if (searchMode === "SHG" || searchMode === "SOCIETY") {
					// Member Level Disbursement under Selected Society/PACS or Branch
					const targetBranchId = selectedBrnCode
					const targetBranchName = selectedBrnName
					const targetDisburseTo = searchMode === "SOCIETY" ? "P" : "S"

					try {
						const res = await axios.post(
							`${url_bdccb}/report/get_loan_member_disburs_dtls`,
							{
								from_dt: fromDate,
								to_dt: toDate,
								branch_id: targetBranchId,
								tenant_id: userDetails?.tenant_id || 1,
								trans_type: "D",
								mode: searchMode,
								disburse_to: targetDisburseTo,
							},
							{
								headers: {
									Authorization: `${tokenValue?.token}`,
									"Content-Type": "application/json",
								},
							}
						)

						const responseData = Array.isArray(res?.data?.data)
							? res.data.data
							: (Array.isArray(res?.data?.msg) ? res.data.msg : [])

						if ((res?.data?.success || res?.data?.suc === 1) && responseData.length > 0) {
							const formattedList = responseData.map((item, idx) => ({
								id: `MEM_${item.loan_id}_${idx}`,
								loan_id: item.loan_id,
								ccb_loan_id: item.ccb_loan_id,
								trans_no: item.trans_id || item.loan_id,
								trans_date: item.trans_date || item.disb_dt,
								disb_dt: item.disb_dt || null,
								trans_type: "D",
								trans_type_text: "Disbursement",
								branch_shg_id: item.branch_shg_id,
								branch_shg_name: item.branch_shg_name || targetBranchName,
								group_code: item.group_code || "N/A",
								group_name: item.group_name || "N/A",
								member_code: item.member_code || "N/A",
								member_name: item.member_name || "N/A",
								account_no: item.loan_acc_no || item.loan_id || "N/A",
								period: item.period || 0,
								period_mode: item.period_mode || "N/A",
								curr_roi: item.curr_roi || 0,
								penal_roi: item.penal_roi || 0,
								start_date: item.start_date || null,
								end_date: item.end_date || null,
								disb_amt: Number(item.disb_amt !== undefined ? item.disb_amt : (item.dr_amt || 0)),
								dr_amt: Number(item.dr_amt !== undefined ? item.dr_amt : (item.disb_amt || 0)),
								debit_amt: Number(item.dr_amt !== undefined ? item.dr_amt : (item.disb_amt || 0)),
								credit_amt: 0,
								current_balance: Number(item.current_balance !== undefined ? item.current_balance : 0),
								outstanding_amt: Number(item.current_balance !== undefined ? item.current_balance : 0),
								branch_code: item.branch_shg_id || targetBranchId,
								branch_name: item.branch_shg_name || targetBranchName,
								pacs_name: item.branch_shg_name || targetBranchName,
							}))
							resultsList = [...resultsList, ...formattedList]
						}
					} catch (e) {
						console.warn("Member disb fetch warning:", e)
					}
				}
			} else {
				// RECOVERY (txnType === "R")
				if (searchMode === "SHG") {
					// SHG -> Branch (S) or Society (P)
					const recoveryToTarget = (disburseTo === "BRANCH" || disburseTo === "S") ? "S" : "P";
					try {
						const recovRes = await axios.post(
							`${url_bdccb}/report/get_shg_recovery_dtls`,
							{
								branch_id: selectedBrnCode,
								tenant_id: String(userDetails?.tenant_id || 1),
								from_dt: fromDate,
								to_dt: toDate,
								trans_type: "R",
								mode: "SHG",
								recovery_to: recoveryToTarget,
								approval_status: "A",
							},
							{
								headers: {
									Authorization: `${tokenValue?.token}`,
									"Content-Type": "application/json",
								},
							}
						)
						const responseData = Array.isArray(recovRes?.data?.data)
							? recovRes.data.data
							: (Array.isArray(recovRes?.data?.msg) ? recovRes.data.msg : [])
						if ((recovRes?.data?.success || recovRes?.data?.suc === 1) && responseData.length > 0) {
							const formattedRecov = responseData.map((item, idx) => ({
								id: `R_SHG_${item.trans_id || item.transaction_id || item.loan_id}_${idx}`,
								loan_id: item.loan_id,
								ccb_loan_id: item.ccb_loan_id || item.loan_id || "N/A",
								trans_no: item.trans_id || item.transaction_id || item.payment_id || item.loan_id,
								trans_date: item.trans_dt || item.trans_date || item.payment_dt || item.created_at,
								trans_type: item.trans_type || "R",
								trans_type_text: "Recovery",
								branch_shg_id: item.branch_shg_id,
								branch_shg_name: item.branch_shg_name || selectedBrnName,
								branch_shg_name_with_id: item.branch_shg_name_with_id || (item.branch_shg_name ? `${item.branch_shg_name} (${item.branch_shg_id})` : selectedBrnName),
								group_code: item.group_code || item.shg_id || "N/A",
								group_name: item.group_name || selectedBrnName,
								member_name: item.member_name || "N/A",
								account_no: item.loan_acc_no || item.acc_no || item.loan_id || "N/A",
								period: item.period || 0,
								curr_roi: item.curr_roi || 0,
								penal_roi: item.penal_roi || 0,
								debit_amt: Number(item.dr_amt || item.debit_amt || 0),
								credit_amt: Number(item.credit_amount || item.cr_amt || item.paid_amt || 0),
								current_balance: Number(item.current_balance || item.outstanding_amt || item.curr_prn || 0),
								outstanding_amt: Number(item.outstanding_amt || item.current_balance || item.curr_prn || item.balance || 0),
								branch_code: item.branch_id || selectedBrnCode,
								branch_name: item.branch_name || selectedBrnName,
								pacs_name: item.branch_shg_name || selectedBrnName,
							}))
							resultsList = [...resultsList, ...formattedRecov]
						}
					} catch (e) {
						console.warn("SHG recovery fetch warning:", e)
					}
				} else if (searchMode === "SOCIETY") {
					// Society -> Branch (CCB level)
					try {
						const socCcbRecovRes = await axios.post(
							`${url_bdccb}/report/get_society_recovery_dtls`,
							{
								from_dt: fromDate,
								to_dt: toDate,
								branch_id: selectedBrnCode || "",
								mode: "society",
								recovery_to: "P",
								trans_type: "R",
								trans_typ: "R",
								tenant_id: String(userDetails?.tenant_id || 1),
								approval_status: "A",
							},
							{
								headers: {
									Authorization: `${tokenValue?.token}`,
									"Content-Type": "application/json",
								},
							}
						)
						const responseData = Array.isArray(socCcbRecovRes?.data?.data)
							? socCcbRecovRes.data.data
							: (Array.isArray(socCcbRecovRes?.data?.msg) ? socCcbRecovRes.data.msg : [])
						if ((socCcbRecovRes?.data?.success || socCcbRecovRes?.data?.suc === 1) && responseData.length > 0) {
							const formattedSocCcb = responseData.map((item, idx) => ({
								id: `SR_${item.trans_id || item.transaction_id || item.loan_id}_${idx}`,
								loan_id: item.loan_id,
								ccb_loan_id: item.ccb_loan_id || item.loan_id || "N/A",
								trans_no: item.trans_id || item.transaction_id || item.loan_id,
								trans_date: item.trans_dt || item.trans_date || item.payment_dt,
								trans_type: item.trans_type || "R",
								trans_type_text: "Recovery",
								branch_shg_id: item.branch_shg_id,
								branch_shg_name: item.branch_shg_name || item.pacs_name || selectedBrnName,
								branch_shg_name_with_id: item.branch_shg_name_with_id || (item.branch_shg_name ? `${item.branch_shg_name} (${item.branch_shg_id})` : selectedBrnName),
								group_code: item.group_code || "N/A",
								group_name: item.group_name || selectedBrnName,
								member_name: item.member_name || "N/A",
								account_no: item.loan_acc_no || item.loan_ac_no || item.acc_no || item.loan_id || "N/A",
								period: item.period || 0,
								curr_roi: item.curr_roi || 0,
								penal_roi: item.penal_roi || 0,
								debit_amt: Number(item.dr_amt || item.debit_amt || 0),
								credit_amt: Number(item.credit_amount || item.cr_amt || item.paid_amt || 0),
								current_balance: Number(item.current_balance || item.outstanding_amt || item.curr_prn || 0),
								outstanding_amt: Number(item.outstanding_amt || item.current_balance || item.curr_prn || item.balance || 0),
								branch_code: item.branch_id || selectedBrnCode,
								branch_name: item.branch_name || selectedBrnName,
								pacs_name: item.branch_shg_name || item.pacs_name || selectedBrnName,
							}))
							resultsList = [...resultsList, ...formattedSocCcb]
						}
					} catch (e) {
						console.warn("Society CCB recov fetch warning:", e)
					}
				} else if (searchMode === "SHG_MEMBER") {
					// SHG Member -> Group
					try {
						const grpRecovRes = await axios.post(
							`${url_bdccb}/report/get_loan_member_recovery_dtls`,
							{
								from_dt: fromDate,
								to_dt: toDate,
								tenant_id: userDetails?.tenant_id || 1,
								branch_id: selectedBrnCode,
								trans_type: "R",
								mode: "shg members",
								recovery_to: ["P", "S"],
							},
							{
								headers: {
									Authorization: `${tokenValue?.token}`,
									"Content-Type": "application/json",
								},
							}
						)
						if (grpRecovRes?.data?.success && Array.isArray(grpRecovRes?.data?.data)) {
							const formattedGrp = grpRecovRes.data.data.map((item, idx) => ({
								id: `GR_${item.trans_id || item.transaction_id || item.loan_id}_${idx}`,
								loan_id: item.loan_id,
								ccb_loan_id: item.ccb_loan_id || "N/A",
								trans_no: item.trans_id || item.transaction_id || item.loan_id,
								trans_date: item.trans_date || item.trans_dt,
								trans_type: item.trans_type || "R",
								trans_type_text: "Recovery",
								group_code: item.group_code || "N/A",
								group_name: item.group_name || "N/A",
								member_name: item.member_name || "N/A",
								account_no: item.loan_acc_no || item.acc_no || item.loan_id || "N/A",
								period: item.period || 0,
								curr_roi: item.curr_roi || 0,
								debit_amt: Number(item.dr_amt || item.debit_amt || 0),
								credit_amt: Number(item.cr_amt || item.credit_amount || item.paid_amt || 0),
								outstanding_amt: Number(item.balance || item.disb_amt || 0),
								branch_code: item.branch_shg_id || selectedBrnCode,
								branch_name: item.branch_shg_name || selectedBrnName,
								pacs_name: item.branch_shg_name || selectedBrnName,
							}))
							resultsList = [...resultsList, ...formattedGrp]
						}
					} catch (e) {
						console.warn("Group member recov fetch warning:", e)
					}
				}
			}

			// Sort by date descending
			resultsList.sort((a, b) => new Date(b.trans_date) - new Date(a.trans_date))

			if (resultsList.length > 0) {
				setTransactionData(resultsList)
				setMetadataDtls({
					search_mode: searchMode,
					txn_type: txnType,
					report_type: reportType,
					from_date: fromDate,
					to_date: toDate,
					branch_code: selectedBrnCode,
					branch_name: selectedBrnName || "Branch",
					pacs_name: selectedBrnName,
					total_records: resultsList.length,
				})
			} else {
				Message("warning", "No loan transaction records found for the selected criteria.")
				setTransactionData([])
			}
		} catch (err) {
			console.error("Loan Transaction Report error:", err)
			Message("error", "Error fetching loan transaction report details.")
			setTransactionData([])
		}
		setLoading(false)
	}

	// Fetch detailed ledger statement for specific loan
	const handleViewLoanLedger = async (record) => {
		setSelectedItemDtls(record)
		setModalVisible(true)
		setModalLoading(true)
		setLedgerTransactions([])

		const tokenValue = await getLocalStoreTokenDts(navigate)
		const payload = {
			loan_id: record?.loan_id,
			loan_to: searchMode === "SOCIETY" ? "P" : "B",
			from_date: fromDate,
			to_date: toDate,
			tenant_id: userDetails?.tenant_id || 1,
		}

		try {
			const res = await axios.post(`${url_bdccb}/report/fetch_loan_transaction_details`, payload, {
				headers: {
					Authorization: `${tokenValue?.token}`,
					"Content-Type": "application/json",
				},
			})

			if (res?.data?.suc === 1 && Array.isArray(res?.data?.msg) && res.data.msg.length > 0) {
				setLedgerTransactions(res.data.msg)
			} else {
				// Provide fallback row from record if detailed ledger is empty
				setLedgerTransactions([
					{
						trans_id: record?.trans_no || "N/A",
						trans_date: record?.trans_date || "N/A",
						tr_type: record?.trans_type || "N/A",
						debit_amt: record?.debit_amt || 0,
						credit_amt: record?.credit_amt || 0,
						outstanding_amt: record?.outstanding_amt || 0,
						approved_by: "Branch",
						approval_status: "A",
					},
				])
			}
		} catch (err) {
			console.error("Fetch detailed ledger error:", err)
			setLedgerTransactions([
				{
					trans_id: record?.trans_no || "N/A",
					trans_date: record?.trans_date || "N/A",
					tr_type: record?.trans_type || "N/A",
					debit_amt: record?.debit_amt || 0,
					credit_amt: record?.credit_amt || 0,
					outstanding_amt: record?.outstanding_amt || 0,
					approved_by: "Branch",
					approval_status: "A",
				},
			])
		}
		setModalLoading(false)
	}

	// Filter data by live search text
	const filteredData = useMemo(() => {
		if (!searchTerm || !searchTerm.trim()) return transactionData
		const q = searchTerm.toLowerCase().trim()
		return transactionData.filter((item) => {
			const gCode = String(item?.group_code || "").toLowerCase()
			const gName = String(item?.group_name || "").toLowerCase()
			const mName = String(item?.member_name || "").toLowerCase()
			const accNo = String(item?.account_no || "").toLowerCase()
			const transNo = String(item?.trans_no || "").toLowerCase()
			const ccbLoanId = String(item?.ccb_loan_id || "").toLowerCase()
			const loanId = String(item?.loan_id || "").toLowerCase()

			return (
				gCode.includes(q) ||
				gName.includes(q) ||
				mName.includes(q) ||
				accNo.includes(q) ||
				transNo.includes(q) ||
				ccbLoanId.includes(q) ||
				loanId.includes(q)
			)
		})
	}, [transactionData, searchTerm])

	// Current page sliced data
	const currentData = useMemo(() => {
		return filteredData.slice(first, first + rows)
	}, [filteredData, first, rows])

	// Summary Statistics
	const stats = useMemo(() => {
		const total = filteredData.length
		const totalDebit = filteredData.reduce((sum, item) => sum + (item.dr_amt !== undefined ? item.dr_amt : (item.debit_amt || 0)), 0)
		const totalDisbAmt = filteredData.reduce((sum, item) => sum + (item.disb_amt !== undefined ? item.disb_amt : (item.debit_amt || 0)), 0)
		const totalCredit = filteredData.reduce((sum, item) => sum + (item.credit_amt || 0), 0)
		const totalOutstanding = filteredData.reduce((sum, item) => sum + (item.current_balance !== undefined ? item.current_balance : (item.outstanding_amt || 0)), 0)
		const disbCount = filteredData.filter((item) => item.trans_type === "D").length
		const recovCount = filteredData.filter((item) => item.trans_type === "R").length

		return { total, totalDebit, totalDisbAmt, totalCredit, totalOutstanding, disbCount, recovCount }
	}, [filteredData])

	// Export to Excel
	const handleExcelExport = async () => {
		if (!filteredData || filteredData.length === 0) return

		const workbook = new ExcelJS.Workbook()
		const worksheet = workbook.addWorksheet("Loan Transactions Report")

		// Title Row
		worksheet.mergeCells("A1:I1")
		const titleCell = worksheet.getCell("A1")
		titleCell.value = `BANKURA DISTRICT CENTRAL CO-OPERATIVE BANK - LOAN TRANSACTION REPORT`
		titleCell.font = { name: "Calibri", size: 14, bold: true, color: { argb: "FFFFFFFF" } }
		titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } }
		titleCell.alignment = { horizontal: "center", vertical: "middle" }

		// Metadata Subtitle Row
		worksheet.mergeCells("A2:I2")
		const metaCell = worksheet.getCell("A2")
		const isSocietyTarget = searchMode === "SOCIETY" || (searchMode === "SHG" && disburseTo === "SOCIETY")
		const locationLabel = isSocietyTarget
			? `Society: ${metadataDtls?.pacs_name || "N/A"}`
			: `Branch: ${metadataDtls?.branch_name || "N/A"}`
		metaCell.value = `Mode: ${searchMode}   |   ${locationLabel}   |   From: ${moment(fromDate).format("DD/MM/YYYY")} To: ${moment(toDate).format("DD/MM/YYYY")}   |   Total Txns: ${filteredData.length}`
		metaCell.font = { name: "Calibri", size: 10, italic: true, color: { argb: "FF334155" } }
		metaCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } }
		metaCell.alignment = { horizontal: "center", vertical: "middle" }

		worksheet.addRow([])

		// Table Headers
		let headers = []
		if (isCcbToSociety) {
			headers = [
				"Sl. No.",
				"Trans No.",
				"Trans Date",
				...(showSocietyNameCol ? ["Society Name"] : []),
				"Group Code & Name",
				...(showCcbLoanIdCol ? ["CCB Loan ID"] : []),
				"Loan ID",
				...(showMemberNameCol ? ["Member Name"] : []),
				"Loan A/C No.",
				"Period (Months)",
				"ROI (%)",
				"Penal ROI (%)",
				"Disbursement Date",
				"Disbursement Amount (₹)",
				"Start Date",
				"End Date",
				"Debit Amount (₹)",
				"Current Balance (₹)",
			]
		} else {
			headers = [
				"Sl. No.",
				"Trans No.",
				"Transaction Date",
				...(showRecoverySocietyCol ? ["Society Name"] : []),
				"CCB Loan ID",
				"Type",
				"Group Code",
				"Group Name",
				...(searchMode === "SHG_MEMBER" ? ["Member Name"] : []),
				"Loan A/C No.",
				"Credit (Recovery ₹)",
				"Current Balance (₹)",
			]
		}

		const headerRow = worksheet.addRow(headers)
		headerRow.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } }
		headerRow.eachCell((cell) => {
			cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } }
			cell.alignment = { horizontal: "center", vertical: "middle" }
		})

		// Data Rows
		filteredData.forEach((item, index) => {
			const groupCodeName = item?.group_code && item?.group_name && item.group_name !== "N/A"
				? `${item.group_code} - ${item.group_name}`
				: String(item?.group_name || item?.group_code || "N/A")

			let rowData = []
			if (isCcbToSociety) {
				rowData = [
					index + 1,
					String(item?.trans_no || "N/A"),
					item?.trans_date ? moment(item.trans_date).format("DD/MM/YYYY") : "N/A",
					...(showSocietyNameCol ? [
						item?.branch_shg_id
							? `${item?.branch_shg_name || item?.pacs_name || "N/A"} (${item.branch_shg_id})`
							: String(item?.branch_shg_name || item?.pacs_name || "N/A")
					] : []),
					groupCodeName,
					...(showCcbLoanIdCol ? [String(item?.ccb_loan_id || "N/A")] : []),
					String(item?.loan_id || "N/A"),
					...(showMemberNameCol ? [
						item?.member_name && item?.member_name !== "N/A"
							? `${item.member_name}${item?.member_code && item?.member_code !== "N/A" ? ` (${item.member_code})` : ""}`
							: "N/A"
					] : []),
					String(item?.account_no || "N/A"),
					Number(item?.period || 0),
					item?.curr_roi ? `${item.curr_roi}%` : "0%",
					item?.penal_roi ? `${item.penal_roi}%` : "0%",
					item?.disb_dt ? moment(item.disb_dt).format("DD/MM/YYYY") : "N/A",
					Number(item?.disb_amt !== undefined ? item.disb_amt : (item?.debit_amt || 0)),
					item?.start_date ? moment(item.start_date).format("DD/MM/YYYY") : "N/A",
					item?.end_date ? moment(item.end_date).format("DD/MM/YYYY") : "N/A",
					Number(item?.dr_amt !== undefined ? item.dr_amt : (item?.debit_amt || 0)),
					Number(item?.current_balance !== undefined ? item.current_balance : (item?.outstanding_amt || 0)),
				]
			} else {
				const branchSocName = item?.branch_shg_name_with_id || (item?.branch_shg_name
					? `${item.branch_shg_name} (${item.branch_shg_id})`
					: "N/A")

				rowData = [
					index + 1,
					String(item?.trans_no || "N/A"),
					item?.trans_date ? moment(item.trans_date).format("DD/MM/YYYY") : "N/A",
					...(showRecoverySocietyCol ? [branchSocName] : []),
					String(item?.ccb_loan_id || "N/A"),
					item?.trans_type_text || item?.trans_type || "Recovery",
					String(item?.group_code || "N/A"),
					String(item?.group_name || "N/A"),
					...(searchMode === "SHG_MEMBER" ? [
						item?.member_name && item?.member_name !== "N/A"
							? `${item.member_name}${item?.member_code && item?.member_code !== "N/A" ? ` (${item.member_code})` : ""}`
							: "N/A"
					] : []),
					String(item?.account_no || "N/A"),
					Number(item?.credit_amt || 0),
					Number(item?.current_balance !== undefined ? item.current_balance : (item?.outstanding_amt || 0)),
				]
			}
			const addedRow = worksheet.addRow(rowData)
			addedRow.getCell(1).alignment = { horizontal: "center" }
			addedRow.getCell(2).alignment = { horizontal: "center" }
			addedRow.getCell(3).alignment = { horizontal: "center" }
			if (isCcbToSociety) {
				const disbCol = headers.indexOf("Disbursement Amount (₹)") + 1
				if (disbCol > 0) addedRow.getCell(disbCol).numFmt = "₹#,##0.00"
				addedRow.getCell(headers.length - 1).numFmt = "₹#,##0.00"
				addedRow.getCell(headers.length).numFmt = "₹#,##0.00"
			} else {
				addedRow.getCell(headers.length - 1).numFmt = "₹#,##0.00"
				addedRow.getCell(headers.length).numFmt = "₹#,##0.00"
			}
		})

		// Total Row
		const totalRowArr = new Array(headers.length).fill("")
		totalRowArr[0] = "Total Summary"
		if (isCcbToSociety) {
			const disbIdx = headers.indexOf("Disbursement Amount (₹)")
			if (disbIdx >= 0) totalRowArr[disbIdx] = Number(stats.totalDisbAmt || stats.totalDebit || 0)
			totalRowArr[headers.length - 2] = Number(stats.totalDebit || 0)
			totalRowArr[headers.length - 1] = Number(stats.totalOutstanding || 0)
		} else {
			totalRowArr[headers.length - 2] = Number(stats.totalCredit || 0)
			totalRowArr[headers.length - 1] = Number(stats.totalOutstanding || 0)
		}
		const totalRow = worksheet.addRow(totalRowArr)
		totalRow.font = { name: "Calibri", size: 11, bold: true }
		if (isCcbToSociety) {
			const disbCol = headers.indexOf("Disbursement Amount (₹)") + 1
			if (disbCol > 0) totalRow.getCell(disbCol).numFmt = "₹#,##0.00"
			totalRow.getCell(headers.length - 1).numFmt = "₹#,##0.00"
			totalRow.getCell(headers.length).numFmt = "₹#,##0.00"
		} else {
			totalRow.getCell(headers.length - 1).numFmt = "₹#,##0.00"
			totalRow.getCell(headers.length).numFmt = "₹#,##0.00"
		}

		worksheet.columns.forEach((col) => {
			col.width = 20
		})

		const buffer = await workbook.xlsx.writeBuffer()
		const fileName = `Loan_Transaction_Report_${searchMode}_${moment().format("YYYYMMDD_HHmmss")}.xlsx`
		saveAs(new Blob([buffer]), fileName)
	}

	// Print Report View
	const handlePrintReport = () => {
		if (!filteredData || filteredData.length === 0) return

		const printWindow = window.open("", "_blank")
		const tableRowsHtml = filteredData
			.map((item, idx) =>
				isCcbToSociety
					? `
			<tr>
				<td style="text-align: center;">${idx + 1}</td>
				<td style="text-align: center; font-family: monospace; font-weight: bold;">${item?.trans_no || "N/A"}</td>
				<td style="text-align: center; font-family: monospace;">${item?.trans_date ? moment(item.trans_date).format("DD/MM/YYYY") : "N/A"}</td>
				${showSocietyNameCol ? `<td style="font-weight: 600; max-width: 220px; white-space: normal; line-height: 1.3;">${item?.branch_shg_name || item?.pacs_name || "N/A"}${item?.branch_shg_id ? ` (${item.branch_shg_id})` : ""}</td>` : ""}
				<td>
					<span style="font-family: monospace; font-weight: bold; color: #0f766e;">${item?.group_code || "N/A"}</span>
					${item?.group_name && item?.group_name !== "N/A" ? ` - <span style="font-weight: 600;">${item.group_name}</span>` : ""}
				</td>
				${showCcbLoanIdCol ? `<td style="text-align: center; font-family: monospace; font-weight: 600;">${item?.ccb_loan_id || "N/A"}</td>` : ""}
				<td style="text-align: center; font-family: monospace; font-weight: 600;">${item?.loan_id || "N/A"}</td>
				${showMemberNameCol ? `<td style="font-weight: 600;">${item?.member_name && item?.member_name !== "N/A" ? `${item.member_name}${item?.member_code && item?.member_code !== "N/A" ? ` (${item.member_code})` : ""}` : "-"}</td>` : ""}
				<td style="text-align: center; font-family: monospace;">${item?.account_no || "N/A"}</td>
				<td style="text-align: center; font-family: monospace;">${item?.period ? `${item.period} M` : "-"}</td>
				<td style="text-align: center; font-family: monospace;">${item?.curr_roi ? `${item.curr_roi}%` : "-"}</td>
				<td style="text-align: center; font-family: monospace;">${item?.penal_roi ? `${item.penal_roi}%` : "0%"}</td>
				<td style="text-align: center; font-family: monospace;">${item?.disb_dt ? moment(item.disb_dt).format("DD/MM/YYYY") : "-"}</td>
				<td style="text-align: right; font-family: monospace; font-weight: bold; color: #334155;">₹${Number(item?.disb_amt !== undefined ? item.disb_amt : (item?.debit_amt || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
				<td style="text-align: center; font-family: monospace;">${item?.start_date ? moment(item.start_date).format("DD/MM/YYYY") : "-"}</td>
				<td style="text-align: center; font-family: monospace;">${item?.end_date ? moment(item.end_date).format("DD/MM/YYYY") : "-"}</td>
				<td style="text-align: right; font-family: monospace; font-weight: bold; color: #047857;">₹${Number(item?.dr_amt !== undefined ? item.dr_amt : (item?.debit_amt || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
				<td style="text-align: right; font-family: monospace; font-weight: bold; color: #0f766e;">₹${Number(item?.current_balance !== undefined ? item.current_balance : (item?.outstanding_amt || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
			</tr>
		`
					: `
			<tr>
				<td style="text-align: center;">${idx + 1}</td>
				<td style="text-align: center; font-family: monospace; font-weight: bold;">${item?.trans_no || "N/A"}</td>
				<td style="text-align: center; font-family: monospace;">${item?.trans_date ? moment(item.trans_date).format("DD/MM/YYYY") : "N/A"}</td>
				${showRecoverySocietyCol ? `<td>${item?.branch_shg_name_with_id || (item?.branch_shg_name ? `${item.branch_shg_name} (${item.branch_shg_id})` : "N/A")}</td>` : ""}
				<td style="text-align: center; font-family: monospace; font-weight: bold;">${item?.ccb_loan_id || "N/A"}</td>
				<td style="text-align: center; font-weight: bold; color: ${item?.trans_type === "D" ? "#047857" : "#b91c1c"};">${item?.trans_type_text || item?.trans_type || "Recovery"}</td>
				<td style="font-family: monospace;">${item?.group_code || "N/A"}</td>
				<td style="font-weight: 600;">${item?.group_name || "N/A"}</td>
				${searchMode === "SHG_MEMBER" ? `<td>${item?.member_name && item?.member_name !== "N/A" ? `${item.member_name}${item?.member_code && item?.member_code !== "N/A" ? ` (${item.member_code})` : ""}` : "-"}</td>` : ""}
				<td style="text-align: center; font-family: monospace;">${item?.account_no || "N/A"}</td>
				<td style="text-align: right; font-family: monospace; font-weight: bold; color: #b91c1c;">₹${Number(item?.credit_amt || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
				<td style="text-align: right; font-family: monospace; font-weight: bold; color: #0f766e;">₹${Number(item?.current_balance !== undefined ? item.current_balance : (item?.outstanding_amt || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
			</tr>
		`
			)
			.join("")

		const htmlContent = `
			<!DOCTYPE html>
			<html>
			<head>
				<title>Loan Transaction Report - BDCCB</title>
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
					<h2>BANKURA DISTRICT CENTRAL CO-OPERATIVE BANK LTD.</h2>
					<p>SHG Loan Transaction Report (Disbursement & Recovery)</p>
				</div>
				<div class="meta-box">
					<span><strong>Network:</strong> ${searchMode}</span>
					${isCcbToSociety ? `<span><strong>Disbursement Mode:</strong> ${disbursementModeLabel}</span>` : `<span><strong>Recovery Mode:</strong> ${recoveryModeLabel}</span>`}
					${(searchMode === "SOCIETY" || (searchMode === "SHG" && disburseTo === "SOCIETY")) ? `<span><strong>Society:</strong> ${metadataDtls?.pacs_name || "N/A"}</span>` : `<span><strong>Branch:</strong> ${metadataDtls?.branch_name || "N/A"}</span>`}
					<span><strong>From:</strong> ${moment(fromDate).format("DD/MM/YYYY")} <strong>To:</strong> ${moment(toDate).format("DD/MM/YYYY")}</span>
					<span><strong>Total Records:</strong> ${filteredData.length}</span>
					<span><strong>Generated On:</strong> ${moment().format("DD/MM/YYYY HH:mm")}</span>
				</div>
				<table>
					<thead>
						${isCcbToSociety ? `
						<tr>
							<th style="text-align: center;">Sl. No.</th>
							<th style="text-align: center;">Trans No.</th>
							<th style="text-align: center;">Transaction Date</th>
							${showSocietyNameCol ? `<th>Society Name</th>` : ""}
							<th>Group Code & Name</th>
							${showCcbLoanIdCol ? `<th style="text-align: center;">CCB Loan ID</th>` : ""}
							<th style="text-align: center;">Loan ID</th>
							${showMemberNameCol ? `<th>Member Name</th>` : ""}
							<th style="text-align: center;">Loan A/C No.</th>
							<th style="text-align: center;">Period</th>
							<th style="text-align: center;">ROI (%)</th>
							<th style="text-align: center;">Penal ROI (%)</th>
							<th style="text-align: center;">Disb Date</th>
							<th style="text-align: right;">Disb Amount (₹)</th>
							<th style="text-align: center;">Start Date</th>
							<th style="text-align: center;">End Date</th>
							<th style="text-align: right;">Debit Amount (₹)</th>
							<th style="text-align: right;">Current Balance (₹)</th>
						</tr>
						` : `
						<tr>
							<th style="text-align: center;">Sl. No.</th>
							<th style="text-align: center;">Trans No.</th>
							<th style="text-align: center;">Transaction Date</th>
							${showRecoverySocietyCol ? `<th>Society Name</th>` : ""}
							<th style="text-align: center;">CCB Loan ID</th>
							<th style="text-align: center;">Type</th>
							<th>Group Code</th>
							<th>Group Name</th>
							${searchMode === "SHG_MEMBER" ? `<th>Member Name</th>` : ""}
							<th style="text-align: center;">Loan A/C No.</th>
							<th style="text-align: right;">Credit (Recovery ₹)</th>
							<th style="text-align: right;">Current Balance (₹)</th>
						</tr>
						`}
					</thead>
					<tbody>
						${tableRowsHtml}
						${isCcbToSociety ? `
						<tr class="total-row">
							<td colspan="${10 + (showSocietyNameCol ? 1 : 0) + (showCcbLoanIdCol ? 1 : 0) + (showMemberNameCol ? 1 : 0)}" style="text-align: right; text-transform: uppercase;">Total Transaction Amounts:</td>
							<td style="text-align: right; color: #334155; font-family: monospace; font-weight: bold;">₹${(stats.totalDisbAmt || stats.totalDebit).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
							<td></td>
							<td></td>
							<td style="text-align: right; color: #047857; font-family: monospace; font-weight: bold;">₹${stats.totalDebit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
							<td style="text-align: right; color: #0f766e; font-family: monospace; font-weight: bold;">₹${(stats.totalOutstanding || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
						</tr>
						` : `
						<tr class="total-row">
							<td colspan="${8 + (showRecoverySocietyCol ? 1 : 0) + (searchMode === "SHG_MEMBER" ? 1 : 0)}" style="text-align: right; text-transform: uppercase;">Total Recovered Amount:</td>
							<td style="text-align: right; color: #b91c1c; font-family: monospace; font-weight: bold;">₹${stats.totalCredit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
							<td style="text-align: right; color: #0f766e; font-family: monospace; font-weight: bold;">₹${(stats.totalOutstanding || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
						</tr>
						`}
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
				</script>
			</body>
			</html>
		`

		printWindow.document.write(htmlContent)
		printWindow.document.close()
	}

	return (
		<div>
			<Spin indicator={<LoadingOutlined spin />} size="large" spinning={loading}>
				<main className="w-full max-w-[1550px] mx-auto my-4 p-4 md:p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 transition-all duration-300">
					{/* Header Banner */}
					<div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-5 border-b border-slate-200 dark:border-slate-800 gap-4">
						<div className="flex items-center gap-4">
							<div className="p-3 bg-gradient-to-br from-indigo-500 to-teal-600 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
								<SwapOutlined className="text-2xl md:text-3xl" />
							</div>
							<div>
								<h1 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
									Loan Transaction Report
								</h1>
								<p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
									Comprehensive statement of Loan Disbursements and Recoveries for Direct CCB and Society networks
								</p>
							</div>
						</div>
					</div>

					{/* Filter Card */}
					<div className="bg-slate-50/90 dark:bg-slate-800/60 p-4 md:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm mb-6">
						<div className="grid grid-cols-1 md:grid-cols-12 items-end gap-4">
							{/* --- ROW 1: 3 MODES & CONTROLS --- */}
							{/* 1. Transaction Type (Disbursement / Recovery) */}
							<div className="w-full md:col-span-4">
								<label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
									Transaction Type <span className="text-red-500">*</span>
								</label>
								<div className="h-[42px] flex items-center justify-center px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs">
									<Radiobtn
										data={txnTypeOptions}
										val={txnType}
										className="!mt-0 !mb-0 !shadow-none !p-0 inline-flex items-center gap-6 justify-center text-xs font-semibold whitespace-nowrap"
										onChangeVal={(val) => handleTxnTypeChange(val)}
									/>
								</div>
							</div>

							{/* 2. Search By Mode (CCB, SOCIETY, SHG for Disb; SHG Members, SHG, Society for Recov) */}
							<div className="w-full md:col-span-4">
								<label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
									Search By Mode <span className="text-red-500">*</span>
								</label>
								<div className="h-[42px] flex items-center justify-center px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs">
									<Radiobtn
										data={currentSearchModeOptions}
										val={searchMode}
										className="!mt-0 !mb-0 !shadow-none !p-0 inline-flex items-center gap-4 justify-center text-xs font-semibold whitespace-nowrap"
										onChangeVal={(val) => handleSearchModeChange(val)}
									/>
								</div>
							</div>

							{/* 3. Disburse To / Recovery To */}
							<div className="w-full md:col-span-4">
								<div className="flex items-center justify-between mb-1.5">
									<label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
										{txnType === "R" ? "Recovery To" : "Disburse To"} <span className="text-red-500">*</span>
									</label>
								</div>
								<div className="h-[42px] flex items-center justify-center px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs">
									<Radiobtn
										data={targetOptions}
										val={disburseTo}
										className="!mt-0 !mb-0 !shadow-none !p-0 inline-flex items-center gap-4 justify-center text-xs font-semibold whitespace-nowrap"
										onChangeVal={(val) => handleSubModeChange(val)}
									/>
								</div>
							</div>

							{/* --- ROW 2: BRANCH / SOCIETY & DATES --- */}
							{/* Select Branch */}
							{showBranchSelect && (
								<div key="select_branch_col" className="w-full md:col-span-4 mt-1">
									<label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
										Select Branch <span className="text-red-500">*</span>
										{isBranchUser && !isHeadOffice(userBranchCode, userBranchName) && (
											<span className="ml-2 text-teal-600 normal-case font-medium">
												(Current: {userBranchName || userBranchCode})
											</span>
										)}
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
							)}

							{/* Society / PACS Dropdown */}
							{showPacsSelect && (
								<div key="select_pacs_col" className="w-full md:col-span-4 mt-1">
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
											data={[{ code: "", name: "Select Society" }, ...pacsList]}
										/>
									</Spin>
								</div>
							)}

							{/* Date Range: From Date */}
							<div key="from_date_col" className="w-full md:col-span-4 mt-1">
								<label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
									From Date <span className="text-red-500">*</span>
								</label>
								<TDInputTemplateBr
									placeholder="From Date"
									type="date"
									label=""
									name="fromDate"
									formControlName={fromDate}
									handleChange={handleFromDateChange}
									mode={1}
								/>
							</div>

							{/* Date Range: To Date */}
							<div key="to_date_col" className="w-full md:col-span-4 mt-1">
								<label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
									To Date <span className="text-red-500">*</span>
								</label>
								<TDInputTemplateBr
									placeholder="To Date"
									type="date"
									label=""
									name="toDate"
									formControlName={toDate}
									handleChange={handleToDateChange}
									mode={1}
								/>
							</div>
						</div>

						{/* Centered Fetch Button */}
						<div className="w-full flex items-center justify-center mt-4 pt-4 border-t border-slate-200/70 dark:border-slate-700/60">
							<button
								type="button"
								onClick={handleSearchLoanTransactions}
								disabled={!isFetchEnabled || loading}
								className={`inline-flex items-center justify-center gap-2.5 px-8 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 shadow-md ${isFetchEnabled && !loading
									? "bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white cursor-pointer hover:shadow-teal-600/25 active:scale-95"
									: "bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-75 shadow-none"
									}`}
							>
								{loading ? <LoadingOutlined spin /> : <SearchOutlined className="text-base" />}
								<span>Fetch Loan Transactions</span>
							</button>
						</div>
					</div>

					{/* Below Portion: Only shown after user searches */}
					{hasSearched && (
						<>
							{/* Metadata Stats Grid */}
							{metadataDtls && (
								<div className={`grid grid-cols-2 ${txnType === "D" ? "sm:grid-cols-4" : "sm:grid-cols-3"} gap-3.5 mb-6`}>
									<div className="p-4 bg-teal-50 dark:bg-teal-950/30 rounded-xl border border-teal-200/70 dark:border-teal-800/50">
										<span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
											Total Transactions
										</span>
										<div className="text-xl font-extrabold text-teal-900 dark:text-teal-200 mt-1">
											{stats.total}
										</div>
									</div>
									{txnType === "D" && (
										<div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/70 dark:border-emerald-800/50">
											<span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
												Total Disbursed
											</span>
											<div className="text-xl font-extrabold text-emerald-900 dark:text-emerald-200 mt-1">
												₹{stats.totalDebit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
											</div>
										</div>
									)}
									{txnType === "D" ? (
										<div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200/70 dark:border-indigo-800/50">
											<span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
												Total Current Balance
											</span>
											<div className="text-xl font-extrabold text-indigo-900 dark:text-indigo-200 mt-1">
												₹{(stats.totalOutstanding || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
											</div>
										</div>
									) : (
										<div className="p-4 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200/70 dark:border-rose-800/50">
											<span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
												Total Recovered
											</span>
											<div className="text-xl font-extrabold text-rose-900 dark:text-rose-200 mt-1">
												₹{stats.totalCredit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
											</div>
										</div>
									)}
									<div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
										<span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
											{txnType === "D" ? "Disbursement Mode" : "Recovery Mode"}
										</span>
										<div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
											<span className="text-teal-700 dark:text-teal-400 font-bold">
												{txnType === "D" ? disbursementModeLabel : recoveryModeLabel}
											</span>
										</div>
									</div>
								</div>
							)}

							{/* Search & Export Toolbar */}
							{transactionData.length > 0 && (
								<div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-4">
									<div className="relative w-full md:w-96">
										<div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
											<SearchOutlined />
										</div>
										<input
											type="text"
											value={searchTerm}
											onChange={(e) => {
												setSearchTerm(e.target.value)
												setFirst(0)
											}}
											placeholder={isCcbToSociety ? "Filter by society name, group name, code, loan A/C or trans no..." : "Filter by group name, code, loan A/C or trans no..."}
											className="w-full h-10 pl-10 pr-4 text-xs font-medium text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
										/>
									</div>

									<div className="flex items-center gap-2">
										<button
											onClick={handleExcelExport}
											className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
										>
											<FileExcelOutlined className="text-sm" />
											<span>Export Excel</span>
										</button>
										<button
											onClick={handlePrintReport}
											className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
										>
											<PrinterOutlined className="text-sm" />
											<span>Print Report</span>
										</button>
									</div>
								</div>
							)}

							{/* Main Data Table */}
							<div className="overflow-x-auto overflow-y-auto max-h-[600px] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
								<table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
									<thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 uppercase font-bold text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-700 shadow-sm">
										{isCcbToSociety ? (
											<tr>
												<th className="px-4 py-3 text-center">#</th>
												<th className="px-4 py-3 text-center">Trans No.</th>
												<th className="px-4 py-3 text-center">Transaction Date</th>
												{showSocietyNameCol && (
													<th className="px-4 py-3">Society Name</th>
												)}
												<th className="px-4 py-3">Group Code & Name</th>
												{showCcbLoanIdCol && (
													<th className="px-4 py-3 text-center">CCB Loan ID</th>
												)}
												<th className="px-4 py-3 text-center">Loan ID</th>
												{showMemberNameCol && (
													<th className="px-4 py-3">Member Name</th>
												)}
												<th className="px-4 py-3 text-center">Loan A/C No.</th>
												<th className="px-4 py-3 text-center">Period</th>
												<th className="px-4 py-3 text-center">ROI (%)</th>
												<th className="px-4 py-3 text-center">Penal ROI (%)</th>
												<th className="px-4 py-3 text-center">Disb Date</th>
												<th className="px-4 py-3 text-right">Disb Amt (₹)</th>
												<th className="px-4 py-3 text-center">Start Date</th>
												<th className="px-4 py-3 text-center">End Date</th>
												<th className="px-4 py-3 text-right">Debit Amt (₹)</th>
												<th className="px-4 py-3 text-right">Current Balance (₹)</th>
											</tr>
										) : (
											<tr>
												<th className="px-4 py-3 text-center">#</th>
												<th className="px-4 py-3 text-center">Trans No.</th>
												<th className="px-4 py-3 text-center">Transaction Date</th>
												{showRecoverySocietyCol && (
													<th className="px-4 py-3">Society Name</th>
												)}
												<th className="px-4 py-3 text-center">CCB Loan ID</th>
												<th className="px-4 py-3 text-center">Type</th>
												<th className="px-4 py-3">Group Code</th>
												<th className="px-4 py-3">Group Name</th>
												{searchMode === "SHG_MEMBER" && (
													<th className="px-4 py-3">Member Name</th>
												)}
												<th className="px-4 py-3 text-center">Loan A/C No.</th>
												<th className="px-4 py-3 text-right">Credit (₹)</th>
												<th className="px-4 py-3 text-right">Current Balance (₹)</th>
											</tr>
										)}
									</thead>
									<tbody className="divide-y divide-slate-100 dark:divide-slate-800">
										{currentData.length > 0 ? (
											currentData.map((item, idx) => (
												<tr
													key={item.id || idx}
													className="hover:bg-teal-50/50 dark:hover:bg-slate-800/50 transition-colors"
												>
													<td className="px-4 py-3 text-center font-semibold text-slate-500">
														{first + idx + 1}
													</td>
													<td className="px-4 py-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
														{item?.trans_no || "N/A"}
													</td>
													<td className="px-4 py-3 text-center font-mono text-slate-600 dark:text-slate-300">
														{item?.trans_date ? moment(item.trans_date).format("DD/MM/YYYY") : "N/A"}
													</td>
													{isCcbToSociety ? (
														<>
															{showSocietyNameCol && (
																<td className="px-4 py-3 min-w-[200px] max-w-[240px] whitespace-normal">
																	<div
																		className="font-semibold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2"
																		title={`${item?.branch_shg_name || item?.pacs_name || "N/A"}${item?.branch_shg_id ? ` (${item.branch_shg_id})` : ""}`}
																	>
																		{item?.branch_shg_name || item?.pacs_name || "N/A"}{item?.branch_shg_id ? ` (${item.branch_shg_id})` : ""}
																	</div>
																</td>
															)}
															<td className="px-4 py-3">
																<span className="font-mono font-bold text-teal-700 dark:text-teal-400">
																	{item?.group_code || "N/A"}
																</span>
																{item?.group_name && item?.group_name !== "N/A" && (
																	<span className="font-semibold text-slate-800 dark:text-slate-100">
																		{" - "}{item.group_name}
																	</span>
																)}
															</td>
															{showCcbLoanIdCol && (
																<td className="px-4 py-3 text-center font-mono font-semibold text-slate-700 dark:text-slate-300">
																	{item?.ccb_loan_id || "N/A"}
																</td>
															)}
															<td className="px-4 py-3 text-center font-mono font-semibold text-teal-700 dark:text-teal-400">
																{item?.loan_id || "N/A"}
															</td>
															{showMemberNameCol && (
																<td className="px-4 py-3 whitespace-nowrap font-semibold text-slate-800 dark:text-slate-100">
																	{item?.member_name && item?.member_name !== "N/A" ? (
																		<span>{item.member_name}{item?.member_code && item?.member_code !== "N/A" ? ` (${item.member_code})` : ""}</span>
																	) : (
																		"-"
																	)}
																</td>
															)}
															<td className="px-4 py-3 text-center font-mono font-semibold">
																{item?.account_no || "N/A"}
															</td>
															<td className="px-4 py-3 text-center font-mono">
																{item?.period ? `${item.period} M` : "-"}
															</td>
															<td className="px-4 py-3 text-center font-mono font-semibold text-slate-600 dark:text-slate-300">
																{item?.curr_roi ? `${item.curr_roi}%` : "-"}
															</td>
															<td className="px-4 py-3 text-center font-mono font-semibold text-slate-600 dark:text-slate-300">
																{item?.penal_roi ? `${item.penal_roi}%` : "0%"}
															</td>
															<td className="px-4 py-3 text-center font-mono text-slate-600 dark:text-slate-300">
																{item?.disb_dt ? moment(item.disb_dt).format("DD/MM/YYYY") : "-"}
															</td>
															<td className="px-4 py-3 text-right font-mono font-bold text-slate-700 dark:text-slate-200 text-sm">
																{item?.disb_amt !== undefined
																	? `₹${Number(item.disb_amt).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
																	: "-"}
															</td>
															<td className="px-4 py-3 text-center font-mono text-slate-600 dark:text-slate-300">
																{item?.start_date ? moment(item.start_date).format("DD/MM/YYYY") : "-"}
															</td>
															<td className="px-4 py-3 text-center font-mono text-slate-600 dark:text-slate-300">
																{item?.end_date ? moment(item.end_date).format("DD/MM/YYYY") : "-"}
															</td>
															<td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 text-sm">
																{item?.dr_amt !== undefined
																	? `₹${Number(item.dr_amt).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
																	: (item?.debit_amt
																		? `₹${Number(item.debit_amt).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
																		: "-")}
															</td>
															<td className="px-4 py-3 text-right font-mono font-bold text-teal-700 dark:text-teal-400 text-sm">
																{item?.current_balance !== undefined
																	? `₹${Number(item.current_balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
																	: (item?.outstanding_amt !== undefined
																		? `₹${Number(item.outstanding_amt).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
																		: "-")}
															</td>
														</>
													) : (
														<>
															{showRecoverySocietyCol && (
																<td className="px-4 py-3 min-w-[180px] text-slate-800 dark:text-slate-100 font-medium">
																	{item?.branch_shg_name_with_id || (item?.branch_shg_name ? `${item.branch_shg_name} (${item.branch_shg_id})` : "N/A")}
																</td>
															)}
															<td className="px-4 py-3 text-center font-mono font-bold text-teal-700 dark:text-teal-400">
																{item?.ccb_loan_id || "N/A"}
															</td>
															<td className="px-4 py-3 text-center">
																<span
																	className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${item?.trans_type === "D"
																		? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
																		: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
																		}`}
																>
																	{item?.trans_type === "D" ? (
																		<span className="inline-flex items-center gap-1">
																			<ArrowDownOutlined /> Disburse
																		</span>
																	) : (
																		<span className="inline-flex items-center gap-1">
																			<ArrowUpOutlined /> Recovery
																		</span>
																	)}
																</span>
															</td>
															<td className="px-4 py-3 font-mono font-bold text-teal-700 dark:text-teal-400">
																{item?.group_code || "N/A"}
															</td>
															<td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">
																{item?.group_name || "N/A"}
															</td>
															{searchMode === "SHG_MEMBER" && (
																<td className="px-4 py-3 whitespace-nowrap font-semibold text-slate-800 dark:text-slate-100">
																	{item?.member_name && item?.member_name !== "N/A" ? (
																		<span>{item.member_name}{item?.member_code && item?.member_code !== "N/A" ? ` (${item.member_code})` : ""}</span>
																	) : (
																		"-"
																	)}
																</td>
															)}
															<td className="px-4 py-3 text-center font-mono font-semibold">
																{item?.account_no || "N/A"}
															</td>
															<td className="px-4 py-3 text-right font-mono font-bold text-rose-600 text-sm">
																{item?.credit_amt !== undefined
																	? `₹${Number(item.credit_amt).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
																	: "-"}
															</td>
															<td className="px-4 py-3 text-right font-mono font-bold text-teal-700 dark:text-teal-400 text-sm">
																{item?.current_balance !== undefined
																	? `₹${Number(item.current_balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
																	: (item?.outstanding_amt !== undefined
																		? `₹${Number(item.outstanding_amt).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
																		: "-")}
															</td>
														</>
													)}
												</tr>
											))
										) : (
											<tr>
												<td colSpan={isCcbToSociety ? (15 + (showSocietyNameCol ? 1 : 0) + (showCcbLoanIdCol ? 1 : 0) + (showMemberNameCol ? 1 : 0)) : (10 + (showRecoverySocietyCol ? 1 : 0) + (searchMode === "SHG_MEMBER" ? 1 : 0))} className="px-4 py-8 text-center text-slate-400 text-sm italic">
													No matching records found for the selected criteria.
												</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>

							{/* Pagination */}
							{filteredData.length > 0 && (
								<div className="mt-4">
									<Paginator
										first={first}
										rows={rows}
										totalRecords={filteredData.length}
										rowsPerPageOptions={[10, 20, 50, 100, filteredData.length]}
										onPageChange={(e) => {
											setFirst(e.first)
											setRows(e.rows)
										}}
									/>
								</div>
							)}
						</>
					)}
				</main>
			</Spin>

			{/* Modal for Detailed Loan Transaction Ledger */}
			<Modal
				title={
					<div className="flex items-center gap-2 text-teal-800 font-bold">
						<AccountBookOutlined />
						<span>Loan Statement: {selectedItemDtls?.group_name}</span>
					</div>
				}
				open={modalVisible}
				onCancel={() => setModalVisible(false)}
				footer={null}
				width={900}
			>
				<Spin spinning={modalLoading} indicator={<LoadingOutlined spin />}>
					<div className="p-2">
						{/* Group Info Summary */}
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl mb-4 text-xs">
							<div>
								<span className="text-slate-400 uppercase text-[10px] block font-bold">Group Code</span>
								<span className="font-mono font-bold text-slate-800 dark:text-slate-100">
									{selectedItemDtls?.group_code}
								</span>
							</div>
							<div>
								<span className="text-slate-400 uppercase text-[10px] block font-bold">Loan A/C No.</span>
								<span className="font-mono font-bold text-slate-800 dark:text-slate-100">
									{selectedItemDtls?.account_no}
								</span>
							</div>
							<div>
								<span className="text-slate-400 uppercase text-[10px] block font-bold">Loan ID</span>
								<span className="font-mono font-bold text-teal-700">{selectedItemDtls?.loan_id}</span>
							</div>
							<div>
								<span className="text-slate-400 uppercase text-[10px] block font-bold">Branch / PACS</span>
								<span className="font-semibold text-slate-800 dark:text-slate-100 truncate block">
									{selectedItemDtls?.pacs_name || selectedItemDtls?.branch_name}
								</span>
							</div>
						</div>

						{/* Transaction Table */}
						<div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 max-h-96">
							<table className="w-full text-xs text-left">
								<thead className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 sticky top-0 font-bold uppercase text-[10px]">
									<tr>
										<th className="px-3 py-2 text-center">#</th>
										<th className="px-3 py-2 text-center">Trans No.</th>
										<th className="px-3 py-2 text-center">Date</th>
										<th className="px-3 py-2 text-center">Type</th>
										<th className="px-3 py-2 text-right">Debit (Disburse ₹)</th>
										<th className="px-3 py-2 text-right">Credit (Recovery ₹)</th>
										<th className="px-3 py-2 text-right">Outstanding (₹)</th>
										<th className="px-3 py-2 text-center">Approved By</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100 dark:divide-slate-700">
									{ledgerTransactions.length > 0 ? (
										ledgerTransactions.map((tx, i) => (
											<tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800">
												<td className="px-3 py-2 text-center text-slate-400">{i + 1}</td>
												<td className="px-3 py-2 text-center font-mono font-semibold">
													{tx.trans_id || tx.trans_no || "N/A"}
												</td>
												<td className="px-3 py-2 text-center font-mono text-slate-500">
													{tx.trans_date ? moment(tx.trans_date).format("DD/MM/YYYY") : "N/A"}
												</td>
												<td className="px-3 py-2 text-center">
													<span
														className={`px-2 py-0.5 rounded text-[10px] font-bold ${tx.tr_type === "D"
															? "bg-emerald-100 text-emerald-700"
															: "bg-rose-100 text-rose-700"
															}`}
													>
														{tx.tr_type === "D" ? "Disbursement" : "Recovery"}
													</span>
												</td>
												<td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">
													{tx.debit_amt
														? `₹${Number(tx.debit_amt).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
														: "-"}
												</td>
												<td className="px-3 py-2 text-right font-mono font-bold text-rose-600">
													{tx.credit_amt
														? `₹${Number(tx.credit_amt).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
														: "-"}
												</td>
												<td className="px-3 py-2 text-right font-mono font-bold text-slate-800 dark:text-slate-100">
													₹{Number(tx.outstanding_amt || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
												</td>
												<td className="px-3 py-2 text-center text-slate-500">{tx.approved_by || "BM"}</td>
											</tr>
										))
									) : (
										<tr>
											<td colSpan={8} className="px-3 py-6 text-center text-slate-400 italic">
												No transaction records found for this loan.
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</div>
				</Spin>
			</Modal>
		</div>
	)
}

export default LoanTransactionReport

