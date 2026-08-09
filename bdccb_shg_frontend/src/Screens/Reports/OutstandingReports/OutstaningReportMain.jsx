import React, { useCallback, useEffect, useState } from "react"
import Sidebar from "../../../Components/Sidebar"
import axios from "axios"
import { url } from "../../../Address/BaseUrl"
import { Alert, Spin, Tooltip } from "antd"
import {
	LoadingOutlined,
	SearchOutlined,
	PrinterOutlined,
	FileExcelOutlined,
	FileSearchOutlined,
	CalendarOutlined,
	FilterOutlined,
	ReloadOutlined as AntRefreshOutlined,
} from "@ant-design/icons"
import { RefreshOutlined, Search } from "@mui/icons-material"
import Radiobtn from "../../../Components/Radiobtn"
import TDInputTemplateBr from "../../../Components/TDInputTemplateBr"
import { formatDateToYYYYMMDD } from "../../../Utils/formateDate"
import moment from "moment"

import { saveAs } from "file-saver"
import * as XLSX from "xlsx"
import ExcelJS from "exceljs"
import { printTableOutstandingReport } from "../../../Utils/printTableOutstandingReport"
import DynamicTailwindTable from "../../../Components/Reports/DynamicTailwindTable"
import {
	branchwiseOutstandingHeader,
	cowiseOutstandingHeader,
	fundwiseOutstandingHeader,
	groupwiseOutstandingHeader,
	memberwiseOutstandingHeader,
} from "../../../Utils/Reports/headerMap"
import Select from "react-select"
import { exportToExcel } from "../../../Utils/exportToExcel"
import { printTableReport } from "../../../Utils/printTableReport"
import { useCtrlP } from "../../../Hooks/useCtrlP"
import { MultiSelect } from "primereact/multiselect"
import { Message } from "../../../Components/Message"
import { getLocalStoreTokenDts } from "../../../Components/getLocalforageTokenDts"
import { routePaths } from "../../../Assets/Data/Routes"
import { useNavigate } from "react-router"

const shgMemberOutstandingHeader = {
	loan_id: "Loan ID",
	ccb_loan_id: "CCB Loan ID",
	member_code: "Member Code",
	member_name: "Member Name",
	period: "Period",
	curr_roi: "Current ROI (%)",
	penal_roi: "Penal ROI (%)",
	disb_date: "Disbursement Date",
	disb_amt: "Disbursement Amount",
	period_mode: "Period Mode",
	start_date: "Start Date",
	end_date: "End Date",
	member_outstanding: "Member Outstanding",
};

// Three Options: SHG, Society, CCB
const options = [
	{
		label: "SHG",
		value: "S",
	},
	{
		label: "Society",
		value: "P",
	},
	{
		label: "CCB",
		value: "B",
	},
]

const Fortnight = [
	{
		code: "1",
		name: "Week (1-3)",
	},
	{
		code: "2",
		name: "Week (2-4)",
	}
]

// Branchwise And Divisionwise options
const brnchwis_divwise = [
	{
		label: "Branchwise",
		value: "B",
	},
	{
		label: "Divisionwise",
		value: "D",
	},
]

