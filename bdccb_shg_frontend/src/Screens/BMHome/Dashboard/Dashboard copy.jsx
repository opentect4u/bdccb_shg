import "./Dashboard.css"
import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import axios from "axios"
import TDInputTemplateBr from "../../../Components/TDInputTemplateBr"
import DashboardCard from "../../../Components/Dashboard/DashboardCard"
import { Alert, Button, Empty, Input, Modal, Spin, Table } from "antd"
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
import { CheckCircleOutlined, EyeOutlined } from "@ant-design/icons"
import { Link } from "react-router-dom"
import useCheckOpenCloseDate from "../../../Components/useCheckOpenCloseDate"

const formatINR = (num) =>
	new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		minimumFractionDigits: 2,
	}).format(num || 0)

const formatNumber = (num) => new Intl.NumberFormat("en-IN").format(num || 0)

// DEMO DATA
const DEMO_DATA = {
	// GRT Data
	grtToday: [
		{ label: "Pending", value: 45, color: "bg-orange-300" },
		{ label: "Sent to MIS", value: 128, color: "bg-blue-300" },
		{ label: "Approved", value: 342, color: "bg-green-300" },
		{ label: "Rejected", value: 12, color: "bg-red-300" },
	],
	grtMonth: [
		{ label: "Pending", value: 156, color: "bg-orange-300" },
		{ label: "Sent to MIS", value: 489, color: "bg-blue-300" },
		{ label: "Approved", value: 1245, color: "bg-green-300" },
		{ label: "Rejected", value: 67, color: "bg-red-300" },
	],

	// Groups
	activeGroups: 124,
	totalGroups: 187,
	
	// Users
	activeUsersCount: 28,
	activeUsers: [
		{ emp_name: "Ramesh Kumar", emp_id: "EMP001", user_status: "A" },
		{ emp_name: "Suresh Patel", emp_id: "EMP002", user_status: "A" },
		{ emp_name: "Priya Sharma", emp_id: "EMP003", user_status: "A" },
		{ emp_name: "Amit Singh", emp_id: "EMP004", user_status: "A" },
		{ emp_name: "Neha Gupta", emp_id: "EMP005", user_status: "I" },
		{ emp_name: "Vikram Mehta", emp_id: "EMP006", user_status: "A" },
	],

	// Loan Disbursed
	disbursedMonth: 1250000,
	disbursedToday: 45000,
	disbursedGroupsMonth: 32,
	disbursedGroupsToday: 8,

	// Loan Collected
	collectedMonth: 980000,
	collectedToday: 38000,
	collectedGroupsMonth: 28,
	collectedGroupsToday: 7,

	// Unapproved
	unapprovedAmount: 125000,
	unapprovedGroups: 15,
	unapprovedTransfersGroups: 3,
	unapprovedTransfersMembers: 12,

	// Demand Data
	demandMonth: 1520000,
	demandMonthGroups: 42,
	demandDaily: 38000,
	demandDailyGroups: 15,
	demandWeekly: 125000,
	demandWeeklyGroups: 28,

	// Overdue Data
	overdueMonth: 875000,
	overdueMonthGroups: 24,
	overdueDaily: 12500,
	overdueDailyGroups: 8,
	overdueWeekly: 42000,
	overdueWeeklyGroups: 14,

	// CO Wise Breakup
	coWiseBreakup: [
		{ co_id: "CO001", emp_name: "Amit Kumar", od_amt: 125000, group_count: 5 },
		{ co_id: "CO002", emp_name: "Priya Singh", od_amt: 89000, group_count: 4 },
		{ co_id: "CO003", emp_name: "Rahul Verma", od_amt: 210000, group_count: 8 },
		{ co_id: "CO004", emp_name: "Neha Sharma", od_amt: 45000, group_count: 2 },
		{ co_id: "CO005", emp_name: "Vikram Mehta", od_amt: 167000, group_count: 6 },
		{ co_id: "CO006", emp_name: "Sanjay Gupta", od_amt: 94000, group_count: 4 },
	],

	// OD Alert
	odAlertGroups: 24,
	odAlertAmount: 875000,
}

const columns = [
  {
    title: 'ID',
    dataIndex: 'co_id',
    key: 'co_id',
	sorter: (a, b) => a.co_id.toString().localeCompare(b.co_id.toString()),
  },
  {
    title: 'Name',
    dataIndex: 'emp_name',
    key: 'emp_name',
	sorter: (a, b) => a.emp_name.localeCompare(b.emp_name),
  },
  {
    title: 'Amount',
    dataIndex: 'od_amt',
    key: 'od_amt',
    render: (val) => formatINR(val),
	sorter: (a, b) => a.od_amt - b.od_amt,
  },
  {
    title: 'No. Of Groups',
    dataIndex: 'group_count',
    key: 'group_count',
	sorter: (a, b) => a.group_count - b.group_count,
   },
];

