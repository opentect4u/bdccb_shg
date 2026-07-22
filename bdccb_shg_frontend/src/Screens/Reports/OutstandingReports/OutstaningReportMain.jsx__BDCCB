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
	ExportOutlined,
} from "@ant-design/icons"
import { RefreshOutlined, Search } from "@mui/icons-material"
import Radiobtn from "../../../Components/Radiobtn"
import TDInputTemplateBr from "../../../Components/TDInputTemplateBr"
import { formatDateToYYYYMMDD } from "../../../Utils/formateDate"

import { saveAs } from "file-saver"
import * as XLSX from "xlsx"
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

const options = [
	{
		label: "Groupwise",
		value: "G",
	},
	{
		label: "Fundwise",
		value: "F",
	},
	{
		label: "CO-wise",
		value: "C",
	},
	{
		label: "Memberwise",
		value: "M",
	},
	{
		label: "Branchwise",
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
	const userDetails = JSON.parse(localStorage.getItem("user_details")) || ""
	const [loading, setLoading] = useState(false)
	const [searchType, setSearchType] = useState("G")
	const [fromDate, setFromDate] = useState()
	const [toDate, setToDate] = useState()
	const [reportData, setReportData] = useState([])
	const [metadataDtls, setMetadataDtls] = useState(null)
	const [fetchedReportDate, setFetchedReportDate] = useState(() => "")
	const [funds, setFunds] = useState([])
	const [selectedFund, setSelectedFund] = useState("")
	const [cos, setCOs] = useState([])
	const [branches, setBranches] = useState([])
	const [selectedCO, setSelectedCO] = useState("")
	const [selectedOptions, setSelectedOptions] = useState([])
	const [selectedCOs, setSelectedCOs] = useState([])
	const [procedureSuccessFlag, setProcedureSuccessFlag] = useState("0")
	const [conditionState, setConditionState] = useState("current")

	// Branchwise And Divisionwise options
	const [searchBrnchDiv, setSearchBrnchDiv] = useState(() => "B")

	const navigate = useNavigate()
	

	const onChange = (e) => {
		console.log("radio1 checked", e)
		setSearchType(e)
	}

	// Branchwise And Divisionwise options
	const onChange3BrnDiv = (e) => {
	// RESET branch selection
	setSelectedOptions([])
	// setSelectedOptionsCondition('no-data')

	setSearchBrnchDiv(e)
	getBranches(e)
	}

	const handleFetchReportOutstandingMemberwise = async () => {
		setLoading(true)

		const branchCodes = selectedOptions?.map((item, i) => item?.value)

		const creds = {
			branch_code:
				branchCodes?.length === 0 ? userDetails?.brn_code : branchCodes,
			supply_date: formatDateToYYYYMMDD(fromDate),
		}

		if(conditionState === "current"){
		
		// const tokenValue = await getLocalStoreTokenDts(navigate);

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios
			.post(`${url}/loan_outstanding_report_memberwise_new`, creds , {
headers: {
Authorization: `${tokenValue?.token}`, // example header
"Content-Type": "application/json", // optional
},
})
			.then((res) => {

				if(res?.data?.suc === 0){
				Message('error', res?.data?.msg)
				navigate(routePaths.LANDING)
				localStorage.clear()


				} else {

				if(res?.data?.outstanding_member_data?.suc > 0) {
				const data = res?.data?.outstanding_member_data?.msg || []
				setFetchedReportDate(
					new Date(res?.data?.balance_date).toLocaleDateString("en-GB")
				)
				setReportData(data)
				populateColumns(res?.data?.outstanding_member_data?.msg,memberwiseOutstandingHeader);	

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

		if(conditionState === "old"){
		
		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios
			.post(`${url}/loan_outstanding_report_memberwise`, creds, {
headers: {
Authorization: `${tokenValue?.token}`, // example header
"Content-Type": "application/json", // optional
},
})
			.then((res) => {

				if(res?.data?.suc === 0){
				// Message('error', res?.data?.msg)
				navigate(routePaths.LANDING)
				localStorage.clear()
				} else {
				const data = res?.data?.outstanding_member_data?.msg || []
				setFetchedReportDate(
					new Date(res?.data?.balance_date).toLocaleDateString("en-GB")
				)
				setReportData(data)
				populateColumns(res?.data?.outstanding_member_data?.msg,memberwiseOutstandingHeader);	
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

		const creds = {
			branch_code:
				branchCodes?.length === 0 ? [userDetails?.brn_code] : branchCodes,
			supply_date: formatDateToYYYYMMDD(fromDate),
		}

		if(conditionState === "current"){
		
		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios
			.post(`${url}/loan_outstanding_report_branchwise_new`, creds, {
headers: {
Authorization: `${tokenValue?.token}`, // example header
"Content-Type": "application/json", // optional
},
})
			.then((res) => {

			if(res?.data?.suc === 0){
			Message('error', res?.data?.msg)
			navigate(routePaths.LANDING)
			localStorage.clear()
			} else {

			if(res?.data?.outstanding_branch_data?.suc > 0) {

			const data = res?.data?.outstanding_branch_data?.msg || []
			if (data.length === 0) {
			console.log("--------------- NO DATA ---------------", data?.length)
			}

			console.log("---------- DATA BRN WISE -----------", res?.data)
			setFetchedReportDate(
			new Date(res?.data?.balance_date).toLocaleDateString("en-GB")
			)
			setReportData(data)
			populateColumns(res?.data?.outstanding_branch_data?.msg,branchwiseOutstandingHeader)
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

		if(conditionState === "old"){
		
		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios
			.post(`${url}/loan_outstanding_report_branchwise`, creds, {
headers: {
Authorization: `${tokenValue?.token}`, // example header
"Content-Type": "application/json", // optional
},
})
			.then((res) => {

			if(res?.data?.suc === 0){
			// Message('error', res?.data?.msg)
			navigate(routePaths.LANDING)
			localStorage.clear()
			} else {
				const data = res?.data?.outstanding_branch_data?.msg || []
				// if (data.length === 0) {
				// 	console.log("--------------- NO DATA ---------------", data?.length)
				// }

				// console.log("---------- DATA BRN WISE -----------", res?.data)
				setFetchedReportDate(
					new Date(res?.data?.balance_date).toLocaleDateString("en-GB")
				)
				setReportData(data)
				populateColumns(res?.data?.outstanding_branch_data?.msg,branchwiseOutstandingHeader)

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
		console.log("BRNADHIKUDUSTYSTUDGF", branchCodes)

		const creds = {
			branch_code:
				branchCodes?.length === 0 ? [userDetails?.brn_code] : branchCodes,
			supply_date: formatDateToYYYYMMDD(fromDate),
		}
		

		if(conditionState === "current"){

		const tokenValue = await getLocalStoreTokenDts(navigate);

			await axios
			.post(`${url}/loan_outstanding_report_groupwise_new`, creds, {
headers: {
Authorization: `${tokenValue?.token}`, // example header
"Content-Type": "application/json", // optional
},
})
			.then((res) => {

				if(res?.data?.suc === 0){
				// Message('error', res?.data?.msg)
				navigate(routePaths.LANDING)
				localStorage.clear()

				

				} else {

				if(res?.data?.outstanding_data?.suc > 0) {

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

				// if(res?.data?.outstanding_data?.suc > 0) {

				// const data = res?.data?.outstanding_data?.msg || []

				// setFetchedReportDate(new Date(res?.data?.balance_date).toLocaleDateString("en-GB"))
				
				// setReportData(data)
				// populateColumns(res?.data?.outstanding_data?.msg, groupwiseOutstandingHeader)
					
				// } else {
				// 	Message("error", res?.data?.outstanding_data?.msg[0])
				// 	setReportData([])
				// 	populateColumns([], groupwiseOutstandingHeader)
				// }
				

			})
			.catch((err) => {
				console.log("ERRRR>>>", err)
		})
		
		} 
		
		if(conditionState === "old"){

			const tokenValue = await getLocalStoreTokenDts(navigate);

			await axios
			.post(`${url}/loan_outstanding_report_groupwise`, creds, {
			headers: {
			Authorization: `${tokenValue?.token}`, // example header
			"Content-Type": "application/json", // optional
			},
			})
			.then((res) => {

				if(res?.data?.suc === 0){
				// Message('error', res?.data?.msg)
				navigate(routePaths.LANDING)
				localStorage.clear()
				} else {

				const data = res?.data?.outstanding_data?.msg || []
				// if (data.length === 0) {
				// 	console.log(
				// 		"--------------- LOOP BREAKS ---------------",
				// 		data?.length
				// 	)
				// }

				console.log("---------- DATA GROUPWISE -----------", res?.data)
				setFetchedReportDate(
					new Date(res?.data?.balance_date).toLocaleDateString("en-GB")
				)
				setReportData(data)
				populateColumns(res?.data?.outstanding_data?.msg,groupwiseOutstandingHeader)

			}

			})
			.catch((err) => {
				console.log("ERRRR>>>", err)
		})
		}

		

		setLoading(false)
	}

	const getFunds = async () => {
		setLoading(true)

		const tokenValue = await getLocalStoreTokenDts(navigate);

		axios
			.get(`${url}/get_fund`, {
headers: {
Authorization: `${tokenValue?.token}`, // example header
"Content-Type": "application/json", // optional
},
})
			.then((res) => {
				if(res?.data?.suc === 0){
// Message('error', res?.data?.msg)
navigate(routePaths.LANDING)
localStorage.clear()
} else {
				setFunds(res?.data?.msg)
}
			})
			.catch((err) => {
				console.log("ERRRR>>>", err)
				setLoading(false)
			})
		setLoading(false)
	}

	const handleFundChange = (e) => {
		const selectedId = e.target.value
		setSelectedFund(selectedId)
	}

	const handleFetchReportOutstandingFundwise = async () => {
		setLoading(true)

		const branchCodes = selectedOptions?.map((item, i) => item?.value)
		const selectedFunds = funds?.map((item, i) => item?.fund_id)

		const creds = {
			supply_date: formatDateToYYYYMMDD(fromDate),
			branch_code:
				branchCodes?.length === 0 ? [userDetails?.brn_code] : branchCodes,
			// fund_id: selectedFund === "F" ? selectedFunds : [selectedFund],
			fund_id: selectedFund ? selectedFund === "F" ? selectedFunds : [selectedFund] : ["0"]
		}

		if(conditionState === "current"){

			const tokenValue = await getLocalStoreTokenDts(navigate);

			await axios
			.post(`${url}/loan_outstanding_report_fundwise_new`, creds, {
headers: {
Authorization: `${tokenValue?.token}`, // example header
"Content-Type": "application/json", // optional
},
})
			.then((res) => {

			if(res?.data?.suc === 0){
			// Message('error', res?.data?.msg)
			navigate(routePaths.LANDING)
			localStorage.clear()
			} else {

			if(res?.data?.outstanding_fund_data?.suc > 0) {

			const data = res?.data?.outstanding_fund_data?.msg || []

			setFetchedReportDate(
			new Date(res?.data?.balance_date).toLocaleDateString("en-GB")
			)
			setReportData(data);
			populateColumns(res?.data?.outstanding_fund_data?.msg,fundwiseOutstandingHeader)

			} else {
			Message("error", res?.data?.outstanding_fund_data?.msg[0])
			setReportData([])
			populateColumns([], fundwiseOutstandingHeader)

			}

			}
				

			})
			.catch((err) => {
				console.log("ERRRR>>>", err)
			})

		}
		
		if(conditionState === "old"){

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios
			.post(`${url}/loan_outstanding_report_fundwise`, creds, {
			headers: {
			Authorization: `${tokenValue?.token}`, // example header
			"Content-Type": "application/json", // optional
			},
			})

			.then((res) => {

				if(res?.data?.suc === 0){
// Message('error', res?.data?.msg)
navigate(routePaths.LANDING)
localStorage.clear()
} else {
				const data = res?.data?.outstanding_fund_data?.msg || []
				// if (data.length === 0) {
				// 	console.log("--------------- NO DATA ---------------", data?.length)
				// }

				// console.log("---------- DATA FUNDWISE -----------", res?.data)
				setFetchedReportDate(
					new Date(res?.data?.balance_date).toLocaleDateString("en-GB")
				)
				setReportData(data);
				populateColumns(res?.data?.outstanding_fund_data?.msg,fundwiseOutstandingHeader)
			}

			})
			.catch((err) => {
				console.log("ERRRR>>>", err)
			})

		}

		setLoading(false)
	}

	const getCOs = async () => {
		setLoading(true)

		const branchCodes = selectedOptions?.map((item, i) => item?.value)

		const creds = {
			branch_code:
				branchCodes?.length === 0 ? [userDetails?.brn_code] : branchCodes,
		}

		const tokenValue = await getLocalStoreTokenDts(navigate);

		axios
			.post(`${url}/fetch_brn_co`, creds, {
headers: {
Authorization: `${tokenValue?.token}`, // example header
"Content-Type": "application/json", // optional
},
})
			.then((res) => {
				
				if(res?.data?.suc === 0){
// Message('error', res?.data?.msg)
navigate(routePaths.LANDING)
localStorage.clear()
} else {
				setCOs(res?.data?.msg)
}
			})
			.catch((err) => {
				console.log("ERRRR>>>", err)
				setLoading(false)
			})
		setLoading(false)
	}

	const handleCOChange = (e) => {
		const selectedId = e.target.value
		setSelectedCO(selectedId)
	}

	const handleFetchReportOutstandingCOwise = async () => {
		setLoading(true)

		const branchCodes = selectedOptions?.map((item, i) => item?.value)
		const coCodes = selectedCOs?.map((item, i) => item?.value)
		const allCos = cos?.map((item, i) => item?.co_id)
		console.log('coCodes -- ' + coCodes);
		const creds = {
			supply_date: formatDateToYYYYMMDD(fromDate),
			branch_code:
				branchCodes?.length === 0 ? [userDetails?.brn_code] : branchCodes,
			// co_id:
			// 	coCodes?.length === 0
			// 		? selectedCO === "AC"
			// 			? allCos
			// 			: [selectedCO]
			// 		: coCodes || [],
			co_id:
				coCodes?.length === 0
					? selectedCO === "AC"
						? allCos
						: selectedCO
						? [selectedCO]
						: ["0"]
					: coCodes,
					
		}

		if(conditionState === "current"){

			const tokenValue = await getLocalStoreTokenDts(navigate);

			await axios
			.post(`${url}/loan_outstanding_report_cowise_new`, creds, {
headers: {
Authorization: `${tokenValue?.token}`, // example header
"Content-Type": "application/json", // optional
},
})
			.then((res) => {
				// Message("error", res?.data?.outstanding_co_data?.msg[0])
				
				if(res?.data?.suc === 0){
				// Message('error', res?.data?.msg)
				navigate(routePaths.LANDING)
				localStorage.clear()
				} else {
				if(res?.data?.outstanding_co_data?.suc > 0) {
				
				const data = res?.data?.outstanding_co_data?.msg || []
				// if (data.length === 0) {
				// 	console.log("--------------- NO DATA ---------------", data?.length)
				// }

				console.log("---------- DATA CO-wise -----------", res?.data)
				setFetchedReportDate(
					new Date(res?.data?.balance_date).toLocaleDateString("en-GB")
				)
				setReportData(data)
				populateColumns(res?.data?.outstanding_co_data?.msg,cowiseOutstandingHeader);
				
				} else {
					Message("error", res?.data?.outstanding_co_data?.msg[0])
					setReportData([])
					populateColumns([], cowiseOutstandingHeader)
				}

				}

			})
			.catch((err) => {
				console.log("ERRRR>>>", err)
			})

		} 
		
		if(conditionState === "old"){

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios
			.post(`${url}/loan_outstanding_report_cowise`, creds, {
headers: {
Authorization: `${tokenValue?.token}`, // example header
"Content-Type": "application/json", // optional
},
})
			.then((res) => {

				
if(res?.data?.suc === 0){
// Message('error', res?.data?.msg)
navigate(routePaths.LANDING)
localStorage.clear()
} else {
				const data = res?.data?.outstanding_co_data?.msg || []
				// if (data.length === 0) {
				// 	console.log("--------------- NO DATA ---------------", data?.length)
				// }

				// console.log("---------- DATA CO-wise -----------", res?.data)
				setFetchedReportDate(
					new Date(res?.data?.balance_date).toLocaleDateString("en-GB")
				)
				setReportData(data)
				populateColumns(res?.data?.outstanding_co_data?.msg,cowiseOutstandingHeader);
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

		// Branchwise And Divisionwise options
		var apiUrl = ''

		if(para === 'B'){
			apiUrl = 'fetch_branch_name_based_usertype'
		}

		if(para === 'D'){
			apiUrl = 'fetch_divitionwise_branch'
		}

		const creds = {
			emp_id: userDetails?.emp_id,
			user_type: userDetails?.id,
		}

		const tokenValue = await getLocalStoreTokenDts(navigate);

		axios
			.post(`${url}/${apiUrl}`, para === 'B' ? creds : {}, {
			headers: {
			Authorization: `${tokenValue?.token}`, // example header
			"Content-Type": "application/json", // optional
			},
			})
			.then((res) => {
				
				if(res?.data?.suc === 0){
				// Message('error', res?.data?.msg)
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

	// Branchwise And Divisionwise options
	useEffect(() => {
		getBranches(searchBrnchDiv) 
	}, [])


	// useEffect(() => {
	// 	// Alert(`Invalid date selection.\n\nAllowed`)

	// 	if (!fromDate) return; // 🛑 Skip if no date selected yet
		
	// 	  const selectedDate = new Date(fromDate);
	// 	  if (isNaN(selectedDate)) return; // 🛑 Skip if invalid date
		
	// 	  const today = new Date();
		
	// 	  const currentYear = today.getFullYear();
	// 	  const currentMonth = today.getMonth();
	// 	  const selectedYear = selectedDate.getFullYear();
	// 	  const selectedMonth = selectedDate.getMonth();
		
	// 	  const endOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0);
	// 	  const endOfSelectedMonth = new Date(selectedYear, selectedMonth + 1, 0);
		
	// 	  const format = (d) => d.toISOString().slice(0, 10);
		
	// 	  // ✅ CASE 1: Today’s date
	// 	  const isToday = selectedDate.toDateString() === today.toDateString();
		
	// 	  // ✅ CASE 2: End of current month
	// 	  const isEndOfCurrentMonth =
	// 		selectedDate.toDateString() === endOfCurrentMonth.toDateString();
		
	// 	  // ✅ CASE 3: End of previous month(s)
	// 	  const isPastMonthEnd =
	// 		(selectedYear < currentYear ||
	// 		  (selectedYear === currentYear && selectedMonth < currentMonth)) &&
	// 		selectedDate.toDateString() === endOfSelectedMonth.toDateString();
		
	// 	  // ✅ SET STATE BASED ON VALID CASES
	// 	  if (isToday || isEndOfCurrentMonth) {
	// 		setConditionState("current");
	// 	  } else if (isPastMonthEnd) {
	// 		setConditionState("old");
	// 	  } else {
	// 		// alert(`Invalid date selection.\n\nAllowed dates:\n• Today (${format(today)})\n• End of this month (${format(endOfCurrentMonth)})\n• Or end date of any previous month (e.g., ${format(endOfSelectedMonth)}`)	
	// 		Message("warning", `Invalid date selection. Allowed dates: Today (${format(today)}) End of this Month (${format(endOfCurrentMonth)}) Or End date of any Previous Month`)
	// 		setConditionState(""); // optional: reset state on invalid selection
	// 	  }

		
	// }, [fromDate, selectedOptions]);


	useEffect(() => {

	setProcedureSuccessFlag('0')
	

    if (!fromDate) return; // 🛑 Skip if no date selected yet

    const selectedDate = new Date(fromDate);
    if (isNaN(selectedDate)) return; // 🛑 Skip if invalid date

    const today = new Date();

    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const selectedYear = selectedDate.getFullYear();
    const selectedMonth = selectedDate.getMonth();

    const endOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0);
    const endOfSelectedMonth = new Date(selectedYear, selectedMonth + 1, 0);

    const format = (d) => d.toISOString().slice(0, 10);

    // ✅ CASE 1: Today’s date
    const isToday = selectedDate.toDateString() === today.toDateString();

    // ✅ CASE 2: End of current month
    const isEndOfCurrentMonth =
        selectedDate.toDateString() === endOfCurrentMonth.toDateString();

    // ✅ CASE 3: End of previous month(s)
    const isPastMonthEnd =
        (selectedYear < currentYear ||
            (selectedYear === currentYear && selectedMonth < currentMonth)) &&
        selectedDate.toDateString() === endOfSelectedMonth.toDateString();

    // ✅ NEW CASE: Before 30th September 2025
    const oldDateThreshold = new Date(2025, 8, 30); // Months are 0-indexed, so 8 = September
    const isOldDate = selectedDate < oldDateThreshold;

    // ✅ SET STATE BASED ON VALID CASES
    if (isOldDate) {
        setConditionState("old");
		setSelectedOptions([])
    } else if (isToday || isEndOfCurrentMonth) {
        setConditionState("current");
    } else if (isPastMonthEnd) {
        setConditionState("current");
    } else {
        // Message(
        //     "warning",
        //     `Invalid date selection. Allowed dates: Today (${format(today)}), End of this Month (${format(
        //         endOfCurrentMonth
        //     )}), Or End date of any Previous Month`
        // );
		Message(
            "warning",
            `Date must be current date or last day of the month`
        );
		
        setConditionState(""); // optional: reset state on invalid selection
    }
// }, [fromDate, selectedOptions]);
}, [fromDate]);


	const runProcedureReport = async () => {
		setLoading(true)

		const branchCodes = selectedOptions?.map((item, i) => ({
			branch_code: item?.value,
		}))
		// const coCodes = selectedCOs?.map((item, i) => item?.value)

		// const creds = {
		// 	supply_date: formatDateToYYYYMMDD(fromDate),
		// 	branch_code:
		// 		branchCodes?.length === 0 ? [userDetails?.brn_code] : branchCodes,
		// 	co_id: coCodes?.length === 0 ? [selectedCO] : coCodes,
		// }

		const creds = {
			from_dt: formatDateToYYYYMMDD(fromDate),
			branches:
				branchCodes?.length === 0
					? [{ branch_code: userDetails?.brn_code }]
					: branchCodes,
		}

		if(conditionState === "old"){
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

	const handleSubmit = () => {
		if (searchType === "M" && fromDate) {
			handleFetchReportOutstandingMemberwise()
		} else if (searchType === "G" && fromDate) {
			handleFetchReportOutstandingGroupwise()
		} else if (searchType === "F" && fromDate) {
			handleFetchReportOutstandingFundwise()
		} else if (searchType === "C" && fromDate) {
			handleFetchReportOutstandingCOwise()
		} else if (searchType === "B" && fromDate) {
			handleFetchReportOutstandingBranchwise()
		}
	}

	// Reset states when searchType changes
	useEffect(() => {
		setReportData([])
		// setSelectedOptions([])
		// setSelectedCOs([])
		setMetadataDtls(null)
		// setProcedureSuccessFlag("0")
		if (searchType === "F") {
			getFunds()
		}
		if (searchType === "C") {
			getCOs()
		}
	}, [searchType])

	useEffect(() => {
		// setSelectedCOs([])
		// setProcedureSuccessFlag("0")
		if (searchType === "C") {
			getCOs()
		}
	}, [selectedOptions])

	const fetchSearchTypeName = (searchType) => {
		if (searchType === "M") {
			return "Memberwise"
		} else if (searchType === "G") {
			return "Groupwise"
		} else if (searchType === "F") {
			return "Fundwise"
		} else if (searchType === "C") {
			return "CO-wise"
		} else if (searchType === "B") {
			return "Branchwise"
		}
	}

	const dataToExport = reportData

	const headersToExport =
		searchType === "G"
			? groupwiseOutstandingHeader
			: searchType === "F"
			? fundwiseOutstandingHeader
			: searchType === "C"
			? cowiseOutstandingHeader
			: searchType === "M"
			? memberwiseOutstandingHeader
			: branchwiseOutstandingHeader

	const fileName = `Outstanding_Report_${fetchSearchTypeName(
		searchType
	)}_${new Date().toLocaleString("en-GB")}.xlsx`

	// const dropdownOptions = branches?.map((branch) => ({
	// 	value: branch.branch_assign_id,
	// 	label: `${branch.branch_name} - ${branch.branch_assign_id}`,
	// }))

	// Branchwise And Divisionwise options
	const dropdownOptions = branches?.map((item) => {
		// console.log(item, 'selectedselectedselected', 'item');
	if (searchBrnchDiv === "B") {
		// Branchwise
		return {
			value: item.branch_assign_id,
			label: `${item.branch_name} - ${item.branch_assign_id}`,
		}
	}

	if (searchBrnchDiv === "D") {
		// Divisionwise
		return {
			value: item.branch_code,
			label: `${item.division}`,
		}
	}

	return null
	}).filter(Boolean)

	// Branchwise And Divisionwise options
	useEffect(() => {
	setFromDate('')
	setToDate('')

	setReportData([])
	setSelectedOptions([])
	// setSelectedOptionsCondition("no-data")
	}, [searchBrnchDiv])

	// const displayedOptions = selectedOptions

	// const displayedOptions =
	// 	selectedOptions.length === dropdownOptions.length
	// 		? [{ value: "all", label: "All" }]
	// 		: selectedOptions

	const displayedOptions = selectedOptions.length === dropdownOptions.length ? selectedOptions : selectedOptions;

	// const handleMultiSelectChange = (selected) => {
	// 	// if (selected && selected.length > 4) {
	// 	// 	return
	// 	// }
	// 	// setSelectedOptions(selected)


	// 	if (selected.some((option) => option.value === "all")) {
	// 		setSelectedOptions(dropdownOptions)
	// 	} else {
	// 		// setSelectedOptions(selected)
	// 		// if (selected && selected.length > 4) {
	// 		// return
	// 		// }
	// 		setSelectedOptions(selected)
	// 	}
	// }

	const handleMultiSelectChange = (selected) => {
		
	// Normalize to array
	const selectedArray = Array.isArray(selected)
	? selected
	: selected
	? [selected]
	: []
	// console.log(selected, 'selectedselectedselected', selectedArray, 'outside');
	setSelectedOptions(selectedArray)

	if (selectedArray.length > 1) {
	// setSelectedOptionsCondition("all")
	} else if (selectedArray.length === 1) {
	// setSelectedOptionsCondition("single")
	} else {
	// setSelectedOptionsCondition("no-data")
	}
	}

	const dropdownCOs = cos?.map((branch) => ({
		value: branch.co_id,
		label: `${branch.emp_name} - ${branch.co_id}`,
	}))

	const displayedCOs =
		selectedCOs.length === dropdownCOs.length
			? [{ value: "all", label: "All" }]
			: selectedCOs

	const handleMultiSelectChangeCOs = (selected) => {
		if (selected.some((option) => option.value === "all")) {
			// If "All" is selected, select all options
			setSelectedCOs(dropdownCOs)
		} else {
			setSelectedCOs(selected)
		}
	}

	const handlePrint = useCallback(() => {
		printTableReport(
			dataToExport,
			headersToExport,
			fileName?.split(",")[0],
			[29, 31]
		)
	}, [dataToExport, headersToExport, fileName, printTableReport])

	useCtrlP(handlePrint)

	// console.log("selectedOptions", selectedOptions)
	// console.log("selectedCOs", selectedCOs)
	const populateColumns = (main_dt,headerExport) =>{
				const columnToBeShown = Object.keys(main_dt[0]).map((key, index) => ({ header:headerExport[key], index }));
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
				<main className="px-4 pb-5 bg-slate-50 rounded-lg shadow-lg h-auto my-10 mx-32">
					<div className="flex flex-row gap-3 mt-20 py-3 rounded-xl">
						<div className="text-3xl text-slate-700 font-bold">
							Outstanding Report  
							{/* {JSON.stringify(conditionState, null, 2)} || {JSON.stringify(conditionState.length > 0 ? true : false, null, 2)} */}
						</div>
					</div>

					<div className="text-slate-800 italic">
						Branch:{" "}
						{(userDetails?.id === 3 ||
							userDetails?.id === 4 ||
							userDetails?.id === 11) &&
						userDetails?.brn_code == 100
							? displayedOptions?.map((item, _) => `${item?.label}, `)
							: userDetails?.branch_name}{" "}
						as on {fetchedReportDate}
					</div>

					{/* <div className="flex justify-between gap-3 items-center align-middle">
						<div>
							<Radiobtn
								data={options}
								val={searchType}
								onChangeVal={(value) => onChange(value)}
							/>
						</div>
					</div> */}

					{userDetails?.brn_code == 100 && (
						<div className="mb-0 flex justify-start gap-5 items-center">

						<div>
							<Radiobtn
								data={brnchwis_divwise}
								val={searchBrnchDiv}
								onChangeVal={(value) => {
									onChange3BrnDiv(value)
								}}
							/>
						</div>
						{/* {JSON.stringify(searchBrnchDiv, 2)} */}
						
					</div>
					)}

					{(userDetails?.id === 3 ||
						userDetails?.id === 4 ||
						userDetails?.id === 11) &&
						userDetails?.brn_code == 100 && (
							<div className="w-full">
										<Select
										// options={conditionState === "current" ? [
										// { value: "all", label: "All" },
										// ...dropdownOptions,
										// ] : dropdownOptions}

										// options={[
										// { value: "all", label: "All" },
										// ...dropdownOptions,
										// ]}
										// isMulti
										// value={displayedOptions}
										options={[...dropdownOptions]}
										isMulti={searchBrnchDiv === "B"}
										value={
										searchBrnchDiv === "B"
											? displayedOptions
											: displayedOptions?.[0] || null
										}

										onChange={handleMultiSelectChange}
										// placeholder="Select branches..."
										placeholder={
										searchBrnchDiv === "B"
											? "Select branches..."
											: "Select division..."
										}
										className="basic-multi-select"
										classNamePrefix="select"
										styles={{
										control: (provided) => ({
										...provided,
										borderRadius: "8px",
										}),
										valueContainer: (provided) => ({
										...provided,
										borderRadius: "8px",
										}),
										singleValue: (provided) => ({
										...provided,
										color: "black",
										}),
										multiValue: (provided) => ({
										...provided,
										padding: "0.1rem",
										backgroundColor: "#da4167",
										color: "white",
										borderRadius: "8px",
										}),
										multiValueLabel: (provided) => ({
										...provided,
										color: "white",
										}),
										multiValueRemove: (provided) => ({
										...provided,
										color: "white",
										"&:hover": {
										backgroundColor: "red",
										color: "white",
										borderRadius: "8px",
										},
										}),
										placeholder: (provided) => ({
										...provided,
										fontSize: "0.9rem",
										}),
										}}
										/>

							</div>
						)}

					<div className="mt-4">
						<div>
							<TDInputTemplateBr
								placeholder="From Date"
								type="date"
								label="From Date"
								name="fromDate"
								formControlName={fromDate}
								handleChange={(e) => setFromDate(e.target.value)}
								min={"1900-12-31"}
								mode={1}
							/>
						</div>
						<div className="mt-4">
							<button
								className="inline-flex items-center px-4 py-2 text-sm font-small text-white border hover:border-green-600 border-teal-500 bg-teal-500 transition ease-in-out hover:bg-green-600 duration-300 rounded-full disabled:cursor-not-allowed"
								onClick={runProcedureReport}
								disabled={conditionState.length > 0 ? false : true}
							>
								<RefreshOutlined /> <span className="ml-2">Process Report</span>
							</button>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-5 mt-5 items-end">
						{searchType === "F" && +procedureSuccessFlag === 1 && (
							<div>
								<TDInputTemplateBr
									placeholder="Select Fund..."
									type="text"
									label="Fundwise"
									name="fund_id"
									handleChange={handleFundChange}
									data={[
										{ code: "F", name: "All funds" },
										...funds.map((dat) => ({
											code: dat.fund_id,
											name: `${dat.fund_name}`,
										})),
									]}
									mode={2}
									disabled={false}
								/>
							</div>
						)}

						{searchType === "C" &&
						+procedureSuccessFlag === 1 &&
						(userDetails?.id === 3 ||
							userDetails?.id === 4 ||
							userDetails?.id === 11) &&
						userDetails?.brn_code == 100 ? (
							// <div>
							// 	<TDInputTemplateBr
							// 		placeholder="Select CO..."
							// 		type="text"
							// 		label="CO-wise"
							// 		name="co_id"
							// 		handleChange={handleCOChange}
							// 		data={cos.map((dat) => ({
							// 			code: dat.co_id,
							// 			name: `${dat.emp_name}`,
							// 		}))}
							// 		mode={2}
							// 		disabled={false}
							// 	/>
							// </div>
							<div className="col-span-3 w-auto">
								<Select
									options={[{ value: "all", label: "All" }, ...dropdownCOs]}
									isMulti
									value={displayedCOs}
									onChange={handleMultiSelectChangeCOs}
									placeholder="Select COs'..."
									className="basic-multi-select"
									classNamePrefix="select"
									styles={{
										control: (provided) => ({
											...provided,
											borderRadius: "8px",
										}),
										valueContainer: (provided) => ({
											...provided,
											borderRadius: "8px",
										}),
										singleValue: (provided) => ({
											...provided,
											color: "black",
										}),
										multiValue: (provided) => ({
											...provided,
											padding: "0.1rem",
											backgroundColor: "#da4167",
											color: "white",
											borderRadius: "8px",
										}),
										multiValueLabel: (provided) => ({
											...provided,
											color: "white",
										}),
										multiValueRemove: (provided) => ({
											...provided,
											color: "white",
											"&:hover": {
												backgroundColor: "red",
												color: "white",
												borderRadius: "8px",
											},
										}),
										placeholder: (provided) => ({
											...provided,
											fontSize: "0.9rem",
										}),
									}}
								/>
							</div>
						) : (
							searchType === "C" &&
							+procedureSuccessFlag === 1 && (
								<div>
									<TDInputTemplateBr
										placeholder="Select CO..."
										type="text"
										label="CO-wise"
										name="co_id"
										handleChange={handleCOChange}
										data={[
											{ code: "AC", name: "All COs" },
											...cos.map((dat) => ({
												code: dat.co_id,
												name: `${dat.emp_name}`,
											})),
										]}
										mode={2}
										disabled={false}
									/>
								</div>
							)
						)}

						{/* <div>
							<TDInputTemplateBr
								placeholder="From Date"
								type="date"
								label="From Date"
								name="fromDate"
								formControlName={fromDate}
								handleChange={(e) => setFromDate(e.target.value)}
								min={"1900-12-31"}
								mode={1}
							/>
						</div>
						<div>
							<button
								className="inline-flex items-center px-4 py-2 text-sm font-small text-white border hover:border-green-600 border-teal-500 bg-teal-500 transition ease-in-out hover:bg-green-600 duration-300 rounded-full disabled:cursor-not-allowed"
								onClick={runProcedureReport}
								disabled={selectedOptions?.length == 0}
							>
								<RefreshOutlined /> <span className="ml-2">Process Report</span>
							</button>
						</div> */}
					</div>

					<div className="flex gap-6 items-center align-middle">
						{+procedureSuccessFlag === 1 && (
							<>
								<div>
									<Radiobtn
										data={options}
										val={searchType}
										onChangeVal={(value) => onChange(value)}
									/>
								</div>
								<div className="mt-3">
									<button
										className="inline-flex items-center px-4 py-2 text-sm font-small text-white border hover:border-pink-600 border-pink-500 bg-pink-500 transition ease-in-out hover:bg-pink-700 duration-300 rounded-full"
										onClick={handleSubmit}
									>
										<Search /> <span className="ml-2">Fetch</span>
									</button>
								</div>
							</>
						)}
					</div>


					{
						reportData.length > 0 && 	<MultiSelect value={selectedColumns} 
							onChange={(e) => {
								console.log(e.value)
								setSelectedColumns(e.value)
							}} options={md_columns} optionValue="index" optionLabel="header" 
							filter placeholder="Choose Columns" maxSelectedLabels={3} className="w-full md:w-20rem mt-5" />
					}

					{searchType === "M" && reportData.length > 0 && (
						<>
							<DynamicTailwindTable
								// data={reportData}
								data={reportData?.map((el) => {

									const recoveryWeekNoText = getWeekOfRecoveryName(el.week_no);

									 return {
										...el,
										week_no: recoveryWeekNoText,
									 };
								})}
								pageSize={50}
								columnTotal={[33, 38, 39, 40]}
								dateTimeExceptionCols={[8, 29, 31]}
								headersMap={memberwiseOutstandingHeader}
								colRemove={selectedColumns ? md_columns.map(el => {
									if(!selectedColumns.includes(el.index)){
									return el.index
									}
								return false
								}) : []}
							/>
						</>
					)}


					{searchType === "G" && reportData.length > 0 && (
						<>
							<DynamicTailwindTable
								// data={reportData}
								data={reportData?.map((el) => {

									const recoveryWeekNoText = getWeekOfRecoveryName(el.week_no);

									 return {
										...el,
										week_no: recoveryWeekNoText,
									 };
								})}
								pageSize={50}
								columnTotal={[12, 13, 14, 15]}
								headersMap={groupwiseOutstandingHeader}
								colRemove={selectedColumns ? md_columns.map(el => {
										if(!selectedColumns.includes(el.index)){
										return el.index
										}
										return false
								}) : []}
							/>
						</>
					)}

					{searchType === "F" && reportData.length > 0 && (
						<>
							<DynamicTailwindTable
								data={reportData}
								pageSize={50}
								columnTotal={[7, 8, 9, 10]}
								headersMap={fundwiseOutstandingHeader}
								colRemove={selectedColumns ? md_columns.map(el => {
									  if(!selectedColumns.includes(el.index)){
										return el.index
									  }
									  return false
								}) : []}
							/>
						</>
					)}

					{searchType === "C" && reportData.length > 0 && (
						<>
							<DynamicTailwindTable
								data={reportData}
								pageSize={50}
								columnTotal={[6, 7, 8, 9]}
								headersMap={cowiseOutstandingHeader}
								colRemove={selectedColumns ? md_columns.map(el => {
									  if(!selectedColumns.includes(el.index)){
										return el.index
									  }
									  return false
								}) : []}
							/>
						</>
					)}

					{/* Branchwise Results with Pagination */}
					{searchType === "B" && reportData.length > 0 && (
						<>
							<DynamicTailwindTable
								data={reportData}
								pageSize={50}
								columnTotal={[3, 4, 5, 6]}
								headersMap={branchwiseOutstandingHeader}
								colRemove={selectedColumns ? md_columns.map(el => {
									  if(!selectedColumns.includes(el.index)){
										return el.index
									  }
									  return false
								}) : []}
							/>
						</>
					)}

					{reportData.length !== 0 && (
						<div className="flex gap-4">
							<Tooltip title="Export to Excel">
								<button
									onClick={() =>{

										let exportedDT = [...dataToExport];
										const tot_intt_outstanding =  exportedDT.reduce( ( sum , cur ) => sum + Number(cur.intt_outstanding) , 0);
										const tot_prn_disb_amt =  exportedDT.reduce( ( sum , cur ) => sum + Number(cur.prn_disb_amt) , 0);
										const tot_outstanding =  exportedDT.reduce( ( sum , cur ) => sum + Number(cur.outstanding) , 0);
										const tot_prn_outstanding =  exportedDT.reduce( ( sum , cur ) => sum + Number(cur.prn_outstanding) , 0);
										exportedDT.push({
											intt_outstanding: tot_intt_outstanding,
											outstanding: tot_outstanding,
											prn_disb_amt: tot_prn_disb_amt,
											prn_outstanding: tot_prn_outstanding,
											branch_code:"TOTAL"
										})
										const dt = md_columns.filter(el => selectedColumns.includes(el.index));
										let header_export = {};
										Object.keys(headersToExport).forEach(key =>{
											if(dt.filter(ele => ele.header == headersToExport[key]).length > 0){
												header_export = {
													...header_export,
													[key]:headersToExport[key]
												}
											}
										});
										exportToExcel(
											exportedDT,
											header_export,
											fileName,
											[29, 31]
										)


									
									
									}}
									className="mt-5 justify-center items-center rounded-full text-green-900 disabled:text-green-300"
								>
									<FileExcelOutlined style={{ fontSize: 30 }} />
								</button>
							</Tooltip>
							<Tooltip title="Print">
								<button
									onClick={() =>{
	
										let exportedDT = [...dataToExport];
										const tot_intt_outstanding =  exportedDT.reduce( ( sum , cur ) => sum + Number(cur.intt_outstanding) , 0);
										const tot_prn_disb_amt =  exportedDT.reduce( ( sum , cur ) => sum + Number(cur.prn_disb_amt) , 0);
										const tot_outstanding =  exportedDT.reduce( ( sum , cur ) => sum + Number(cur.outstanding) , 0);
										const tot_prn_outstanding =  exportedDT.reduce( ( sum , cur ) => sum + Number(cur.prn_outstanding) , 0);
										exportedDT.push({
											intt_outstanding: tot_intt_outstanding,
											outstanding: tot_outstanding,
											prn_disb_amt: tot_prn_disb_amt,
											prn_outstanding: tot_prn_outstanding,
											branch_code:"TOTAL"
										})
										const dt = md_columns.filter(el => selectedColumns.includes(el.index));
										let header_export = {};
										Object.keys(headersToExport).forEach(key =>{
											if(dt.filter(ele => ele.header == headersToExport[key]).length > 0){
												header_export = {
													...header_export,
													[key]:headersToExport[key]
												}
											}
										});
										printTableReport(
											exportedDT,
											header_export,
											fileName?.split(",")[0],
											[29, 31]
										)

									}}
									className="mt-5 justify-center items-center rounded-full text-pink-600 disabled:text-pink-300"
								>
									<PrinterOutlined style={{ fontSize: 30 }} />
								</button>
							</Tooltip>
						</div>
					)}
				</main>
			</Spin>
		</div>
	)
}

export default OutstaningReportMain