function OutstaningReportMain() {
	const [selectedColumns, setSelectedColumns] = useState(null);
	const [md_columns, setColumns] = useState([]);
	const rawUser = JSON.parse(localStorage.getItem("user_details"))
	const userDetails = Array.isArray(rawUser) ? (rawUser[0] || {}) : (rawUser || {})
	const [loading, setLoading] = useState(false)

	// Search By (S = SHG, P = Society, B = Branch)
	const [searchType, setSearchType] = useState(() => "S")

	const [fromDate, setFromDate] = useState()
	const [toDate, setToDate] = useState()
	const [reportData, setReportData] = useState([])
	const [metadataDtls, setMetadataDtls] = useState(null)
	const [fetchedReportDate, setFetchedReportDate] = useState(() => "")
	const [funds, setFunds] = useState([])
	const [selectedFund, setSelectedFund] = useState("")
	const [cos, setCOs] = useState([])
	const [branches, setBranches] = useState([])
	const [societies, setSocieties] = useState([])
	const [society, setSociety] = useState("")
	const [selectedCO, setSelectedCO] = useState("")
	const [selectedOptions, setSelectedOptions] = useState([])
	const [selectedCOs, setSelectedCOs] = useState([])
	const [procedureSuccessFlag, setProcedureSuccessFlag] = useState("0")
	const [conditionState, setConditionState] = useState("current")
	const [groupSearch, setGroupSearch] = useState("")
	const [asOnDate, setAsOnDate] = useState(() => formatDateToYYYYMMDD(new Date()))
	const [groupSearchResults, setGroupSearchResults] = useState([])

	const userBrnCode = userDetails?.brn_code || userDetails?.[0]?.brn_code;
	const userBrnName = userDetails?.branch_name || userDetails?.[0]?.branch_name || "";

	const [branch, setBranch] = useState(() =>
		userBrnCode && +userBrnCode !== 112
			? `${userBrnCode},${userBrnName}`
			: ""
	)

	// Branchwise And Divisionwise options
	const [searchBrnchDiv, setSearchBrnchDiv] = useState(() => "B")

	const navigate = useNavigate()

	const onChange = (e) => {
		setSearchType(e)
		if (e === "P") {
			const selectedBrnCode = branch ? branch.split(",")[0] : "";
			handleFetchSocietyList(selectedBrnCode);
		}
	}

	// Branchwise And Divisionwise options
	const onChange3BrnDiv = (e) => {
		setSelectedOptions([])
		setSearchBrnchDiv(e)
		getBranches(e)
	}

	const handleFetchBranchList = async () => {
		const tokenValue = await getLocalStoreTokenDts(navigate);
		try {
			const res = await axios.post(`${url}/fetch_branch_society_list`, {
				branch_type: "B",
				tenant_id: userDetails?.tenant_id || 1,
			}, {
				headers: {
					Authorization: `${tokenValue?.token}`,
					"Content-Type": "application/json",
				},
			});

			if (res?.data?.suc === 1) {
				setBranches(res?.data?.msg || []);
			} else {
				setBranches([]);
			}
		} catch (err) {
			console.error("Fetch branch list error:", err);
			setBranches([]);
		}
	};

	const handleFetchSocietyList = async (branchCode) => {
		const tokenValue = await getLocalStoreTokenDts(navigate);
		try {
			const payload = {
				branch_type: "P",
				tenant_id: userDetails?.tenant_id || 1,
			};
			if (branchCode) payload.branch_code = branchCode;

			const res = await axios.post(`${url}/fetch_branch_society_list`, payload, {
				headers: {
					Authorization: `${tokenValue?.token}`,
					"Content-Type": "application/json",
				},
			});

			if (res?.data?.suc === 1) {
				setSocieties(res?.data?.msg || []);
			} else {
				setSocieties([]);
			}
		} catch (err) {
			console.error("Fetch society list error:", err);
			setSocieties([]);
		}
	};

	useEffect(() => {
		handleFetchBranchList();
		if (searchType === "P") {
			const selectedBrnCode = branch ? branch.split(",")[0] : "";
			handleFetchSocietyList(selectedBrnCode);
		}
	}, [searchType]);

	const branchOptions = React.useMemo(() => {
		const sorted = [...branches].sort((a, b) => {
			const codeA = parseInt(a.code || a.branch_code || a.branch_id || a.branch_assign_id || 0, 10);
			const codeB = parseInt(b.code || b.branch_code || b.branch_id || b.branch_assign_id || 0, 10);
			if (!isNaN(codeA) && !isNaN(codeB) && codeA !== codeB) {
				return codeA - codeB;
			}
			return String(a.name || a.branch_name || "").localeCompare(String(b.name || b.branch_name || ""));
		});

		return sorted.map(item => {
			const bCode = item.code || item.branch_code || item.branch_id || item.branch_assign_id;
			const bName = item.name || item.branch_name;
			return {
				code: bCode,
				name: bCode ? `${bCode} - ${bName}` : bName,
			};
		});
	}, [branches]);

	const societyOptions = React.useMemo(() => {
		const sorted = [...societies].sort((a, b) => {
			const codeA = parseInt(a.code || a.branch_code || a.branch_id || a.branch_assign_id || 0, 10);
			const codeB = parseInt(b.code || b.branch_code || b.branch_id || b.branch_assign_id || 0, 10);
			if (!isNaN(codeA) && !isNaN(codeB) && codeA !== codeB) {
				return codeA - codeB;
			}
			return String(a.name || a.branch_name || "").localeCompare(String(b.name || b.branch_name || ""));
		});

		return sorted.map(item => {
			const bCode = item.code || item.branch_code || item.branch_id || item.branch_assign_id;
			const bName = item.name || item.branch_name;
			return {
				code: bCode,
				name: bCode ? `${bCode} - ${bName}` : bName,
			};
		});
	}, [societies]);

	const handleBranchChange = (e) => {
		const value = e?.target?.value !== undefined ? e.target.value : e;
		if (!value) {
			setBranch("");
			setSociety("");
			return;
		}
		const selected = branches.find(b => (b.code || b.branch_code || b.branch_id || b.branch_assign_id) == value);
		if (selected) {
			setBranch(`${selected.code || selected.branch_code || selected.branch_id || selected.branch_assign_id},${selected.name || selected.branch_name || ""}`);
		} else {
			setBranch(value || "");
		}
		setSociety("");
	};

	const handleSocietyChange = (e) => {
		const value = e?.target?.value !== undefined ? e.target.value : e;
		if (!value) {
			setSociety("");
			return;
		}
		const selected = societies.find(s => (s.code || s.branch_code || s.branch_id || s.branch_assign_id) == value);
		if (selected) {
			setSociety(`${selected.code || selected.branch_code || selected.branch_id || selected.branch_assign_id},${selected.name || selected.branch_name || ""}`);
		} else {
			setSociety(value || "");
		}
	};

	const handleFetchReportOutstandingMemberwise = async () => {
		setLoading(true)
		const branchCodes = selectedOptions?.map((item, i) => item?.value)
		const selectedBrnCode = branch ? branch.split(",")[0] : userDetails?.brn_code;
		const creds = {
			branch_code: branchCodes?.length > 0 ? branchCodes : [selectedBrnCode],
			supply_date: fromDate ? formatDateToYYYYMMDD(fromDate) : formatDateToYYYYMMDD(new Date()),
		}

		if (conditionState === "current") {
			const tokenValue = await getLocalStoreTokenDts(navigate);
			await axios
				.post(`${url}/loan_outstanding_report_memberwise_new`, creds, {
					headers: {
						Authorization: `${tokenValue?.token}`,
						"Content-Type": "application/json",
					},
				})
				.then((res) => {
					if (res?.data?.suc === 0) {
						Message('error', res?.data?.msg)
						navigate(routePaths.LANDING)
						localStorage.clear()
					} else {
						if (res?.data?.outstanding_member_data?.suc > 0) {
							const data = res?.data?.outstanding_member_data?.msg || []
							setFetchedReportDate(new Date(res?.data?.balance_date).toLocaleDateString("en-GB"))
							setReportData(data)
							populateColumns(res?.data?.outstanding_member_data?.msg, memberwiseOutstandingHeader);
						} else {
							Message("error", res?.data?.outstanding_member_data?.msg[0])
							setReportData([])
							populateColumns([], memberwiseOutstandingHeader)
						}
					}
				})
				.catch((err) => {
					console.log("ERRRR>>>", err)
				})
		}

		if (conditionState === "old") {
			const tokenValue = await getLocalStoreTokenDts(navigate);
			await axios
				.post(`${url}/loan_outstanding_report_memberwise`, creds, {
					headers: {
						Authorization: `${tokenValue?.token}`,
						"Content-Type": "application/json",
					},
				})
				.then((res) => {
					if (res?.data?.suc === 0) {
						navigate(routePaths.LANDING)
						localStorage.clear()
					} else {
						const data = res?.data?.outstanding_member_data?.msg || []
						setFetchedReportDate(new Date(res?.data?.balance_date).toLocaleDateString("en-GB"))
						setReportData(data)
						populateColumns(res?.data?.outstanding_member_data?.msg, memberwiseOutstandingHeader);
					}
				})
				.catch((err) => {
					console.log("ERRRR>>>", err)
				})
		}
		setLoading(false)
	}

	const handleFetchReportOutstandingBranchwise = async () => {
		setLoading(true)
		const branchCodes = selectedOptions?.map((item, i) => item?.value)
		const selectedBrnCode = (searchType === "P" && society) ? society.split(",")[0] : (branch ? branch.split(",")[0] : userDetails?.brn_code);
		const creds = {
			branch_code: branchCodes?.length > 0 ? branchCodes : [selectedBrnCode],
			supply_date: fromDate ? formatDateToYYYYMMDD(fromDate) : formatDateToYYYYMMDD(new Date()),
		}

		if (conditionState === "current") {
			const tokenValue = await getLocalStoreTokenDts(navigate);
			await axios
				.post(`${url}/loan_outstanding_report_branchwise_new`, creds, {
					headers: {
						Authorization: `${tokenValue?.token}`,
						"Content-Type": "application/json",
					},
				})
				.then((res) => {
					if (res?.data?.suc === 0) {
						Message('error', res?.data?.msg)
						navigate(routePaths.LANDING)
						localStorage.clear()
					} else {
						if (res?.data?.outstanding_branch_data?.suc > 0) {
							const data = res?.data?.outstanding_branch_data?.msg || []
							setFetchedReportDate(new Date(res?.data?.balance_date).toLocaleDateString("en-GB"))
							setReportData(data)
							populateColumns(res?.data?.outstanding_branch_data?.msg, branchwiseOutstandingHeader)
						} else {
							Message("error", res?.data?.outstanding_branch_data?.msg[0])
							setReportData([])
							populateColumns([], branchwiseOutstandingHeader)
						}
					}
				})
				.catch((err) => {
					console.log("ERRRR>>>", err)
				})
		}

		if (conditionState === "old") {
			const tokenValue = await getLocalStoreTokenDts(navigate);
			await axios
				.post(`${url}/loan_outstanding_report_branchwise`, creds, {
					headers: {
						Authorization: `${tokenValue?.token}`,
						"Content-Type": "application/json",
					},
				})
				.then((res) => {
					if (res?.data?.suc === 0) {
						navigate(routePaths.LANDING)
						localStorage.clear()
					} else {
						const data = res?.data?.outstanding_branch_data?.msg || []
						setFetchedReportDate(new Date(res?.data?.balance_date).toLocaleDateString("en-GB"))
						setReportData(data)
						populateColumns(res?.data?.outstanding_branch_data?.msg, branchwiseOutstandingHeader)
					}
				})
				.catch((err) => {
					console.log("ERRRR>>>", err)
				})
		}
		setLoading(false)
	}

	const handleFetchReportOutstandingGroupwise = async () => {
		setLoading(true)
		const branchCodes = selectedOptions?.map((item, i) => item?.value)
		const selectedBrnCode = (searchType === "P" && society) ? society.split(",")[0] : (branch ? branch.split(",")[0] : userDetails?.brn_code);
		const creds = {
			branch_code: branchCodes?.length > 0 ? branchCodes : [selectedBrnCode],
			supply_date: fromDate ? formatDateToYYYYMMDD(fromDate) : formatDateToYYYYMMDD(new Date()),
		}

		if (conditionState === "current") {
			const tokenValue = await getLocalStoreTokenDts(navigate);
			await axios
				.post(`${url}/loan_outstanding_report_groupwise_new`, creds, {
					headers: {
						Authorization: `${tokenValue?.token}`,
						"Content-Type": "application/json",
					},
				})
				.then((res) => {
					if (res?.data?.suc === 0) {
						navigate(routePaths.LANDING)
						localStorage.clear()
					} else {
						if (res?.data?.outstanding_data?.suc > 0) {
							const data = res?.data?.outstanding_data?.msg || []
							setFetchedReportDate(new Date(res?.data?.balance_date).toLocaleDateString("en-GB"))
							setReportData(data)
							populateColumns(res?.data?.outstanding_data?.msg, groupwiseOutstandingHeader)
						} else {
							Message("error", res?.data?.outstanding_data?.msg[0])
							setReportData([])
							populateColumns([], groupwiseOutstandingHeader)
						}
					}
				})
				.catch((err) => {
					console.log("ERRRR>>>", err)
				})
		}

		if (conditionState === "old") {
			const tokenValue = await getLocalStoreTokenDts(navigate);
			await axios
				.post(`${url}/loan_outstanding_report_groupwise`, creds, {
					headers: {
						Authorization: `${tokenValue?.token}`,
						"Content-Type": "application/json",
					},
				})
				.then((res) => {
					if (res?.data?.suc === 0) {
						navigate(routePaths.LANDING)
						localStorage.clear()
					} else {
						const data = res?.data?.outstanding_data?.msg || []
						setFetchedReportDate(new Date(res?.data?.balance_date).toLocaleDateString("en-GB"))
						setReportData(data)
						populateColumns(res?.data?.outstanding_data?.msg, groupwiseOutstandingHeader)
					}
				})
				.catch((err) => {
					console.log("ERRRR>>>", err)
				})
		}
		setLoading(false)
	}

	const getBranches = async (para) => {
		setBranches([]);
		setLoading(true)
		var apiUrl = ''
		if (para === 'B') apiUrl = 'fetch_branch_name_based_usertype'
		if (para === 'D') apiUrl = 'fetch_divitionwise_branch'

		const creds = {
			emp_id: userDetails?.emp_id,
			user_type: userDetails?.id,
		}
		const tokenValue = await getLocalStoreTokenDts(navigate);
		axios
			.post(`${url}/${apiUrl}`, para === 'B' ? creds : {}, {
				headers: {
					Authorization: `${tokenValue?.token}`,
					"Content-Type": "application/json",
				},
			})
			.then((res) => {
				if (res?.data?.suc === 0) {
					navigate(routePaths.LANDING)
					localStorage.clear()
				} else {
					setBranches(res?.data?.msg)
				}
			})
			.catch((err) => {
				console.log("ERRRR>>>", err)
				setLoading(false)
			})
		setLoading(false)
	}

	useEffect(() => {
		getBranches(searchBrnchDiv)
	}, [])

	useEffect(() => {
		setProcedureSuccessFlag('0')
		if (!fromDate) return;
		const selectedDate = new Date(fromDate);
		if (isNaN(selectedDate)) return;

		const today = new Date();
		const currentYear = today.getFullYear();
		const currentMonth = today.getMonth();
		const selectedYear = selectedDate.getFullYear();
		const selectedMonth = selectedDate.getMonth();

		const endOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0);
		const endOfSelectedMonth = new Date(selectedYear, selectedMonth + 1, 0);

		const isToday = selectedDate.toDateString() === today.toDateString();
		const isEndOfCurrentMonth = selectedDate.toDateString() === endOfCurrentMonth.toDateString();
		const isPastMonthEnd = (selectedYear < currentYear || (selectedYear === currentYear && selectedMonth < currentMonth)) && selectedDate.toDateString() === endOfSelectedMonth.toDateString();

		const oldDateThreshold = new Date(2025, 8, 30);
		const isOldDate = selectedDate < oldDateThreshold;

		if (isOldDate) {
			setConditionState("old");
			setSelectedOptions([])
		} else if (isToday || isEndOfCurrentMonth || isPastMonthEnd) {
			setConditionState("current");
		} else {
			Message("warning", `Date must be current date or last day of the month`);
			setConditionState("");
		}
	}, [fromDate]);

	const runProcedureReport = async () => {
		setLoading(true)
		const branchCodes = selectedOptions?.map((item, i) => ({
			branch_code: item?.value,
		}))
		const selectedBrnCode = (searchType === "P" && society) ? society.split(",")[0] : (branch ? branch.split(",")[0] : userDetails?.brn_code);
		const creds = {
			from_dt: formatDateToYYYYMMDD(fromDate),
			branches: branchCodes?.length > 0 ? branchCodes : [{ branch_code: selectedBrnCode }],
		}

		if (conditionState === "old") {
			await axios
				.post(`${url}/call_outstanding_proc`, creds)
				.then((res) => {
					console.log("Procedure called", res?.data)
					setProcedureSuccessFlag(res?.data?.suc)
				})
				.catch((err) => {
					console.log("Some error while running procedure.", err)
				})
		} else {
			setProcedureSuccessFlag('1')
		}
		setLoading(false)
	}

	const handleFetchSocietyCCBOutstandingDetails = async () => {
		setLoading(true);
		setReportData([]);
		try {
			const selectedBrnCode = branch ? branch.split(",")[0] : userDetails?.brn_code;
			const selectedSocCode = society ? society.split(",")[0] : "";
			const loanToVal = searchType === "P" ? "P" : "B";

			const payload = {
				tenant_id: userDetails?.tenant_id || 1,
				loan_to: loanToVal,
				as_on_date: asOnDate || formatDateToYYYYMMDD(new Date()),
				branch_code: selectedBrnCode,
			};
			if (searchType === "P" && selectedSocCode) {
				payload.branch_shg_id = selectedSocCode;
			}

			const tokenValue = await getLocalStoreTokenDts(navigate);
			const res = await axios.post(`${url}/fetch_society_ccb_outstanding_report`, payload, {
				headers: {
					Authorization: `${tokenValue?.token}`,
					"Content-Type": "application/json",
				},
			});

			if (res?.data?.suc === 1 && res?.data?.msg && res.data.msg.length > 0) {
				setReportData(res.data.msg);
				const brnName = branch ? branch.split(",")[1] || selectedBrnCode : "";
				const socName = society ? society.split(",")[1] || selectedSocCode : "";
				setMetadataDtls({
					branch_name: brnName,
					society_name: socName,
					group_name: searchType === "P" ? `Society: ${socName}` : `Branch: ${brnName}`,
					group_code: selectedSocCode || selectedBrnCode,
				});
			} else {
				Message("error", res?.data?.msg || "No loan outstanding records found");
				setReportData([]);
			}
		} catch (err) {
			console.error("Fetch society/CCB outstanding error:", err);
			Message("error", "Error fetching outstanding details");
			setReportData([]);
		}
		setLoading(false);
	};

	const handleSubmit = () => {
		if (searchType === "P" || searchType === "B") {
			handleFetchSocietyCCBOutstandingDetails();
		} else {
			handleFetchReportOutstandingGroupwise();
		}
	};

	useEffect(() => {
		setGroupSearchResults([]);
		setReportData([]);
		setMetadataDtls(null);
	}, [searchType, branch, society]);

	const handleSearchGroupList = async () => {
		setLoading(true);
		setGroupSearchResults([]);
		setReportData([]);
		const tokenValue = await getLocalStoreTokenDts(navigate);
		const selectedBrnCode = branch ? branch.split(",")[0] : userDetails?.brn_code;

		const creds = {
			grp: groupSearch,
			loan_to: "S",
			branch_code: selectedBrnCode,
			tenant_id: userDetails?.tenant_id || 1,
		};

		try {
			const res = await axios.post(`${url}/shg_outstanding_group_dtls`, creds, {
				headers: {
					Authorization: `${tokenValue?.token}`,
					"Content-Type": "application/json",
				},
			});

			if (res?.data?.suc === 1 && res?.data?.msg) {
				setGroupSearchResults(res.data.msg);
			} else {
				Message('error', res?.data?.msg || "No group records found for selected branch");
				setGroupSearchResults([]);
			}
		} catch (err) {
			console.error("Group search error:", err);
			Message('error', "Error searching groups");
			setGroupSearchResults([]);
		}
		setLoading(false);
	};

	const handleFetchGroupOutstandingDetails = async (grpItem) => {
		setLoading(true);
		setMetadataDtls(grpItem);
		const creds = {
			group_code: grpItem.group_code,
			as_on_date: asOnDate ? formatDateToYYYYMMDD(asOnDate) : formatDateToYYYYMMDD(new Date()),
			tenant_id: userDetails?.tenant_id || 1,
		};

		const tokenValue = await getLocalStoreTokenDts(navigate);
		try {
			const res = await axios.post(`${url}/fetch_shg_member_outstanding_report`, creds, {
				headers: {
					Authorization: `${tokenValue?.token}`,
					"Content-Type": "application/json",
				},
			});

			if (res?.data?.suc === 0 || !res?.data?.msg || res?.data?.msg.length === 0) {
				Message('info', res?.data?.msg || "No member loan records found for this group");
				setReportData([]);
			} else {
				const data = res?.data?.msg || [];
				setFetchedReportDate(asOnDate ? moment(asOnDate).format("DD/MM/YYYY") : new Date().toLocaleDateString("en-GB"));
				setReportData(data);
				populateColumns(data, shgMemberOutstandingHeader);
			}
		} catch (err) {
			console.error("Fetch group member outstanding error:", err);
			Message('error', "Error fetching group member outstanding details");
			setReportData([]);
		}
		setLoading(false);
	};

	const handleExcelExportMemberReport = async () => {
		if (!reportData || reportData.length === 0) return;

		const isSHG = searchType === "S";
		const isSociety = searchType === "P";
		const titleText = "BURDWAN CENTRAL CO-OPERATIVE BANK LTD.";
		const subtitleText = isSHG 
			? "SHG MEMBER LOAN OUTSTANDING REPORT" 
			: (isSociety ? "SOCIETY LOAN OUTSTANDING DETAILS" : "CCB LOAN OUTSTANDING DETAILS");
		const formattedAsOnDt = asOnDate ? moment(asOnDate).format("DD/MM/YYYY") : moment().format("DD/MM/YYYY");

		const totalDisb = reportData.reduce((acc, curr) => acc + (parseFloat(curr.disb_amt) || 0), 0);
		const totalOutstanding = reportData.reduce((acc, curr) => acc + (parseFloat(curr.member_outstanding ?? curr.group_outstanding) || 0), 0);

		const workbook = new ExcelJS.Workbook();
		const worksheetName = isSHG 
			? "SHG Member Loan Outstanding" 
			: (isSociety ? "Society Loan Outstanding" : "CCB Loan Outstanding");
		const worksheet = workbook.addWorksheet(worksheetName);

		if (isSHG) {
			worksheet.columns = [
				{ width: 10 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 26 },
				{ width: 10 }, { width: 14 }, { width: 14 }, { width: 16 }, { width: 22 },
				{ width: 14 }, { width: 16 }, { width: 16 }, { width: 24 },
			];
		} else {
			worksheet.columns = [
				{ width: 10 }, { width: 16 }, { width: 16 }, { width: 26 },
				{ width: 10 }, { width: 14 }, { width: 14 }, { width: 16 }, { width: 22 },
				{ width: 14 }, { width: 16 }, { width: 16 }, { width: 24 },
			];
		}

		const bankRow = worksheet.addRow([subtitleText]);
		worksheet.mergeCells(isSHG ? "A1:N1" : "A1:M1");
		bankRow.font = { name: "Segoe UI", size: 15, bold: true, color: { argb: "FFFFFFFF" } };
		bankRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };
		bankRow.alignment = { horizontal: "center", vertical: "middle" };
		bankRow.height = 32;

		worksheet.addRow([]);

		const grpNameCode = `${metadataDtls?.group_name || "N/A"} (${metadataDtls?.group_code || "N/A"})`;
		const brnSocName = `${metadataDtls?.branch_name || "N/A"}${metadataDtls?.society_name && metadataDtls.society_name.toUpperCase() !== "DEMO" ? " / " + metadataDtls.society_name : ""}`;
		const metaRows = [
			["Group / Branch:", grpNameCode, "", "", "", "", "Branch / Society Name:", brnSocName],
			["Statement As On Date:", formattedAsOnDt, "", "", "", "", "Total Records:", reportData.length],
		];

		metaRows.forEach(r => {
			const row = worksheet.addRow([r[0], r[1], "", "", "", "", r[6], r[7]]);
			row.font = { name: "Segoe UI", size: 10 };
			row.getCell(1).font = { bold: true, color: { argb: "FF475569" } };
			row.getCell(2).font = { bold: true, color: { argb: "FF0F172A" } };
			row.getCell(7).font = { bold: true, color: { argb: "FF475569" } };
			row.getCell(8).font = { bold: true, color: { argb: "FF0F172A" } };
			row.height = 20;
		});

		worksheet.addRow([]);

		const headers = isSHG ? [
			"Sl. No.",
			"Loan ID",
			"CCB Loan ID",
			"Member Code",
			"Member Name",
			"Period",
			"Curr ROI (%)",
			"Penal ROI (%)",
			"Disb Date",
			"Disb Amount (₹)",
			"Period Mode",
			"Start Date",
			"End Date",
			"Member Outstanding (₹)"
		] : [
			"Sl. No.",
			"Loan ID",
			"Group Code",
			"Group Name",
			"Period",
			"Curr ROI (%)",
			"Penal ROI (%)",
			"Disb Date",
			"Disb Amount (₹)",
			"Period Mode",
			"Start Date",
			"End Date",
			"Group Outstanding (₹)"
		];
		const headerRow = worksheet.addRow(headers);
		headerRow.height = 26;
		headerRow.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
		headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };

		headerRow.eachCell((cell, colNumber) => {
			cell.alignment = {
				vertical: "middle",
				horizontal: isSHG 
					? ([6, 7, 8, 10, 14].includes(colNumber) ? "right" : [1, 5, 9, 11, 12, 13].includes(colNumber) ? "center" : "left")
					: ([5, 6, 7, 9, 13].includes(colNumber) ? "right" : [1, 4, 8, 10, 11, 12].includes(colNumber) ? "center" : "left")
			};
			cell.border = {
				top: { style: "thin", color: { argb: "FFCBD5E1" } },
				left: { style: "thin", color: { argb: "FFCBD5E1" } },
				bottom: { style: "medium", color: { argb: "FF0F766E" } },
				right: { style: "thin", color: { argb: "FFCBD5E1" } },
			};
		});

		reportData.forEach((item, idx) => {
			const pModeStr = item.period_mode === "M" ? "Monthly" : (item.period_mode === "Y" ? "Yearly" : (item.period_mode || "N/A"));
			const rowValues = isSHG ? [
				idx + 1,
				item.loan_id || "",
				item.ccb_loan_id || "N/A",
				item.member_code || "",
				item.member_name || "N/A",
				item.period || 0,
				parseFloat(item.curr_roi || 0),
				parseFloat(item.penal_roi || 0),
				item.disb_date ? moment(item.disb_date).format("DD/MM/YYYY") : "N/A",
				parseFloat(item.disb_amt || 0),
				pModeStr,
				item.start_date ? moment(item.start_date).format("DD/MM/YYYY") : "N/A",
				item.end_date ? moment(item.end_date).format("DD/MM/YYYY") : "N/A",
				parseFloat(item.member_outstanding || 0)
			] : [
				idx + 1,
				item.loan_id || "",
				item.group_code || "",
				item.group_name || "N/A",
				item.period || 0,
				parseFloat(item.curr_roi || 0),
				parseFloat(item.penal_roi || 0),
				item.disb_date ? moment(item.disb_date).format("DD/MM/YYYY") : "N/A",
				parseFloat(item.disb_amt || 0),
				pModeStr,
				item.start_date ? moment(item.start_date).format("DD/MM/YYYY") : "N/A",
				item.end_date ? moment(item.end_date).format("DD/MM/YYYY") : "N/A",
				parseFloat(item.group_outstanding || 0)
			];

			const dataRow = worksheet.addRow(rowValues);
			dataRow.height = 22;
			dataRow.font = { name: "Segoe UI", size: 10 };
			if (idx % 2 === 1) dataRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };

			const disbColIndex = isSHG ? 10 : 9;
			const outstColIndex = isSHG ? 14 : 13;

			dataRow.getCell(disbColIndex).numberFormat = "#,##0.00";
			dataRow.getCell(outstColIndex).numberFormat = "#,##0.00";
			dataRow.getCell(outstColIndex).font = { color: { argb: "FF0F766E" }, bold: true };

			dataRow.eachCell((cell, colNumber) => {
				cell.alignment = {
					vertical: "middle",
					horizontal: isSHG
						? ([6, 7, 8, 10, 14].includes(colNumber) ? "right" : [1, 9, 11, 12, 13].includes(colNumber) ? "center" : "left")
						: ([5, 6, 7, 9, 13].includes(colNumber) ? "right" : [1, 8, 10, 11, 12].includes(colNumber) ? "center" : "left")
				};
				cell.border = {
					top: { style: "thin", color: { argb: "FFE2E8F0" } },
					left: { style: "thin", color: { argb: "FFE2E8F0" } },
					bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
					right: { style: "thin", color: { argb: "FFE2E8F0" } },
				};
			});
		});

		worksheet.addRow([]);

		const summaryRowValues = isSHG 
			? ["TOTAL SUMMARY:", "", "", "", "", "", "", "", "", totalDisb, "", "", "", totalOutstanding]
			: ["TOTAL SUMMARY:", "", "", "", "", "", "", "", totalDisb, "", "", "", totalOutstanding];

		const summaryRow = worksheet.addRow(summaryRowValues);
		if (isSHG) {
			worksheet.mergeCells(`A${summaryRow.number}:I${summaryRow.number}`);
		} else {
			worksheet.mergeCells(`A${summaryRow.number}:H${summaryRow.number}`);
		}
		summaryRow.height = 26;
		summaryRow.font = { name: "Segoe UI", size: 11, bold: true };
		
		const titleCell = summaryRow.getCell(1);
		titleCell.alignment = { horizontal: "right", vertical: "middle" };
		titleCell.font = { bold: true, color: { argb: "FF0F172A" } };

		const disbColIdx = isSHG ? 10 : 9;
		const outstColIdx = isSHG ? 14 : 13;

		const disbCell = summaryRow.getCell(disbColIdx);
		disbCell.numberFormat = "#,##0.00";
		disbCell.font = { bold: true, color: { argb: "FF16A34A" } };
		disbCell.alignment = { horizontal: "right", vertical: "middle" };

		const outstCell = summaryRow.getCell(outstColIdx);
		outstCell.numberFormat = "#,##0.00";
		outstCell.font = { bold: true, color: { argb: "FF0F766E" } };
		outstCell.alignment = { horizontal: "right", vertical: "middle" };

		summaryRow.eachCell((cell) => {
			cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
			cell.border = {
				top: { style: "medium", color: { argb: "FF0F766E" } },
				bottom: { style: "double", color: { argb: "FF0F766E" } },
			};
		});

		const filePrefix = isSHG 
			? "SHG_Member_Loan_Outstanding_Report" 
			: (isSociety ? "Society_Loan_Outstanding_Details" : "CCB_Loan_Outstanding_Details");

		const buffer = await workbook.xlsx.writeBuffer();
		const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
		saveAs(blob, `${filePrefix}_${moment().format("DDMMYYYY")}.xlsx`);
	};

	const handlePrintMemberReport = () => {
		if (!reportData || reportData.length === 0) return;

		const isSHG = searchType === "S";
		const isSociety = searchType === "P";
		const printWindow = window.open("", "_blank");
		const totalDisb = reportData.reduce((acc, curr) => acc + (parseFloat(curr.disb_amt) || 0), 0);
		const totalOutstanding = reportData.reduce((acc, curr) => acc + (parseFloat(curr.member_outstanding ?? curr.group_outstanding) || 0), 0);
		const formattedAsOnDt = asOnDate ? moment(asOnDate).format("DD/MM/YYYY") : moment().format("DD/MM/YYYY");
		const grpNameCode = `${metadataDtls?.group_name || "N/A"} (${metadataDtls?.group_code || "N/A"})`;
		const brnSocName = `${metadataDtls?.branch_name || "N/A"}${metadataDtls?.society_name && metadataDtls.society_name.toUpperCase() !== "DEMO" ? " / " + metadataDtls.society_name : ""}`;
		const reportTitle = isSHG 
			? "SHG MEMBER LOAN OUTSTANDING REPORT" 
			: (isSociety ? "SOCIETY LOAN OUTSTANDING DETAILS" : "CCB LOAN OUTSTANDING DETAILS");

		const htmlContent = `
			<!DOCTYPE html>
			<html>
			<head>
				<title>${reportTitle}</title>
				<style>
					@page { size: A4 landscape; margin: 12mm; }
					body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 10pt; color: #1e293b; margin: 0; padding: 10px; }
					.header-banner { text-align: center; background: #0f766e; color: #ffffff; padding: 12px; border-radius: 6px; margin-bottom: 12px; }
					.header-banner h1 { margin: 0; font-size: 18pt; font-weight: 800; letter-spacing: 0.5px; }
					.header-banner h2 { margin: 4px 0 0 0; font-size: 12pt; font-weight: 600; opacity: 0.9; }
					.meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 24px; margin-bottom: 14px; background: #f8fafc; padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 9.5pt; }
					.meta-item { display: flex; justify-content: space-between; }
					.meta-label { font-weight: 700; color: #475569; }
					.meta-val { font-weight: 700; color: #0f172a; }
					table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9pt; }
					th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
					th { background-color: #0f766e; color: #ffffff; font-weight: 700; text-transform: uppercase; font-size: 8.5pt; }
					tr:nth-child(even) { background-color: #f8fafc; }
					.text-right { text-align: right; }
					.text-center { text-align: center; }
					.font-bold { font-weight: 700; }
					.total-row { background-color: #f1f5f9; font-weight: 700; font-size: 9.5pt; border-top: 2px solid #0f766e; border-bottom: 2px double #0f766e; }
					.footer-sign { margin-top: 30px; display: flex; justify-content: space-between; font-size: 9.5pt; font-weight: 700; color: #475569; }
				</style>
			</head>
			<body>
				<div class="header-banner">
					<h1>${reportTitle}</h1>
				</div>

				<div class="meta-grid">
					<div class="meta-item"><span class="meta-label">Group / Branch:</span> <span class="meta-val">${grpNameCode}</span></div>
					<div class="meta-item"><span class="meta-label">Branch / Society:</span> <span class="meta-val">${brnSocName}</span></div>
					<div class="meta-item"><span class="meta-label">Statement As On Date:</span> <span class="meta-val">${formattedAsOnDt}</span></div>
					<div class="meta-item"><span class="meta-label">Total Records:</span> <span class="meta-val">${reportData.length}</span></div>
				</div>

				<table>
					<thead>
						<tr>
							<th class="text-center">Sl.</th>
							<th>Loan ID</th>
							${isSHG ? '<th>CCB Loan ID</th>' : ''}
							<th>${isSHG ? 'Member Code' : 'Group Code'}</th>
							<th>${isSHG ? 'Member Name' : 'Group Name'}</th>
							<th class="text-center">Period</th>
							<th class="text-right">Curr ROI (%)</th>
							<th class="text-right">Penal ROI (%)</th>
							<th class="text-center">Disb Date</th>
							<th class="text-right">Disb Amount (₹)</th>
							<th class="text-center">Period Mode</th>
							<th class="text-center">Start Date</th>
							<th class="text-center">End Date</th>
							<th class="text-right">${isSHG ? 'Member Outstanding (₹)' : 'Group Outstanding (₹)'}</th>
						</tr>
					</thead>
					<tbody>
						${reportData.map((item, idx) => `
							<tr>
								<td class="text-center">${idx + 1}</td>
								<td>${item?.loan_id || ""}</td>
								${isSHG ? `<td>${item?.ccb_loan_id || "N/A"}</td>` : ''}
								<td>${item?.member_code || item?.group_code || ""}</td>
								<td class="font-bold">${item?.member_name || item?.group_name || "N/A"}</td>
								<td class="text-center">${item?.period || 0}</td>
								<td class="text-right">${Number(item?.curr_roi || 0).toFixed(2)}</td>
								<td class="text-right">${Number(item?.penal_roi || 0).toFixed(2)}</td>
								<td class="text-center">${item?.disb_date ? moment(item.disb_date).format("DD/MM/YYYY") : "N/A"}</td>
								<td class="text-right">${Number(item?.disb_amt || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
								<td class="text-center">${item?.period_mode === "M" ? "Monthly" : (item?.period_mode === "Y" ? "Yearly" : (item?.period_mode || "N/A"))}</td>
								<td class="text-center">${item?.start_date ? moment(item.start_date).format("DD/MM/YYYY") : "N/A"}</td>
								<td class="text-center">${item?.end_date ? moment(item.end_date).format("DD/MM/YYYY") : "N/A"}</td>
								<td class="text-right font-bold" style="color:#0f766e;">${Number(item?.member_outstanding ?? item?.group_outstanding ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
							</tr>
						`).join("")}
					</tbody>
					<tfoot>
						<tr class="total-row">
							<td colSpan="${isSHG ? 9 : 8}" class="text-right font-bold">TOTAL SUMMARY:</td>
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
		`;

		printWindow.document.write(htmlContent);
		printWindow.document.close();
	};

	const fetchSearchTypeName = (searchType) => {
		if (searchType === "S") return "SHG"
		if (searchType === "P") return "Society"
		if (searchType === "B") return "CCB"
		return "Report"
	}

	const filteredReportData = React.useMemo(() => {
		if (searchType === "S" || !groupSearch || !groupSearch.trim()) return reportData;
		const q = groupSearch.trim().toLowerCase();
		return reportData.filter(item => {
			const codeMatch = String(item.group_code || item.group_id || item.grp_code || item.loan_id || "").toLowerCase().includes(q);
			const nameMatch = String(item.group_name || item.grp_name || item.shg_name || "").toLowerCase().includes(q);
			return codeMatch || nameMatch;
		});
	}, [reportData, groupSearch, searchType]);

	const dataToExport = filteredReportData

	const headersToExport =
		searchType === "S"
			? shgMemberOutstandingHeader
			: (searchType === "P" ? groupwiseOutstandingHeader : branchwiseOutstandingHeader)

	const fileName = `Outstanding_Report_${fetchSearchTypeName(searchType)}_${new Date().toLocaleString("en-GB")}.xlsx`

	const dropdownOptions = branches?.map((item) => {
		if (searchBrnchDiv === "B") {
			return {
				value: item.branch_assign_id,
				label: `${item.branch_name} - ${item.branch_assign_id}`,
			}
		}
		if (searchBrnchDiv === "D") {
			return {
				value: item.branch_code,
				label: `${item.division}`,
			}
		}
		return null
	}).filter(Boolean)

	useEffect(() => {
		setFromDate('')
		setToDate('')
		setReportData([])
		setSelectedOptions([])
	}, [searchBrnchDiv])

	const displayedOptions = selectedOptions.length === dropdownOptions.length ? selectedOptions : selectedOptions;

	const handleMultiSelectChange = (selected) => {
		const selectedArray = Array.isArray(selected) ? selected : selected ? [selected] : []
		setSelectedOptions(selectedArray)
	}

	const handlePrint = useCallback(() => {
		printTableReport(dataToExport, headersToExport, fileName?.split(",")[0], [29, 31])
	}, [dataToExport, headersToExport, fileName])

	useCtrlP(handlePrint)

	const populateColumns = (main_dt, headerExport) => {
		const columnToBeShown = Object.keys(main_dt[0]).map((key, index) => ({ header: headerExport[key], index }));
		setColumns(columnToBeShown);
		setSelectedColumns(columnToBeShown.map(el => el.index));
	}

	const getWeekOfRecoveryName = (code) => {
		const day = Fortnight.find((d) => d.code === String(code));
		return day ? day.name : "--";
	};

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
									Loan Outstanding Report
								</h1>
								<p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
									View and process outstanding loan balances for SHG, Society, and Branch accounts
								</p>
							</div>
						</div>
					</div>

					{/* Filters Card */}
					<div className="bg-slate-50/90 dark:bg-slate-800/60 p-5 md:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm mb-6 space-y-5">
						{/* Search By Options (SHG, Society, Branch) and Select Branch / Society Dropdown */}
						<div className="flex flex-wrap items-center gap-6">
							<div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200/60 dark:border-slate-700 shadow-sm">
								<span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Search By:</span>
								<Radiobtn
									data={options}
									val={searchType}
									className="!mt-0 !mb-0 !shadow-none !p-0 inline-flex items-center"
									onChangeVal={(value) => {
										onChange(value)
									}}
								/>
							</div>

							{/* Render Select Branch and Select Society side by side when Society ('P') is selected, else Select Branch dropdown */}
							{searchType === "P" ? (
								<div className="flex flex-wrap md:flex-nowrap items-center gap-4 flex-1">
									{/* Select Branch */}
									<div className="flex items-center justify-center gap-3 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200/60 dark:border-slate-700 min-w-[220px] shadow-sm">
										<span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider whitespace-nowrap">
											Select Branch:
										</span>
										<div className="flex-1">
											<TDInputTemplateBr
												placeholder="Select Branch..."
												type="text"
												label=""
												name="branch"
												formControlName={(branch && branch !== "undefined" && branch.split(",")[0] !== "undefined") ? branch.split(",")[0] : ""}
												handleChange={(e) => {
													handleBranchChange(e);
													const val = e?.target?.value !== undefined ? e.target.value : e;
													const bCode = val ? val.split(",")[0] : "";
													handleFetchSocietyList(bCode);
												}}
												mode={2}
												data={branchOptions}
											/>
										</div>
									</div>

									{/* Select Society */}
									<div className="flex items-center justify-center gap-3 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200/60 dark:border-slate-700 flex-1 min-w-[240px] shadow-sm">
										<span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider whitespace-nowrap">
											Select Society:
										</span>
										<div className="flex-1">
											<TDInputTemplateBr
												placeholder="Select Society..."
												type="text"
												label=""
												name="society"
												formControlName={(society && society !== "undefined" && society.split(",")[0] !== "undefined") ? society.split(",")[0] : ""}
												handleChange={handleSocietyChange}
												mode={2}
												data={societyOptions}
											/>
										</div>
									</div>
								</div>
							) : (
								<div className="flex items-center justify-center gap-3 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200/60 dark:border-slate-700 flex-1 min-w-[240px] shadow-sm">
									<span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider whitespace-nowrap text-center">
										Select Branch:
									</span>
									<div className="flex-1">
										<TDInputTemplateBr
											placeholder="Select Branch..."
											type="text"
											label=""
											name="branch"
											formControlName={(branch && branch !== "undefined" && branch.split(",")[0] !== "undefined") ? branch.split(",")[0] : ""}
											handleChange={handleBranchChange}
											mode={2}
											data={branchOptions}
										/>
									</div>
								</div>
							)}
						</div>

						{/* Group Code / Group Name Input, As on Date & Search Button (Only rendered when SHG is selected) */}
						{searchType === "S" && (
							<div className="flex flex-col md:flex-row items-end gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
								<div className="flex-1 w-full">
									<TDInputTemplateBr
										placeholder="Search via Group Code or Group Name"
										type="text"
										label="Group Code / Group Name"
										name="groupSearch"
										handleChange={(txt) => setGroupSearch(txt.target.value)}
										formControlName={groupSearch}
										mode={1}
									/>
								</div>

								<div className="w-full md:w-56">
									<TDInputTemplateBr
										placeholder="As on Date"
										type="date"
										label="As on Date"
										name="asOnDate"
										formControlName={asOnDate}
										handleChange={(e) => {
											const val = e.target.value;
											const todayStr = formatDateToYYYYMMDD(new Date());
											if (val > todayStr) {
												Message("warning", "Future date is not allowed for As on Date");
												setAsOnDate(todayStr);
											} else {
												setAsOnDate(val);
											}
										}}
										max={formatDateToYYYYMMDD(new Date())}
										mode={1}
									/>
								</div>

								<div className="pb-[1px]">
									{(() => {
										const isBranchSelected = Boolean(branch && branch.trim());
										return (
											<button
												disabled={!isBranchSelected}
												className={`h-[38px] inline-flex items-center justify-center px-5 text-xs font-semibold text-white rounded transition-all duration-200 shadow-sm gap-1.5 ${isBranchSelected
														? "bg-teal-500 hover:bg-green-600 border border-teal-500 hover:border-green-600 cursor-pointer active:scale-95"
														: "bg-slate-300 dark:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-400 cursor-not-allowed opacity-60 active:scale-100"
													}`}
												onClick={() => {
													handleSearchGroupList();
												}}
											>
												<SearchOutlined className="text-xs" />
												<span>Search</span>
											</button>
										);
									})()}
								</div>
							</div>
						)}

						{/* As on Date & View Outstanding Button for Society (P) and CCB (B) modes */}
						{(searchType === "P" || searchType === "B") && (
							<div className="flex flex-col md:flex-row items-end gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
								<div className="w-full md:w-56">
									<TDInputTemplateBr
										placeholder="As on Date"
										type="date"
										label="As on Date"
										name="asOnDate"
										formControlName={asOnDate}
										handleChange={(e) => {
											const val = e.target.value;
											const todayStr = formatDateToYYYYMMDD(new Date());
											if (val > todayStr) {
												Message("warning", "Future date is not allowed for As on Date");
												setAsOnDate(todayStr);
											} else {
												setAsOnDate(val);
											}
										}}
										max={formatDateToYYYYMMDD(new Date())}
										mode={1}
									/>
								</div>

								<div className="pb-[1px]">
									{(() => {
										const isBranchSelected = Boolean(branch && branch.trim());
										const isSocietySelected = searchType === "P" ? Boolean(society && society.trim()) : true;
										const canSubmit = isBranchSelected && isSocietySelected && Boolean(asOnDate);

										return (
											<button
												disabled={!canSubmit}
												className={`h-[38px] inline-flex items-center justify-center px-5 text-xs font-semibold text-white rounded transition-all duration-200 shadow-sm gap-1.5 ${canSubmit
														? "bg-teal-600 hover:bg-teal-700 border border-teal-600 hover:border-teal-700 cursor-pointer active:scale-95"
														: "bg-slate-300 dark:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-400 cursor-not-allowed opacity-60 active:scale-100"
													}`}
												onClick={() => {
													handleSubmit();
												}}
											>
												<SearchOutlined className="text-xs" />
												<span>View Outstanding</span>
											</button>
										);
									})()}
								</div>
							</div>
						)}

						{/* MultiSelect for Head Office (if brn_code == 100) */}
						{userDetails?.brn_code == 100 && (
							<div className="flex items-center gap-4 pt-1">
								<span className="text-xs font-semibold text-slate-500">Filter By:</span>
								<Radiobtn
									data={brnchwis_divwise}
									val={searchBrnchDiv}
									onChangeVal={(value) => {
										onChange3BrnDiv(value)
									}}
								/>
							</div>
						)}

						{(userDetails?.id === 3 || userDetails?.id === 4 || userDetails?.id === 11) && userDetails?.brn_code == 100 && (
							<div className="w-full">
								<Select
									options={[...dropdownOptions]}
									isMulti={searchBrnchDiv === "B"}
									value={searchBrnchDiv === "B" ? displayedOptions : displayedOptions?.[0] || null}
									onChange={handleMultiSelectChange}
									placeholder={searchBrnchDiv === "B" ? "Select branches..." : "Select division..."}
									className="basic-multi-select"
									classNamePrefix="select"
									styles={{
										control: (provided) => ({ ...provided, borderRadius: "8px" }),
										valueContainer: (provided) => ({ ...provided, borderRadius: "8px" }),
										singleValue: (provided) => ({ ...provided, color: "black" }),
										multiValue: (provided) => ({ ...provided, padding: "0.1rem", backgroundColor: "#0f766e", color: "white", borderRadius: "8px" }),
										multiValueLabel: (provided) => ({ ...provided, color: "white" }),
										multiValueRemove: (provided) => ({ ...provided, color: "white", "&:hover": { backgroundColor: "red", color: "white", borderRadius: "8px" } }),
										placeholder: (provided) => ({ ...provided, fontSize: "0.9rem" }),
									}}
								/>
							</div>
						)}

						{/* Date Selector & Search Button (Commented Off as requested) */}
						{/* <div className="flex items-center gap-4 pt-2">
							<div>
								<button
									className="h-[38px] inline-flex items-center justify-center px-6 text-xs font-bold text-white bg-teal-500 hover:bg-emerald-600 border border-teal-500 hover:border-emerald-600 rounded-lg transition-all duration-200 shadow-sm gap-2 cursor-pointer active:scale-95"
									onClick={handleSubmit}
								>
									<Search className="text-sm" />
									<span>Search</span>
								</button>
							</div>
						</div> */}
					</div>

					{/* Group Search Results Table (SHG mode) */}
					{searchType === "S" && groupSearchResults.length > 0 && (
						<div className="my-6 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
							<div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
								<h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
									<span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
									<span>Group Search Results</span>
								</h3>
								<p className="text-xs text-slate-500 dark:text-slate-400">
									{groupSearchResults.length} Group(s) Found
								</p>
							</div>

							<div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm max-h-96">
								<table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
									<thead className="text-xs uppercase bg-slate-800 text-slate-100 dark:bg-slate-900 sticky top-0 z-10">
										<tr>
											<th scope="col" className="px-6 py-3.5 font-bold tracking-wider">Group Code</th>
											<th scope="col" className="px-6 py-3.5 font-bold tracking-wider">Group Name</th>
											<th scope="col" className="px-6 py-3.5 font-bold tracking-wider">Branch Name</th>
											<th scope="col" className="px-6 py-3.5 font-bold tracking-wider">Society Name</th>
											<th scope="col" className="px-6 py-3.5 font-bold tracking-wider text-center">Action</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-200 dark:divide-slate-800">
										{groupSearchResults.map((item, i) => (
											<tr key={i} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
												<td className="px-6 py-3.5 font-mono text-teal-600 font-medium">{item?.group_code}</td>
												<td className="px-6 py-3.5 font-semibold text-slate-800 dark:text-slate-200">{item?.group_name}</td>
												<td className="px-6 py-3.5">{item?.branch_name || "N/A"}</td>
												<td className="px-6 py-3.5 font-medium text-slate-800 dark:text-slate-100">
													{(() => {
														const sName = item?.society_name || item?.pacs_name || item?.branch_shg_name || "";
														if (!sName || sName.trim().toUpperCase() === "DEMO" || item?.pacs_id == 111 || item?.pacs_id === "111") {
															return "N/A";
														}
														return sName;
													})()}
												</td>
												<td className="px-6 py-3.5 text-center">
													<Tooltip title={!asOnDate ? "Please select As on Date" : ""}>
														<span>
															<button
																onClick={() => handleFetchGroupOutstandingDetails(item)}
																disabled={!asOnDate}
																className="px-4 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800 rounded-lg transition-all shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
															>
																View Outstanding
															</button>
														</span>
													</Tooltip>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}



					{/* Column Selector */}
					{reportData.length > 0 && (
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

					{/* Report Data Table (SHG, Society & CCB Loan Details styled like Loan Statement) */}
					{reportData.length > 0 && (
						<div className="mt-6 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
							<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
								<div>
									<h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
										<span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
										<span>
											{searchType === "S" ? "SHG Member Loan Details" : (searchType === "P" ? "Society Group Loan Details" : "CCB Group Loan Details")}
										</span>
									</h3>
									<p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
										{reportData.length} Record(s) Found {metadataDtls?.group_name ? `for ${metadataDtls.group_name}` : ""}
									</p>
								</div>
							</div>

							<div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm max-h-[500px]">
								<table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
									<thead className="text-xs uppercase bg-slate-800 text-slate-100 dark:bg-slate-900 sticky top-0 z-10">
										<tr>
											<th scope="col" className="px-4 py-3 font-bold tracking-wider">Loan ID</th>
											{searchType === "S" && (
												<th scope="col" className="px-4 py-3 font-bold tracking-wider">CCB Loan ID</th>
											)}
											<th scope="col" className="px-4 py-3 font-bold tracking-wider">{searchType === "S" ? "Member Code" : "Group Code"}</th>
											<th scope="col" className="px-4 py-3 font-bold tracking-wider">{searchType === "S" ? "Member Name" : "Group Name"}</th>
											<th scope="col" className="px-4 py-3 font-bold tracking-wider text-center">Period</th>
											<th scope="col" className="px-4 py-3 font-bold tracking-wider text-right">Curr ROI (%)</th>
											<th scope="col" className="px-4 py-3 font-bold tracking-wider text-right">Penal ROI (%)</th>
											<th scope="col" className="px-4 py-3 font-bold tracking-wider">Disb Date</th>
											<th scope="col" className="px-4 py-3 font-bold tracking-wider text-right">Disb Amount (₹)</th>
											<th scope="col" className="px-4 py-3 font-bold tracking-wider text-center">Period Mode</th>
											<th scope="col" className="px-4 py-3 font-bold tracking-wider">Start Date</th>
											<th scope="col" className="px-4 py-3 font-bold tracking-wider">End Date</th>
											<th scope="col" className="px-4 py-3 font-bold tracking-wider text-right">{searchType === "S" ? "Member Outstanding (₹)" : "Group Outstanding (₹)"}</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-200 dark:divide-slate-800">
										{reportData.map((item, i) => (
											<tr key={i} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
												<td className="px-4 py-3 font-mono text-teal-600 font-medium">{item?.loan_id}</td>
												{searchType === "S" && (
													<td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">{item?.ccb_loan_id || "N/A"}</td>
												)}
												<td className="px-4 py-3 font-mono text-slate-800 dark:text-slate-200">{item?.member_code || item?.group_code}</td>
												<td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{item?.member_name || item?.group_name || "N/A"}</td>
												<td className="px-4 py-3 text-center">{item?.period || 0}</td>
												<td className="px-4 py-3 text-right">{Number(item?.curr_roi || 0).toFixed(2)}</td>
												<td className="px-4 py-3 text-right">{Number(item?.penal_roi || 0).toFixed(2)}</td>
												<td className="px-4 py-3">{item?.disb_date ? moment(item.disb_date).format("DD/MM/YYYY") : "N/A"}</td>
												<td className="px-4 py-3 text-right font-medium">{Number(item?.disb_amt || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
												<td className="px-4 py-3 text-center">{item?.period_mode === "M" ? "Monthly" : (item?.period_mode === "Y" ? "Yearly" : (item?.period_mode || "N/A"))}</td>
												<td className="px-4 py-3">{item?.start_date ? moment(item.start_date).format("DD/MM/YYYY") : "N/A"}</td>
												<td className="px-4 py-3">{item?.end_date ? moment(item.end_date).format("DD/MM/YYYY") : "N/A"}</td>
												<td className="px-4 py-3 text-right font-bold text-teal-600 dark:text-teal-400">
													{Number(item?.member_outstanding ?? item?.group_outstanding ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
												</td>
											</tr>
										))}
									</tbody>
									<tfoot className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-slate-100 border-t-2 border-slate-300 dark:border-slate-700">
										<tr>
											<td colSpan={searchType === "S" ? 8 : 7} className="px-4 py-3 text-right uppercase tracking-wider">Total Summary:</td>
											<td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">
												{reportData.reduce((sum, item) => sum + Number(item?.disb_amt || 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
											</td>
											<td colSpan={3}></td>
											<td className="px-4 py-3 text-right text-teal-600 dark:text-teal-400">
												{reportData.reduce((sum, item) => sum + Number(item?.member_outstanding ?? item?.group_outstanding ?? 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
											</td>
										</tr>
									</tfoot>
								</table>
							</div>
						</div>
					)}

					{/* Export & Print Action Footer */}
					{reportData.length !== 0 && (
						<div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
							<button
								onClick={() => {
									handleExcelExportMemberReport();
								}}
								className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-400 dark:border-emerald-800 rounded-xl shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
							>
								<span>Download Excel</span>
							</button>

							<button
								onClick={() => {
									handlePrintMemberReport();
								}}
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