export default function Dashboard() {
	const [monthlyOverdueDemand, setMonthlyOverdueDemand] = useState([])
	const [isOverdueLoadingPending, setOverdueLoadingPendingStatus] = useState(false);
	const [searchText, setSearchText] = useState('');
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [odDtls, setOdDtls] = useState(() => {})
	const userDetails = JSON.parse(localStorage.getItem("user_details")) || {
		id: 2,
		emp_name: "Demo User",
		branch_name: "Demo Branch",
		brn_code: "100",
		emp_id: "DEMO001"
	}
	const type = userDetails.id === 2 ? "BM" : "Admin 2"
	const branchId = userDetails?.brn_code

	const [loading, setLoading] = useState(() => false)
	const [loadingLong, setLoadingLong] = useState(() => false)
	const [loadingOd, setLoadingOd] = useState(() => false)
	const [loadingDmd, setLoadingDmd] = useState(() => false)
	const navigate = useNavigate()

	const [loadingDmd_m_d_w, setLoadingDmd_m_d_w] = useState(() => false)
	
	const [branches, setBranches] = useState(() => [
		// { code: "100", name: "All Branches (100)" },
		{ code: "101", name: "Branch (101)" },
		{ code: "102", name: "Branch (102)" },
		{ code: "103", name: "Branch (103)" },
	])
	const [choosenBranch, setChoosenBranch] = useState(() =>
		+branchId === 100 ? "100" : branchId
	)

	const [grtPeriod, setGrtPeriod] = useState("Today")
	const [choosenGraphYear, setChoosenGraphYear] = useState("A")

	const [dateOfOperation, setDateOfOperation] = useState(moment().format("DD-MM-YYYY"))
	const [grtDataToday, setGrtDataToday] = useState(DEMO_DATA.grtToday)
	const [grtDataMonth, setGrtDataMonth] = useState(DEMO_DATA.grtMonth)
	const [activeGroupsCount, setActiveGroupsCount] = useState(DEMO_DATA.activeGroups)
	const [totalGroupsCount, setTotalGroupsCount] = useState(DEMO_DATA.totalGroups)
	const [activeUsersCount, setActiveUsersCount] = useState(DEMO_DATA.activeUsersCount)
	const [activeUsers, setActiveUsers] = useState(DEMO_DATA.activeUsers)
	const [getOpenDt_CloseDt, setOpenDt_CloseDt] = useState("N")

	const [disbursedLoanDetailCountsToday, setDisbursedLoanDetailCountsToday] =
		useState({
			data: DEMO_DATA.disbursedToday,
			noOfGroups: DEMO_DATA.disbursedGroupsToday,
		})
	const [disbursedLoanDetailCountsMonth, setDisbursedLoanDetailCountsMonth] =
		useState({
			data: DEMO_DATA.disbursedMonth,
			noOfGroups: DEMO_DATA.disbursedGroupsMonth,
		})

	const [collectedLoanDetailCountsToday, setCollectedLoanDetailCountsToday] =
		useState({
			data: DEMO_DATA.collectedToday,
			noOfGroups: DEMO_DATA.collectedGroupsToday,
		})
	const [collectedLoanDetailCountsMonth, setCollectedLoanDetailCountsMonth] =
		useState({
			data: DEMO_DATA.collectedMonth,
			noOfGroups: DEMO_DATA.collectedGroupsMonth,
		})

	const [unapprovedTxnsDetailCountsTotal, setUnapprovedTxnsDetailCountsTotal] =
		useState({
			data: DEMO_DATA.unapprovedAmount,
			noOfGroups: DEMO_DATA.unapprovedGroups,
		})

	const [unapprovedTransfers, setUnapprovedTransfers] = useState({
		noOfMembers: DEMO_DATA.unapprovedTransfersMembers,
		noOfGroups: DEMO_DATA.unapprovedTransfersGroups,
	})

	const [odFlags, setOdFlags] = useState({
		id: 0,
		flag: "M",
		recovDay: "",
	})
	const [odDetails, setOdDetails] = useState({
		data: "",
		noOfGroups: "",
	})

	const [odDetails_m, setOdDetails_m] = useState({
		data: DEMO_DATA.overdueMonth,
		noOfGroups: DEMO_DATA.overdueMonthGroups,
	})

	const [odDetails_d, setOdDetails_d] = useState({
		data: DEMO_DATA.overdueDaily,
		noOfGroups: DEMO_DATA.overdueDailyGroups,
	})

	const [odDetails_w, setOdDetails_w] = useState({
		data: DEMO_DATA.overdueWeekly,
		noOfGroups: DEMO_DATA.overdueWeeklyGroups,
	})

	const [dmdDetails_m, setDmdDetails_m] = useState({
		data: DEMO_DATA.demandMonth,
		noOfGroups: DEMO_DATA.demandMonthGroups,
	})
	const [dmdDetails_d, setDmdDetails_d] = useState({
		data: DEMO_DATA.demandDaily,
		noOfGroups: DEMO_DATA.demandDailyGroups,
	})
	const [dmdDetails_w, setDmdDetails_w] = useState({
		data: DEMO_DATA.demandWeekly,
		noOfGroups: DEMO_DATA.demandWeeklyGroups,
	})

	const [demandFlag, setDemandFlag] = useState(() => 1)

	const activeGrtData = grtPeriod === "Today" ? grtDataToday : grtDataMonth

	const getBranchCodes = () => {
		if (+choosenBranch === 100) 
			return branches.map((b) => b.code)
		return [+choosenBranch]
	}
	
	const showModal = () => setIsModalOpen(true);
	const handleOk = () => setIsModalOpen(false);
  	const handleCancel = () => setIsModalOpen(false);
	
	const fetchBranches = async () => {
		// Demo - branches already set in state
		setLoading(false)
	}

	const fetchTotalGrtDetails = async (flag) => {
		setLoading(true)
		setTimeout(() => {
			if (flag === "Today") {
				setGrtDataToday(DEMO_DATA.grtToday)
			} else {
				setGrtDataMonth(DEMO_DATA.grtMonth)
			}
			setLoading(false)
		}, 500)
	}

	const fetchActiveGroups = async () => {
		setLoading(true)
		setTimeout(() => {
			setActiveGroupsCount(DEMO_DATA.activeGroups)
			setTotalGroupsCount(DEMO_DATA.totalGroups)
			setLoading(false)
		}, 500)
	}

	const fetchUserLoggedInDetails = async () => {
		setLoading(true)
		setTimeout(() => {
			setActiveUsersCount(DEMO_DATA.activeUsersCount)
			setActiveUsers(DEMO_DATA.activeUsers)
			setLoading(false)
		}, 500)
	}

	const fetchLoanDisbursedDetailsToday = async () => {
		setLoading(true)
		setTimeout(() => {
			setDisbursedLoanDetailCountsToday({
				data: DEMO_DATA.disbursedToday,
				noOfGroups: DEMO_DATA.disbursedGroupsToday,
			})
			setLoading(false)
		}, 500)
	}

	const fetchLoanDisbursedDetailsThisMonth = async () => {
		setLoading(true)
		setTimeout(() => {
			setDisbursedLoanDetailCountsMonth({
				data: DEMO_DATA.disbursedMonth,
				noOfGroups: DEMO_DATA.disbursedGroupsMonth,
			})
			setLoading(false)
		}, 500)
	}

	const fetchLoanCollectedDetailsToday = async () => {
		setLoading(true)
		setTimeout(() => {
			setCollectedLoanDetailCountsToday({
				data: DEMO_DATA.collectedToday,
				noOfGroups: DEMO_DATA.collectedGroupsToday,
			})
			setLoading(false)
		}, 500)
	}

	const fetchLoanCollectedDetailsThisMonth = async () => {
		setLoading(true)
		setTimeout(() => {
			setCollectedLoanDetailCountsMonth({
				data: DEMO_DATA.collectedMonth,
				noOfGroups: DEMO_DATA.collectedGroupsMonth,
			})
			setLoading(false)
		}, 500)
	}

	const fetchUnapprovedTxnsTotal = async () => {
		setLoadingLong(true)
		setTimeout(() => {
			setUnapprovedTxnsDetailCountsTotal({
				data: DEMO_DATA.unapprovedAmount,
				noOfGroups: DEMO_DATA.unapprovedGroups,
			})
			setLoadingLong(false)
		}, 500)
	}

	const fetchUnapprovedTransfers = async () => {
		setLoadingLong(true)
		setTimeout(() => {
			setUnapprovedTransfers({
				noOfGroups: DEMO_DATA.unapprovedTransfersGroups,
				noOfMembers: DEMO_DATA.unapprovedTransfersMembers,
			})
			setLoadingLong(false)
		}, 500)
	}

	const fetchDateOfOperation = async () => {
		setLoading(true)
		setTimeout(() => {
			setDateOfOperation(moment().format("DD-MM-YYYY"))
			setLoading(false)
		}, 500)
	}

	const fetchOverdueDetailsForAllBranches__m = async (para) => {
		setLoadingOd(true)
		setTimeout(() => {
			setOdDetails_m({
				data: DEMO_DATA.overdueMonth,
				noOfGroups: DEMO_DATA.overdueMonthGroups,
			})
			setOdDtls({
				data: DEMO_DATA.overdueMonth,
				noOfGroups: DEMO_DATA.overdueMonthGroups,
				date: moment().subtract(1, 'M').format("MMM YYYY"),
			})
			setLoadingOd(false)
		}, 500)
	}

	const fetchOverdueDetailsForAllBranches__d = async (para) => {
		setLoadingOd(true)
		setTimeout(() => {
			setOdDetails_d({
				data: DEMO_DATA.overdueDaily,
				noOfGroups: DEMO_DATA.overdueDailyGroups,
			})
			setLoadingOd(false)
		}, 500)
	}

	const fetchOverdueDetailsForAllBranches__w = async (para) => {
		setLoadingOd(true)
		setTimeout(() => {
			setOdDetails_w({
				data: DEMO_DATA.overdueWeekly,
				noOfGroups: DEMO_DATA.overdueWeeklyGroups,
			})
			setLoadingOd(false)
		}, 500)
	}

	const fetchDemandDetails__m = async (para) => {
		setLoadingDmd_m_d_w(true)
		setTimeout(() => {
			setDmdDetails_m({
				data: DEMO_DATA.demandMonth,
				noOfGroups: DEMO_DATA.demandMonthGroups,
			})
			setLoadingDmd_m_d_w(false)
		}, 500)
	}

	const fetchDemandDetails__d = async (para) => {
		setLoadingDmd_m_d_w(true)
		setTimeout(() => {
			setDmdDetails_d({
				data: DEMO_DATA.demandDaily,
				noOfGroups: DEMO_DATA.demandDailyGroups,
			})
			setLoadingDmd_m_d_w(false)
		}, 500)
	}

	const fetchDemandDetails__w = async (para) => {
		setLoadingDmd_m_d_w(true)
		setTimeout(() => {
			setDmdDetails_w({
				data: DEMO_DATA.demandWeekly,
				noOfGroups: DEMO_DATA.demandWeeklyGroups,
			})
			setLoadingDmd_m_d_w(false)
		}, 500)
	}

	const { checkOpenDtCloseDt, openDtCloseDt } = useCheckOpenCloseDate(userDetails)

	useEffect(() => {
		fetchBranches()
	}, [])

	useEffect(() => {
		if (branches.length) {
			fetchDateOfOperation()
			// checkOpenDtCloseDt()
			fetchTotalGrtDetails(grtPeriod !== "Today" ? "Month" : "Today")
			fetchActiveGroups()
			fetchUserLoggedInDetails()
			fetchLoanDisbursedDetailsToday()
			fetchLoanDisbursedDetailsThisMonth()
			fetchLoanCollectedDetailsToday()
			fetchLoanCollectedDetailsThisMonth()
			fetchUnapprovedTxnsTotal()
			fetchUnapprovedTransfers()
		}
	}, [grtPeriod, choosenBranch, branches])

	useEffect(() => {
		if (branches.length) {
			fetchOverdueDetailsForAllBranches__m('sub')
			fetchOverdueDetailsForAllBranches__d('sub')
			fetchOverdueDetailsForAllBranches__w('sub')
			fetchDemandDetails__m('sub')
			fetchDemandDetails__d('sub')
			fetchDemandDetails__w('sub')
		}
	}, [odFlags, choosenBranch, branches])

	const handleBranchChange = (e) => {
		setChoosenBranch(e.target.value)
	}
	
	const showCoWiseBreakup = () => {
		setOverdueLoadingPendingStatus(true);
		setTimeout(() => {
			setMonthlyOverdueDemand(DEMO_DATA.coWiseBreakup);
			setOverdueLoadingPendingStatus(false);
			setIsModalOpen(true);
		}, 500);
	}
	
	return (
		<div className="p-8 space-y-6 bg-slate-50 min-h-screen rounded-3xl">
			{/* {odDtls && odDtls?.noOfGroups > 0 && (
				<AlertComp
					msg={<p className="text-3xl font-normal">
						<span className="text-lg ">Total OD as on {' ' + dateOfOperation + ' '} 
						for {odDtls?.noOfGroups} group is </span>
						{formatINR(odDtls?.data)}
					</p>}
				/>
			)} */}

			{/* {getOpenDt_CloseDt && getOpenDt_CloseDt === 'Y' && (
				<div className="bg-orange-100 border-t-4 border-orange-500 rounded-b text-orange-700 px-4 py-3 shadow-md" role="alert">
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
				</div>
			)} */}

			<div className="flex flex-col md:flex-row justify-between items-center">
				<h1 className="text-2xl font-bold text-slate-700 uppercase pl-5">
					Welcome back,{" "}
					<span className="text-slate-600 text-2xl font-thin">
						{userDetails[0]?.emp_name}
					</span>{" "}
					:{" "}
					<span className="text-slate-600 text-2xl font-thin">
						{userDetails[0]?.branch_name}
					</span>
				</h1>
				<h1 className="text-2xl font-bold text-slate-700 uppercase">
					<Spin spinning={loading}>
						Date of operation :{" "}
						<span className="text-slate-600 text-2xl font-thin">
							{dateOfOperation}
						</span>
					</Spin>
				</h1>
			</div>

			{userDetails[0]?.user_type == 'H' && (
				<div className="flex flex-col md:flex-row justify-between items-center">
					<TDInputTemplateBr
						placeholder="Select Branch..."
						type="text"
						formControlName={choosenBranch}
						handleChange={handleBranchChange}
						data={branches}
						mode={2}
					/>
				</div>
			)}

			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
				<div className="col-span-1 md:col-span-2 rounded-3xl bg-white shadow-md p-6 space-y-4 overflow-hidden">
					<div className="flex justify-between items-center">
						<h2 className="text-xl font-medium text-slate-700">Total GRT</h2>
						<div className="space-x-2">
							{["Today", "This month"].map((option) => (
								<button
									key={option}
									onClick={() => setGrtPeriod(option)}
									className={`px-3 py-1 rounded-full font-medium text-sm ${
										grtPeriod === option
											? "bg-teal-600 text-white"
											: "bg-slate-100 text-slate-600"
									}`}
								>
									{option}
								</button>
							))}
						</div>
					</div>

					{activeGrtData.map((item) => (
						<div key={item.label} className="flex items-center">
							<span className="w-40 text-sm text-slate-600">
								{item.label}
							</span>
							<div className="flex-1 bg-slate-100 h-4 rounded-full mx-4 overflow-hidden relative">
								<motion.div
									className={`${item.color} h-4`}
									style={{ clipPath: "inset(0 round 999px)" }}
									initial={{ width: 0 }}
									animate={{ width: `${Math.min((item.value / 1500) * 100, 100)}%` }}
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

				<div className="bg-white rounded-3xl shadow-md p-6 flex flex-col items-center justify-center group">
					<h3 className="text-lg font-medium text-slate-700">Active Groups</h3>
					<div className="bg-green-100 rounded-full p-4 my-4">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-6 w-6 text-green-600 arrow"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M5 10l7-7m0 0l7 7m-7-7v18"
							/>
						</svg>
					</div>
					<Spin spinning={loading}>
						<span className="text-3xl font-bold text-slate-800">
							{formatNumber(activeGroupsCount)}
						</span>
					</Spin>
					<span className="text-sm text-slate-600 mt-1">
						Total Groups • {formatNumber(totalGroupsCount)}
					</span>
				</div>

				<div className="col-span-1 md:col-span-1 perspective cursor-pointer">
					<div
						className="relative w-full h-full transition-transform duration-500"
						style={{
							transformStyle: "preserve-3d",
						}}
					>
						<div
							className="absolute inset-0 bg-white rounded-3xl shadow-md p-6 flex flex-col items-center justify-center"
							style={{ backfaceVisibility: "hidden" }}
						>
							<h3 className="text-lg font-medium text-slate-700">
								Users Logged In
							</h3>
							<div className="bg-purple-100 rounded-full p-4 my-4">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-6 w-6 text-purple-600"
									fill="currentColor"
									viewBox="0 0 24 24"
								>
									<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" />
									<path
										fillRule="evenodd"
										d="M4 20c0-4 4-6 8-6s8 2 8 6v1H4v-1z"
										clipRule="evenodd"
									/>
								</svg>
							</div>
							<Spin spinning={loading}>
								<span className="text-3xl font-bold text-slate-800">
									{new Intl.NumberFormat("en-IN").format(activeUsersCount || 0)}
								</span>
							</Spin>
							<span className="text-sm text-slate-600 mt-1">Active users</span>
						</div>

						<div
							className="absolute inset-0 bg-purple-50 rounded-3xl shadow-md p-6 flex items-center justify-center"
							style={{
								transform: "rotateY(-180deg)",
								backfaceVisibility: "hidden",
							}}
						>
							{activeUsers.length !== 0 ? (
								<div className="w-full max-h-[160px] overflow-auto">
									<ul className="max-w-md space-y-1 text-slate-600 list-inside dark:text-slate-400">
										{activeUsers?.map((user, i) => (
											<>
												<li key={i} className="flex items-center">
													{user?.user_status === "A" ? (
														<svg
															className="w-3.5 h-3.5 me-2 text-green-500 dark:text-green-400 shrink-0"
															aria-hidden="true"
															xmlns="http://www.w3.org/2000/svg"
															fill="currentColor"
															viewBox="0 0 20 20"
														>
															<path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
														</svg>
													) : (
														<svg
															className="w-3.5 h-3.5 me-2 shrink-0"
															aria-hidden="true"
															xmlns="http://www.w3.org/2000/svg"
															viewBox="0 0 20 20"
														>
															<circle cx="10" cy="10" r="9.5" fill="#ef4444" />
															<path
																fill="#ffffff"
																d="M13.414 6.586a1 1 0 0 0-1.414 0L10 8.586 8 6.586a1 1 0 1 0-1.414 1.414L8.586 10l-1.999 2a1 1 0 1 0 1.414 1.414L10 11.414l2 1.999a1 1 0 0 0 1.414-1.414L11.414 10l2-2a1 1 0 0 0 0-1.414z"
															/>
														</svg>
													)}
													{user?.emp_name} - {user?.emp_id}
												</li>
												<hr className="border-t border-purple-200 my-2 w-3/4" />
											</>
										))}
									</ul>
								</div>
							) : (
								<Empty />
							)}
						</div>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-6 gap-6">
				<DashboardCard
					titleLeft="Loan Disbursed"
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
				/>

				<DashboardCard
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
				/>

				<DashboardCard
					titleLeft="Unapproved Txns"
					left1Data={{
						label: "Unapproved",
						value: formatINR(unapprovedTxnsDetailCountsTotal.data),
					}}
					left2Data={{
						label: "No. of Groups",
						value: formatNumber(unapprovedTxnsDetailCountsTotal.noOfGroups),
					}}
					titleRight="Unapproved Transfers"
					right1Data={{
						label: "No. of Groups",
						value: formatNumber(unapprovedTransfers.noOfGroups),
					}}
					right2Data={{
						label: "No. of Members",
						value: formatNumber(unapprovedTransfers.noOfMembers),
					}}
					leftColor="#009966"
					rightColor="#334155"
					loading={loading}
				/>

				<div className="md:col-span-3 rounded-3xl bg-white shadow-md pt-3 overflow-hidden">
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
				</div>
			</div>

			<Modal
				title="CO Wise Breakup Details"
				open={isModalOpen}
				footer={null}
				onCancel={handleCancel}
				width={700}
			>
				<Input
					placeholder="Search..."
					value={searchText}
					onChange={(e) => setSearchText(e.target.value)}
					style={{ marginBottom: 16 }}
					allowClear
				/>
				<Table 
					size="small" 
					bordered={true}
					dataSource={monthlyOverdueDemand.filter((item) =>
						Object.values(item).some((value) =>
							String(value).toLowerCase().includes(searchText.toLowerCase())
						)
					)} 
					columns={columns} 
					pagination={false} 
					summary={(pageData) => {
						let totalAmt = 0;
						let totalGrp = 0;
						pageData.forEach(({ od_amt, group_count }) => {
							totalAmt += Number(od_amt);
							totalGrp += group_count;
						});
						return (
							<Table.Summary.Row>
								<Table.Summary.Cell index={0} colSpan={2}><strong>Total</strong></Table.Summary.Cell>
								<Table.Summary.Cell index={1}><strong>{formatINR(totalAmt)}</strong></Table.Summary.Cell>
								<Table.Summary.Cell index={2}><strong>{totalGrp}</strong></Table.Summary.Cell>
							</Table.Summary.Row>
						);
					}}
				/>
			</Modal>
		</div>
	)
}