import React, { useEffect, useState } from "react"
import Sidebar from "../../../Components/Sidebar"
import axios from "axios"
import { url } from "../../../Address/BaseUrl"
import { Message } from "../../../Components/Message"
import { Spin, Tooltip } from "antd"
import {
	LoadingOutlined,
	SearchOutlined,
	PrinterOutlined,
	FileExcelOutlined,
} from "@ant-design/icons"
import { RefreshOutlined, Search } from "@mui/icons-material"
import Radiobtn from "../../../Components/Radiobtn"
import TDInputTemplateBr from "../../../Components/TDInputTemplateBr"

import { saveAs } from "file-saver"
import * as XLSX from "xlsx"
import { printTableRegular } from "../../../Utils/printTableRegular"
import DynamicTailwindTable from "../../../Components/Reports/DynamicTailwindTable"
import Select from "react-select"
import {
	branchwiseDemandReportHeader,
	cowiseDemandReportHeader,
	fundwiseDemandReportHeader,
	groupwiseDemandReportHeader,
	memberwiseDemandReportHeader,
} from "../../../Utils/Reports/headerMap"
import { exportToExcel } from "../../../Utils/exportToExcel"
import { printTableReport } from "../../../Utils/printTableReport"
import { MultiSelect } from "primereact/multiselect"
import { getLocalStoreTokenDts } from "../../../Components/getLocalforageTokenDts"
import { routePaths } from "../../../Assets/Data/Routes"
import { useNavigate } from "react-router"

// const { RangePicker } = DatePicker
// const dateFormat = "YYYY/MM/DD"

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

