import React, { useEffect, useState } from "react"
import "./Menus.css"
import {
	BarChartOutlined,
	UserOutlined,
	BarsOutlined,
	LogoutOutlined,
	ImportOutlined,
	LineChartOutlined,
	ContainerOutlined,
	FileSearchOutlined,
	SearchOutlined,
	DeploymentUnitOutlined,
	PlusCircleOutlined,
	ThunderboltOutlined,
	CheckCircleOutlined,
	DatabaseOutlined,
	EyeOutlined,
	UserAddOutlined,
	SettingOutlined,
	FastForwardOutlined,
	SubnodeOutlined,
	SendOutlined,
	LoadingOutlined,
	WalletOutlined,
} from "@ant-design/icons"
import { Menu, Spin } from "antd"
import { Link } from "react-router-dom"
import IMG from "../Assets/Images/ssvws_crop-round.jpg"
import Tooltip from "@mui/material/Tooltip"
import { useNavigate, useLocation } from "react-router-dom"
import DialogBox from "./DialogBox"
import { routePaths } from "../Assets/Data/Routes"
import { url, url_bdccb } from "../Address/BaseUrl"
import axios from "axios"


function MenusBr({ theme, data, data_ApprovPending }) {
	console.log(data, "-------")
	// const userDetails = JSON.parse(localStorage.getItem("user_details"))
	const [current, setCurrent] = React.useState([])
	const [visibleModal, setVisibleModal] = useState(() => false)
	const [visibleModal2, setVisibleModal2] = useState(() => false)
	const [menuItems, setMenuItems] = useState([])
	const [menuItems_ApprPend, setMenuItems_ApprPend] = useState([])
	const userDetails = JSON.parse(localStorage.getItem("user_details")) || {}
	// const [getMenuShow, setMenuShow] = useState(localStorage.getItem("pendingApprove"))
	const [getMenuShow, setMenuShow] = useState('')
	const navigate = useNavigate()
	const location = useLocation()

	useEffect(() => {
		loadMenu();
	}, []);

	useEffect(() => {
		const findBestMatch = (items, bestMatch = { key: null, length: 0 }) => {
			if (!items) return bestMatch;

			let currentPath = location.pathname.toLowerCase().replace(/\/$/, "");
			
			let uTypeChar = Array.isArray(userDetails) ? userDetails[0]?.user_type : userDetails?.user_type;
			const isBranch = uTypeChar === 'B' || uTypeChar === 'P';

			const detailPathMappings = isBranch ? {
				"shg-recovery-details": "recovery-shg-list",
				"viewloan-shg-recovery": "recovery-shg-list",
				"group-recovery-details": "recovery-group-list",
				"viewloan-group-recovery": "recovery-group-list",
				"loan_branch_soi-recovery-details": "recovery-society-list",
				"viewloan-society-recovery": "recovery-society-list",
			} : {
				"shg-recovery-details": "loan-recovery-shg-list",
				"viewloan-shg-recovery": "loan-recovery-shg-list",
				"group-recovery-details": "loan-recovery-group-list",
				"viewloan-group-recovery": "loan-recovery-group-list",
				"loan_branch_soi-recovery-details": "loan-recovery-society-list",
				"viewloan-society-recovery": "loan-recovery-society-list",
			};
			for (const [detail, parent] of Object.entries(detailPathMappings)) {
				if (currentPath.includes(detail)) {
					currentPath = currentPath.replace(new RegExp(detail + ".*"), parent);
					break;
				}
			}

			for (let item of items) {
				if (item.path) {
					const itemPath = item.path.toLowerCase().replace(/\/$/, "");
					if (currentPath.includes(itemPath)) {
						if (itemPath.length >= bestMatch.length) {
							bestMatch = { key: item.key, length: itemPath.length };
						}
					}
				}
				if (item.children) {
					bestMatch = findBestMatch(item.children, bestMatch);
				}
			}
			return bestMatch;
		};
		const match = findBestMatch(menuItems);
		const activeKey = match.key;
		console.log("Current Pathname:", location.pathname);
		console.log("Menu Items:", menuItems);
		console.log("Found Active Key:", activeKey);
		if (activeKey) {
			setCurrent(String(activeKey));
		}
	}, [location.pathname, menuItems]);

	const onClick = (e) => {
		console.log("click ", e)
		// Let the URL change handle the active key
	}

	const loadMenu = async () => {
		try {
			let uTypeChar = Array.isArray(userDetails) ? userDetails[0]?.user_type : userDetails?.user_type;
			const loginAs = localStorage.getItem("login_as_branch_society");
			if (uTypeChar === 'H' && loginAs) {
				uTypeChar = loginAs;
			}
			let uType = 0;
			if (uTypeChar === 'S') uType = 1;
			else if (uTypeChar === 'H') uType = 2;
			else if (uTypeChar === 'B') uType = 3;
			else if (uTypeChar === 'P') uType = 4;
			else uType = userDetails?.id || (Array.isArray(userDetails) ? userDetails[0]?.id : 0); // Fallback

			const res = await axios.post(url_bdccb + "/dashboard/get_menu", {
				user_type_id: uType
			});

			if (res.data.suc === 1) {
				console.log("Menu API Response:", res.data.msg);
				setMenuItems(convertMenu(res.data.msg));
			} else {
				console.log("Menu API Failed:", res.data);
			}
		} catch (err) {
			console.error("Menu API Error:", err);
		}
	};

	const convertMenu = (menus) => {
		return menus.map(item => ({
			key: String(item.key),
			icon: item.icon && menuIcons[item.icon.trim()] ? menuIcons[item.icon.trim()] : undefined,
			label: item.link
				? <Link to={item.link}>{item.label}</Link>
				: item.label,
			path: item.link,
			children: (item.children && item.children.length > 0)
				? convertMenu(item.children)
				: undefined
		}));
	};

	const menuIcons = {
		LineChartOutlined: <LineChartOutlined />,
		ImportOutlined: <ImportOutlined />,
		UserAddOutlined: <UserAddOutlined />,
		SettingOutlined: <SettingOutlined />,
		FastForwardOutlined: <FastForwardOutlined />,
		ContainerOutlined: <ContainerOutlined />,
		SearchOutlined: <SearchOutlined />,
		FileSearchOutlined: <FileSearchOutlined />,
		DeploymentUnitOutlined: <DeploymentUnitOutlined />,
		PlusCircleOutlined: <PlusCircleOutlined />,
		ThunderboltOutlined: <ThunderboltOutlined />,
		DatabaseOutlined: <DatabaseOutlined />,
		BarsOutlined: <BarsOutlined />,
		CheckCircleOutlined: <CheckCircleOutlined />,
		EyeOutlined: <EyeOutlined />,
		SubnodeOutlined: <SubnodeOutlined />,
		BarChartOutlined: <BarChartOutlined />,
	};

	useEffect(() => {
		// Update getMenuShow from localStorage
		const pendingApprove = localStorage.getItem("pendingApprove")
		setMenuShow(pendingApprove)
	}, [])

	// Listen for localStorage changes
	useEffect(() => {

		const handleStorageChange = () => {
			const pendingApprove = localStorage.getItem("pendingApprove")
			setMenuShow(pendingApprove)
		}

		// Add event listener for storage changes
		window.addEventListener('storage', handleStorageChange)

		// Also check periodically (optional, as a fallback)
		const interval = setInterval(() => {
			const pendingApprove = localStorage.getItem("pendingApprove")
			// if (pendingApprove !== getMenuShow) {
			// console.log(getMenuShow, 'getMenuShowgetMenuShow', localStorage.getItem("pendingApprove") == 'yes');
			if (pendingApprove === 'yes') {
				setMenuShow(pendingApprove)
			}
			// else {
			// 	navigate(routePaths.LANDING)
			// 	localStorage.clear()
			// }
		}, 500) // Check every second

		return () => {
			window.removeEventListener('storage', handleStorageChange)
			clearInterval(interval)
		}
	}, [getMenuShow])




	var items_all_user1 = [
		{
			key: "sub1",
			icon: <LineChartOutlined />,
			label: <Link to={"/homebm/"}>Dashboard</Link>,
			// hidden: false,
			children: [],
		},
		{
			key: "sub2",
			icon: <ContainerOutlined />,
			label: "GRT",
			// hidden: data?.grt == "Y" ? false : true,
			children: [
				{
					key: "sub2-1",
					icon: <ContainerOutlined />,
					label: <Link to={"/homebm/grtappls/"}>Applications</Link>,
					// hidden: data?.applications == "Y" ? false : true,
				},
				{
					key: "sub2-4",
					icon: <FileSearchOutlined />,
					label: <Link to={"/homemis/searchmember/"}>Search Member</Link>,
					// hidden: data?.search_member == "Y" ? false : true,
				},
			],
		},
		{
			key: "sub3",
			icon: <DeploymentUnitOutlined />,
			label: "Groups",
			// hidden: data?.groups == "Y" ? false : true,
			children: [
				{
					key: "sub3-1",
					icon: <FileSearchOutlined />,
					label: <Link to={"/homebm/searchgroup/"}>Edit Group</Link>,
					// hidden: data?.edit_group == "Y" ? false : true,
				},
				{
					key: "sub3-2",
					icon: <PlusCircleOutlined />,
					label: <Link to={"/homebm/editgroupform/0"}>Add Group</Link>,
					// hidden: data?.add_group == "Y" ? false : true,
				},
				{
					key: "sub3-3",
					icon: <SendOutlined />,
					label: <Link to={"/homebm/trancefercofrom/0"}>Transfer Group</Link>,
					// hidden: data?.transfer_group == "Y" ? false : true,
				},
				{
					key: "sub3-5",
					icon: <CheckCircleOutlined />,
					label: (
						<Link to={"/homebm/trancefercofromapprove-unic"}>
							Approve Group Transfer
						</Link>
					),
					// hidden: data?.approve_group_transfer == "Y" ? false : true,
				},
				{
					key: "sub3-4",
					icon: <EyeOutlined />,
					label: <Link to={"/homebm/tranceferco"}>View Group Transfer</Link>,
					// hidden: data?.view_group_transfer == "Y" ? false : true,
				},

				//    {
				//      key: "sub3-3",
				//      icon: <SubnodeOutlined />,
				//      label: <Link to={"/homemis/assignmember"}>Assign Member</Link>,
				//    },
			],
		},
		{
			key: "sub_att",
			icon: <ImportOutlined />,
			label: "Attendance",
			// hidden: data?.attendance == "Y" ? false : true,
			children: [
				{
					key: "sub4-attr",
					icon: <UserAddOutlined />,
					label: <Link to={"/homebm/attendancebm"}>Attendance Dashboard</Link>,
					// hidden: data?.attendance_dashboard == "Y" ? false : true,
				},
			],
		},
		{
			key: "sub4",
			icon: <ThunderboltOutlined />,
			label: "Loans",
			// hidden: data?.loans == "Y" ? false : true,
			children: [
				{
					key: "sub4-1",
					icon: <ThunderboltOutlined />,
					label: <Link to={"/homebm/disburseloan"}>Disburse Loan</Link>,
					// hidden: data?.disburse_loan == "Y" ? false : true,
				},
				{
					key: "sub4-3",
					icon: <EyeOutlined />,
					label: <Link to={"/homebm/viewloan"}>View Loan</Link>,
					// hidden: data?.view_loan == "Y" ? false : true,
				},
				{
					key: "sub4-2",
					icon: <CheckCircleOutlined />,
					label: "Approve Transaction",
					// hidden: data?.approve_transaction == "Y" ? false : true,
					children: [
						{
							key: "sub4-2-1",
							icon: <CheckCircleOutlined />,
							label: <Link to={"/homebm/approvedisbursed"}>Disburse</Link>,
							// hidden: data?.approve_transaction == "Y" ? false : true,
						},
						{
							key: "sub4-2-2",
							icon: <CheckCircleOutlined />,
							label: <Link to={"/homebm/approveloan"}>Recovery</Link>,
							// hidden: data?.approve_transaction == "Y" ? false : true,
						},
					],
				},
			],
		},
		{
			key: "sub5",
			icon: <DatabaseOutlined />,
			label: "Master",
			// hidden: data?.master == "Y" ? false : true,
			children: [
				{
					key: "sub5-1",
					icon: <DatabaseOutlined />,
					label: <Link to={"/homeadmin/masterbanks"}>Banks</Link>,
					// hidden: data?.banks == "Y" ? false : true,
				},
				{
					key: "sub5-2",
					icon: <DatabaseOutlined />,
					label: <Link to={"/homeadmin/masteremployees"}>Employees</Link>,
					// hidden: data?.employees == "Y" ? false : true,
				},
				{
					key: "sub5-2",
					icon: <DatabaseOutlined />,
					label: <Link to={"/homeadmin/masterdesignations"}>Designations</Link>,
					// hidden: data?.designation == "Y" ? false : true,
				},
				{
					key: "sub5-7",
					icon: <DatabaseOutlined />,
					label: <Link to={"/homeadmin/masterfunds"}>Funds</Link>,
					// hidden: data?.designation == "Y" ? false : true,
				},
			],
		},
		{
			key: "sub7",
			icon: <ImportOutlined />,
			label: "User Management",
			// hidden: data?.user_management == "Y" ? false : true,
			children: [
				{
					key: "sub7-1",
					icon: <UserAddOutlined />,
					label: <Link to={"/homeadmin/createuser/0"}>Create User</Link>,
					// hidden: data?.create_user == "Y" ? false : true,
				},
				{
					key: "sub7-2",
					icon: <SettingOutlined />,
					label: <Link to={"/homeadmin/manageuser/"}>Manage User</Link>,
					// hidden: data?.manage_user == "Y" ? false : true,
				},
				{
					key: "sub7-3",
					icon: <FastForwardOutlined />,
					label: <Link to={"/homeadmin/transferuser/0"}>Transfer User</Link>,
					// hidden: data?.transfer_user == "Y" ? false : true,
				},
			],
		},
		{
			label: "Reports",
			key: "sub6",
			icon: <BarsOutlined />,
			// hidden: data?.reports == "Y" ? false : true,
			children: [
				// {
				//  key: "sub6-1",
				//  icon: <BarChartOutlined />,
				//  label: (
				//    <Link to={"/homebm/memberwiserecoveryreport"}>
				//      Memberwise Recovery
				//    </Link>
				//  ),
				// },
				// {
				//  key: "sub6-2",
				//  icon: <BarChartOutlined />,
				//  label: (
				//    <Link to={"/homebm/groupwiserecoveryreport"}>
				//      Groupwise Recovery
				//    </Link>
				//  ),
				// },
				// {
				//  key: "sub6-3",
				//  icon: <BarChartOutlined />,
				//  label: <Link to={"/homebm/demandreport"}>Demand</Link>,
				// },
				{
					key: "sub6-4",
					icon: <BarChartOutlined />,
					label: <Link to={"/homebm/loanstatements"}>Loan Statements</Link>,
					// hidden: data?.loan_statement == "Y" ? false : true,
				},
				{
					key: "sub6-5",
					icon: <BarChartOutlined />,
					label: <Link to={"/homebm/loantxns"}>Loan Transactions</Link>,
					// hidden: data?.loan_transactions == "Y" ? false : true,
				},
				{
					key: "sub6-6",
					icon: <BarChartOutlined />,
					label: <Link to={"/homebm/demandreport"}>Demand Report</Link>,
					// hidden: data?.demand_report == "Y" ? false : true,
				},
				{
					key: "sub6-7",
					icon: <BarChartOutlined />,
					label: (
						<Link to={"/homebm/outstasndingreport"}>Outstanding Report</Link>
					),
					// hidden: data?.outstanding_report == "Y" ? false : true,
				},
				// {
				//  key: "sub6-8",
				//  icon: <BarChartOutlined />,
				//  label: <Link to={"/homebm/summaryreports"}>Summary Reports</Link>,
				//  children: [
				//    {
				//      key: "sub6-8-1",
				//      icon: <BarChartOutlined />,
				//      label: (
				//        <Link to={"/homebm/summaryreports/fundwise"}>
				//          Fundwise Report
				//        </Link>
				//      ),
				//    },
				//    {
				//      key: "sub6-8-2",
				//      icon: <BarChartOutlined />,
				//      label: (
				//        <Link to={"/homebm/summaryreports/schemewise"}>
				//          Schemewise Report
				//        </Link>
				//      ),
				//    },
				//  ],
				// },
				{
					key: "sub6-8",
					icon: <BarChartOutlined />,
					label: <Link to={"/homebm/fundwisesummary"}>Fundwise Report</Link>,
					// hidden: data?.fundwise_report == "Y" ? false : true,
				},
				{
					key: "sub6-9",
					icon: <BarChartOutlined />,
					label: (
						<Link to={"/homebm/schemewisesummary"}>Schemewise Report</Link>
					),
					// hidden: data?.schemewise_report == "Y" ? false : true,
				},
				{
					key: "sub6-10",
					icon: <BarChartOutlined />,
					label: (
						<Link to={"/homebm/demandvscollectionreport"}>
							Demand vs. Collection
						</Link>
					),
					// hidden: data?.demand_vs_collection == "Y" ? false : true,
				},
				// {
				//   key: "sub6-10",
				//   icon: <BarChartOutlined />,
				//   label: (
				//     <Link to={"/homebm/groupclosereport"}>Group Close</Link>
				//   ),
				// },
			],
		},
	]
	// var items_all_user = []
	var items_all_user_copy1 = [
		{
			key: "sub1",
			icon: <LineChartOutlined />,
			label: <Link to={"/homebm/"}>Dashboard</Link>,
			hidden: false,
			children: [],
		},
		{
			key: "sub2",
			icon: <ContainerOutlined />,
			label: "GRT",
			hidden: data?.grt == "Y" ? false : true,
			children: [],
		},
		{
			key: "sub3",
			icon: <DeploymentUnitOutlined />,
			label: "Groups",
			hidden: data?.groups == "Y" ? false : true,
			children: [],
		},
		{
			key: "sub_att",
			icon: <ImportOutlined />,
			label: "Attendance",
			hidden: data?.attendance == "Y" ? false : true,
			children: [],
		},
		{
			key: "sub4",
			icon: <ThunderboltOutlined />,
			label: "Loans",
			hidden: data?.loans == "Y" ? false : true,
			children: [],
		},
		{
			key: "sub5",
			icon: <DatabaseOutlined />,
			label: "Master",
			hidden: data?.master == "Y" ? false : true,
			children: [],
		},
		{
			key: "sub7",
			icon: <ImportOutlined />,
			label: "User Management",
			hidden: data?.user_management == "Y" ? false : true,
			children: [],
		},
		{
			label: "Reports",
			key: "sub6",
			icon: <BarsOutlined />,
			hidden: data?.reports == "Y" ? false : true,
			children: [],
		},
	]

	var items_all_user_copy = data

	var items_all_user_copy_ApprovPending = data_ApprovPending

	useEffect(() => {
		// console.log(items_all_user_copy, '++++++++++++');
		if (data) {
			items_all_user_copy = data
			// setMenuItems(items_all_user_copy) // Removing this so the dynamic API items don't get overwritten

			console.log(items_all_user_copy, "++++++++++++")
		}

		if (data_ApprovPending) {
			items_all_user_copy_ApprovPending = data_ApprovPending
			setMenuItems_ApprPend(items_all_user_copy_ApprovPending)

			console.log(items_all_user_copy_ApprovPending, "ddddddddddddddddd")
		}

		// for (let i = 0; i < items_all_user1.length; i++) {
		//   if (items_all_user1[i].children?.length > 0) {
		//     // debugger;
		//     let temp = [];
		//     for (let j of items_all_user1[i].children) {
		//       if (!j.hidden) {
		//         temp.push(j);
		//       }
		//     }
		//     // debugger
		//     console.log(temp)
		//     // debugger
		//     items_all_user_copy[i].children = temp;
		//   }
		// }
		//   var userMenuData = []
		//   if(data){
		//   for(let dt of data){
		//     var tempMenuData = items_all_user1.filter((item) => item.key == dt.key)
		//     userMenuData.push(tempMenuData[0])
		//     // let temp = []
		//     // if(!dt.hidden)
		//     // if(Array.isArray(dt.children) && dt.children.length > 0){
		//     //   dt.children.length = 0
		//     //   for(let dt1 of dt.children){
		//     //     // console.log(dt1.hidden, '--------');

		//     //     if(!dt1.hidden){
		//     //       dt.children.push(dt1)
		//     //     }

		//     //     // console.log(temp, '+++++++++++');

		//     //   }
		//     //   // dt.children.length = 0
		//     //   // dt.children = temp
		//     // }
		//   }
		// }
		// setTimeout(() => {
		//   setItems(userMenuData)
		// // }, 100);
		// console.log(userMenuData, '-------------');



	}, [data])


	const items_user_type_15 = [
		{
			key: "sub1",
			icon: <LineChartOutlined />,
			label: <Link to={"/homeco/"}>Dashboard</Link>,
		},
		{
			key: "sub2",
			icon: <ContainerOutlined />,
			label: "GRT",
			children: [
				{
					key: "sub2-1",
					icon: <ContainerOutlined />,
					label: <Link to={"/homeco/grtappls/"}>Applications</Link>,
				},
				// {
				//   key: "sub2-2",
				//   icon: <SearchOutlined />,
				//   label: <Link to={"/homeco/searchform/"}>Search Form</Link>,
				// },
				// {
				//   key: "sub2-4",
				//   icon: <FileSearchOutlined />,
				//   label: <Link to={"/homemis/searchmember/"}>Search Member</Link>,
				// },
			],
		},
		{
			key: "sub3",
			icon: <DeploymentUnitOutlined />,
			label: "Groups",
			children: [
				{
					key: "sub3-1",
					icon: <FileSearchOutlined />,
					label: <Link to={"/homeco/searchgroup/"}>Edit Group </Link>,
				},
				{
					key: "sub3-3",
					icon: <SendOutlined />,
					label: <Link to={"/homebm/trancefercofrom/0"}>Transfer Group</Link>,
				},
				{
					key: "sub3-4",
					icon: <EyeOutlined />,
					label: <Link to={"/homebm/tranceferco"}>View Group Transfer</Link>,
				},
				//    {
				//      key: "sub3-2",
				//      icon: <PlusCircleOutlined />,
				//      label: <Link to={"/homemis/editgroupform/0"}>Add Group</Link>,
				//    },
				//    {
				//      key: "sub3-3",
				//      icon: <SubnodeOutlined />,
				//      label: <Link to={"/homemis/assignmember"}>Assign Member</Link>,
				//    },
			],
		},
		{
			key: "sub4",
			icon: <ThunderboltOutlined />,
			label: "Loans",
			children: [
				{
					key: "sub4-1",
					icon: <ThunderboltOutlined />,
					label: <Link to={"/homeco/disburseloan"}>Disburse Loan</Link>,
				},
				{
					key: "sub4-3",
					icon: <EyeOutlined />,
					label: <Link to={"/homebm/viewloan"}>View Loan</Link>,
				},
			],
		},
		{
			label: "Reports",
			key: "sub6",
			icon: <BarsOutlined />,
			children: [
				// {
				//  key: "sub6-1",
				//  icon: <BarChartOutlined />,
				//  label: (
				//    <Link to={"/homebm/memberwiserecoveryreport"}>
				//      Memberwise Recovery
				//    </Link>
				//  ),
				// },
				// {
				//  key: "sub6-2",
				//  icon: <BarChartOutlined />,
				//  label: (
				//    <Link to={"/homebm/groupwiserecoveryreport"}>
				//      Groupwise Recovery
				//    </Link>
				//  ),
				// },
				// {
				//  key: "sub6-3",
				//  icon: <BarChartOutlined />,
				//  label: <Link to={"/homebm/demandreport"}>Demand</Link>,
				// },
				{
					key: "sub6-4",
					icon: <BarChartOutlined />,
					label: <Link to={"/homebm/loanstatements"}>Loan Statements</Link>,
				},
				{
					key: "sub6-5",
					icon: <BarChartOutlined />,
					label: <Link to={"/homebm/loantxns"}>Loan Transactions</Link>,
				},
				{
					key: "sub6-6",
					icon: <BarChartOutlined />,
					label: <Link to={"/homebm/demandreport"}>Demand Report</Link>,
				},
				{
					key: "sub6-7",
					icon: <BarChartOutlined />,
					label: (
						<Link to={"/homebm/outstasndingreport"}>Outstanding Report</Link>
					),
				},
				// {
				//  key: "sub6-8",
				//  icon: <BarChartOutlined />,
				//  label: <Link to={"/homebm/summaryreports"}>Summary Reports</Link>,
				//  children: [
				//    {
				//      key: "sub6-8-1",
				//      icon: <BarChartOutlined />,
				//      label: (
				//        <Link to={"/homebm/summaryreports/fundwise"}>
				//          Fundwise Report
				//        </Link>
				//      ),
				//    },
				//    {
				//      key: "sub6-8-2",
				//      icon: <BarChartOutlined />,
				//      label: (
				//        <Link to={"/homebm/summaryreports/schemewise"}>
				//          Schemewise Report
				//        </Link>
				//      ),
				//    },
				//  ],
				// },
				{
					key: "sub6-8",
					icon: <BarChartOutlined />,
					label: <Link to={"/homebm/fundwisesummary"}>Fundwise Report</Link>,
				},
				{
					key: "sub6-9",
					icon: <BarChartOutlined />,
					label: (
						<Link to={"/homebm/schemewisesummary"}>Schemewise Report</Link>
					),
				},
				{
					key: "sub6-10",
					icon: <BarChartOutlined />,
					label: (
						<Link to={"/homebm/demandvscollectionreport"}>
							Demand vs. Collection
						</Link>
					),
				},
				// {
				//   key: "sub6-10",
				//   icon: <BarChartOutlined />,
				//   label: (
				//     <Link to={"/homebm/groupclosereport"}>Group Close</Link>
				//   ),
				// },
			],
		},
	]
	const items_user_type_2 = [
		{
			key: "sub1",
			icon: <LineChartOutlined />,
			label: <Link to={"/homebm/"}>Dashboard</Link>,
		},
		{
			key: "sub2",
			icon: <ContainerOutlined />,
			label: "GRT",
			children: [
				{
					key: "sub2-1",
					icon: <ContainerOutlined />,
					label: <Link to={"/homebm/grtappls/"}>Applications</Link>,
				},
				// {
				//   key: "sub2-2",
				//   icon: <SearchOutlined />,
				//   label: <Link to={"/homebm/searchform/"}>Search Form</Link>,
				// },
				// {
				//   key: "sub2-4",
				//   icon: <FileSearchOutlined />,
				//   label: <Link to={"/homemis/searchmember/"}>Search Member</Link>,
				// },
			],
		},
		{
			key: "sub3",
			icon: <DeploymentUnitOutlined />,
			label: "Groups",
			children: [
				{
					key: "sub3-1",
					icon: <FileSearchOutlined />,
					label: <Link to={"/homebm/searchgroup/"}>Edit Group</Link>,
				},
				{
					key: "sub3-2",
					icon: <PlusCircleOutlined />,
					label: <Link to={"/homebm/editgroupform/0"}>Add Group</Link>,
				},
				{
					key: "sub3-3",
					icon: <SendOutlined />,
					label: <Link to={"/homebm/trancefercofrom/0"}>Transfer Group</Link>,
				},
				{
					key: "sub3-5",
					icon: <CheckCircleOutlined />,
					label: (
						<Link to={"/homebm/trancefercofromapprove-unic"}>
							Approve Group Transfer
						</Link>
					),
				},
				{
					key: "sub3-4",
					icon: <EyeOutlined />,
					label: <Link to={"/homebm/tranceferco"}>View Group Transfer</Link>,
				},

				//    {
				//      key: "sub3-3",
				//      icon: <SubnodeOutlined />,
				//      label: <Link to={"/homemis/assignmember"}>Assign Member</Link>,
				//    },
			],
		},
		{
			key: "sub_att",
			icon: <ImportOutlined />,
			label: "Attendance",
			children: [
				{
					key: "sub4-1",
					icon: <UserAddOutlined />,
					label: <Link to={"/homebm/attendancebm"}>Attendance Dashboard</Link>,
				},
			],
		},
		{
			key: "sub4",
			icon: <ThunderboltOutlined />,
			label: "Loans",
			children: [
				{
					key: "sub4-1",
					icon: <ThunderboltOutlined />,
					label: <Link to={"/homebm/disburseloan"}>Disburse Loan</Link>,
				},
				{
					key: "sub4-3",
					icon: <EyeOutlined />,
					label: <Link to={"/homebm/viewloan"}>View Loan</Link>,
				},
				{
					key: "sub4-2",
					icon: <CheckCircleOutlined />,
					label: "Approve Transaction",
					children: [
						{
							key: "sub4-2-1",
							icon: <CheckCircleOutlined />,
							label: <Link to={"/homebm/approvedisbursed"}>Disburse</Link>,
						},
						{
							key: "sub4-2-2",
							icon: <CheckCircleOutlined />,
							label: <Link to={"/homebm/approveloan"}>Recovery</Link>,
						},
					],
				},
			],
		},
		{
			label: "Reports",
			key: "sub6",
			icon: <BarsOutlined />,
			children: [
				// {
				//  key: "sub6-1",
				//  icon: <BarChartOutlined />,
				//  label: (
				//    <Link to={"/homebm/memberwiserecoveryreport"}>
				//      Memberwise Recovery
				//    </Link>
				//  ),
				// },
				// {
				//  key: "sub6-2",
				//  icon: <BarChartOutlined />,
				//  label: (
				//    <Link to={"/homebm/groupwiserecoveryreport"}>
				//      Groupwise Recovery
				//    </Link>
				//  ),
				// },
				// {
				//  key: "sub6-3",
				//  icon: <BarChartOutlined />,
				//  label: <Link to={"/homebm/demandreport"}>Demand</Link>,
				// },
				{
					key: "sub6-4",
					icon: <BarChartOutlined />,
					label: <Link to={"/homebm/loanstatements"}>Loan Statements</Link>,
				},
				{
					key: "sub6-5",
					icon: <BarChartOutlined />,
					label: <Link to={"/homebm/loantxns"}>Loan Transactions</Link>,
				},
				{
					key: "sub6-6",
					icon: <BarChartOutlined />,
					label: <Link to={"/homebm/demandreport"}>Demand Report</Link>,
				},
				{
					key: "sub6-7",
					icon: <BarChartOutlined />,
					label: (
						<Link to={"/homebm/outstasndingreport"}>Outstanding Report</Link>
					),
				},
				// {
				//  key: "sub6-8",
				//  icon: <BarChartOutlined />,
				//  label: <Link to={"/homebm/summaryreports"}>Summary Reports</Link>,
				//  children: [
				//    {
				//      key: "sub6-8-1",
				//      icon: <BarChartOutlined />,
				//      label: (
				//        <Link to={"/homebm/summaryreports/fundwise"}>
				//          Fundwise Report
				//        </Link>
				//      ),
				//    },
				//    {
				//      key: "sub6-8-2",
				//      icon: <BarChartOutlined />,
				//      label: (
				//        <Link to={"/homebm/summaryreports/schemewise"}>
				//          Schemewise Report
				//        </Link>
				//      ),
				//    },
				//  ],
				// },
				{
					key: "sub6-8",
					icon: <BarChartOutlined />,
					label: <Link to={"/homebm/fundwisesummary"}>Fundwise Report</Link>,
				},
				{
					key: "sub6-9",
					icon: <BarChartOutlined />,
					label: (
						<Link to={"/homebm/schemewisesummary"}>Schemewise Report</Link>
					),
				},
				{
					key: "sub6-10",
					icon: <BarChartOutlined />,
					label: (
						<Link to={"/homebm/demandvscollectionreport"}>
							Demand vs. Collection
						</Link>
					),
				},
				// {
				//   key: "sub6-10",
				//   icon: <BarChartOutlined />,
				//   label: (
				//     <Link to={"/homebm/groupclosereport"}>Group Close</Link>
				//   ),
				// },
			],
		},
	]
	const items_user_type_10 = [
		{
			key: "sub1",
			icon: <LineChartOutlined />,
			label: <Link to={"/homemis/"}>Dashboard</Link>,
		},
		{
			key: "sub2",
			icon: <ContainerOutlined />,
			label: "GRT",
			children: [
				{
					key: "sub2-1",
					icon: <ContainerOutlined />,
					label: <Link to={"/homemis/grtappls/"}>Applications</Link>,
				},
				// {
				//   key: "sub2-2",
				//   icon: <SearchOutlined />,
				//   label: <Link to={"/homemis/searchform/"}>Search Form</Link>,
				// },
				{
					key: "sub2-4",
					icon: <FileSearchOutlined />,
					label: <Link to={"/homemis/searchmember/"}>Search Member</Link>,
				},
			],
		},
		{
			key: "sub3",
			icon: <DeploymentUnitOutlined />,
			label: "Groups",
			children: [
				{
					key: "sub3-1",
					icon: <FileSearchOutlined />,
					label: <Link to={"/homebm/searchgroup/"}>Edit Group</Link>,
				},
				{
					key: "sub3-2",
					icon: <PlusCircleOutlined />,
					label: <Link to={"/homebm/editgroupform/0"}>Add Group</Link>,
				},
				//    {
				//      key: "sub3-3",
				//      icon: <SubnodeOutlined />,
				//      label: <Link to={"/homemis/assignmember"}>Assign Member</Link>,
				//    },
			],
		},
		{
			key: "sub4",
			icon: <ThunderboltOutlined />,
			label: "Loans",
			children: [
				{
					key: "sub4-1",
					icon: <ThunderboltOutlined />,
					label: <Link to={"/homebm/disburseloan"}>Disburse Loan</Link>,
				},
				{
					key: "sub4-3",
					icon: <EyeOutlined />,
					label: <Link to={"/homebm/viewloan"}>View Loan</Link>,
				},
				// {
				//   key: "sub4-2",
				//   icon: <CheckCircleOutlined />,
				//   label: "Approve Transaction",
				//   children: [
				//     {
				//       key: "sub4-2-1",
				//       icon: <CheckCircleOutlined />,
				//       label: <Link to={"/homebm/approvedisbursed"}>Disburse</Link>,
				//     },
				//     {
				//       key: "sub4-2-2",
				//       icon: <CheckCircleOutlined />,
				//       label: <Link to={"/homebm/approveloan"}>Recovery</Link>,
				//     },
				//   ],
				// },
			],
		},

		{
			label: "Reports",
			key: "sub6",
			icon: <BarsOutlined />,
			children: [
				// {
				//  key: "sub6-1",
				//  icon: <BarChartOutlined />,
				//  label: (
				//    <Link to={"/homebm/memberwiserecoveryreport"}>
				//      Memberwise Recovery
				//    </Link>
				//  ),
				// },
				// {
				//  key: "sub6-2",
				//  icon: <BarChartOutlined />,
				//  label: (
				//    <Link to={"/homebm/groupwiserecoveryreport"}>
				//      Groupwise Recovery
				//    </Link>
				//  ),
				// },
				// {
				//  key: "sub6-3",
				//  icon: <BarChartOutlined />,
				//  label: <Link to={"/homebm/demandreport"}>Demand</Link>,
				// },
				{
					key: "sub6-4",
					icon: <BarChartOutlined />,
					label: <Link to={"/homebm/loanstatements"}>Loan Statements</Link>,
				},
				{
					key: "sub6-5",
					icon: <BarChartOutlined />,
					label: <Link to={"/homebm/loantxns"}>Loan Transactions</Link>,
				},
				{
					key: "sub6-6",
					icon: <BarChartOutlined />,
					label: <Link to={"/homebm/demandreport"}>Demand Report</Link>,
				},
				{
					key: "sub6-7",
					icon: <BarChartOutlined />,
					label: (
						<Link to={"/homebm/outstasndingreport"}>Outstanding Report</Link>
					),
				},
				// {
				//  key: "sub6-8",
				//  icon: <BarChartOutlined />,
				//  label: <Link to={"/homebm/summaryreports"}>Summary Reports</Link>,
				//  children: [
				//    {
				//      key: "sub6-8-1",
				//      icon: <BarChartOutlined />,
				//      label: (
				//        <Link to={"/homebm/summaryreports/fundwise"}>
				//          Fundwise Report
				//        </Link>
				//      ),
				//    },
				//    {
				//      key: "sub6-8-2",
				//      icon: <BarChartOutlined />,
				//      label: (
				//        <Link to={"/homebm/summaryreports/schemewise"}>
				//          Schemewise Report
				//        </Link>
				//      ),
				//    },
				//  ],
				// },
				{
					key: "sub6-8",
					icon: <BarChartOutlined />,
					label: <Link to={"/homebm/fundwisesummary"}>Fundwise Report</Link>,
				},
				{
					key: "sub6-9",
					icon: <BarChartOutlined />,
					label: (
						<Link to={"/homebm/schemewisesummary"}>Schemewise Report</Link>
					),
				},
				{
					key: "sub6-10",
					icon: <BarChartOutlined />,
					label: (
						<Link to={"/homebm/demandvscollectionreport"}>
							Demand vs. Collection
						</Link>
					),
				},
				// {
				//   key: "sub6-10",
				//   icon: <BarChartOutlined />,
				//   label: (
				//     <Link to={"/homebm/groupclosereport"}>Group Close</Link>
				//   ),
				// },
			],
		},
	]
	const items_user_type_4_100 = [
		{
			key: "sub1",
			icon: <LineChartOutlined />,
			label: <Link to={"/homeadmin/"}>Dashboard</Link>,
		},
		{
			key: "sub5",
			icon: <DatabaseOutlined />,
			label: "Master",
			children: [
				{
					key: "sub5-1",
					icon: <DatabaseOutlined />,
					label: <Link to={"/homeadmin/masterbanks"}>Banks</Link>,
				},
				{
					key: "sub5-2",
					icon: <DatabaseOutlined />,
					label: <Link to={"/homeadmin/masteremployees"}>Employees</Link>,
				},
				{
					key: "sub5-2",
					icon: <DatabaseOutlined />,
					label: <Link to={"/homeadmin/masterdesignations"}>Designations</Link>,
				},
			],
		},
		{
			key: "sub3",
			icon: <DeploymentUnitOutlined />,
			label: "Groups",
			children: [
				{
					key: "sub3-1",
					icon: <FileSearchOutlined />,
					label: <Link to={"/homebm/searchgroup/"}>Edit Group</Link>,
				},
				{
					key: "sub3-2",
					icon: <PlusCircleOutlined />,
					label: <Link to={"/homebm/editgroupform/0"}>Add Group</Link>,
				},
				{
					key: "sub3-3",
					icon: <SendOutlined />,
					label: <Link to={"/homebm/trancefercofrom/0"}>Transfer Group</Link>,
				},
				{
					key: "sub3-5",
					icon: <CheckCircleOutlined />,
					label: (
						<Link to={"/homebm/trancefercofromapprove-unic"}>
							Approve Group Transfer
						</Link>
					),
				},
				{
					key: "sub3-4",
					icon: <EyeOutlined />,
					label: <Link to={"/homebm/tranceferco"}>View Group Transfer</Link>,
				},

				//    {
				//      key: "sub3-3",
				//      icon: <SubnodeOutlined />,
				//      label: <Link to={"/homemis/assignmember"}>Assign Member</Link>,
				//    },
			],
		},
		// {
		//   key: "sub2",
		//   icon: <ContainerOutlined />,
		//   label:  "Members",
		//   children: [
		//     {
		//       key: "sub2-1",
		//       icon: <ContainerOutlined />,
		//       label: <Link to={"/homemis/grtappls/"}>Applications</Link>,
		//     },
		//     {
		//       key: "sub2-2",
		//       icon: <SearchOutlined />,
		//       label: <Link to={"/homemis/searchform/"}>Search Form</Link>,
		//     },
		//     // {
		//     //   key: "sub2-4",
		//     //   icon: <FileSearchOutlined />,
		//     //   label: <Link to={"/homemis/searchmember/"}>Search Member</Link>,
		//     // },
		//   ],
		// },
		// {
		//  key: "sub3",
		//  icon: <DeploymentUnitOutlined />,
		//  label: "Groups",
		//  children: [
		//    {
		//      key: "sub3-1",
		//      icon: <FileSearchOutlined />,
		//      label: <Link to={"/homemis/searchgroup/"}>Edit Group</Link>,
		//    },
		//    {
		//      key: "sub3-2",
		//      icon: <PlusCircleOutlined />,
		//      label: <Link to={"/homemis/editgroupform/0"}>Add Group</Link>,
		//    },
		// //     {
		// //       key: "sub3-3",
		// //       icon: <SubnodeOutlined />,
		// //       label: <Link to={"/homemis/assignmember"}>Assign Member</Link>,
		// //     },
		//  ],
		// },
		{
			key: "sub_att",
			icon: <ImportOutlined />,
			label: "Attendance",
			children: [
				{
					key: "sub4-1",
					icon: <UserAddOutlined />,
					label: (
						<Link to={"/homeadmin/attendancedashboard"}>
							Attendance Dashboard
						</Link>
					),
				},
			],
		},
		// {
		//   key: "sub4",
		//   icon: <ThunderboltOutlined />,
		//   label: "Loans",
		//   children: [
		//     {
		//       key: "sub4-1",
		//       icon: <ThunderboltOutlined />,
		//       label: <Link to={"/homebm/disburseloan"}>Disburse Loan</Link>,
		//     },
		//     {
		//       key: "sub4-3",
		//       icon: <EyeOutlined />,
		//       label: <Link to={"/homebm/viewloan"}>View Loan</Link>,
		//     },
		//       {
		//      key: "sub4-2",
		//      icon: <CheckCircleOutlined />,
		//      label: <Link to={"/homebm/approveloan"}>Approve Transaction</Link>,
		//     },
		//   ]
		// },
		{
			key: "sub7",
			icon: <ImportOutlined />,
			label: "User Management",
			children: [
				{
					key: "sub7-1",
					icon: <UserAddOutlined />,
					label: <Link to={"/homeadmin/createuser/0"}>Create User</Link>,
				},
				{
					key: "sub7-2",
					icon: <SettingOutlined />,
					label: <Link to={"/homeadmin/manageuser/"}>Manage User</Link>,
				},
				{
					key: "sub7-3",
					icon: <FastForwardOutlined />,
					label: <Link to={"/homeadmin/transferuser/0"}>Transfer User</Link>,
				},
			],
		},
		{
			label: "Reports",
			key: "sub6",
			icon: <BarsOutlined />,
			children: [
				// {
				//  key: "sub6-1",
				//  icon: <BarChartOutlined />,
				//  label: (
				//    <Link to={"/homebm/memberwiserecoveryreport"}>
				//      Memberwise Recovery
				//    </Link>
				//  ),
				// },
				// {
				//  key: "sub6-2",
				//  icon: <BarChartOutlined />,
				//  label: (
				//    <Link to={"/homebm/groupwiserecoveryreport"}>
				//      Groupwise Recovery
				//    </Link>
				//  ),
				// },
				// {
				//  key: "sub6-3",
				//  icon: <BarChartOutlined />,
				//  label: <Link to={"/homebm/demandreport"}>Demand</Link>,
				// },
				{
					key: "sub6-4",
					icon: <BarChartOutlined />,
					label: <Link to={"/homeadmin/loanstatements"}>Loan Statements</Link>,
				},
				{
					key: "sub6-5",
					icon: <BarChartOutlined />,
					label: <Link to={"/homeadmin/loantxns"}>Loan Transactions</Link>,
				},
				{
					key: "sub6-6",
					icon: <BarChartOutlined />,
					label: <Link to={"/homeadmin/demandreport"}>Demand Report</Link>,
				},
				{
					key: "sub6-7",
					icon: <BarChartOutlined />,
					label: (
						<Link to={"/homeadmin/outstasndingreport"}>Outstanding Report</Link>
					),
				},
				// {
				//  key: "sub6-8",
				//  icon: <BarChartOutlined />,
				//  label: <Link to={"/homebm/summaryreports"}>Summary Reports</Link>,
				//  children: [
				//    {
				//      key: "sub6-8-1",
				//      icon: <BarChartOutlined />,
				//      label: (
				//        <Link to={"/homebm/summaryreports/fundwise"}>
				//          Fundwise Report
				//        </Link>
				//      ),
				//    },
				//    {
				//      key: "sub6-8-2",
				//      icon: <BarChartOutlined />,
				//      label: (
				//        <Link to={"/homebm/summaryreports/schemewise"}>
				//          Schemewise Report
				//        </Link>
				//      ),
				//    },
				//  ],
				// },
				{
					key: "sub6-8",
					icon: <BarChartOutlined />,
					label: <Link to={"/homeadmin/fundwisesummary"}>Fundwise Report</Link>,
				},
				{
					key: "sub6-9",
					icon: <BarChartOutlined />,
					label: (
						<Link to={"/homeadmin/schemewisesummary"}>Schemewise Report</Link>
					),
				},
				{
					key: "sub6-10",
					icon: <BarChartOutlined />,
					label: (
						<Link to={"/homeadmin/demandvscollectionreport"}>
							Demand vs. Collection
						</Link>
					),
				},
				// {
				//   key: "sub6-10",
				//   icon: <BarChartOutlined />,
				//   label: (
				//     <Link to={"/homebm/groupclosereport"}>Group Close</Link>
				//   ),
				// },
			],
		},
	]

	const items_user_type_11 = [
		{
			key: "sub1",
			icon: <LineChartOutlined />,
			label: <Link to={"/homeadmin/"}>Dashboard</Link>,
		},
		{
			key: "sub5",
			icon: <DatabaseOutlined />,
			label: "Master",
			children: [
				{
					key: "sub5-1",
					icon: <DatabaseOutlined />,
					label: <Link to={"/homeadmin/masterbanks"}>Banks</Link>,
				},
				{
					key: "sub5-2",
					icon: <DatabaseOutlined />,
					label: <Link to={"/homeadmin/masteremployees"}>Employees</Link>,
				},
				{
					key: "sub5-2",
					icon: <DatabaseOutlined />,
					label: <Link to={"/homeadmin/masterdesignations"}>Designations</Link>,
				},
			],
		},
		{
			key: "sub3",
			icon: <DeploymentUnitOutlined />,
			label: "Groups",
			children: [
				{
					key: "sub3-1",
					icon: <FileSearchOutlined />,
					label: <Link to={"/homebm/searchgroup/"}>Edit Group</Link>,
				},
				{
					key: "sub3-2",
					icon: <PlusCircleOutlined />,
					label: <Link to={"/homebm/editgroupform/0"}>Add Group</Link>,
				},
				{
					key: "sub3-3",
					icon: <SendOutlined />,
					label: <Link to={"/homebm/trancefercofrom/0"}>Transfer Group</Link>,
				},
				// {
				//   key: "sub3-5",
				//   icon: <CheckCircleOutlined />,
				//   label: <Link to={"/homebm/trancefercofromapprove-unic"}>Approve Group Transfer</Link>,
				// },
				{
					key: "sub3-4",
					icon: <EyeOutlined />,
					label: <Link to={"/homebm/tranceferco"}>View Group Transfer</Link>,
				},

				//    {
				//      key: "sub3-3",
				//      icon: <SubnodeOutlined />,
				//      label: <Link to={"/homemis/assignmember"}>Assign Member</Link>,
				//    },
			],
		},
		// {
		//   key: "sub2",
		//   icon: <ContainerOutlined />,
		//   label:  "Members",
		//   children: [
		//     {
		//       key: "sub2-1",
		//       icon: <ContainerOutlined />,
		//       label: <Link to={"/homemis/grtappls/"}>Applications</Link>,
		//     },
		//     {
		//       key: "sub2-2",
		//       icon: <SearchOutlined />,
		//       label: <Link to={"/homemis/searchform/"}>Search Form</Link>,
		//     },
		//     // {
		//     //   key: "sub2-4",
		//     //   icon: <FileSearchOutlined />,
		//     //   label: <Link to={"/homemis/searchmember/"}>Search Member</Link>,
		//     // },
		//   ],
		// },
		// {
		//  key: "sub3",
		//  icon: <DeploymentUnitOutlined />,
		//  label: "Groups",
		//  children: [
		//    {
		//      key: "sub3-1",
		//      icon: <FileSearchOutlined />,
		//      label: <Link to={"/homemis/searchgroup/"}>Edit Group</Link>,
		//    },
		//    {
		//      key: "sub3-2",
		//      icon: <PlusCircleOutlined />,
		//      label: <Link to={"/homemis/editgroupform/0"}>Add Group</Link>,
		//    },
		// //     {
		// //       key: "sub3-3",
		// //       icon: <SubnodeOutlined />,
		// //       label: <Link to={"/homemis/assignmember"}>Assign Member</Link>,
		// //     },
		//  ],
		// },
		{
			key: "sub_att",
			icon: <ImportOutlined />,
			label: "Attendance",
			children: [
				{
					key: "sub4-1",
					icon: <UserAddOutlined />,
					label: (
						<Link to={"/homeadmin/attendancedashboard"}>
							Attendance Dashboard
						</Link>
					),
				},
			],
		},
		// {
		//   key: "sub4",
		//   icon: <ThunderboltOutlined />,
		//   label: "Loans",
		//   children: [
		//     {
		//       key: "sub4-1",
		//       icon: <ThunderboltOutlined />,
		//       label: <Link to={"/homebm/disburseloan"}>Disburse Loan</Link>,
		//     },
		//     {
		//       key: "sub4-3",
		//       icon: <EyeOutlined />,
		//       label: <Link to={"/homebm/viewloan"}>View Loan</Link>,
		//     },
		//       {
		//      key: "sub4-2",
		//      icon: <CheckCircleOutlined />,
		//      label: <Link to={"/homebm/approveloan"}>Approve Transaction</Link>,
		//     },
		//   ]
		// },
		{
			key: "sub7",
			icon: <ImportOutlined />,
			label: "User Management",
			children: [
				{
					key: "sub7-1",
					icon: <UserAddOutlined />,
					label: <Link to={"/homeadmin/createuser/0"}>Create User</Link>,
				},
				{
					key: "sub7-2",
					icon: <SettingOutlined />,
					label: <Link to={"/homeadmin/manageuser/"}>Manage User</Link>,
				},
				{
					key: "sub7-3",
					icon: <FastForwardOutlined />,
					label: <Link to={"/homeadmin/transferuser/0"}>Transfer User</Link>,
				},
			],
		},
		{
			label: "Reports",
			key: "sub6",
			icon: <BarsOutlined />,
			children: [
				// {
				//  key: "sub6-1",
				//  icon: <BarChartOutlined />,
				//  label: (
				//    <Link to={"/homebm/memberwiserecoveryreport"}>
				//      Memberwise Recovery
				//    </Link>
				//  ),
				// },
				// {
				//  key: "sub6-2",
				//  icon: <BarChartOutlined />,
				//  label: (
				//    <Link to={"/homebm/groupwiserecoveryreport"}>
				//      Groupwise Recovery
				//    </Link>
				//  ),
				// },
				// {
				//  key: "sub6-3",
				//  icon: <BarChartOutlined />,
				//  label: <Link to={"/homebm/demandreport"}>Demand</Link>,
				// },
				{
					key: "sub6-4",
					icon: <BarChartOutlined />,
					label: <Link to={"/homeadmin/loanstatements"}>Loan Statements</Link>,
				},
				{
					key: "sub6-5",
					icon: <BarChartOutlined />,
					label: <Link to={"/homeadmin/loantxns"}>Loan Transactions</Link>,
				},
				{
					key: "sub6-6",
					icon: <BarChartOutlined />,
					label: <Link to={"/homeadmin/demandreport"}>Demand Report</Link>,
				},
				{
					key: "sub6-7",
					icon: <BarChartOutlined />,
					label: (
						<Link to={"/homeadmin/outstasndingreport"}>Outstanding Report</Link>
					),
				},
				// {
				//  key: "sub6-8",
				//  icon: <BarChartOutlined />,
				//  label: <Link to={"/homebm/summaryreports"}>Summary Reports</Link>,
				//  children: [
				//    {
				//      key: "sub6-8-1",
				//      icon: <BarChartOutlined />,
				//      label: (
				//        <Link to={"/homebm/summaryreports/fundwise"}>
				//          Fundwise Report
				//        </Link>
				//      ),
				//    },
				//    {
				//      key: "sub6-8-2",
				//      icon: <BarChartOutlined />,
				//      label: (
				//        <Link to={"/homebm/summaryreports/schemewise"}>
				//          Schemewise Report
				//        </Link>
				//      ),
				//    },
				//  ],
				// },
				{
					key: "sub6-8",
					icon: <BarChartOutlined />,
					label: <Link to={"/homeadmin/fundwisesummary"}>Fundwise Report</Link>,
				},
				{
					key: "sub6-9",
					icon: <BarChartOutlined />,
					label: (
						<Link to={"/homeadmin/schemewisesummary"}>Schemewise Report</Link>
					),
				},
				{
					key: "sub6-10",
					icon: <BarChartOutlined />,
					label: (
						<Link to={"/homeadmin/demandvscollectionreport"}>
							Demand vs. Collection
						</Link>
					),
				},
				// {
				//   key: "sub6-10",
				//   icon: <BarChartOutlined />,
				//   label: (
				//     <Link to={"/homebm/groupclosereport"}>Group Close</Link>
				//   ),
				// },
			],
		},
	]

	const items_user_type_3 = [
		{
			key: "sub1",
			icon: <LineChartOutlined />,
			label: <Link to={"/homemis/"}>Dashboard</Link>,
		},

		{
			key: "sub_att",
			icon: <ImportOutlined />,
			label: "Attendance",
			children: [
				{
					key: "sub4-1",
					icon: <UserAddOutlined />,
					label: <Link to={"/homebm/attendancebm"}>Attendance Dashboard</Link>,
				},
			],
		},

		{
			label: "Reports",
			key: "sub6",
			icon: <BarsOutlined />,
			children: [
				// {
				//  key: "sub6-1",
				//  icon: <BarChartOutlined />,
				//  label: (
				//    <Link to={"/homebm/memberwiserecoveryreport"}>
				//      Memberwise Recovery
				//    </Link>
				//  ),
				// },
				// {
				//  key: "sub6-2",
				//  icon: <BarChartOutlined />,
				//  label: (
				//    <Link to={"/homebm/groupwiserecoveryreport"}>
				//      Groupwise Recovery
				//    </Link>
				//  ),
				// },
				// {
				//  key: "sub6-3",
				//  icon: <BarChartOutlined />,
				//  label: <Link to={"/homebm/demandreport"}>Demand</Link>,
				// },
				{
					key: "sub6-4",
					icon: <BarChartOutlined />,
					label: <Link to={"/homebm/loanstatements"}>Loan Statements</Link>,
				},
				{
					key: "sub6-5",
					icon: <BarChartOutlined />,
					label: <Link to={"/homebm/loantxns"}>Loan Transactions</Link>,
				},
				{
					key: "sub6-6",
					icon: <BarChartOutlined />,
					label: <Link to={"/homebm/demandreport"}>Demand Report</Link>,
				},
				{
					key: "sub6-7",
					icon: <BarChartOutlined />,
					label: (
						<Link to={"/homebm/outstasndingreport"}>Outstanding Report</Link>
					),
				},
				// {
				//  key: "sub6-8",
				//  icon: <BarChartOutlined />,
				//  label: <Link to={"/homebm/summaryreports"}>Summary Reports</Link>,
				//  children: [
				//    {
				//      key: "sub6-8-1",
				//      icon: <BarChartOutlined />,
				//      label: (
				//        <Link to={"/homebm/summaryreports/fundwise"}>
				//          Fundwise Report
				//        </Link>
				//      ),
				//    },
				//    {
				//      key: "sub6-8-2",
				//      icon: <BarChartOutlined />,
				//      label: (
				//        <Link to={"/homebm/summaryreports/schemewise"}>
				//          Schemewise Report
				//        </Link>
				//      ),
				//    },
				//  ],
				// },
				{
					key: "sub6-8",
					icon: <BarChartOutlined />,
					label: <Link to={"/homebm/fundwisesummary"}>Fundwise Report</Link>,
				},
				{
					key: "sub6-9",
					icon: <BarChartOutlined />,
					label: (
						<Link to={"/homebm/schemewisesummary"}>Schemewise Report</Link>
					),
				},
				{
					key: "sub6-10",
					icon: <BarChartOutlined />,
					label: (
						<Link to={"/homebm/demandvscollectionreport"}>
							Demand vs. Collection
						</Link>
					),
				},
				// {
				//   key: "sub6-10",
				//   icon: <BarChartOutlined />,
				//   label: (
				//     <Link to={"/homebm/groupclosereport"}>Group Close</Link>
				//   ),
				// },
			],
		},
	]

	const itemsBM = [
		{
			key: "sub1",
			icon: <LineChartOutlined />,
			label: <Link to={"/homebm/"}>Dashboard</Link>,
		},
		// {
		//  key: "sub5",
		//  icon: <DatabaseOutlined />,
		//  label: "Master",
		//  children: [
		//    {
		//      key: "sub5-1",
		//      icon: <DatabaseOutlined />,
		//      label: <Link to={"/homebm/masterbanks"}>Banks</Link>,
		//    },
		//    {
		//      key: "sub5-2",
		//      icon: <DatabaseOutlined />,
		//      label: <Link to={"/homebm/masteremployees"}>Employees</Link>,
		//    },
		//    // {
		//    //  key: "sub4-2",
		//    //  icon: <CheckCircleOutlined />,
		//    //  label: (
		//    //    <Link to={"/homebm/disburseloanapprove"}>Disbursement Approve</Link>
		//    //  ),
		//    // },
		//    // {
		//    //  key: "sub3-3",
		//    //  icon: <SubnodeOutlined />,
		//    //  label: <Link to={"/homebm/assignmember"}>Assign Member</Link>,
		//    // },
		//  ],
		// },
		{
			key: "sub2",
			icon: <ImportOutlined />,
			label: "GRT",
			children: [
				{
					key: "sub2-1",
					icon: <ContainerOutlined />,
					label: <Link to={"/homebm/grtappls/"}>Applications</Link>,
				},
				{
					key: "sub2-2",
					icon: <SearchOutlined />,
					label: <Link to={"/homebm/searchform/"}>Search Form</Link>,
				},
				// {
				//  key: "sub2-3",
				//  icon: <FileSearchOutlined />,
				//  label: <Link to={"/homebm/searchgroup/"}>Edit Group</Link>,
				// },
			],
		},

		{
			key: "sub3",
			icon: <DeploymentUnitOutlined />,
			label: "Groups",
			children: [
				{
					key: "sub3-1",
					icon: <FileSearchOutlined />,
					label: <Link to={"/homebm/searchgroup/"}>Edit Group</Link>,
				},
				{
					key: "sub3-2",
					icon: <PlusCircleOutlined />,
					label: <Link to={"/homebm/editgroupform/0"}>Add Group</Link>,
				},
				// {
				//  key: "sub3-3",
				//  icon: <SubnodeOutlined />,
				//  label: <Link to={"/homebm/assignmember"}>Assign Member</Link>,
				// },
			],
		},
		{
			key: "sub_att",
			icon: <ImportOutlined />,
			label: "Attendance",
			children: [
				{
					key: "sub4-1",
					icon: <UserAddOutlined />,
					label: <Link to={"/homebm/attendancebm"}>Attendance Dashboard</Link>,
				},
			],
		},
		{
			key: "sub4",
			icon: <ThunderboltOutlined />,
			label: "Loans",
			children: [
				{
					key: "sub4-1",
					icon: <ThunderboltOutlined />,
					label: <Link to={"/homebm/disburseloan"}>Disburse Loan</Link>,
				},
				// {
				//  key: "sub4-2",
				//  icon: <CheckCircleOutlined />,
				//  label: <Link to={"/homebm/approveloan"}>Approve Transaction</Link>,
				// },
				{
					key: "sub4-2",
					icon: <CheckCircleOutlined />,
					label: "Approve Transaction",
					children: [
						{
							key: "sub4-2-1",
							icon: <CheckCircleOutlined />,
							label: <Link to={"/homebm/approvedisbursed"}>Disburse</Link>,
						},
						{
							key: "sub4-2-2",
							icon: <CheckCircleOutlined />,
							label: <Link to={"/homebm/approveloan"}>Recovery</Link>,
						},
					],
				},
				{
					key: "sub4-3",
					icon: <EyeOutlined />,
					label: <Link to={"/homebm/viewloan"}>View Loan</Link>,
				},
				// {
				//  key: "sub3-3",
				//  icon: <SubnodeOutlined />,
				//  label: <Link to={"/homebm/assignmember"}>Assign Member</Link>,
				// },
			],
		},
		// {
		//  key: "sub2",
		//  icon: <ImportOutlined />,
		//  label: <Link to={"/homebm/grtappls/"}>GRT Applications</Link>,
		// },
		// reports to be enabled later

		{
			label: "Reports",
			key: "sub6",
			icon: <BarsOutlined />,
			children: [
				// {
				//  key: "sub6-1",
				//  icon: <BarChartOutlined />,
				//  label: (
				//    <Link to={"/homebm/memberwiserecoveryreport"}>
				//      Memberwise Recovery
				//    </Link>
				//  ),
				// },
				// {
				//  key: "sub6-2",
				//  icon: <BarChartOutlined />,
				//  label: (
				//    <Link to={"/homebm/groupwiserecoveryreport"}>
				//      Groupwise Recovery
				//    </Link>
				//  ),
				// },
				// {
				//  key: "sub6-3",
				//  icon: <BarChartOutlined />,
				//  label: <Link to={"/homebm/demandreport"}>Demand</Link>,
				// },
				{
					key: "sub6-4",
					icon: <BarChartOutlined />,
					label: <Link to={"/homebm/loanstatements"}>Loan Statements</Link>,
				},
				{
					key: "sub6-5",
					icon: <BarChartOutlined />,
					label: <Link to={"/homebm/loantxns"}>Loan Transactions</Link>,
				},
				{
					key: "sub6-6",
					icon: <BarChartOutlined />,
					label: <Link to={"/homebm/demandreport"}>Demand Report</Link>,
				},
				{
					key: "sub6-7",
					icon: <BarChartOutlined />,
					label: (
						<Link to={"/homebm/outstasndingreport"}>Outstanding Report</Link>
					),
				},
				// {
				//  key: "sub6-8",
				//  icon: <BarChartOutlined />,
				//  label: <Link to={"/homebm/summaryreports"}>Summary Reports</Link>,
				//  children: [
				//    {
				//      key: "sub6-8-1",
				//      icon: <BarChartOutlined />,
				//      label: (
				//        <Link to={"/homebm/summaryreports/fundwise"}>
				//          Fundwise Report
				//        </Link>
				//      ),
				//    },
				//    {
				//      key: "sub6-8-2",
				//      icon: <BarChartOutlined />,
				//      label: (
				//        <Link to={"/homebm/summaryreports/schemewise"}>
				//          Schemewise Report
				//        </Link>
				//      ),
				//    },
				//  ],
				// },
				{
					key: "sub6-8",
					icon: <BarChartOutlined />,
					label: <Link to={"/homebm/fundwisesummary"}>Fundwise Report</Link>,
				},
				{
					key: "sub6-9",
					icon: <BarChartOutlined />,
					label: (
						<Link to={"/homebm/schemewisesummary"}>Schemewise Report</Link>
					),
				},
				{
					key: "sub6-10",
					icon: <BarChartOutlined />,
					label: (
						<Link to={"/homebm/demandvscollectionreport"}>
							Demand vs. Collection
						</Link>
					),
				},
				{
					key: "sub6-10",
					icon: <BarChartOutlined />,
					label: <Link to={"/homebm/groupclosereport"}>Group Close</Link>,
				},
			],
		},
		{
			/* ===========================to be enabled================= */
		},
	]

	const itemsCO = [
		{
			key: "sub1",
			icon: <LineChartOutlined />,
			label: <Link to={"/homeco/"}>Dashboard</Link>,
		},
		{
			key: "sub2",
			icon: <ImportOutlined />,
			label: "GRT",
			children: [
				{
					key: "sub2-1",
					icon: <ContainerOutlined />,
					label: <Link to={"/homebm/grtappls/"}>Applications</Link>,
				},
				{
					key: "sub2-2",
					icon: <SearchOutlined />,
					label: <Link to={"/homeco/searchform/"}>Search Form</Link>,
				},
				// {
				//  key: "sub2-3",
				//  icon: <FileSearchOutlined />,
				//  label: <Link to={"/homeco/searchgroup/"}>Edit Group</Link>,
				// },
			],
		},

		{
			key: "sub3",
			icon: <DeploymentUnitOutlined />,
			label: "Groups",
			children: [
				{
					key: "sub3-1",
					icon: <FileSearchOutlined />,
					label: <Link to={"/homebm/searchgroup/"}>Edit Group</Link>,
				},
				{
					key: "sub3-2",
					icon: <PlusCircleOutlined />,
					label: <Link to={"/homebm/editgroupform/0"}>Add Group</Link>,
				},
				// {
				//  key: "sub3-3",
				//  icon: <SubnodeOutlined />,
				//  label: <Link to={"/homeco/assignmember"}>Assign Member</Link>,
				// },
			],
		},

		{
			key: "sub4",
			icon: <ThunderboltOutlined />,
			label: "Loans",
			children: [
				{
					key: "sub4-1",
					icon: <ThunderboltOutlined />,
					label: <Link to={"/homeco/disburseloan"}>Disburse Loan</Link>,
				},
				// {
				//  key: "sub4-2",
				//  icon: <CheckCircleOutlined />,
				//  label: (
				//    <Link to={"/homeco/editgroupform/0"}>Disbursement Approve</Link>
				//  ),
				// },
				// {
				//  key: "sub3-3",
				//  icon: <SubnodeOutlined />,
				//  label: <Link to={"/homebm/assignmember"}>Assign Member</Link>,
				// },
			],
		},
		// {
		//  key: "sub2",
		//  icon: <ImportOutlined />,
		//  label: <Link to={"/homebm/grtappls/"}>GRT Applications</Link>,
		// },
		{
			label: "Reports",
			key: "sub6",
			icon: <BarsOutlined />,
		},
	]

	const itemsAdmin = [
		{
			key: "sub1",
			icon: <LineChartOutlined />,
			label: <Link to={"/homeadmin/"}>Dashboard</Link>,
		},
		{
			key: "sub5",
			icon: <DatabaseOutlined />,
			label: "Master",
			children: [
				{
					key: "sub5-1",
					icon: <DatabaseOutlined />,
					label: <Link to={"/homeadmin/masterbanks"}>Banks</Link>,
				},
				{
					key: "sub5-2",
					icon: <DatabaseOutlined />,
					label: <Link to={"/homeadmin/masteremployees"}>Employees</Link>,
				},
				{
					key: "sub5-3",
					icon: <DatabaseOutlined />,
					label: <Link to={"/homeadmin/masterdesignations"}>Designations</Link>,
				},
			],
		},
		{
			key: "sub2",
			icon: <ImportOutlined />,
			label: "User Management",
			children: [
				{
					key: "sub2-1",
					icon: <UserAddOutlined />,
					label: <Link to={"/homeadmin/createuser/0"}>Create User</Link>,
				},
				{
					key: "sub2-2",
					icon: <SettingOutlined />,
					label: <Link to={"/homeadmin/manageuser/"}>Manage User</Link>,
				},
				{
					key: "sub2-3",
					icon: <FastForwardOutlined />,
					label: <Link to={"/homeadmin/transferuser/0"}>Transfer User</Link>,
				},
			],
		},
		{
			key: "sub4",
			icon: <ImportOutlined />,
			label: "Attendance",
			children: [
				{
					key: "sub4-1",
					icon: <UserAddOutlined />,
					label: (
						<Link to={"/homeadmin/attendancedashboard"}>
							Attendance Dashboard
						</Link>
					),
				},
			],
		},
		{
			label: "Reports",
			key: "sub3",
			icon: <BarsOutlined />,
			children: [
				{
					key: "sub3-4",
					icon: <BarChartOutlined />,
					label: <Link to={"/homeadmin/loanstatements"}>Loan Statements</Link>,
				},
				{
					key: "sub3-5",
					icon: <BarChartOutlined />,
					label: <Link to={"/homeadmin/loantxns"}>Loan Transactions</Link>,
				},
				{
					key: "sub3-6",
					icon: <BarChartOutlined />,
					label: <Link to={"/homeadmin/demandreport"}>Demand Report</Link>,
				},
				{
					key: "sub3-7",
					icon: <BarChartOutlined />,
					label: (
						<Link to={"/homeadmin/outstasndingreport"}>Outstanding Report</Link>
					),
				},
				// {
				//  key: "sub3-8",
				//  icon: <BarChartOutlined />,
				//  label: <Link to={"/homeadmin/summaryreports"}>Summary Reports</Link>,
				//  children: [
				//    {
				//      key: "sub3-8-1",
				//      icon: <BarChartOutlined />,
				//      label: (
				//        <Link to={"/homeadmin/summaryreports/fundwise"}>
				//          Fundwise Report
				//        </Link>
				//      ),
				//    },
				//    {
				//      key: "sub3-8-2",
				//      icon: <BarChartOutlined />,
				//      label: (
				//        <Link to={"/homeadmin/summaryreports/schemewise"}>
				//          Schemewise Report
				//        </Link>
				//      ),
				//    },
				//  ],
				// },
				{
					key: "sub3-8",
					icon: <BarChartOutlined />,
					label: <Link to={"/homeadmin/fundwisesummary"}>Fundwise Report</Link>,
				},
				{
					key: "sub3-9",
					icon: <BarChartOutlined />,
					label: (
						<Link to={"/homeadmin/schemewisesummary"}>Schemewise Report</Link>
					),
				},
				{
					key: "sub3-10",
					icon: <BarChartOutlined />,
					label: (
						<Link to={"/homeadmin/demandvscollectionreport"}>
							Demand vs. Collection
						</Link>
					),
				},
			],
		},
	]

	const menuItems_PendingSSVWS = [
		// ⭐ Add your submenu here
		{
			key: "sub1",
			icon: <LineChartOutlined />,
			label: <Link to={"/homebm/"}>Dashboard</Link>,
			// hidden: false,
			children: [],
		},
		{
			key: "sub7-6",
			// icon: <TableOutlined />,
			label: <Link to={"/homeadmin/monthopen"}>Day Open</Link>,
			// hidden: data?.transfer_user == "Y" ? false : true,
		}

	];


	const items_bdccb_Supper_User = [
		{
			key: "sub1",
			icon: <LineChartOutlined />,
			label: <Link to={"/homebm/"}>Dashboard</Link>,
		},
		// {
		// 	key: "sub6",
		// 	icon: <ImportOutlined />,
		// 	label: "User Management",
		// 	// hidden: data?.user_management == "Y" ? false : true,
		// 	children: [
		// 		// {
		// 		// 	key: "sub7-1",
		// 		// 	icon: <UserAddOutlined />,
		// 		// 	label: <Link to={"/homeadmin/createuser/0"}>Create User</Link>,
		// 		// 	// hidden: data?.create_user == "Y" ? false : true,
		// 		// },
		// 		{
		// 			key: "sub6-1",
		// 			icon: <SettingOutlined />,
		// 			label: <Link to={"/homebm/manageuser/"}>Manage User</Link>,
		// 			// hidden: data?.manage_user == "Y" ? false : true,
		// 		},
		// 		{
		// 			key: "sub7-3",
		// 			icon: <SettingOutlined />,
		// 			label: <Link to={"#"}>Group</Link>,
		// 		},
		// 	],
		// },
		{
			key: "sub2",
			icon: <DatabaseOutlined />,
			label: "Master",
			children: [
				// {
				// 	key: "sub2-1",
				// 	icon: <DatabaseOutlined />,
				// 	label: <Link to={"/homeadmin/masterdistricts"}>District</Link>,
				// },
				{
					key: "sub2-2",
					icon: <DatabaseOutlined />,
					label: <Link to={"/homeadmin/masterblocks"}>Blocks</Link>,
				},
				{
					key: "sub2-3",
					icon: <DatabaseOutlined />,
					label: <Link to={"/homeadmin/postMaster"}>Post Office Master</Link>,
				},
				{
					key: "sub2-4",
					icon: <DatabaseOutlined />,
					label: <Link to={"/homeadmin/policeStationMaster"}>Police Station Master</Link>,
				},
				{
					key: "sub2-5",
					icon: <DatabaseOutlined />,
					label: <Link to={"/homeadmin/gplistMaster"}>GP List Master</Link>,
				},
				{
					key: "sub2-6",
					icon: <DatabaseOutlined />,
					label: <Link to={"/homeadmin/villageMaster"}>Village Master</Link>,
				},
				{
					key: "sub2-7",
					icon: <DatabaseOutlined />,
					label: <Link to={"/homeadmin/branchMaster"}>Branch Master</Link>,
				},
			],
		},

		{
			key: "sub4",
			icon: <ThunderboltOutlined />,
			label: "Loans",
			children: [
				{
					key: "sub4-1",
					icon: <CheckCircleOutlined />,
					label: "Disbursement",
					children: [
						{
							key: "sub4-1-1",
							icon: <CheckCircleOutlined />,
							label: <Link to={"/homepacs/disburseloan"}>Society</Link>,
						},

						{
							key: "sub4-1-2",
							icon: <CheckCircleOutlined />,
							label: <Link to={"/homebm/disburseloan"}>SHG</Link>,
						},
					],
				},

				{
					key: "sub4-2",
					icon: <CheckCircleOutlined />,
					label: "Recovery",
					children: [
						{
							key: "sub4-2-1",
							icon: <CheckCircleOutlined />,
							label: <Link to={"/homebm/loan-recovery-society-list"}>Society</Link>,
						},
						{
							key: "sub4-2-2",
							icon: <CheckCircleOutlined />,
							label: <Link to={"/homebm/loan-recovery-shg-list"}>SHG</Link>,
						},
						{
							key: "sub4-2-3",
							icon: <CheckCircleOutlined />,
							label: <Link to={"/homebm/loan-recovery-group-list"}>Group</Link>,
						},
					],
				},

				// {
				// 	key: "sub4-3",
				// 	icon: <CheckCircleOutlined />,
				// 	label: "Approve",
				// 	children: [
				// 		{
				// 			key: "sub4-3-1",
				// 			icon: <CheckCircleOutlined />,
				// 			label: <Link to={"/homebm/viewloan_branch"}>Disbursement SHG</Link>,
				// 		},
				// 		{
				// 			key: "sub4-3-2",
				// 			icon: <CheckCircleOutlined />,
				// 			label: <Link to={"/homebm/recovery-shg-list"}>Recovery SHG</Link>,
				// 		},
				// 		{
				// 			key: "sub4-3-3",
				// 			icon: <CheckCircleOutlined />,
				// 			label: <Link to={"/homebm/recovery-society-list"}>Recovery Society</Link>,
				// 		}
				// 	],
				// },

				{
					key: "sub4-4",
					icon: <CheckCircleOutlined />,
					label: <Link to={"/homepacs/viewloan-branch-shg"}>View Loan</Link>,
				},

			],
		},

		// {
		// 	key: "sub5",
		// 	icon: <DatabaseOutlined />,
		// 	label: "Re-Finace",
		// 	children: [
		// 		// {
		// 		// 	key: "sub5-1",
		// 		// 	icon: <CheckCircleOutlined />,
		// 		// 	label: <Link to={"/homepacs/refinace"}>Disbursement Re-Finace</Link>,
		// 		// 	// hidden: data?.approve_transaction == "Y" ? false : true,
		// 		// },
		// 		{
		// 			key: "sub5-2",
		// 			icon: <CheckCircleOutlined />,
		// 			label: <Link to={"/homebm/branch_refinace-approve-list"}>Approve Re-Finace</Link>,
		// 			// hidden: data?.approve_transaction == "Y" ? false : true,
		// 		},



		// 	],
		// },
		{
			key: "sub6",
			icon: <ThunderboltOutlined />,
			label: "Deposit",
			children: [
				{
					key: "sub6-1",
					icon: <ThunderboltOutlined />,
					label: <Link to={"/homebm/deposit"}>Transaction</Link>,
				},
				{
					key: "sub6-2",
					icon: <ThunderboltOutlined />,
					label: <Link to={"/homebm/deposit-approve"}>Approve</Link>,
				},
				{
					key: "sub6-3",
					icon: <ThunderboltOutlined />,
					label: <Link to={"/homebm/view-sb-ledger"}>SB A/C Ledger</Link>,
				}
			],
		},

	]

	const items_bdccb = [
		{
			key: "sub1",
			icon: <LineChartOutlined />,
			label: <Link to={"/homebm/"}>Dashboard</Link>,
		},
		{
			key: "sub7",
			icon: <ImportOutlined />,
			label: "User Management",
			// hidden: data?.user_management == "Y" ? false : true,
			children: [
				// {
				// 	key: "sub7-1",
				// 	icon: <UserAddOutlined />,
				// 	label: <Link to={"/homeadmin/createuser/0"}>Create User</Link>,
				// 	// hidden: data?.create_user == "Y" ? false : true,
				// },
				{
					key: "sub7-1",
					icon: <SettingOutlined />,
					label: <Link to={"/homebm/manageuser/"}>Manage User</Link>,
					// hidden: data?.manage_user == "Y" ? false : true,
				},

			],
		},

		// {
		// 	key: "sub2",
		// 	icon: <DatabaseOutlined />,
		// 	label: "Master",
		// 	children: [
		// 		{
		// 			key: "sub2-1",
		// 			icon: <DatabaseOutlined />,
		// 			label: <Link to={"/homeadmin/masterdistricts"}>District</Link>,
		// 		},
		// 		{
		// 			key: "sub2-2",
		// 			icon: <DatabaseOutlined />,
		// 			label: <Link to={"/homeadmin/masterblocks"}>Blocks</Link>,
		// 		},
		// 		{
		// 			key: "sub2-3",
		// 			icon: <DatabaseOutlined />,
		// 			label: <Link to={"/homeadmin/postMaster"}>Post Office Master</Link>,
		// 		},
		// 		{
		// 			key: "sub2-4",
		// 			icon: <DatabaseOutlined />,
		// 			label: <Link to={"/homeadmin/policeStationMaster"}>Police Station Master</Link>,
		// 		},
		// 		{
		// 			key: "sub2-5",
		// 			icon: <DatabaseOutlined />,
		// 			label: <Link to={"/homeadmin/gplistMaster"}>GP List Master</Link>,
		// 		},
		// 		{
		// 			key: "sub2-6",
		// 			icon: <DatabaseOutlined />,
		// 			label: <Link to={"/homeadmin/villageMaster"}>Village Master</Link>,
		// 		},
		// 		{
		// 			key: "sub2-7",
		// 			icon: <DatabaseOutlined />,
		// 			label: <Link to={"/homeadmin/branchMaster"}>Branch Master</Link>,
		// 		},
		// 	],
		// },

		{
			key: "sub3",
			icon: <DeploymentUnitOutlined />,
			label: "Groups",
			children: [
				{
					key: "sub3-1",
					icon: <PlusCircleOutlined />,
					label: <Link to={"/homebm/editSahayikaFormBM/0"}>Add Sahayika</Link>,
				},
				{
					key: "sub3-2",
					icon: <FileSearchOutlined />,
					label: <Link to={"/homebm/searchSahayikaBM/"}>Edit Sahayika</Link>,
				},

				// {
				// 	key: "sub3-4",
				// 	icon: <FileSearchOutlined />,
				// 	label: <Link to={"/homebm/searchmember/"}>Edit Member</Link>,
				// },
				{
					key: "sub3-3",
					icon: <PlusCircleOutlined />,
					label: <Link to={"/homebm/addgroupform/0"}>Add Group</Link>,
				},
				{
					key: "sub3-4",
					icon: <FileSearchOutlined />,
					label: <Link to={"/homebm/searchgroup/"}>Edit Group</Link>,
				},
				{
					key: "sub3-5",
					icon: <PlusCircleOutlined />,
					label: <Link to={"/homebm/addmemberform/0"}>Add Member</Link>,
				},
				{
					key: "sub3-6",
					icon: <PlusCircleOutlined />,
					label: <Link to={"/homebm/searchmember"}>Edit Member</Link>,
				},
			],
		},

		{
			key: "sub4",
			icon: <ThunderboltOutlined />,
			label: "Loans",
			children: [
				{
					key: "sub4-1",
					icon: <CheckCircleOutlined />,
					label: "Disbursement",
					children: [
						{
							key: "sub4-1-1",
							icon: <CheckCircleOutlined />,
							label: <Link to={"/homepacs/disburseloan"}>Society</Link>,
							// hidden: data?.approve_transaction == "Y" ? false : true,
						},

						{
							key: "sub4-1-2",
							icon: <CheckCircleOutlined />,
							label: <Link to={"/homebm/disburseloan"}>SHG</Link>,
							// hidden: data?.approve_transaction == "Y" ? false : true,
						},
					],
				},

				{
					key: "sub4-2",
					icon: <CheckCircleOutlined />,
					label: "Recovery",
					children: [
						// {
						// 	key: "sub4-2-1",
						// 	icon: <CheckCircleOutlined />,
						// 	label: <Link to={"/homebm/loan_branch_soi-recovery"}>Society</Link>,
						// 	// hidden: data?.approve_transaction == "Y" ? false : true,
						// },
						{
							key: "sub4-2-1",
							icon: <CheckCircleOutlined />,
							label: <Link to={"/homebm/loan-recovery-society-list"}>Society</Link>,
							// hidden: data?.approve_transaction == "Y" ? false : true,
						},
						{
							key: "sub4-2-2",
							icon: <CheckCircleOutlined />,
							label: <Link to={"/homebm/loan-recovery-shg-list"}>SHG</Link>,
							// hidden: data?.approve_transaction == "Y" ? false : true,
						},
						{
							key: "sub4-2-3",
							icon: <CheckCircleOutlined />,
							label: <Link to={"/homebm/loan-recovery-group-list"}>Group</Link>,
							// hidden: data?.approve_transaction == "Y" ? false : true,
						},
					],
				},
				{
					key: "sub4-3",
					icon: <CheckCircleOutlined />,
					label: "Approve",
					children: [
						{
							key: "sub4-3-1",
							icon: <CheckCircleOutlined />,
							label: <Link to={"/homebm/viewloan_branch"}>Disbursement SHG</Link>,
							// hidden: data?.approve_transaction == "Y" ? false : true,
						},
						{
							key: "sub4-3-2",
							icon: <CheckCircleOutlined />,
							label: <Link to={"/homebm/recovery-shg-list"}>Recovery SHG</Link>,
							// hidden: data?.approve_transaction == "Y" ? false : true,
						},
						{
							key: "sub4-3-3",
							icon: <CheckCircleOutlined />,
							label: <Link to={"/homebm/recovery-society-list"}>Recovery Society</Link>,
							// hidden: data?.approve_transaction == "Y" ? false : true,
						}
						// {
						// 	key: "sub4-2-3",
						// 	icon: <CheckCircleOutlined />,
						// 	label: <Link to={"/homepacs/viewloan"}>SHG</Link>,
						// 	// hidden: data?.approve_transaction == "Y" ? false : true,
						// }
					],
				},

				{
					key: "sub4-4",
					icon: <CheckCircleOutlined />,
					label: <Link to={"/homepacs/viewloan-branch-shg"}>View Loan</Link>,
					// children: [
					// 	{
					// 		key: "sub4-4-1",
					// 		icon: <CheckCircleOutlined />,
					// 		label: <Link to={"/homepacs/viewloan-branch-society"}>Society</Link>,
					// 	},
					// 	{
					// 		key: "sub4-4-1",
					// 		icon: <CheckCircleOutlined />,
					// 		label: <Link to={"/homepacs/viewloan-branch-shg"}>SHG</Link>,
					// 	},
					// ],
				},

			],
		},

		{
			key: "sub5",
			icon: <DatabaseOutlined />,
			label: "Re-Finace",
			children: [
				// {
				// 	key: "sub5-1",
				// 	icon: <CheckCircleOutlined />,
				// 	label: <Link to={"/homepacs/refinace"}>Disbursement Re-Finace</Link>,
				// 	// hidden: data?.approve_transaction == "Y" ? false : true,
				// },
				{
					key: "sub5-2",
					icon: <CheckCircleOutlined />,
					label: <Link to={"/homebm/branch_refinace-approve-list"}>Approve Re-Finace</Link>,
					// hidden: data?.approve_transaction == "Y" ? false : true,
				},

			],
		},

		{
			key: "sub6",
			icon: <ThunderboltOutlined />,
			label: "Deposit",
			children: [
				{
					key: "sub6-1",
					icon: <ThunderboltOutlined />,
					label: <Link to={"/homebm/deposit"}>Transaction</Link>,
				},
				{
					key: "sub6-2",
					icon: <ThunderboltOutlined />,
					label: <Link to={"/homebm/deposit-approve"}>Approve</Link>,
				},
				{
					key: "sub6-3",
					icon: <ThunderboltOutlined />,
					label: <Link to={"/homebm/view-sb-ledger"}>SB A/C Ledger</Link>,
				}
			],
		},


	]

	const items_bdccb_PACS = [
		{
			key: "sub1",
			icon: <LineChartOutlined />,
			label: <Link to={"/homebm/"}>Dashboard</Link>,
		},
		{
			key: "sub3",
			icon: <DeploymentUnitOutlined />,
			label: "Groups",
			children: [

				// {
				// 	key: "sub3-3",
				// 	icon: <PlusCircleOutlined />,
				// 	label: <Link to={"/homebm/editgroupform/0"}>Add Group</Link>,
				// },
				{
					key: "sub3-1",
					icon: <PlusCircleOutlined />,
					label: <Link to={"/homebm/addgroupform/0"}>Add Group</Link>,
				},
				{
					key: "sub3-2",
					icon: <FileSearchOutlined />,
					label: <Link to={"/homebm/searchgroup/"}>Edit Group</Link>,
				},
				{
					key: "sub3-3",
					icon: <PlusCircleOutlined />,
					label: <Link to={"/homebm/addmemberform/0"}>Add Member</Link>,
				},
				{
					key: "sub3-4",
					icon: <PlusCircleOutlined />,
					label: <Link to={"/homebm/searchmember"}>Edit Member</Link>,
				},
			],
		},

		{
			key: "sub4",
			icon: <ThunderboltOutlined />,
			label: "Loans",
			children: [
				// {
				// 	key: "sub4-2-2",
				// 	icon: <CheckCircleOutlined />,
				// 	label: <Link to={"/homepacs/viewloan"}>Accept Disbursement</Link>,
				// 	// hidden: data?.approve_transaction == "Y" ? false : true,
				// },
				{
					key: "sub4-1-3",
					icon: <CheckCircleOutlined />,
					label: <Link to={"/homepacs/viewloan"}>Accept Disbursement</Link>,
					// hidden: data?.approve_transaction == "Y" ? false : true,
				},
				// {
				// 	key: "sub4-1",
				// 	icon: <ThunderboltOutlined />,
				// 	label: <Link to={"/homepacs/loan-recovery"}>Recovery</Link>,
				// },
				// {
				// 	key: "sub4-1",
				// 	icon: <ThunderboltOutlined />,
				// 	label: <Link to={"/homepacs/recovery-shg-list"}>Recovery</Link>,
				// },
				{
					key: "sub4-5",
					icon: <ThunderboltOutlined />,
					label: <Link to={"/homepacs/recovery-shg-list"}>Recovery</Link>,
				},
				{
					key: "sub4-6",
					icon: <CheckCircleOutlined />,
					label: <Link to={"/homepacs/viewloan-recovery"}>Approve Recovery</Link>,
					// hidden: data?.approve_transaction == "Y" ? false : true,
				},
				{
					key: "sub4-7",
					icon: <CheckCircleOutlined />,
					label: <Link to={"/homepacs/viewloan-society"}>View Loan</Link>,
					// hidden: data?.approve_transaction == "Y" ? false : true,
				},
				// {
				// 	key: "sub4-2-5",
				// 	icon: <CheckCircleOutlined />,
				// 	label: <Link to={"/homepacs/refinace"}>Re-Finace</Link>,
				// 	// hidden: data?.approve_transaction == "Y" ? false : true,
				// },


			],
		},

		{
			key: "sub5",
			icon: <DatabaseOutlined />,
			label: "Re-Finace",
			children: [
				{
					key: "sub5-1",
					icon: <CheckCircleOutlined />,
					label: <Link to={"/homepacs/refinace"}>Disbursement Re-Finace</Link>,
					// hidden: data?.approve_transaction == "Y" ? false : true,
				},
				{
					key: "sub5-3",
					icon: <CheckCircleOutlined />,
					label: <Link to={"/homepacs/refinace-approve-list"}>Approve Re-Finace</Link>,
					// hidden: data?.approve_transaction == "Y" ? false : true,
				},
			],
		},

		// {
		// 					key: "sub_rep",
		// 					icon: <CheckCircleOutlined />,
		// 					label: "Report",
		// 					children: [
		// 						// {
		// 						// 	key: "sub4-2-1",
		// 						// 	icon: <CheckCircleOutlined />,
		// 						// 	label: <Link to={"/homebm/loan_branch_soi-recovery"}>Society</Link>,
		// 						// 	// hidden: data?.approve_transaction == "Y" ? false : true,
		// 						// },
		// 						// {
		// 						// 	key: "sub4-rep-1",
		// 						// 	icon: <CheckCircleOutlined />,
		// 						// 	label: <Link to={"/homebm/disbtosociety"}>Disbursement to Society</Link>,
		// 						// 	// hidden: data?.approve_transaction == "Y" ? false : true,
		// 						// },
		// 						// {
		// 						// 	key: "sub4-rep-3",
		// 						// 	icon: <CheckCircleOutlined />,
		// 						// 	label: <Link to={"/homebm/shgdisb"}>SHG Disbursement</Link>,
		// 						// 	// hidden: data?.approve_transaction == "Y" ? false : true,
		// 						// },
		// 						{
		// 							key: "sub4-rep-2",
		// 							icon: <CheckCircleOutlined />,
		// 							label: <Link to={"/homebm/disbofsociety"}>Disbursement of Society</Link>,
		// 							// hidden: data?.approve_transaction == "Y" ? false : true,
		// 						},
		// 					],
		// 				},
		// {
		// 	key: "sub6",
		// 	icon: <ThunderboltOutlined />,
		// 	label: "SB Transaction",
		// 	children: [
		// 		{
		// 			key: "sub6-1",
		// 			icon: <ThunderboltOutlined />,
		// 			label: <Link to={"/homebm/transaction"}>Transaction</Link>,
		// 		}
		// 	],
		// },
		{
			key: "sub6",
			icon: <ThunderboltOutlined />,
			label: "Deposit",
			children: [
				{
					key: "sub6-1",
					icon: <ThunderboltOutlined />,
					label: <Link to={"/homebm/deposit"}>Transaction</Link>,
				},
				{
					key: "sub6-2",
					icon: <ThunderboltOutlined />,
					label: <Link to={"/homebm/deposit-approve"}>Approve</Link>,
				},
				{
					key: "sub6-3",
					icon: <ThunderboltOutlined />,
					label: <Link to={"/homebm/view-sb-ledger"}>SB A/C Ledger</Link>,
				}
			],
		}
	]



	return (

		<div className="bg-slate-600 flex justify-between align-middle gap-4 rounded-full">
			{/* w-12 h-12 p-2 -mr-6 rounded-lg overflow-hidden */}
			{/* <img src={IMG} className="w-12 h-12 p-2 -mr-6 rounded-lg overflow-hidden" alt="Flowbite Logo" /> */}
			<img src={IMG} className="w-12 h-12 -mr-6" alt="Flowbite Logo" style={{
				display: 'flex',
				borderRadius: '60%', overflow: 'hidden'
			}} />


			{/* <Menu
			theme={theme}
			mode="horizontal"
			selectedKeys={[current]}
			onClick={onClick}
			items={items_user_type_4_100}
			className="rounded-full items-center justify-center"
			style={{
			width: 1000,
			backgroundColor: "transparent",
			border: "none",
			}}
			/> */}

			<Menu
				selectedKeys={[current]}
				// items={
				// 	userDetails[0]?.user_type === 'B'
				// 		? items_bdccb
				// 		: userDetails[0]?.user_type === 'P'
				// 		? items_bdccb_PACS
				// 		: userDetails[0]?.user_type === 'H'
				// 		? userDetails[0]?.branch_type === 'P'
				// 		? items_bdccb_PACS
				// 		: items_bdccb
				// 		: items_bdccb
				// 	}
				items={menuItems}
				mode="horizontal"
				style={{
					width: 1000,
					backgroundColor: "transparent",
					border: "none",
				}}
				className="rounded-full items-center justify-center"
			/>

			<div className="flex">
				<Tooltip title="Profile" placement="bottom">
					<button
						onClick={() => setVisibleModal2(!visibleModal2)}
						className="w-9 h-9 bg-[#DA4167] text-slate-50 flex self-center justify-center items-center rounded-full mr-1"
					>
						<UserOutlined className="text-slate-50 text-lg self-center" />
					</button>
				</Tooltip>
				<Tooltip title="Log Out" placement="bottom">
					<button
						onClick={() => setVisibleModal(!visibleModal)}
						className="w-9 h-9 bg-teal-500 flex self-center justify-center items-center rounded-full mr-2"
					>
						<LogoutOutlined className="text-slate-50 text-lg self-center" />
					</button>
				</Tooltip>
			</div>
			<DialogBox
				flag={1}
				onPress={() => setVisibleModal(!visibleModal)}
				visible={visibleModal}
			/>
			<DialogBox
				flag={2}
				onPress={() => setVisibleModal2(!visibleModal2)}
				visible={visibleModal2}
			/>
		</div>

	)
}

export default MenusBr
