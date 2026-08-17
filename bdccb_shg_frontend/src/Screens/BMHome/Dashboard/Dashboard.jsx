import "./Dashboard.css"
import React, { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import axios from "axios"
import TDInputTemplateBr from "../../../Components/TDInputTemplateBr"
import DashboardCard from "../../../Components/Dashboard/DashboardCard"
import { Alert, Button, Empty, Input, Modal, Select, Spin, Table } from "antd"
import CurrencyRupeeOutlinedIcon from "@mui/icons-material/CurrencyRupeeOutlined"
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined"
import ListAltOutlinedIcon from "@mui/icons-material/ListAltOutlined"
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined"
import { Message } from "../../../Components/Message"
import { getOrdinalSuffix } from "../../../Utils/ordinalSuffix"
import moment from "moment"
import AlertComp from "../../../Components/AlertComp"
import { getLocalStoreTokenDts } from "../../../Components/getLocalforageTokenDts"
import { useNavigate } from "react-router"
import { routePaths } from "../../../Assets/Data/Routes"
import { BankOutlined, CheckCircleOutlined, EyeOutlined } from "@ant-design/icons"
import { Link } from "react-router-dom"
// import useCheckOpenCloseDate from "../../../Components/useCheckOpenCloseDate.js___"
import { url_bdccb } from "../../../Address/BaseUrl"

	const totalGroup = [
		{ label: "Direct", value: 45, color: "bg-orange-300" },
		{ label: "Indirect", value: 128, color: "bg-blue-300" },
		{ label: "With Loan", value: 342, color: "bg-green-300" },
		{ label: "Without Loan", value: 12, color: "bg-red-300" },
	]

  const activeUsersCount = 28;

	const activeUsersList = [
		{ emp_name: "Ramesh Kumar 55", emp_id: "EMP001", user_status: "A" },
		{ emp_name: "Suresh Patel", emp_id: "EMP002", user_status: "A" },
		{ emp_name: "Priya Sharma", emp_id: "EMP003", user_status: "A" },
		{ emp_name: "Amit Singh", emp_id: "EMP004", user_status: "A" },
		{ emp_name: "Neha Gupta", emp_id: "EMP005", user_status: "I" },
		{ emp_name: "Vikram Mehta", emp_id: "EMP006", user_status: "A" },
	]

//   const todayDisburse = [
//   { label: "Society", value: 45, color: "bg-orange-300" },
//   { label: "SHG", value: 128, color: "bg-blue-300" },
//   ]

//   const thisMonthDisburse = [
//   { label: "Society", value: 45, color: "bg-orange-300" },
//   { label: "SHG", value: 128, color: "bg-blue-300" },
//   ]


//   const todayLoanCollect = [
//   { label: "Deposited at CCB", value: 350, color: "bg-red-300" },
//   { label: "Deposited at Society", value: 450, color: "bg-orange-300" },
//   { label: "Deposited at SHG", value: 128, color: "bg-green-300" },
//   { label: "Collected But Not Deposited", value: 128, color: "bg-blue-300" },
//   ]

//   const thisMonthLoanCollect = [
//   { label: "Deposited at CCB", value: 350, color: "bg-red-300" },
//   { label: "Deposited at Society", value: 450, color: "bg-orange-300" },
//   { label: "Deposited at SHG", value: 358, color: "bg-green-300" },
//   { label: "Collected But Not Deposited", value: 208, color: "bg-blue-300" },
//   ]

  const PERIOD_OPTIONS = [
  { label: "Today", value: "Today" },
  { label: "This Month", value: "Month" },
  ]

   const PERIOD_OPTIONSCollect = [
  { label: "Today", value: "Today" },
  { label: "This Month", value: "Month" },
  ]


const formatINR = (num) =>
	new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		minimumFractionDigits: 2,
	}).format(num || 0)

const formatNumber = (num) => new Intl.NumberFormat("en-IN").format(num || 0)