const options2 = [
	{
		label: "Monthly",
		value: "Monthly",
	},
	{
		label: "Weekly",
		value: "Weekly",
	},
	{
		label: "Fortnight",
		value: "Fortnight",
	},
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

function DemandReportsMain() {
	const [selectedColumns, setSelectedColumns] = useState(null);
	const [md_columns, setColumns] = useState([]);
	const userDetails = JSON.parse(localStorage.getItem("user_details")) || ""
	const [loading, setLoading] = useState(false)

	const [fromDate, setFromDate] = useState()
	const [toDate, setToDate] = useState()
	const [reportData, setReportData] = useState(() => [])
	const [searchType, setSearchType] = useState(() => "G")
	const [searchType2, setSearchType2] = useState(() => "Monthly")
	const [choosenMonth, setChoosenMonth] = useState(() => "")
	const [choosenYear, setChoosenYear] = useState(() => "")
	// const [selectBranchCodes, setSelectBranchCodes] = useState(() => [])
	const [funds, setFunds] = useState([])
	const [selectedFund, setSelectedFund] = useState("")
	const [co, setCo] = useState(() => "")

	const [cos, setCos] = useState([])
	const [branches, setBranches] = useState([])
	const [selectedCO, setSelectedCO] = useState("")
	const [selectedOptions, setSelectedOptions] = useState([])
	const [selectedCOs, setSelectedCOs] = useState([])
	// const [reportTxnData, setReportTxnData] = useState(() => [])
	// const [tot_sum, setTotSum] = useState(0)
	// const [search, setSearch] = useState("")
	const [fetchedReportDate, setFetchedReportDate] = useState(() => "")
	const [weekOfRecovery, setWeekOfRecovery] = useState("")

	// Branchwise And Divisionwise options
	const [searchBrnchDiv, setSearchBrnchDiv] = useState(() => "B")

	const navigate = useNavigate()
	

	const [metadataDtls, setMetadataDtls] = useState(() =>
		(userDetails?.id === 3 ||
			userDetails?.id === 4 ||
			userDetails?.id === 11) &&
		userDetails?.brn_code == 100
			? selectedOptions?.map((item, _) => `${item?.label}, `)
			: userDetails?.branch_name
	)
	const [fromDay, setFromDay] = useState(() => "")
	const [toDay, setToDay] = useState(() => "")
	const [fromTouched, setFromTouched] = useState(false)
	const [toTouched, setToTouched] = useState(false)
	const [procedureSuccessFlag, setProcedureSuccessFlag] = useState("0")

	const maxDay = searchType2 === "Monthly" ? 31 : 7

	const isValidRange =
		fromDay !== "" &&
		toDay !== "" &&
		+fromDay >= 1 &&
		+toDay <= maxDay &&
		+fromDay <= +toDay &&
		(searchType2 !== "Fortnight" || weekOfRecovery !== "");

	const showError = (fromTouched || toTouched) && !isValidRange

	const onChange = (e) => {
		console.log("radio1 checked", e)
		setSearchType(e)
	}

	const onChange2 = (e) => {
		console.log("radio1 checked", e)
		setSearchType2(e)
		setFromDay("")
		setToDay("")
		setFromTouched(false)
		setToTouched(false)
	}

	// Branchwise And Divisionwise options
	const onChange3BrnDiv = (e) => {
	// RESET branch selection
	setSelectedOptions([])
	// setSelectedOptionsCondition('no-data')

	setSearchBrnchDiv(e)
	getBranches(e)
	}

	// const handleFetchCO = async () => {
	// 	setLoading(true)
	// 	const creds = {
	// 		branch_code: userDetails?.brn_code,
	// 	}

	// 	await axios
	// 		.post(`${url}/fetch_branch_co`, creds)
	// 		.then((res) => {
	// 			console.log("++++++++++++++", res?.data?.msg)
	// 			setCos(res?.data?.msg)
	// 		})
	// 		.catch((err) => {
	// 			console.log("Some err while fetching Cos...")
	// 		})
	// 	setLoading(false)
	// }

	// useEffect(() => {
	// 	setReportData([])
	// 	if (searchType === "C") {
	// 		handleFetchCO()
	// 	}
	// }, [searchType])

	// useEffect(() => {
	// 	console.log(isValidRange, 'isValidRangeisValidRangeisValidRange');
		
	// }, [])

	

	useEffect(() => {
	// setLoading(true)

	setProcedureSuccessFlag("0")
	
	if(userDetails?.brn_code != 100 && choosenMonth && choosenYear){
		// runProcedureReport()
		setProcedureSuccessFlag("1")
		// setLoading(false)
	}

	if(userDetails?.brn_code == 100 && selectedOptions.length > 0 && choosenMonth && choosenYear){
		// runProcedureReport()
		setProcedureSuccessFlag("1")
		// setLoading(false)
	}

	}, [selectedOptions, choosenMonth, choosenYear])

	const runProcedureReport = async () => {
		setLoading(true)

		const branchCodes = selectedOptions?.map((item, i) => ({
			branch_code: item?.value,
		}))

		const creds = {
			send_month: choosenMonth,
			send_year: choosenYear,
			branches:
				branchCodes?.length === 0
					? [{ branch_code: userDetails?.brn_code }]
					: branchCodes,
		}

		await axios
			.post(`${url}/call_demand_proc`, creds)
			.then((res) => {
				console.log("Procedure called", res?.data)
				setProcedureSuccessFlag(res?.data?.suc)
			})
			.catch((err) => {
				console.log("Some error while running procedure.", err)
			})

		setLoading(false)
	}

	// "Memberwise"
	const handleFetchMemberwiseReport = async () => {
		setLoading(true)

		const branchCodes = selectedOptions?.map((item, i) => item?.value)

		const creds = {
			send_month: choosenMonth,
			send_year: choosenYear,
			branch_code:
				branchCodes?.length === 0 ? [userDetails?.brn_code] : branchCodes,
		}

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios
			.post(`${url}/loan_demand_report_memberwise`, creds, {
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
				setReportData(res?.data?.memberwise_demand_data?.msg)
				setMetadataDtls(`${userDetails?.brn_code}, Memberwise`)
				setFetchedReportDate(res?.data?.create_date)
				populateColumns(res?.data?.memberwise_demand_data?.msg,memberwiseDemandReportHeader);
				}
				

			})
			.catch((err) => {
				console.log("ERRRR>>>", err)
			})

		setLoading(false)
	}

	const populateColumns = (main_dt,headerExport) =>{
				const columnToBeShown = Object.keys(main_dt[0]).map((key, index) => ({ header:headerExport[key], index }));
				setColumns(columnToBeShown);
				setSelectedColumns(columnToBeShown.map(el => el.index));
	}

	// "Groupwise"
	const handleFetchGroupwiseReport = async () => {
		setLoading(true)

		const branchCodes = selectedOptions?.map((item, i) => item?.value)

		const creds = {
			send_month: choosenMonth,
			send_year: choosenYear,
			branch_code:
				branchCodes?.length === 0 ? [userDetails?.brn_code] : branchCodes,
		}
		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios
			.post(`${url}/loan_demand_report_groupwise`, creds, {
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
				setReportData(res?.data?.groupwise_demand_data?.msg)
				// setTotSum(res?.data?.msg.reduce((n, { credit }) => n + credit, 0))
				setMetadataDtls(`${userDetails?.brn_code}, Groupwise`)
				setFetchedReportDate(res?.data?.create_date)
				// setFetchedReportDate(
				// 	new Date(res?.data?.demand_date).toLocaleDateString("en-GB")
				// )

				// for Column Chooser
				populateColumns(res?.data?.groupwise_demand_data?.msg,groupwiseDemandReportHeader)
}
			})
			.catch((err) => {
				console.log("ERRRR>>>", err)
			})

		setLoading(false)
	}

	// "Branchwise"
	const handleFetchBranchwiseReport = async () => {
		setLoading(true)

		const branchCodes = selectedOptions?.map((item, i) => item?.value)

		const creds = {
			send_month: choosenMonth,
			send_year: choosenYear,
			branch_code:
				branchCodes?.length === 0 ? [userDetails?.brn_code] : branchCodes,
		}

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios
			.post(`${url}/loan_demand_report_branchwise`, creds, {
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
				setReportData(res?.data?.branchwise_demand_data?.msg)
				setMetadataDtls(`${userDetails?.brn_code}, Groupwise`)
				setFetchedReportDate(res?.data?.create_date)
				populateColumns(res?.data?.branchwise_demand_data?.msg,branchwiseDemandReportHeader)

				}

			})
			.catch((err) => {
				console.log("ERRRR>>>", err)
			})

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

	// "Fundwise"
	const handleFetchFundwiseReport = async () => {
		setLoading(true)

		const branchCodes = selectedOptions?.map((item, i) => item?.value)
		const selectedFunds = funds?.map((item, i) => item?.fund_id)

		const creds = {
			send_month: choosenMonth,
			send_year: choosenYear,
			branch_code:
				branchCodes?.length === 0 ? [userDetails?.brn_code] : branchCodes,
			fund_id: selectedFund === "F" ? selectedFunds : [selectedFund],
		}

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios
			.post(`${url}/loan_demand_report_fundwise`, creds, {
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

			setReportData(res?.data?.fundwise_demand_data?.msg)
			setMetadataDtls(`${userDetails?.brn_code}, Groupwise`)
			setFetchedReportDate(res?.data?.create_date)

			populateColumns(res?.data?.fundwise_demand_data?.msg,fundwiseDemandReportHeader)

			}

			})
			.catch((err) => {
				console.log("ERRRR>>>", err)
			})

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

		axios.post(`${url}/fetch_brn_co_demand`, creds, {
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
				setCos(res?.data?.msg)
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

	// "COwise"
	const handleFetchCOwiseReport = async () => {
		setLoading(true)
		
		
		const branchCodes = selectedOptions?.map((item, i) => item?.value)
		const coCodes = selectedCOs?.map((item, i) => item?.value)
		const allCos = cos?.map((item, i) => item?.co_id)

		console.log(coCodes, '|||', allCos,  'CREDS==', coCodes?.length === 0 
  ? (co?.split(",")[0] === "AC" 
      ? allCos 
      : co?.split(",")[0] 
        ? [co?.split(",")[0]] 
        : ["0"]) 
  : coCodes, 'coCodes');

		const creds = {
			branch_code:
				branchCodes?.length === 0 ? [userDetails?.brn_code] : branchCodes,
			send_month: choosenMonth,
			send_year: choosenYear,
			// co_id: coCodes?.length === 0 ? co?.split(",")[0] === "AC" ? allCos : [co?.split(",")[0]] : coCodes,
			co_id: coCodes?.length === 0 ? (co?.split(",")[0] === "AC" ? allCos : co?.split(",")[0] ? [co?.split(",")[0]] : ["0"]) : coCodes,
			
		}

		// console.log("CREDS==", creds)

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.post(`${url}/loan_demand_report_cowise`, creds, {
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
				setReportData(res?.data?.cowise_demand_data?.msg)
				setMetadataDtls(`${userDetails?.brn_code}, COwise`)
				setFetchedReportDate(res?.data?.create_date);
				populateColumns(res?.data?.cowise_demand_data?.msg,cowiseDemandReportHeader);
				}
				
			})
			.catch((err) => {
				console.log("ERRRR>>>", err)
			})

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

	const handleFetchGroupwiseDayReport = async () => {
		setLoading(true)
		const branchCodes = selectedOptions?.map((item, i) => item?.value)
		
		const creds = {
			send_year: choosenYear,
			send_month: choosenMonth,
			branch_code: branchCodes?.length === 0 ? [userDetails?.brn_code] : branchCodes,

			demand_date: fetchedReportDate,
			period_mode: searchType2,
			from_day: fromDay,
			to_day: toDay,
			week_no : weekOfRecovery
		}

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios
			.post(`${url}/filter_dayawise_dmd_report_groupwise`, creds, {
			headers: {
			Authorization: `${tokenValue?.token}`, // example header
			"Content-Type": "application/json", // optional
			},
			})
			.then((res) => {
				// console.log(res?.data, 'resresresres');
				
				if(res?.data?.suc === 0){
				// Message('error', res?.data?.msg)
				navigate(routePaths.LANDING)
				localStorage.clear()
				} else {

				setReportData(res?.data?.groupwise_demand_data_day?.msg)

				}
			})
			.catch((err) => {
				console.log("ERRRR>>>", err)
				// setReportData([])
			})
		setLoading(false)
	}

	const handleFetchFundwiseDayReport = async () => {
		setLoading(true)
		
		const branchCodes = selectedOptions?.map((item, i) => item?.value)

		const creds = {
			send_year: choosenYear,
			send_month: choosenMonth,
			branch_code: branchCodes?.length === 0 ? [userDetails?.brn_code] : branchCodes,
			
			demand_date: fetchedReportDate,
			period_mode: searchType2,
			from_day: fromDay,
			to_day: toDay,
			week_no : weekOfRecovery
		}

		const tokenValue = await getLocalStoreTokenDts(navigate);


		await axios
			.post(`${url}/filter_dayawise_dmd_report_fundwise`, creds, {
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

				setReportData(res?.data?.fundwise_demand_data_day?.msg)

				}
			})
			.catch((err) => {
				console.log("ERRRR>>>", err)
			})
		setLoading(false)
	}

	const handleFetchCOwiseDayReport = async () => {
		setLoading(true)

		const branchCodes = selectedOptions?.map((item, i) => item?.value)

		const creds = {
			send_year: choosenYear,
			send_month: choosenMonth,
			branch_code: branchCodes?.length === 0 ? [userDetails?.brn_code] : branchCodes,

			demand_date: fetchedReportDate,
			period_mode: searchType2,
			from_day: fromDay,
			to_day: toDay,
			week_no : weekOfRecovery
		}

		const tokenValue = await getLocalStoreTokenDts(navigate);
		
		await axios
			.post(`${url}/filter_dayawise_dmd_report_cowise`, creds, {
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
				setReportData(res?.data?.cowise_demand_data_day?.msg)

				}

			})
			.catch((err) => {
				console.log("ERRRR>>>", err)
			})
		setLoading(false)
	}

	const handleFetchMemberwiseDayReport = async () => {
		setLoading(true)

		const branchCodes = selectedOptions?.map((item, i) => item?.value)
		
		const creds = {
			send_year: choosenYear,
			send_month: choosenMonth,
			branch_code: branchCodes?.length === 0 ? [userDetails?.brn_code] : branchCodes,

			demand_date: fetchedReportDate,
			period_mode: searchType2,
			from_day: fromDay,
			to_day: toDay,
			week_no : weekOfRecovery
		}

		const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios
			.post(`${url}/filter_dayawise_dmd_report_membwise`, creds, {
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
				setReportData(res?.data?.memberwise_demand_data_day?.msg)
}

			})
			.catch((err) => {
				console.log("ERRRR>>>", err)
			})
		setLoading(false)
	}

	const handleSubmitDaywise = () => {
		if (searchType === "G") {
			handleFetchGroupwiseDayReport()
		} else if (searchType === "F") {
			handleFetchFundwiseDayReport()
		} else if (searchType === "C") {
			handleFetchCOwiseDayReport()
		} else if (searchType === "M") {
			handleFetchMemberwiseDayReport()
		}
	}

	// Branchwise And Divisionwise options
	useEffect(() => {
		getBranches(searchBrnchDiv) 
	}, [])

	useEffect(() => {
		setFetchedReportDate("")
		setReportData([])
		// setSelectedOptions([])
		setSelectedCOs([])
		setFromDay("")
		setToDay("")
		// setProcedureSuccessFlag("0")
		if (searchType === "F") {
			getFunds()
		}
		if (searchType === "C") {
			getCOs()
		}
	}, [searchType])

	useEffect(() => {
		setFetchedReportDate("")
		setReportData([])
		setSelectedCOs([])
		setFromDay("")
		setToDay("")
		if (searchType === "C") {
			getCOs()
		}
	}, [selectedOptions])

	const handleSubmit = () => {
		setColumns([]);
		setSelectedColumns(null);
		if (!searchType || !choosenMonth || !choosenYear) {
			Message("warning", "Please fill all details")
			return
		}

		if (searchType === "M" && choosenMonth && choosenYear) {
			handleFetchMemberwiseReport()
		}

		if (searchType === "B" && choosenMonth && choosenYear) {
			handleFetchBranchwiseReport()
		}

		if (searchType === "G" && choosenMonth && choosenYear) {
			handleFetchGroupwiseReport()
		}

		if (searchType === "F" && choosenMonth && choosenYear && selectedFund) {
			handleFetchFundwiseReport()
		}

		if (searchType === "C" && choosenMonth && choosenYear) {
			handleFetchCOwiseReport()
		}
	}

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
			? groupwiseDemandReportHeader
			: searchType === "F"
			? fundwiseDemandReportHeader
			: searchType === "C"
			? cowiseDemandReportHeader
			: searchType === "M"
			? memberwiseDemandReportHeader
			: branchwiseDemandReportHeader

	const fileName = `Demand_Report_${fetchSearchTypeName(
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

	// const displayedOptions =
	// 	selectedOptions.length === dropdownOptions.length
	// 		? [{ value: "all", label: "All" }]
	// 		: selectedOptions

	const displayedOptions = selectedOptions.length === dropdownOptions.length ? selectedOptions : selectedOptions;

	// const handleMultiSelectChange = (selected) => {
	// 	if (selected.some((option) => option.value === "all")) {
	// 		setSelectedOptions(dropdownOptions)
	// 	} else {
	// 		setSelectedOptions(selected)
	// 	}
	// }

	// Branchwise And Divisionwise options
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
		selectedCOs.length === dropdownCOs.length && selectedCOs.length !== 0
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

	const months = Array.from({ length: 12 }, (_, i) => ({
		code: i + 1,
		name: new Date(0, i).toLocaleString("en", { month: "long" }),
	}))

	const years = Array.from({ length: 61 }, (_, i) => ({
		code: 2025 + i,
		name: (2025 + i).toString(),
	}))

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
					<div className="flex flex-row gap-3 mt-20  py-3 rounded-xl">
						<div className="text-3xl text-slate-700 font-bold">
							DEMAND REPORT 
						</div>
					</div>

					{/* <div className="text-slate-800 italic">
						Branch:{" "}
						{(userDetails?.id === 3 ||
							userDetails?.id === 4 ||
							userDetails?.id === 11) &&
						userDetails?.brn_code == 100
							? selectedOptions?.map((item, _) => `${item?.label}, `)
							: userDetails?.branch_name}{" "}
						as on {fetchedReportDate}
					</div> */}

					{/* <div className="mb-2">
						<Radiobtn
							data={options}
							val={searchType}
							onChangeVal={(value) => {
								onChange(value)
							}}
						/>
					</div> */}

					{/* <div className="mb-4">
						<TDInputTemplateBr
							placeholder="Demand Date..."
							type="date"
							label="Demand Date"
							name="demand_date"
							formControlName={fetchedReportDate}
							handleChange={(e) => setFetchedReportDate(e.target.value)}
							min={"2000-12-31"}
							mode={1}
							disabled={true}
						/>
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
									// options={[{ value: "all", label: "All" }, ...dropdownOptions]}
									options={[...dropdownOptions]}
									// isMulti
									isMulti={searchBrnchDiv === "B"}
									// value={displayedOptions}
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

					<div className="grid grid-cols-2 gap-5 mt-5 items-end">
						<div>
							<TDInputTemplateBr
								placeholder="Month"
								type="text"
								label="Month"
								name="month"
								formControlName={choosenMonth}
								handleChange={(e) => setChoosenMonth(e.target.value)}
								mode={2}
								data={months}
							/>
						</div>
						<div>
							<TDInputTemplateBr
								placeholder="Year"
								type="text"
								label="Year"
								name="year"
								formControlName={choosenYear}
								handleChange={(e) => setChoosenYear(e.target.value)}
								mode={2}
								data={years}
							/>
						</div>
					</div>
					{/* <div className="flex justify-center my-3">
						<button
							className={`inline-flex items-center px-4 py-2 mt-0 ml-0 sm:mt-0 text-sm font-small text-center text-white border hover:border-green-600 border-teal-500 bg-teal-500 transition ease-in-out hover:bg-green-600 duration-300 rounded-full  dark:focus:ring-primary-900`}
							onClick={runProcedureReport}
						>
							<RefreshOutlined /> <span className={`ml-2`}>Process Report</span>
						</button>
					</div> */}

					<div>
						{/* {(userDetails?.id === 3 ||
							userDetails?.id === 4 ||
							userDetails?.id === 11) &&
							userDetails?.brn_code == 100 && (
								<div className="w-full">
									<Select
										options={[
											{ value: "all", label: "All" },
											...dropdownOptions,
										]}
										isMulti
										value={displayedOptions}
										onChange={handleMultiSelectChange}
										placeholder="Select branches..."
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
							)} */}
						{searchType === "F" && (
							<div className="pt-4">
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
					</div>

					{searchType === "C" && (
						<div className="mb-2 w-full flex justify-center gap-5">
							{/* <div className="w-full">
								<TDInputTemplateBr
									placeholder="Choose CO..."
									type="text"
									label="Credit Officers"
									name="co"
									formControlName={co.split(",")[0]}
									handleChange={(e) => {
										console.log("***********========", e)
										setCo(
											e.target.value +
												"," +
												cos.filter((i) => i.emp_id == e.target.value)[0]
													?.emp_name
										)
									}}
									mode={2}
									data={cos?.map((item, i) => ({
										code: item?.emp_id,
										name: `${item?.emp_name} - (${item?.emp_id})`,
									}))}
								/>
							</div> */}
							{searchType === "C" &&
							(userDetails?.id === 3 ||
								userDetails?.id === 4 ||
								userDetails?.id === 11) &&
							userDetails?.brn_code == 100 ? (
								<div className="w-full pt-4">
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
								searchType === "C" && (
									<div className="w-full pt-4">
										<TDInputTemplateBr
											placeholder="Choose CO..."
											type="text"
											label="Credit Officers"
											name="co"
											formControlName={co.split(",")[0]}
											handleChange={(e) => {
												console.log("***********========", e)
												setCo(
													e.target.value +
														"," +
														cos.filter((i) => i.co_id == e.target.value)[0]
															?.emp_name
												)
											}}
											mode={2}
											data={[
												{ code: "AC", name: "All COs" },
												...cos?.map((item, i) => ({
													code: item?.co_id,
													name: `${item?.emp_name} - (${item?.co_id})`,
												})),
											]}
										/>
									</div>
								)
							)}
						</div>
					)}

					<div className="mb-2 flex justify-start gap-5 items-center">
						{/* R.I.P Sweet bro */}

						{/* <div>
							<div className="text-slate-800">Choose Date:</div>
							<RangePicker
								className="p-2 shadow-md"
								format={dateFormat}
								onChange={(dates, dateStrings) => {
									console.log("-------dates", dates)
									console.log("-------dateStrings", dateStrings)
									setFromDate(dateStrings[0])
									setToDate(dateStrings[1])
								}}
							/>
						</div> */}
					</div>

					{/* <div className="grid grid-cols-2 gap-5 mt-5 items-end">
						<div>
							<TDInputTemplateBr
								placeholder="Month"
								type="text"
								label="Month"
								name="month"
								formControlName={choosenMonth}
								handleChange={(e) => setChoosenMonth(e.target.value)}
								mode={2}
								data={months}
							/>
						</div>
						<div>
							<TDInputTemplateBr
								placeholder="Year"
								type="text"
								label="Year"
								name="year"
								formControlName={choosenYear}
								handleChange={(e) => setChoosenYear(e.target.value)}
								mode={2}
								data={years}
							/>
						</div>
					</div> */}
					{/* <div className="flex justify-center my-3">
						<button
							className={`inline-flex items-center px-4 py-2 mt-0 ml-0 sm:mt-0 text-sm font-small text-center text-white border hover:border-green-600 border-teal-500 bg-teal-500 transition ease-in-out hover:bg-green-600 duration-300 rounded-full  dark:focus:ring-primary-900`}
							onClick={runProcedureReport}
						>
							<RefreshOutlined /> <span className={`ml-2`}>Process Report</span>
						</button>
					</div> */}

					{+procedureSuccessFlag === 1 && (
						<>
							<div className="flex gap-6 items-center align-middle">
								<Radiobtn
									data={options}
									val={searchType}
									onChangeVal={(value) => {
										onChange(value)
									}}
								/>
								<div className="mt-3">
									<button
										className="inline-flex items-center px-4 py-2 text-sm font-small text-white border hover:border-pink-600 border-pink-500 bg-pink-500 transition ease-in-out hover:bg-pink-700 duration-300 rounded-full"
										onClick={handleSubmit}
									>
										<Search /> <span className="ml-2">Fetch</span>
									</button>
								</div>
							</div>
						</>
					)}

					{reportData?.length > 0 && searchType !== "B" && (
						<div>
							<div className="text-xl -mb-4 text-slate-700 font-bold">
								Daywise
							</div>
							<div className="mb-2">
								<Radiobtn
									data={options2}
									val={searchType2}
									onChangeVal={(e) => {
										onChange2(e)
										setWeekOfRecovery("")
									}}
								/>
							</div>

							<div className="grid grid-cols-3 gap-5 mt-5 items-end" style={{alignItems:'start'}}>


								{searchType2 === "Fortnight" && (
								<div>
								<TDInputTemplateBr
								placeholder="Select Weekday"
								type="text"
								label="Week of Recovery"
								name="b_dayOfRecovery_Fortnight"
								formControlName={weekOfRecovery}
								handleChange={(e) => setWeekOfRecovery(e.target.value)}
								data={Fortnight}
								mode={2}
								// disabled={
								// 	!disbursementDetailsData.b_scheme || disburseOrNot
								// }
								/>
								</div>
								)}
								
							
								<div>
									<TDInputTemplateBr
										placeholder="From Day"
										type="number"
										label="From Day"
										name="from_day"
										formControlName={fromDay}
										handleChange={(e) => setFromDay(e.target.value)}
										handleBlur={() => setFromTouched(true)}
										mode={1}
										min={1}
										max={maxDay}
									/>
									{showError && (
										<p className="text-red-500 text-xs mt-1">
											From day must be lower than To day and within 1 to{" "}
											{maxDay}.
										</p>
									)}
								</div>

								<div>
									<TDInputTemplateBr
										placeholder="To Day"
										type="number"
										label="To Day"
										name="to_day"
										formControlName={toDay}
										handleChange={(e) => setToDay(e.target.value)}
										handleBlur={() => setToTouched(true)}
										mode={1}
										min={1}
										max={maxDay}
									/>
									{showError && (
										<p className="text-red-500 text-xs mt-1">
											From day must be lower than To day and within 1 to{" "}
											{maxDay}.
										</p>
									)}
								</div>

								</div>

<div className="grid grid-cols-3 gap-5 mt-5 items-end">
	
								<div>
									<button
										className={`inline-flex items-center px-4 py-2 mt-0 ml-0 sm:mt-0 text-sm font-small text-center text-white border hover:border-green-600 border-teal-500 bg-teal-500 transition ease-in-out hover:bg-green-600 duration-300 rounded-full  dark:focus:ring-primary-900`}
										onClick={() => {
											handleSubmitDaywise()
										}}
										disabled={!isValidRange}
									>
										<SearchOutlined /> <span className="ml-2">Find</span>
									</button>
								</div>
							</div>
						</div>
					)}

					{/* "Groupwise" */}
					{
						reportData.length > 0 && 	<MultiSelect value={selectedColumns} 
							onChange={(e) => {
								console.log(e.value)
								setSelectedColumns(e.value)
							}} options={md_columns} optionValue="index" optionLabel="header" 
    						filter placeholder="Choose Columns" maxSelectedLabels={3} className="w-full md:w-20rem mt-5" />
					}
					{reportData.length > 0 && searchType === "G" && (
						<>
						{/* {JSON.stringify(reportData, 2)} */}
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
								columnTotal={[14]}
								dateTimeExceptionCols={[0, 11, 12, 7, 12, 13]}
								headersMap={groupwiseDemandReportHeader}
								colRemove={selectedColumns ? md_columns.map(el => {
									  if(!selectedColumns.includes(el.index)){
										return el.index
									  }
									  return false
								}) : []}
							/>
						</>
					)}

					{/* "Fundwise" */}

					{reportData.length > 0 && searchType === "F" && (
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
								columnTotal={[13]}
								dateTimeExceptionCols={[0]}
								headersMap={fundwiseDemandReportHeader}
								colRemove={selectedColumns ? md_columns.map(el => {
									  if(!selectedColumns.includes(el.index)){
										return el.index
									  }
									  return false
								}) : []}
							/>
						</>
					)}

					{/* "COwise" */}

					{reportData.length > 0 && searchType === "C" && (
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
								columnTotal={[11]}
								dateTimeExceptionCols={[0]}
								headersMap={cowiseDemandReportHeader}
								colRemove={selectedColumns ? md_columns.map(el => {
									  if(!selectedColumns.includes(el.index)){
										return el.index
									  }
									  return false
								}) : []}
							/>
						</>
					)}

					{/* "Memberwise" */}

					{reportData.length > 0 && searchType === "M" && (
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
								columnTotal={[20]}
								dateTimeExceptionCols={[0, 10, 16, 17]}
								headersMap={memberwiseDemandReportHeader}
								colRemove={selectedColumns ? md_columns.map(el => {
									  if(!selectedColumns.includes(el.index)){
										return el.index
									  }
									  return false
								}) : []}
							/>
						</>
					)}

					{/* "Branchwise" */}

					{reportData.length > 0 && searchType === "B" && (
						<>
							<DynamicTailwindTable
								data={reportData}
								pageSize={50}
								columnTotal={[4]}
								dateTimeExceptionCols={[0]}
								headersMap={branchwiseDemandReportHeader}
								colRemove={selectedColumns ? md_columns.map(el => {
									  if(!selectedColumns.includes(el.index)){
										return el.index
									  }
									  return false
								}) : []}
							/>
						</>
					)}

					{/* ///////////////////////////////////////////////////////////////// */}

					{reportData.length !== 0 && (
						<div className="flex gap-4">
							<Tooltip title="Export to Excel">
								<button
									onClick={() =>{
										
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
										let data = [...dataToExport];
										// console.log(header_export);
										// console.log(data, 'dtdtdtdtdt');

										const Fortnight = [
											{ code: "1", name: "Week (1-3)" },
											{ code: "2", name: "Week (2-4)" }
										];

										const fortnightMap = Fortnight.reduce((acc, item) => {
											acc[item.code] = item.name;
											return acc;
										}, {});

										data = data.map(row => ({
											...row,
											week_no: fortnightMap[row.week_no] || row.week_no
										}));

										if('dmd_amt' in header_export){
											const total_demand_amt = data.reduce((accumulator, currentValue) => {
																		return Number(currentValue?.dmd_amt) + accumulator;
																	}, 0);
											data.push({
												dmd_amt:total_demand_amt?.toFixed(2)
											})
										}
										exportToExcel(
											data,
											header_export,
											fileName,
											[0, 10, 11, 16]
										)

									}}
									className="mt-5 justify-center items-center rounded-full text-green-900"
								>
									<FileExcelOutlined
										style={{
											fontSize: 30,
										}}
									/>
								</button>
							</Tooltip>
							<Tooltip title="Print">
								<button
									onClick={() =>{
										// printTableRegular(
										// 	reportData,
										// 	"Demand Report",
										// 	metadataDtls,
										// 	fromDate,
										// 	toDate
										// )
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
										let data = [...dataToExport];
										console.log(header_export);
										if('dmd_amt' in header_export){
											const total_demand_amt = data.reduce((accumulator, currentValue) => {
																		return Number(currentValue?.dmd_amt) + accumulator;
																	}, 0);
											data.push({
												dmd_amt:total_demand_amt?.toFixed(2)
											})
										}
										printTableReport(
											data,
											header_export,
											fileName?.split(",")[0],
											[0, 10, 11, 16]
										)
									}}
									className="mt-5 justify-center items-center rounded-full text-pink-600"
								>
									<PrinterOutlined
										style={{
											fontSize: 30,
										}}
									/>
								</button>
							</Tooltip>
						</div>
					)}
				</main>
			</Spin>
		</div>
	)
}

export default DemandReportsMain