export default function Dashboard() {
const userDetails = JSON.parse(localStorage.getItem("user_details")) || {}

const navigate = useNavigate()

// const [branches, setBranches] = useState(() => [
// 	{ code: "101", name: "Branch (101)" },
// 	{ code: "102", name: "Branch (102)" },
// 	{ code: "103", name: "Branch (103)" },
// ])

const [branches, setBranches] = useState([])

const [choosenBranch, setChoosenBranch] = useState({})
const [choosenBranch_ID, setChoosenBranch_ID] = useState({})

const [dateOfOperation, setDateOfOperation] = useState(moment().format("DD-MM-YYYY"))

// const [unapprovedTxnsDetailCountsTotal, setUnapprovedTxnsDetailCountsTotal] =	useState({data: 130000.00, noOfGroups: 25})

// const [grtPeriodDisbursed, setGrtPeriodDisbursed] = useState("Today")

// const activeGrtData = grtPeriodDisbursed === "Today" ? todayDisburse : thisMonthDisburse;


// const activeLoanColect = loanCollection === "Today" ? todayLoanCollect : thisMonthLoanCollect;

const [activeUsersCount, setActiveUsersCount] = useState('')
const [activeUsers, setActiveUsers] = useState([])
const [loading, setLoading] = useState(false)
const [loading_Outstan, setLoading_Outstan] = useState(false)
const [loading_Unapprov, setLoading_Unapprov] = useState(false)
const [groupList, setGroupList] = useState([]);
const [loanDisburse, setLoanDisburse] = useState([]);
const [loanCollect, setLoanCollect] = useState([]);
const [unapprovedCount, setUnapprovedCount] =	useState({})
const [grtPeriodDisbursed, setGrtPeriodDisbursed] = useState("Today")
const [loanCollection, setLoanCollection] = useState("Today")
const [branchType, setBranchType] = useState(userDetails[0]?.branch_type)


const getClientIP = async () => {
	const res = await fetch("https://api.ipify.org?format=json")
	const data = await res.json()
	return data.ip
	}


const transformGroupData = (data) => {
  const mapping = [
    { key: "direct_group", label: "Direct", color: "bg-orange-300" },
    { key: "indirect_group", label: "Indirect", color: "bg-blue-300" },
    { key: "with_loan", label: "With Loan", color: "bg-green-300" },
    { key: "without_loan", label: "Without Loan", color: "bg-red-300" },
  ];

  return mapping
    .filter(item => data?.[item.key] !== undefined) // handle missing keys
    .map(item => ({
      label: item.label,
      value: Number(data[item.key]) || 0,
      color: item.color,
    }));
};

const transformGroupDataDisburse = (data) => {
  const mapping = [
    { key: "society_disbursed", label: "Society", color: "bg-gray-300" },
    { key: "shg_disbursed", label: "SHG", color: "bg-gray-300" },
    // { key: "with_loan", label: "With Loan", color: "bg-green-300" },
    // { key: "without_loan", label: "Without Loan", color: "bg-red-300" },
  ];

  return mapping
    .filter(item => data?.[item.key] !== undefined) // handle missing keys
    .map(item => ({
      label: item.label,
      value: Number(data[item.key]) || 0,
      color: item.color,
    }));
};

const transformLoanCollect= (data) => {
  const mapping = [
    { key: "deposited_ccb", label: "Deposited at CCB", color: "bg-gray-300" },
    { key: "deposited_soc", label: "Deposited at Society", color: "bg-gray-300" },
    { key: "deposited_shg", label: "Deposited at SHG", color: "bg-gray-300" },
    { key: "collected_nt_deposit", label: "Collected But Not Deposited", color: "bg-gray-300" },
  ];

  return mapping
    .filter(item => data?.[item.key] !== undefined) // handle missing keys
    .map(item => ({
      label: item.label,
      value: Number(data[item.key]) || 0,
      color: item.color,
    }));
};

const getGroupList = async () => {
		setLoading(true)

    // setGroupList(totalGroup)

    // Here have function
		const ip = await getClientIP()

		const creds = {
		branch_code : userDetails[0]?.branch_type === 'H' ? choosenBranch_ID : userDetails[0]?.brn_code,
		user_type : userDetails[0]?.user_type,
		}

    // {
    //   "branch_code" : "41",
    //   "user_type" : "P/B"
    // }

		const tokenValue = await getLocalStoreTokenDts(navigate);

    await axios.post(`${url_bdccb}/dashboard/fetch_ccb_web_dashboardgroup_data`, creds, {
    headers: {
    Authorization: `${tokenValue?.token}`, // example header
    "Content-Type": "application/json", // optional
    },
    })
    .then((res) => {
        // console.log(res?.data?.data	, 'fffffffffffffffffffffff', creds, 'lll');
        if(res?.data?.success){

        const apiData = res?.data?.data || {};

      // 🔥 Transform here
        const formattedData = transformGroupData(apiData);
        setGroupList(formattedData);

        } else {
        navigate(routePaths.LANDING)
        localStorage.clear()
        }
    })
    .catch((err) => {
    Message("error", "Some error occurred while fetching group form")
    })
		
		setLoading(false)
	}


const getTotalOutstanding = async () => {
		setLoading_Outstan(true)

    // setGroupList(totalGroup)

    // Here have function
		const ip = await getClientIP()

		const creds = {
		branch_code : userDetails[0]?.branch_type === 'H' ? choosenBranch_ID : userDetails[0]?.brn_code,
		user_type : userDetails[0]?.user_type,
		}

		const tokenValue = await getLocalStoreTokenDts(navigate);

    await axios.post(`${url_bdccb}/dashboard/tot_loan_outstanding`, creds, {
    headers: {
    Authorization: `${tokenValue?.token}`, // example header
    "Content-Type": "application/json", // optional
    },
    })
    .then((res) => {
        // console.log(res?.data?.data	, 'fffffffffffffffffffffff', creds, 'lll');
        if(res?.data?.success){

        setActiveUsersCount(res?.data?.data?.total_outstanding)

        } else {
        navigate(routePaths.LANDING)
        localStorage.clear()
        }
    })
    .catch((err) => {
    Message("error", "Some error occurred while fetching group form")
    })
		
		setLoading_Outstan(false)
	}

const getLoanDisbursed = async () => {
		setLoading(true)

		const ip = await getClientIP()

		const creds = {
		branch_code : userDetails[0]?.branch_type === 'H' ? choosenBranch_ID : userDetails[0]?.brn_code,
		user_type : userDetails[0]?.user_type,
		flag : grtPeriodDisbursed,
		}

		const tokenValue = await getLocalStoreTokenDts(navigate);

    await axios.post(`${url_bdccb}/dashboard/tot_loan_disb`, creds, {
    headers: {
    Authorization: `${tokenValue?.token}`, // example header
    "Content-Type": "application/json", // optional
    },
    })
    .then((res) => {
        console.log(res?.data?.data	, 'fffffffffffffffffffffff', creds, 'lll');
        if(res?.data?.success){

        const apiData = res?.data?.data || {};

      // 🔥 Transform here
        const formattedData = transformGroupDataDisburse(apiData);
        setLoanDisburse(formattedData);

        } else {
        navigate(routePaths.LANDING)
        localStorage.clear()
        }
    })
    .catch((err) => {
    Message("error", "Some error occurred while fetching group form")
    })
		
		setLoading(false)
	}
  

const getLoanCollect = async () => {
		setLoading(true)

    // setGroupList(totalGroup)

    // Here have function
		const ip = await getClientIP()

		const creds = {
		branch_code : userDetails[0]?.branch_type === 'H' ? choosenBranch_ID : userDetails[0]?.brn_code,
		user_type : userDetails[0]?.user_type,
    	flag : loanCollection,
		}

    // {
    //   "branch_code" : "41",
    //   "user_type" : "P/B"
    // }

		const tokenValue = await getLocalStoreTokenDts(navigate);

    await axios.post(`${url_bdccb}/dashboard/tot_loan_collected`, creds, {
    headers: {
    Authorization: `${tokenValue?.token}`, // example header
    "Content-Type": "application/json", // optional
    },
    })
    .then((res) => {
        console.log(res?.data?.data	, 'fffffffffffffffffffffff', creds, 'colected');
        if(res?.data?.success){

        const apiData = res?.data?.data || {};

      // 🔥 Transform here
        const formattedData = transformLoanCollect(apiData);
        setLoanCollect(formattedData);

        } else {
        navigate(routePaths.LANDING)
        localStorage.clear()
        }
    })
    .catch((err) => {
    Message("error", "Some error occurred while fetching group form")
    })
		
		setLoading(false)
	}
    

const getActiveUser = async () => {
		setLoading(true)

    setActiveUsers(activeUsersList)

    // Here have function
		
		setLoading(false)
	}  

const getUnapprovedTrans = async () => {
setLoading_Unapprov(true)

// setGroupList(totalGroup)

// Here have function
const ip = await getClientIP()

const creds = {
branch_code : userDetails[0]?.branch_type === 'H' ? choosenBranch_ID : userDetails[0]?.brn_code,
user_type : userDetails[0]?.user_type,
}

const tokenValue = await getLocalStoreTokenDts(navigate);

await axios.post(`${url_bdccb}/dashboard/dashboard_tot_loan_unapprove_dtls`, creds, {
headers: {
Authorization: `${tokenValue?.token}`, // example header
"Content-Type": "application/json", // optional
},
})
.then((res) => {
console.log(res?.data?.data	, 'unapproveeeeeeeeeeeee', creds, 'lll');
if(res?.data?.success){

setUnapprovedCount(res?.data?.data)

} else {
navigate(routePaths.LANDING)
localStorage.clear()
}
})
.catch((err) => {
Message("error", "Some error occurred while fetching group form")
})

setLoading_Unapprov(false)

} 

///////////////////////// Head Office Function Start /////////////////////////

const getGroupList_HeadOffice = async () => {
		setLoading(true)

    // setGroupList(totalGroup)

    // Here have function
		const ip = await getClientIP()

		const creds = {
		branch_type : userDetails[0]?.branch_type,
		}

    // {
    //   "branch_code" : "41",
    //   "user_type" : "P/B"
    // }

		const tokenValue = await getLocalStoreTokenDts(navigate);

    await axios.post(`${url_bdccb}/dashboard/fetch_ho_dashboard_group_data`, creds, {
    headers: {
    Authorization: `${tokenValue?.token}`, // example header
    "Content-Type": "application/json", // optional
    },
    })
    .then((res) => {
        // console.log(res?.data?.data	, 'fffffffffffffffffffffff', creds, 'lll');
        if(res?.data?.success){

        const apiData = res?.data?.data || {};

      // 🔥 Transform here
        const formattedData = transformGroupData(apiData);
        setGroupList(formattedData);

        } else {
        navigate(routePaths.LANDING)
        localStorage.clear()
        }
    })
    .catch((err) => {
    Message("error", "Some error occurred while fetching group form")
    })
		
		setLoading(false)
	}

const getTotalOutstanding_HeadOffice = async () => {
		setLoading_Outstan(true)

    // setGroupList(totalGroup)

    // Here have function
		const ip = await getClientIP()

		const creds = {
		branch_type : userDetails[0]?.branch_type,
		}

    // {
    //   "branch_code" : "41",
    //   "user_type" : "P/B"
    // }

		const tokenValue = await getLocalStoreTokenDts(navigate);

    await axios.post(`${url_bdccb}/dashboard/fetch_ho_dashboard_tot_loan_outstanding`, creds, {
    headers: {
    Authorization: `${tokenValue?.token}`, // example header
    "Content-Type": "application/json", // optional
    },
    })
    .then((res) => {
        // console.log(res?.data?.data	, 'fffffffffffffffffffffff', creds, 'lll');
        if(res?.data?.success){

        setActiveUsersCount(res?.data?.data?.total_outstanding)

        } else {
        navigate(routePaths.LANDING)
        localStorage.clear()
        }
    })
    .catch((err) => {
    Message("error", "Some error occurred while fetching group form")
    })
		
		setLoading_Outstan(false)
	}

const getLoanDisbursed_HeadOffice = async () => {
		setLoading(true)

		const ip = await getClientIP()

		const creds = {
		branch_type : userDetails[0]?.branch_type,
		// user_type : userDetails[0]?.user_type,
		flag : grtPeriodDisbursed,
		}

		const tokenValue = await getLocalStoreTokenDts(navigate);

    await axios.post(`${url_bdccb}/dashboard/fetch_ho_dashboard_tot_loan_disb`, creds, {
    headers: {
    Authorization: `${tokenValue?.token}`, // example header
    "Content-Type": "application/json", // optional
    },
    })
    .then((res) => {
        console.log(res?.data?.data	, 'fffffffffffffffffffffff', creds, 'lll');
        if(res?.data?.success){

        const apiData = res?.data?.data || {};

      // 🔥 Transform here
        const formattedData = transformGroupDataDisburse(apiData);
        setLoanDisburse(formattedData);

        } else {
        navigate(routePaths.LANDING)
        localStorage.clear()
        }
    })
    .catch((err) => {
    Message("error", "Some error occurred while fetching group form")
    })
		
		setLoading(false)
	}

const getLoanCollect_HeadOffice = async () => {
		setLoading(true)

    // setGroupList(totalGroup)

    // Here have function
		const ip = await getClientIP()

		const creds = {
		branch_type : userDetails[0]?.branch_type,
		// user_type : userDetails[0]?.user_type,
    	flag : loanCollection,
		}

    // {
    //   "branch_code" : "41",
    //   "user_type" : "P/B"
    // }

		const tokenValue = await getLocalStoreTokenDts(navigate);

    await axios.post(`${url_bdccb}/dashboard/fetch_ho_dashboard_tot_loan_collected`, creds, {
    headers: {
    Authorization: `${tokenValue?.token}`, // example header
    "Content-Type": "application/json", // optional
    },
    })
    .then((res) => {
        console.log(res?.data?.data	, 'fffffffffffffffffffffff', creds, 'colected');
        if(res?.data?.success){

        const apiData = res?.data?.data || {};

      // 🔥 Transform here
        const formattedData = transformLoanCollect(apiData);
        setLoanCollect(formattedData);

        } else {
        navigate(routePaths.LANDING)
        localStorage.clear()
        }
    })
    .catch((err) => {
    Message("error", "Some error occurred while fetching group form")
    })
		
		setLoading(false)
	}

const getUnapprovedTrans_HeadOffice = async () => {
setLoading_Unapprov(true)

// setGroupList(totalGroup)

// Here have function
const ip = await getClientIP()

const creds = {
branch_type : userDetails[0]?.branch_type,
// user_type : userDetails[0]?.user_type,
}

const tokenValue = await getLocalStoreTokenDts(navigate);

await axios.post(`${url_bdccb}/dashboard/fetch_ho_dashboard_tot_loan_unapprove_dtls`, creds, {
headers: {
Authorization: `${tokenValue?.token}`, // example header
"Content-Type": "application/json", // optional
},
})
.then((res) => {
console.log(res?.data?.data	, 'unapproveeeeeeeeeeeee', creds, 'lll');
if(res?.data?.success){

setUnapprovedCount(res?.data?.data)

} else {
navigate(routePaths.LANDING)
localStorage.clear()
}
})
.catch((err) => {
Message("error", "Some error occurred while fetching group form")
})

setLoading_Unapprov(false)

} 

const getBranchList = async () => {
		setLoading(true)

		// const tokenValue = await getLocalStoreTokenDts(navigate);

		await axios.get(`${url_bdccb}/dashboard/fetch_brn_soc_name`)
		.then((res) => {

		if (res?.data?.success) {

		console.log(res?.data?.data, 'fffffffffffffffffffffff');
		setBranches(res.data.data.map((item) => ({
		code: item.branch_id +'@'+ item.branch_type,
		name: `${item.branch_name} (${item.branch_id})`,
		branch_type: item.branch_type,
		}))
		)
		

		} else {
		// console.log("QQQQQQQQQQQQQQQQ", res?.data)
		// Message('error', res?.data?.msg)
		navigate(routePaths.LANDING)
		localStorage.clear()
		}

		})
		.catch((err) => {
		console.log("?????????????????????", err)
		})

		setLoading(false)
		
	}

///////////////////////// Head Office Function End /////////////////////////


	useEffect(() => {
	if(branchType === 'B' || branchType === 'P'){
	getLoanDisbursed()
	}

	if(branchType === 'H'){
	getLoanDisbursed_HeadOffice()
	}

	}, [grtPeriodDisbursed, branchType])

	useEffect(() => {
	if(branchType === 'B' || branchType === 'P'){
	getLoanCollect()
	}

	if(branchType === 'H'){
	getLoanCollect_HeadOffice()
	}

	}, [loanCollection, branchType])


  useEffect(()=>{
	if(branchType === 'B' || branchType === 'P'){
    getGroupList()
    getTotalOutstanding()
	getUnapprovedTrans();
	}

	if(branchType === 'H'){
	getGroupList_HeadOffice()
	getTotalOutstanding_HeadOffice()
	getUnapprovedTrans_HeadOffice();
	}

  }, [branchType])


	useEffect(()=>{

	if(branchType === 'H'){
	getBranchList()
	setChoosenBranch(`${userDetails[0]?.brn_code}@${userDetails[0]?.branch_type}`)
	}
	
	}, [])

	

	const handleBranchChange = (e) => {

		// console.log(e.target.value, 'eeeeeeeeeee');
		
		const [code, branchType] = e.target.value.split("@");

		if(e.target.value.length > 0){
		setBranchType(branchType)
		} else {
		setBranchType(userDetails[0]?.branch_type)
		}

		setChoosenBranch(e.target.value)
		setChoosenBranch_ID(code)

	}
	
	return (
		<div className="p-8 space-y-6 bg-slate-50 min-h-screen rounded-3xl">
			
				{/* <AlertComp
					msg={<p className="text-3xl font-normal">
						<span className="text-lg ">Total OD as on 
						for group is </span>
					</p>}
				/> */}
		

			{/* {getOpenDt_CloseDt && getOpenDt_CloseDt === 'Y' && ( */}
				{/* <div className="bg-orange-100 border-t-4 border-orange-500 rounded-b text-orange-700 px-4 py-3 shadow-md" role="alert">
					<div className="flex">
						<div className="py-1">
							<svg className="fill-current h-6 w-6 text-orange-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
								<path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/>
							</svg>
						</div>
						<div>
							<p className="font-bold pb-3 pt-1">ALERT</p>
							<p className="pb-3 pt-1">Pending Approvals</p>
						</div>
					</div>
				</div> */}
			{/* )} */}

			<div className="flex flex-col md:flex-row justify-between items-center">
				<h1 className="text-lg font-bold text-slate-700 uppercase pl-6">
					Welcome,{" "}
					<span className="text-slate-600 text-lg font-thin">
						{userDetails[0]?.emp_name}
					</span>{" "}
					:{" "}
					<span className="text-slate-600 text-lg font-thin">
						{userDetails[0]?.branch_name}
					</span>
				</h1>
				<h1 className="text-lg font-bold text-slate-700 uppercase pr-6">
					<Spin spinning={loading}>
						Date of operation :{" "}
						<span className="text-slate-600 text-lg font-thin">
							{dateOfOperation}
						</span>
					</Spin>
				</h1>
			</div>
			
			{/* {JSON.stringify(userDetails[0], null, 2)} */}
			{/*  /////////////////////////////////
			{JSON.stringify(branchType, null, 2)}
			///////////////////////// */}
			{/* {JSON.stringify(choosenBranch, null, 2)} */}
			{/* //////////////////
			{JSON.stringify(choosenBranch_ID, null, 2)} */}

			{userDetails[0]?.branch_type == 'H' && (
				<div className="flex flex-col md:flex-row justify-between items-center">
					<div className="col-span-1 md:col-span-2 w-full p-6 pt-0 pb-0 space-y-4">
					{/* <TDInputTemplateBr
						placeholder="Select Branch..."
						type="text"
						formControlName={choosenBranch}
						handleChange={handleBranchChange}
						data={branches}
						mode={2}
					/> */}


					<Select
					showSearch
					placeholder="Select Branch..."
					style={{ width: "100%" }}
					value={choosenBranch || undefined}   // ✅ same as formControlName
					optionFilterProp="children"
					onChange={(value) => {
					handleBranchChange({target: { value }});
					}}
					filterOption={(input, option) =>
						option?.children?.toLowerCase().includes(input.toLowerCase())
					}
					>
					<Select.Option value="" disabled>
						Select Branches
					</Select.Option>

					{branches.map((opt) => (
					<Select.Option key={opt.code} value={opt.code}>
					{opt.name}
					</Select.Option>
					))}
					</Select>

					

					</div>
				</div>
			)}

			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
				<div className="col-span-1 md:col-span-2 rounded-3xl bg-white shadow-md p-6 space-y-4 overflow-hidden">
					<div className="flex justify-between items-center">
						<h2 className="text-base font-medium text-slate-700">Total Group</h2>
					</div>

					{groupList.map((item) => (
						<div key={item.label} className="flex items-center">
							<span className="w-40 text-sm text-slate-600">
								{item.label}
							</span>
							<div className="flex-1 bg-slate-100 h-2 rounded-full mx-4 overflow-hidden relative">
								<motion.div
									className={`${item.color} h-2`}
									style={{ clipPath: "inset(0 round 999px)" }}
									initial={{ width: 0 }}
									animate={{ width: `${Math.min(item.value, 100)}%` }}
									transition={{
										duration: 0.6,
										ease: [0.7, 0.0, 0.3, 1.0],
									}}
								/>
							</div>
							<span className="text-slate-800 font-semibold">
								{item.value?.toLocaleString()}
							</span>
						</div>
					))}
				</div>

				

				<div className="col-span-2 md:col-span-2">
					<div className="relative w-full h-full">
						<div
							className="inset-0 bg-white rounded-3xl shadow-md p-6 flex flex-col items-center justify-center"
							style={{ backfaceVisibility: "hidden" }}
						>
							<h3 className="text-base font-medium text-slate-700">
								Total Outstanding
							</h3>
							<div className="bg-purple-100 rounded-full p-4 my-4">
              <BankOutlined className="text-2xl text-purple-600" />
            </div>
							<Spin spinning={loading_Outstan}>
								<span className="text-3xl font-bold text-slate-800">
                  {formatINR(activeUsersCount)}
								</span>
							</Spin>
						</div>
					</div>
				</div>
			</div>



			<div className="grid grid-cols-1 md:grid-cols-6 gap-6">

        <div className="col-span-1 md:col-span-2 rounded-3xl bg-white shadow-md p-6 space-y-4 overflow-hidden">
					<div className="flex justify-between items-center">
						<h2 className="text-base font-medium text-slate-700">Total Loan Disbursed</h2>
						<div className="space-x-2">
							{PERIOD_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setGrtPeriodDisbursed(option.value)}
                  className={`px-3 py-1 rounded-full font-medium text-sm ${
                    grtPeriodDisbursed === option.value
                      ? "bg-teal-600 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {option.label}
                </button>
              ))}
						</div>
					</div>

					{loanDisburse.map((item) => (
						<div key={item.label} className="flex items-center">
							{/* <span className="w-40 text-sm text-slate-600">
                <p class="text-sm"></p>
								{item.label}
                
							</span> */}
              <span className="text-slate-800 font-semibold text-sm">
								{item.label}
							</span>
							<div className="flex-1 h-2 rounded-full mx-4 overflow-hidden relative">
								<motion.div
									className={`${item.color} h-2`}
									style={{ clipPath: "inset(0 round 999px)" }}
									initial={{ width: 0 }}
									// animate={{ width: `${Math.min((item.value / 1500) * 100, 100)}%` }}
									animate={{ width: `100%` }}
									transition={{
										duration: 0.6,
										ease: [0.7, 0.0, 0.3, 1.0],
									}}
								/>
							</div>
							<span className="text-slate-800 font-semibold text-right">
                {/* <p class="text-sm">No. of Groups</p> */}
								{formatINR(item.value)}
							</span>
						</div>
					))}
				</div>

          
        <div className="col-span-1 md:col-span-2 rounded-3xl bg-white shadow-md p-6 space-y-4 overflow-hidden">
					<div className="flex justify-between items-center">
						<h2 className="text-base font-medium text-slate-700">Loan Collected</h2>
						<div className="space-x-2">
							{PERIOD_OPTIONSCollect.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setLoanCollection(option.value)}
                  className={`px-3 py-1 rounded-full font-medium text-sm ${
                    loanCollection === option.value
                      ? "bg-teal-600 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {option.label}
                </button>
              ))}
						</div>
					</div>

					{loanCollect.map((item) => (
						<div key={item.label} className="flex items-center">
              <span className="text-slate-800 font-semibold text-sm">
								{item.label}
							</span>
							<div className="flex-1 h-2 rounded-full mx-4 overflow-hidden relative">
                <motion.div
									className={`${item.color} h-2`}
									style={{ clipPath: "inset(0 round 999px)" }}
									initial={{ width: 0 }}
									// animate={{ width: `${Math.min((item.value / 1500) * 100, 100)}%` }}
									animate={{ width: `100%` }}
									transition={{
										duration: 0.6,
										ease: [0.7, 0.0, 0.3, 1.0],
									}}
								/>
							</div>
							<span className="text-slate-800 font-semibold text-right">
                {/* <p class="text-sm">No. of Groups</p> */}
								{formatINR(item.value)}
							</span>
						</div>
					))}
				</div>


				{/* <DashboardCard
					titleLeft="Total Loan Disbursed"
					left1Data={{
						label: "This Month",
						value: formatINR(disbursedLoanDetailCountsMonth.data),
					}}
					left2Data={{
						label: "Today",
						value: formatINR(disbursedLoanDetailCountsToday.data),
					}}
					right1Data={{
						label: "No. of Groups",
						value: formatNumber(disbursedLoanDetailCountsMonth.noOfGroups),
					}}
					right2Data={{
						label: "No. of Groups",
						value: formatNumber(disbursedLoanDetailCountsToday.noOfGroups),
					}}
					leftColor="#DB2777"
					rightColor="#334155"
					loading={loading}
				/> */}

				{/* <DashboardCard
					titleLeft="Loan Collected"
					left1Data={{
						label: "This Month",
						value: formatINR(collectedLoanDetailCountsMonth.data),
					}}
					left2Data={{
						label: "Today",
						value: formatINR(collectedLoanDetailCountsToday.data),
					}}
					right1Data={{
						label: "No. of Groups",
						value: formatNumber(collectedLoanDetailCountsMonth.noOfGroups),
					}}
					right2Data={{
						label: "No. of Groups",
						value: formatNumber(collectedLoanDetailCountsToday.noOfGroups),
					}}
					leftColor="#2563EB"
					rightColor="#334155"
					loading={loading}
				/> */}

        <DashboardCard
        titleLeft="Unapproved Transaction"
		titleLeftClass="text-base"
        left1Data={{
        label: "Unapproved",
        value: formatINR(unapprovedCount?.total_unapproved_amount),
        }}
        // titleRight="Unapproved Transfers"
		titleRight=""
		titleRightClass="text-base"
        right1Data={{
        label: "No. of Groups",
        value: formatNumber(unapprovedCount?.total_unapproved_group),
        }}
        leftColor="#009966"
        rightColor="#334155"
        loading={loading_Unapprov}
        />

				{/* <DashboardCard
					titleLeft="Unapproved Txns"
					left1Data={{
						label: "Unapproved",
						value: formatINR(unapprovedTxnsDetailCountsTotal.data),
					}}
					left2Data={{
						label: "No. of Groups 33",
						value: formatNumber(unapprovedTxnsDetailCountsTotal.noOfGroups),
					}}
					titleRight="Unapproved Transfers"
					right1Data={{
						label: "No. of Groups",
						value: formatNumber(unapprovedTransfers.noOfGroups),
					}}
					right2Data={{
						label: "No. of Members 33",
						value: formatNumber(unapprovedTransfers.noOfMembers),
					}}
					leftColor="#009966"
					rightColor="#334155"
					loading={loading}
				/> */}

				{/* <div className="md:col-span-3 rounded-3xl bg-white shadow-md pt-3 overflow-hidden">
					<div className="flex justify-between flex-row pl-5">
						<h3 className="text-lg font-medium text-slate-900 rounded-full">
							Total Demand
						</h3>
					</div>
					<div className="grid grid-cols-2 align-middle p-0 bg-white mt-0 overflow-hidden">
						<DashboardCard
							left1Data={{
								label: "Month - Demand Amount",
								value: formatINR(dmdDetails_m?.data),
							}}
							left2Data={{
								label: `${getOrdinalSuffix(new Date().getDate())}\n(Monthly Mode) - Demand Amount`,
								value: formatINR(dmdDetails_d?.data),
							}}
							left3Data={{
								label: `${new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date())}\n(Weekly Mode) - Demand Amount`,
								value: formatINR(dmdDetails_w?.data),
							}}
							right1Data={{
								label: "Number Of Groups",
								value: formatNumber(dmdDetails_m.noOfGroups),
							}}
							right2Data={{
								label: `Number Of Groups`,
								value: formatNumber(dmdDetails_d.noOfGroups),
							}}
							right3Data={{
								label: `Number Of Groups`,
								value: formatNumber(dmdDetails_w.noOfGroups),
							}}
							leftColor="#2563EB"
							rightColor="#334155"
							loading={loadingDmd_m_d_w}
						/>
					</div>
				</div>
				
				<div className="md:col-span-3 rounded-3xl bg-white shadow-md p-6 overflow-hidden">
					<div className="flex justify-between pl-5 flex-row">
						<h3 className="text-lg font-medium text-slate-900 rounded-full">
							Overdue Demand
						</h3>
					</div>
					<div className="grid grid-cols-2 align-middle p-0 bg-white mt-0 overflow-hidden">
						<DashboardCard
							left1Data={{
								label: "Month - Overdue Amount",
								value: formatINR(odDetails_m?.data),
							}}
							left2Data={{
								label: `${getOrdinalSuffix(new Date().getDate())}\n(Monthly Mode) - Overdue Amount`,
								value: formatINR(odDetails_d?.data),
							}}
							left3Data={{
								label: `${new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date())}\n(Weekly Mode) - Overdue Amount`,
								value: formatINR(odDetails_w?.data),
							}}
							right1Data={{
								label: "Number Of Groups",
								value: formatNumber(odDetails_m.noOfGroups),
							}}
							right2Data={{
								label: `Number Of Groups`,
								value: formatNumber(odDetails_d.noOfGroups),
							}}
							right3Data={{
								label: `Number Of Groups`,
								value: formatNumber(odDetails_w.noOfGroups),
							}}
							leftColor="#2563EB"
							rightColor="#334155"
							loading={loadingOd}
						/>
					</div>
					<div className="flex justify-end items-center border-t pt-2">
						<Button 
							type="text" 
							size="large"
							style={{ fontWeight: 'bold' }}
							loading={isOverdueLoadingPending}
							onClick={showCoWiseBreakup}
						>
							View All
						</Button>
					</div>
				</div> */}

        
			</div>

			
		</div>
	)
}